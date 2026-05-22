import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ApiTokensPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const tokens = await prisma.apiToken.findMany({
    where: { organizationId: session.user.organizationId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="mb-4 text-xl font-semibold">API tokens</h1>
      {tokens.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tokens yet. Issue one to integrate with downstream systems.</p>
      ) : (
        <div className="space-y-2">
          {tokens.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center gap-3 p-4 text-sm">
                <div className="font-mono text-xs">{t.prefix}…</div>
                <div className="font-medium">{t.name}</div>
                <div className="ml-auto text-xs text-muted-foreground">
                  created {relativeTime(t.createdAt)}{t.lastUsedAt ? ` · used ${relativeTime(t.lastUsedAt)}` : ""}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
