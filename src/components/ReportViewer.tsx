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
    <div className="py-4 border-b border-slate-100 last:border-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 mb-1">
        {label}
      </dt>
      <dd className="text-sm text-slate-700">
        {Array.isArray(value) ? (
          <ul className="list-disc list-inside space-y-1">
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
    <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-soft">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
              Clinical Summary
            </p>
            <h2 className="text-xl font-semibold">Medical Report</h2>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-300">
            {report.date && <span>Date: {report.date}</span>}
            {report.patientName && <span>Patient: {report.patientName}</span>}
            {report.doctorName && <span>Doctor: Dr. {report.doctorName}</span>}
          </div>
        </div>
      </div>

      <dl className="px-6 py-2 divide-y divide-slate-100">
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

      <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          This report is AI-generated and should be reviewed by the attending
          physician before use in patient records.
        </p>
      </div>
    </div>
  );
}
