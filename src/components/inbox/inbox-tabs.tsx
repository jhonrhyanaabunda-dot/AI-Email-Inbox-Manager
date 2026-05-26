"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type InboxView = "INBOX" | "SNOOZED" | "DONE" | "ARCHIVED";

const PRIORITIES = ["CRITICAL", "HIGH", "NORMAL", "LOW"] as const;
const CATEGORIES = [
  "LEGAL",
  "COMPLAINT",
  "OEM",
  "SALES",
  "CUSTOMER",
  "INTERNAL",
  "VENDOR",
  "NEWSLETTER",
] as const;

export function InboxTabs({ counts }: { counts: Record<InboxView, number> }) {
  const params = useSearchParams();
  const current = (params.get("view") as InboxView | null) ?? "INBOX";
  const activePriority = params.get("priority");
  const activeCategory = params.get("category");

  const tabs: { id: InboxView; label: string }[] = [
    { id: "INBOX", label: "Inbox" },
    { id: "SNOOZED", label: "Snoozed" },
    { id: "DONE", label: "Done" },
    { id: "ARCHIVED", label: "Archived" },
  ];

  // Build a href that preserves filter params but switches the view.
  function viewHref(view: InboxView) {
    const sp = new URLSearchParams();
    if (view !== "INBOX") sp.set("view", view);
    if (activePriority) sp.set("priority", activePriority);
    if (activeCategory) sp.set("category", activeCategory);
    const q = sp.toString();
    return `/inbox${q ? "?" + q : ""}`;
  }

  function filterHref(key: "priority" | "category", value: string | null) {
    const sp = new URLSearchParams(params.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    return `/inbox${sp.toString() ? "?" + sp.toString() : ""}`;
  }

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center gap-0.5 px-3 py-2 text-[12px]">
        {tabs.map((t) => {
          const active = t.id === current;
          const n = counts[t.id] ?? 0;
          return (
            <Link
              key={t.id}
              href={viewHref(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {t.label}
              {n > 0 && (
                <span
                  className={cn(
                    "rounded-sm px-1 font-mono text-[10px]",
                    active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  {n}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      {/* Filter row */}
      <div className="flex items-center gap-2 border-t border-border px-3 py-1.5 text-[11px]">
        <FilterMenu
          label="Priority"
          value={activePriority}
          options={PRIORITIES as unknown as string[]}
          hrefFor={(v) => filterHref("priority", v)}
        />
        <FilterMenu
          label="Category"
          value={activeCategory}
          options={CATEGORIES as unknown as string[]}
          hrefFor={(v) => filterHref("category", v)}
        />
        {(activePriority || activeCategory) && (
          <Link
            href={filterHref("priority", null).split("?")[0] + (current === "INBOX" ? "" : `?view=${current}`)}
            className="ml-auto text-[11px] font-medium text-primary hover:underline"
          >
            Clear filters
          </Link>
        )}
      </div>
    </div>
  );
}

function FilterMenu({
  label,
  value,
  options,
  hrefFor,
}: {
  label: string;
  value: string | null;
  options: string[];
  hrefFor: (v: string | null) => string;
}) {
  return (
    <details className="group relative">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-1 rounded-md border px-2 py-0.5 transition-colors",
          value
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
        )}
      >
        <span className="a3-label">{label}</span>
        {value && <span className="font-mono text-[10px]">{value}</span>}
        <ChevronDown className="h-2.5 w-2.5" />
      </summary>
      <ul className="absolute left-0 top-full z-30 mt-1 w-44 rounded-md border border-border bg-popover p-1 shadow-raised">
        <li>
          <Link
            href={hrefFor(null)}
            className="block rounded-sm px-2 py-1 text-[11px] text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <span className="a3-label">All</span>
          </Link>
        </li>
        {options.map((o) => (
          <li key={o}>
            <Link
              href={hrefFor(o)}
              className={cn(
                "block rounded-sm px-2 py-1 text-[11px]",
                value === o ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary",
              )}
            >
              {o.toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
