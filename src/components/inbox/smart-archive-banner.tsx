"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Archive } from "lucide-react";
import { toast } from "sonner";

export function SmartArchiveBanner({ count }: { count: number }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [pending, setPending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function archive() {
    setPending(true);
    const res = await fetch(`/api/threads/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "archive_vendor_lowpriority" }),
    });
    setPending(false);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.success(`A3 AI archived ${data.archived ?? count} vendor email${(data.archived ?? count) === 1 ? "" : "s"}`);
      startTransition(() => router.refresh());
    } else {
      toast.error("Archive failed");
    }
  }

  return (
    <div className="border-b border-primary/20 bg-primary/[0.06] px-4 py-3">
      <div className="flex items-start gap-2.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="flex-1">
          <div className="text-[13px] font-semibold text-foreground">
            A3 AI flagged <span className="text-primary">{count}</span> low-priority vendor email
            {count === 1 ? "" : "s"} ready to archive
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            DealerSocket digests, CarGurus reports, automated newsletters — safe to clear in one click.
          </div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={archive}
              disabled={pending}
              className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-[12px] font-semibold text-primary-foreground shadow-emerald transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              <Archive className="h-3 w-3" />
              {pending ? "Archiving…" : "Archive all"}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-[12px] text-muted-foreground hover:text-foreground"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
