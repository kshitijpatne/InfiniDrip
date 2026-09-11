// Slice 73: parse Polo's PDF outputs with pdf-lib, a real consumer.
import { describe, it, expect } from "vitest";
import { PDFDocument, PDFRawStream } from "pdf-lib";
import { STANDARD_M, POLO, blockPieces, draftAtSize } from "../drafting";
import { exportPdf } from "./pdf";
import { exportA0Pdf } from "./a0";
import { exportTechPack } from "./techpack";

const OPTIONS = { placketLength: 20, placketWidth: 3.5, standHeight: 2.5, collarLeafDepth: 6 };

async function parsePdf(text: string): Promise<PDFDocument> {
  return PDFDocument.load(Buffer.from(text, "utf8"), { updateMetadata: false });
}

function streamText(doc: PDFDocument): string {
  return [...doc.context.enumerateIndirectObjects()]
    .filter(([, object]) => object instanceof PDFRawStream)
    .map(([, object]) => new TextDecoder().decode((object as PDFRawStream).contents))
    .join("\n");
}

describe("Slice 73 — Polo PDF readiness", () => {
  it("keeps a selected size's marks in the parsed tiled PDF", async () => {
    const pieces = blockPieces(draftAtSize(STANDARD_M, POLO.grade, 2, POLO.draft, OPTIONS));
    const text = exportPdf(pieces, POLO.allowances);
    expect(text).not.toContain("NaN");
    const doc = await parsePdf(text);
    expect(doc.getPageCount()).toBeGreaterThan(0);
    expect(streamText(doc)).toContain("CUT FRONT SLIT");
  });

  it("keeps every Polo piece and calibration evidence in parsed A0", async () => {
    const pieces = blockPieces(draftAtSize(STANDARD_M, POLO.grade, 0, POLO.draft, OPTIONS));
    const doc = await parsePdf(exportA0Pdf(pieces, POLO.allowances, POLO.notches));
    const text = streamText(doc);
    expect(doc.getPageCount()).toBe(1);
    expect(text).toContain("(10 cm) Tj");
    for (const piece of pieces) expect(text).toContain(`(${piece.name.toUpperCase()}) Tj`);
    expect(text).toContain("CUT FRONT SLIT");
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
