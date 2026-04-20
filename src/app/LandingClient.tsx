"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Recording } from "@/lib/types";
import { HeroModern } from "@/components/HeroModern";

type LandingClientProps = {
  recordings: Recording[];
};

export default function LandingClient({ recordings }: LandingClientProps) {
  const featuresRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // GSAP entrance for feature cards
    if (featuresRef.current) {
      const cards = featuresRef.current.querySelectorAll(".feature-card");
      gsap.fromTo(cards, 
        { 
          opacity: 0, 
          y: 60,
          scale: 0.9,
          rotationX: 15
        },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1,
          rotationX: 0,
          duration: 1.2, 
          stagger: 0.15, 
          ease: "elastic.out(1, 0.8)",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
          }
        }
      );
    }

    // Magnetic effect for cards
    const cards = document.querySelectorAll(".feature-card");
    cards.forEach((card) => {
      card.addEventListener("mousemove", (e: any) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        gsap.to(card, {
          x: x * 0.15,
          y: y * 0.15,
          duration: 0.6,
          ease: "power2.out",
        });
      });
      
      card.addEventListener("mouseleave", () => {
        gsap.to(card, {
          x: 0,
          y: 0,
          duration: 0.6,
          ease: "elastic.out(1.2, 0.5)",
        });
      });
    });
  }, []);

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
    <div className="space-y-40 pb-32">
      <HeroModern />

      {/* Features Section */}
      <section ref={featuresRef} className="relative z-10 mx-auto max-w-6xl px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight sm:text-5xl">Next-Gen Capabilities</h2>
          <p className="mt-4 text-slate-500 dark:text-slate-400 font-medium text-lg italic">Engineering the future of clinical intelligence.</p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3 perspective-1000">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="feature-card group relative overflow-hidden rounded-[2.5rem] bg-white/70 dark:bg-black/40 p-10 border border-slate-100 dark:border-white/5 backdrop-blur-xl transition-all hover:border-emerald-500/30 dark:hover:border-[#68BA7F]/30"
            >
              {/* Emerald Glow Protocol Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#68BA7F]/0 to-[#68BA7F]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="h-14 w-14 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[#68BA7F] flex items-center justify-center shadow-sm mb-8 relative z-10 group-hover:scale-110 transition-transform duration-500 emerald-glow">
                {feature.icon}
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white relative z-10 group-hover:text-glow transition-all">
                {feature.title}
              </h3>
              <p className="mt-4 text-slate-500 dark:text-slate-400 text-base leading-relaxed relative z-10 font-medium">
                {feature.description}
              </p>
              
              {/* Interactive bottom indicator */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#68BA7F] group-hover:w-full transition-all duration-700 ease-out" />
            </div>
          ))}
        </div>
      </section>

      {/* RAG Section - Enhanced Cinematic Vibe */}
      <section className="relative mx-auto max-w-5xl px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98, y: 50 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[4rem] bg-black p-12 sm:p-24 text-center text-white overflow-hidden relative shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5"
        >
          {/* Intense Aurora Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-[140%] bg-[radial-gradient(circle_at_center,rgba(104,186,127,0.15)_0%,transparent_60%)] blur-[100px] pointer-events-none" />
          
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)] opacity-50" />
          
          <div className="relative z-10">
            <span className="inline-block rounded-full bg-[#68BA7F]/10 text-[#68BA7F] px-6 py-2 text-[10px] font-bold tracking-[0.2em] uppercase border border-[#68BA7F]/20 mb-10">
              Protocol: Agentic Intelligence
            </span>
            <h2 className="text-5xl sm:text-7xl font-bold tracking-tighter text-white mb-8">
              Ask your medical data.
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium mb-16">
              Integrating high-performance RAG to query patient histories and clinical guidelines with zero latency.
            </p>
            
            <div className="mx-auto max-w-lg rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl text-left shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-[#68BA7F] shadow-[0_0_20px_rgba(104,186,127,0.5)]" />
              <div className="flex items-center gap-4 text-base text-slate-200 font-semibold mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-[#68BA7F] animate-pulse" />
                "What was John Doe's BP history?"
              </div>
              <div className="flex gap-4 text-sm text-slate-300 bg-black/40 p-6 rounded-2xl border border-white/5 group-hover:bg-black/60 transition-colors duration-500">
                <div className="w-8 h-8 rounded-lg bg-[#68BA7F] flex items-center justify-center shrink-0 text-black font-black text-xs">AI</div>
                <p className="leading-relaxed font-medium">Stable at 120/80 (March 2026). Currently managed with Lisinopril 10mg. No adverse events reported.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
