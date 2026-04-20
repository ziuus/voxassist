import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoxAssist — Agentic Voice Intelligence",
  description:
    "Intelligent voice assistant for high-performance engineering workflows and autonomous system management.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport = {
  themeColor: "#68BA7F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen selection:bg-[#68BA7F]/30">
        <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SmoothScroll>
            <div className="relative min-h-screen app-bg cinematic-grid overflow-x-hidden">
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-48 right-[-12%] h-[28rem] w-[28rem] rounded-full bg-emerald-300/10 dark:bg-[#68BA7F]/10 blur-[120px] float-slow" />
                <div className="absolute top-24 left-[-6%] h-[24rem] w-[24rem] rounded-full bg-blue-300/10 dark:bg-emerald-500/5 blur-[120px] float-delay" />
                <div className="absolute bottom-[-8%] right-[12%] h-[26rem] w-[26rem] rounded-full bg-emerald-300/10 dark:bg-[#68BA7F]/10 blur-[120px] float-slow" />
                <div className="absolute inset-0 app-grid opacity-30" />
              </div>
              <div className="relative z-10 flex min-h-screen flex-col">
                <Navigation />
                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-10">
                  {children}
                </main>
                <footer className="border-t border-black/5 dark:border-white/5 py-8 text-center text-xs text-slate-500 dark:text-slate-500 font-medium">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#68BA7F] animate-pulse" />
                    <span>VoxAssist Intelligent Infrastructure</span>
                  </div>
                  AI-generated reports require physician review before use in patient records.
                </footer>
              </div>
            </div>
          </SmoothScroll>
        </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
