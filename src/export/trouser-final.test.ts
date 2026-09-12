// Slice 101: prove the registered trouser recipe reaches every real output
// consumer. These assertions parse generated SVG/PDF structure rather than
// accepting a recipe-shaped JSON claim as evidence.
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { Buffer } from "node:buffer";
import { PDFDocument, PDFRawStream } from "pdf-lib";
// @ts-expect-error jsdom is a test-only parser and this repository does not ship its type package.
import { JSDOM } from "jsdom";
import {
  STANDARD_M,
  TROUSER,
  blockPieces,
  draftAtSize,
  gradeRun,
  stitchChecks,
} from "../drafting";
import { garmentReport } from "../guidance/garment-check";
import { gradedMarker } from "./marker";
import { exportA0Pdf } from "./a0";
import { exportDxf } from "./dxf";
import { exportPdf } from "./pdf";
import { exportProjectorSvg } from "./projector";
import { exportSvg } from "./svg";
import { exportTechPack, pdfString } from "./techpack";

function parseSvg(text: string) {
  const parser = new (new JSDOM().window.DOMParser)();
  return parser.parseFromString(text, "image/svg+xml");
}

async function parsePdf(text: string): Promise<PDFDocument> {
  // Build the byte array in the test realm. Passing the raw string makes
  // pdf-lib interpret it as base64, while a Node Buffer can fail its
  // cross-realm Uint8Array check under jsdom.
  return PDFDocument.load(Uint8Array.from(Buffer.from(text, "utf8")), { updateMetadata: false });
}

function streamText(doc: PDFDocument): string {
  return streamTexts(doc).join("\n");
}

function streamTexts(doc: PDFDocument): string[] {
  return [...doc.context.enumerateIndirectObjects()]
    .filter(([, object]) => object instanceof PDFRawStream)
    .map(([, object]) => new TextDecoder().decode((object as PDFRawStream).contents))
}

const expectedPieces = [
  "trouser front left",
  "trouser front right",
  "trouser back left",
  "trouser back right",
  "trouser waistband",
  "trouser fly shield",
  "trouser pocket bag left",
  "trouser pocket bag right",
];

