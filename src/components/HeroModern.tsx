"use client";

import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

// Floating geometric shapes
function FloatingShape({ 
  className, 
  delay = 0, 
  duration = 20, 
  yOffset = 100 
}: { 
  className?: string, 
  delay?: number,
  duration?: number,
  yOffset?: number
}) {
  return (
    <motion.div
      animate={{
        y: [0, yOffset, 0],
        rotate: [0, 90, 180, 270, 360],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "linear",
        delay,
      }}
      className={cn("absolute rounded-full opacity-20 blur-3xl", className)}
    />
  );
}

// Medical cross icon that rotates
function MedicalCross({ className }: { className?: string }) {
  return (
    <motion.div 
      className={cn("relative flex items-center justify-center", className)}
      animate={{ rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    >
      <div className="absolute w-full h-[20%] bg-emerald-500 rounded-full" />
      <div className="absolute h-full w-[20%] bg-emerald-500 rounded-full" />
    </motion.div>
  );
}

export function HeroModern() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const springX = useSpring(mousePosition.x, { stiffness: 50, damping: 20 });
  const springY = useSpring(mousePosition.y, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMousePosition({ x: x * 50, y: y * 50 });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const isDark = mounted && theme === "dark";

  return (
    <section 
      ref={containerRef}
      className={cn(
        "relative min-h-[90vh] flex items-center justify-center overflow-hidden rounded-[2.5rem] mt-4 shadow-2xl",
        isDark 
          ? "bg-slate-950 text-white" 
          : "bg-gradient-to-b from-slate-50 to-white text-slate-900"
      )}
    >
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <div className={cn(
          "absolute inset-0",
          isDark 
            ? "bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,rgba(15,23,42,1)_100%)]" 
            : "bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08)_0%,rgba(248,250,252,1)_100%)]"
        )} />
        
        {/* Animated Shapes */}
        <FloatingShape 
          className={cn(
            "w-96 h-96 top-[-10%] left-[-10%]",
            isDark ? "bg-emerald-500/20" : "bg-emerald-400/15"
          )} 
          duration={25} 
          yOffset={150} 
        />
        <FloatingShape 
          className={cn(
            "w-[40rem] h-[40rem] bottom-[-20%] right-[-10%]",
            isDark ? "bg-blue-500/10" : "bg-blue-400/10"
          )} 
          delay={5} 
          duration={30} 
          yOffset={-200} 
        />
        <FloatingShape 
          className={cn(
            "w-64 h-64 top-[40%] left-[60%]",
            isDark ? "bg-teal-400/20" : "bg-teal-400/15"
          )} 
          delay={2} 
          duration={15} 
          yOffset={100} 
        />

        {/* Grid pattern overlay */}
        <div className={cn(
          "absolute inset-0 bg-[size:4rem_4rem]",
          isDark 
            ? "bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"
            : "bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]"
        )} />
      </div>

      {/* Content Layer */}
      <motion.div 
        style={{ y, opacity }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md mb-8",
            isDark 
              ? "border border-emerald-500/30 bg-emerald-500/10" 
              : "border border-emerald-200 bg-emerald-50"
          )}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className={cn(
            "text-xs font-medium tracking-wider uppercase",
            isDark ? "text-emerald-300" : "text-emerald-700"
          )}>
            The Future of Clinical Documentation
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1]"
        >
          Speak normally.
          <br />
          <span className={cn(
            "text-transparent bg-clip-text",
            isDark 
              ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500"
              : "bg-gradient-to-r from-emerald-600 via-teal-500 to-blue-600"
          )}>
            Let AI write the notes.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className={cn(
            "mt-6 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed",
            isDark ? "text-slate-400" : "text-slate-600"
          )}
        >
          VoxAssist runs entirely in your browser. Complete privacy, zero setup, and instantly structured SOAP notes from natural conversations.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="/recordings/new"
            className={cn(
              "group relative inline-flex items-center justify-center px-8 py-4 font-semibold transition-all duration-200 rounded-full w-full sm:w-auto",
              isDark 
                ? "text-white bg-emerald-600 hover:bg-emerald-500 hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]"
                : "text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg hover:shadow-xl"
            )}
          >
            Start Recording
            <svg
              className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
          <a
            href="/dashboard"
            className={cn(
              "inline-flex items-center justify-center px-8 py-4 font-semibold transition-all duration-200 rounded-full w-full sm:w-auto",
              isDark 
                ? "text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white"
                : "text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-sm"
            )}
          >
            View Dashboard
          </a>
        </motion.div>

        {/* Abstract Medical Cross visual element */}
        <motion.div 
          style={{ x: springX, y: springY }}
          className={cn(
            "absolute right-[5%] top-[10%] hidden lg:block",
            isDark ? "opacity-20" : "opacity-15"
          )}
        >
          <MedicalCross className="w-24 h-24" />
        </motion.div>
      </motion.div>
    </section>
  );
}
