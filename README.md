# Mercive Julefrokost

The quiz for the Mercive Christmas lunch. Everyone opens it on their phone and
signs in with a one-time code sent to their Mercive email. Three hosts steer
it; every other phone follows along live.

- Next.js 16 (App Router), self-hosted with Coolify as one Docker container.
- Sign-in works like the Anla back in stock dashboard: a code by email through
  Mailgun, and signed cookies instead of a user database (`lib/auth.ts`).
- The shared game (current slide, unwrapped answers, score, stopwatch) lives in
  the server's memory and a small file: `/app/data` in the container, `.data/`
  locally (`lib/quiz-state.ts`).
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

## Deploy (Coolify)

The app runs as one container built from `Dockerfile`: Next.js's standalone
server on port 3000, as an unprivileged user. It lives in Coolify under
Mercive Internal > production, on `mercive-server`, at
https://christmas-lunch-2026.mercive.com.

1. **New Resource > Application** from the private GitHub repository
   `Mercive-Agency/christmas-lunch`, branch `main`, on `mercive-server`.
2. **Build pack:** Dockerfile. **Port:** 3000.
3. **Domain:** `https://christmas-lunch-2026.mercive.com`. Its DNS record must
   point at the server; Coolify then issues the HTTPS certificate. HTTPS is
   required: the sign-in cookies are `Secure` in production.
4. **Environment variables:** `AUTH_SECRET`, `MAILGUN_API_KEY`,
   `MAILGUN_DOMAIN`, `MAILGUN_API_BASE` (see `.env.example`). `DATA_DIR` is
   already set by the Dockerfile.
5. **Persistent storage:** a volume mounted at `/app/data`, so the game
   (slide, unwrapped answers, score) survives a redeploy.
6. Deploy. Before the lunch, a host opens the points panel or the scoreboard
   slide and taps "Reset the game" so everyone starts from a clean game.

Run only one instance: the game and the sign-in limits are local to the
container. No Redis is needed here. (On a serverless host such as Vercel the
game would instead need Upstash Redis: set `KV_REST_API_URL` and
`KV_REST_API_TOKEN`.)

`prototype/index.html` is the first single-file version, kept for reference.
It is not part of the app.
