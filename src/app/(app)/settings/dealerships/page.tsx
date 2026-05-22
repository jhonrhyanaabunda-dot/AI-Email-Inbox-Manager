import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DealershipsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const dealerships = await prisma.dealership.findMany({
    where: { organizationId: session.user.organizationId },
    include: { mailboxes: { select: { id: true } } },
  });
  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="mb-4 text-xl font-semibold">Dealerships</h1>
      <div className="space-y-2">
        {dealerships.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-center gap-3 p-4 text-sm">
              <div>
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.brand ?? "—"} · {d.location ?? "—"}</div>
              </div>
              <div className="ml-auto text-xs text-muted-foreground">{d.mailboxes.length} mailbox{d.mailboxes.length === 1 ? "" : "es"}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
