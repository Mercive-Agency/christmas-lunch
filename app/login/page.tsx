import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  CHALLENGE_COOKIE,
  CODE_MAX_AGE_S,
  DEV_CODE_COOKIE,
  SESSION_COOKIE,
  isLocalWithoutMail,
  readChallenge,
  verifySession,
} from "@/lib/auth";
import { requestCode, resendCode, startOver, verifyCode } from "./actions";
import { CodeStep, EmailStep } from "./LoginForms";
import { Rudolf, Scene } from "./Scene";

export const metadata: Metadata = { title: "Sign in · Mercive Julefrokost" };

// Step one asks for an email, step two for the code; which one shows depends
// on whether a live code is pending in the cookie.
export default async function LoginPage() {
  const jar = await cookies();
  if (verifySession(jar.get(SESSION_COOKIE)?.value)) redirect("/");

  const pending = readChallenge(jar.get(CHALLENGE_COOKIE)?.value);
  const devCode = pending && isLocalWithoutMail() ? jar.get(DEV_CODE_COOKIE)?.value : undefined;

  return (
    <main className="gate">
      <Scene splash={!pending} />
      <div className="gate-card">
        <span className="logo" role="img" aria-label="Mercive" />
        <Rudolf />
        <p className="eyebrow">Christmas lunch 2026</p>
        {devCode && (
          <p className="success" role="status">
            Local test: no email is sent on this machine. Your code is {devCode}
          </p>
        )}
        {pending ? (
          <CodeStep
            email={pending.email}
            minutes={Math.round(CODE_MAX_AGE_S / 60)}
            verify={verifyCode}
            resend={resendCode}
            startOver={startOver}
          />
        ) : (
          <EmailStep request={requestCode} />
        )}
      </div>
    </main>
  );
}
