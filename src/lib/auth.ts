import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { Role } from "./enums";

/**
 * Demo users — the 3 seeded accounts. IDs match `id` values in demo-data.ts
 * so anything that round-trips through the in-memory store stays consistent.
 */
const DEMO_USERS: Record<string, { id: string; name: string; organizationId: string; role: Role }> = {
  "principal@a3brands.test": { id: "demo-principal", name: "Jordan Reyes", organizationId: "demo-org", role: "DEALER_PRINCIPAL" as Role },
  "gm@a3brands.test":        { id: "demo-gm",        name: "Sam Patel",    organizationId: "demo-org", role: "GM" as Role },
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
  providers: [
    Credentials({
      name: "Email",
      credentials: { email: { label: "Email", type: "email" } },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").trim().toLowerCase();
        if (!email) return null;
        const u = DEMO_USERS[email];
        return u ? { id: u.id, email, name: u.name } : null;
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) token.uid = user.id;
      const uid = (token.uid as string | undefined) ?? token.sub;
      if (uid && !token.organizationId) {
        const demo = DEMO_USERS_BY_ID[uid];
        if (demo) {
          token.uid = demo.id;
          token.organizationId = demo.organizationId;
          token.role = demo.role;
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
});
