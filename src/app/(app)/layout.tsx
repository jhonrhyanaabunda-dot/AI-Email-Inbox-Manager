import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo-mode";
import { Info } from "lucide-react";
import Link from "next/link";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { name: true },
  });

  const demo = isDemoMode();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden">
      {demo && (
        <div className="flex h-9 shrink-0 items-center justify-center gap-2 border-b border-primary/30 bg-primary/[0.08] px-4 text-[11px] text-foreground md:text-[12px]">
          <Info className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate">
            <span className="font-semibold text-primary">Demo mode</span>
            <span className="hidden sm:inline"> — exploring sample dealership data. Mutations reset on each cold start.</span>{" "}
            <Link href="/" className="font-medium underline-offset-2 hover:underline">
              About →
            </Link>
          </span>
        </div>
      )}
      <AppShell
        user={{ name: session.user.name, email: session.user.email }}
        orgName={org?.name}
        demoMode={demo}
      >
        {children}
      </AppShell>
    </div>
  );
}
