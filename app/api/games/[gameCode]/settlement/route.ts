import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, players } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getOrCreateSession } from "@/lib/auth";
import {
  gameCodeSchema,
  updateSettlementModeRequestSchema,
  gameResponseSchema,
} from "@/lib/api/schemas";
import { createGameLog } from "@/lib/db/logging";
import { invalidateGameCache } from "@/lib/cache/utils";

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameCode: string }> }
) {
  try {
    const { gameCode } = await params;
    const validatedGameCode = gameCodeSchema.parse(gameCode);
    const body = await request.json();
    const validated = updateSettlementModeRequestSchema.parse(body);

    // Get or create session
    const session = await getOrCreateSession();

    // Find game by code (case-insensitive)
    const game = await db.query.games.findFirst({
      where: sql`UPPER(${games.gameCode}) = UPPER(${validatedGameCode})`,
      with: {
        players: true,
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Validate collector player exists in game if mode is COLLECTOR
    if (validated.settlementMode === "COLLECTOR" && validated.collectorPlayerId) {
      const collectorExists = game.players.some(
        (p) => p.id === validated.collectorPlayerId
      );
      if (!collectorExists) {
        return NextResponse.json(
          { error: "Collector player not found in game" },
          { status: 400 }
        );
      }
    }

    // Update game settlement mode and collector
    const [updatedGame] = await db
      .update(games)
      .set({
        settlementMode: validated.settlementMode,
        collectorPlayerId:
          validated.settlementMode === "COLLECTOR"
            ? validated.collectorPlayerId || null
            : null,
      })
      .where(sql`UPPER(${games.gameCode}) = UPPER(${validatedGameCode})`)
      .returning();

    if (!updatedGame) {
      return NextResponse.json(
        { error: "Failed to update game" },
        { status: 500 }
      );
    }

    // Invalidate cache
    await invalidateGameCache(validatedGameCode);

    // Log settlement mode change
    const actorPlayer = game.players.find((p) => p.sessionId === session.id);
    createGameLog({
      gameId: game.id,
      action: "settlement_mode_updated",
      actorSessionId: session.id,
      actorPlayerId: actorPlayer?.id,
      metadata: {
        settlementMode: validated.settlementMode,
        collectorPlayerId: validated.collectorPlayerId,
        collectorPlayerName: validated.collectorPlayerId
          ? game.players.find((p) => p.id === validated.collectorPlayerId)?.name
          : null,
      },
    });

    // Fetch full game data with relations
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
        { error: "Failed to retrieve updated game" },
        { status: 500 }
      );
    }

    // Transform to response format
    const response = {
      id: gameData.id,
      gameCode: gameData.gameCode,
      buyInAmount: gameData.buyInAmount,
      settlementMode: gameData.settlementMode || "PEER_TO_PEER",
      collectorPlayerId: gameData.collectorPlayerId || null,
      createdAt: toISOString(gameData.createdAt),
      players: gameData.players.map((p: typeof gameData.players[0]) => ({
        id: p.id,
        gameId: p.gameId,
        sessionId: p.sessionId,
        name: p.name,
        createdAt: toISOString(p.createdAt),
      })),
      buyIns: gameData.players.flatMap((p: typeof gameData.players[0]) =>
        (p.buyIns || []).map((bi: typeof p.buyIns[0]) => ({
          id: bi.id,
          playerId: bi.playerId,
          amount: bi.amount,
          createdAt: toISOString(bi.createdAt),
        }))
      ),
      finals: gameData.players
        .filter((p: typeof gameData.players[0]) => p.final)
        .map((p: typeof gameData.players[0]) => ({
          id: p.final!.id,
          playerId: p.final!.playerId,
          amount: p.final!.amount,
          createdAt: toISOString(p.final!.createdAt),
        })),
    };

    return NextResponse.json(gameResponseSchema.parse(response));
  } catch (error) {
    console.error("Error updating settlement mode:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update settlement mode" },
      { status: 500 }
    );
  }
}
