import Link from "next/link";
import { getAllRecordings } from "@/lib/storage";
import RecordingCard from "@/components/RecordingCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const recordings = getAllRecordings();

  const stats = {
    total: recordings.length,
    completed: recordings.filter((r) => r.status === "completed").length,
    transcribed: recordings.filter((r) => r.status === "transcribed").length,
    pending: recordings.filter((r) =>
      ["pending", "transcribing", "generating_report"].includes(r.status)
    ).length,
  };

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Welcome to VoxAssist
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Record doctor-patient conversations and automatically generate
          structured medical reports using AI.
        </p>
        <Link
          href="/recordings/new"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Recording
        </Link>
      </div>

      {/* Stats */}
      {recordings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Recordings", value: stats.total, colorClass: "text-blue-600" },
            {
              label: "Reports Generated",
              value: stats.completed,
              colorClass: "text-green-600",
            },
            { label: "Transcribed", value: stats.transcribed, colorClass: "text-purple-600" },
            { label: "Pending", value: stats.pending, colorClass: "text-yellow-600" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-gray-200 p-4 text-center"
            >
              <div className={`text-3xl font-bold mb-1 ${stat.colorClass}`}>
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recordings List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Recordings
          </h2>
          {recordings.length > 0 && (
            <Link
              href="/recordings/new"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + New
            </Link>
          )}
        </div>

        {recordings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <p className="text-gray-500 font-medium mb-2">
              No recordings yet
            </p>
            <p className="text-sm text-gray-400 mb-6">
              Start by recording a doctor-patient conversation
            </p>
            <Link
              href="/recordings/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-full transition-colors"
            >
              Create your first recording
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recordings.map((recording) => (
              <RecordingCard key={recording.id} recording={recording} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
