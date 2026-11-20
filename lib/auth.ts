import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// Sign-in with a one-time code sent by email, the same way as the Anla
// dashboard. There is no user database: the pending code and the session live
// in cookies signed with AUTH_SECRET. The cookie never holds the code itself,
// only an HMAC of it.
//
// Used by proxy.ts as well as by pages and Server Functions, so this file
// must not import anything request-bound (next/headers).

export const CHALLENGE_COOKIE = "jul_login";
export const SESSION_COOKIE = "jul_session";
/** Local development only: carries the code to the sign-in page when no email can be sent. */
export const DEV_CODE_COOKIE = "jul_dev_code";

/** True on a developer's machine with no Mailgun set up, where codes cannot be emailed. */
export function isLocalWithoutMail(): boolean {
  return process.env.NODE_ENV !== "production" && !(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
}
export const SESSION_MAX_AGE_S = 14 * 24 * 60 * 60;
export const CODE_MAX_AGE_S = 10 * 60;

// 8 characters from 32 (no 0/O or 1/I): about 10^12 combinations.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

const DEFAULT_DOMAINS = "mercive.com";
const DEFAULT_MASTERS = "tobias.bech@mercive.com,martin.krogh@mercive.com,clara.lund@mercive.com";

export interface Session {
  email: string;
  /** Expiry, ms since epoch. */
  exp: number;
}

interface Challenge {
  email: string;
  exp: number;
  /** Identifies this code for the attempt limit. */
  nonce: string;
  /** HMAC of the code; see codeMac. */
  mac: string;
}

export type CodeCheck =
  | { ok: true; email: string }
  | { ok: false; reason: "expired" | "wrong"; nonce?: string };

/** The signing key, or null when AUTH_SECRET is missing or too short to be safe. */
function authSecret(): string | null {
  const value = process.env.AUTH_SECRET;
  return value && value.length >= 32 ? value : null;
}

// --- Tokens: base64url(JSON) "." base64url(HMAC(purpose "." payload)) ---
// The purpose is part of the MAC so a challenge can never pass as a session.

function mac(key: string, text: string): Buffer {
  return createHmac("sha256", key).update(text).digest();
}

function sign(purpose: string, data: object, key: string): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${mac(key, `${purpose}.${payload}`).toString("base64url")}`;
}

function unsign<T>(purpose: string, token: string | undefined, key: string): T | null {
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = mac(key, `${purpose}.${payload}`);
  const given = Buffer.from(signature, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

// --- Emails, domains and hosts ---

/** Lowercased and trimmed, or null if it does not look like an email address. */
export function normalizeEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

function list(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

/** True when the email's domain is exactly one of the allowed domains. */
export function isEmailAllowed(email: string): boolean {
  const domain = email.slice(email.lastIndexOf("@") + 1);
  return list(process.env.LOGIN_DOMAINS || DEFAULT_DOMAINS).includes(domain);
}

/** True for the hosts, who steer the slides, unwrap answers and keep score. */
export function isMaster(email: string): boolean {
  return list(process.env.MASTER_EMAILS || DEFAULT_MASTERS).includes(email.toLowerCase());
}

// --- Codes ---

export function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  return code;
}

/** "K7PM2QX9" → "K7PM-2QX9", for reading in the email. */
export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** What the person typed, uppercased, with spaces and hyphens removed. */
export function normalizeCode(input: unknown): string {
  return typeof input === "string" ? input.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
}

function codeMac(key: string, nonce: string, code: string): string {
  return mac(key, `code.${nonce}.${code}`).toString("base64url");
}

// --- Challenge: the pending code, between "Send code" and "Sign in" ---

/**
 * A new code and the cookie value that remembers it. Made for every request,
 * also for emails without access, so the response is the same either way.
 * Only the caller decides whether to send the code.
 */
export function createChallenge(email: string, now = Date.now()): { code: string; token: string } | null {
  const key = authSecret();
  if (!key) return null;

  const code = generateCode();
  const nonce = randomBytes(12).toString("base64url");
  const challenge: Challenge = { email, exp: now + CODE_MAX_AGE_S * 1000, nonce, mac: codeMac(key, nonce, code) };
  return { code, token: sign("challenge", challenge, key) };
}

/** The pending email, if the cookie holds a live code. */
export function readChallenge(token: string | undefined, now = Date.now()) {
  const key = authSecret();
  if (!key) return null;
  const challenge = unsign<Challenge>("challenge", token, key);
  if (!challenge || challenge.exp <= now) return null;
  return { email: challenge.email, nonce: challenge.nonce };
}

export function checkCode(token: string | undefined, input: unknown, now = Date.now()): CodeCheck {
  const key = authSecret();
  if (!key) return { ok: false, reason: "expired" };
  const challenge = unsign<Challenge>("challenge", token, key);
  if (!challenge || challenge.exp <= now) return { ok: false, reason: "expired" };

  const expected = Buffer.from(challenge.mac, "base64url");
  const given = Buffer.from(codeMac(key, challenge.nonce, normalizeCode(input)), "base64url");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return { ok: false, reason: "wrong", nonce: challenge.nonce };
  }
  return { ok: true, email: challenge.email };
}

// --- Session ---

export function createSession(email: string, now = Date.now()): string | null {
  const key = authSecret();
  if (!key) return null;
  const session: Session = { email, exp: now + SESSION_MAX_AGE_S * 1000 };
  return sign("session", session, key);
}

/**
 * The signed-in person, or null. Fails closed: a missing AUTH_SECRET, an
 * expired session, or an email whose domain is no longer allowed are refused.
 */
export function verifySession(token: string | undefined, now = Date.now()): Session | null {
  const key = authSecret();
  if (!key) return null;
  const session = unsign<Session>("session", token, key);
  if (!session || session.exp <= now || !isEmailAllowed(session.email)) return null;
  return session;
}
