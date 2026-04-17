"use client";

import { useState } from "react";
import { MedicalReport } from "@/lib/types";
import { EHRSystem, formatReportForEHR } from "@/lib/smartCopy";
import { Copy, Check, ChevronDown } from "lucide-react";

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
  const [copied, setCopied] = useState(false);
  const [showEHRMenu, setShowEHRMenu] = useState(false);

  const handleSmartCopy = (system: EHRSystem) => {
    const formatted = formatReportForEHR(report, system);
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setShowEHRMenu(false);
    setTimeout(() => setCopied(false), 2000);
  };

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
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setShowEHRMenu(!showEHRMenu)}
                className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Smart Copy
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
              
              {showEHRMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {(["Epic", "Cerner", "Athena", "Generic"] as EHRSystem[]).map((system) => (
                    <button
                      key={system}
                      onClick={() => handleSmartCopy(system)}
                      className="w-full px-4 py-2.5 text-left text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Copy for {system}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="hidden sm:flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-300 border-l border-white/10 pl-6 ml-3">
              {report.date && <span>Date: {report.date}</span>}
              {report.patientName && <span>Patient: {report.patientName}</span>}
            </div>
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

        {report.billingCodes && (
          <div className="py-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600 mb-3">
              Medical Billing Codes (Suggested)
            </dt>
            <dd className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.billingCodes.icd10 && report.billingCodes.icd10.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">ICD-10 (Diagnosis)</h4>
                  <ul className="space-y-2">
                    {report.billingCodes.icd10.map((code, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mr-2">{code.code}</span>
                        <span className="text-slate-600">{code.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {report.billingCodes.cpt && report.billingCodes.cpt.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">CPT (Procedure)</h4>
                  <ul className="space-y-2">
                    {report.billingCodes.cpt.map((code, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded mr-2">{code.code}</span>
                        <span className="text-slate-600">{code.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </dd>
          </div>
        )}
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
