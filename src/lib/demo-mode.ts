/**
 * The whole app runs in demo mode (no database, no OpenAI, no real OAuth),
 * so this always returns true. Kept as a function so the call sites still
 * read naturally and any future "is this a real install?" branches stay easy.
 */
export function isDemoMode(): boolean {
  return true;
}

const CANNED_SUMMARIES = [
  {
    summary:
      "Inbound customer message. AI categorized the request, identified the urgency tier, and prepared a draft reply held for your approval.",
    actionItems: ["Review the draft below", "Approve & send when ready", "Escalate if customer follows up"],
  },
  {
    summary:
      "OEM-style communication detected. Routing recommendation noted. A draft acknowledgment is ready for your one-click approval.",
    actionItems: ["Forward to the right director", "Confirm action chain", "Reply to keep relationship warm"],
  },
];

export function cannedSummary(seed: string) {
  const h = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  return CANNED_SUMMARIES[h % CANNED_SUMMARIES.length];
}

export function cannedDraft(toName?: string | null) {
  return {
    bodyText:
      `Hi${toName ? ` ${toName.split(" ")[0]}` : ""},\n\n` +
      `Thanks for reaching out — got your note. I'm looping in the right person on our end and you'll have a substantive reply within the day.\n\n` +
      `If anything urgent in the meantime, my direct line is on the signature.\n\n` +
      `Best,\nJordan Reyes\nA3 Brands Demo Group`,
    tone: "professional" as const,
    confidence: 0.78,
    rationale:
      "Demo-mode draft generated without OpenAI. In production this would be a context-aware reply produced by the drafting agent using the full thread + dealership voice profile.",
  };
}

export function cannedDigest(opts: { name: string; openEsc: number; leads: number; drafts: number }) {
  return {
    summary:
      `Good morning ${opts.name.split(" ")[0]}. You have ${opts.openEsc} open escalation${opts.openEsc === 1 ? "" : "s"} ` +
      `that need eyes today, ${opts.leads} new sales lead${opts.leads === 1 ? "" : "s"} from overnight, ` +
      `and ${opts.drafts} AI draft${opts.drafts === 1 ? "" : "s"} awaiting your approval. ` +
      `Top of the pile: the F-150 lemon-law thread — handle that one personally before noon.`,
    topThreads: [
      { threadId: "seed-thread-00", reason: "Lemon-law threat (F-150) — 10-day clock" },
      { threadId: "seed-thread-01", reason: "Ford Q3 co-op deadline Friday" },
      { threadId: "seed-thread-02", reason: "Hot Explorer trade-in — draft ready" },
    ],
  };
}
