import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, players } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { gameCodeSchema, updatePlayerRequestSchema, playerResponseSchema } from "@/lib/api/schemas";
import { z } from "zod";

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
    const validated = updatePlayerRequestSchema.parse(body);

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

    // Update player
    const [updatedPlayer] = await db
      .update(players)
      .set({ name: validated.name })
      .where(
        and(
          eq(players.id, validatedPlayerId),
          eq(players.gameId, game.id)
        )
      )
      .returning();

    if (!updatedPlayer) {
      return NextResponse.json(
        { error: "Player not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      playerResponseSchema.parse({
        id: updatedPlayer.id,
        gameId: updatedPlayer.gameId,
        sessionId: updatedPlayer.sessionId,
        name: updatedPlayer.name,
        createdAt: updatedPlayer.createdAt.toISOString(),
      })
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }
    console.error("Error updating player:", error);
    return NextResponse.json(
      { error: "Failed to update player" },
      { status: 500 }
    );
  }
}
