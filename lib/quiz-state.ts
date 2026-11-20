import "server-only";
import fs from "node:fs";
import path from "node:path";
import { TEAMS } from "./teams";
import { ANSWERS, type Answer } from "./quiz-answers";

// The one shared game: which slide everyone is on, which answers are
// unwrapped, the score and the stopwatch. Hosts change it, every phone polls it.
//
// On Vercel it lives in Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN),
// because serverless functions share no memory. Locally, without those
// variables, it lives in memory and in .data/state.json.

export interface QuizState {
  /** Changes on every update; phones use it to tell whether to redraw. */
  v: number;
  slide: number;
  revealed: string[];
  scores: number[];
  winner: string | null;
  /** Stopwatch: running since t0 (server ms), plus time already banked. */
  sw: { on: boolean; t0: number; acc: number };
}

const KEY = "julefrokost:state";
const MAX_SLIDE = 60;

function fresh(): QuizState {
  return { v: Date.now(), slide: 0, revealed: [], scores: TEAMS.map(() => 0), winner: null, sw: { on: false, t0: 0, acc: 0 } };
}

function clean(raw: unknown): QuizState {
  const base = fresh();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<QuizState>;
  return {
    v: typeof r.v === "number" ? r.v : base.v,
    slide: Number.isInteger(r.slide) ? Math.min(MAX_SLIDE, Math.max(0, r.slide as number)) : 0,
    revealed: Array.isArray(r.revealed) ? r.revealed.filter((id) => typeof id === "string" && id in ANSWERS) : [],
    scores: TEAMS.map((_, i) => (Array.isArray(r.scores) && Number.isInteger(r.scores[i]) ? Math.max(0, r.scores[i]) : 0)),
    winner: typeof r.winner === "string" ? r.winner : null,
    sw: r.sw && typeof r.sw === "object"
      ? { on: !!r.sw.on, t0: Number(r.sw.t0) || 0, acc: Number(r.sw.acc) || 0 }
      : base.sw,
  };
}

// --- Storage ---

function redis(): { url: string; token: string } | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

async function redisCommand(command: string[]): Promise<unknown> {
  const store = redis()!;
  const response = await fetch(store.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${store.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Redis answered ${response.status}`);
  return ((await response.json()) as { result: unknown }).result;
}

const local = globalThis as unknown as {
  __julState?: QuizState;
  __julCache?: { at: number; state: QuizState };
};

function localFile(): string {
  return path.join(process.env.DATA_DIR || path.join(process.cwd(), ".data"), "state.json");
}

/** The current game. With Redis, each server instance reuses its answer for a moment to spare commands. */
export async function getState(): Promise<QuizState> {
  if (redis()) {
    const cached = local.__julCache;
    if (cached && Date.now() - cached.at < 400) return cached.state;
    const raw = await redisCommand(["GET", KEY]);
    const state = clean(typeof raw === "string" ? JSON.parse(raw) : null);
    local.__julCache = { at: Date.now(), state };
    return state;
  }

  if (!local.__julState) {
    let saved: unknown = null;
    try {
      saved = JSON.parse(fs.readFileSync(localFile(), "utf8"));
    } catch {
      // No saved game yet.
    }
    // A new version on every start, so open phones redraw after a restart.
    local.__julState = { ...clean(saved), v: Date.now() };
  }
  return local.__julState;
}

async function putState(state: QuizState): Promise<void> {
  if (redis()) {
    await redisCommand(["SET", KEY, JSON.stringify(state)]);
    local.__julCache = { at: Date.now(), state };
    return;
  }
  local.__julState = state;
  try {
    fs.mkdirSync(path.dirname(localFile()), { recursive: true });
    fs.writeFileSync(localFile(), JSON.stringify(state));
  } catch {
    // Memory still holds the game; only a restart would lose it.
  }
}

// --- What a host can do ---

/** Applies one host action and returns the new game. Unknown or malformed actions change nothing. */
export async function act(action: unknown): Promise<QuizState> {
  // Read past the short cache: an action must build on the latest game.
  local.__julCache = undefined;
  const state = structuredClone(await getState());
  const a = (action && typeof action === "object" ? action : {}) as Record<string, unknown>;
  const now = Date.now();

  switch (a.type) {
    case "slide":
      if (!Number.isInteger(a.slide) || (a.slide as number) < 0 || (a.slide as number) > MAX_SLIDE) return state;
      state.slide = a.slide as number;
      break;
    case "reveal": {
      if (typeof a.id !== "string" || !(a.id in ANSWERS)) return state;
      const shown = state.revealed.includes(a.id);
      const want = typeof a.on === "boolean" ? a.on : !shown;
      if (want === shown) return state;
      state.revealed = want ? [...state.revealed, a.id] : state.revealed.filter((id) => id !== a.id);
      break;
    }
    case "score": {
      const team = a.team as number;
      if (!Number.isInteger(team) || team < 0 || team >= TEAMS.length || (a.delta !== 1 && a.delta !== -1)) return state;
      state.scores[team] = Math.max(0, state.scores[team] + (a.delta as number));
      state.winner = null;
      break;
    }
    case "crown": {
      const max = Math.max(...state.scores);
      const top = TEAMS.filter((_, i) => state.scores[i] === max).map((team) => team[0]);
      state.winner = max === 0
        ? "No points yet."
        : top.length > 1
          ? `A tie between ${top.join(" and ")}. Sudden death!`
          : `${top[0]} wins. Glædelig jul!`;
      break;
    }
    case "sw":
      if (a.op === "reset") state.sw = { on: false, t0: 0, acc: 0 };
      else if (state.sw.on) state.sw = { on: false, t0: 0, acc: state.sw.acc + (now - state.sw.t0) };
      else state.sw = { on: true, t0: now, acc: state.sw.acc };
      break;
    case "reset":
      state.revealed = [];
      state.scores = TEAMS.map(() => 0);
      state.winner = null;
      state.sw = { on: false, t0: 0, acc: 0 };
      break;
    default:
      return state;
  }

  state.v = Math.max(now, state.v + 1);
  await putState(state);
  return state;
}

// --- What a phone gets ---

/** The game as sent to every phone, hosts included: only unwrapped answers go along. */
export function view(state: QuizState) {
  const answers: Record<string, Answer> = {};
  for (const id of state.revealed) answers[id] = ANSWERS[id];
  return { v: state.v, now: Date.now(), slide: state.slide, scores: state.scores, winner: state.winner, sw: state.sw, answers };
}

/** True once a host has unwrapped an answer that shows this photo. */
export function isPhotoRevealed(state: QuizState, photo: string): boolean {
  return state.revealed.some((id) => ANSWERS[id]?.people?.some((person) => person.photo === photo));
}
