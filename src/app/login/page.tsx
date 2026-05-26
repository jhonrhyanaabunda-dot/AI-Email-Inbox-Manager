import Link from "next/link";
import { demoSignInAction } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ShieldCheck, AlertTriangle, Calendar, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Marketing — A3 hero, dark navy + emerald */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-a3-navy p-12 text-white lg:flex">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground shadow-emerald">
              <span className="font-black tracking-tight">A3</span>
            </div>
            <div className="leading-tight">
              <div className="text-[14px] font-bold">A3 Brands</div>
              <div className="a3-label text-white/60">Dealership intelligence</div>
            </div>
          </Link>
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
            <Link href="/" className="mb-2 inline-flex items-center gap-1.5 self-center text-[11px] text-a3-fog hover:text-foreground">
              <ArrowLeft className="h-3 w-3" /> Back to product page
            </Link>
            <CardTitle className="text-[24px]" style={{ fontWeight: 800, letterSpacing: "0.01em" }}>
              Enter the demo
            </CardTitle>
            <CardDescription>
              Pick a role to explore the dealership inbox.
              <br />
              <span className="text-[11px] text-a3-fog">No password. No setup. Click & you're in.</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={demoSignInAction}>
              <input type="hidden" name="email" value="principal@a3brands.test" />
              <Button type="submit" className="h-12 w-full">
                Enter as Dealer Principal
                <span className="ml-2 text-[11px] font-normal opacity-70">Jordan Reyes</span>
              </Button>
            </form>
            <form action={demoSignInAction}>
              <input type="hidden" name="email" value="gm@a3brands.test" />
              <Button type="submit" variant="outline" className="h-12 w-full">
                Enter as GM
                <span className="ml-2 text-[11px] font-normal opacity-70">Sam Patel</span>
              </Button>
            </form>
            <form action={demoSignInAction}>
              <input type="hidden" name="email" value="marketing@a3brands.test" />
              <Button type="submit" variant="outline" className="h-12 w-full">
                Enter as Marketing
                <span className="ml-2 text-[11px] font-normal opacity-70">Devon Walker</span>
              </Button>
            </form>

            <p className="pt-4 text-center text-[11px] leading-relaxed text-a3-fog">
              This is a demo with sample dealership data.
              <br />
              Changes you make won't persist between sessions.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
