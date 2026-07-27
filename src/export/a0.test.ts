// The A0 file is validated with a REAL parser (pdf-lib): the document must
// survive a full structural parse (xref, objects, page tree), and the scale
// facts are measured from the parsed page and its decoded content streams —
// never by matching the writer's own strings. (The SVG-bug lesson.)
import { describe, it, expect } from "vitest";
import { PDFDocument, PDFRawStream } from "pdf-lib";
import { point } from "../geometry";
import { STANDARD_M, TEE, Piece, blockPieces } from "../drafting";
import { exportA0Pdf, PAGE_A0, PAGE_A0_LANDSCAPE } from "./a0";
import { CALIBRATION_CM } from "./calibration";

// Independently derived: 1 cm in PDF points. NOT imported from the writer.
const CM_PT = 72 / 2.54;

const pieces = blockPieces(TEE.draft(STANDARD_M));
const pdfText = exportA0Pdf(pieces, TEE.allowances, TEE.notches);

async function load(text: string): Promise<PDFDocument> {
  return PDFDocument.load(new TextEncoder().encode(text), { updateMetadata: false });
}

/** Every decoded content stream in the parsed document, concatenated. */
function streamsText(doc: PDFDocument): string {
  const chunks: string[] = [];
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream) chunks.push(new TextDecoder().decode(obj.contents));
  }
  return chunks.join("\n");
}

describe("exportA0Pdf — real parse", () => {
  it("survives a full structural parse by a real PDF library", async () => {
    const doc = await load(pdfText);
    expect(doc.getPageCount()).toBe(1);
  });

  it("is a single A0 portrait page, in points", async () => {
    const doc = await load(pdfText);
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBe(Math.round(84.1 * CM_PT));
    expect(height).toBe(Math.round(118.9 * CM_PT));
  });

  it("never tiles: no tile labels, no clipping windows", async () => {
    const content = streamsText(await load(pdfText));
    expect(content).not.toContain("Tile");
    expect(content).not.toContain(" W n");
  });
});

describe("exportA0Pdf — calibration square", () => {
  it("draws exactly one rectangle, measuring exactly 10 cm per side in points", async () => {
    const content = streamsText(await load(pdfText));
    const rects = [...content.matchAll(/(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) re/g)];
    expect(rects).toHaveLength(1);
    const [, , , w, h] = rects[0];
    expect(Number(w)).toBeCloseTo(CALIBRATION_CM * CM_PT, 2);
    expect(Number(h)).toBeCloseTo(CALIBRATION_CM * CM_PT, 2);
  });

  it("labels the square with its stated size", async () => {
    const content = streamsText(await load(pdfText));
    expect(content).toContain("(10 cm) Tj");
  });
});

describe("exportA0Pdf — whole pieces, print-oriented", () => {
  it("keeps every drawn coordinate on the page (whole pieces, no spill)", async () => {
    const doc = await load(pdfText);
    const { width, height } = doc.getPage(0).getSize();
    const content = streamsText(doc);
    const ops = [...content.matchAll(/(-?[\d.]+) (-?[\d.]+) [ml]\b/g)];
    expect(ops.length).toBeGreaterThan(100);
    for (const [, x, y] of ops) {
      expect(Number(x)).toBeGreaterThanOrEqual(0);
      expect(Number(x)).toBeLessThanOrEqual(width);
      expect(Number(y)).toBeGreaterThanOrEqual(0);
      expect(Number(y)).toBeLessThanOrEqual(height);
    }
  });

  it("labels every piece by name", async () => {
    const content = streamsText(await load(pdfText));
    expect(content).toContain("(FRONT) Tj");
    expect(content).toContain("(BACK) Tj");
    expect(content).toContain("(SLEEVE) Tj");
  });

  it("marks each kept fold unmistakably", async () => {
    const content = streamsText(await load(pdfText));
    // front + back are cut on the fold; the sleeve is not
    expect([...content.matchAll(/\(PLACE ON FOLD\) Tj/g)]).toHaveLength(2);
  });

  it("works without a notch table and on landscape A0", async () => {
    const doc = await load(exportA0Pdf(pieces, TEE.allowances, [], PAGE_A0_LANDSCAPE));
    const { width, height } = doc.getPage(0).getSize();
    expect(width).toBeGreaterThan(height);
    expect(height).toBe(Math.round(84.1 * CM_PT));
  });

  it("defaults to portrait A0", async () => {
    const doc = await load(exportA0Pdf(pieces, TEE.allowances));
    const { width, height } = doc.getPage(0).getSize();
    expect(height).toBeGreaterThan(width);
  });

  it("drops the calibration square below the nest when no shelf space remains", async () => {
    // One piece nearly as wide as the page: the square can't sit beside it, so
    // it must fall back to the margin below the nest.
    const wide: Piece = {
      name: "banner",
      onFold: false,
      edges: [
        { kind: "line", name: "top", start: point(0, 0), end: point(78, 0) },
        { kind: "line", name: "right", start: point(78, 0), end: point(78, 20) },
        { kind: "line", name: "bottom", start: point(78, 20), end: point(0, 20) },
        { kind: "line", name: "left", start: point(0, 20), end: point(0, 0) },
      ],
    };
    const doc = await load(exportA0Pdf([wide], { default: 1 }));
    const content = streamsText(doc);
    const rects = [...content.matchAll(/(-?[\d.]+) (-?[\d.]+) (-?[\d.]+) (-?[\d.]+) re/g)];
    expect(rects).toHaveLength(1);
    // Fallback puts the square's left edge at the sheet margin (2 cm, in points).
    expect(Number(rects[0][1])).toBeCloseTo(2 * CM_PT, 2);
  });
});

describe("A0 page constants", () => {
  it("are the ISO A0 sheet in cm, portrait and landscape", () => {
    expect(PAGE_A0.width).toBeCloseTo(84.1, 6);
    expect(PAGE_A0.height).toBeCloseTo(118.9, 6);
    expect(PAGE_A0_LANDSCAPE.width).toBe(PAGE_A0.height);
    expect(PAGE_A0_LANDSCAPE.height).toBe(PAGE_A0.width);
  });
});
