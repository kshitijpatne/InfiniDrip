// Slice 93 exit gate: exercise the complete woven-shirt library as a real
// drafted block and send its output through the same consumers used by the UI.
import { describe, expect, it } from "vitest";
import { Buffer } from "node:buffer";
import { PDFDocument, PDFRawStream } from "pdf-lib";
// @ts-expect-error jsdom is a test-only parser and this repository does not ship its type package.
import { JSDOM } from "jsdom";
import {
  STANDARD_M,
  WOVEN_SHIRT,
  GarmentOptions,
  blockPieces,
  draftAtSize,
  edgeEnd,
  edgeStart,
  gradeRun,
  stitchChecks,
} from "../drafting";
import { garmentReport } from "../guidance";
import { renderBlueprint, renderEditor } from "../render";
import { editorViewBox, pieceHandles } from "../edit";
import { exportA0Pdf } from "./a0";
import { exportDxf } from "./dxf";
import { exportPdf } from "./pdf";
import { exportProjectorSvg } from "./projector";
import { exportSvg } from "./svg";
import { exportTechPack, pdfString } from "./techpack";
import { distance } from "../geometry";

const OPTIONS: GarmentOptions = {
  neckEase: 1, buttonCount: 6, buttonSpacing: 8, frontOverlap: 1.5,
  placketWidth: 3, standHeight: 2.5, collarLeafDepth: 6, yokeDepth: 10,
  pocketWidth: 12, pocketHeight: 13, sleeveBandDepth: 3, sideVentDepth: 3,
  hemTurn: 1,
};

const expectedPieces = [
  "woven front", "woven back lower", "woven back yoke", "woven patch pocket",
  "outer woven stand", "inner woven stand", "upper pointed woven collar",
  "under pointed woven collar", "woven button placket", "woven buttonhole placket",
  "woven short sleeve", "woven folded sleeve band",
];

function streamText(doc: PDFDocument): string {
  return [...doc.context.enumerateIndirectObjects()]
    .filter(([, object]) => object instanceof PDFRawStream)
    .map(([, object]) => new TextDecoder().decode((object as PDFRawStream).contents))
    .join("\n");
}

async function parsePdf(text: string): Promise<PDFDocument> {
  return PDFDocument.load(Buffer.from(text, "utf8"), { updateMetadata: false });
}

function parseSvg(text: string) {
  const parser = new (new JSDOM().window.DOMParser)();
  return parser.parseFromString(text, "image/svg+xml");
}

describe("Slice 93 — woven-shirt component-library exit", () => {
  it("keeps every default and graded size closed, sewable, and reportable", () => {
    const run = gradeRun(STANDARD_M, WOVEN_SHIRT.grade, WOVEN_SHIRT.sizes, WOVEN_SHIRT.draft, OPTIONS);
    expect(run).toHaveLength(WOVEN_SHIRT.sizes.length);
    expect(blockPieces(run[2].block).map((piece) => piece.name)).toEqual(expectedPieces);

    for (const size of run) {
      const pieces = blockPieces(size.block);
      expect(pieces).toHaveLength(expectedPieces.length);
      for (const piece of pieces) {
        expect(piece.edges.length).toBeGreaterThan(2);
        for (let i = 0; i < piece.edges.length; i += 1) {
          const end = edgeEnd(piece.edges[i]);
          const next = edgeStart(piece.edges[(i + 1) % piece.edges.length]);
          expect(distance(end, next)).toBeCloseTo(0, 6);
        }
      }
      expect(stitchChecks(size.block, size.block.stitches).every((check) => check.ok)).toBe(true);
      expect(garmentReport(WOVEN_SHIRT, size.measurements, OPTIONS).ok).toBe(true);
      for (const pom of WOVEN_SHIRT.poms) expect(Number.isFinite(pom.measure(size.block))).toBe(true);
    }
  });

  it("renders the pattern and preview editor from the same assembled block", () => {
    const block = WOVEN_SHIRT.draft(STANDARD_M, OPTIONS);
    const pieces = blockPieces(block);
    const pattern = renderBlueprint(pieces, {
      active: pieces[0].name, notches: WOVEN_SHIRT.notches,
      allowances: WOVEN_SHIRT.allowances,
    });
    expect(parseSvg(pattern).querySelector("parsererror")).toBeNull();
    expect(pattern).toContain("WOVEN FRONT");
    expect(pattern).toContain("WOVEN BUTTON PLACKET");

    const front = pieces.find((piece) => piece.name === "woven front")!;
    const editor = renderEditor(front, pieceHandles(front), editorViewBox(front));
    expect(editor.startsWith("<svg")).toBe(true);
    expect(editor).toContain("<path");
  });

  it("passes the six-button sample through SVG, DXF, tiled PDF, A0, projector, and tech pack consumers", async () => {
    const pieces = blockPieces(draftAtSize(STANDARD_M, WOVEN_SHIRT.grade, 0, WOVEN_SHIRT.draft, OPTIONS));

    const svg = exportSvg(pieces, WOVEN_SHIRT.allowances, WOVEN_SHIRT.notches);
    const svgDoc = parseSvg(svg);
    expect(svgDoc.querySelector("parsererror")).toBeNull();
    expect(svgDoc.querySelectorAll("polygon")).toHaveLength(pieces.length * 2);
    expect(svgDoc.querySelectorAll('[data-pattern-mark="button"]').length).toBe(7);
    expect(svgDoc.querySelectorAll('[data-pattern-mark="buttonhole"]').length).toBe(7);
    expect(svg).not.toContain("NaN");

    const dxf = exportDxf(pieces, WOVEN_SHIRT.allowances);
    expect(dxf.startsWith("0\nSECTION")).toBe(true);
    expect((dxf.match(/0\nPOLYLINE/g) ?? []).length).toBe(pieces.length * 2);
    expect(dxf).toContain("MARK_BUTTON");
    expect(dxf).toContain("MARK_BUTTONHOLE");

    const tiledText = exportPdf(pieces, WOVEN_SHIRT.allowances);
    expect(typeof tiledText).toBe("string");
    const tiled = await parsePdf(tiledText);
    expect(tiled.getPageCount()).toBeGreaterThan(0);
    expect(streamText(tiled)).toContain("(POCKET PLACEMENT) Tj");

    const a0 = await parsePdf(exportA0Pdf(pieces, WOVEN_SHIRT.allowances, WOVEN_SHIRT.notches));
    expect(a0.getPageCount()).toBe(1);
    expect(streamText(a0)).toContain("(10 cm) Tj");
    expect(streamText(a0)).toContain("(WOVEN BUTTON PLACKET) Tj");

    const projector = exportProjectorSvg(WOVEN_SHIRT, STANDARD_M, OPTIONS);
    const projectorDoc = parseSvg(projector);
    expect(projectorDoc.querySelector("parsererror")).toBeNull();
    const layers = [...projectorDoc.getElementsByTagName("g")]
      .filter((layer) => layer.getAttribute("inkscape:groupmode") === "layer");
    expect(layers).toHaveLength(WOVEN_SHIRT.sizes.length);
    expect(layers.every((layer) => layer.getElementsByTagName("polygon").length === pieces.length * 2)).toBe(true);

    const techPack = await parsePdf(exportTechPack(WOVEN_SHIRT, STANDARD_M, undefined, undefined, OPTIONS));
    expect(techPack.getPageCount()).toBe(4);
    const techText = streamText(techPack);
    expect(techText).toContain("(6 front + 1 stand)");
    for (const pom of WOVEN_SHIRT.poms) expect(techText).toContain(`(${pdfString(pom.label)})`);
  });
});
