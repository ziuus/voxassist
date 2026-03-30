"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import RecordingCard from "@/components/RecordingCard";
import { Recording, RecordingStatus } from "@/lib/types";

type DashboardClientProps = {
  recordings: Recording[];
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1 },
};

const staggerParent = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

export default function DashboardClient({ recordings }: DashboardClientProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RecordingStatus>(
    "all"
  );

  const heroRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const orbitY = useTransform(heroProgress, [0, 1], [0, -120]);
  const orbitX = useTransform(heroProgress, [0, 1], [0, 80]);
  const heroScale = useTransform(heroProgress, [0, 1], [1, 0.92]);

  const stats = useMemo(
    () => ({
      total: recordings.length,
      completed: recordings.filter((r) => r.status === "completed").length,
      transcribed: recordings.filter((r) => r.status === "transcribed").length,
      pending: recordings.filter((r) =>
        ["pending", "transcribing", "generating_report"].includes(r.status)
      ).length,
    }),
    [recordings]
  );

  const filteredRecordings = useMemo(() => {
    const search = query.trim().toLowerCase();

    return recordings.filter((recording) => {
      if (statusFilter !== "all" && recording.status !== statusFilter) {
        return false;
      }

      if (!search) {
        return true;
      }

      const haystack = [
        recording.title,
        recording.patientName,
        recording.doctorName,
        recording.report?.diagnosis,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [recordings, query, statusFilter]);

  return (
    <div className="space-y-16">
      <motion.section
        ref={heroRef}
        className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-start"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{ scale: heroScale }}
      >
        <motion.div className="space-y-8 relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <motion.div
            style={{ y: orbitY, x: orbitX }}
            className="pointer-events-none absolute -top-16 -left-12 h-48 w-48 rounded-full bg-emerald-200/50 blur-3xl"
          />
          <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200/70 bg-white/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-emerald-700 shadow-soft relative z-10">
            Live Workspace
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-slate-900 relative z-10">
            Your recordings,
            <span className="text-gradient"> streamlined.</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl relative z-10">
            Minimal, fast, and review-first.
          </p>
          <div className="flex flex-wrap gap-3 relative z-10">
            <Link
              href="/recordings/new"
              className="inline-flex items-center gap-3 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800 hover:-translate-y-0.5"
            >
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
              Start a live recording
            </Link>
            <Link
              href="/recordings/new"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white hover:-translate-y-0.5"
            >
              Upload existing audio
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="liquid-glass rounded-3xl p-6 sm:p-8 glow-ring depth-tilt"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
          whileHover={{ rotateX: 4, rotateY: -5, y: -6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
                Today
              </p>
              <p className="text-2xl font-semibold text-slate-900">Signal board</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v9m0 0l3-3m-3 3l-3-3m8 6a5 5 0 11-10 0" />
              </svg>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            {[
              { label: "Total Sessions", value: stats.total, colorClass: "text-slate-900" },
              { label: "Reports Signed", value: stats.completed, colorClass: "text-emerald-600" },
              { label: "Transcripts Ready", value: stats.transcribed, colorClass: "text-blue-600" },
              { label: "In Progress", value: stats.pending, colorClass: "text-amber-600" },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-soft"
                whileHover={{ y: -3, scale: 1.03, rotateX: 2 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
              >
                <div className={`text-3xl font-semibold ${stat.colorClass}`}>{stat.value}</div>
                <div className="mt-1 text-xs font-medium text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.section>

      <section>
        <motion.div
          className="liquid-glass rounded-3xl p-6 sm:p-8"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Recent recordings</h2>
            </div>
            <Link
              href="/recordings/new"
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800"
            >
              New recording
            </Link>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recordings"
              className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-2.5 text-sm text-slate-700 outline-none ring-teal-300 transition focus:ring-2"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | RecordingStatus)}
              className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 text-sm text-slate-700 outline-none ring-teal-300 transition focus:ring-2"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="transcribing">Transcribing</option>
              <option value="transcribed">Transcribed</option>
              <option value="generating_report">Generating report</option>
              <option value="completed">Completed</option>
              <option value="error">Error</option>
            </select>
          </div>

          {filteredRecordings.length === 0 ? (
            <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-white/80 p-10 text-center">
              <h3 className="text-lg font-semibold text-slate-900">No matching recordings</h3>
              <p className="text-sm text-slate-500 mt-2">Try another filter.</p>
            </div>
          ) : (
            <motion.div
              className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              variants={staggerParent}
              initial="hidden"
              animate="show"
            >
              {filteredRecordings.map((recording) => (
                <motion.div
                  key={recording.id}
                  variants={cardVariants}
                  transition={{ duration: 0.32, ease: "easeOut" }}
                  whileHover={{ rotateX: 3, rotateY: -3, y: -4 }}
                  className="depth-tilt"
                >
                  <RecordingCard recording={recording} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </section>
    </div>
  );
}
