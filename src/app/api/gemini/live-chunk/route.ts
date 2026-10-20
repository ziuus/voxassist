import { NextRequest, NextResponse } from "next/server";
import { getRuntimeConfig } from "@/lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const config = getRuntimeConfig();
  const apiKey = config.googleApiKey;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Google API key is not configured." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { audioBase64, mimeType = "audio/webm", previousTranscript = "" } = body;

    if (!audioBase64) {
      return NextResponse.json({ error: "Missing audioBase64 payload" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const primaryModel =
      process.env.GOOGLE_TRANSCRIPTION_MODEL ?? "gemini-2.5-flash";

    const prompt = previousTranscript
      ? `Continue transcribing this audio stream. Previously transcribed context: "${previousTranscript}". Transcribe new speech verbatim. Output only the new text.`
      : "Transcribe this audio verbatim. Output only the transcript text without preamble or commentary.";

    let text = "";
    try {
      const genModel = genAI.getGenerativeModel({ model: primaryModel });
      const result = await genModel.generateContent([
        { text: prompt },
        {
          inlineData: {
            mimeType: mimeType.split(";")[0],
            data: audioBase64,
          },
        },
      ]);
      try {
        text = result.response.text().trim();
      } catch {
        text = "";
      }
    } catch (primaryErr) {
      console.warn("[live-chunk] Primary model error:", primaryErr);
    }

    // Fallback if primary model returned empty text or failed
    if (!text && primaryModel !== "gemini-2.5-flash") {
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await fallbackModel.generateContent([
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType.split(";")[0],
              data: audioBase64,
            },
          },
        ]);
        text = result.response.text().trim();
      } catch (fallbackErr) {
        console.warn("[live-chunk] Fallback model error:", fallbackErr);
      }
    }

    return NextResponse.json({ text: text || "[No audible speech detected]", isFinal: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription chunk error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
