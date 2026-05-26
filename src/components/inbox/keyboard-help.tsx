"use client";

import { useEffect, useState } from "react";
import { Keyboard, X } from "lucide-react";

/**
 * Press `?` anywhere on the inbox to pop this card with the full keymap.
 * Press Escape or click outside to close.
 */
export function KeyboardHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "?" && !inField) {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-raised"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-4 flex items-center gap-2">
          <Keyboard className="h-4 w-4 text-primary" />
          <h3 className="text-[16px] font-extrabold tracking-tight text-foreground">Keyboard shortcuts</h3>
        </div>
        <ul className="space-y-2 text-[13px]">
          {[
            { keys: ["j"], label: "Move focus to next thread" },
            { keys: ["k"], label: "Move focus to previous thread" },
            { keys: ["Enter"], label: "Open the focused thread" },
            { keys: ["e"], label: "Archive the focused thread" },
            { keys: ["s"], label: "Snooze the focused thread for 1 day" },
            { keys: ["d"], label: "Mark the focused thread done" },
            { keys: ["x"], label: "Toggle selection on the focused thread" },
            { keys: ["Esc"], label: "Clear selection / close this dialog" },
            { keys: ["?"], label: "Toggle this dialog" },
          ].map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3">
              <span className="text-foreground">{row.label}</span>
              <span className="flex gap-1">
                {row.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded-sm border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px] font-bold text-foreground"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
          Shortcuts only work while the inbox is focused — they're ignored when typing in a search box or comment field.
        </p>
      </div>
    </div>
  );
}
