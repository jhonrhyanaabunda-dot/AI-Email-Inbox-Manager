/**
 * Real PowerPoint (.pptx) export for the methodology deck.
 *
 * Runs entirely in the browser via pptxgenjs. The library is loaded lazily
 * (only when the user clicks "Download .pptx") so it doesn't bloat the page
 * bundle for visitors who never export.
 */

import type { Slide } from "./deck-data";

const NAVY = "0E1B2C";
const EMERALD = "10B981";
const WHITE = "FFFFFF";
const WHITE_60 = "BFBFBF";
const WHITE_40 = "8C8C8C";
const PANEL = "1A2740";

export async function exportDeckAsPPTX(deck: Slide[]) {
  // Lazy-load — pptxgenjs is ~250KB. Don't pay that cost on every page visit.
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pres = new PptxGenJS();

  pres.layout = "LAYOUT_WIDE"; // 13.333" × 7.5", matches PowerPoint widescreen
  pres.title = "A3 Inbox AI · Methodology";
  pres.author = "A3 Brands";
  pres.company = "A3 Brands";
  pres.subject = "A3 Inbox AI Methodology Deck";

  // Master slide — navy background, brand mark, page number.
  pres.defineSlideMaster({
    title: "A3_MASTER",
    background: { color: NAVY },
    objects: [
      // Brand mark bottom-left
      { rect: { x: 0.5, y: 7.05, w: 0.25, h: 0.25, fill: { color: EMERALD } } },
      {
        text: {
          text: "A3",
          options: { x: 0.5, y: 7.05, w: 0.25, h: 0.25, align: "center", valign: "middle", fontSize: 7, bold: true, color: NAVY },
        },
      },
      {
        text: {
          text: "A3 INBOX AI",
          options: { x: 0.85, y: 7.04, w: 2, h: 0.25, fontSize: 9, color: WHITE_40, valign: "middle", charSpacing: 2 },
        },
      },
    ],
    slideNumber: { x: 12.5, y: 7.07, w: 0.5, h: 0.2, color: WHITE_40, fontSize: 9, fontFace: "Courier New" },
  });

  for (const slide of deck) {
    renderSlide(pres, slide);
  }

  await pres.writeFile({ fileName: "A3-Inbox-AI-Methodology.pptx" });
}

