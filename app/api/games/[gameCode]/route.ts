import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { gameCodeSchema, gameResponseSchema } from "@/lib/api/schemas";
import { getCached } from "@/lib/cache/utils";

/**
 * Safely convert a date to ISO string format.
 * Handles both Date objects (from database) and strings (from cache).
 */
function toISOString(date: Date | string): string {
  if (typeof date === "string") {
    return date;
  }
  return date.toISOString();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameCode: string }> }
) {
  try {
    const { gameCode } = await params;
    const validatedGameCode = gameCodeSchema.parse(gameCode);
    const cacheKey = `game:${validatedGameCode.toUpperCase()}`;

    // Get game data from cache or database
    const gameData = await getCached(
      cacheKey,
      2, // 2 second TTL for game data
      async () => {
        return await db.query.games.findFirst({
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
      },
      {
        // Cache 404s with very short TTL (1 second) to handle race conditions
        cacheNotFound: true,
        notFoundTtl: 1,
      }
    );

    if (!gameData) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Transform to response format
    const response = {
      id: gameData.id,
      gameCode: gameData.gameCode,
      buyInAmount: gameData.buyInAmount,
      createdAt: toISOString(gameData.createdAt),
      players: gameData.players.map((p) => ({
        id: p.id,
        gameId: p.gameId,
        sessionId: p.sessionId,
        name: p.name,
        createdAt: toISOString(p.createdAt),
      })),
      buyIns: gameData.players.flatMap((p) =>
        (p.buyIns || []).map((bi) => ({
          id: bi.id,
          playerId: bi.playerId,
          amount: bi.amount,
          createdAt: toISOString(bi.createdAt),
        }))
      ),
      finals: gameData.players
        .filter((p) => p.final)
        .map((p) => ({
          id: p.final!.id,
          playerId: p.final!.playerId,
          amount: p.final!.amount,
          createdAt: toISOString(p.final!.createdAt),
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
    return NextResponse.json({ error: "Failed to get game" }, { status: 500 });
  }
}
