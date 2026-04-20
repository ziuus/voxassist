import { NextRequest, NextResponse } from 'next/server';
import { getGoogleClient, extractJsonObject } from '@/lib/openai';
import { searchRecordings } from '@/lib/storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const client = getGoogleClient();
    const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Step 1: Intent Recognition & Parameter Extraction
    const intentPrompt = `You are a medical data assistant. Analyze the user's query and extract search parameters to find relevant medical recordings/reports.
Query: "${lastMessage}"

Respond ONLY with a JSON object:
{
  "patientName": "string or null",
  "query": "search keywords or null",
  "explanation": "brief reasoning"
}`;

    const intentResult = await model.generateContent(intentPrompt);
    const intentJson = extractJsonObject(intentResult.response.text());
    const params = JSON.parse(intentJson);

    // Step 2: Retrieve relevant data
    const recordings = await searchRecordings({
      patientName: params.patientName,
      query: params.query,
      limit: 3
    });

    // Step 3: Synthesis
    const context = recordings.map(r => `
---
Recording: ${r.title}
Date: ${r.date}
Patient: ${r.patientName}
Transcript Snippet: ${r.transcript?.slice(0, 500)}...
Report: ${JSON.stringify(r.report)}
---`).join('\n');

    const synthesisPrompt = `You are Dr. Vox, an intelligent medical AI. Use the following context from past medical recordings to answer the user's question.
If the information is not in the context, be honest and say you couldn't find specific records.
Always maintain a professional, clinical tone.

Context:
${context}

User Question: ${lastMessage}

Answer:`;

    const finalResult = await model.generateContent(synthesisPrompt);
    const answer = finalResult.response.text();

    return NextResponse.json({ 
      role: 'assistant', 
      content: answer,
      sources: recordings.map(r => ({ id: r.id, title: r.title }))
    });

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
