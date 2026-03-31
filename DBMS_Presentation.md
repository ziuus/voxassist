# VoxAssist DBMS Project Presentation

---

## 1. Project Overview
- **Project Name:** VoxAssist
- **Description:** A modern web app for recording, transcribing, and generating AI-powered medical reports from doctor-patient conversations.
- **Tech Stack:** Next.js, TypeScript, Prisma, MongoDB, Google Gemini/OpenAI, Tailwind CSS.

---


## 2. Features
- Record conversations (browser mic)
- Upload audio files (MP3, WAV, etc.)
- Browser-based and AI transcription
- AI-generated structured medical reports (SOAP notes, diagnosis, treatment)
- Dashboard for managing recordings/reports
- Live filtering and search
- Retry failed processing
- **Modern, cinematic UI/UX** with glassmorphism, Aurora backgrounds, and kinetic motion
- **Drag-and-drop custom report template builder** for doctors
- **Animated modals and beautiful feedback** for template management

---


## 3. Database Design
- **DBMS Used:** MongoDB (via Prisma ORM)
- **Collections:**
  - **User**: Doctors and staff using the system
  - **Patient**: Patient records
  - **Recording**: Audio sessions and their metadata
  - **MedicalReport**: Embedded in Recording, stores structured report data
  - **ReportTemplate**: Stores default and custom report formats for each doctor
  - **Account, Session, VerificationToken**: For authentication (NextAuth)

### Example: Recording Collection
```json
{
  "_id": "...",
  "externalId": "rec_123",
  "userId": "user_abc",
  "title": "Consultation with John Doe",
  "patientName": "John Doe",
  "doctorName": "Dr. Smith",
  "date": "2026-03-31T10:00:00Z",
  "status": "completed",
  "audioFileName": "rec_123.mp3",
  "transcript": "Patient complains of...",
  "report": { /* see MedicalReport example */ },
  "createdAt": "2026-03-31T10:00:00Z",
  "updatedAt": "2026-03-31T10:30:00Z"
}
```

### Example: MedicalReport (embedded)
```json
{
  "patientName": "John Doe",
  "doctorName": "Dr. Smith",
  "date": "2026-03-31",
  "chiefComplaint": "Headache",
  "symptoms": ["Headache", "Nausea"],
  "diagnosis": "Migraine",
  "treatmentPlan": "Prescribed medication",
  "medications": ["Paracetamol"],
  "followUp": "In 2 weeks"
}
```

### Example: ReportTemplate Collection
```json
{
  "_id": "template_001",
  "userId": "user_abc",
  "name": "SOAP Note",
  "fields": [
    "chiefComplaint",
    "symptoms",
    "medicalHistory",
    "examination",
    "assessment",
    "diagnosis",
    "treatmentPlan",
    "medications",
    "followUp"
  ],
  "isDefault": true,
  "createdAt": "2026-03-01T09:00:00Z"
}
```


**Doctors can create custom templates** with a modern drag-and-drop interface, animated modals, and real-time feedback. The system provides default templates (e.g., SOAP, summary) for all users. Templates can be visually reordered, edited, and set as default with a single click.

---

## 4. Database Events & Operations
- **Insert:** New recording created (audio upload or live)
- **Update:** Status changes (transcribing, completed, error, etc.), transcript and report generation
- **Delete:** (Optional) Remove old or failed recordings
- **Migration:** Script to migrate local JSON recordings to MongoDB (idempotent upsert by externalId)
- **Authentication:** User sessions managed via NextAuth, Prisma adapter

---


## 5. Workflow & Data Flow


### Step-by-step Workflow
1. **Doctor logs in** (Google OAuth)
2. **Doctor creates or selects a report template** using a modern, glassmorphic UI with drag-and-drop field ordering and animated modals
3. **Doctor records or uploads audio** for a patient session
4. **Audio is stored** (local or S3)
5. **Transcription** is performed (browser or AI)
6. **Transcript is saved** to the Recording document
7. **AI generates a medical report** using the selected template (fields and order)
8. **Report is saved** in the Recording document
9. **Doctor reviews/edits the report** if needed
10. **Dashboard** displays all recordings, reports, and templates


### Example Workflow Diagram (Text)

Doctor → [Login] → [Modern Template Builder (Drag/Drop, Modal)] → [Record/Upload Audio] → [Transcribe] → [Save Transcript] → [Generate Report (AI, Custom Fields)] → [Save Report] → [Review/Edit] → [Dashboard]

---

## 6. Security & Access
- Authenticated routes (dashboard, recordings, chat, settings)
- User authentication via Google OAuth (NextAuth)
- Data privacy: local transcription option, secure storage

---


## 7. Example Collections

### User
```json
{
  "_id": "user_abc",
  "name": "Dr. Smith",
  "email": "dr.smith@clinic.com"
}
```

### Patient
```json
{
  "_id": "pat_001",
  "fullName": "John Doe",
  "userId": "user_abc"
}
```

### Recording
```json
{
  "_id": "rec_123",
  "title": "Consultation with John Doe",
  "patientName": "John Doe",
  "doctorName": "Dr. Smith",
  "date": "2026-03-31T10:00:00Z",
  "status": "completed",
  "transcript": "Patient complains of...",
  "report": { /* see MedicalReport example */ },
  "createdAt": "2026-03-31T10:00:00Z"
}
```

### ReportTemplate (Default Example)
```json
{
  "_id": "template_default_soap",
  "userId": null,
  "name": "SOAP Note",
  "fields": ["chiefComplaint", "symptoms", "diagnosis", "treatmentPlan", "medications", "followUp"],
  "isDefault": true
}
```

### ReportTemplate (Custom Example)
```json
{
  "_id": "template_custom_002",
  "userId": "user_abc",
  "name": "Pediatric Visit",
  "fields": ["chiefComplaint", "symptoms", "vaccinationStatus", "growthChart", "diagnosis", "treatmentPlan"],
  "isDefault": false
}
```

---


## 8. Example Database Events
- **On new recording:** Insert Recording document with status "pending"
- **On transcription complete:** Update status to "transcribed", save transcript
- **On report generation:**
  - Use selected ReportTemplate (custom or default)
  - AI generates report with specified fields/order
  - Save report in Recording
- **On template creation:** Insert new ReportTemplate for doctor

---

## 9. Migration Example
- Script reads from `data/recordings.json`
- Upserts each entry into MongoDB using Prisma

---



## 10. Conclusion
- Modern, scalable medical data assistant
- Secure, structured, and AI-powered
- Doctors can use default or custom report formats with a premium, cinematic UI
- Drag-and-drop template builder and animated feedback for best-in-class UX
- Extensible for future features (e.g., RAG, vector search, more template types)

---
