/**
 * Gemini Live Speech-to-Text Audio Utilities
 * Supports real-time streaming audio conversion to 16-bit 16kHz PCM Little-Endian
 * and parsing Gemini Live bidirectional WebSocket frames.
 */

export const GEMINI_LIVE_MODEL = "models/gemini-3.5-transcribe-live";
export const GEMINI_LIVE_SAMPLE_RATE = 16000;
export const MAX_AUDIO_QUEUE_CHUNKS = 50; // Bound queue memory

/**
 * Resamples a Float32Array buffer from inputSampleRate down/up to targetSampleRate
 * using linear interpolation.
 */
export function resampleAudio(
  sourceBuffer: Float32Array,
  inputSampleRate: number,
  targetSampleRate: number
): Float32Array {
  if (inputSampleRate === targetSampleRate) {
    return sourceBuffer;
  }

  if (sourceBuffer.length === 0) {
    return new Float32Array(0);
  }

  const ratio = inputSampleRate / targetSampleRate;
  const targetLength = Math.round(sourceBuffer.length / ratio);
  const result = new Float32Array(targetLength);

  for (let i = 0; i < targetLength; i++) {
    const originIndex = i * ratio;
    const indexFloor = Math.floor(originIndex);
    const indexCeil = Math.min(indexFloor + 1, sourceBuffer.length - 1);
    const weight = originIndex - indexFloor;
    result[i] =
      sourceBuffer[indexFloor] * (1 - weight) + sourceBuffer[indexCeil] * weight;
  }

  return result;
}

/**
 * Converts Float32Array audio samples (-1.0 to 1.0) into 16-bit signed PCM (Int16Array).
 */
export function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

/**
 * Converts an Int16Array into a Base64-encoded string (Little Endian).
 */
export function pcmToBase64(pcmData: Int16Array): string {
  const buffer = new Uint8Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);
  let binary = "";
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  if (typeof btoa !== "undefined") {
    return btoa(binary);
  }
  return Buffer.from(binary, "binary").toString("base64");
}

/**
 * Creates the initial Gemini Live setup frame required upon WebSocket connection.
 */
export function createSetupMessage(
  model: string = GEMINI_LIVE_MODEL,
  languageCodes: string[] = []
): string {
  return JSON.stringify({
    setup: {
      model,
      generationConfig: {
        responseModalities: ["TEXT"],
      },
      inputAudioTranscription: {
        languageCodes,
      },
    },
  });
}

/**
 * Creates a realtimeInput media chunk for streaming PCM audio to Gemini Live.
 */
export function createRealtimeInputChunk(base64Pcm: string): string {
  return JSON.stringify({
    realtimeInput: {
      mediaChunks: [
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64Pcm,
        },
      ],
    },
  });
}

export interface ParsedGeminiMessage {
  interimTranscript: string | null;
  finalTranscript: string | null;
  error: string | null;
  turnComplete: boolean;
  setupComplete: boolean;
}

/**
 * Parses Gemini Live incoming JSON payloads for transcription deltas.
 */
export function parseGeminiLiveMessage(rawJson: string): ParsedGeminiMessage {
  const result: ParsedGeminiMessage = {
    interimTranscript: null,
    finalTranscript: null,
    error: null,
    turnComplete: false,
    setupComplete: false,
  };

  try {
    const data = JSON.parse(rawJson);

    if (data.setupComplete || data.setup_complete) {
      result.setupComplete = true;
    }

    if (data.error) {
      result.error = typeof data.error === "string" ? data.error : data.error.message || "Gemini Live error";
      return result;
    }

    const serverContent = data.serverContent || data.server_content;
    if (serverContent) {
      if (serverContent.turnComplete || serverContent.turn_complete) {
        result.turnComplete = true;
      }

      // Check interim transcriptions
      const interimObj =
        serverContent.interimInputTranscription ||
        serverContent.interim_input_transcription ||
        serverContent.interimInputTranscriptions?.[0];
      if (interimObj?.text) {
        result.interimTranscript = interimObj.text;
      }

      // Check finalized input transcription
      const finalObj =
        serverContent.inputTranscription ||
        serverContent.input_transcription ||
        serverContent.inputTranscriptions?.[0];
      if (finalObj?.text) {
        result.finalTranscript = finalObj.text;
      }

      // Also check modelTurn parts if model emitted text
      const modelTurn = serverContent.modelTurn || serverContent.model_turn;
      if (modelTurn?.parts) {
        const texts = modelTurn.parts
          .map((p: { text?: string }) => p.text || "")
          .filter(Boolean)
          .join(" ");
        if (texts) {
          result.finalTranscript = result.finalTranscript
            ? `${result.finalTranscript} ${texts}`
            : texts;
        }
      }
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : "Failed to parse message";
  }

  return result;
}
