import { useRef, useCallback, useState } from "react";
import { createModel, Model, KaldiRecognizer } from "vosk-browser";

// Use tiny model from vosk-browser examples (CORS-friendly)
const MODEL_URL = "https://raw.githubusercontent.com/ccoreilly/vosk-browser/master/models/vosk-model-small-en-us-0.15.tar.gz";
const SAMPLE_RATE = 16000;

interface VoskState {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
}

export function useVoskTranscription() {
  const modelRef = useRef<Model | null>(null);
  const recognizerRef = useRef<KaldiRecognizer | null>(null);
  const [state, setState] = useState<VoskState>({
    isLoading: false,
    isReady: false,
    error: null,
  });
  const transcriptRef = useRef<string>("");
  const partialRef = useRef<string>("");

  const loadVoskModel = useCallback(async (): Promise<boolean> => {
    if (modelRef.current && state.isReady) {
      return true;
    }

    setState({ isLoading: true, isReady: false, error: null });
    transcriptRef.current = "";
    partialRef.current = "";

    try {
      const model = await createModel(MODEL_URL);
      modelRef.current = model;

      const recognizer = new model.KaldiRecognizer(SAMPLE_RATE);
      recognizer.setWords(false);

      recognizer.addEventListener("result", (e: any) => {
        const result = e.data?.result;
        if (result?.text) {
          transcriptRef.current = `${transcriptRef.current} ${result.text}`.trim();
          partialRef.current = "";
        }
      });

      recognizer.addEventListener("partialresult", (e: any) => {
        const result = e.data?.result;
        if (result?.partial) {
          partialRef.current = result.partial;
        }
      });

      recognizerRef.current = recognizer;
      setState({ isLoading: false, isReady: true, error: null });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load Vosk model";
      setState({ isLoading: false, isReady: false, error: message });
      return false;
    }
  }, [state.isReady]);

  const processAudio = useCallback((audioData: Float32Array): string => {
    if (!recognizerRef.current) {
      return "";
    }

    recognizerRef.current.acceptWaveformFloat(audioData, SAMPLE_RATE);

    const partial = partialRef.current;
    const transcript = transcriptRef.current;

    if (partial) {
      return `${transcript} ${partial}`.trim();
    }
    return transcript;
  }, []);

  const getFinalTranscript = useCallback((): string => {
    if (!recognizerRef.current) {
      return transcriptRef.current;
    }

    recognizerRef.current.retrieveFinalResult();
    return transcriptRef.current;
  }, []);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = "";
    partialRef.current = "";
  }, []);

  const cleanup = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.remove();
      recognizerRef.current = null;
    }
    if (modelRef.current) {
      modelRef.current.terminate();
      modelRef.current = null;
    }
    transcriptRef.current = "";
    partialRef.current = "";
    setState({ isLoading: false, isReady: false, error: null });
  }, []);

  return {
    loadVoskModel,
    processAudio,
    getFinalTranscript,
    resetTranscript,
    cleanup,
    isLoading: state.isLoading,
    isReady: state.isReady,
    error: state.error,
  };
}
