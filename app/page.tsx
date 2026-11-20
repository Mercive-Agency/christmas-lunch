import { redirect } from "next/navigation";
import { isMaster } from "@/lib/auth";
import { currentSession } from "@/lib/session";
import Quiz from "./Quiz";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await currentSession();
  if (!session) redirect("/login");
  return <Quiz master={isMaster(session.email)} />;
}
