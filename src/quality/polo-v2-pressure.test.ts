// EPIC 11 Slice 160 — Polo V2 pressure matrix. This is a downstream-consumer
// gate, not physical-fit evidence: the same finite drafted block must remain
// inspectable through the size run, previews, nesting, surface, and each
// cutting/report writer while risky inputs remain visible to guidance.
import { describe, it, expect } from "vitest";
import { Polygon } from "@flatten-js/core";
import { PDFDocument, PDFRawStream } from "pdf-lib";
import { Buffer } from "node:buffer";
// @ts-expect-error jsdom is a test-only parser and this repository does not ship its type package.
import { JSDOM } from "jsdom";
import {
  STANDARD_M,
  POLO,
  NECKLINE_DEFAULT,
  blockPieces,
  draftAtSize,
  gradeMeasurements,
  stitchChecks,
  type Block,
  type GarmentOptions,
} from "../drafting";
import { poloGuidance } from "../drafting/polo";
import { garmentReport } from "../guidance/garment-check";
import { exportA0Pdf } from "../export/a0";
import { exportDxf } from "../export/dxf";
import { exportPdf } from "../export/pdf";
import { exportProjectorSvg } from "../export/projector";
import { exportSvg } from "../export/svg";
import { exportTechPack } from "../export/techpack";
import { flattenPiece } from "../export/layout";
import { gradedMarker } from "../export/marker";
import { renderBodyPair } from "../render/body";
import { renderGarment, type PoloVisual } from "../render/garment";

const OPTIONS = {
  placketLength: 20,
  placketWidth: 3.5,
  standHeight: 2.5,
  collarLeafDepth: 6,
  standFrontRise: 0.75,
  collarPointExtension: 1.5,
  sideVentDepth: 6,
  backHemDrop: 1.5,
} as const;

const XmlDomParser = new JSDOM().window.DOMParser;

function finiteBlock(block: Block): boolean {
  return blockPieces(block).every((piece) => piece.edges.every((edge) => {
    if (edge.kind === "line") {
      return [edge.start.x, edge.start.y, edge.end.x, edge.end.y].every(Number.isFinite);
    }
    return [edge.curve.start.x, edge.curve.start.y, edge.curve.control1.x,
      edge.curve.control1.y, edge.curve.control2.x, edge.curve.control2.y,
      edge.curve.end.x, edge.curve.end.y].every(Number.isFinite);
  }) && (piece.marks ?? []).every((mark) => {
    if ("at" in mark) return Number.isFinite(mark.at.x) && Number.isFinite(mark.at.y);
    return [mark.start.x, mark.start.y, mark.end.x, mark.end.y].every(Number.isFinite);
  }));
}

async function parsePdf(text: string): Promise<PDFDocument> {
  return PDFDocument.load(Buffer.from(text, "utf8"), { updateMetadata: false });
}

function streamText(doc: PDFDocument): string {
  return [...doc.context.enumerateIndirectObjects()]
    .filter(([, object]) => object instanceof PDFRawStream)
    .map(([, object]) => new TextDecoder().decode((object as PDFRawStream).contents))
    .join("\n");
}

