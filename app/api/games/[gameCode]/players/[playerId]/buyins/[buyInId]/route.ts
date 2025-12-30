import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, players, buyIns } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { gameCodeSchema } from "@/lib/api/schemas";
import { z } from "zod";
import { getOrCreateSession } from "@/lib/auth";
import { createGameLog } from "@/lib/db/logging";
import { invalidateGameCache } from "@/lib/cache/utils";

const playerIdSchema = z.string().uuid();
const buyInIdSchema = z.string().uuid();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ gameCode: string; playerId: string; buyInId: string }> }
) {
  try {
    const { gameCode, playerId, buyInId } = await params;
    const validatedGameCode = gameCodeSchema.parse(gameCode);
    const validatedPlayerId = playerIdSchema.parse(playerId);
    const validatedBuyInId = buyInIdSchema.parse(buyInId);

    // Verify game exists
    const game = await db.query.games.findFirst({
      where: sql`UPPER(${games.gameCode}) = UPPER(${validatedGameCode})`,
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Verify player exists and belongs to game
    const player = await db.query.players.findFirst({
      where: and(
        eq(players.id, validatedPlayerId),
        eq(players.gameId, game.id)
      ),
    });

    if (!player) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    // Get buy-in before deletion for logging
    const buyInToDelete = await db.query.buyIns.findFirst({
      where: and(
        eq(buyIns.id, validatedBuyInId),
        eq(buyIns.playerId, validatedPlayerId)
      ),
    });

    if (!buyInToDelete) {
      return NextResponse.json(
        { error: "Buy-in not found" },
        { status: 404 }
      );
    }

    // Get session for logging
    const session = await getOrCreateSession();

    // Find the actor player (the player who belongs to the current session)
    const actorPlayer = await db.query.players.findFirst({
      where: and(
        eq(players.gameId, game.id),
        eq(players.sessionId, session.id)
      ),
    });

    // Delete buy-in
    const [deletedBuyIn] = await db
      .delete(buyIns)
      .where(
        and(
          eq(buyIns.id, validatedBuyInId),
          eq(buyIns.playerId, validatedPlayerId)
        )
      )
      .returning();

    // Log buy-in removal (fire-and-forget)
    createGameLog({
      gameId: game.id,
      action: "buyin_removed",
      playerId: validatedPlayerId,
      actorSessionId: session.id,
      actorPlayerId: actorPlayer?.id,
      metadata: {
        buyInId: validatedBuyInId,
        amount: parseFloat(deletedBuyIn.amount),
      },
    });

    // Invalidate game cache (fire-and-forget to avoid blocking response)
    invalidateGameCache(validatedGameCode).catch((error) => {
      console.error("Failed to invalidate cache:", error);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }
    console.error("Error deleting buy-in:", error);
    return NextResponse.json(
      { error: "Failed to delete buy-in" },
      { status: 500 }
    );
  }
}

