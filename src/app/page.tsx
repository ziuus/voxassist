import Link from "next/link";
import { getAllRecordings } from "@/lib/storage";
import LandingClient from "./LandingClient";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const recordings = await getAllRecordings();
  return <LandingClient recordings={recordings} />;
}
