"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

/**
 * "Download PDF" trigger. We don't generate a real PDF — instead we open the
 * browser's print dialog with print-specific CSS in globals.css; the user
 * picks "Save as PDF" as the destination. This stays zero-dependency and
 * works on every modern browser.
 */
export function PrintButton() {
  return (
    <Button
      size="sm"
      className="h-8 gap-1.5 text-[12px]"
      onClick={() => {
        if (typeof window !== "undefined") window.print();
      }}
    >
      <Download className="h-3.5 w-3.5" />
      Download PDF
    </Button>
  );
}
