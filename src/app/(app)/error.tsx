"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw, Home } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] unhandled error:", error);
  }, [error]);

  return (
    <div className="flex h-full items-center justify-center bg-background p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h2 className="text-[22px] font-extrabold tracking-tight text-foreground">
          Something tripped in the demo.
        </h2>
        <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
          One of the in-memory data lookups went sideways. This is a demo — try reloading or
          jumping back to the inbox.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[10px] text-a3-fog">ref: {error.digest}</p>
        )}
        <div className="mt-7 flex justify-center gap-2">
          <Button onClick={() => reset()} size="sm" variant="outline" className="gap-1.5">
            <RotateCw className="h-3.5 w-3.5" /> Try again
          </Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/inbox">
              <Home className="h-3.5 w-3.5" /> Back to inbox
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
