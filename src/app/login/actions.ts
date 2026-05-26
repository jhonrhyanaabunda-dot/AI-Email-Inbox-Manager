"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";

/**
 * Server-side demo sign-in. Triggered from the login page <form action>.
 * Uses NextAuth's server-side signIn so the credentials flow happens entirely
 * on the server — no client-side fetch, no JS error swallowing.
 *
 * NextAuth v5 throws a NEXT_REDIRECT when given `redirectTo`. We re-throw
 * those (so the browser navigates to /inbox) and also fall through to an
 * explicit redirect() if signIn returned without throwing, so the user
 * never lands stuck on /login.
 */
export async function demoSignInAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  try {
    await signIn("credentials", { email, redirectTo: "/inbox" });
  } catch (err) {
    // NextAuth's redirect is thrown as a redirect error — must be re-thrown
    // so Next.js converts it to an HTTP redirect response. Swallowing it
    // is what leaves the user on /login.
    if (isRedirectError(err)) throw err;
    console.error("[demo-signin] signIn error:", err);
  }
  // Belt-and-suspenders: if signIn somehow returned without redirecting,
  // force the navigation ourselves.
  redirect("/inbox");
}
