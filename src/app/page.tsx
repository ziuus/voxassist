import Link from "next/link";
import { getAllRecordings } from "@/lib/storage";

export const dynamic = "force-dynamic";

const quickStats = ["Fast", "Private", "Accurate", "Review-first"];

export default async function LandingPage() {
  const recordings = await getAllRecordings();
  const today = recordings.length;
  const pending = recordings.filter((r) =>
    ["pending", "transcribing", "generating_report"].includes(r.status)
  ).length;
  const signed = recordings.filter((r) => r.status === "completed").length;

  const metricCards = [
    { label: "Today", value: today, width: today > 0 ? 82 : 6 },
    { label: "Pending", value: pending, width: pending > 0 ? 38 : 6 },
    { label: "Signed", value: signed, width: signed > 0 ? 74 : 6 },
  ];

  return (
    <div
      className="space-y-10 pb-8"
      style={{
        fontFamily:
          "ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/85 p-8 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)] backdrop-blur-2xl sm:p-12 lg:p-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-slate-300/35 blur-3xl" />
          <div className="absolute -bottom-28 right-10 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.8),rgba(255,255,255,0.55))]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-1.5 text-[11px] font-medium tracking-[0.2em] text-slate-500 uppercase">
            VoxAssist
          </p>
          <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-6xl lg:text-7xl">
            Clinical notes,
            <br className="hidden sm:block" />
            effortlessly.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-500 sm:text-base">
            Record. Review. Sign.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-full bg-slate-900 px-7 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Open Dashboard
            </Link>
            <Link
              href="/recordings/new"
              className="rounded-full border border-slate-300 bg-white px-7 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              New Recording
            </Link>
          </div>
        </div>

        <div className="relative z-10 mx-auto mt-12 max-w-5xl rounded-[2rem] border border-slate-200/80 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-6">
          <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
              </div>
              <div className="rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-500">
                AI Sync
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
              {metricCards.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
                    {item.value}
                  </p>
                  <div className="mt-3 h-1.5 rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-slate-900"
                      style={{ width: `${item.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-center gap-2 rounded-3xl border border-white/70 bg-white/70 p-5 backdrop-blur-xl">
        {quickStats.map((item) => (
          <span
            key={item}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600"
          >
            {item}
          </span>
        ))}
      </section>
    </div>
  );
}
