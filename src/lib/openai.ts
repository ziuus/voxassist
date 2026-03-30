import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MedicalReport } from "./types";
import { getRuntimeConfig } from "./env";

let _client: OpenAI | null = null;
let _googleClient: GoogleGenerativeAI | null = null;

type AiProvider = "google" | "openai";

function getAiProvider(): AiProvider {
  return getRuntimeConfig().aiProvider;
}

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your_openai_api_key_here") {
      throw new Error(
        "OPENAI_API_KEY is not configured. Please set it in your .env.local file."
      );
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

function getGoogleClient(): GoogleGenerativeAI {
  if (!_googleClient) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey || apiKey === "your_google_api_key_here") {
      throw new Error(
        "GOOGLE_API_KEY is not configured. Please set it in your .env.local file."
      );
    }
    _googleClient = new GoogleGenerativeAI(apiKey);
  }
  return _googleClient;
}

function getMimeTypeFromPath(audioFilePath: string): string {
  const ext = path.extname(audioFilePath).toLowerCase();
  if (ext === ".mp3") return "audio/mpeg";
  if (ext === ".wav") return "audio/wav";
  if (ext === ".m4a") return "audio/m4a";
  if (ext === ".mp4") return "audio/mp4";
  if (ext === ".ogg") return "audio/ogg";
  if (ext === ".flac") return "audio/flac";
  if (ext === ".webm") return "audio/webm";
  return "application/octet-stream";
}

function extractJsonObject(raw: string): string {
  const direct = raw.trim();
  if (direct.startsWith("{") && direct.endsWith("}")) {
    return direct;
  }

  const fenced = direct.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const first = direct.indexOf("{");
  const last = direct.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return direct.slice(first, last + 1);
  }

  throw new Error("AI response did not contain a valid JSON object");
}

async function transcribeWithGoogle(audioFilePath: string): Promise<string> {
  const client = getGoogleClient();
  const model = process.env.GOOGLE_TRANSCRIPTION_MODEL ?? "gemini-2.0-flash";
  const audioBuffer = fs.readFileSync(audioFilePath);
  const audioBase64 = audioBuffer.toString("base64");
  const mimeType = getMimeTypeFromPath(audioFilePath);

  const genModel = client.getGenerativeModel({ model });
  const response = await genModel.generateContent([
    {
      text: "Transcribe this medical consultation audio verbatim. Return only the transcript text with no extra commentary.",
    },
    {
      inlineData: {
        mimeType,
        data: audioBase64,
      },
    },
  ]);

  const transcript = response.response.text().trim();
  if (!transcript) {
    throw new Error("No transcription returned from Google model");
  }

  return transcript;
}

async function transcribeWithOpenAI(audioFilePath: string): Promise<string> {
  const client = getClient();
  const model =
    (process.env.OPENAI_TRANSCRIPTION_MODEL as "whisper-1") ?? "whisper-1";

  const transcription = await client.audio.transcriptions.create({
    file: fs.createReadStream(audioFilePath),
    model,
    response_format: "text",
  });

  return transcription as unknown as string;
}

export async function transcribeAudio(audioFilePath: string): Promise<string> {
  return getAiProvider() === "google"
    ? transcribeWithGoogle(audioFilePath)
    : transcribeWithOpenAI(audioFilePath);
}

async function generateReportWithOpenAI(
  transcript: string,
  patientName?: string,
  doctorName?: string
): Promise<MedicalReport> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `You are a medical AI assistant that analyzes doctor-patient conversation transcripts and generates structured medical reports.
Extract relevant medical information and organize it into a structured report.
Respond ONLY with a valid JSON object matching the specified schema. Do not include markdown code blocks or any other text.`;

  const userPrompt = `Analyze the following doctor-patient conversation transcript and generate a structured medical report.

${patientName ? `Patient: ${patientName}` : ""}
${doctorName ? `Doctor: ${doctorName}` : ""}
Date: ${today}

Transcript:
${transcript}

Generate a JSON report with these fields (omit any field if the information is not mentioned in the transcript):
{
  "patientName": "string or use provided patient name",
  "doctorName": "string or use provided doctor name",
  "date": "YYYY-MM-DD",
  "chiefComplaint": "main reason for visit",
  "symptoms": ["list", "of", "symptoms"],
  "medicalHistory": "relevant past medical history",
  "examination": "physical examination findings",
  "assessment": "doctor's assessment",
  "diagnosis": "diagnosis or differential diagnoses",
  "treatmentPlan": "recommended treatment plan",
  "medications": ["list", "of", "prescribed", "medications"],
  "followUp": "follow-up instructions",
  "additionalNotes": "any other relevant information"
}`;

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI model");
  }

  const report = JSON.parse(content) as MedicalReport;
  return {
    ...report,
    patientName: report.patientName ?? patientName,
    doctorName: report.doctorName ?? doctorName,
    date: report.date ?? today,
  };
}

async function generateReportWithGoogle(
  transcript: string,
  patientName?: string,
  doctorName?: string
): Promise<MedicalReport> {
  const client = getGoogleClient();
  const model = process.env.GOOGLE_MODEL ?? "gemini-2.0-flash";
  const today = new Date().toISOString().split("T")[0];

  const genModel = client.getGenerativeModel({ model });
  const prompt = `You are a medical AI assistant that analyzes doctor-patient conversation transcripts and generates structured medical reports.
Return ONLY valid JSON with no markdown and no explanation.

${patientName ? `Patient: ${patientName}` : ""}
${doctorName ? `Doctor: ${doctorName}` : ""}
Date: ${today}

Transcript:
${transcript}

Required JSON shape:
{
  "patientName": "string or use provided patient name",
  "doctorName": "string or use provided doctor name",
  "date": "YYYY-MM-DD",
  "chiefComplaint": "main reason for visit",
  "symptoms": ["list", "of", "symptoms"],
  "medicalHistory": "relevant past medical history",
  "examination": "physical examination findings",
  "assessment": "doctor's assessment",
  "diagnosis": "diagnosis or differential diagnoses",
  "treatmentPlan": "recommended treatment plan",
  "medications": ["list", "of", "prescribed", "medications"],
  "followUp": "follow-up instructions",
  "additionalNotes": "any other relevant information"
}`;

  const result = await genModel.generateContent(prompt);
  const raw = result.response.text();
  const json = extractJsonObject(raw);
  const report = JSON.parse(json) as MedicalReport;

  return {
    ...report,
    patientName: report.patientName ?? patientName,
    doctorName: report.doctorName ?? doctorName,
    date: report.date ?? today,
  };
}

export async function generateMedicalReport(
  transcript: string,
  patientName?: string,
  doctorName?: string
): Promise<MedicalReport> {
  return getAiProvider() === "google"
    ? generateReportWithGoogle(transcript, patientName, doctorName)
    : generateReportWithOpenAI(transcript, patientName, doctorName);
}
