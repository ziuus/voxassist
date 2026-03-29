"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReportViewer from "@/components/ReportViewer";
import { Recording } from "@/lib/types";

type ProcessingStep = "transcribe" | "report";

export default function RecordingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [recording, setRecording] = useState<Recording | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingStep, setProcessingStep] = useState<ProcessingStep | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"transcript" | "report">(
    "transcript"
  );
  const [deleting, setDeleting] = useState(false);

  const fetchRecording = useCallback(async () => {
    const res = await fetch(`/api/recordings/${id}`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = (await res.json()) as Recording;
    setRecording(data);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchRecording();
  }, [fetchRecording]);

  // Prefer SSE for live status updates while long-running jobs are active.
  useEffect(() => {
    if (
      !recording ||
      !["transcribing", "generating_report"].includes(recording.status)
    )
      return;

    let fallbackInterval: ReturnType<typeof setInterval> | null = null;
    const stream = new EventSource(`/api/recordings/${id}/events`);

    stream.addEventListener("recording", (event) => {
      try {
        const latest = JSON.parse((event as MessageEvent).data) as Recording;
        setRecording(latest);
      } catch {
        // Ignore malformed stream chunks.
      }
    });

    stream.addEventListener("complete", () => {
      stream.close();
      fetchRecording();
    });

    stream.addEventListener("error", () => {
      stream.close();
      if (!fallbackInterval) {
        fallbackInterval = setInterval(fetchRecording, 3000);
      }
    });

    return () => {
      stream.close();
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [id, recording, fetchRecording]);

  const handleTranscribe = async () => {
    if (!recording) return;
    setError(null);
    setProcessingStep("transcribe");

    const res = await fetch(`/api/recordings/${id}/transcribe`, {
      method: "POST",
    });
    const data = (await res.json()) as Recording & { error?: string };
    setProcessingStep(null);

    if (!res.ok) {
      setError(data.error ?? "Transcription failed");
    } else {
      setRecording(data);
      setActiveTab("transcript");
    }
  };

  const handleGenerateReport = async () => {
    if (!recording) return;
    setError(null);
    setProcessingStep("report");

    const res = await fetch(`/api/recordings/${id}/report`, {
      method: "POST",
    });
    const data = (await res.json()) as Recording & { error?: string };
    setProcessingStep(null);

    if (!res.ok) {
      setError(data.error ?? "Report generation failed");
    } else {
      setRecording(data);
      setActiveTab("report");
    }
  };

  const handleRetry = async () => {
    if (!recording) return;
    setError(null);

    const retryStep: ProcessingStep =
      !recording.transcript && (recording.audioFileName || recording.audioStorageKey)
        ? "transcribe"
        : "report";

    setProcessingStep(retryStep);

    const res = await fetch(`/api/recordings/${id}/retry`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ step: retryStep }),
    });

    const data = (await res.json()) as Recording & { error?: string };
    setProcessingStep(null);

    if (!res.ok) {
      setError(data.error ?? "Retry failed");
      return;
    }

    setRecording(data);
    setActiveTab(retryStep === "transcribe" ? "transcript" : "report");
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this recording?")) return;
    setDeleting(true);
    await fetch(`/api/recordings/${id}`, { method: "DELETE" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    );
  }

  if (!recording) return null;

  const canTranscribe = recording.audioFileName && recording.status === "pending";
  const canGenerateReport =
    recording.transcript &&
    ["transcribed", "completed"].includes(recording.status);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass rounded-3xl border border-white/70 p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-4">
          <Link
            href="/"
            className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-600 shadow-soft transition hover:text-slate-900"
          >
            Back
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-teal-600">
              Recording overview
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 truncate">
              {recording.title}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              {recording.patientName && (
                <span>Patient: {recording.patientName}</span>
              )}
              {recording.doctorName && (
                <span>Doctor: Dr. {recording.doctorName}</span>
              )}
              <span>
                {new Date(recording.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-sm font-semibold text-red-500 shadow-soft transition hover:bg-red-50"
            title="Delete recording"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Error alert */}
      {(error ?? recording.errorMessage) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? recording.errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleTranscribe}
          disabled={!canTranscribe || processingStep !== null}
          className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500"
        >
          {processingStep === "transcribe" ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Transcribing…
            </>
          ) : (
            <>Transcribe audio</>
          )}
        </button>

        <button
          onClick={handleGenerateReport}
          disabled={!canGenerateReport || processingStep !== null}
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500"
        >
          {processingStep === "report" ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Generating…
            </>
          ) : (
            <>Generate report</>
          )}
        </button>

        {recording.status === "error" && (
          <button
            onClick={handleRetry}
            disabled={processingStep !== null}
            className="flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-rose-700 disabled:bg-slate-300 disabled:text-slate-500"
          >
            {processingStep !== null ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Retrying…
              </>
            ) : (
              <>Retry failed step</>
            )}
          </button>
        )}
      </div>

      {recording.audioFileName && (
        <div className="glass rounded-3xl border border-white/70 p-5">
          <h3 className="text-base font-semibold text-slate-900">Audio replay</h3>
          <p className="mt-1 text-sm text-slate-500">
            Listen to the original patient conversation recording.
          </p>
          <audio
            className="mt-4 w-full"
            controls
            preload="metadata"
            src={recording.audioPlaybackUrl ?? `/api/recordings/${id}/audio`}
          >
            Your browser does not support audio playback.
          </audio>
        </div>
      )}

      {/* Status indicator */}
      {["transcribing", "generating_report"].includes(recording.status) && (
        <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-700">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full" />
          {recording.status === "transcribing"
            ? "Transcription in progress…"
            : "Generating medical report…"}
        </div>
      )}

      {/* Tabs */}
      {(recording.transcript || recording.report) && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 rounded-full bg-white/80 p-1 shadow-soft">
            {(["transcript", "report"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab === "transcript" ? "Transcript" : "Medical report"}
              </button>
            ))}
          </div>

          <div>
            {activeTab === "transcript" && recording.transcript && (
              <div className="glass rounded-3xl border border-white/70 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Conversation transcript
                </h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {recording.transcript}
                </p>
              </div>
            )}

            {activeTab === "report" && recording.report && (
              <ReportViewer report={recording.report} />
            )}

            {activeTab === "transcript" && !recording.transcript && (
              <div className="text-center py-12 text-slate-400">
                <p>No transcript yet. Click Transcribe audio to begin.</p>
              </div>
            )}

            {activeTab === "report" && !recording.report && (
              <div className="text-center py-12 text-slate-400">
                <p>
                  No report yet. Transcribe the audio first, then click Generate
                  report.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No content yet */}
      {!recording.transcript && !recording.report && (
        <div className="glass rounded-3xl border border-white/70 p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          {recording.audioFileName ? (
            <>
              <p className="text-slate-700 font-semibold">
                Audio saved. Ready to transcribe.
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Click Transcribe audio above to convert the conversation to
                text.
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-700 font-semibold">No audio attached</p>
              <p className="text-sm text-slate-500 mt-1">
                This recording has no audio file associated with it.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
