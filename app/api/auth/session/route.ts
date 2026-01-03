import { NextResponse } from "next/server";
import { getOrCreateSession } from "@/lib/auth";
import { auth } from "@/lib/auth/better-auth";
import { sessionResponseSchema } from "@/lib/api/schemas";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { session } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { getCached } from "@/lib/cache/utils";
import { cookies } from "next/headers";

/**
 * Convert Date or string to ISO string
 * Handles both Date objects (from database) and strings (from cache)
 */
function toISOString(date: Date | string): string {
  if (typeof date === "string") {
    return date;
  }
  return date.toISOString();
}

/**
 * Get session - prefers better-auth session for signed-in users,
 * falls back to anonymous session
 */
async function getSession() {
  // First, try to get better-auth session for signed-in users
  try {
    const betterAuthResponse = await auth.api.getSession({
      headers: await headers(),
    });

    // Better-auth returns { user, session } or null
    if (betterAuthResponse?.session) {
      const sessionId = betterAuthResponse.session.id;

      console.log("sessionId", sessionId);

      // Query the database to get the full session record
      const sessionData = await db.query.session.findFirst({
        where: and(
          eq(session.id, sessionId),
          gt(session.expiresAt, new Date())
        ),
      });

      if (sessionData) {
        return {
          id: sessionData.id,
          token: sessionData.token,
          createdAt: sessionData.createdAt,
          expiresAt: sessionData.expiresAt,
        };
      }
    }
  } catch (error) {
    // If better-auth fails, fall back to anonymous session
    // Don't log errors for unauthenticated users (this is expected)
    if (error instanceof Error && !error.message.includes("Unauthorized")) {
      console.error("Error getting better-auth session:", error);
    }
  }

  // Fall back to anonymous session
  const anonymousSession = await getOrCreateSession();
  return {
    id: anonymousSession.id,
    token: anonymousSession.token,
    createdAt: anonymousSession.createdAt,
    expiresAt: anonymousSession.expiresAt,
  };
}

export async function GET() {
  try {
    // Try to get session token from cookie for cache key
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("poker_session")?.value;
    const cacheKey = sessionToken
      ? `session:${sessionToken}`
      : `session:anonymous:${Date.now()}`; // Fallback for new sessions

    // Get session from cache or database
    const sessionData = await getCached(cacheKey, 30, getSession);

    return NextResponse.json(
      sessionResponseSchema.parse({
        id: sessionData.id,
        token: sessionData.token,
        createdAt: toISOString(sessionData.createdAt),
        expiresAt: toISOString(sessionData.expiresAt),
      })
    );
  } catch (error) {
    console.error("Error getting/creating session:", error);
    return NextResponse.json(
      { error: "Failed to get or create session" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getSession();

    return NextResponse.json(
      sessionResponseSchema.parse({
        id: session.id,
        token: session.token,
        createdAt: toISOString(session.createdAt),
        expiresAt: toISOString(session.expiresAt),
      })
    );
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
