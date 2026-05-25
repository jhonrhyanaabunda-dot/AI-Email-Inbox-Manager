"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function WorkflowToggle({ id, enabled }: { id: string; enabled: boolean }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [val, setVal] = useState(enabled);
  const [pending, setPending] = useState(false);

  async function toggle() {
    const next = !val;
    setVal(next);
    setPending(true);
    const res = await fetch(`/api/workflows/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEnabled: next }),
    });
    setPending(false);
    if (res.ok) {
      toast.success(next ? "Workflow enabled" : "Workflow disabled");
      startTransition(() => router.refresh());
    } else {
      setVal(!next);
      toast.error("Could not update workflow");
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      role="switch"
      aria-checked={val}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
        val ? "bg-primary" : "bg-muted"
      } disabled:opacity-50`}
    >
      <span
        className={`inline-block h-5 w-5 translate-y-0.5 transform rounded-full bg-white shadow transition-transform ${
          val ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
