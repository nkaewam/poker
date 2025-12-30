import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/better-auth";
import { updateUserNickname, getOrCreateSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, session, players, games } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getCached, deleteCache, invalidateGameCache } from "@/lib/cache/utils";
import { createGameLog } from "@/lib/db/logging";

const updateNicknameSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname is required")
    .max(50, "Nickname must be less than 50 characters")
    .trim(),
});

export async function GET() {
  try {
    const headers = await import("next/headers").then((m) => m.headers());
    const session = await auth.api.getSession({
      headers: headers as unknown as Headers,
    });

    if (!session?.user) {
      return NextResponse.json({ nickname: null });
    }

    const cacheKey = `user:${session.user.id}:nickname`;

    // Get nickname from cache or database
    const nickname = await getCached(
      cacheKey,
      5 * 60, // 5 minute TTL
      async () => {
        const userData = await db.query.user.findFirst({
          where: eq(user.id, session.user.id),
          columns: {
            nickname: true,
          },
        });
        return userData?.nickname || null;
      }
    );

    return NextResponse.json({ nickname });
  } catch (error) {
    console.error("Error getting nickname:", error);
    return NextResponse.json({ nickname: null });
  }
}

export async function POST(request: Request) {
  try {
    const headers = await import("next/headers").then((m) => m.headers());
    const authSession = await auth.api.getSession({
      headers: headers as unknown as Headers,
    });

    if (!authSession?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateNicknameSchema.parse(body);

    // Get old nickname before updating
    const oldNickname = await db.query.user.findFirst({
      where: eq(user.id, authSession.user.id),
      columns: { nickname: true },
    });

    // Update nickname
    await updateUserNickname(authSession.user.id, validated.nickname);

    // Invalidate nickname cache
    const cacheKey = `user:${authSession.user.id}:nickname`;
    await deleteCache(cacheKey);

    // Find all players for this user by joining with sessions
    // This finds players from any session belonging to the user (current or past)
    const userPlayersFromSessions = await db
      .select({
        id: players.id,
        name: players.name,
        gameId: players.gameId,
        sessionId: players.sessionId,
      })
      .from(players)
      .innerJoin(session, eq(players.sessionId, session.id))
      .where(eq(session.userId, authSession.user.id));

    // Also find players from the current session (handles guest sessions that later authenticated)
    // Get current session ID (works for both authenticated and anonymous sessions)
    const currentSession = await getOrCreateSession();

    const currentSessionPlayers = await db
      .select({
        id: players.id,
        name: players.name,
        gameId: players.gameId,
        sessionId: players.sessionId,
      })
      .from(players)
      .where(eq(players.sessionId, currentSession.id));

    // Combine and deduplicate by player ID
    const allPlayersMap = new Map<
      string,
      (typeof userPlayersFromSessions)[0]
    >();
    [...userPlayersFromSessions, ...currentSessionPlayers].forEach((p) => {
      allPlayersMap.set(p.id, p);
    });
    const userPlayers = Array.from(allPlayersMap.values());

    if (userPlayers.length > 0) {
      // Get unique game IDs to invalidate caches
      const gameIds = [...new Set(userPlayers.map((p) => p.gameId))];
      const playerIds = userPlayers.map((p) => p.id);

      // Get game codes for cache invalidation
      const gameCodesData = await db
        .select({ id: games.id, gameCode: games.gameCode })
        .from(games)
        .where(inArray(games.id, gameIds));

      // Create a map of gameId -> gameCode for quick lookup
      const gameCodeMap = new Map(gameCodesData.map((g) => [g.id, g.gameCode]));

      // Update all player names to the new nickname (by player IDs)
      await db
        .update(players)
        .set({ name: validated.nickname })
        .where(inArray(players.id, playerIds));

      // Collect unique game codes for cache invalidation
      const uniqueGameCodes = new Set<string>();
      for (const player of userPlayers) {
        const gameCode = gameCodeMap.get(player.gameId);
        if (gameCode) {
          uniqueGameCodes.add(gameCode);
        }
      }

      // Invalidate all game caches (await to ensure completion)
      await Promise.all(
        Array.from(uniqueGameCodes).map((gameCode) =>
          invalidateGameCache(gameCode).catch((error) => {
            console.error(`Failed to invalidate cache for ${gameCode}:`, error);
          })
        )
      );

      // Create game logs (fire-and-forget)
      for (const player of userPlayers) {
        const gameCode = gameCodeMap.get(player.gameId);
        if (gameCode) {
          createGameLog({
            gameId: player.gameId,
            action: "player_name_updated",
            playerId: player.id,
            actorSessionId: player.sessionId,
            actorPlayerId: player.id,
            metadata: {
              oldName: oldNickname?.nickname || player.name,
              newName: validated.nickname,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }
    console.error("Error updating nickname:", error);
    return NextResponse.json(
      { error: "Failed to update nickname" },
      { status: 500 }
    );
  }
}
