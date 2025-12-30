import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, players } from "@/lib/db/schema";
import { getOrCreateSession } from "@/lib/auth";
import { createGameRequestSchema, gameResponseSchema } from "@/lib/api/schemas";
import { generateUniqueGameCode } from "@/lib/utils/game-code";
import { createGameLog } from "@/lib/db/logging";
import { setCache } from "@/lib/cache/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createGameRequestSchema.parse(body);

    // Get or create session
    const session = await getOrCreateSession();

    // Generate unique game code
    const gameCode = await generateUniqueGameCode();

    // Create game and first player in a transaction
    const [game] = await db
      .insert(games)
      .values({
        gameCode,
        buyInAmount: validated.buyInAmount.toString(),
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

    // Transform to response format
    const response = {
      id: gameData.id,
      gameCode: gameData.gameCode,
      buyInAmount: gameData.buyInAmount,
      createdAt: gameData.createdAt.toISOString(),
      players: gameData.players.map((p) => ({
        id: p.id,
        gameId: p.gameId,
        sessionId: p.sessionId,
        name: p.name,
        createdAt: p.createdAt.toISOString(),
      })),
      buyIns: gameData.players.flatMap((p) =>
        (p.buyIns || []).map((bi) => ({
          id: bi.id,
          playerId: bi.playerId,
          amount: bi.amount,
          createdAt: bi.createdAt.toISOString(),
        }))
      ),
      finals: gameData.players
        .filter((p) => p.final)
        .map((p) => ({
          id: p.final!.id,
          playerId: p.final!.playerId,
          amount: p.final!.amount,
          createdAt: p.final!.createdAt.toISOString(),
        })),
    };

    const validatedResponse = gameResponseSchema.parse(response);

    // Warm the cache with the newly created game data
    const cacheKey = `game:${gameCode.toUpperCase()}`;
    await setCache(cacheKey, gameData, 2); // 2 second TTL

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
