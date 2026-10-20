import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resampleAudio,
  floatTo16BitPCM,
  pcmToBase64,
  createSetupMessage,
  createRealtimeInputChunk,
  parseGeminiLiveMessage,
  GEMINI_LIVE_MODEL,
  GEMINI_LIVE_SAMPLE_RATE,
} from "../lib/geminiLiveAudio";

describe("Gemini Live Audio Conversion & Messaging", () => {
  it("verifies constant values", () => {
    assert.ok(GEMINI_LIVE_MODEL.includes("models/gemini"));
    assert.equal(GEMINI_LIVE_SAMPLE_RATE, 16000);
  });

  it("resamples 48kHz audio buffer down to 16kHz", () => {
    const inputSampleRate = 48000;
    const targetSampleRate = 16000;
    // 480 samples at 48kHz = 10ms -> should become 160 samples at 16kHz
    const input = new Float32Array(480);
    for (let i = 0; i < input.length; i++) {
      input[i] = Math.sin((i / 480) * 2 * Math.PI);
    }

    const resampled = resampleAudio(input, inputSampleRate, targetSampleRate);
    assert.equal(resampled.length, 160);
    assert.ok(Math.abs(resampled[0]) < 0.01);
  });

  it("handles identical input and target sample rates without modification", () => {
    const input = new Float32Array([0.1, 0.2, 0.3]);
    const resampled = resampleAudio(input, 16000, 16000);
    assert.equal(resampled, input);
  });

  it("converts Float32 audio to 16-bit PCM with clipping", () => {
    const input = new Float32Array([0.0, 1.0, -1.0, 1.5, -1.5, 0.5]);
    const pcm = floatTo16BitPCM(input);

    assert.equal(pcm.length, 6);
    assert.equal(pcm[0], 0);
    assert.equal(pcm[1], 32767); // Clamped max positive
    assert.equal(pcm[2], -32768); // Clamped min negative
    assert.equal(pcm[3], 32767); // Over-range positive clamped
    assert.equal(pcm[4], -32768); // Over-range negative clamped
    assert.equal(pcm[5], Math.floor(0.5 * 32767));
  });

  it("encodes PCM data to Base64 accurately", () => {
    const pcm = new Int16Array([0, 1000, -1000]);
    const base64 = pcmToBase64(pcm);
    assert.ok(typeof base64 === "string");
    assert.ok(base64.length > 0);

    const buffer = Buffer.from(base64, "base64");
    assert.equal(buffer.length, 6); // 3 samples * 2 bytes
    const decoded = new Int16Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength / 2
    );
    assert.equal(decoded[0], 0);
    assert.equal(decoded[1], 1000);
    assert.equal(decoded[2], -1000);
  });

  it("creates valid Gemini Live setup frame", () => {
    const msg = createSetupMessage("models/gemini-3.5-transcribe-live");
    const parsed = JSON.parse(msg);

    assert.equal(parsed.setup.model, "models/gemini-3.5-transcribe-live");
    assert.deepEqual(parsed.setup.generationConfig.responseModalities, ["TEXT"]);
  });

  it("creates valid realtimeInput media chunks", () => {
    const mockB64 = "AQIDBA==";
    const chunkMsg = createRealtimeInputChunk(mockB64);
    const parsed = JSON.parse(chunkMsg);

    assert.equal(parsed.realtimeInput.mediaChunks[0].mimeType, "audio/pcm;rate=16000");
    assert.equal(parsed.realtimeInput.mediaChunks[0].data, mockB64);
  });

  it("parses interim transcription payloads", () => {
    const raw = JSON.stringify({
      serverContent: {
        interimInputTranscription: {
          text: "Patient reports mild chest discomfort",
        },
      },
    });

    const parsed = parseGeminiLiveMessage(raw);
    assert.equal(parsed.interimTranscript, "Patient reports mild chest discomfort");
    assert.equal(parsed.finalTranscript, null);
    assert.equal(parsed.error, null);
  });

  it("parses finalized input transcription payloads", () => {
    const raw = JSON.stringify({
      serverContent: {
        inputTranscription: {
          text: "Patient reports mild chest discomfort for three days.",
        },
        turnComplete: true,
      },
    });

    const parsed = parseGeminiLiveMessage(raw);
    assert.equal(
      parsed.finalTranscript,
      "Patient reports mild chest discomfort for three days."
    );
    assert.equal(parsed.interimTranscript, null);
    assert.equal(parsed.turnComplete, true);
  });

  it("parses modelTurn text responses if emitted by model", () => {
    const raw = JSON.stringify({
      serverContent: {
        modelTurn: {
          parts: [{ text: "Follow-up consultation notes." }],
        },
      },
    });

    const parsed = parseGeminiLiveMessage(raw);
    assert.equal(parsed.finalTranscript, "Follow-up consultation notes.");
  });

  it("handles error payloads gracefully", () => {
    const raw = JSON.stringify({
      error: {
        code: 400,
        message: "Invalid audio format",
      },
    });

    const parsed = parseGeminiLiveMessage(raw);
    assert.equal(parsed.error, "Invalid audio format");
  });
});
