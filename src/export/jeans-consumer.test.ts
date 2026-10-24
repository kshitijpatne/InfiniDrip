// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { PDFDocument, PDFRawStream } from "pdf-lib";
import { webcrypto } from "node:crypto";
import { JEANS, STANDARD_M, blockPieces, defaultGarmentOptions, gradeRun } from "../drafting";
import { semanticEditSourceFingerprint } from "../edit/semantic-edit";
import { EMPTY_TRANSFORM } from "../surface/placement";
import { parseJeansT02PomDefinitions } from "../ui/jeans-t02";
import { exportA0Pdf, PAGE_A0 } from "./a0";
import { createDxfInterchangePackage } from "./dxf-interchange-package";
import { exportDxf } from "./dxf";
import { flattenPiece, polylineBounds } from "./layout";
import { exportPdf } from "./pdf";
import { exportProjectorSvg } from "./projector";
import { exportSurfaceSheet } from "./surface-sheet";
import { exportSvg } from "./svg";
import { exportTechPackV2 } from "./techpack";
import { nestPieces } from "./nesting";

const options = defaultGarmentOptions(JEANS.options ?? []);
const run = gradeRun(STANDARD_M, JEANS.grade, JEANS.sizes, JEANS.draft, options);
const medium = run.find((size) => size.label === "M")!;
const pieces = blockPieces(medium.block);
const roles = Object.keys(medium.block.roles);

async function parsePdf(text: string): Promise<PDFDocument> {
  return PDFDocument.load(Uint8Array.from(Buffer.from(text, "utf8")), { updateMetadata: false });
}

function pageStreams(doc: PDFDocument): string[] {
  return [...doc.context.enumerateIndirectObjects()]
    .filter(([, object]) => object instanceof PDFRawStream)
    .map(([, object]) => new TextDecoder().decode((object as PDFRawStream).contents));
}

function pathCoordinates(stream: string): { x: number; y: number }[] {
  return [...stream.matchAll(/(-?[\d.]+) (-?[\d.]+) [ml]\b/g)]
    .map(([, x, y]) => ({ x: Number(x), y: Number(y) }));
}

function readablePdfText(streams: readonly string[]): string {
  return streams.join("\n").replace(/\\([\\()])/g, "$1");
}

const parseSvg = (source: string): Document => new DOMParser().parseFromString(source, "image/svg+xml");

