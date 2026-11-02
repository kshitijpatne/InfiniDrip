// Slice 73: parse Polo's PDF outputs with pdf-lib, a real consumer.
import { describe, it, expect } from "vitest";
import { PDFDocument, PDFRawStream } from "pdf-lib";
import { STANDARD_M, POLO, blockPieces, draftAtSize } from "../drafting";
import { exportPdf } from "./pdf";
import { exportA0Pdf } from "./a0";
import { exportTechPack } from "./techpack";
import { POLO_ZIPPER_CLOSURE_PROFILE_OPTION_ID, POLO_ZIPPER_CLOSURE_PROFILE_VALUE } from "../drafting/polo";

const OPTIONS = {
  placketLength: 20, placketWidth: 3.5, standHeight: 2.5, collarLeafDepth: 6,
  standFrontRise: 1.25, collarPointExtension: 2.25, sideVentDepth: 3, backHemDrop: 2,
};

async function parsePdf(text: string): Promise<PDFDocument> {
  return PDFDocument.load(Buffer.from(text, "utf8"), { updateMetadata: false });
}

function streamText(doc: PDFDocument): string {
  return streamTexts(doc).join("\n");
}

function streamTexts(doc: PDFDocument): string[] {
  return [...doc.context.enumerateIndirectObjects()]
    .filter(([, object]) => object instanceof PDFRawStream)
    .map(([, object]) => new TextDecoder().decode((object as PDFRawStream).contents));
}

describe("Slice 73 — Polo PDF readiness", () => {
  it("places P07 zipper geometry inside the printable area of geometry-bearing tiled pages", async () => {
    const p07Options = {
      ...OPTIONS,
      placketLength: 20,
      placketWidth: 3.5,
      [POLO_ZIPPER_CLOSURE_PROFILE_OPTION_ID]: POLO_ZIPPER_CLOSURE_PROFILE_VALUE,
    };
    const pieces = blockPieces(draftAtSize(STANDARD_M, POLO.grade, 2, POLO.draft, p07Options));
    const doc = await parsePdf(exportPdf(pieces, POLO.allowances, undefined, 1.0, true));
    const streams = streamTexts(doc);
    const { width, height } = doc.getPage(0).getSize();
    const printableX = 72 / 2.54;
    const printableY = 72 / 2.54;

    expect(doc.getPageCount()).toBeGreaterThan(1);
    expect(streams.length).toBe(doc.getPageCount());
    for (const stream of streams) {
      const clip = stream.match(/([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re W n/);
      expect(clip).not.toBeNull();
      expect(Number(clip![1])).toBeCloseTo(printableX, 2);
      expect(Number(clip![2])).toBeCloseTo(printableY, 2);
      expect(Number(clip![3])).toBeLessThan(width);
      expect(Number(clip![4])).toBeLessThan(height);
    }
    const firstTwoTilesHaveGeometry = streams.slice(0, 2).map((stream) => {
      const body = stream.slice(0, stream.indexOf("\nQ\n"));
      const clip = body.match(/([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+) re W n/)!;
      const [clipX, clipY, clipW, clipH] = clip.slice(1).map(Number);
      return [...body.matchAll(/(-?[\d.]+) (-?[\d.]+) [ml]\b/g)]
        .filter(([, rawX, rawY]) => {
          const x = Number(rawX);
          const y = Number(rawY);
          return x >= clipX && x <= clipX + clipW && y >= clipY && y <= clipY + clipH;
        }).length;
    });
    expect(firstTwoTilesHaveGeometry.every((count) => count >= 2)).toBe(true);
  });

  it("keeps a selected size's marks in the parsed tiled PDF", async () => {
    const pieces = blockPieces(draftAtSize(STANDARD_M, POLO.grade, 2, POLO.draft, OPTIONS));
    const text = exportPdf(pieces, POLO.allowances);
    expect(text).not.toContain("NaN");
    const doc = await parsePdf(text);
    expect(doc.getPageCount()).toBeGreaterThan(0);
    expect(streamText(doc)).toContain("CUT FRONT SLIT");
    expect(streamText(doc)).toContain("CLIP PLACKET BASE LEFT");
    expect(streamText(doc)).toContain("REINFORCE PLACKET BASE BOX");
  });

  it("keeps every Polo piece and calibration evidence in parsed A0", async () => {
    const pieces = blockPieces(draftAtSize(STANDARD_M, POLO.grade, 0, POLO.draft, OPTIONS));
    const doc = await parsePdf(exportA0Pdf(pieces, POLO.allowances, POLO.notches, undefined, POLO.a0Overflow === true));
    const streams = streamTexts(doc);
    const text = streams.join("\n");
    expect(doc.getPageCount()).toBe(pieces.length);
    expect(streams.every((stream) => stream.includes("(10 cm) Tj"))).toBe(true);
    for (const piece of pieces) expect(text).toContain(`(${piece.name.toUpperCase()}) Tj`);
    expect(text).toContain("CUT FRONT SLIT");
    expect(text).toContain("CLIP PLACKET BASE RIGHT");
    expect(text).toContain("REINFORCE PLACKET BASE BOX");
    for (const [pageIndex, stream] of streams.entries()) {
      const { width, height } = doc.getPage(pageIndex).getSize();
      for (const [, x, y] of stream.matchAll(/(-?[\d.]+) (-?[\d.]+) [ml]\b/g)) {
        expect(Number(x)).toBeGreaterThanOrEqual(0);
        expect(Number(x)).toBeLessThanOrEqual(width);
        expect(Number(y)).toBeGreaterThanOrEqual(0);
        expect(Number(y)).toBeLessThanOrEqual(height);
      }
    }
  });

  it("keeps Polo POM/BOM evidence in the four-page parsed tech pack", async () => {
    const doc = await parsePdf(exportTechPack(POLO, STANDARD_M, undefined, undefined, OPTIONS));
    expect(doc.getPageCount()).toBe(4);
    const text = streamText(doc);
    expect(text).toContain("Finished placket length");
    expect(text).toContain("Lightweight knit fusible stabilizer");
    expect(text).toContain("BUTTON");
  });
});
