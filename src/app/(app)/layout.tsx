import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
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
        <div className="flex h-9 shrink-0 items-center justify-center gap-2 border-b border-primary/30 bg-primary/[0.08] px-4 text-[12px] text-foreground">
          <Info className="h-3.5 w-3.5 text-primary" />
          <span>
            <span className="font-semibold text-primary">Demo mode</span> — exploring sample dealership data.
            Mutations reset on each cold start. <Link href="/" className="font-medium underline-offset-2 hover:underline">About the product →</Link>
          </span>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar orgName={org?.name} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar user={{ name: session.user.name, email: session.user.email }} demoMode={demo} />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}
