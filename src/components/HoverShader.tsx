"use client";

import { useRef, useMemo } from "react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { useTheme } from "next-themes";
import * as THREE from "three";

const ROTATION_RANGE = 32.5;
const HALF_ROTATION_RANGE = ROTATION_RANGE / 2;

interface HoverShaderCardProps {
  children: React.ReactNode;
  className?: string;
}

export function HoverShaderCard({ children, className = "" }: HoverShaderCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const ySpring = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const xPct = (e.clientX - rect.left) / width - 0.5;
    const yPct = (e.clientY - rect.top) / height - 0.5;

    x.set(xPct * ROTATION_RANGE);
    y.set(yPct * ROTATION_RANGE);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const transform = useMotionTemplate`rotateX(${xSpring}deg) rotateY(${ySpring}deg)`;
  const isDark = theme === "dark";

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, transformStyle: "preserve-3d" }}
      className={`relative ${className}`}
    >
      <div
        style={{
          transform: "translateZ(75px)",
          transformStyle: "preserve-3d",
        }}
        className="relative z-10"
      >
        {children}
      </div>
      
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-[2rem] pointer-events-none"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              800px circle at ${xSpring}px ${ySpring}px,
              ${isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)"},
              transparent 80%
            )
          `,
        }}
      />
      
      {/* Border gradient */}
      <div 
        className="absolute inset-0 rounded-[2rem] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${xSpring}px ${ySpring}px, rgba(16, 185, 129, 0.3), transparent 40%)`,
        }}
      />
    </motion.div>
  );
}

// Simple shader-based shimmer effect for backgrounds
export function ShaderShimmer({ className }: { className?: string }) {
  const meshRef = useRef<HTMLDivElement>(null);
  
  return (
    <div 
      ref={meshRef}
      className={`absolute inset-0 overflow-hidden rounded-[2rem] ${className}`}
    >
      <div 
        className="absolute inset-0 animate-shimmer"
        style={{
          background: `linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.05) 50%,
            transparent 100%
          )`,
          backgroundSize: "200% 100%",
        }}
      />
    </div>
  );
}

// 3D Tilt wrapper for any element
export function TiltCard({ 
  children, 
  className = "",
  tiltAmount = 15 
}: { 
  children: React.ReactNode; 
  className?: string;
  tiltAmount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const xSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const ySpring = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;

    x.set(xPct * tiltAmount);
    y.set(yPct * tiltAmount);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const transform = useMotionTemplate`rotateX(${-ySpring}deg) rotateY(${xSpring}deg)`;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, perspective: 1000 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
