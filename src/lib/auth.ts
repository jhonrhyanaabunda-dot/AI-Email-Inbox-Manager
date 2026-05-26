import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import { env } from "./env";
import { authConfig } from "./auth.config";
import { Role } from "./enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      role: Role;
    } & DefaultSession["user"];
  }
  interface User {
    organizationId?: string;
    role?: Role;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  secret: env().AUTH_SECRET,
  providers: [
    ...(env().GOOGLE_CLIENT_ID && env().GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: env().GOOGLE_CLIENT_ID!,
            clientSecret: env().GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: false,
          }),
        ]
      : []),
    ...(env().MICROSOFT_CLIENT_ID && env().MICROSOFT_CLIENT_SECRET
      ? [
          AzureAD({
            clientId: env().MICROSOFT_CLIENT_ID!,
            clientSecret: env().MICROSOFT_CLIENT_SECRET!,
            tenantId: env().MICROSOFT_TENANT_ID,
          }),
        ]
      : []),
    Credentials({
      name: "Email",
      credentials: { email: { label: "Email", type: "email" } },
      // Demo-friendly: accept any email of a seeded user, no password required.
      // Swallow Prisma errors so a broken DB never surfaces as the generic
      // NextAuth "Configuration" error — return null instead so the user just
      // sees "invalid credentials" on the login page.
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        if (!email) return null;
        try {
          // db.ts wraps prisma with an extension that auto-bootstraps the DB
          // (migrate + seed) on the first query of each cold start.
          const user = await prisma.user.findUnique({ where: { email } });
          return user ? { id: user.id, email: user.email, name: user.name ?? undefined } : null;
        } catch (err) {
          console.error("[auth] authorize prisma error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user?.id) token.uid = user.id;
      if (trigger === "update" || !token.organizationId) {
        const uid = (token.uid as string | undefined) ?? token.sub;
        if (uid) {
          const dbUser = await prisma.user.findUnique({
            where: { id: uid },
            select: { id: true, organizationId: true, role: true },
          });
          if (dbUser) {
            token.uid = dbUser.id;
            token.organizationId = dbUser.organizationId;
            token.role = dbUser.role as Role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      if (token.organizationId) session.user.organizationId = token.organizationId as string;
      if (token.role) session.user.role = token.role as Role;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user?.id) {
        await prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } }).catch(() => null);
      }
    },
  },
});
