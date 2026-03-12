"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AudioRecorder from "@/components/AudioRecorder";

type InputMethod = "record" | "upload";

export default function NewRecordingPage() {
  const router = useRouter();
  const [inputMethod, setInputMethod] = useState<InputMethod>("record");
  const [title, setTitle] = useState("");
  const [patientName, setPatientName] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRecordingComplete = useCallback((blob: Blob) => {
    setAudioBlob(blob);
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Recording</h1>
        <p className="text-gray-500 mt-1">
          Record a conversation or upload an existing audio file to generate a
          medical report.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Session Details */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Session Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recording Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Follow-up consultation – John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Patient Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Patient name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doctor Name
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Doctor name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </section>

        {/* Audio Input */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Audio Input</h2>

          {/* Tab toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["record", "upload"] as InputMethod[]).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => {
                  setInputMethod(method);
                  setAudioBlob(null);
                  setUploadedFile(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  inputMethod === method
                    ? "bg-white text-gray-900 shadow"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {method === "record" ? "🎙 Record" : "📁 Upload"}
              </button>
            ))}
          </div>

          {inputMethod === "record" ? (
            <div className="py-4">
              <AudioRecorder onRecordingComplete={handleRecordingComplete} />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Audio File
              </label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-1 text-xs text-gray-400">
                Supported formats: MP3, WAV, M4A, WEBM, OGG, FLAC (max 25MB)
              </p>
              {uploadedFile && (
                <p className="mt-2 text-sm text-green-600">
                  ✓ Selected: {uploadedFile.name} (
                  {(uploadedFile.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>
          )}
        </section>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition-colors"
          >
            {isSubmitting ? "Saving…" : "Save & Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}
