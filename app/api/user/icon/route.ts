import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/better-auth";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCached, deleteCache } from "@/lib/cache/utils";

const iconPreferencesSchema = z.object({
  patternType: z.enum(["grid", "dots", "lines", "shapes"]).optional(),
  borderShape: z
    .enum(["wavy", "zigzag", "scalloped", "spiked", "rounded", "smooth"])
    .optional(),
  iconSeed: z.string().optional(),
  iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export async function GET() {
  try {
    const headers = await import("next/headers").then((m) => m.headers());
    const session = await auth.api.getSession({
      headers: headers as unknown as Headers,
    });

    if (!session?.user) {
      return NextResponse.json({
        patternType: null,
        borderShape: null,
        iconSeed: null,
        iconColor: null,
      });
    }

    const cacheKey = `user:${session.user.id}:icon`;

    // Get icon preferences from cache or database
    const preferences = await getCached(
      cacheKey,
      5 * 60, // 5 minute TTL
      async () => {
        const userData = await db.query.user.findFirst({
          where: eq(user.id, session.user.id),
          columns: {
            iconPatternType: true,
            iconBorderShape: true,
            iconSeed: true,
            iconColor: true,
          },
        });
        return {
          patternType: userData?.iconPatternType || null,
          borderShape: userData?.iconBorderShape || null,
          iconSeed: userData?.iconSeed || null,
          iconColor: userData?.iconColor || null,
        };
      }
    );

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("Error getting icon preferences:", error);
    return NextResponse.json({
      patternType: null,
      borderShape: null,
      iconSeed: null,
      iconColor: null,
    });
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
    const validated = iconPreferencesSchema.parse(body);

    // Update user icon preferences
    await db
      .update(user)
      .set({
        iconPatternType: validated.patternType || null,
        iconBorderShape: validated.borderShape || null,
        iconSeed: validated.iconSeed || null,
        iconColor: validated.iconColor || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id));

    // Invalidate cache
    const cacheKey = `user:${session.user.id}:icon`;
    await deleteCache(cacheKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error },
        { status: 400 }
      );
    }
    console.error("Error updating icon preferences:", error);
    return NextResponse.json(
      { error: "Failed to update icon preferences" },
      { status: 500 }
    );
  }
}
