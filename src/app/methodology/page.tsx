import { DECK } from "./deck-data";
import { DeckClient } from "./deck-client";

export const metadata = {
  title: "Methodology · A3 Inbox AI",
  description:
    "The methodology slide deck for A3 Inbox AI — pipeline, architecture, security, onboarding, ROI. Download as a real .pptx PowerPoint.",
};

export default function MethodologyPage() {
  return <DeckClient deck={DECK} />;
}
