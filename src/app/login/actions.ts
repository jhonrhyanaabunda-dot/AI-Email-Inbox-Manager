"use server";

import { signIn } from "@/lib/auth";

/**
 * Server-side demo sign-in. Triggered from the login page <form action>.
 * Uses NextAuth's server-side signIn so the credentials flow happens entirely
 * on the server — no client-side fetch, no JS error swallowing. On success
 * NextAuth throws a redirect to `/inbox`; Next.js converts that to a 303.
 */
export async function demoSignInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  await signIn("credentials", { email, redirectTo: "/inbox" });
}
