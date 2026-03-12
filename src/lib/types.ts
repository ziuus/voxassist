export interface MedicalReport {
  patientName?: string;
  doctorName?: string;
  date: string;
  chiefComplaint?: string;
  symptoms?: string[];
  medicalHistory?: string;
  examination?: string;
  assessment?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  medications?: string[];
  followUp?: string;
  additionalNotes?: string;
}

export type RecordingStatus =
  | "pending"
  | "transcribing"
  | "transcribed"
  | "generating_report"
  | "completed"
  | "error";

export interface Recording {
  id: string;
  title: string;
  patientName?: string;
  doctorName?: string;
  date: string;
  status: RecordingStatus;
  audioFileName?: string;
  duration?: number;
  transcript?: string;
  report?: MedicalReport;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateRecordingInput = Pick<
  Recording,
  "title" | "patientName" | "doctorName" | "date"
>;
