import Link from "next/link";
import { getAllRecordings } from "@/lib/storage";
import RecordingCard from "@/components/RecordingCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const recordings = getAllRecordings();

  const stats = {
    total: recordings.length,
    completed: recordings.filter((r) => r.status === "completed").length,
    transcribed: recordings.filter((r) => r.status === "transcribed").length,
    pending: recordings.filter((r) =>
      ["pending", "transcribing", "generating_report"].includes(r.status)
    ).length,
  };

  return (
    <div className="space-y-14">
      <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] items-start">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-700 shadow-soft">
            AI-Driven Clinical Notes
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-slate-900">
            A clinical intelligence layer that turns conversations into{" "}
            <span className="text-gradient">auditable reports</span>.
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">
            VoxAssist captures doctor-patient dialogues, secures the transcript,
            and assembles structured notes clinicians can sign with confidence.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/recordings/new"
              className="inline-flex items-center gap-3 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800"
            >
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
              Start a live recording
            </Link>
            <Link
              href="/recordings/new"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
            >
              Upload existing audio
            </Link>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-slate-500">
            <span>HIPAA-ready workflows</span>
            <span>Structured narrative + SOAP layouts</span>
            <span>Clinician review controls</span>
          </div>
        </div>

        <div className="glass rounded-3xl border border-white/70 p-6 sm:p-8 glow-ring">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                Today
              </p>
              <p className="text-2xl font-semibold text-slate-900">
                Signal board
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v9m0 0l3-3m-3 3l-3-3m8 6a5 5 0 11-10 0"
                />
              </svg>
            </div>
          </div>

          {recordings.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                {
                  label: "Total Sessions",
                  value: stats.total,
                  colorClass: "text-slate-900",
                },
                {
                  label: "Reports Signed",
                  value: stats.completed,
                  colorClass: "text-emerald-600",
                },
                {
                  label: "Transcripts Ready",
                  value: stats.transcribed,
                  colorClass: "text-blue-600",
                },
                {
                  label: "In Progress",
                  value: stats.pending,
                  colorClass: "text-amber-600",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-soft"
                >
                  <div className={`text-3xl font-semibold ${stat.colorClass}`}>
                    {stat.value}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-500">
              No recordings yet. Start your first session to see activity
              metrics.
            </div>
          )}

          <div className="mt-6 grid gap-3 rounded-2xl border border-slate-100 bg-white/90 p-4 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700">
                Risk review
              </span>
              <span className="text-emerald-600">Stable</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div className="h-1.5 w-3/4 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-blue-500" />
            </div>
            <p>
              All active notes mapped to policy, signatures pending from
              clinicians.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass rounded-3xl border border-white/70 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Recent recordings
              </h2>
              <p className="text-sm text-slate-500">
                Review conversations, transcripts, and clinician-ready reports.
              </p>
            </div>
            {recordings.length > 0 && (
              <Link
                href="/recordings/new"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800"
              >
                New recording
              </Link>
            )}
          </div>

          {recordings.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <svg
                  className="h-8 w-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                Start your first recording
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Capture a conversation and let VoxAssist generate the report.
              </p>
              <Link
                href="/recordings/new"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800"
              >
                Create a recording
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {recordings.map((recording) => (
                <RecordingCard key={recording.id} recording={recording} />
              ))}
            </div>
          )}
        </div>

        <div className="glass rounded-3xl border border-white/70 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            Clinical workflow
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-900">
            VoxAssist orchestrates every step.
          </h3>
          <div className="mt-6 space-y-4">
            {[
              {
                title: "Capture & consent",
                detail: "Secure intake prompts and consent reminders.",
              },
              {
                title: "Transcript + context",
                detail: "Speaker diarization with visit metadata.",
              },
              {
                title: "Report assembly",
                detail: "SOAP + ICD suggestions with audit trail.",
              },
              {
                title: "Clinician sign-off",
                detail: "Final review before EHR export.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-100 bg-white/85 p-4 shadow-soft"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>
                  <span className="text-xs text-emerald-600 font-semibold">
                    Active
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-slate-100 bg-white/90 p-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Confidence controls</p>
            <p className="mt-2">
              Every summary includes evidence references and clinician-approved
              edits.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
