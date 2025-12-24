import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, players, finals } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { gameCodeSchema, updateFinalRequestSchema, finalResponseSchema } from "@/lib/api/schemas";
import { z } from "zod";
import { getOrCreateSession } from "@/lib/auth";
import { createGameLog } from "@/lib/db/logging";

const playerIdSchema = z.string().uuid();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ gameCode: string; playerId: string }> }
) {
  try {
    const { gameCode, playerId } = await params;
    const validatedGameCode = gameCodeSchema.parse(gameCode);
    const validatedPlayerId = playerIdSchema.parse(playerId);
    const body = await request.json();
    const validated = updateFinalRequestSchema.parse(body);

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

    // Upsert final (insert or update)
    const existingFinal = await db.query.finals.findFirst({
      where: eq(finals.playerId, validatedPlayerId),
    });

    const oldAmount = existingFinal ? parseFloat(existingFinal.amount) : null;

    // Get session for logging
    const session = await getOrCreateSession();

    // Find the actor player (the player who belongs to the current session)
    const actorPlayer = await db.query.players.findFirst({
      where: and(
        eq(players.gameId, game.id),
        eq(players.sessionId, session.id)
      ),
    });

    let final;
    if (existingFinal) {
      [final] = await db
        .update(finals)
        .set({ amount: validated.amount.toString() })
        .where(eq(finals.playerId, validatedPlayerId))
        .returning();
    } else {
      [final] = await db
        .insert(finals)
        .values({
          playerId: validatedPlayerId,
          amount: validated.amount.toString(),
        })
        .returning();
    }

    // Log final update (fire-and-forget)
    createGameLog({
      gameId: game.id,
      action: "final_updated",
      playerId: validatedPlayerId,
      actorSessionId: session.id,
      actorPlayerId: actorPlayer?.id,
      metadata: {
        oldAmount,
        newAmount: validated.amount,
      },
    });

    return NextResponse.json(
      finalResponseSchema.parse({
        id: final.id,
        playerId: final.playerId,
        amount: final.amount,
        createdAt: final.createdAt.toISOString(),
      })
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }
    console.error("Error updating final:", error);
    return NextResponse.json(
      { error: "Failed to update final" },
      { status: 500 }
    );
  }
}

