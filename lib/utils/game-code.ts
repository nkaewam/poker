import { db } from "@/lib/db";
import { games } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Generate a random 5-character game code (case-insensitive)
 */
function generateRandomCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
  }
  return code;
}

/**
 * Generate a unique game code that doesn't exist in the database
 */
export async function generateUniqueGameCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    const code = generateRandomCode();

    // Check if code exists (case-insensitive)
    const existing = await db
      .select()
      .from(games)
      .where(sql`UPPER(${games.gameCode}) = UPPER(${code})`)
      .limit(1);

    if (existing.length === 0) {
      return code;
    }

    attempts++;
  }

  throw new Error("Failed to generate unique game code after multiple attempts");
}

