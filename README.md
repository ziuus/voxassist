# 🎙️ VoxAssist

> **Agentic Medical Intelligence — Transforming doctor-patient conversations into structured, HIPAA-hardened clinical intelligence.**

VoxAssist is a world-class, agentic voice assistant designed for medical professionals. It leverages **Gemini-2.0** to transcribe consultations, generate deep clinical reports, and provide a **RAG-powered chat** interface for querying patient history with zero latency.

## ⚡ Core Capabilities

- **Agentic RAG Chat**: "Ask Dr. Vox" — Query thousands of past recordings and reports using neural retrieval and clinical synthesis.
- **Cinematic UI/UX**: A high-performance, glassmorphic dashboard built on **Antigravity Master UI** principles with GSAP kinetic physics.
- **HIPAA-Hardened Infrastructure**: Fully migrated to **Supabase** with strict Row-Level Security (RLS) and end-to-end encrypted pathways.
- **Template-Aware AI**: Dynamically generates SOAP notes and medical reports based on custom, user-defined clinical templates.
- **Multi-Modal Audio**: High-fidelity support for live recording and file uploads (MP3, WAV, M4A, etc.) with browser-based fallback.

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4 + Antigravity Master UI (Custom CSS Modules)
- **Database**: Supabase (PostgreSQL + RLS)
- **Intelligence**: Google Gemini-2.0 (Primary) / OpenAI (Fallback)
- **Motion**: GSAP + Lenis Smooth Scroll
- **ORM**: Prisma (for legacy/management tasks)

## 🚀 Getting Started

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env.local` and provide your **Supabase** and **Gemini API** credentials.

3. **Database Setup**:
   Apply the HIPAA-hardened schema found in `supabase_voxassist_schema.sql` to your Supabase project.

4. **Run Development**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `src/app/chat`: Agentic RAG interface.
- `src/app/recordings`: Audio processing and report generation logic.
- `src/app/settings/report-templates`: Custom clinical template management.
- `src/lib/storage.ts`: Supabase-backed persistence layer.

---
*VoxAssist: Neural Infrastructure for the Modern Clinic.*
