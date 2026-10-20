"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  GEMINI_LIVE_MODEL,
  GEMINI_LIVE_SAMPLE_RATE,
  MAX_AUDIO_QUEUE_CHUNKS,
  resampleAudio,
  floatTo16BitPCM,
  pcmToBase64,
  createSetupMessage,
  createRealtimeInputChunk,
  parseGeminiLiveMessage,
} from "./geminiLiveAudio";

interface UseGeminiLiveTranscriptionOptions {
  model?: string;
  languageCodes?: string[];
  onFinalTranscript?: (text: string) => void;
  onError?: (error: string) => void;
}

export function useGeminiLiveTranscription(
  options: UseGeminiLiveTranscriptionOptions = {}
) {
  const {
    model = GEMINI_LIVE_MODEL,
    languageCodes = [],
    onFinalTranscript,
    onError,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const finalSegmentsRef = useRef<string[]>([]);
  const isStoppingRef = useRef(false);
  const retryCountRef = useRef(0);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Synchronize transcript string with accumulated segments
  const updateFullTranscript = useCallback((interim = "") => {
    const finals = finalSegmentsRef.current.join(" ").trim();
    if (interim.trim()) {
      setTranscript(finals ? `${finals} ${interim}` : interim);
    } else {
      setTranscript(finals);
    }
  }, []);

  const cleanupAudioPipeline = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      if (
        socketRef.current.readyState === WebSocket.OPEN ||
        socketRef.current.readyState === WebSocket.CONNECTING
      ) {
        socketRef.current.close();
      }
      socketRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsTranscribing(false);
  }, []);

  const connectAndStream = useCallback(
    async (stream: MediaStream) => {
      isStoppingRef.current = false;
      setError(null);
      setIsConnecting(true);
      mediaStreamRef.current = stream;

      try {
        // Request ephemeral token from server endpoint
        const tokenRes = await fetch("/api/gemini/live-token", { method: "POST" });
        if (!tokenRes.ok) {
          const errData = (await tokenRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(errData.error || `Token request failed: ${tokenRes.status}`);
        }

        const tokenData = (await tokenRes.json()) as {
          token?: string;
          wsUrl?: string;
        };

        if (!tokenData.wsUrl) {
          throw new Error("No live WebSocket URL returned from token endpoint");
        }

        const ws = new WebSocket(tokenData.wsUrl);
        socketRef.current = ws;

        // Bounded connection timeout (10s)
        const connectTimeout = setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
            const timeoutErr = "Gemini Live connection timed out";
            setError(timeoutErr);
            onError?.(timeoutErr);
            setIsConnecting(false);
          }
        }, 10000);

        ws.onopen = () => {
          clearTimeout(connectTimeout);
          setIsConnected(true);
          setIsConnecting(false);
          setIsTranscribing(true);
          retryCountRef.current = 0;

          // Send initial Setup Frame
          ws.send(createSetupMessage(model, languageCodes));

          // Set up Web Audio pipeline
          const AudioContextClass =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;

          const source = audioCtx.createMediaStreamSource(stream);
          mediaStreamSourceRef.current = source;

          // Process 4096 sample frames (~90ms at 44.1k/48k)
          const bufferSize = 4096;
          const processor = audioCtx.createScriptProcessor(bufferSize, 1, 1);
          processorRef.current = processor;

          let queuedChunks = 0;

          processor.onaudioprocess = (e) => {
            if (isStoppingRef.current || ws.readyState !== WebSocket.OPEN) return;

            // Backpressure check: prevent unbounded memory if socket is slow
            if (ws.bufferedAmount > 256 * 1024 || queuedChunks > MAX_AUDIO_QUEUE_CHUNKS) {
              return;
            }

            const inputData = e.inputBuffer.getChannelData(0);
            const resampled = resampleAudio(
              inputData,
              audioCtx.sampleRate,
              GEMINI_LIVE_SAMPLE_RATE
            );
            const pcm16 = floatTo16BitPCM(resampled);
            const base64 = pcmToBase64(pcm16);

            queuedChunks++;
            ws.send(createRealtimeInputChunk(base64));
            setTimeout(() => {
              queuedChunks = Math.max(0, queuedChunks - 1);
            }, 100);
          };

          source.connect(processor);
          processor.connect(audioCtx.destination);
        };

        ws.onmessage = async (event) => {
          let rawText = "";
          if (typeof event.data === "string") {
            rawText = event.data;
          } else if (event.data instanceof Blob) {
            rawText = await event.data.text();
          } else if (event.data instanceof ArrayBuffer) {
            rawText = new TextDecoder().decode(event.data);
          }

          if (!rawText) return;
          const parsed = parseGeminiLiveMessage(rawText);

          if (parsed.error) {
            setError(parsed.error);
            onError?.(parsed.error);
            return;
          }

          if (parsed.interimTranscript) {
            setInterimTranscript(parsed.interimTranscript);
            updateFullTranscript(parsed.interimTranscript);
          }

          if (parsed.finalTranscript) {
            finalSegmentsRef.current.push(parsed.finalTranscript.trim());
            setInterimTranscript("");
            updateFullTranscript("");
            onFinalTranscript?.(finalSegmentsRef.current.join(" ").trim());
          }
        };

        ws.onerror = () => {
          const errMsg = "Gemini Live WebSocket connection error";
          setError(errMsg);
          onError?.(errMsg);
        };

        ws.onclose = (event) => {
          setIsConnected(false);
          setIsTranscribing(false);

          // Attempt reconnection if closed unexpectedly and under retry limit
          if (!isStoppingRef.current && retryCountRef.current < 3 && event.code !== 1000) {
            retryCountRef.current++;
            const backoffMs = Math.min(1000 * 2 ** retryCountRef.current, 5000);
            setTimeout(() => {
              if (mediaStreamRef.current && !isStoppingRef.current) {
                connectAndStream(mediaStreamRef.current);
              }
            }, backoffMs);
          }
        };
      } catch (err) {
        setIsConnecting(false);
        const errMsg = err instanceof Error ? err.message : "Failed to initiate Gemini Live";
        setError(errMsg);
        onError?.(errMsg);
      }
    },
    [model, languageCodes, onError, onFinalTranscript, updateFullTranscript]
  );

  const start = useCallback(
    async (stream: MediaStream) => {
      cleanupAudioPipeline();
      await connectAndStream(stream);
    },
    [cleanupAudioPipeline, connectAndStream]
  );

  const stop = useCallback((): string => {
    isStoppingRef.current = true;
    cleanupAudioPipeline();
    setInterimTranscript("");
    const finalText = finalSegmentsRef.current.join(" ").trim();
    updateFullTranscript("");
    return finalText;
  }, [cleanupAudioPipeline, updateFullTranscript]);

  const reset = useCallback(() => {
    finalSegmentsRef.current = [];
    setInterimTranscript("");
    setTranscript("");
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isStoppingRef.current = true;
      cleanupAudioPipeline();
    };
  }, [cleanupAudioPipeline]);

  return {
    start,
    stop,
    reset,
    transcript,
    interimTranscript,
    isConnected,
    isConnecting,
    isTranscribing,
    error,
  };
}
