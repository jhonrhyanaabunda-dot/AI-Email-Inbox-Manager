"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ShieldCheck, AlertTriangle, Calendar } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await signIn("credentials", { email, callbackUrl: "/inbox" });
  }

  async function quickSignIn(demoEmail: string) {
    setPending(true);
    await signIn("credentials", { email: demoEmail, callbackUrl: "/inbox" });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Marketing — A3 hero, dark navy + emerald */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-a3-navy p-12 text-white lg:flex">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground shadow-emerald">
            <span className="font-black tracking-tight">A3</span>
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-bold">A3 Brands</div>
            <div className="a3-label text-white/60">Dealership intelligence</div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="a3-label text-primary">An A3 Brands Product</div>
          <h1 className="text-white" style={{ fontSize: 51, lineHeight: "56px", letterSpacing: "0.02em", fontWeight: 800 }}>
            Your inbox,
            <br />
            <span className="text-primary">triaged.</span>
          </h1>
          <p className="max-w-md text-[14px] leading-[22px] text-white/70">
            A3 Inbox AI reads every email the moment it arrives, prioritizes what your GM needs to act on,
            drafts replies in their voice, and escalates legal threats before they become lawsuits.
          </p>

          <ul className="space-y-3 pt-2">
            {[
              { icon: Sparkles, label: "AI triage, categorize, prioritize, draft" },
              { icon: Calendar, label: "7am daily executive digest" },
              { icon: AlertTriangle, label: "Real-time legal & complaint escalation" },
              { icon: ShieldCheck, label: "Multi-tenant, SOC2-ready, GM approves before send" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-[13px] text-white/85">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 a3-label text-white/50">
          Built for dealer principals, GMs, marketing & fixed-ops directors.
        </div>
      </aside>

      {/* Sign-in form */}
      <main className="flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="space-y-2 pb-6 text-center">
            <CardTitle className="text-[24px]" style={{ fontWeight: 800, letterSpacing: "0.01em" }}>
              Sign in
            </CardTitle>
            <CardDescription>
              Use your dealership Google or Microsoft account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="h-12 w-full justify-center" onClick={() => signIn("google", { callbackUrl: "/inbox" })}>
              Continue with Google
            </Button>
            <Button variant="outline" className="h-12 w-full justify-center" onClick={() => signIn("azure-ad", { callbackUrl: "/inbox" })}>
              Continue with Microsoft
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 a3-label text-a3-fog">Demo access</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                disabled={pending}
                onClick={() => quickSignIn("principal@a3brands.test")}
              >
                {pending ? "Signing in…" : "Enter demo as Dealer Principal"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={pending}
                onClick={() => quickSignIn("gm@a3brands.test")}
              >
                Enter demo as GM
              </Button>
              <Button
                variant="outline"
                className="w-full"
                disabled={pending}
                onClick={() => quickSignIn("marketing@a3brands.test")}
              >
                Enter demo as Marketing
              </Button>
            </div>

            <details className="pt-2">
              <summary className="cursor-pointer text-[11px] text-a3-fog hover:text-foreground">
                Or sign in with a custom email
              </summary>
              <form onSubmit={submit} className="space-y-3 pt-3">
                <Input
                  type="email"
                  required
                  placeholder="principal@a3brands.test"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Button type="submit" className="w-full" disabled={pending}>
                  {pending ? "Signing in…" : "Sign in"}
                </Button>
              </form>
            </details>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
