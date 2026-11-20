import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

// Next.js 16 renamed the `middleware` file convention to `proxy`. Everything
// except the sign-in page needs a session, so nobody sees the quiz, its state
// or the photos without signing in with an allowed email.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/login") return NextResponse.next();

  if (verifySession(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  // Only page loads are sent to the sign-in page. API calls and Server
  // Function calls are refused here and never reach the app.
  if (pathname.startsWith("/api/") || (request.method !== "GET" && request.method !== "HEAD")) {
    return new NextResponse(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  // Skip only build assets, the icons, the logo and sound of the sign-in page,
  // robots.txt (which tells search engines to stay away) and /health.
  matcher: ["/((?!_next/|favicon\\.ico$|icon\\.svg$|apple-icon\\.png$|img/mercive-logo\\.svg$|audio/|robots\\.txt$|health$).*)"],
};
