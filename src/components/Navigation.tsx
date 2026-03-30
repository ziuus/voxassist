"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { UserMenu } from "./UserMenu";
import { useEffect, useState } from "react";

export default function Navigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLandingPage = pathname === "/";
  const isLoggedIn = status === "authenticated";

  // Show full nav only when logged in
  const navItems = isLoggedIn
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/recordings/new", label: "New Recording" },
        { href: "/chat", label: "AI Search (RAG)" },
        { href: "/settings", label: "Settings" },
      ]
    : [
        { href: "/", label: "Home" },
        { href: "/dashboard", label: "Dashboard" },
      ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="sticky top-0 z-50">
      <div className="liquid-glass mx-auto mt-2 rounded-2xl px-4 sm:px-6 py-2 max-w-[80%]">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-4 group cursor-pointer">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-500 p-[2px] shadow-soft group-hover:shadow-md transition-shadow">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white/95 dark:bg-slate-900/95 text-emerald-800 dark:text-emerald-400">
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
              <span className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                VoxAssist
              </span>
              <span className="hidden sm:block text-xs text-slate-500 dark:text-slate-400">
                AI Medical Voice Assistant
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-white/50 dark:bg-slate-800/50 p-1 shadow-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <UserMenu />
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-xl bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                title="Toggle theme"
              >
                {theme === "dark" ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
