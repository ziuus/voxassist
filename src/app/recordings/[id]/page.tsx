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

  // Poll when processing
  useEffect(() => {
    if (
      !recording ||
      !["transcribing", "generating_report"].includes(recording.status)
    )
      return;
    const interval = setInterval(fetchRecording, 2000);
    return () => clearInterval(interval);
  }, [recording, fetchRecording]);

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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this recording?")) return;
    setDeleting(true);
    await fetch(`/api/recordings/${id}`, { method: "DELETE" });
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!recording) return null;

  const canTranscribe = recording.audioFileName && recording.status === "pending";
  const canGenerateReport =
    recording.transcript &&
    ["transcribed", "completed"].includes(recording.status);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/"
          className="mt-1 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 truncate">
            {recording.title}
          </h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            {recording.patientName && <span>Patient: {recording.patientName}</span>}
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
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete recording"
        >
          🗑
        </button>
      </div>

      {/* Error alert */}
      {(error ?? recording.errorMessage) && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error ?? recording.errorMessage}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleTranscribe}
          disabled={!canTranscribe || processingStep !== null}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-full transition-colors"
        >
          {processingStep === "transcribe" ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Transcribing…
            </>
          ) : (
            <>🎙 Transcribe Audio</>
          )}
        </button>

        <button
          onClick={handleGenerateReport}
          disabled={!canGenerateReport || processingStep !== null}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium rounded-full transition-colors"
        >
          {processingStep === "report" ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Generating…
            </>
          ) : (
            <>📋 Generate Report</>
          )}
        </button>
      </div>

      {/* Status indicator */}
      {["transcribing", "generating_report"].includes(recording.status) && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
          <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          {recording.status === "transcribing"
            ? "Transcription in progress…"
            : "Generating medical report…"}
        </div>
      )}

      {/* Tabs */}
      {(recording.transcript || recording.report) && (
        <div>
          <div className="flex gap-1 border-b border-gray-200">
            {(["transcript", "report"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "transcript" ? "📝 Transcript" : "📋 Medical Report"}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {activeTab === "transcript" && recording.transcript && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-800 mb-3">
                  Conversation Transcript
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {recording.transcript}
                </p>
              </div>
            )}

            {activeTab === "report" && recording.report && (
              <ReportViewer report={recording.report} />
            )}

            {activeTab === "transcript" && !recording.transcript && (
              <div className="text-center py-12 text-gray-400">
                <p>No transcript yet. Click &quot;Transcribe Audio&quot; to begin.</p>
              </div>
            )}

            {activeTab === "report" && !recording.report && (
              <div className="text-center py-12 text-gray-400">
                <p>
                  No report yet. Transcribe the audio first, then click
                  &quot;Generate Report&quot;.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No content yet */}
      {!recording.transcript && !recording.report && (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          {recording.audioFileName ? (
            <>
              <p className="text-gray-500 font-medium">
                Audio saved. Ready to transcribe.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Click &quot;Transcribe Audio&quot; above to convert the conversation to
                text.
              </p>
            </>
          ) : (
            <>
              <p className="text-gray-500 font-medium">No audio attached</p>
              <p className="text-sm text-gray-400 mt-1">
                This recording has no audio file associated with it.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
