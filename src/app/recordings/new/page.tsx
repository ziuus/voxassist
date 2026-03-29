"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AudioRecorder from "@/components/AudioRecorder";

type InputMethod = "record" | "upload";
type TranscriptionMode = "server" | "browser";

function getDefaultTranscriptionMode(): TranscriptionMode {
  const configured = process.env.NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_MODE;
  if (configured === "server" || configured === "browser") {
    return configured;
  }
  return "browser";
}

export default function NewRecordingPage() {
  const router = useRouter();
  const [inputMethod, setInputMethod] = useState<InputMethod>("record");
  const [title, setTitle] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [browserTranscript, setBrowserTranscript] = useState("");
  const [transcriptionMode, setTranscriptionMode] =
    useState<TranscriptionMode>(getDefaultTranscriptionMode());
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecordingComplete = useCallback((blob: Blob) => {
    setAudioBlob(blob);
  }, []);

  const handleTranscriptReady = useCallback((transcript: string) => {
    setBrowserTranscript(transcript);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setUploadedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const audioSource = inputMethod === "record" ? audioBlob : uploadedFile;

    if (!audioSource) {
      setError(
        inputMethod === "record"
          ? "Please record an audio first."
          : "Please select an audio file to upload."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title || "Untitled Recording");
      if (patientName) formData.append("patientName", patientName);
      if (doctorName) formData.append("doctorName", doctorName);
      if (transcriptionMode === "browser" && browserTranscript.trim()) {
        formData.append("transcript", browserTranscript.trim());
      }

      const fileName =
        inputMethod === "upload" && uploadedFile
          ? uploadedFile.name
          : "recording.webm";
      formData.append("audio", audioSource, fileName);

      const res = await fetch("/api/recordings", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Failed to create recording");
      }

      const recording = (await res.json()) as { id: string };
      router.push(`/recordings/${recording.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="glass rounded-3xl border border-white/70 p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-teal-600">
          New session
        </p>
        <h1 className="text-3xl sm:text-4xl font-semibold text-slate-900">
          Create a new recording
        </h1>
        <p className="text-slate-600 mt-2">
          Record a conversation or upload an existing audio file to generate a
          medical report.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="glass rounded-3xl border border-white/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Session details
            </h2>
            <span className="text-xs font-medium text-slate-400">
              Optional metadata
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Recording title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow-up consultation – John Doe"
              className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Patient name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Patient name"
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Doctor name
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Doctor name"
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          </div>
        </section>

        <section className="glass rounded-3xl border border-white/70 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Audio input</h2>
            <span className="text-xs text-slate-400">
              Max 25MB per file
            </span>
          </div>

          <div className="flex gap-2 rounded-full bg-white/80 p-1 shadow-soft">
            {(["record", "upload"] as InputMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setInputMethod(method);
                  setAudioBlob(null);
                  setUploadedFile(null);
                  setBrowserTranscript("");
                }}
                className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                  inputMethod === method
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {method === "record" ? "Record audio" : "Upload file"}
              </button>
            ))}
          </div>

          {inputMethod === "record" ? (
            <div className="space-y-4 py-4">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Transcription source
                </p>
                <div className="mt-2 flex gap-2 rounded-full bg-white p-1 shadow-soft">
                  {(["server", "browser"] as TranscriptionMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setTranscriptionMode(mode);
                        setBrowserTranscript("");
                      }}
                      className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
                        transcriptionMode === mode
                          ? "bg-slate-900 text-white shadow"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {mode === "server" ? "Server AI" : "Browser API"}
                    </button>
                  ))}
                </div>
              </div>

              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                enableBrowserTranscription={transcriptionMode === "browser"}
                onTranscriptReady={handleTranscriptReady}
              />

              {transcriptionMode === "browser" && (
                <p className="text-xs text-slate-500">
                  Browser speech recognition support varies by browser. If not
                  available, switch to Server AI mode.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Audio file
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
              />
              <p className="text-xs text-slate-400">
                Supported formats: MP3, WAV, M4A, WEBM, OGG, FLAC.
              </p>
              {uploadedFile && (
                <p className="text-sm text-emerald-600">
                  Selected: {uploadedFile.name} (
                  {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>
          )}
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800 disabled:bg-slate-400"
          >
            {isSubmitting ? "Saving…" : "Save & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
