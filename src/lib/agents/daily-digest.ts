import { z } from "zod";
import { startOfDay, subDays } from "date-fns";
import { prisma } from "../db";
import { MODEL } from "../openai";
import { structured } from "./llm";
import { SYSTEM_PROMPTS } from "./prompts";
import { PROMPT_VERSIONS } from "./types";

const Schema = z.object({
  summary: z.string(),
  topThreads: z
    .array(z.object({ threadId: z.string(), reason: z.string() }))
    .max(8),
});

export async function generateDailyDigest(userId: string, forDate: Date = new Date()) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const since = startOfDay(subDays(forDate, 1));

  const [threads, escalations, drafts, leadsCount, recentEmailsCount] = await Promise.all([
    prisma.emailThread.findMany({
      where: {
        organizationId: user.organizationId,
        status: "INBOX",
        lastMessageAt: { gte: since },
      },
      orderBy: [{ priorityScore: "desc" }, { lastMessageAt: "desc" }],
      take: 25,
      select: {
        id: true,
        subject: true,
        priority: true,
        priorityScore: true,
        category: true,
        aiSummary: true,
        isVip: true,
        lastMessageAt: true,
      },
    }),
    prisma.escalation.count({
      where: { organizationId: user.organizationId, status: { in: ["OPEN", "ACKNOWLEDGED", "IN_PROGRESS"] } },
    }),
    prisma.aiDraft.count({
      where: { organizationId: user.organizationId, status: "PENDING_REVIEW" },
    }),
    prisma.emailThread.count({
      where: { organizationId: user.organizationId, category: "SALES_LEAD", lastMessageAt: { gte: since } },
    }),
    prisma.email.count({
      where: { organizationId: user.organizationId, receivedAt: { gte: since } },
    }),
  ]);

  const threadDigest = threads
    .map(
      (t, i) =>
        `${i + 1}. [${t.priority ?? "?"} ${(t.priorityScore ?? 0).toFixed(2)}${t.isVip ? " VIP" : ""}] (${t.category ?? "uncat"}) ${t.subject ?? "(no subject)"}\n   summary: ${(t.aiSummary ?? "").slice(0, 220)}`
    )
    .join("\n\n");

  const result = await structured<z.infer<typeof Schema>>({
    schema: Schema,
    schemaName: "daily_digest",
    system: SYSTEM_PROMPTS.digest,
    user: `Audience: ${user.name ?? user.email}. Time: morning briefing for ${forDate.toDateString()}.

Stats since ${since.toISOString()}:
- Inbox messages received: ${recentEmailsCount}
- Open escalations: ${escalations}
- New sales leads: ${leadsCount}
- Drafts awaiting your approval: ${drafts}

Top candidate threads:
${threadDigest}

Write the briefing.`,
    model: MODEL.heavy(),
    temperature: 0.3,
    maxTokens: 1200,
  });

  return prisma.dailyBriefing.upsert({
    where: { userId_forDate: { userId: user.id, forDate: startOfDay(forDate) } },
    update: {
      summary: result.summary,
      topThreads: JSON.stringify(result.topThreads),
      openEscalations: escalations,
      newLeads: leadsCount,
      pendingDrafts: drafts,
      metrics: JSON.stringify({ inboxVolume: recentEmailsCount }),
      modelUsed: MODEL.heavy(),
    },
    create: {
      organizationId: user.organizationId,
      userId: user.id,
      forDate: startOfDay(forDate),
      summary: result.summary,
      topThreads: JSON.stringify(result.topThreads),
      openEscalations: escalations,
      newLeads: leadsCount,
      pendingDrafts: drafts,
      metrics: JSON.stringify({ inboxVolume: recentEmailsCount }),
      modelUsed: MODEL.heavy(),
    },
  });
}

export const DIGEST_PROMPT_VERSION = PROMPT_VERSIONS.digest;
