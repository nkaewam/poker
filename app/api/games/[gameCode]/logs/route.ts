import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { games, gameLogs } from "@/lib/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { gameCodeSchema } from "@/lib/api/schemas";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameCode: string }> }
) {
  try {
    const { gameCode } = await params;
    const validatedGameCode = gameCodeSchema.parse(gameCode);

    // Verify game exists
    const game = await db.query.games.findFirst({
      where: sql`UPPER(${games.gameCode}) = UPPER(${validatedGameCode})`,
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Fetch logs with related data
    const logs = await db.query.gameLogs.findMany({
      where: eq(gameLogs.gameId, game.id),
      with: {
        player: {
          columns: {
            id: true,
            name: true,
            sessionId: true,
          },
        },
        actorSession: {
          columns: {
            id: true,
          },
        },
        actorPlayer: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [desc(gameLogs.createdAt)],
    });

    // Transform to response format
    const response = logs.map((log) => ({
      id: log.id,
      gameId: log.gameId,
      action: log.action,
      playerId: log.playerId,
      playerName: log.player?.name ?? null,
      playerSessionId: log.player?.sessionId ?? null,
      actorSessionId: log.actorSessionId,
      actorPlayerId: log.actorPlayerId,
      actorPlayerName: log.actorPlayer?.name ?? null,
      metadata: log.metadata,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }
    console.error("Error fetching game logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch game logs" },
      { status: 500 }
    );
  }
}

