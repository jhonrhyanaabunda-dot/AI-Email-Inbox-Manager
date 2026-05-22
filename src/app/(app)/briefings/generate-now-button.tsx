"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function GenerateNowButton() {
  const [pending, setPending] = useState(false);
  async function run() {
    setPending(true);
    const res = await fetch("/api/briefings", { method: "POST" });
    setPending(false);
    if (res.ok) toast.success("Briefing queued — refresh in ~30s");
    else toast.error("Could not queue briefing");
  }
  return (
    <Button size="sm" variant="outline" onClick={run} disabled={pending}>
      <Sparkles className="mr-1 h-3.5 w-3.5" /> {pending ? "Generating…" : "Generate now"}
    </Button>
  );
}
