import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const required = [
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ] as const;

  const missing = required.filter((key) => {
    const value = process.env[key];
    return !value || value.trim() === "";
  });

  return NextResponse.json({
    ok: missing.length === 0,
    missing,
    nextAuthUrl: process.env.NEXTAUTH_URL || null,
  });
}
