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
      <body className="antialiased min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
          VoxAssist · AI-generated reports require physician review before use
          in patient records.
        </footer>
      </body>
    </html>
  );
}
