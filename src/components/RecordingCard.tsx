import Link from "next/link";
import { Recording } from "@/lib/types";

interface RecordingCardProps {
  recording: Recording;
}

const statusConfig: Record<
  Recording["status"],
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Pending", color: "text-yellow-700", bg: "bg-yellow-100" },
  transcribing: {
    label: "Transcribing…",
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  transcribed: {
    label: "Transcribed",
    color: "text-purple-700",
    bg: "bg-purple-100",
  },
  generating_report: {
    label: "Generating Report…",
    color: "text-orange-700",
    bg: "bg-orange-100",
  },
  completed: {
    label: "Report Ready",
    color: "text-green-700",
    bg: "bg-green-100",
  },
  error: { label: "Error", color: "text-red-700", bg: "bg-red-100" },
};

export default function RecordingCard({ recording }: RecordingCardProps) {
  const status = statusConfig[recording.status];
  const date = new Date(recording.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Link href={`/recordings/${recording.id}`}>
      <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {recording.title}
            </h3>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
              {recording.patientName && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {recording.patientName}
                </span>
              )}
              {recording.doctorName && (
                <span className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Dr. {recording.doctorName}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">{date}</p>
          </div>
          <span
            className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}
          >
            {status.label}
          </span>
        </div>

        {recording.report?.diagnosis && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2 border-t border-gray-100 pt-3">
            <span className="font-medium">Diagnosis:</span>{" "}
            {recording.report.diagnosis}
          </p>
        )}

        {recording.errorMessage && (
          <p className="mt-2 text-xs text-red-600 truncate">
            {recording.errorMessage}
          </p>
        )}
      </div>
    </Link>
  );
}
