import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DECK } from "./deck-data";
import { DeckClient } from "./deck-client";

export const metadata = {
  title: "Methodology · A3 Inbox AI",
  description:
    "The methodology slide deck for A3 Inbox AI — pipeline, architecture, security, onboarding, ROI. Download as a real .pptx PowerPoint.",
};

export default function MethodologyPage() {
  return (
    <div className="methodology-deck flex h-screen w-screen flex-col overflow-hidden bg-a3-navy text-white">
      {/* Top chrome — hidden in fullscreen Present mode by the client component. */}
      <header
        id="deck-chrome"
        className="flex h-12 shrink-0 items-center gap-3 border-b border-white/10 bg-a3-navy/95 px-4 backdrop-blur md:px-6"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[12px] text-white/65 hover:text-white"
        >
          <ArrowLeft className="h-3 w-3" /> Back to product page
        </Link>
        <Badge variant="status" className="border-primary/60 bg-primary/15 text-primary">
          Methodology · Slide deck
        </Badge>
        <div id="deck-controls" className="ml-auto flex items-center gap-2" />
      </header>

      {/* Slides + presenter controls. All interactive bits are in DeckClient. */}
      <DeckClient deck={DECK} />
    </div>
  );
}
