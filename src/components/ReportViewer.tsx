import { MedicalReport } from "@/lib/types";

interface ReportViewerProps {
  report: MedicalReport;
}

interface ReportSection {
  label: string;
  value: string | string[] | undefined;
}

function ReportField({ label, value }: ReportSection) {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;

  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
        {label}
      </dt>
      <dd className="text-sm text-gray-800">
        {Array.isArray(value) ? (
          <ul className="list-disc list-inside space-y-0.5">
            {value.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="whitespace-pre-wrap">{value}</p>
        )}
      </dd>
    </div>
  );
}

export default function ReportViewer({ report }: ReportViewerProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Report Header */}
      <div className="bg-blue-900 text-white px-6 py-4">
        <h2 className="text-lg font-bold">Medical Report</h2>
        <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm text-blue-200">
          {report.date && <span>Date: {report.date}</span>}
          {report.patientName && <span>Patient: {report.patientName}</span>}
          {report.doctorName && <span>Doctor: Dr. {report.doctorName}</span>}
        </div>
      </div>

      {/* Report Body */}
      <dl className="px-6 divide-y divide-gray-100">
        <ReportField
          label="Chief Complaint"
          value={report.chiefComplaint}
        />
        <ReportField label="Symptoms" value={report.symptoms} />
        <ReportField
          label="Medical History"
          value={report.medicalHistory}
        />
        <ReportField
          label="Examination Findings"
          value={report.examination}
        />
        <ReportField label="Assessment" value={report.assessment} />
        <ReportField label="Diagnosis" value={report.diagnosis} />
        <ReportField
          label="Treatment Plan"
          value={report.treatmentPlan}
        />
        <ReportField label="Medications" value={report.medications} />
        <ReportField
          label="Follow-up Instructions"
          value={report.followUp}
        />
        <ReportField
          label="Additional Notes"
          value={report.additionalNotes}
        />
      </dl>

      {/* Print hint */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          This report is AI-generated and should be reviewed by the attending
          physician before use in patient records.
        </p>
      </div>
    </div>
  );
}