describe("Slice 101 — trouser output consumers", () => {
  it("keeps every graded size closed, sewable, and reportable", () => {
    const run = gradeRun(STANDARD_M, TROUSER.grade, TROUSER.sizes, TROUSER.draft);
    expect(run).toHaveLength(TROUSER.sizes.length);

    for (const graded of run) {
      const pieces = blockPieces(graded.block);
      expect(pieces.map((piece) => piece.name)).toEqual(expectedPieces);
      expect(stitchChecks(graded.block, graded.block.stitches).every((check) => check.ok)).toBe(true);
      for (const pom of TROUSER.poms) expect(Number.isFinite(pom.measure(graded.block))).toBe(true);
    }

    expect(garmentReport(TROUSER, STANDARD_M).ok).toBe(true);
  });

  it("parses the selected-size SVG, DXF, tiled PDF, A0 PDF, projector SVG, and tech pack", async () => {
    const pieces = blockPieces(draftAtSize(STANDARD_M, TROUSER.grade, 2, TROUSER.draft));
    expect(pieces.map((piece) => piece.name)).toEqual(expectedPieces);

    const svg = exportSvg(pieces, TROUSER.allowances, TROUSER.notches);
    const svgDoc = parseSvg(svg);
    expect(svgDoc.querySelector("parsererror")).toBeNull();
    expect(svgDoc.querySelectorAll("polygon")).toHaveLength(pieces.length * 2);
    expect(svgDoc.querySelector('[data-pattern-mark-name="flyEdge"]')).not.toBeNull();
    expect(svgDoc.querySelector('[data-pattern-mark-name="pocketOpening"]')).not.toBeNull();
    expect(svg).toContain("TROUSER FRONT LEFT");
    expect(svg).toContain("TROUSER POCKET BAG LEFT");
    expect(svg).not.toContain("NaN");

    const dxf = exportDxf(pieces, TROUSER.allowances);
    expect(dxf.startsWith("0\nSECTION")).toBe(true);
    expect((dxf.match(/0\nPOLYLINE/g) ?? []).length).toBe(pieces.length * 2);
    expect(dxf).toContain("MARK_FOLDLINE");
    expect(dxf).toContain("MARK_PLACEMENTLINE");
    expect(dxf).not.toContain("NaN");

    const tiled = await parsePdf(exportPdf(
      pieces, TROUSER.allowances, undefined, 1.0, TROUSER.tiledPdfLocalCoordinates === true
    ));
    expect(tiled.getPageCount()).toBeGreaterThan(0);
    expect(streamText(tiled)).toContain("(pocket opening) Tj");
    expect(streamText(tiled)).toContain("re W n");
    const tiledStreams = streamTexts(tiled);
    expect(tiledStreams).toHaveLength(tiled.getPageCount());
    expect(tiledStreams.every((stream) => !stream.includes("NaN") && stream.includes("re W n"))).toBe(true);
    const { width, height } = tiled.getPage(0).getSize();
    const firstPageHasVisibleCoordinates = [...tiledStreams[0].matchAll(/(-?[\d.]+) (-?[\d.]+) [ml]\b/g)]
      .some(([, x, y]) => Number(x) >= 0 && Number(x) <= width && Number(y) >= 0 && Number(y) <= height);
    expect(firstPageHasVisibleCoordinates).toBe(true);

    const a0 = await parsePdf(exportA0Pdf(
      pieces, TROUSER.allowances, TROUSER.notches, undefined, TROUSER.a0Overflow === true
    ));
    expect(a0.getPageCount()).toBe(pieces.length);
    const a0Text = streamText(a0);
    expect(a0Text).toContain("(10 cm) Tj");
    expect(a0Text).toContain("(TROUSER FRONT LEFT) Tj");
    expect(a0Text).toContain("(TROUSER WAISTBAND) Tj");
    expect(a0.getPage(0).getSize().width).toBeGreaterThan(a0.getPage(0).getSize().height);
    const a0Streams = streamTexts(a0);
    expect(a0Streams).toHaveLength(pieces.length);
    a0Streams.forEach((stream, pageIndex) => {
      const { width, height } = a0.getPage(pageIndex).getSize();
      for (const [, x, y] of stream.matchAll(/(-?[\d.]+) (-?[\d.]+) [ml]\b/g)) {
        expect(Number(x)).toBeGreaterThanOrEqual(0);
        expect(Number(x)).toBeLessThanOrEqual(width);
        expect(Number(y)).toBeGreaterThanOrEqual(0);
        expect(Number(y)).toBeLessThanOrEqual(height);
      }
    });

    const projectorDoc = parseSvg(exportProjectorSvg(TROUSER, STANDARD_M));
    expect(projectorDoc.querySelector("parsererror")).toBeNull();
    const layers = [...projectorDoc.querySelectorAll('g[inkscape\\:groupmode="layer"]')];
    expect(layers).toHaveLength(TROUSER.sizes.length);
    expect(layers.every((layer) => layer.querySelectorAll("polygon").length === pieces.length * 2)).toBe(true);
    expect(projectorDoc.querySelectorAll('[data-pattern-mark-name="flyFold"]').length).toBe(TROUSER.sizes.length);
    expect(projectorDoc.querySelectorAll('[data-pattern-mark-name="pocketOpening"]').length)
      .toBe(TROUSER.sizes.length * 2);

    const techPack = await parsePdf(exportTechPack(TROUSER, STANDARD_M));
    expect(techPack.getPageCount()).toBe(4);
    const techText = streamText(techPack);
    for (const pom of TROUSER.poms) expect(techText).toContain(`(${pdfString(pom.label)})`);
    expect(techText).toContain("Midweight woven fabric");
    expect(techText).toContain("Install the zipper behind the marked front fly");
  });

  it("packs all five sizes without losing any trouser piece", () => {
    const marker = gradedMarker(TROUSER, STANDARD_M, 150);
    expect(marker.placed).toHaveLength(TROUSER.sizes.length * expectedPieces.length);
    expect(marker.fabricLength).toBeGreaterThan(0);
    expect(marker.utilization).toBeGreaterThan(0);
    expect(marker.utilization).toBeLessThanOrEqual(1);
  });
});
