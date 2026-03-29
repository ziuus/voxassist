import { getAllRecordings } from "@/lib/storage";
import DashboardClient from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const recordings = await getAllRecordings();
  return <DashboardClient recordings={recordings} />;
}
