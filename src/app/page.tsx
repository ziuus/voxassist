import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllRecordings } from "@/lib/storage";
import LandingClient from "./LandingClient";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    const referer = headers().get("referer") ?? "";
    const cameFromLogin = referer.includes("/login");
    if (!referer || cameFromLogin) {
      redirect("/dashboard");
    }
  }
  const recordings = await getAllRecordings();
  return <LandingClient recordings={recordings} />;
}
