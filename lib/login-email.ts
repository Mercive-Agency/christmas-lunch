import { CODE_MAX_AGE_S, formatCode } from "./auth";

// The sign-in email, styled like the sign-in page: the Mercive design rules'
// gate card (logo, one heading, one sentence) on the soft background. Mail
// clients ignore <style> and web fonts unevenly, so everything is inline and
// the type falls back to the system sans-serif, as the rules allow.

export const LOGO_CID = "mercive-logo.png";

// Single quotes: this goes inside style="..." attributes.
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const INK = "#1d1d1d";
const MUTED = "#616161";
const SOFT = "#f6f6f6";
const LINE = "#e1e1e1";

export interface LoginEmail {
  subject: string;
  text: string;
  html: string;
}

export function loginEmail(code: string): LoginEmail {
  const shown = formatCode(code);
  const minutes = Math.round(CODE_MAX_AGE_S / 60);
  const lead = "Use this code to sign in to the Mercive julefrokost.";
  const expiry = `The code works for ${minutes} minutes.`;
  const ignore = "If you did not ask for a code, you can ignore this email.";

  const text = [
    "Your sign-in code",
    "",
    lead,
    "",
    shown,
    "",
    expiry,
    "",
    ignore,
    "",
    "Mercive",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Your sign-in code</title>
</head>
<body style="margin:0;padding:0;background:${SOFT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(expiry)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${SOFT};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:440px;background:#ffffff;border:1px solid ${LINE};border-radius:4px;">
        <tr>
          <td style="padding:36px 32px;font-family:${FONT};color:${INK};">
            <img src="cid:${LOGO_CID}" width="105" height="23" alt="Mercive" style="display:block;width:105px;height:23px;border:0;">
            <h1 style="margin:28px 0 0;font-family:${FONT};font-size:26px;font-weight:500;line-height:1.2;letter-spacing:-0.015em;color:${INK};">Your sign-in code</h1>
            <p style="margin:10px 0 0;font-size:15px;font-weight:300;line-height:1.5;color:${MUTED};">${escapeHtml(lead)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;">
              <tr>
                <td align="center" style="padding:18px 12px;background:${SOFT};border-radius:4px;font-family:${FONT};font-size:30px;font-weight:500;letter-spacing:0.12em;color:${INK};font-variant-numeric:tabular-nums;">${escapeHtml(shown)}</td>
              </tr>
            </table>
            <p style="margin:12px 0 0;font-size:13px;font-weight:300;line-height:1.5;color:${MUTED};">${escapeHtml(expiry)}</p>
            <p style="margin:28px 0 0;padding-top:20px;border-top:1px solid ${LINE};font-size:13px;font-weight:300;line-height:1.5;color:${MUTED};">${escapeHtml(ignore)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return { subject: `${shown} is your sign-in code`, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
