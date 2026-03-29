"use client";

import { useRef, useState, useCallback } from "react";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  enableBrowserTranscription?: boolean;
  onTranscriptReady?: (transcript: string) => void;
}

type RecordingState = "idle" | "recording" | "paused" | "stopped";

type SpeechRecognitionResultItem = {
  transcript: string;
};

type SpeechRecognitionResultListItem = {
  isFinal: boolean;
  0: SpeechRecognitionResultItem;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultListItem>;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type BrowserWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const browser = window as BrowserWithSpeech;
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition ?? null;
}

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
  onTranscriptReady,
}: AudioRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalTranscriptRef = useRef("");
  const shouldKeepRecognitionRunningRef = useRef(false);

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
    setLiveTranscript("");
    finalTranscriptRef.current = "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      if (enableBrowserTranscription) {
        const RecognitionCtor = getSpeechRecognitionConstructor();
        if (!RecognitionCtor) {
          throw new Error(
            "Browser transcription is not supported in this browser. Use server transcription instead."
          );
        }

        const recognition = new RecognitionCtor();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const segment = event.results[i];
            const text = segment[0]?.transcript ?? "";
            if (segment.isFinal) {
              finalTranscriptRef.current = `${finalTranscriptRef.current} ${text}`.trim();
            } else {
              interim = `${interim} ${text}`.trim();
            }
          }
          const merged = `${finalTranscriptRef.current} ${interim}`.trim();
          setLiveTranscript(merged);
        };

        recognition.onerror = (event) => {
          const type = event.error ?? "unknown";
          setError(`Browser transcription error: ${type}`);
        };

        recognition.onend = () => {
          if (shouldKeepRecognitionRunningRef.current) {
            try {
              recognition.start();
            } catch {
              // Ignore repeated start errors from browser speech engine.
            }
          }
        };

        recognitionRef.current = recognition;
        shouldKeepRecognitionRunningRef.current = true;
        recognition.start();
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

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete(blob);

        const finalTranscript = finalTranscriptRef.current.trim();
        if (enableBrowserTranscription && onTranscriptReady && finalTranscript) {
          onTranscriptReady(finalTranscript);
        }

        shouldKeepRecognitionRunningRef.current = false;
        recognitionRef.current?.stop();
        recognitionRef.current = null;

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
  }, [enableBrowserTranscription, onRecordingComplete, onTranscriptReady]);

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
      shouldKeepRecognitionRunningRef.current = false;
      recognitionRef.current?.stop();
      stopTimer();
      setState("paused");
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();

      if (enableBrowserTranscription && recognitionRef.current) {
        shouldKeepRecognitionRunningRef.current = true;
        try {
          recognitionRef.current.start();
        } catch {
          // Ignore repeated start errors from browser speech engine.
        }
      }

      setState("recording");
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    }
  }, [enableBrowserTranscription]);

  const resetRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();
    }
    shouldKeepRecognitionRunningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setLiveTranscript("");
    setDuration(0);
    setState("idle");
    chunksRef.current = [];
  }, [audioUrl, stopTimer]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-4">
        <div
          className={`rounded-3xl px-6 py-4 text-4xl font-semibold tabular-nums shadow-soft ${
            state === "recording"
              ? "bg-red-50 text-red-600"
              : "bg-white/80 text-slate-700"
          }`}
        >
          {formatDuration(duration)}
        </div>
        {state === "recording" && (
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-70"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-3 flex-wrap">
        {state === "idle" && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-red-700"
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
            Start recording
          </button>
        )}

        {state === "recording" && (
          <>
            <button
              onClick={pauseRecording}
              className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-600"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M7 5h3v14H7zm7 0h3v14h-3z" />
              </svg>
              Pause
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              <span className="h-3 w-3 rounded-sm bg-white" />
              Stop
            </button>
          </>
        )}

        {state === "paused" && (
          <>
            <button
              onClick={resumeRecording}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
              Resume
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-900"
            >
              <span className="h-3 w-3 rounded-sm bg-white" />
              Stop
            </button>
          </>
        )}

        {state === "stopped" && (
          <button
            onClick={resetRecording}
            className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h5M20 20v-5h-5"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.5 17.5a7 7 0 0 0 11-5.5M17.5 6.5a7 7 0 0 0-11 5.5"
              />
            </svg>
            Record again
          </button>
        )}
      </div>

      {audioUrl && (
        <div className="mt-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
          <p className="text-xs text-slate-500 mb-2 text-center">
            Preview your recording
          </p>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}

      {enableBrowserTranscription && (
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Browser transcript preview
          </p>
          <p className="mt-2 min-h-16 whitespace-pre-wrap text-sm text-slate-700">
            {liveTranscript || "Listening..."}
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 text-center bg-red-50 rounded-2xl p-3">
          {error}
        </p>
      )}

      {state === "stopped" && !error && (
        <p className="text-sm text-emerald-600 text-center">
          Recording captured ({formatDuration(duration)})
        </p>
      )}
    </div>
  );
}
