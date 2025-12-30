import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, players, buyIns } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import {
  gameCodeSchema,
  addBuyInRequestSchema,
  buyInResponseSchema,
} from "@/lib/api/schemas";
import { z } from "zod";
import { getOrCreateSession } from "@/lib/auth";
import { createGameLog } from "@/lib/db/logging";
import { invalidateGameCache } from "@/lib/cache/utils";

const playerIdSchema = z.string().uuid();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameCode: string; playerId: string }> }
) {
  try {
    const { gameCode, playerId } = await params;
    const validatedGameCode = gameCodeSchema.parse(gameCode);
    const validatedPlayerId = playerIdSchema.parse(playerId);
    const body = await request.json();
    const validated = addBuyInRequestSchema.parse(body);

    // Verify game exists
    const game = await db.query.games.findFirst({
      where: sql`UPPER(${games.gameCode}) = UPPER(${validatedGameCode})`,
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Verify player exists and belongs to game
    const player = await db.query.players.findFirst({
      where: and(
        eq(players.id, validatedPlayerId),
        eq(players.gameId, game.id)
      ),
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
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

    // Create buy-in
    const [buyIn] = await db
      .insert(buyIns)
      .values({
        playerId: validatedPlayerId,
        amount: validated.amount.toString(),
      })
      .returning();

    // Log buy-in addition (fire-and-forget)
    createGameLog({
      gameId: game.id,
      action: "buyin_added",
      playerId: validatedPlayerId,
      actorSessionId: session.id,
      actorPlayerId: actorPlayer?.id,
      metadata: {
        buyInId: buyIn.id,
        amount: validated.amount,
      },
    });

    // Invalidate game cache (fire-and-forget to avoid blocking response)
    invalidateGameCache(validatedGameCode).catch((error) => {
      console.error("Failed to invalidate cache:", error);
    });

    return NextResponse.json(
      buyInResponseSchema.parse({
        id: buyIn.id,
        playerId: buyIn.playerId,
        amount: buyIn.amount,
        createdAt: buyIn.createdAt.toISOString(),
      })
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }
    console.error("Error adding buy-in:", error);
    return NextResponse.json(
      { error: "Failed to add buy-in" },
      { status: 500 }
    );
  }
}
