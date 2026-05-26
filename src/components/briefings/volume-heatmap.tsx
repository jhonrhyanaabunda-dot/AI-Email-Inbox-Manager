"use client";

import { useState } from "react";

/**
 * 30-day email-volume heatmap. Each cell is one day; darker = more threads.
 * Days are arranged in a 5×6 grid (oldest top-left → today bottom-right) so
 * the eye scans naturally toward "now". Hover or tap a cell to see the
 * value + date in a tooltip beneath the grid.
 */
export function VolumeHeatmap({
  days,
}: {
  days: Array<{ date: string; threads: number; escalations?: number }>;
}) {
  // Normalize to last 30 entries, oldest first.
  const cells = days.slice(0, 30).reverse();
  const max = Math.max(1, ...cells.map((d) => d.threads));
  const [hover, setHover] = useState<number | null>(null);

  const active = hover != null ? cells[hover] : null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="a3-label text-a3-fog">Email volume · last 30 days</div>
          <div className="mt-0.5 text-[13px] font-semibold text-foreground">
            {active ? (
              <>
                {active.threads} thread{active.threads === 1 ? "" : "s"} on{" "}
                {new Date(active.date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
                {active.escalations && active.escalations > 0 ? (
                  <span className="ml-1 text-red-600 dark:text-red-400">
                    · {active.escalations} escalation{active.escalations === 1 ? "" : "s"}
                  </span>
                ) : null}
              </>
            ) : (
              <span className="text-muted-foreground">Hover a cell for that day</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-a3-fog">
          <span>Less</span>
          {[0.1, 0.3, 0.55, 0.8, 1].map((step) => (
            <span key={step} className={`h-3 w-3 rounded-sm ${bgFor(step)}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
      >
        {cells.map((d, i) => {
          const t = max > 0 ? d.threads / max : 0;
          const hasEsc = (d.escalations ?? 0) > 0;
          return (
            <button
              type="button"
              key={d.date}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((cur) => (cur === i ? null : cur))}
              onFocus={() => setHover(i)}
              onBlur={() => setHover((cur) => (cur === i ? null : cur))}
              aria-label={`${d.threads} threads on ${d.date}`}
              className={`relative aspect-square rounded-sm transition-all ${bgFor(t)} ${
                hover === i ? "ring-2 ring-primary ring-offset-1 ring-offset-card" : ""
              }`}
            >
              {hasEsc && (
                <span className="absolute right-0 top-0 h-1.5 w-1.5 -translate-y-0.5 translate-x-0.5 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function bgFor(t: number): string {
  if (t === 0) return "bg-secondary";
  if (t < 0.2) return "bg-primary/15";
  if (t < 0.4) return "bg-primary/30";
  if (t < 0.65) return "bg-primary/55";
  if (t < 0.85) return "bg-primary/75";
  return "bg-primary";
}
