"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

type TranscriptionMode = "server" | "browser";

interface Settings {
  transcriptionMode: TranscriptionMode;
  apiKey: string;
  autoSave: boolean;
  defaultPatientName: string;
  defaultDoctorName: string;
}

const SETTINGS_KEY = "voxassist_settings";

function getStoredSettings(): Settings {
  if (typeof window === "undefined") {
    return {
      transcriptionMode: "browser",
      apiKey: "",
      autoSave: true,
      defaultPatientName: "",
      defaultDoctorName: "",
    };
  }

  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
  }

  return {
    transcriptionMode: "browser",
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
    autoSave: true,
    defaultPatientName: "",
    defaultDoctorName: "",
  };
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<Settings>(getStoredSettings());
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    setSettings(getStoredSettings());
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings");
    }
  };

  const handleReset = () => {
    if (confirm("Reset all settings to defaults?")) {
      const defaults: Settings = {
        transcriptionMode: "browser",
        apiKey: "",
        autoSave: true,
        defaultPatientName: "",
        defaultDoctorName: "",
      };
      setSettings(defaults);
      localStorage.removeItem(SETTINGS_KEY);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500 mt-2">
              Configure VoxAssist to match your workflow
            </p>
          </div>
          {saved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm text-emerald-600 font-semibold"
            >
              ✓ Saved
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.section
        className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Transcription</h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose how audio should be transcribed
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Default Transcription Mode
            </label>
            <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-2">
              <button
                type="button"
                onClick={() =>
                  setSettings({ ...settings, transcriptionMode: "browser" })
                }
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  settings.transcriptionMode === "browser"
                    ? "bg-slate-900 text-white shadow-soft"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <div className="text-left">
                  <div>Browser (Local)</div>
                  <div className="text-xs font-normal opacity-70 mt-1">
                    Web Speech API - Real-time, no setup
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  setSettings({ ...settings, transcriptionMode: "server" })
                }
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  settings.transcriptionMode === "server"
                    ? "bg-slate-900 text-white shadow-soft"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <div className="text-left">
                  <div>Server AI</div>
                  <div className="text-xs font-normal opacity-70 mt-1">
                    Google Gemini - Requires API key
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-900">API Configuration</h2>
          <p className="text-xs text-slate-500 mt-1">
            API keys for external services
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={settings.apiKey}
                onChange={(e) =>
                  setSettings({ ...settings, apiKey: e.target.value })
                }
                placeholder="Enter your API key"
                className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 pr-24 text-sm text-slate-700 outline-none ring-teal-300 transition focus:ring-2"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                {showApiKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Required for Server AI transcription and report generation.{" "}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                Get API key →
              </a>
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Defaults</h2>
          <p className="text-xs text-slate-500 mt-1">
            Pre-fill forms with common values
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Default Doctor Name
            </label>
            <input
              type="text"
              value={settings.defaultDoctorName}
              onChange={(e) =>
                setSettings({ ...settings, defaultDoctorName: e.target.value })
              }
              placeholder="Dr. Smith"
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 outline-none ring-teal-300 transition focus:ring-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Default Patient Name
            </label>
            <input
              type="text"
              value={settings.defaultPatientName}
              onChange={(e) =>
                setSettings({ ...settings, defaultPatientName: e.target.value })
              }
              placeholder="Leave empty for manual entry"
              className="w-full rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 outline-none ring-teal-300 transition focus:ring-2"
            />
          </div>
        </div>
      </motion.section>

      <motion.section
        className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Appearance</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Customize the look and feel
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Theme
            </label>
            <div className="flex gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  theme === "light"
                    ? "bg-slate-900 text-white shadow-soft"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  theme === "dark"
                    ? "bg-slate-900 text-white shadow-soft dark:bg-slate-700"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  theme === "system"
                    ? "bg-slate-900 text-white shadow-soft dark:bg-slate-700"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                System
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="liquid-glass rounded-3xl p-6 sm:p-8 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Preferences</h2>
          <p className="text-xs text-slate-500 mt-1">
            Customize your experience
          </p>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white/90 cursor-pointer hover:bg-white transition">
            <div>
              <div className="text-sm font-medium text-slate-900">
                Auto-save transcripts
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Automatically save transcripts when recording stops
              </div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={(e) =>
                setSettings({ ...settings, autoSave: e.target.checked })
              }
              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        </div>
      </motion.section>

      <motion.div
        className="flex items-center justify-between gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          Reset to defaults
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-soft transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800"
          >
            Save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
