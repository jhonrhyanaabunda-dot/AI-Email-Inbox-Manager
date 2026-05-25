import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Workflow as WorkflowIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkflowToggle } from "./workflow-toggle";

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const workflows = await prisma.workflow.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto max-w-a3-content p-8">
        <div className="mb-6">
          <div className="a3-label mb-1 text-a3-fog">Automation</div>
          <h2 className="flex items-center gap-3 text-[28px] font-extrabold tracking-tight text-foreground">
            <WorkflowIcon className="h-7 w-7 text-primary" />
            Workflows
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] text-muted-foreground">
            Automation rules A3 Inbox AI runs on every inbound email. Each rule fires on a trigger,
            checks conditions, then performs actions like routing, labeling, or archiving.
          </p>
        </div>

        <div className="space-y-3">
          {workflows.map((w) => {
            const conditions = parseJson<{ field: string; op: string; value: unknown }[]>(w.conditions);
            const actions = parseJson<{ type: string; params: Record<string, unknown> }[]>(w.actions);
            return (
              <Card key={w.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-foreground">{w.name}</h3>
                        {w.isEnabled ? (
                          <Badge variant="status">Enabled</Badge>
                        ) : (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </div>
                      {w.description ? (
                        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{w.description}</p>
                      ) : null}
                    </div>
                    <WorkflowToggle id={w.id} enabled={w.isEnabled} />
                  </div>

                  <div className="rounded-md border border-border bg-secondary/40 p-3 text-[12px]">
                    <div className="a3-label mb-2 text-a3-fog">Definition</div>
                    <div className="space-y-1.5 font-mono">
                      <div>
                        <span className="text-primary">when</span>{" "}
                        <span className="font-semibold text-foreground">{w.trigger}</span>
                      </div>
                      {conditions.map((c, i) => (
                        <div key={i} className="pl-4">
                          <span className="text-muted-foreground">{i === 0 ? "if" : "and"}</span>{" "}
                          <span className="text-foreground">
                            {c.field}{" "}
                            <span className="text-muted-foreground">{c.op}</span>{" "}
                            <span className="text-primary">{JSON.stringify(c.value)}</span>
                          </span>
                        </div>
                      ))}
                      {actions.map((a, i) => (
                        <div key={`a-${i}`} className="pl-4">
                          <span className="text-muted-foreground">then</span>{" "}
                          <span className="font-semibold text-foreground">{a.type}</span>
                          {a.params && Object.keys(a.params).length > 0 ? (
                            <span className="text-muted-foreground">
                              ({Object.entries(a.params).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(", ")})
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function parseJson<T>(v: unknown): T {
  if (Array.isArray(v)) return v as T;
  if (typeof v === "object" && v) return v as T;
  if (typeof v === "string") {
    try { return JSON.parse(v) as T; } catch { return [] as unknown as T; }
  }
  return [] as unknown as T;
}