function renderSlide(pres: any, slide: Slide) {
  const s = pres.addSlide({ masterName: "A3_MASTER" });

  switch (slide.kind) {
    case "title":
      s.addText(slide.eyebrow, {
        x: 0.8, y: 0.8, w: 8, h: 0.3,
        fontSize: 11, color: EMERALD, bold: true, charSpacing: 4,
      });
      s.addText(slide.title, {
        x: 0.8, y: 1.5, w: 11.5, h: 2.5,
        fontSize: 72, bold: true, color: WHITE, fontFace: "Inter",
      });
      s.addText(slide.subtitle, {
        x: 0.8, y: 4.2, w: 9, h: 1,
        fontSize: 22, color: WHITE_60, fontFace: "Inter",
      });
      s.addText(slide.meta, {
        x: 0.8, y: 6.4, w: 8, h: 0.3,
        fontSize: 10, color: WHITE_40, charSpacing: 4,
      });
      break;

    case "agenda":
      s.addText("AGENDA", {
        x: 0.8, y: 0.8, w: 4, h: 0.3,
        fontSize: 11, color: EMERALD, bold: true, charSpacing: 4,
      });
      s.addText(slide.title, {
        x: 0.8, y: 1.2, w: 8, h: 1,
        fontSize: 44, bold: true, color: WHITE, fontFace: "Inter",
      });
      slide.items.forEach((item, i) => {
        const y = 2.7 + i * 0.55;
        s.addText(String(i + 1).padStart(2, "0"), {
          x: 0.8, y, w: 0.6, h: 0.5,
          fontSize: 14, color: EMERALD, bold: true, fontFace: "Courier New",
        });
        s.addText(item, {
          x: 1.4, y, w: 10, h: 0.5,
          fontSize: 18, color: WHITE, fontFace: "Inter",
        });
      });
      break;

    case "split":
      s.addText(slide.eyebrow, {
        x: 0.8, y: 0.8, w: 6, h: 0.3,
        fontSize: 11, color: EMERALD, bold: true, charSpacing: 4,
      });
      s.addText(slide.title, {
        x: 0.8, y: 1.3, w: 6, h: 2.5,
        fontSize: 34, bold: true, color: WHITE, fontFace: "Inter",
      });
      s.addText(slide.lead, {
        x: 0.8, y: 4.1, w: 5.8, h: 2,
        fontSize: 14, color: WHITE_60, fontFace: "Inter",
      });
      slide.bullets.forEach((b, i) => {
        const y = 1.3 + i * 1.35;
        s.addShape("roundRect", {
          x: 7, y, w: 5.6, h: 1.2,
          fill: { color: PANEL }, line: { color: WHITE_40, width: 0.5 }, rectRadius: 0.08,
        });
        s.addText(b.bold, {
          x: 7.2, y: y + 0.1, w: 5.2, h: 0.35,
          fontSize: 13, bold: true, color: EMERALD, fontFace: "Inter",
        });
        s.addText(b.body, {
          x: 7.2, y: y + 0.45, w: 5.2, h: 0.7,
          fontSize: 11, color: WHITE, fontFace: "Inter",
        });
      });
      break;

    case "pipeline":
      s.addShape("rect", {
        x: 0.8, y: 0.8, w: 0.5, h: 0.5,
        fill: { color: EMERALD },
      });
      s.addText(String(slide.step), {
        x: 0.8, y: 0.8, w: 0.5, h: 0.5,
        fontSize: 22, bold: true, color: NAVY, align: "center", valign: "middle", fontFace: "Courier New",
      });
      s.addText(slide.eyebrow, {
        x: 1.5, y: 0.85, w: 6, h: 0.4,
        fontSize: 11, color: EMERALD, bold: true, charSpacing: 4, valign: "middle",
      });
      s.addText(slide.title, {
        x: 0.8, y: 1.8, w: 11.5, h: 1.2,
        fontSize: 52, bold: true, color: WHITE, fontFace: "Inter",
      });
      s.addText(slide.oneLiner, {
        x: 0.8, y: 3.1, w: 11.5, h: 0.5,
        fontSize: 18, italic: true, color: EMERALD, fontFace: "Inter",
      });
      s.addText(slide.body, {
        x: 0.8, y: 4, w: 11.5, h: 1.8,
        fontSize: 14, color: WHITE_60, fontFace: "Inter",
      });
      slide.chips.forEach((chip, i) => {
        const x = 0.8 + i * 2.5;
        s.addShape("roundRect", {
          x, y: 6.1, w: 2.3, h: 0.4,
          fill: { color: NAVY }, line: { color: EMERALD, width: 0.75 }, rectRadius: 0.04,
        });
        s.addText(chip, {
          x, y: 6.1, w: 2.3, h: 0.4,
          fontSize: 10, bold: true, color: EMERALD, align: "center", valign: "middle", fontFace: "Courier New", charSpacing: 2,
        });
      });
      break;

    case "stats":
      s.addText(slide.eyebrow, {
        x: 0.8, y: 0.8, w: 6, h: 0.3,
        fontSize: 11, color: EMERALD, bold: true, charSpacing: 4,
      });
      s.addText(slide.title, {
        x: 0.8, y: 1.3, w: 11.5, h: 1.2,
        fontSize: 36, bold: true, color: WHITE, fontFace: "Inter",
      });
      slide.metrics.forEach((m, i) => {
        const x = 0.8 + (i % 4) * 3;
        const y = 3.2;
        s.addShape("roundRect", {
          x, y, w: 2.8, h: 2.5,
          fill: { color: PANEL }, line: { color: WHITE_40, width: 0.5 }, rectRadius: 0.08,
        });
        // Strip HTML entities for pptx — &lt; / &gt; etc.
        const cleanValue = m.value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
        s.addText(cleanValue, {
          x, y: y + 0.15, w: 2.8, h: 1,
          fontSize: 36, bold: true, color: EMERALD, align: "center", valign: "middle", fontFace: "Inter",
        });
        s.addText(m.label, {
          x: x + 0.15, y: y + 1.2, w: 2.5, h: 0.5,
          fontSize: 13, bold: true, color: WHITE, fontFace: "Inter",
        });
        s.addText(m.note, {
          x: x + 0.15, y: y + 1.7, w: 2.5, h: 0.7,
          fontSize: 10, color: WHITE_60, fontFace: "Inter",
        });
      });
      break;

    case "timeline":
      s.addText(slide.eyebrow, {
        x: 0.8, y: 0.8, w: 6, h: 0.3,
        fontSize: 11, color: EMERALD, bold: true, charSpacing: 4,
      });
      s.addText(slide.title, {
        x: 0.8, y: 1.2, w: 11.5, h: 1,
        fontSize: 34, bold: true, color: WHITE, fontFace: "Inter",
      });
      s.addText(slide.lead, {
        x: 0.8, y: 2.2, w: 10.5, h: 0.7,
        fontSize: 13, color: WHITE_60, fontFace: "Inter",
      });
      slide.steps.forEach((step, i) => {
        const x = 0.8 + i * 3.05;
        const y = 3.3;
        s.addShape("roundRect", {
          x, y, w: 2.85, h: 2.8,
          fill: { color: PANEL }, line: { color: WHITE_40, width: 0.5 }, rectRadius: 0.08,
        });
        s.addText(step.week, {
          x: x + 0.2, y: y + 0.15, w: 2.5, h: 0.3,
          fontSize: 10, bold: true, color: EMERALD, charSpacing: 3, fontFace: "Courier New",
        });
        s.addText(step.title, {
          x: x + 0.2, y: y + 0.5, w: 2.5, h: 0.5,
          fontSize: 16, bold: true, color: WHITE, fontFace: "Inter",
        });
        s.addText(step.body, {
          x: x + 0.2, y: y + 1.1, w: 2.5, h: 1.6,
          fontSize: 10, color: WHITE_60, fontFace: "Inter",
        });
      });
      break;

    case "pricing":
      s.addText(slide.eyebrow, {
        x: 0.8, y: 0.8, w: 6, h: 0.3,
        fontSize: 11, color: EMERALD, bold: true, charSpacing: 4,
      });
      s.addText(slide.title, {
        x: 0.8, y: 1.2, w: 11.5, h: 1.2,
        fontSize: 36, bold: true, color: WHITE, fontFace: "Inter",
      });
      slide.tiers.forEach((t, i) => {
        const x = 0.8 + i * 4.1;
        const y = 2.8;
        s.addShape("roundRect", {
          x, y, w: 3.9, h: 3.8,
          fill: { color: t.highlighted ? "0F3528" : PANEL },
          line: { color: t.highlighted ? EMERALD : WHITE_40, width: t.highlighted ? 2 : 0.5 },
          rectRadius: 0.1,
        });
        if (t.highlighted) {
          s.addShape("roundRect", {
            x: x + 0.2, y: y + 0.2, w: 1.5, h: 0.3,
            fill: { color: EMERALD }, rectRadius: 0.04,
          });
          s.addText("MOST POPULAR", {
            x: x + 0.2, y: y + 0.2, w: 1.5, h: 0.3,
            fontSize: 8, bold: true, color: NAVY, align: "center", valign: "middle", charSpacing: 2, fontFace: "Courier New",
          });
        }
        s.addText(t.name, {
          x: x + 0.3, y: y + 0.65, w: 3.5, h: 0.3,
          fontSize: 10, bold: true, color: WHITE_60, charSpacing: 3, fontFace: "Courier New",
        });
        s.addText(t.price, {
          x: x + 0.3, y: y + 1, w: 2.5, h: 0.6,
          fontSize: 30, bold: true, color: WHITE, fontFace: "Inter",
        });
        s.addText(t.suffix, {
          x: x + 0.3, y: y + 1.6, w: 3.5, h: 0.3,
          fontSize: 10, color: WHITE_60, fontFace: "Inter",
        });
        t.bullets.forEach((b, j) => {
          s.addText(`·  ${b}`, {
            x: x + 0.3, y: y + 2.05 + j * 0.35, w: 3.5, h: 0.3,
            fontSize: 11, color: WHITE, fontFace: "Inter",
          });
        });
      });
      break;

    case "cta":
      s.addText(slide.eyebrow, {
        x: 0.8, y: 1.2, w: 11.5, h: 0.4,
        fontSize: 12, color: EMERALD, bold: true, charSpacing: 4, align: "center",
      });
      s.addText(slide.title, {
        x: 0.8, y: 2, w: 11.5, h: 2,
        fontSize: 60, bold: true, color: WHITE, align: "center", fontFace: "Inter",
      });
      s.addText(slide.subtitle, {
        x: 1.5, y: 4.4, w: 10.3, h: 1,
        fontSize: 18, color: WHITE_60, align: "center", fontFace: "Inter",
      });
      slide.bullets.forEach((b, i) => {
        s.addText(`·  ${b}`, {
          x: 1.5, y: 5.6 + i * 0.32, w: 10.3, h: 0.3,
          fontSize: 12, color: WHITE_60, align: "center", fontFace: "Inter",
        });
      });
      break;
  }
}
