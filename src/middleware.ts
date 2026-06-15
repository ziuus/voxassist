import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const handler = process.env.NEXT_PUBLIC_DEMO_MODE === "true"
  ? () => NextResponse.next()
  : withAuth({
      pages: {
        signIn: "/",
      },
    });

export default handler;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/recordings/:path*",
    "/chat/:path*",
    "/settings/:path*",
  ],
};