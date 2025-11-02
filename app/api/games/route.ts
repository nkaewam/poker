import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, players } from "@/lib/db/schema";
import { getOrCreateSession } from "@/lib/auth";
import { createGameRequestSchema, gameResponseSchema } from "@/lib/api/schemas";
import { generateUniqueGameCode } from "@/lib/utils/game-code";

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

    return NextResponse.json(gameResponseSchema.parse(response));
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }
    console.error("Error creating game:", error);
    return NextResponse.json(
      { error: "Failed to create game" },
      { status: 500 }
    );
  }
}

