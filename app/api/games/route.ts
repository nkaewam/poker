import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, players } from "@/lib/db/schema";
import { getOrCreateSession } from "@/lib/auth";
import { createGameRequestSchema, gameResponseSchema } from "@/lib/api/schemas";
import { generateUniqueGameCode } from "@/lib/utils/game-code";
import { createGameLog } from "@/lib/db/logging";
import { setCache } from "@/lib/cache/utils";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";

// New feature: get today's list of games
export async function GET(request: Request) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const todayGames = await db.query.games.findMany({
      where: and(
        gte(games.createdAt, new Date(today)),
        lt(
          games.createdAt,
          new Date(new Date(today).setDate(new Date(today).getDate() + 1))
        )
      ),
      orderBy: [desc(games.createdAt)],
    });
    return NextResponse.json(todayGames);
  } catch (error) {
    console.error("Error getting today's games:", error);
    return NextResponse.json(
      { error: "Failed to get today's games" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createGameRequestSchema.parse(body);

    // Get or create session
    const session = await getOrCreateSession();

    // Generate unique game code
    const gameCode = await generateUniqueGameCode();

    // Create game and first player in a transaction
    const settlementMode = validated.settlementMode || "PEER_TO_PEER";

    const [game] = await db
      .insert(games)
      .values({
        gameCode,
        buyInAmount: validated.buyInAmount.toString(),
        settlementMode,
        collectorPlayerId: null, // Will be set after player is created if needed
      })
      .returning();

    const [player] = await db
      .insert(players)
      .values({
        gameId: game.id,
        sessionId: session.id,
        name: validated.playerName,
      })
      .returning();

    // If collector mode and collectorPlayerId is provided, validate it's the created player
    // If collector mode but no collectorPlayerId, default to the creator
    let collectorPlayerId = validated.collectorPlayerId;
    if (settlementMode === "COLLECTOR") {
      if (collectorPlayerId && collectorPlayerId !== player.id) {
        return NextResponse.json(
          {
            error:
              "Collector player ID must be the game creator at creation time",
          },
          { status: 400 }
        );
      }
      // Default to creator if not specified
      collectorPlayerId = collectorPlayerId || player.id;

      // Update game with collector player ID
      await db
        .update(games)
        .set({ collectorPlayerId })
        .where(sql`${games.id} = ${game.id}`);
    }

    // Log game creation (fire-and-forget)
    createGameLog({
      gameId: game.id,
      action: "game_created",
      actorSessionId: session.id,
      actorPlayerId: player.id,
      metadata: {
        gameCode,
        initialPlayerName: validated.playerName,
      },
    });

    // Log initial player addition (fire-and-forget)
    createGameLog({
      gameId: game.id,
      action: "player_added",
      playerId: player.id,
      actorSessionId: session.id,
      actorPlayerId: player.id,
      metadata: {
        playerName: validated.playerName,
      },
    });

    // Fetch full game data with relations
    const gameData = await db.query.games.findFirst({
      where: (games, { eq }) => eq(games.id, game.id),
      with: {
        players: {
          with: {
            buyIns: true,
            final: true,
          },
        },
      },
    });

    if (!gameData) {
      return NextResponse.json(
        { error: "Failed to retrieve created game" },
        { status: 500 }
      );
    }

    // Fetch updated game data to get collectorPlayerId
    const updatedGameData = await db.query.games.findFirst({
      where: (games, { eq }) => eq(games.id, game.id),
      with: {
        players: {
          with: {
            buyIns: true,
            final: true,
          },
        },
      },
    });

    if (!updatedGameData) {
      return NextResponse.json(
        { error: "Failed to retrieve created game" },
        { status: 500 }
      );
    }

    // Transform to response format
    const response = {
      id: updatedGameData.id,
      gameCode: updatedGameData.gameCode,
      buyInAmount: updatedGameData.buyInAmount,
      settlementMode: updatedGameData.settlementMode,
      collectorPlayerId: updatedGameData.collectorPlayerId,
      createdAt: updatedGameData.createdAt.toISOString(),
      players: updatedGameData.players.map(
        (p: (typeof updatedGameData.players)[0]) => ({
          id: p.id,
          gameId: p.gameId,
          sessionId: p.sessionId,
          name: p.name,
          createdAt: p.createdAt.toISOString(),
        })
      ),
      buyIns: updatedGameData.players.flatMap(
        (p: (typeof updatedGameData.players)[0]) =>
          (p.buyIns || []).map((bi: (typeof p.buyIns)[0]) => ({
            id: bi.id,
            playerId: bi.playerId,
            amount: bi.amount,
            createdAt: bi.createdAt.toISOString(),
          }))
      ),
      finals: updatedGameData.players
        .filter((p: (typeof updatedGameData.players)[0]) => p.final)
        .map((p: (typeof updatedGameData.players)[0]) => ({
          id: p.final!.id,
          playerId: p.final!.playerId,
          amount: p.final!.amount,
          createdAt: p.final!.createdAt.toISOString(),
        })),
    };

    const validatedResponse = gameResponseSchema.parse(response);

    // Warm the cache with the newly created game data
    const cacheKey = `game:${gameCode.toUpperCase()}`;
    await setCache(cacheKey, updatedGameData, 2); // 2 second TTL

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error("Error creating game:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}
