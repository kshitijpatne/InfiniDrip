// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { STANDARD_M, GARMENTS, blockPieces, defaultGarmentOptions, gradeRun } from "../drafting";
import { adaptiveSeamAllowance } from "./adaptive-cut";
import { exportA0Pdf } from "./a0";
import { createDxfInterchangePackage } from "./dxf-interchange-package";
import { exportPdf } from "./pdf";
import { exportProjectorSvg } from "./projector";
import { exportSvg } from "./svg";
import { exportTechPackV2, pdfString } from "./techpack";
import { flattenPiece, polylineBounds } from "./layout";
import { nestPieces } from "./nesting";

const shorts = GARMENTS.find((recipe) => recipe.name === "shorts")!;
const baseOptions = defaultGarmentOptions(shorts.options ?? []);
const optionsAtLength = (shortsInseam: number) => ({ ...baseOptions, shortsInseam });
const xsShort = gradeRun(STANDARD_M, shorts.grade, shorts.sizes, shorts.draft, optionsAtLength(5.5))[0]!;
const fullLongRun = gradeRun(STANDARD_M, shorts.grade, shorts.sizes, shorts.draft, optionsAtLength(45));
const xlLong = fullLongRun[fullLongRun.length - 1]!;
const roles = ["frontLeft", "frontRight", "backLeft", "backRight", "waistband",
  "flyShield", "flyUnderlap", "pocketBagLeft", "pocketBagRight"];

