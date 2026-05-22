import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import AzureAD from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";
import { env } from "./env";
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

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  secret: env().AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
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
            issuer: `https://login.microsoftonline.com/${env().MICROSOFT_TENANT_ID}/v2.0`,
          }),
        ]
      : []),
    Credentials({
      name: "Email",
      credentials: { email: { label: "Email", type: "email" } },
      // Dev/preview-only magic — production must enable a real provider.
      authorize: async (creds) => {
        if (env().NODE_ENV === "production") return null;
        const email = String(creds?.email ?? "").trim().toLowerCase();
        if (!email) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        return user ? { id: user.id, email: user.email, name: user.name ?? undefined } : null;
      },
    }),
  ],
  callbacks: {
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
            token.role = dbUser.role;
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
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
