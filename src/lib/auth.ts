import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { getPrismaClient } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

const prisma = getPrismaClient();
if (!prisma) {
  // eslint-disable-next-line no-console
  console.error("Auth database is not configured. Prisma adapter is disabled.");
}

export const authOptions: NextAuthOptions = {
  adapter: prisma ? (PrismaAdapter(prisma) as any) : undefined,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export default NextAuth(authOptions);
