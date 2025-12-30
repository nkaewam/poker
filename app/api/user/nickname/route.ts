import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/better-auth";
import { updateUserNickname } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCached, deleteCache } from "@/lib/cache/utils";

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
    const session = await auth.api.getSession({
      headers: headers as unknown as Headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateNicknameSchema.parse(body);

    await updateUserNickname(session.user.id, validated.nickname);

    // Invalidate nickname cache
    const cacheKey = `user:${session.user.id}:nickname`;
    await deleteCache(cacheKey);

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
