import { NextResponse } from "next/server";
import { getOrCreateSession, getSessionFromCookie } from "@/lib/auth";
import { sessionResponseSchema } from "@/lib/api/schemas";

export async function GET() {
  try {
    const session = await getOrCreateSession();
    
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
    const session = await getOrCreateSession();
    
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

