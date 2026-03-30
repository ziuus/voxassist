"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello Dr. Smith. I'm your medical data assistant. You can ask me about past patient reports, diagnoses, or general medical queries. Note: RAG backend is currently in development.",
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setIsTyping(true);

    // Placeholder for actual RAG API call
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "This is a placeholder response. To fully implement this, we will need to connect a Vector Database (like Pinecone or Chroma) and generate embeddings for your saved recordings and reports.",
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-semibold text-slate-900">AI Medical Assistant</h1>
        <p className="text-sm text-slate-500 mt-1">Search through your past reports and patient data (RAG)</p>
      </motion.div>

      <div className="flex-1 liquid-glass rounded-3xl overflow-hidden flex flex-col border border-white/70 shadow-soft">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.role === "user" 
                    ? "bg-slate-900 text-white rounded-br-sm" 
                    : "bg-white/80 border border-slate-200 text-slate-800 rounded-bl-sm"
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/80 border border-slate-200 rounded-2xl rounded-bl-sm p-4 flex gap-2 items-center">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/50 border-t border-slate-200 backdrop-blur-md">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about a patient or past report..."
              className="w-full rounded-full border border-slate-200 bg-white px-6 py-4 pr-16 text-sm text-slate-700 outline-none ring-teal-300 transition focus:ring-2 shadow-sm"
            />
            <button
              type="submit"
              disabled={!query.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900 text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
