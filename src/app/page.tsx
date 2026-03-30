"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  const features = [
    {
      title: "Real-time Transcription",
      description: "Local, browser-based voice transcription ensuring complete patient privacy.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      )
    },
    {
      title: "AI Medical Reports",
      description: "Automatically generates SOAP notes, diagnoses, and treatment plans from conversations.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: "RAG Data Retrieval",
      description: "Ask questions about past patient history and medical reports instantly.",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <motion.section 
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative overflow-hidden rounded-[3rem] border border-white/70 bg-white/60 p-8 shadow-[0_30px_80px_-55px_rgba(15,23,42,0.45)] backdrop-blur-3xl sm:p-16 lg:p-24"
      >
        <div className="pointer-events-none absolute inset-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0] 
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/40 blur-[100px]" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.5, 1],
              rotate: [0, -90, 0] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-32 right-10 h-80 w-80 rounded-full bg-blue-200/40 blur-[100px]" 
          />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-4 py-1.5 text-[11px] font-semibold tracking-[0.2em] text-emerald-700 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              VoxAssist 2.0
            </p>
            <h1 className="mt-8 text-5xl font-semibold tracking-tight text-slate-900 sm:text-7xl lg:text-8xl">
              Clinical notes,
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                effortlessly.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base text-slate-600 sm:text-lg">
              The AI voice assistant that listens, transcribes, and writes medical reports automatically. Private, local, and review-ready.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/dashboard"
                className="group relative overflow-hidden rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                <span className="relative z-10">Go to Dashboard</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-slate-900">Next-Gen Capabilities</h2>
          <p className="mt-4 text-slate-500">Everything a modern clinic needs.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="liquid-glass rounded-3xl p-8 border border-white/50 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-100/50 to-blue-100/50 blur-2xl group-hover:scale-150 transition-transform duration-500" />
              <div className="h-12 w-12 rounded-2xl bg-white/80 border border-slate-100 text-slate-700 flex items-center justify-center shadow-soft mb-6 relative z-10">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 relative z-10">{feature.title}</h3>
              <p className="mt-3 text-slate-500 text-sm leading-relaxed relative z-10">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* RAG Teaser / Demo */}
      <section className="relative mx-auto max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-[3rem] bg-slate-900 p-10 sm:p-16 text-center text-white overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.apply')] opacity-10 mix-blend-overlay" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />
          
          <div className="relative z-10">
            <span className="rounded-full bg-emerald-500/20 text-emerald-300 px-4 py-1.5 text-xs font-semibold tracking-widest uppercase border border-emerald-500/30">
              Coming Soon
            </span>
            <h2 className="mt-8 text-4xl sm:text-5xl font-semibold tracking-tight">
              Ask your medical data.
            </h2>
            <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto">
              We're integrating RAG (Retrieval-Augmented Generation). Soon, you'll be able to instantly query thousands of past reports, patient histories, and clinical guidelines.
            </p>
            <div className="mt-10">
              <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur text-left">
                <div className="flex items-center gap-3 text-sm text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  "What was John Doe's blood pressure last visit?"
                </div>
                <div className="mt-4 flex gap-3 text-sm text-emerald-300">
                  <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">AI</div>
                  <p>John Doe's BP was 120/80 on March 15, 2026. He was prescribed Lisinopril.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Pricing simple */}
      <section className="mx-auto max-w-4xl px-4 text-center">
        <h2 className="text-3xl font-semibold text-slate-900">Simple, local pricing.</h2>
        <p className="mt-4 text-slate-500">Run it entirely locally for free, or connect your own API keys.</p>
        
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 hover:border-emerald-200 hover:shadow-xl transition-all">
            <h3 className="text-xl font-semibold">Local Only</h3>
            <div className="mt-4 text-4xl font-semibold tracking-tight">$0</div>
            <ul className="mt-8 space-y-3 text-sm text-slate-600 text-left">
              <li className="flex items-center gap-2">✓ Browser Web Speech API</li>
              <li className="flex items-center gap-2">✓ Local data storage</li>
              <li className="flex items-center gap-2">✓ Unlimited recordings</li>
            </ul>
          </div>
          <div className="rounded-[2.5rem] border border-slate-900 bg-slate-900 p-8 text-white relative shadow-2xl">
            <div className="absolute top-0 right-8 -translate-y-1/2 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              Recommended
            </div>
            <h3 className="text-xl font-semibold">Bring Your Own Key</h3>
            <div className="mt-4 text-4xl font-semibold tracking-tight text-white">Pay per use</div>
            <ul className="mt-8 space-y-3 text-sm text-slate-300 text-left">
              <li className="flex items-center gap-2">✓ Google Gemini Integration</li>
              <li className="flex items-center gap-2">✓ Automated SOAP Reports</li>
              <li className="flex items-center gap-2">✓ High accuracy models</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
