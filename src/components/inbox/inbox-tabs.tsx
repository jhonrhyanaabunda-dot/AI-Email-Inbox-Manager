"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export type InboxView = "INBOX" | "SNOOZED" | "DONE" | "ARCHIVED";

export function InboxTabs({
  counts,
}: {
  counts: Record<InboxView, number>;
}) {
  const params = useSearchParams();
  const current = (params.get("view") as InboxView | null) ?? "INBOX";
  const tabs: { id: InboxView; label: string }[] = [
    { id: "INBOX", label: "Inbox" },
    { id: "SNOOZED", label: "Snoozed" },
    { id: "DONE", label: "Done" },
    { id: "ARCHIVED", label: "Archived" },
  ];
  return (
    <div className="flex items-center gap-0.5 border-b border-border bg-card px-3 py-2 text-[12px]">
      {tabs.map((t) => {
        const active = t.id === current;
        const n = counts[t.id] ?? 0;
        return (
          <Link
            key={t.id}
            href={t.id === "INBOX" ? "/inbox" : `/inbox?view=${t.id}`}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            {t.label}
            {n > 0 && (
              <span
                className={cn(
                  "rounded-sm px-1 font-mono text-[10px]",
                  active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {n}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
