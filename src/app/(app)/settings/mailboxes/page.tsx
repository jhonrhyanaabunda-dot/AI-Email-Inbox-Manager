import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { isDemoMode } from "@/lib/demo-mode";

export const dynamic = "force-dynamic";

export default async function MailboxesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const demo = isDemoMode();

  const mailboxes = await prisma.mailbox.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
    include: { dealership: { select: { name: true, brand: true } } },
  });

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-a3-content p-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <div className="a3-label mb-1 text-a3-fog">Connections</div>
            <h2 className="flex items-center gap-3 text-[28px] font-extrabold tracking-tight text-foreground">
              <Mail className="h-7 w-7 text-primary" />
              Mailboxes
            </h2>
          </div>
          <div className="flex gap-2">
            {demo ? (
              <>
                <Button variant="outline" disabled title="Configure Google OAuth in production">
                  Connect Gmail
                </Button>
                <Button disabled title="Configure Microsoft OAuth in production">
                  Connect Microsoft 365
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <a href="/api/mailboxes/connect/gmail">Connect Gmail</a>
                </Button>
                <Button asChild>
                  <a href="/api/mailboxes/connect/microsoft">Connect Microsoft 365</a>
                </Button>
              </>
            )}
          </div>
        </div>

        {demo && (
          <Card className="mb-4 border-primary/30 bg-primary/[0.04]">
            <CardContent className="flex items-start gap-3 p-4 text-[13px]">
              <Badge variant="status">DEMO</Badge>
              <div className="leading-relaxed text-foreground">
                Live Gmail/Microsoft connections are disabled in demo mode. In production,
                clicking <em>Connect Gmail</em> launches OAuth, syncs the inbox in real time,
                and registers a push subscription so the AI fires within seconds of each new email.
              </div>
            </CardContent>
          </Card>
        )}

        {mailboxes.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No mailboxes connected.</p>
        ) : (
          <div className="space-y-2">
            {mailboxes.map((m) => (
              <Card key={m.id}>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/10 a3-label text-primary">
                    {m.provider === "GMAIL" ? "GM" : "MS"}
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-foreground">{m.emailAddress}</div>
                    <div className="text-[12px] text-muted-foreground">
                      {m.dealership?.name ?? "No dealership assigned"}
                      {m.lastSyncedAt ? ` · synced ${relativeTime(m.lastSyncedAt)}` : ""}
                    </div>
                  </div>
                  <Badge
                    variant={m.status === "ACTIVE" ? "status" : m.status === "ERROR" ? "critical" : "secondary"}
                    className="ml-auto"
                  >
                    {m.status.toLowerCase()}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
