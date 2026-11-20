export const dynamic = "force-dynamic";

/** For the container health check and uptime monitoring. Public, says nothing about the quiz. */
export function GET() {
  return new Response("ok", { headers: { "Cache-Control": "no-store" } });
}