describe("Jeans consumer integration", () => {
  it("keeps the full XS–XL role set and upright-grain nests at representative widths", () => {
    expect(run.map(({ label }) => label)).toEqual(["XS", "S", "M", "L", "XL"]);
    for (const graded of run) {
      const sourcePieces = blockPieces(graded.block);
      expect(sourcePieces).toHaveLength(23);
      expect(Object.keys(graded.block.roles)).toEqual(roles);
      const flats = sourcePieces.map((piece) => flattenPiece(piece, JEANS.allowances));
      for (const width of [120, 150]) {
        const nested = nestPieces(flats, width);
        expect(nested.fits).toBe(true);
        expect(nested.placed.map(({ name }) => name).sort()).toEqual(sourcePieces.map(({ name }) => name).sort());
        expect(nested.fabricLength).toBeGreaterThan(0);
        for (const placed of nested.placed) {
          const original = flats.find(({ name }) => name === placed.name)!;
          const originalBounds = polylineBounds(original.cut);
          const placedBounds = polylineBounds(placed.cut);
          expect(placedBounds.width).toBeCloseTo(originalBounds.width, 6);
          expect(placedBounds.height).toBeCloseTo(originalBounds.height, 6);
          expect(placedBounds.minX).toBeGreaterThanOrEqual(0);
          expect(placedBounds.minY).toBeGreaterThanOrEqual(0);
          expect(placedBounds.minX + placedBounds.width).toBeLessThanOrEqual(width + 1e-8);
          expect(placedBounds.minY + placedBounds.height).toBeLessThanOrEqual(nested.fabricLength + 1e-8);
        }
      }
      for (const pom of JEANS.poms) expect(Number.isFinite(pom.measure(graded.block))).toBe(true);
    }
  });

  it("fingerprints the complete Jeans consumer source as canonical JSON", async () => {
    const fingerprint = await semanticEditSourceFingerprint("jeans", medium.block, webcrypto as unknown as Crypto);
    expect(fingerprint).toMatch(/^semantic-edit:v2:sha256:[0-9a-f]{64}$/);
  });

  it("parses real SVG and DXF with all Jeans roles, source marks, and CAD package IDs", async () => {
    const svg = parseSvg(exportSvg(pieces, JEANS.allowances, JEANS.notches));
    expect(svg.querySelector("parsererror")).toBeNull();
    const svgText = svg.documentElement.textContent ?? "";
    for (const piece of pieces) expect(svgText).toContain(piece.name.toUpperCase());
    expect(svg.querySelectorAll("[data-pattern-mark-name]").length).toBeGreaterThan(0);
    expect(svgText).not.toContain("NaN");

    const dxf = exportDxf(pieces, JEANS.allowances);
    expect(dxf.startsWith("0\nSECTION\n2\nENTITIES")).toBe(true);
    expect((dxf.match(/0\nPOLYLINE\n/g) ?? []).length).toBe(pieces.length * 2);
    expect(dxf).toContain("MARK_");
    expect(dxf).not.toContain("NaN");

    const packageOutput = await createDxfInterchangePackage(JEANS, medium, options);
    expect(packageOutput.manifest.recipe).toEqual({ id: "jeans", label: "Jeans" });
    expect(packageOutput.manifest.pieces.map(({ role }) => role)).toEqual(roles);
    expect(packageOutput.manifest.patternMarks.length).toBeGreaterThan(0);
    expect(packageOutput.manifest.units).toEqual({ length: "cm", dxfInsunits: 5 });
  });

  it("keeps a Surface sheet calibrated and tied to a Jeans artwork role", () => {
    const source = exportSurfaceSheet([{
      id: "s1155-jeans-surface-review",
      kind: "print",
      pieceRole: "frontLeft",
      widthCm: 12,
      heightCm: 18,
      transform: EMPTY_TRANSFORM,
      zOrder: 0,
      sourceName: "S1155 review artwork",
    }], "Relaxed straight mid-rise jeans");
    const sheet = parseSvg(source);
    expect(sheet.querySelector("parsererror")).toBeNull();
    expect(sheet.querySelector('rect[width="10"][height="10"]')).not.toBeNull();
    expect(sheet.documentElement.textContent).toContain("S1155 review artwork");
    expect(sheet.querySelector('[data-placement="s1155-jeans-surface-review"]')).not.toBeNull();
    expect(sheet.documentElement.textContent).toContain("on frontLeft");
  });

  it("prints every role on one whole-piece A0 page at true scale", async () => {
    const pdf = await parsePdf(exportA0Pdf(pieces, JEANS.allowances, JEANS.notches, PAGE_A0, JEANS.a0Overflow === true));
    expect(pdf.getPageCount()).toBe(pieces.length);
    const streams = pageStreams(pdf);
    expect(streams).toHaveLength(pieces.length);
    for (const [index, piece] of pieces.entries()) {
      expect(streams[index]).toContain(`(${piece.name.toUpperCase()}) Tj`);
      expect(streams[index]).toContain("(10 cm) Tj");
      const page = pdf.getPage(index).getSize();
      const points = pathCoordinates(streams[index]!);
      expect(points.length).toBeGreaterThanOrEqual(20);
      expect(points.every(({ x, y }) => x >= 0 && x <= page.width && y >= 0 && y <= page.height)).toBe(true);
    }
  });

  it("shows first-tile geometry on page one of the true-scale tiled Jeans PDF", async () => {
    expect(JEANS.tiledPdfLocalCoordinates).toBe(true);
    const pdf = await parsePdf(exportPdf(pieces, JEANS.allowances, undefined, 1, JEANS.tiledPdfLocalCoordinates === true));
    expect(pdf.getPageCount()).toBeGreaterThan(1);
    const streams = pageStreams(pdf);
    expect(streams).toHaveLength(pdf.getPageCount());
    expect(streams[0]).toContain("re W n");
    const firstPage = pdf.getPage(0).getSize();
    const points = pathCoordinates(streams[0]!);
    expect(points.length).toBeGreaterThan(100);
    expect(points.filter(({ x, y }) => x >= 0 && x <= firstPage.width && y >= 0 && y <= firstPage.height).length)
      .toBeGreaterThan(50);
  });

  it("exports all five projector size layers and the recipe-scoped digital Tech Pack/T02", async () => {
    const projector = parseSvg(exportProjectorSvg(JEANS, STANDARD_M, options, run));
    expect(projector.querySelector("parsererror")).toBeNull();
    const layers = [...projector.querySelectorAll('g[inkscape\\:groupmode="layer"]')];
    expect(layers).toHaveLength(JEANS.sizes.length);
    const projectorText = projector.documentElement.textContent ?? "";
    expect(projectorText).toContain("XS JEANS FRONT LEFT");
    expect(projectorText).toContain("XL JEANS BACK PATCH POCKET RIGHT");
    expect(projectorText).toContain("Calibrate first");

    const techPack = await parsePdf(exportTechPackV2(JEANS, STANDARD_M, undefined, undefined, options));
    expect(techPack.getPageCount()).toBeGreaterThan(4);
    const techText = readablePdfText(pageStreams(techPack));
    for (const pom of JEANS.poms) expect(techText).toContain(pom.label);
    expect(techText).toContain("JEANS");
    expect(techText.toLowerCase()).toContain("button");

    const t02 = parseJeansT02PomDefinitions();
    expect(t02.ok).toBe(true);
    if (!t02.ok) return;
    expect(t02.value.recipeId).toBe("jeans");
    expect(t02.value.definitions).toHaveLength(JEANS.poms.length);
    expect(t02.value.definitions.every(({ tolerance }) => tolerance.status === "UNRESOLVED")).toBe(true);
    expect(t02.value.definitions.every(({ landmarks }) => landmarks.status === "SOURCE_CONFIRMED")).toBe(true);
  });
});
