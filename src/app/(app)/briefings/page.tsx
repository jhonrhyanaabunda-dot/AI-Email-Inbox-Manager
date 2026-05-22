import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { GenerateNowButton } from "./generate-now-button";

export const dynamic = "force-dynamic";

export default async function BriefingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const briefings = await prisma.dailyBriefing.findMany({
    where: { userId: session.user.id },
    orderBy: { forDate: "desc" },
    take: 14,
  });

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-a3-content p-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="a3-label mb-1 text-a3-fog">Daily for the GM</div>
            <h2 className="flex items-center gap-3 text-[28px] font-extrabold tracking-tight text-foreground">
              <Calendar className="h-7 w-7 text-primary" />
              Executive Briefings
            </h2>
          </div>
          <GenerateNowButton />
        </div>

        {briefings.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            No briefings yet — they generate automatically at 7am. You can also generate one now.
          </p>
        ) : (
          <div className="space-y-5">
            {briefings.map((b) => (
              <Card key={b.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {b.forDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                    </CardTitle>
                    <div className="flex gap-2">
                      {b.openEscalations > 0 && (
                        <Badge variant="critical">{b.openEscalations} escalation{b.openEscalations === 1 ? "" : "s"}</Badge>
                      )}
                      {b.newLeads > 0 && <Badge variant="status">{b.newLeads} lead{b.newLeads === 1 ? "" : "s"}</Badge>}
                      {b.pendingDrafts > 0 && (
                        <Badge variant="secondary">{b.pendingDrafts} draft{b.pendingDrafts === 1 ? "" : "s"}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[14px] leading-relaxed text-foreground">{b.summary}</p>
                  {(() => {
                    let list: { threadId: string; reason: string }[] = [];
                    if (Array.isArray(b.topThreads)) list = b.topThreads as any;
                    else if (typeof b.topThreads === "string" && b.topThreads) {
                      try { list = JSON.parse(b.topThreads); } catch {}
                    }
                    return list.length ? (
                      <div className="space-y-2 rounded-md border border-border bg-secondary p-4">
                        <div className="a3-label text-a3-fog">Top threads</div>
                        <ul className="space-y-1.5">
                          {list.map((t, i) => (
                            <li key={i} className="flex gap-2 text-[13px]">
                              <span className="font-mono font-bold text-primary">{i + 1}.</span>
                              <span className="text-foreground">{t.reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null;
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
