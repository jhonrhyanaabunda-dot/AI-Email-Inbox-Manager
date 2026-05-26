import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import { env } from "./env";
import { authConfig } from "./auth.config";
import { Role } from "./enums";

// Demo users — the 3 seeded accounts. IDs match what db-bootstrap.ts
// inserts so JWT.uid → real Prisma User.id lookups still work.
const DEMO_USERS: Record<string, { id: string; name: string; organizationId: string; role: Role }> = {
  "principal@a3brands.test": { id: "demo-principal", name: "Jordan Reyes", organizationId: "demo-org", role: "DEALER_PRINCIPAL" as Role },
  "gm@a3brands.test": { id: "demo-gm", name: "Sam Patel", organizationId: "demo-org", role: "GM" as Role },
  "marketing@a3brands.test": { id: "demo-marketing", name: "Devon Walker", organizationId: "demo-org", role: "MARKETING_DIRECTOR" as Role },
};
const DEMO_USERS_BY_ID = Object.fromEntries(
  Object.entries(DEMO_USERS).map(([email, u]) => [u.id, { ...u, email }]),
);

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
        // Hardcoded demo allowlist so login is bulletproof on Vercel even
        // when Prisma/SQLite is having a bad day. The 3 emails map to the
        // user IDs we seed into the DB via db-bootstrap.ts.
        const u = DEMO_USERS[email];
        if (u) return { id: u.id, email, name: u.name };
        // Fall back to a Prisma lookup for non-demo emails (e.g. real OAuth
        // imports in production). Swallow errors so a broken DB doesn't show
        // the scary NextAuth "Configuration" page.
        try {
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
          // Demo users: hardcoded so the JWT can be issued even if Prisma is
          // unavailable. Real users: look up org/role in the DB.
          const demo = DEMO_USERS_BY_ID[uid];
          if (demo) {
            token.uid = demo.id;
            token.organizationId = demo.organizationId;
            token.role = demo.role;
          } else {
            try {
              const dbUser = await prisma.user.findUnique({
                where: { id: uid },
                select: { id: true, organizationId: true, role: true },
              });
              if (dbUser) {
                token.uid = dbUser.id;
                token.organizationId = dbUser.organizationId;
                token.role = dbUser.role as Role;
              }
            } catch (err) {
              console.error("[auth] jwt prisma error:", err);
            }
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
