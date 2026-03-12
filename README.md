# VoxAssist

AI voice assistant for doctors that helps create reports based on interactions and conversations between doctor and patients.

## Features

- 🎙 **Record conversations** directly in the browser using the microphone
- 📁 **Upload audio files** (MP3, WAV, M4A, WEBM, OGG, FLAC)
- 📝 **Automatic transcription** using OpenAI Whisper
- 📋 **AI-generated medical reports** with structured sections (chief complaint, symptoms, diagnosis, treatment plan, medications, follow-up)
- 🗂 **Dashboard** to manage all recordings and reports

## Getting Started

### Prerequisites

- Node.js 18+
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file by copying the example:

   ```bash
   cp .env.example .env.local
   ```

3. Add your OpenAI API key to `.env.local`:

   ```
   OPENAI_API_KEY=sk-...
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Create a new recording** — click "New Recording" and either record live audio or upload an audio file. Optionally enter the patient and doctor names.
2. **Transcribe** — on the recording detail page, click "Transcribe Audio" to convert the audio to text using OpenAI Whisper.
3. **Generate Report** — click "Generate Report" to create a structured medical report from the transcript using GPT-4o.
4. The report includes: chief complaint, symptoms, medical history, examination findings, assessment, diagnosis, treatment plan, medications, and follow-up instructions.

## Technology Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [OpenAI API](https://platform.openai.com/) (Whisper + GPT-4o)

## Disclaimer

AI-generated reports are for reference only and must be reviewed and verified by the attending physician before use in official patient records.
