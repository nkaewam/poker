import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSessionFromCookie } from "@/lib/auth";
import { z } from "zod";

const lastPlayerNameResponseSchema = z.object({
  name: z.string().nullable(),
});

export async function GET() {
  try {
    const session = await getSessionFromCookie();
    
    if (!session) {
      return NextResponse.json({ name: null });
    }

    // Find the most recent player with this sessionId
    const lastPlayers = await db
      .select({
        name: players.name,
      })
      .from(players)
      .where(eq(players.sessionId, session.id))
      .orderBy(desc(players.createdAt))
      .limit(1);

    const lastPlayer = lastPlayers[0] || null;

    return NextResponse.json(
      lastPlayerNameResponseSchema.parse({
        name: lastPlayer?.name || null,
      })
    );
  } catch (error) {
    console.error("Error getting last player name:", error);
    return NextResponse.json(
      { error: "Failed to get last player name" },
      { status: 500 }
    );
  }
}

