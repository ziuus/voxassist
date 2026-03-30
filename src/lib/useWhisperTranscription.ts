"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseWhisperTranscriptionOptions {
  model?: string;
  language?: string;
}

interface UseWhisperTranscriptionReturn {
  transcript: string;
  isModelLoading: boolean;
  isTranscribing: boolean;
  error: string | null;
  startTranscribing: (audioStream: MediaStream) => Promise<void>;
  stopTranscribing: () => void;
  resetTranscript: () => void;
}

export function useWhisperTranscription(
  options: UseWhisperTranscriptionOptions = {}
): UseWhisperTranscriptionReturn {
  const { model = "Xenova/whisper-tiny.en", language = "en" } = options;

  const [transcript, setTranscript] = useState("");
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pipelineRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const processingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Initialize Whisper pipeline
  useEffect(() => {
    if (typeof window === "undefined") return;

    let mounted = true;

    const loadModel = async () => {
      try {
        console.log("[Whisper] Starting model load...");
        setIsModelLoading(true);
        setError(null);

        // Dynamically import transformers.js (client-side only)
        console.log("[Whisper] Importing transformers.js...");
        const { pipeline } = await import("@xenova/transformers");

        if (!mounted) return;

        // Create ASR pipeline
        console.log(`[Whisper] Creating ASR pipeline with model: ${model}`);
        const pipe = await pipeline("automatic-speech-recognition", model, {
          quantized: true, // Use quantized model for better performance
        });

        if (!mounted) return;

        pipelineRef.current = pipe;
        setIsModelLoading(false);
        console.log("[Whisper] ✅ Model loaded successfully!");
      } catch (err) {
        console.error("[Whisper] ❌ Model loading failed:", err);
        if (!mounted) return;
        setError(`Failed to load Whisper model: ${err}`);
        setIsModelLoading(false);
      }
    };

    loadModel();

    return () => {
      mounted = false;
    };
  }, [model]);

  const processAudioChunk = useCallback(
    async (audioBlob: Blob) => {
      if (!pipelineRef.current || !audioContextRef.current) return;

      try {
        console.log("[Whisper] Processing audio chunk...", audioBlob.size, "bytes");
        setIsTranscribing(true);

        // Convert blob to audio buffer
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

        console.log("[Whisper] Audio decoded:", {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels
        });

        // Extract mono audio data at 16kHz (Whisper's expected format)
        const audioData = audioBuffer.getChannelData(0);

        // Resample to 16kHz if necessary
        const targetSampleRate = 16000;
        let resampledData = audioData;

        if (audioBuffer.sampleRate !== targetSampleRate) {
          console.log(`[Whisper] Resampling from ${audioBuffer.sampleRate}Hz to ${targetSampleRate}Hz`);
          const ratio = audioBuffer.sampleRate / targetSampleRate;
          const newLength = Math.round(audioData.length / ratio);
          resampledData = new Float32Array(newLength);

          for (let i = 0; i < newLength; i++) {
            const srcIndex = Math.round(i * ratio);
            resampledData[i] = audioData[srcIndex];
          }
        }

        // Run transcription
        console.log("[Whisper] Running transcription...");
        const result = await pipelineRef.current(resampledData, {
          language: language,
          task: "transcribe",
          chunk_length_s: 30,
          stride_length_s: 5,
          return_timestamps: false,
        });

        console.log("[Whisper] Transcription result:", result);

        // Append transcript
        if (result?.text) {
          setTranscript((prev) => {
            const newText = result.text.trim();
            const updated = prev ? `${prev} ${newText}` : newText;
            console.log("[Whisper] Updated transcript:", updated);
            return updated;
          });
        }

        setIsTranscribing(false);
      } catch (err) {
        console.error("[Whisper] ❌ Transcription error:", err);
        setError(`Transcription failed: ${err}`);
        setIsTranscribing(false);
      }
    },
    [language]
  );

  const startTranscribing = useCallback(
    async (audioStream: MediaStream) => {
      if (!pipelineRef.current) {
        setError("Whisper model not loaded yet");
        return;
      }

      if (isModelLoading) {
        setError("Model is still loading, please wait...");
        return;
      }

      try {
        setError(null);

        // Create audio context at 16kHz for Whisper
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;

        // Create media recorder
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const recorder = new MediaRecorder(audioStream, { mimeType });
        mediaRecorderRef.current = recorder;

        audioChunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.start(1000); // Collect chunks every second

        // Process audio every 10 seconds for real-time transcription
        processingIntervalRef.current = setInterval(async () => {
          if (audioChunksRef.current.length === 0) return;

          const chunks = [...audioChunksRef.current];
          audioChunksRef.current = []; // Clear processed chunks

          const audioBlob = new Blob(chunks, { type: mimeType });
          await processAudioChunk(audioBlob);
        }, 10000);
      } catch (err) {
        setError(`Failed to start transcription: ${err}`);
      }
    },
    [isModelLoading, processAudioChunk]
  );

  const stopTranscribing = useCallback(async () => {
    // Stop interval
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }

    // Stop recorder
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current?.stop();

      // Process any remaining chunks
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for last ondataavailable

      if (audioChunksRef.current.length > 0 && audioContextRef.current) {
        const chunks = [...audioChunksRef.current];
        audioChunksRef.current = [];

        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const audioBlob = new Blob(chunks, { type: mimeType });
        await processAudioChunk(audioBlob);
      }
    }

    mediaRecorderRef.current = null;

    // Close audio context
    if (audioContextRef.current?.state !== "closed") {
      await audioContextRef.current?.close();
    }
    audioContextRef.current = null;
  }, [processAudioChunk]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return {
    transcript,
    isModelLoading,
    isTranscribing,
    error,
    startTranscribing,
    stopTranscribing,
    resetTranscript,
  };
}