describe("EPIC 11 Slice 160 — Polo V2 pressure matrix", () => {
  it("keeps XS, M, and XL finite, sewable, reportable, and previewable", () => {
    for (const step of [-2, 0, 2]) {
      const m = gradeMeasurements(STANDARD_M, POLO.grade, step);
      const block = draftAtSize(STANDARD_M, POLO.grade, step, POLO.draft, OPTIONS);
      expect(finiteBlock(block)).toBe(true);
      expect(stitchChecks(block, block.stitches).every((check) => check.ok)).toBe(true);
      expect(garmentReport(POLO, m, OPTIONS).ok).toBe(true);

      const assembled = renderGarment(m, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, OPTIONS);
      const body = renderBodyPair(m, true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, OPTIONS);
      expect(assembled).not.toMatch(/NaN|Infinity/);
      expect(body).not.toMatch(/NaN|Infinity/);
      expect(assembled.match(/data-garment-detail="polo"/g)).toHaveLength(2);
      expect(body.match(/data-garment-detail="polo"/g)).toHaveLength(2);
    }
  });

  it("keeps endpoint and crossed-risk values visible, finite, and actionable", () => {
    const cases: readonly { readonly label: string; readonly measurements: typeof STANDARD_M; readonly options: PoloVisual & GarmentOptions; readonly warns: boolean }[] = [
      { label: "stand/rise", measurements: STANDARD_M, options: { ...OPTIONS, standHeight: 1, standFrontRise: 2 }, warns: true },
      { label: "leaf/point", measurements: STANDARD_M, options: { ...OPTIONS, collarLeafDepth: 4, collarPointExtension: 3 }, warns: true },
      { label: "closed vent/drop", measurements: STANDARD_M, options: { ...OPTIONS, sideVentDepth: 0, backHemDrop: 1.5 }, warns: true },
      { label: "vent/drop", measurements: STANDARD_M, options: { ...OPTIONS, sideVentDepth: 3, backHemDrop: 5 }, warns: true },
      { label: "short body", measurements: { ...STANDARD_M, neck: 25, length: 40 }, options: { ...OPTIONS, placketLength: 30, sideVentDepth: 15, backHemDrop: 5 }, warns: true },
      { label: "long body", measurements: { ...STANDARD_M, neck: 70, length: 100 }, options: { ...OPTIONS, standHeight: 3, standFrontRise: 2, collarLeafDepth: 7, collarPointExtension: 3, sideVentDepth: 0, backHemDrop: 0 }, warns: false },
    ];

    for (const { label, measurements, options, warns } of cases) {
      const block = POLO.draft(measurements, options);
      expect(finiteBlock(block)).toBe(true);
      for (const piece of blockPieces(block)) {
        const cut = flattenPiece(piece, POLO.allowances).cut;
        if (cut.length >= 3) expect(new Polygon(cut.map((point) => [point.x, point.y])).isValid()).toBe(true);
      }
      const notes = poloGuidance(block, measurements, options).filter((note) => note.level === "warn");
      expect(notes.length > 0, label).toBe(warns);
      expect(notes.every((note) => note.field !== undefined && (note.field.startsWith("option-") || note.field === "measurement"))).toBe(true);
      expect(renderGarment(measurements, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, options)).not.toMatch(/NaN|Infinity/);
    }
  });

  it("parses SVG, DXF, tiled PDF, A0, projector, and tech-pack outputs at true scale", async () => {
    const m = gradeMeasurements(STANDARD_M, POLO.grade, 2);
    const block = draftAtSize(STANDARD_M, POLO.grade, 2, POLO.draft, OPTIONS);
    const pieces = blockPieces(block);

    const svg = exportSvg(pieces, POLO.allowances, POLO.notches);
    const svgDoc = new XmlDomParser().parseFromString(svg, "image/svg+xml");
    expect(svgDoc.querySelector("parsererror")).toBeNull();
    expect(svgDoc.querySelectorAll("polygon")).toHaveLength(pieces.length * 2);
    expect(svg).not.toMatch(/NaN|Infinity/);

    const dxf = exportDxf(pieces, POLO.allowances);
    expect((dxf.match(/0\nPOLYLINE\n/g) ?? []).length).toBe(pieces.length * 2);
    expect(dxf).toContain("MARK_CUTLINE");
    expect(dxf).not.toMatch(/NaN|Infinity/);

    const tiledText = exportPdf(pieces, POLO.allowances);
    expect(typeof tiledText).toBe("string");
    expect(tiledText.slice(0, 8)).toBe("%PDF-1.4");
    const tiled = await parsePdf(tiledText);
    expect(tiled.getPageCount()).toBeGreaterThan(0);
    expect(streamText(tiled)).toContain("CLIP PLACKET BASE LEFT");

    const a0 = await parsePdf(exportA0Pdf(pieces, POLO.allowances, POLO.notches, undefined, POLO.a0Overflow === true));
    expect(a0.getPageCount()).toBe(pieces.length);
    expect(streamText(a0)).toContain("REINFORCE PLACKET BASE BOX");

    const projector = new XmlDomParser().parseFromString(exportProjectorSvg(POLO, STANDARD_M, OPTIONS), "image/svg+xml");
    expect(projector.querySelector("parsererror")).toBeNull();
    expect(projector.querySelectorAll('g[inkscape\\:groupmode="layer"]')).toHaveLength(POLO.sizes.length);
    expect(projector.querySelectorAll('[data-pattern-mark-name="placketBaseReinforcement"]')).toHaveLength(POLO.sizes.length);

    const techPack = await parsePdf(exportTechPack(POLO, m, undefined, undefined, OPTIONS));
    expect(techPack.getPageCount()).toBe(4);
    expect(streamText(techPack)).toContain("Back side-vent depth");
    expect(streamText(techPack)).toContain("Finish and bar-tack the open side vents");
  });

  it("keeps narrow/wide graded nesting deterministic and carries populated surface output", async () => {
    const narrow = gradedMarker(POLO, STANDARD_M, 55, OPTIONS);
    const wide = gradedMarker(POLO, STANDARD_M, 150, OPTIONS);
    expect(narrow).toEqual(gradedMarker(POLO, STANDARD_M, 55, OPTIONS));
    expect(wide).toEqual(gradedMarker(POLO, STANDARD_M, 150, OPTIONS));
    expect(narrow.placed).toHaveLength(POLO.sizes.length * 9);
    expect(wide.placed).toHaveLength(POLO.sizes.length * 9);
    expect(narrow.fits).toBe(true);
    expect(wide.fits).toBe(true);
    expect(narrow.fabricLength).toBeGreaterThan(wide.fabricLength);

    const surface = [{
      id: "chest-print", kind: "print" as const, pieceRole: "front", widthCm: 12, heightCm: 16,
      transform: { dx: 1, dy: 2, scale: 1, rotationDeg: 15 }, zOrder: 0, sourceName: "polo-mark.svg",
    }, {
      id: "collar-patch", kind: "patch" as const, pieceRole: "upperCollar", widthCm: 4, heightCm: 3,
      transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1, sourceName: "collar-mark.svg",
    }];
    const techPack = await parsePdf(exportTechPack(POLO, STANDARD_M, undefined, undefined, OPTIONS, surface, "Classic polo"));
    expect(techPack.getPageCount()).toBe(5);
    expect(streamText(techPack)).toContain("Artwork placement - Classic polo");
    expect(streamText(techPack)).toContain("chest-print");
    expect(streamText(techPack)).toContain("collar-patch");

    const closedTechPack = POLO.techPackForOptions!(
      { ...OPTIONS, sideVentDepth: 0, backHemDrop: 0 },
    );
    expect(closedTechPack.construction.join(" ")).not.toContain("open side vents");
    expect(closedTechPack.construction.join(" ")).toContain("level with each other");

    const unresolvedTechPack = POLO.techPackForOptions!({ ...OPTIONS, sideVentDepth: -1, backHemDrop: -1 });
    expect(unresolvedTechPack.construction.join(" ")).toContain("Resolve the side-vent value");
    expect(unresolvedTechPack.construction.join(" ")).toContain("Resolve the back-hem value");
  });
});
