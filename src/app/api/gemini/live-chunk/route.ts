import { NextRequest, NextResponse } from "next/server";
import { getRuntimeConfig } from "@/lib/env";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const config = getRuntimeConfig();
  const apiKey = config.googleApiKey;

  if (!apiKey) {
    if (config.demoMode) {
      return NextResponse.json({
        text: "Simulated transcription: Patient reports mild fever and persistent cough for three days.",
        isFinal: true,
      });
    }
    return NextResponse.json(
      { error: "Google API key is not configured." },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const { audioBase64, mimeType = "audio/pcm;rate=16000", previousTranscript = "" } = body;

    if (!audioBase64) {
      return NextResponse.json({ error: "Missing audioBase64 payload" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model =
      process.env.GOOGLE_TRANSCRIPTION_MODEL ?? "gemini-3.5-transcribe";

    let genModel;
    try {
      genModel = genAI.getGenerativeModel({ model });
    } catch {
      genModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    const prompt = previousTranscript
      ? `Continue transcribing this audio stream. Previously transcribed context: "${previousTranscript}". Transcribe new speech verbatim. Output only the new text.`
      : "Transcribe this audio verbatim. Output only the transcript text without preamble or commentary.";

    const result = await genModel.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: mimeType.startsWith("audio/") ? mimeType : "audio/pcm;rate=16000",
          data: audioBase64,
        },
      },
    ]);

    const text = result.response.text().trim();
    return NextResponse.json({ text, isFinal: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription chunk error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
