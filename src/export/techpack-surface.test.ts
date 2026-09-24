// Tech-pack artwork section — validated with a REAL parser (pdf-lib): page
// counts come from the parsed document and row text from decoded streams.
import { describe, it, expect } from "vitest";
import { PDFDocument, PDFRawStream } from "pdf-lib";
import { STANDARD_M, TEE } from "../drafting";
import { EMPTY_TRANSFORM, type ArtworkPlacement } from "../surface/placement";
import { exportTechPack, exportTechPackV2 } from "./techpack";

const placement = (overrides: Partial<ArtworkPlacement> = {}): ArtworkPlacement => ({
  id: "chest-print",
  kind: "print",
  pieceRole: "front",
  widthCm: 20,
  heightCm: 25,
  transform: EMPTY_TRANSFORM,
  zOrder: 0,
  sourceName: "tiger.svg",
  ...overrides,
});

async function load(text: string): Promise<PDFDocument> {
  return PDFDocument.load(new TextEncoder().encode(text), { updateMetadata: false });
}

function streamsText(doc: PDFDocument): string {
  const chunks: string[] = [];
  for (const [, obj] of doc.context.enumerateIndirectObjects()) {
    if (obj instanceof PDFRawStream) chunks.push(new TextDecoder().decode(obj.contents));
  }
  return chunks.join("\n");
}

describe("exportTechPack artwork section", () => {
  it("stays a four-page document byte-identical without artwork", async () => {
    const plain = exportTechPack(TEE, STANDARD_M);
    const empty = exportTechPack(TEE, STANDARD_M, undefined, undefined, {}, [], "Classic tee");
    expect(empty).toBe(plain);
    expect((await load(empty)).getPageCount()).toBe(4);
  });

  it("keeps the full artwork placement appendix after the paginated overview", () => {
    const pdf = exportTechPackV2(TEE, STANDARD_M, undefined, undefined, {}, [placement()], "Summer");
    expect(pdf).toContain("(Artwork placement - Summer)");
    expect(pdf).toContain("(True scale artwork space. Shared across graded sizes.)");
  });

  it("appends a parsed placement page naming the artwork", async () => {
    const pdf = exportTechPack(TEE, STANDARD_M, undefined, undefined, {}, [placement()], "Classic tee");
    const doc = await load(pdf);
    expect(doc.getPageCount()).toBe(5);
    const content = streamsText(doc);
    expect(content).toContain("Artwork placement - Classic tee");
    expect(content).toContain("Shared across graded sizes");
    expect(content).toContain("chest-print");
    expect(content).toContain("front");
    expect(content).toContain("20.0 x 25.0 cm");
    expect(content).toContain("tiger.svg");
  });

  it("flags invalid entries instead of hiding them", async () => {
    const pdf = exportTechPack(
      TEE, STANDARD_M, undefined, undefined, {}, [placement({ widthCm: 0 })], "Scoop");
    const doc = await load(pdf);
    expect(doc.getPageCount()).toBe(5);
    expect(streamsText(doc)).toContain("INVALID");
  });

  it("reports broken transforms as unmeasurable poses", async () => {
    const pdf = exportTechPack(
      TEE, STANDARD_M, undefined, undefined, {},
      [
        { ...placement({ id: "null-transform" }), transform: null as unknown as ArtworkPlacement["transform"] },
        { ...placement({ id: "array-transform" }), transform: [] as unknown as ArtworkPlacement["transform"] },
      ],
      "Scoop");
    const doc = await load(pdf);
    expect(doc.getPageCount()).toBe(5);
    const content = streamsText(doc);
    expect(content).toContain("null-transform");
    expect(content).toContain("array-transform");
    expect(content.match(/unmeasurable pose/g)).toHaveLength(2);
  });

  it("escapes hostile placement text through the PDF string writer", async () => {
    const pdf = exportTechPack(
      TEE, STANDARD_M, undefined, undefined, {},
      [placement({ id: "a(b)c", pieceRole: "front\\back" })], "Scoop");
    const doc = await load(pdf);
    expect(doc.getPageCount()).toBe(5);
    expect(streamsText(doc)).toContain("a\\(b\\)c");
  });

  it("paginates long artwork sets without losing rows", async () => {
    const many = Array.from({ length: 40 }, (_, i) => placement({ id: `art-${i}` }));
    const doc = await load(exportTechPack(TEE, STANDARD_M, undefined, undefined, {}, many, "Scoop"));
    expect(doc.getPageCount()).toBe(6);
    const content = streamsText(doc);
    expect(content).toContain("art-0");
    expect(content).toContain("art-39");
  });
});
