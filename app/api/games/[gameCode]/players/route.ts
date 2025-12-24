import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, players } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { getOrCreateSession } from "@/lib/auth";
import {
  gameCodeSchema,
  addPlayerRequestSchema,
  playerResponseSchema,
} from "@/lib/api/schemas";
import { createGameLog } from "@/lib/db/logging";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameCode: string }> }
) {
  try {
    const { gameCode } = await params;
    const validatedGameCode = gameCodeSchema.parse(gameCode);
    const body = await request.json();
    const validated = addPlayerRequestSchema.parse(body);

    // Get or create session
    const session = await getOrCreateSession();

    // Find game by code (case-insensitive)
    const game = await db.query.games.findFirst({
      where: sql`UPPER(${games.gameCode}) = UPPER(${validatedGameCode})`,
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Check if player already exists for this session and game (rejoin scenario)
    // Only reuse existing player if the name matches (true rejoin)
    // If name is different, create a new player (adding a different player)
    const existingPlayer = await db.query.players.findFirst({
      where: and(
        eq(players.gameId, game.id),
        eq(players.sessionId, session.id)
      ),
    });

    // If player exists with the same name, return it (reuse existing player on rejoin)
    if (existingPlayer && existingPlayer.name === validated.name) {
      return NextResponse.json(
        playerResponseSchema.parse({
          id: existingPlayer.id,
          gameId: existingPlayer.gameId,
          sessionId: existingPlayer.sessionId,
          name: existingPlayer.name,
          createdAt: existingPlayer.createdAt.toISOString(),
        })
      );
    }

    // If existing player has different name, create a new player instead of updating
    // This allows adding multiple players from the same session
    // (The existing player can update their name via the update endpoint if needed)

    // Create new player if none exists
    const [player] = await db
      .insert(players)
      .values({
        gameId: game.id,
        sessionId: session.id,
        name: validated.name,
      })
      .returning();

    // Log player addition (fire-and-forget)
    createGameLog({
      gameId: game.id,
      action: "player_added",
      playerId: player.id,
      actorSessionId: session.id,
      actorPlayerId: player.id,
      metadata: {
        playerName: validated.name,
      },
    });

    return NextResponse.json(
      playerResponseSchema.parse({
        id: player.id,
        gameId: player.gameId,
        sessionId: player.sessionId,
        name: player.name,
        createdAt: player.createdAt.toISOString(),
      })
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }
    console.error("Error adding player:", error);
    return NextResponse.json(
      { error: "Failed to add player" },
      { status: 500 }
    );
  }
}
