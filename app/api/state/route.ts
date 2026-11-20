import { isMaster } from "@/lib/auth";
import { act, getState, view } from "@/lib/quiz-state";
import { currentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

const NO_STORE = { headers: { "Cache-Control": "no-store" } };

/** Every phone polls this. With `?v=` equal to the current version it gets a tiny "nothing new". */
export async function GET(request: Request) {
  if (!(await currentSession())) return new Response(null, { status: 401, ...NO_STORE });

  const state = await getState();
  const known = Number(new URL(request.url).searchParams.get("v"));
  if (known === state.v) return Response.json({ v: state.v, now: Date.now() }, NO_STORE);
  return Response.json(view(state), NO_STORE);
}

/** A host action: change slide, unwrap an answer, score, stopwatch. Hosts only. */
export async function POST(request: Request) {
  const session = await currentSession();
  if (!session) return new Response(null, { status: 401, ...NO_STORE });
  if (!isMaster(session.email)) return new Response(null, { status: 403, ...NO_STORE });

  let action: unknown = null;
  try {
    action = await request.json();
  } catch {
    return new Response(null, { status: 400, ...NO_STORE });
  }
  return Response.json(view(await act(action)), NO_STORE);
}
