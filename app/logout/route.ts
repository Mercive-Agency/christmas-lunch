import { NextResponse } from "next/server";
import { CHALLENGE_COOKIE, DEV_CODE_COOKIE, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Signs this browser out and shows the sign-in screen again. */
export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  for (const name of [SESSION_COOKIE, CHALLENGE_COOKIE, DEV_CODE_COOKIE]) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}
