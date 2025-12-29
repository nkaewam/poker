import { NextResponse } from "next/server";
import { getOrCreateSession } from "@/lib/auth";
import { auth } from "@/lib/auth/better-auth";
import { sessionResponseSchema } from "@/lib/api/schemas";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { session } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

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
    const session = await getSession();
    
    return NextResponse.json(
      sessionResponseSchema.parse({
        id: session.id,
        token: session.token,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
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
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
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

