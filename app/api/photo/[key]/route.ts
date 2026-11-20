import { readFile } from "node:fs/promises";
import path from "node:path";
import { getState, isPhotoRevealed } from "@/lib/quiz-state";
import { currentSession } from "@/lib/session";

export const dynamic = "force-dynamic";

/** A team photo, served only after a host has unwrapped the answer it belongs to. */
export async function GET(_request: Request, context: { params: Promise<{ key: string }> }) {
  if (!(await currentSession())) return new Response(null, { status: 401 });

  const { key } = await context.params;
  if (!/^[a-z]{2,20}$/.test(key) || !isPhotoRevealed(await getState(), key)) {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const file = await readFile(path.join(process.cwd(), "private", "photos", `${key}.jpg`));
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store" },
    });
  } catch {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
}
