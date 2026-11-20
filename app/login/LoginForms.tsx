"use client";

import { useActionState, useState } from "react";
import type { LoginState } from "./actions";

type FormAction = (state: LoginState, formData: FormData) => Promise<LoginState>;

export function EmailStep({ request }: { request: FormAction }) {
  const [state, action, pending] = useActionState(request, {});

  return (
    <>
      <h1 className="glint">Sign in</h1>
      <p>We send a one-time code to your Mercive email.</p>
      <form action={action} className="gate-form">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" defaultValue={state.email} required autoFocus />
        </div>
        {state.error && (
          <p className="error" role="alert">
            {state.error}
          </p>
        )}
        <button type="submit" className="btn" disabled={pending}>
          {pending ? "Sending code" : "Send code"}
        </button>
      </form>
    </>
  );
}

export function CodeStep({
  email,
  minutes,
  verify,
  resend,
  startOver,
}: {
  email: string;
  minutes: number;
  verify: FormAction;
  resend: () => Promise<LoginState>;
  startOver: () => Promise<void>;
}) {
  const [verifyState, verifyAction, verifying] = useActionState(verify, {});
  const [resendState, resendAction, resending] = useActionState(resend, {});
  // Both forms report in the same place; show whichever was used last.
  const [last, setLast] = useState<"verify" | "resend">("verify");
  const message = last === "verify" ? verifyState : resendState;

  return (
    <>
      <h1 className="glint">Check your email</h1>
      <p>If {email} has access, we sent it a code.</p>
      <form action={verifyAction} onSubmit={() => setLast("verify")} className="gate-form">
        <div className="field">
          <label htmlFor="code">Code</label>
          <input
            id="code"
            name="code"
            type="text"
            className="code-input"
            autoComplete="one-time-code"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={12}
            required
            autoFocus
          />
          <p className="hint">The code works for {minutes} minutes.</p>
        </div>
        {message.error && (
          <p className="error" role="alert">
            {message.error}
          </p>
        )}
        {message.notice && (
          <p className="success" role="status">
            {message.notice}
          </p>
        )}
        <button type="submit" className="btn" disabled={verifying || resending}>
          {verifying ? "Signing in" : "Sign in"}
        </button>
      </form>
      <div className="gate-links">
        <form action={resendAction} onSubmit={() => setLast("resend")}>
          <button type="submit" className="link" disabled={verifying || resending}>
            Send a new code
          </button>
        </form>
        <form action={startOver}>
          <button type="submit" className="link" disabled={verifying || resending}>
            Use another email
          </button>
        </form>
      </div>
    </>
  );
}
