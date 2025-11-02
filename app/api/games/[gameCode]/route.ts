import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { gameCodeSchema, gameResponseSchema } from "@/lib/api/schemas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameCode: string }> }
) {
  try {
    const { gameCode } = await params;
    const validatedGameCode = gameCodeSchema.parse(gameCode);

    // Find game by code (case-insensitive)
    const gameData = await db.query.games.findFirst({
      where: sql`UPPER(${games.gameCode}) = UPPER(${validatedGameCode})`,
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
        { error: "Game not found" },
        { status: 404 }
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
    console.error("Error getting game:", error);
    return NextResponse.json(
      { error: "Failed to get game" },
      { status: 500 }
    );
  }
}

