"use client";

import { useRef, useState, useCallback } from "react";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

type RecordingState = "idle" | "recording" | "paused" | "stopped";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function AudioRecorder({
  onRecordingComplete,
}: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setAudioUrl(null);
    setDuration(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete(blob);
        // Stop all tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start(250);
      setState("recording");

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError(
        "Microphone access denied. Please allow microphone access to record."
      );
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    stopTimer();
    setState("stopped");
  }, [stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      stopTimer();
      setState("paused");
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setState("recording");
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
  }, []);

  const resetRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setState("idle");
    chunksRef.current = [];
  }, [audioUrl, stopTimer]);

  return (
    <div className="space-y-4">
      {/* Timer */}
      <div className="flex items-center justify-center">
        <div
          className={`text-4xl font-mono font-bold tabular-nums ${
            state === "recording" ? "text-red-600" : "text-gray-700"
          }`}
        >
          {formatDuration(duration)}
        </div>
        {state === "recording" && (
          <span className="ml-3 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {state === "idle" && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-full transition-colors shadow"
          >
            <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
            Start Recording
          </button>
        )}

        {state === "recording" && (
          <>
            <button
              onClick={pauseRecording}
              className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-full transition-colors"
            >
              ⏸ Pause
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-full transition-colors"
            >
              ⏹ Stop
            </button>
          </>
        )}

        {state === "paused" && (
          <>
            <button
              onClick={resumeRecording}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-colors"
            >
              ▶ Resume
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-full transition-colors"
            >
              ⏹ Stop
            </button>
          </>
        )}

        {state === "stopped" && (
          <button
            onClick={resetRecording}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
          >
            🔄 Record Again
          </button>
        )}
      </div>

      {/* Playback */}
      {audioUrl && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 mb-1 text-center">
            Preview your recording:
          </p>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-3">
          {error}
        </p>
      )}

      {state === "stopped" && !error && (
        <p className="text-sm text-green-600 text-center">
          ✓ Recording captured ({formatDuration(duration)})
        </p>
      )}
    </div>
  );
}