describe("shorts consumers", () => {
  it("keeps all nine roles and positive, separated cut geometry in XS-short and XL-long nests", () => {
    for (const graded of [xsShort, xlLong]) {
      expect(Object.keys(graded.block.roles)).toEqual(roles);
      const pieces = blockPieces(graded.block);
      expect(pieces).toHaveLength(9);
      const nested = nestPieces(pieces.map((piece) => flattenPiece(piece, shorts.allowances)), 150);
      expect(nested.fits).toBe(true);
      expect(nested.placed.map((piece) => piece.name).sort()).toEqual(pieces.map((piece) => piece.name).sort());
      const bounds = nested.placed.map((piece) => ({ name: piece.name, ...polylineBounds(piece.cut) }));
      for (const box of bounds) {
        expect([box.minX, box.minY, box.width, box.height].every(Number.isFinite)).toBe(true);
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
        expect(box.minX).toBeGreaterThanOrEqual(0);
        expect(box.minY).toBeGreaterThanOrEqual(0);
        expect(box.minX + box.width).toBeLessThanOrEqual(nested.fabricWidth + 1e-8);
        expect(box.minY + box.height).toBeLessThanOrEqual(nested.fabricLength + 1e-8);
      }
      for (let left = 0; left < bounds.length; left += 1) for (let right = left + 1; right < bounds.length; right += 1) {
        const a = bounds[left]!;
        const b = bounds[right]!;
        const gapX = Math.max(b.minX - (a.minX + a.width), a.minX - (b.minX + b.width));
        const gapY = Math.max(b.minY - (a.minY + a.height), a.minY - (b.minY + b.height));
        expect(Math.max(gapX, gapY)).toBeGreaterThanOrEqual(2 - 1e-8);
      }
    }
  });

  it("keeps the shorts DXF package role IDs and verifies its default 2 cm gap from cut geometry", async () => {
    const pieces = blockPieces(xsShort.block);
    const candidate = await createDxfInterchangePackage(shorts, xsShort, optionsAtLength(5.5));
    expect(candidate.manifest.pieces.map((piece) => piece.role)).toEqual(roles);
    const placedBounds = pieces.map((piece, index) => {
      const bounds = polylineBounds(adaptiveSeamAllowance(piece, shorts.allowances));
      const transform = candidate.manifest.pieces[index]!.drawingTransform!;
      return { minX: bounds.minX + transform.xOffset, maxX: bounds.minX + bounds.width + transform.xOffset };
    });
    for (let index = 1; index < placedBounds.length; index += 1) {
      expect(placedBounds[index]!.minX - placedBounds[index - 1]!.maxX).toBeCloseTo(2, 5);
    }
  });

  it("exports readable names for all roles in true-scale SVG and tiled PDF", () => {
    expect(shorts.tiledPdfLocalCoordinates).toBe(true);
    const pieces = blockPieces(xsShort.block);
    const svg = new DOMParser().parseFromString(exportSvg(pieces, shorts.allowances, shorts.notches), "image/svg+xml");
    expect(svg.querySelector("parsererror")).toBeNull();
    const svgLabels = [...svg.getElementsByTagName("text")].map((label) => label.textContent);
    for (const piece of pieces) expect(svgLabels).toContain(piece.name.toUpperCase());
    expect([...svg.getElementsByTagName("text")].find((label) => label.textContent === "SHORTS WAISTBAND")
      ?.getAttribute("transform")).toBeNull();
    for (const label of ["SHORTS FLY SHIELD", "SHORTS FLY UNDERLAP", "SHORTS POCKET BAG LEFT", "SHORTS POCKET BAG RIGHT"]) {
      expect([...svg.getElementsByTagName("text")].find((candidate) => candidate.textContent === label)
        ?.getAttribute("transform")).toMatch(/^rotate\(90 /u);
    }

    const pdf = exportPdf(pieces, shorts.allowances, undefined, 1.0, shorts.tiledPdfLocalCoordinates === true);
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    for (const piece of pieces) expect(pdf).toContain(`(${piece.name.toUpperCase()}) Tj`);
    const longPdf = exportPdf(blockPieces(xlLong.block), shorts.allowances, undefined, 1.0,
      shorts.tiledPdfLocalCoordinates === true);
    for (const piece of blockPieces(xlLong.block)) expect(longPdf).toContain(`(${piece.name.toUpperCase()}) Tj`);
  });

  it("keeps the legacy PDF coordinate path and skips shorts layout for other pieces", () => {
    const pieces = blockPieces(xsShort.block);
    const legacyPdf = exportPdf(pieces, shorts.allowances);
    expect(legacyPdf).toContain("(SHORTS FRONT LEFT) Tj");

    const otherPiece = { ...pieces[0]!, name: "legacy fit piece" };
    const mixedPdf = exportPdf([...pieces, otherPiece], shorts.allowances, undefined, 1, true);
    expect(mixedPdf).toContain("(SHORTS FRONT LEFT) Tj");
  });

  it("keeps a too-narrow shorts label from inverting its page-local clamp", () => {
    const flyShield = {
      name: "shorts fly shield",
      onFold: false,
      edges: [
        { kind: "line" as const, name: "top", start: { x: 0, y: 0 }, end: { x: 0.2, y: 0 } },
        { kind: "line" as const, name: "right", start: { x: 0.2, y: 0 }, end: { x: 0.2, y: 2 } },
        { kind: "line" as const, name: "bottom", start: { x: 0.2, y: 2 }, end: { x: 0, y: 2 } },
        { kind: "line" as const, name: "left", start: { x: 0, y: 2 }, end: { x: 0, y: 0 } },
      ],
    };
    const pdf = exportPdf([flyShield], { default: 0 }, undefined, 1, true);
    expect(pdf).toContain("(SHORTS FLY SHIELD) Tj");
  });

  it("exports all roles through A0 and the XS-short/XL-long projector size layers", () => {
    for (const graded of [xsShort, xlLong]) {
      const pieces = blockPieces(graded.block);
      const pdf = exportA0Pdf(pieces, shorts.allowances, shorts.notches);
      expect(pdf.startsWith("%PDF-1.4")).toBe(true);
      for (const piece of pieces) expect(pdf).toContain(`(${piece.name.toUpperCase()}) Tj`);
    }

    const defaultRun = gradeRun(STANDARD_M, shorts.grade, shorts.sizes, shorts.draft, optionsAtLength(45));
    const plannedRun = defaultRun.map((graded, index) => ({
      ...graded,
      block: shorts.draft(graded.measurements, index === 0 ? optionsAtLength(5.5) : optionsAtLength(45)),
    }));
    const projector = new DOMParser().parseFromString(
      exportProjectorSvg(shorts, STANDARD_M, optionsAtLength(45), plannedRun), "image/svg+xml");
    expect(projector.querySelector("parsererror")).toBeNull();
    const layers = [...projector.getElementsByTagName("g")].filter((layer) =>
      layer.getAttribute("inkscape:groupmode") === "layer");
    expect(layers).toHaveLength(shorts.sizes.length);
    const labels = [...projector.getElementsByTagName("text")].map((label) => label.textContent);
    expect(labels).toContain("XS SHORTS WAISTBAND");
    expect(labels).toContain("XL SHORTS POCKET BAG RIGHT");
    const narrowLabel = [...projector.getElementsByTagName("text")].find((label) => label.textContent === "XS SHORTS FLY SHIELD");
    expect(narrowLabel?.getAttribute("transform")).toMatch(/^rotate\(90 /u);
  });

  it("keeps all role labels, POM rows, dimensions and construction in the Tech Pack", () => {
    const options = optionsAtLength(45);
    const run = gradeRun(STANDARD_M, shorts.grade, shorts.sizes, shorts.draft, options);
    const pdf = exportTechPackV2(shorts, STANDARD_M, undefined, undefined, options);
    for (const piece of blockPieces(shorts.draft(STANDARD_M, baseOptions))) {
      expect(pdf).toContain(pdfString(piece.name.toUpperCase()));
    }
    for (const pom of shorts.poms) {
      expect(pdf).toContain(`(${pdfString(pom.label)})`);
      for (const graded of run) expect(pdf).toContain(pom.measure(graded.block).toFixed(1));
    }
    expect(pdf).toContain("(1. Prepare the paired pocket bags");
    expect(pdf.toLowerCase()).not.toContain("knee");
  });
});
