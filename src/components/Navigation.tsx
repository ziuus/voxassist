"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/recordings/new", label: "New Recording" },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-black/10 bg-white/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-500 p-[2px] shadow-soft">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white/95 text-emerald-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 1 0 4 0V5a2 2 0 0 0-2-2z" />
                  <path d="M19 11a1 1 0 0 1 1 1 8 8 0 0 1-7 7.938V22h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2.062A8 8 0 0 1 4 12a1 1 0 1 1 2 0 6 6 0 1 0 12 0 1 1 0 0 1 1-1z" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-lg font-semibold text-slate-900 tracking-tight">
                VoxAssist
              </span>
              <span className="hidden sm:block text-xs text-slate-500">
                AI Medical Voice Assistant
              </span>
            </div>
            <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
              Audit Ready
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/80 p-1 shadow-soft">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-slate-900 text-white shadow"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
