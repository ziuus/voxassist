import type { Metadata } from "next";
import Navigation from "@/components/Navigation";
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
    <html lang="en">
      <body className="antialiased min-h-screen">
        <div className="relative min-h-screen app-bg">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-48 right-[-12%] h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl float-slow" />
            <div className="absolute top-24 left-[-6%] h-72 w-72 rounded-full bg-blue-300/20 blur-3xl float-delay" />
            <div className="absolute bottom-0 right-[12%] h-72 w-72 rounded-full bg-amber-300/20 blur-3xl float-slow" />
            <div className="absolute inset-0 app-grid opacity-70" />
          </div>
          <div className="relative z-10 flex min-h-screen flex-col">
            <Navigation />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-10">
              {children}
            </main>
            <footer className="border-t border-black/10 py-6 text-center text-xs text-slate-500">
              VoxAssist · AI-generated reports require physician review before
              use in patient records.
            </footer>
          </div>
        </div>
      </body>
    </html>
  );
}
