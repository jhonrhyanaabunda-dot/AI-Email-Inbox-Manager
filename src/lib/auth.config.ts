/**
 * Edge-runtime-safe NextAuth config — used by middleware.
 * Does NOT import Prisma or any node:fs/node:path modules so it can compile
 * for the Edge runtime that middleware runs on.
 *
 * The full config (with Prisma adapter + DB credentials provider) lives in
 * `auth.ts` and is used by API routes / server components.
 */
import type { NextAuthConfig } from "next-auth";
import { env } from "./env";

export const authConfig: NextAuthConfig = {
  // CRITICAL: set secret here (not just in auth.ts) so the Edge-runtime
  // middleware uses the same secret as the server-side signIn. Otherwise
  // signIn signs the JWT with our default but middleware can't decode it
  // (it falls back to AUTH_SECRET env var, which we don't set on Vercel),
  // so every authenticated request gets bounced back to /login.
  secret: env().AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [], // populated in auth.ts (Credentials + Google + AzureAD)
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;
      const isPublic =
        pathname === "/" ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/methodology") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/webhooks") ||
        pathname.startsWith("/api/health") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon");
      if (isPublic) return true;
      return isLoggedIn;
    },
  },
};
