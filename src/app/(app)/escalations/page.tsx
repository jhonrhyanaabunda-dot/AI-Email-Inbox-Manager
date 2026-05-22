import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EscalationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const escalations = await prisma.escalation.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: [{ status: "asc" }, { riskScore: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { thread: { select: { id: true, subject: true } } },
  });

  const openCount = escalations.filter((e) => e.status !== "RESOLVED" && e.status !== "DISMISSED").length;

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-a3-content p-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="a3-label mb-1 text-a3-fog">Risk &amp; Compliance</div>
            <h2 className="flex items-center gap-3 text-[28px] font-extrabold tracking-tight text-foreground">
              <AlertTriangle className="h-7 w-7 text-red-500" />
              Escalations
            </h2>
          </div>
          <Badge variant="critical">{openCount} OPEN</Badge>
        </div>

        {escalations.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No escalations.</p>
        ) : (
          <div className="space-y-3">
            {escalations.map((e) => (
              <Link key={e.id} href={`/inbox/${e.thread.id}`} className="block">
                <Card className="transition-all hover:border-primary/40 hover:shadow-subtle">
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-center gap-2 text-[11px]">
                      <Badge variant={e.status === "OPEN" ? "critical" : "secondary"}>
                        {e.status.toLowerCase()}
                      </Badge>
                      <span className="a3-label text-foreground">{e.kind.replace(/_/g, " ")}</span>
                      <span className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400">
                        RISK {(e.riskScore * 100).toFixed(0)}%
                      </span>
                      <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-a3-fog">
                        {relativeTime(e.createdAt)}
                      </span>
                    </div>
                    <div className="text-[15px] font-bold text-foreground">{e.thread.subject ?? "(no subject)"}</div>
                    <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{e.summary}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
