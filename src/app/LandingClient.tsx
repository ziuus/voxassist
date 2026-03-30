"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Recording } from "@/lib/types";
import { HeroModern } from "@/components/HeroModern";
import { cn } from "@/lib/utils";

type LandingClientProps = {
  recordings: Recording[];
};

export default function LandingClient({ recordings }: LandingClientProps) {
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
    <div className="space-y-32 pb-20 px-4 sm:px-6">
      <HeroModern />

      {/* Features Section */}
      <section className="relative z-10 mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Next-Gen Capabilities</h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Everything a modern clinic needs.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="group relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-800 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-slate-100 dark:border-slate-700 transition-all hover:shadow-[0_8px_30px_rgb(16,185,129,0.15)]"
            >
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-emerald-50 dark:bg-emerald-900/20 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-500 ease-out" />
              <div className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm mb-6 relative z-10 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 group-hover:border-emerald-100 dark:group-hover:border-emerald-700 transition-colors">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white relative z-10">{feature.title}</h3>
              <p className="mt-3 text-slate-500 dark:text-slate-400 text-sm leading-relaxed relative z-10 font-medium">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* RAG Teaser / Demo */}
      <section className="relative mx-auto max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.4 }}
          className="rounded-[3rem] bg-slate-900 dark:bg-slate-950 p-10 sm:p-16 text-center text-white overflow-hidden relative shadow-2xl"
        >
          {/* Animated background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[600px] bg-emerald-500/20 blur-[120px] rounded-full opacity-50" />
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
          
          <div className="relative z-10">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-block rounded-full bg-emerald-500/10 text-emerald-400 px-4 py-1.5 text-xs font-semibold tracking-widest uppercase border border-emerald-500/20"
            >
              Coming Soon
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-4xl sm:text-5xl font-semibold tracking-tight text-white"
            >
              Ask your medical data.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              We're integrating RAG (Retrieval-Augmented Generation). Soon, you'll be able to instantly query thousands of past reports, patient histories, and clinical guidelines.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-12"
            >
              <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md text-left shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <div className="flex items-center gap-3 text-sm text-slate-300 font-medium">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  "What was John Doe's blood pressure last visit?"
                </div>
                <div className="mt-5 flex gap-3 text-sm text-emerald-50 bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center shrink-0 text-white font-bold text-[10px]">AI</div>
                  <p className="leading-relaxed">John Doe's BP was 120/80 on March 15, 2026. He was prescribed Lisinopril 10mg.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">Simple, transparent pricing.</h2>
        <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium">Run it entirely locally for free, or connect your own API keys.</p>
        
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <motion.div 
            whileHover={{ y: -8 }}
            className="rounded-[2.5rem] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 sm:p-10 transition-all shadow-sm hover:shadow-xl text-left flex flex-col"
          >
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Local Only</h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white">$0</span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">/ forever</span>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">Perfect for individuals who want maximum privacy using built-in browser features.</p>
            <ul className="mt-8 space-y-4 text-sm text-slate-700 dark:text-slate-300 font-medium flex-1">
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Browser Web Speech API</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>100% Local data storage</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Unlimited recordings</li>
            </ul>
            <Link href="/recordings/new" className="mt-8 block w-full rounded-full border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white transition hover:border-slate-900 dark:hover:border-white hover:bg-slate-50 dark:hover:bg-slate-600">
              Start Free
            </Link>
          </motion.div>
          
          <motion.div 
            whileHover={{ y: -8 }}
            className="rounded-[2.5rem] border border-slate-900 dark:border-slate-700 bg-slate-900 dark:bg-slate-800 p-8 sm:p-10 text-white dark:text-white relative shadow-xl text-left flex flex-col"
          >
            <div className="absolute top-0 right-8 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-900 shadow-sm">
              Recommended
            </div>
            <h3 className="text-xl font-semibold dark:text-white">Bring Your Own Key</h3>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-5xl font-bold tracking-tight text-white dark:text-white">API</span>
              <span className="text-slate-400 dark:text-slate-400 font-medium">costs only</span>
            </div>
            <p className="mt-4 text-sm text-slate-400 dark:text-slate-400 leading-relaxed">Connect your Google Gemini or OpenAI keys for advanced AI processing capabilities.</p>
            <ul className="mt-8 space-y-4 text-sm text-slate-300 dark:text-slate-300 flex-1">
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Advanced AI Transcription</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Automated SOAP Reports</li>
              <li className="flex items-center gap-3"><svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>RAG Data Search (Coming)</li>
            </ul>
            <Link href="/settings" className="mt-8 block w-full rounded-full bg-white dark:bg-white py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-900 transition hover:bg-slate-100 dark:hover:bg-slate-200">
              Add API Key
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
