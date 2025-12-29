import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to auth routes, onboarding, API routes, and static files
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/user/nickname") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp)$/)
  ) {
    return NextResponse.next();
  }

  // Check for better-auth session cookie
  // If user has a session cookie but is not on onboarding, check if they need onboarding
  const sessionCookie = getSessionCookie(request);
  
  if (sessionCookie && pathname !== "/onboarding") {
    // Check if user needs onboarding by calling the API
    // This is optimistic - actual validation happens server-side
    try {
      const response = await fetch(
        new URL("/api/user/nickname", request.url),
        {
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // If user is authenticated but has no nickname, redirect to onboarding
        if (!data.nickname) {
          return NextResponse.redirect(new URL("/onboarding", request.url));
        }
      }
    } catch (error) {
      // If check fails, allow request to proceed
      console.error("Error checking onboarding status:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
