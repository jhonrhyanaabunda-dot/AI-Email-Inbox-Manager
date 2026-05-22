import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/demo-mode";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const org = await prisma.organization.findUnique({
    where: { id: session.user.organizationId },
    select: { name: true },
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar orgName={org?.name} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={{ name: session.user.name, email: session.user.email }} demoMode={isDemoMode()} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
