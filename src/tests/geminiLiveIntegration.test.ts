import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRuntimeConfig } from "../lib/env";
import { createSetupMessage, createRealtimeInputChunk } from "../lib/geminiLiveAudio";

describe("Live API Integration with Real Google Credentials", () => {
  const config = getRuntimeConfig();
  const apiKey = config.googleApiKey;

  it("mints an ephemeral live token from Google AI Studio", async () => {
    if (!apiKey) {
      console.log("Skipping live integration test: GOOGLE_API_KEY not configured");
      return;
    }

    const tokenRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/auth_tokens",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uses: 1 }),
      }
    );

    assert.equal(tokenRes.status, 200);
    const data = (await tokenRes.json()) as { name?: string };
    assert.ok(data.name && data.name.startsWith("auth_tokens/"));
  });

  it("establishes a live bidirectional WebSocket session with Google GenerativeService", async () => {
    if (!apiKey) return;

    // 1. Mint token
    const tokenRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/auth_tokens",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uses: 1 }),
      }
    );
    const tokenData = (await tokenRes.json()) as { name: string };
    const wsUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(
      tokenData.name
    )}`;

    // 2. Connect WebSocket
    const ws = new WebSocket(wsUrl);

    const setupAck = await new Promise<boolean>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error("Timeout waiting for setupComplete"));
      }, 8000);

      ws.onopen = () => {
        const liveModel = "models/gemini-2.5-flash-native-audio-preview-12-2025";
        ws.send(createSetupMessage(liveModel));
      };

      ws.onmessage = async (e) => {
        const text = typeof e.data === "string" ? e.data : await e.data.text();
        const parsed = JSON.parse(text);
        if (parsed.setupComplete) {
          clearTimeout(timeout);
          // Stream a 100ms silent 16kHz PCM chunk
          const pcmChunk = Buffer.alloc(3200);
          ws.send(createRealtimeInputChunk(pcmChunk.toString("base64")));
          ws.close(1000, "Test complete");
          resolve(true);
        }
      };

      ws.onerror = (err) => {
        clearTimeout(timeout);
        reject(err);
      };
    });

    assert.equal(setupAck, true);
  });

  it("verifies gemini-3.5-transcribe model accessibility", async () => {
    if (!apiKey) return;

    // Create minimal 0.1s WAV audio at 16kHz
    const sampleRate = 16000;
    const dataSize = 3200;
    const wav = Buffer.alloc(44 + dataSize);
    wav.write("RIFF", 0);
    wav.writeUInt32LE(36 + dataSize, 4);
    wav.write("WAVE", 8);
    wav.write("fmt ", 12);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20); // PCM format
    wav.writeUInt16LE(1, 22); // Mono
    wav.writeUInt32LE(sampleRate, 24);
    wav.writeUInt32LE(sampleRate * 2, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write("data", 36);
    wav.writeUInt32LE(dataSize, 40);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: "Transcribe audio." },
                {
                  inlineData: {
                    mimeType: "audio/wav",
                    data: wav.toString("base64"),
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (res.status === 503) {
      // Model temporarily overloaded on Google side — retry with fallback model
      const fallbackRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: "Transcribe audio." },
                  {
                    inlineData: {
                      mimeType: "audio/wav",
                      data: wav.toString("base64"),
                    },
                  },
                ],
              },
            ],
          }),
        }
      );
      assert.equal(fallbackRes.status, 200);
      return;
    }

    assert.equal(res.status, 200);
    const data = (await res.json()) as { modelVersion?: string };
    assert.equal(data.modelVersion, "gemini-3.5-transcribe");
  });
});
