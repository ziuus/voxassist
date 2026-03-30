import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "VoxAssist – AI Medical Voice Assistant",
  description:
    "AI voice assistant for doctors that helps create reports from doctor-patient conversations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative min-h-screen app-bg cinematic-grid">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-48 right-[-12%] h-[28rem] w-[28rem] rounded-full bg-emerald-300/20 dark:bg-emerald-500/10 blur-3xl float-slow" />
            <div className="absolute top-24 left-[-6%] h-[24rem] w-[24rem] rounded-full bg-blue-300/20 dark:bg-blue-500/10 blur-3xl float-delay" />
            <div className="absolute bottom-[-8%] right-[12%] h-[26rem] w-[26rem] rounded-full bg-amber-300/20 dark:bg-amber-500/10 blur-3xl float-slow" />
            <div className="absolute top-[22%] left-[35%] h-48 w-48 rounded-full bg-cyan-200/20 dark:bg-cyan-500/10 blur-3xl float-delay" />
            <div className="absolute inset-0 app-grid opacity-70" />
          </div>
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-10">
              {children}
            </main>
            <footer className="border-t border-black/10 dark:border-white/10 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              VoxAssist · AI-generated reports require physician review before
              use in patient records.
            </footer>
          </div>
        </div>
        </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
