"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Download, KeyboardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Slide } from "./deck-data";
import { exportDeckAsPPTX } from "./pptx";
import { toast } from "sonner";

export function DeckClient({ deck }: { deck: Slide[] }) {
  const [idx, setIdx] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const total = deck.length;
  const slide = deck[idx];

  const go = useCallback(
    (next: number) => setIdx((cur) => Math.max(0, Math.min(total - 1, next))),
    [total],
  );

  // Keyboard nav: ←/→ prev/next, Space next, Home/End jump, Esc exit fullscreen.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      switch (e.key) {
        case "ArrowRight":
        case " ":
        case "PageDown":
          e.preventDefault();
          go(idx + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          go(idx - 1);
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(total - 1);
          break;
        case "Escape":
          if (document.fullscreenElement) document.exitFullscreen?.();
          break;
        case "f":
        case "F":
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx, total, go]);

  // Sync state when the browser fullscreens / exits via Esc.
  useEffect(() => {
    function onChange() {
      setFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      stageRef.current?.requestFullscreen?.();
    }
  }

  async function downloadPPTX() {
    if (exporting) return;
    setExporting(true);
    try {
      await exportDeckAsPPTX(deck);
      toast.success("Downloaded A3-Inbox-AI-Methodology.pptx");
    } catch (err) {
      console.error("[deck] pptx export failed:", err);
      toast.error(`Couldn't generate .pptx: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      {/* Inject the top-bar controls into the slot defined by page.tsx so the
          page-level header keeps its layout. */}
      <DeckControlsPortal>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 border-white/20 bg-transparent text-[12px] text-white hover:bg-white/10 hover:text-primary"
          onClick={toggleFullscreen}
        >
          {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          {fullscreen ? "Exit" : "Present"}
        </Button>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-[12px]"
          onClick={downloadPPTX}
          disabled={exporting}
        >
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Generating…" : "Download .pptx"}
        </Button>
      </DeckControlsPortal>

      {/* Slide stage. 16:9 frame centered in the viewport. */}
      <div
        ref={stageRef}
        className={`relative flex flex-1 items-center justify-center overflow-hidden bg-a3-navy ${
          fullscreen ? "p-0" : "p-4 md:p-8"
        }`}
      >
        <div
          className="relative aspect-video w-full max-w-[1400px] overflow-hidden rounded-lg border border-white/10 bg-a3-navy shadow-2xl"
          style={fullscreen ? { borderRadius: 0, border: "none", maxWidth: "100vw", maxHeight: "100vh" } : undefined}
        >
          {/* Soft emerald glow accents — show on every slide. */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

          <SlideContent slide={slide} />

          {/* Page number, bottom-right of every slide. */}
          <div className="absolute bottom-4 right-6 font-mono text-[11px] uppercase tracking-wider text-white/40">
            {String(idx + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </div>
          {/* Brand mark, bottom-left of every slide. */}
          <div className="absolute bottom-4 left-6 flex items-center gap-2 text-white/40">
            <span className="grid h-5 w-5 place-items-center rounded-sm bg-primary text-primary-foreground">
              <span className="text-[8px] font-black tracking-tight">A3</span>
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider">A3 Inbox AI</span>
          </div>
        </div>

        {/* Arrow buttons — overlap the stage edges so they're reachable in both
            normal + fullscreen view. */}
        <button
          type="button"
          aria-label="Previous slide"
          disabled={idx === 0}
          onClick={() => go(idx - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-a3-navy/70 p-2 text-white/70 transition-all hover:border-white/40 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          disabled={idx === total - 1}
          onClick={() => go(idx + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-a3-navy/70 p-2 text-white/70 transition-all hover:border-white/40 hover:text-white disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Bottom filmstrip — quick jump. Hidden in fullscreen. */}
      {!fullscreen && (
        <footer className="flex shrink-0 items-center gap-2 border-t border-white/10 bg-a3-navy/95 px-4 py-2 md:px-6">
          <div className="flex items-center gap-1 text-[10px] text-white/40">
            <KeyboardIcon className="h-3 w-3" />
            <span className="uppercase tracking-wider">←→ / Space · F fullscreen</span>
          </div>
          <div className="ml-auto flex flex-1 items-center gap-1 overflow-x-auto pl-4 scrollbar-thin">
            {deck.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`Slide ${i + 1}`}
                title={slideLabel(s)}
                className={`h-1.5 shrink-0 rounded-full transition-all ${
                  i === idx ? "w-8 bg-primary" : "w-3 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </footer>
      )}
    </>
  );
}

/* ─── Helpers + slide renderers ────────────────────────────────────────── */

function slideLabel(s: Slide): string {
  if ("title" in s) return s.title;
  return s.kind;
}

function DeckControlsPortal({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<Element | null>(null);
  useEffect(() => {
    setTarget(document.getElementById("deck-controls"));
  }, []);
  if (!target) return null;
  // Portal-without-portal: just render into the placeholder via append-only DOM.
  // React 19 supports rendering directly via Portal but we don't want to pull
  // react-dom client APIs; instead we let the parent flex-row carry it.
  return <PortalFallback target={target}>{children}</PortalFallback>;
}

function PortalFallback({ target, children }: { target: Element; children: React.ReactNode }) {
  // Lightweight portal using createPortal — imported lazily to keep this file
  // free of react-dom imports at module scope.
  const [createPortal, setCreatePortal] = useState<null | ((c: React.ReactNode, t: Element) => any)>(null);
  useEffect(() => {
    import("react-dom").then((m) => setCreatePortal(() => m.createPortal));
  }, []);
  if (!createPortal) return null;
  return createPortal(children, target);
}

function SlideContent({ slide }: { slide: Slide }) {
  switch (slide.kind) {
    case "title":
      return (
        <div className="relative z-10 flex h-full flex-col justify-center p-12 md:p-20">
          <div className="a3-label mb-4 text-primary">{slide.eyebrow}</div>
          <h1
            className="text-white"
            style={{ fontSize: "clamp(48px, 7vw, 84px)", lineHeight: 1.02, letterSpacing: "0.005em", fontWeight: 800 }}
          >
            {slide.title}
          </h1>
          <p className="mt-6 max-w-2xl text-[18px] leading-[28px] text-white/75 md:text-[22px] md:leading-[32px]">
            {slide.subtitle}
          </p>
          <div className="mt-10 text-[12px] uppercase tracking-[0.1em] text-white/40">{slide.meta}</div>
        </div>
      );

    case "agenda":
      return (
        <div className="relative z-10 flex h-full flex-col justify-center p-12 md:p-20">
          <div className="a3-label mb-4 text-primary">{slide.eyebrow ?? "Agenda"}</div>
          <h2 className="mb-10 text-white" style={{ fontSize: 48, fontWeight: 800, letterSpacing: "0.005em", lineHeight: 1.05 }}>
            {slide.title}
          </h2>
          <ol className="max-w-2xl space-y-3">
            {slide.items.map((item, i) => (
              <li key={i} className="flex items-baseline gap-4 text-[20px] text-white/90">
                <span className="font-mono text-[14px] font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </div>
      );

    case "split":
      return (
        <div className="relative z-10 grid h-full grid-cols-1 gap-10 p-12 md:grid-cols-[1.1fr_1fr] md:p-16">
          <div className="flex flex-col justify-center">
            <div className="a3-label mb-3 text-primary">{slide.eyebrow}</div>
            <h2
              className="text-white"
              style={{ fontSize: 40, fontWeight: 800, letterSpacing: "0.005em", lineHeight: 1.1 }}
            >
              {slide.title}
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-[24px] text-white/70">{slide.lead}</p>
          </div>
          <ul className="grid content-center gap-4">
            {slide.bullets.map((b, i) => (
              <li key={i} className="rounded-md border border-white/10 bg-white/5 p-4">
                <div className="text-[15px] font-extrabold text-primary">{b.bold}</div>
                <div className="mt-1.5 text-[13px] leading-relaxed text-white/75">{b.body}</div>
              </li>
            ))}
          </ul>
        </div>
      );

    case "pipeline":
      return (
        <div className="relative z-10 flex h-full flex-col p-12 md:p-16">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <span className="font-mono text-[14px] font-black">{slide.step}</span>
            </span>
            <div className="a3-label text-primary">{slide.eyebrow}</div>
          </div>
          <h2
            className="mt-6 text-white"
            style={{ fontSize: 56, fontWeight: 800, letterSpacing: "0.005em", lineHeight: 1.05 }}
          >
            {slide.title}
          </h2>
          <p className="mt-4 text-[20px] italic leading-[30px] text-primary/85">{slide.oneLiner}</p>
          <p className="mt-6 max-w-3xl text-[15px] leading-[25px] text-white/75 md:text-[16px] md:leading-[27px]">
            {slide.body}
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {slide.chips.map((c) => (
              <span
                key={c}
                className="rounded-sm border border-primary/40 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-primary"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      );

    case "stats":
      return (
        <div className="relative z-10 flex h-full flex-col justify-center p-12 md:p-16">
          <div className="a3-label mb-3 text-primary">{slide.eyebrow}</div>
          <h2
            className="mb-10 text-white"
            style={{ fontSize: 44, fontWeight: 800, letterSpacing: "0.005em", lineHeight: 1.1 }}
          >
            {slide.title}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {slide.metrics.map((m, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-5">
                <div
                  className="text-primary"
                  style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1 }}
                  dangerouslySetInnerHTML={{ __html: m.value }}
                />
                <div className="mt-3 text-[14px] font-bold text-white">{m.label}</div>
                <div className="mt-1 text-[11px] text-white/55">{m.note}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case "timeline":
      return (
        <div className="relative z-10 flex h-full flex-col justify-center p-12 md:p-16">
          <div className="a3-label mb-3 text-primary">{slide.eyebrow}</div>
          <h2
            className="text-white"
            style={{ fontSize: 40, fontWeight: 800, letterSpacing: "0.005em", lineHeight: 1.1 }}
          >
            {slide.title}
          </h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-[22px] text-white/70">{slide.lead}</p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            {slide.steps.map((s, i) => (
              <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="font-mono text-[10px] uppercase tracking-wider text-primary">{s.week}</div>
                <div className="mt-2 text-[15px] font-extrabold text-white">{s.title}</div>
                <div className="mt-2 text-[12px] leading-relaxed text-white/65">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      );

    case "pricing":
      return (
        <div className="relative z-10 flex h-full flex-col justify-center p-12 md:p-16">
          <div className="a3-label mb-3 text-primary">{slide.eyebrow}</div>
          <h2
            className="mb-10 text-white"
            style={{ fontSize: 44, fontWeight: 800, letterSpacing: "0.005em", lineHeight: 1.1 }}
          >
            {slide.title}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {slide.tiers.map((t) => (
              <div
                key={t.name}
                className={`rounded-lg border p-5 ${
                  t.highlighted ? "border-primary bg-primary/[0.08] shadow-emerald" : "border-white/10 bg-white/5"
                }`}
              >
                {t.highlighted && (
                  <span className="mb-2 inline-block rounded-sm bg-primary px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-primary-foreground">
                    Most popular
                  </span>
                )}
                <div className="a3-label text-white/55">{t.name}</div>
                <div className="mt-1 flex items-end gap-1">
                  <span className="text-white" style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1 }}>
                    {t.price}
                  </span>
                  <span className="pb-0.5 text-[11px] text-white/55">{t.suffix}</span>
                </div>
                <ul className="mt-5 space-y-1.5 text-[12px] text-white/80">
                  {t.bullets.map((b) => (
                    <li key={b}>· {b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );

    case "cta":
      return (
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-12 text-center md:p-20">
          <div className="a3-label mb-4 text-primary">{slide.eyebrow}</div>
          <h2
            className="max-w-3xl text-white"
            style={{ fontSize: "clamp(40px, 6vw, 64px)", lineHeight: 1.05, letterSpacing: "0.005em", fontWeight: 800 }}
          >
            {slide.title}
          </h2>
          <p className="mt-6 max-w-2xl text-[17px] leading-[26px] text-white/75 md:text-[18px]">{slide.subtitle}</p>
          <ul className="mt-10 space-y-2 text-[13px] text-white/65">
            {slide.bullets.map((b) => (
              <li key={b}>· {b}</li>
            ))}
          </ul>
        </div>
      );
  }
}
