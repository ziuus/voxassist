"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useGeminiLiveTranscription } from "@/lib/useGeminiLiveTranscription";

export type AudioTranscriptionMode = "gemini-live" | "browser" | "server" | "none";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  enableBrowserTranscription?: boolean;
  transcriptionMode?: AudioTranscriptionMode;
  onTranscriptReady?: (transcript: string) => void;
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
  enableBrowserTranscription = false,
  transcriptionMode = "gemini-live",
  onTranscriptReady,
}: AudioRecorderProps) {
  // Determine effective mode: default to gemini-live
  const effectiveMode: AudioTranscriptionMode = transcriptionMode ?? "gemini-live";

  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [completedTranscript, setCompletedTranscript] = useState<string>("");
  const [isProcessingChunk, setIsProcessingChunk] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const browserTranscriptRef = useRef<string>("");

  // Gemini Live transcription hook
  const geminiLive = useGeminiLiveTranscription({
    onFinalTranscript: (text) => {
      if (onTranscriptReady && text) {
        onTranscriptReady(text);
      }
    },
    onError: (err) => {
      // Non-fatal error notification
      console.warn("[GeminiLive] Warning/Error:", err);
    },
  });

  // Browser Web Speech API fallback hook
  const {
    transcript: browserTranscript,
    listening: browserListening,
    resetTranscript: resetBrowserTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  // Client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    browserTranscriptRef.current = browserTranscript;
  }, [browserTranscript]);

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
    setCompletedTranscript("");
    chunksRef.current = [];
    resetBrowserTranscript();
    geminiLive.reset();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Start live transcription if enabled
      if (effectiveMode === "gemini-live") {
        await geminiLive.start(stream);
      } else if (effectiveMode === "browser") {
        if (!browserSupportsSpeechRecognition) {
          setError("Browser doesn't support Web Speech API. Use Chrome or Gemini Live.");
          return;
        }
        SpeechRecognition.startListening({ continuous: true, language: "en-US" });
      }

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

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete(blob);

        if (effectiveMode === "gemini-live") {
          setIsProcessingChunk(true);
          // Allow short grace period (400ms) for trailing audio packets to complete
          await new Promise((resolve) => setTimeout(resolve, 400));
          let finalLive = geminiLive.stop();

          // Auto-fallback to Gemini audio model if live streaming didn't resolve text
          if (!finalLive && blob.size > 0) {
            try {
              const arrayBuffer = await blob.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              let binary = "";
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);

              const res = await fetch("/api/gemini/live-chunk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ audioBase64: base64, mimeType }),
              });
              if (res.ok) {
                const data = await res.json();
                if (data.text && !data.text.includes("[No audible speech")) {
                  finalLive = data.text;
                } else if (data.text) {
                  setCompletedTranscript(data.text);
                }
              }
            } catch (err) {
              console.warn("[AudioRecorder] Live-chunk fallback error:", err);
            }
          }

          if (finalLive) {
            setCompletedTranscript(finalLive);
            if (onTranscriptReady) {
              onTranscriptReady(finalLive);
            }
          }
          setIsProcessingChunk(false);
        } else if (effectiveMode === "browser") {
          SpeechRecognition.stopListening();
          const finalWebSpeech = browserTranscriptRef.current;
          if (finalWebSpeech) {
            setCompletedTranscript(finalWebSpeech);
            if (onTranscriptReady) {
              onTranscriptReady(finalWebSpeech);
            }
          }
        }

        // Clean up mic media tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      recorder.start(250);
      setState("recording");

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access to record.");
    }
  }, [
    effectiveMode,
    geminiLive,
    resetBrowserTranscript,
    browserSupportsSpeechRecognition,
    onRecordingComplete,
    onTranscriptReady,
  ]);

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
      if (effectiveMode === "browser" && browserListening) {
        SpeechRecognition.stopListening();
      }
      stopTimer();
      setState("paused");
    }
  }, [stopTimer, effectiveMode, browserListening]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      if (effectiveMode === "browser" && !browserListening) {
        SpeechRecognition.startListening({ continuous: true, language: "en-US" });
      }
      setState("recording");
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
  }, [effectiveMode, browserListening]);

  const resetRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    if (browserListening) {
      SpeechRecognition.stopListening();
    }
    geminiLive.reset();
    resetBrowserTranscript();

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setState("idle");
    chunksRef.current = [];
    setCompletedTranscript("");
  }, [audioUrl, stopTimer, browserListening, geminiLive, resetBrowserTranscript]);

  const activeTranscript =
    completedTranscript ||
    (effectiveMode === "gemini-live" ? geminiLive.transcript : browserTranscript);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-4">
        <div
          className={`rounded-3xl px-6 py-4 text-4xl font-semibold tabular-nums shadow-soft transition-colors ${
            state === "recording"
              ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50"
              : "bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200"
          }`}
        >
          {formatDuration(duration)}
        </div>
        {state === "recording" && (
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        {state === "idle" && (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-red-700 active:scale-95"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
            Start recording
          </button>
        )}

        {state === "recording" && (
          <>
            <button
              type="button"
              onClick={pauseRecording}
              className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600 active:scale-95"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 5h3v14H7zm7 0h3v14h-3z" />
              </svg>
              Pause
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-full bg-slate-800 dark:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 dark:hover:bg-slate-600 active:scale-95"
            >
              <span className="h-3 w-3 rounded-sm bg-white" />
              Stop
            </button>
          </>
        )}

        {state === "paused" && (
          <>
            <button
              type="button"
              onClick={resumeRecording}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-95"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Resume
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-full bg-slate-800 dark:bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900 dark:hover:bg-slate-600 active:scale-95"
            >
              <span className="h-3 w-3 rounded-sm bg-white" />
              Stop
            </button>
          </>
        )}

        {state === "stopped" && (
          <button
            type="button"
            onClick={resetRecording}
            className="flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-900 shadow-soft transition hover:bg-slate-800 dark:hover:bg-slate-100 active:scale-95"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 17.5a7 7 0 0 0 11-5.5M17.5 6.5a7 7 0 0 0-11 5.5" />
            </svg>
            Record again
          </button>
        )}
      </div>

      {audioUrl && (
        <div className="mt-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 px-4 py-3">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 text-center">
            Preview your recording
          </p>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}

      {mounted && effectiveMode !== "none" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                {effectiveMode === "gemini-live" ? "Gemini 3.5 Live Transcription" : "Web Speech Transcription"}
              </span>
              {effectiveMode === "gemini-live" && geminiLive.isTranscribing && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Streaming Live
                </span>
              )}
              {effectiveMode === "gemini-live" && geminiLive.isConnecting && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                  Connecting...
                </span>
              )}
              {effectiveMode === "browser" && browserListening && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400">(Listening...)</span>
              )}
            </div>

            {effectiveMode === "gemini-live" && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                16kHz PCM Little-Endian
              </span>
            )}
          </div>

          <div className="min-h-16 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
            {isProcessingChunk ? (
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 py-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span className="italic font-medium">Finalizing transcription with Gemini AI...</span>
              </div>
            ) : activeTranscript ? (
              <span>
                {activeTranscript}
                {effectiveMode === "gemini-live" && geminiLive.interimTranscript && (
                  <span className="text-teal-600 dark:text-teal-400 italic bg-teal-50 dark:bg-teal-950/40 px-1 py-0.5 rounded ml-1 animate-pulse">
                    {geminiLive.interimTranscript}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 italic">
                {state === "recording"
                  ? "Listening and transcribing in real-time..."
                  : "Start recording to begin live speech-to-text..."}
              </span>
            )}
          </div>
        </div>
      )}

      {(error || geminiLive.error) && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl p-3">
          {error || geminiLive.error}
        </p>
      )}

      {state === "stopped" && !error && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 text-center font-medium">
          Recording captured ({formatDuration(duration)})
        </p>
      )}
    </div>
  );
}
