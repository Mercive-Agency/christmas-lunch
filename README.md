# Mercive Julefrokost

The quiz for the Mercive Christmas lunch. Everyone opens it on their phone and
signs in with a one-time code sent to their Mercive email. Three hosts steer
it; every other phone follows along live.

- Next.js 16 (App Router), built for Vercel.
- Sign-in works like the Anla back in stock dashboard: a code by email through
  Mailgun, and signed cookies instead of a user database (`lib/auth.ts`).
- The shared game (current slide, unwrapped answers, score, stopwatch) lives in
  Upstash Redis on Vercel and in `.data/` locally (`lib/quiz-state.ts`).
- Phones poll `/api/state` once a second. Hosts post their actions to it.

## Who can do what

| | Guests (any allowed email) | Hosts |
| --- | --- | --- |
| See the slides | Yes, the one the hosts are on | Yes |
| Change slide, unwrap answers, score, stopwatch | No | Yes |
| See an answer or photo | Only after a host unwraps it | Only after a host unwraps it |

Hosts are `tobias.bech@mercive.com`, `martin.krogh@mercive.com` and
`clara.lund@mercive.com` (override with `MASTER_EMAILS`). Anyone with an email
on `LOGIN_DOMAINS` (default `mercive.com`) can sign in as a guest.

The answers are in `lib/quiz-answers.ts` and the photos in `private/photos/`.
Neither is sent to a browser before a host unwraps it. The questions and
slides are in `app/quiz-client.js`.

## Run it locally

```
npm install
npm run dev
```

Open http://localhost:3000 (use `localhost`, not `127.0.0.1`, or the dev
server blocks the page's scripts). `.env.local` needs `AUTH_SECRET`; see
`.env.example`. Without the Mailgun variables, the sign-in code is printed in
the terminal that runs `npm run dev` instead of being emailed.

## Deploy to Vercel

1. Import the project in Vercel.
2. Add Upstash Redis from the Vercel Marketplace and connect it to the
   project. It sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
3. Add `AUTH_SECRET`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN` and
   `MAILGUN_API_BASE` under Environment Variables (see `.env.example`).
4. Deploy. Before the lunch, a host opens the scoreboard slide and taps
   "Reset the game" so everyone starts from a clean game.

Without the Redis variables the hosts' actions would not reach the other
phones on Vercel, because serverless functions share no memory.

`prototype/index.html` is the first single-file version, kept for reference.
It is not part of the app.
