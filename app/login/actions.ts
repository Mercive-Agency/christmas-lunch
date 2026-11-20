"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  CHALLENGE_COOKIE,
  CODE_MAX_AGE_S,
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
  checkCode,
  createChallenge,
  createSession,
  DEV_CODE_COOKIE,
  formatCode,
  isEmailAllowed,
  isLocalWithoutMail,
  normalizeCode,
  normalizeEmail,
  readChallenge,
} from "@/lib/auth";
import { loginEmail } from "@/lib/login-email";
import { sendEmail } from "@/lib/mailgun";
import { allow, block, isBlocked } from "@/lib/rate-limit";
import { cookieOptions } from "@/lib/session";

export interface LoginState {
  error?: string;
  notice?: string;
  /** The email as typed, so the field keeps it after an error. */
  email?: string;
}

const MINUTE = 60_000;
const MAX_CODE_ATTEMPTS = 5;

/** "Send code": sends a code to the email and moves the page on to the code step. */
export async function requestCode(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const typed = String(formData.get("email") ?? "");
  const email = normalizeEmail(typed);
  if (!email) return { error: "Enter a valid email address.", email: typed };

  const result = await issueCode(email);
  if (result.error) return { ...result, email: typed };
  redirect("/login");
}

/** "Send a new code": a fresh code to the email already entered. */
export async function resendCode(): Promise<LoginState> {
  const pending = readChallenge((await cookies()).get(CHALLENGE_COOKIE)?.value);
  if (!pending) redirect("/login");

  const result = await issueCode(pending.email);
  return result.error ? result : { notice: "We sent a new code." };
}

/**
 * Makes a code and remembers it in a cookie. The email goes out only when the
 * email's domain is allowed, but the person sees the same next step either
 * way, so the page never reveals who has access.
 */
async function issueCode(email: string): Promise<LoginState> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(`send:ip:${ip}`, 60, 60 * MINUTE) || !allow(`send:${email}`, 5, 15 * MINUTE)) {
    return { error: "Too many codes sent. Wait 15 minutes and try again." };
  }

  const challenge = createChallenge(email);
  if (!challenge) {
    console.error("[auth] AUTH_SECRET is missing or shorter than 32 characters");
    return { error: "Sign-in is not set up yet. Ask Clara." };
  }

  if (isEmailAllowed(email)) {
    try {
      await sendEmail(email, loginEmail(challenge.code));
    } catch (error) {
      console.error("[auth] login email failed", {
        reason: error instanceof Error ? `${error.name}: ${error.message}` : "unknown",
      });
      return { error: "The email could not be sent. Try again in a moment." };
    }
  }

  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, challenge.token, cookieOptions(CODE_MAX_AGE_S));
  // Local development without Mailgun: no email goes out, so the sign-in page
  // shows the code instead. Never in production.
  if (isLocalWithoutMail()) jar.set(DEV_CODE_COOKIE, formatCode(challenge.code), cookieOptions(CODE_MAX_AGE_S));
  return {};
}

/** "Sign in": checks the code and starts a session. */
export async function verifyCode(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const input = formData.get("code");
  if (!normalizeCode(input)) return { error: "Enter the code from the email." };

  const jar = await cookies();
  const token = jar.get(CHALLENGE_COOKIE)?.value;
  const pending = readChallenge(token);
  if (pending && isBlocked(`code:${pending.nonce}`, MAX_CODE_ATTEMPTS)) {
    return { error: "Too many wrong attempts. Send a new code." };
  }

  const result = checkCode(token, input);
  if (!result.ok) {
    if (result.reason === "expired") return { error: "The code has expired. Send a new code." };
    allow(`code:${result.nonce}`, MAX_CODE_ATTEMPTS, CODE_MAX_AGE_S * 1000);
    return { error: "That code does not match. Check the email and try again." };
  }

  const session = createSession(result.email);
  if (!session || !isEmailAllowed(result.email)) {
    return { error: "That code does not match. Check the email and try again." };
  }

  if (pending) block(`code:${pending.nonce}`, CODE_MAX_AGE_S * 1000);
  jar.set(CHALLENGE_COOKIE, "", cookieOptions(0));
  jar.set(DEV_CODE_COOKIE, "", cookieOptions(0));
  jar.set(SESSION_COOKIE, session, cookieOptions(SESSION_MAX_AGE_S));
  redirect("/");
}

/** "Use another email": back to the first step. */
export async function startOver(): Promise<void> {
  (await cookies()).set(CHALLENGE_COOKIE, "", cookieOptions(0));
  redirect("/login");
}
