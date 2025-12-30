import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, session } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCached } from "@/lib/cache/utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json({
        patternType: null,
        borderShape: null,
        iconSeed: null,
        iconColor: null,
      });
    }

    const cacheKey = `session:${sessionId}:icon`;

    // Get icon preferences from cache or database
    const preferences = await getCached(
      cacheKey,
      5 * 60, // 5 minute TTL
      async () => {
        // Get session to find userId
        const sessionData = await db.query.session.findFirst({
          where: eq(session.id, sessionId),
          columns: {
            userId: true,
          },
        });

        if (!sessionData?.userId) {
          return {
            patternType: null,
            borderShape: null,
            iconSeed: null,
            iconColor: null,
          };
        }

        // Get user icon preferences
        const userData = await db.query.user.findFirst({
          where: eq(user.id, sessionData.userId),
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
    console.error("Error getting icon preferences by sessionId:", error);
    return NextResponse.json({
      patternType: null,
      borderShape: null,
      iconSeed: null,
      iconColor: null,
    });
  }
}
