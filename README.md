# VoxAssist

AI voice assistant for doctors that helps create reports based on interactions and conversations between doctor and patients.

## Features

- 🎙 **Record conversations** directly in the browser using the microphone
- 📁 **Upload audio files** (MP3, WAV, M4A, WEBM, OGG, FLAC)
- 🧠 **Browser transcription mode** (Web Speech API) as the default low-AI path
- 📝 **Automatic transcription** using Google Gemini (or OpenAI fallback)
- 📋 **AI-generated medical reports** with structured sections (chief complaint, symptoms, diagnosis, treatment plan, medications, follow-up)
- 🗂 **Dashboard** to manage all recordings and reports
- 🔎 **Live dashboard filtering** by status, patient, doctor, title, and diagnosis
- 🔁 **Retry failed processing** for transcription/report generation from recording detail view

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google AI API key](https://aistudio.google.com/app/apikey) or OpenAI API key

### Setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env.local` file by copying the example:

   ```bash
   cp .env.example .env.local
   ```

3. Configure AI provider and keys in `.env.local`:

   ```
   AI_PROVIDER=google
   GOOGLE_API_KEY=your_google_api_key_here

   # Optional fallback provider
   # AI_PROVIDER=openai
   # OPENAI_API_KEY=sk-...

   # Optional: client-side default transcription source in /recordings/new
   # browser (default, lowest AI usage) | server
   # NEXT_PUBLIC_DEFAULT_TRANSCRIPTION_MODE=browser
   ```

4. Configure runtime mode and defaults:

   ```
   # false => local defaults, true => cloud defaults
   PROD=false
   ```

   You can still override defaults with:
   - RECORDINGS_PERSISTENCE_MODE=local|mongodb
   - AUDIO_STORAGE_MODE=local|s3

5. (Optional) Enable background queue workers:

   ```
   ENABLE_JOB_QUEUE=true
   REDIS_URL=redis://localhost:6379
   ```

6. Run the development server:

   ```bash
   npm run dev
   ```

7. If queue is enabled, run the worker in a separate terminal:

   ```bash
   npm run worker:recordings
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

Runtime validation is strict in production mode. Startup will fail fast when
required variables are missing for the configured provider/storage modes.

Required by selected configuration:

- `AI_PROVIDER=google` => `GOOGLE_API_KEY`
- `AI_PROVIDER=openai` => `OPENAI_API_KEY`
- `RECORDINGS_PERSISTENCE_MODE=mongodb` (or `PROD=true` default) => `DATABASE_URL`
- `AUDIO_STORAGE_MODE=s3` (or `PROD=true` default) => `AWS_S3_BUCKET`, `AWS_S3_REGION`
- `ENABLE_JOB_QUEUE=true` => `REDIS_URL`

### Migrating Existing Local Recordings to MongoDB

If you already have local recordings in data/recordings.json and want to move
them into MongoDB before production cutover:

1. Configure DATABASE_URL in .env.local to point to your MongoDB database.
2. Ensure Prisma schema is pushed:

```bash
npm run prisma:push
```

3. Run the migration script:

```bash
npm run migrate:recordings
```

The migration uses idempotent upserts keyed by externalId, so rerunning it is safe.

## Usage

1. **Create a new recording** — click "New Recording" and either record live audio or upload an audio file. Optionally enter the patient and doctor names.
2. **Transcribe** — on the recording detail page, click "Transcribe Audio" to convert the audio to text using the configured AI provider.
3. **Generate Report** — click "Generate Report" to create a structured medical report from the transcript using the configured AI provider.
4. Lowest-AI default flow: Browser API transcription first, then generate report when needed.
5. The report includes: chief complaint, symptoms, medical history, examination findings, assessment, diagnosis, treatment plan, medications, and follow-up instructions.

## Technology Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Google Generative AI](https://ai.google.dev/) (Gemini)
- [OpenAI API](https://platform.openai.com/) (optional fallback)

## Disclaimer

AI-generated reports are for reference only and must be reviewed and verified by the attending physician before use in official patient records.
