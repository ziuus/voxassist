import { NextResponse } from "next/server";
import { getRuntimeConfig } from "@/lib/env";

export const runtime = "nodejs";

const MODEL_ID = "models/gemini-3.5-transcribe-live";

export async function POST() {
  const config = getRuntimeConfig();
  const apiKey = config.googleApiKey;

  if (!apiKey) {
    if (config.demoMode) {
      return NextResponse.json({
        demo: true,
        model: "gemini-3.5-transcribe-live",
        message: "Demo mode active: simulating Gemini 3.5 Transcribe Live.",
      });
    }

    return NextResponse.json(
      {
        error:
          "Google API key is not configured. Please set GOOGLE_API_KEY or GEMINI_API_KEY in your environment.",
      },
      { status: 400 }
    );
  }

  try {
    const liveModel =
      process.env.NEXT_PUBLIC_GEMINI_LIVE_MODEL ||
      "models/gemini-2.5-flash-native-audio-preview-12-2025";

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/auth_tokens",
      {
        method: "POST",
        headers: {
          "x-goog-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uses: 1,
        }),
      }
    );

    if (response.ok) {
      const data = (await response.json()) as { name?: string };
      const token = data.name ?? "";
      return NextResponse.json({
        token,
        model: liveModel,
        wsUrl: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(
          token
        )}`,
      });
    }

    // If ephemeral token endpoint returns an error (e.g. key permission or preview limitation),
    // fallback gracefully to server relay mode so key is never sent to the browser
    const errorDetails = await response.text();
    return NextResponse.json(
      {
        token: null,
        model: "gemini-3.5-transcribe-live",
        fallbackMode: "server-relay",
        warning: `Ephemeral token endpoint response: ${response.status}`,
        details: errorDetails,
      },
      { status: 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mint ephemeral token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
