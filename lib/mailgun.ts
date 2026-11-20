import "server-only";
import { LOGO_CID, type LoginEmail } from "./login-email";
import { MERCIVE_LOGO_PNG_BASE64 } from "./mail-logo";

export class MailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MailError";
  }
}

const DEFAULT_API_BASE = "https://api.eu.mailgun.net";

/**
 * Sends one email through Mailgun's messages API, with the Mercive logo
 * attached inline. Opens and clicks are not tracked.
 *
 * Without MAILGUN_API_KEY and MAILGUN_DOMAIN, local development prints the
 * email's text to the server console instead; in production it throws.
 */
export async function sendEmail(to: string, email: LoginEmail): Promise<void> {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;

  if (!apiKey || !domain) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mail] Mailgun is not set up. Email to ${to}:\n${email.text}`);
      return;
    }
    throw new MailError("MAILGUN_API_KEY or MAILGUN_DOMAIN is missing");
  }

  const base = (process.env.MAILGUN_API_BASE || DEFAULT_API_BASE).replace(/\/+$/, "");
  const from = process.env.MAIL_FROM || `Mercive <noreply@${domain}>`;

  const form = new FormData();
  form.set("from", from);
  form.set("to", to);
  form.set("subject", email.subject);
  form.set("text", email.text);
  form.set("html", email.html);
  form.set("o:tracking", "no");
  form.set("o:tracking-clicks", "no");
  form.set("o:tracking-opens", "no");
  form.set(
    "inline",
    new Blob([Buffer.from(MERCIVE_LOGO_PNG_BASE64, "base64")], { type: "image/png" }),
    LOGO_CID,
  );

  let response: Response;
  try {
    response = await fetch(`${base}/v3/${encodeURIComponent(domain)}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}` },
      body: form,
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    throw new MailError(`Mailgun request failed: ${error instanceof Error ? error.name : "unknown"}`);
  }

  if (!response.ok) {
    // The body names the problem (bad key, unverified domain) without any
    // personal data, so it is safe to log.
    const detail = (await response.text().catch(() => "")).slice(0, 200);
    throw new MailError(`Mailgun answered ${response.status}: ${detail}`);
  }
}
