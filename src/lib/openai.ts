import OpenAI from "openai";
import fs from "fs";
import { MedicalReport } from "./types";

let _client: OpenAI | null = null;

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

export async function transcribeAudio(audioFilePath: string): Promise<string> {
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

export async function generateMedicalReport(
  transcript: string,
  patientName?: string,
  doctorName?: string
): Promise<MedicalReport> {
  const client = getClient();
  const model = process.env.OPENAI_MODEL ?? "gpt-4o";

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

  // Ensure required fields have defaults
  return {
    ...report,
    patientName: report.patientName ?? patientName,
    doctorName: report.doctorName ?? doctorName,
    date: report.date ?? today,
  };
}
