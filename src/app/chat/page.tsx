"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: { id: string; title: string }[];
};

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello Dr. Vox here. I've indexed your medical recordings. How can I assist you today?",
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        sources: data.sources
      }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${err.message}. Please check if your Google API Key is configured.`,
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-10rem)] flex flex-col px-4">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
            <span className="w-2 h-8 bg-[#68BA7F] rounded-full shadow-[0_0_15px_rgba(104,186,127,0.5)]" />
            DR. VOX
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">Neural Retrieval & Clinical Synthesis</p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-1.5 rounded-full bg-[#68BA7F]/10 border border-[#68BA7F]/20 text-[#68BA7F] text-[10px] font-bold uppercase tracking-widest">
             RAG v1.0
           </div>
        </div>
      </motion.div>

      <div className="flex-1 glass rounded-[3rem] overflow-hidden flex flex-col shadow-2xl relative">
        {/* Abstract Background for Chat */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-40">
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#68BA7F]/20 blur-[100px] rounded-full" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
        </div>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative z-10"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div 
                  className={`group relative max-w-[85%] sm:max-w-[70%] rounded-[2rem] p-6 ${
                    msg.role === "user" 
                      ? "bg-slate-900 dark:bg-white text-white dark:text-black shadow-xl" 
                      : "bg-white/50 dark:bg-black/40 border border-slate-200 dark:border-white/10 backdrop-blur-2xl text-slate-800 dark:text-slate-200"
                  }`}
                >
                  <p className="leading-relaxed font-medium text-base whitespace-pre-wrap">{msg.content}</p>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-white/5 flex flex-wrap gap-2">
                      {msg.sources.map(src => (
                        <div key={src.id} className="text-[10px] px-2 py-1 rounded bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 font-bold uppercase tracking-tighter text-slate-500 dark:text-slate-400">
                          Source: {src.title}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Corner indicator */}
                  <div className={`absolute bottom-4 ${msg.role === 'user' ? '-right-1' : '-left-1'} w-2 h-2 rounded-full bg-[#68BA7F] opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex justify-start"
            >
              <div className="bg-white/30 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-md rounded-2xl p-4 flex gap-3 items-center">
                <div className="w-1.5 h-1.5 bg-[#68BA7F] rounded-full animate-pulse" />
                <div className="w-1.5 h-1.5 bg-[#68BA7F] rounded-full animate-pulse [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-[#68BA7F] rounded-full animate-pulse [animation-delay:0.4s]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#68BA7F] ml-2">Synthesizing...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white/40 dark:bg-black/60 border-t border-slate-200/50 dark:border-white/5 backdrop-blur-3xl relative z-20">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#68BA7F] to-emerald-400 rounded-full blur opacity-0 group-focus-within:opacity-20 transition duration-500" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask Dr. Vox about patients, history, or reports..."
              className="relative w-full rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-white/5 px-8 py-5 pr-20 text-base text-slate-800 dark:text-white outline-none ring-[#68BA7F]/30 transition-all focus:ring-4 focus:bg-white dark:focus:bg-black shadow-inner"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-slate-900 dark:bg-[#68BA7F] text-white dark:text-black flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-emerald-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </form>
          <div className="mt-3 text-center">
             <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">End-to-End Encrypted · HIPAA Compliant Environment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
