import { MedicalReport } from "./types";

export type EHRSystem = "Epic" | "Cerner" | "Athena" | "Generic";

export function formatReportForEHR(report: MedicalReport, system: EHRSystem): string {
  const sections = [];

  switch (system) {
    case "Epic":
      sections.push(`.HPI\n${report.chiefComplaint}\n${report.symptoms?.join(", ")}`);
      sections.push(`.ROS\n${report.medicalHistory}`);
      sections.push(`.PHYS\n${report.examination}`);
      sections.push(`.ASSESS\n${report.assessment}`);
      sections.push(`.PLAN\n${report.treatmentPlan}\n${report.medications?.join(", ")}`);
      break;

    case "Cerner":
      sections.push(`Subjective: ${report.chiefComplaint}\nSymptoms: ${report.symptoms?.join(", ")}`);
      sections.push(`Objective: ${report.examination}`);
      sections.push(`Assessment: ${report.assessment}`);
      sections.push(`Plan: ${report.treatmentPlan}`);
      break;

    default:
      sections.push(`CHIEF COMPLAINT: ${report.chiefComplaint}`);
      sections.push(`SYMPTOMS: ${report.symptoms?.join(", ")}`);
      sections.push(`ASSESSMENT: ${report.assessment}`);
      sections.push(`TREATMENT PLAN: ${report.treatmentPlan}`);
  }

  return sections.join("\n\n");
}
