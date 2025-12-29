import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes } from "crypto";
import { auth } from "./better-auth";

const SESSION_COOKIE_NAME = "poker_session";
const SESSION_DURATION_DAYS = 30;

/**
 * Generate a secure random token for session
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Get session from cookie if it exists and is valid
 */
export async function getSessionFromCookie() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionToken) {
    return null;
  }

  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.token, sessionToken),
      gt(sessions.expiresAt, new Date())
    ),
  });

  return session;
}

/**
 * Create a new session and set HTTP-only cookie
 */
export async function createSession() {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const [session] = await db
    .insert(sessions)
    .values({
      token,
      expiresAt,
    })
    .returning();

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return session;
}

/**
 * Get or create a session (used for anonymous users)
 */
export async function getOrCreateSession() {
  const existingSession = await getSessionFromCookie();
  if (existingSession) {
    return existingSession;
  }
  const newSession = await createSession();
  if (!newSession) {
    throw new Error("Failed to create session");
  }
  return newSession;
}

/**
 * Require a valid session, throw error if none exists
 */
export async function requireSession() {
  const session = await getOrCreateSession();
  if (!session) {
    throw new Error("Session required");
  }
  return session;
}

/**
 * Get the current authenticated user from better-auth session
 */
export async function getAuthenticatedUser() {
  try {
    const session = await auth.api.getSession({ headers: await import("next/headers").then(m => m.headers()) });
    if (!session?.user) {
      return null;
    }
    
    // Fetch full user data including nickname
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
    });
    
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user has completed onboarding (has a nickname)
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user?.nickname !== null && user?.nickname !== undefined && user.nickname.trim() !== "";
}

/**
 * Update user's nickname
 */
export async function updateUserNickname(userId: string, nickname: string) {
  const [updatedUser] = await db
    .update(users)
    .set({
      nickname: nickname.trim(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();
  
  return updatedUser;
}
