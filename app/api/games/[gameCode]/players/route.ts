import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, players } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getOrCreateSession } from "@/lib/auth";
import { gameCodeSchema, addPlayerRequestSchema, playerResponseSchema } from "@/lib/api/schemas";

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
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }

    // Create player
    const [player] = await db
      .insert(players)
      .values({
        gameId: game.id,
        sessionId: session.id,
        name: validated.name,
      })
      .returning();

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

