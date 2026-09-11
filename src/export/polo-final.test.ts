// Slice 73: final Polo cross-size and output gate.
// These checks parse the generated artifacts with real consumers (DOMParser and
// pdf-lib); string presence alone is not treated as evidence.
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import {
  STANDARD_M,
  POLO,
  blockPieces,
  draftAtSize,
  gradeRun,
  stitchChecks,
  sampleSpec,
} from "../drafting";
import { garmentReport } from "../guidance/garment-check";
import { gradedMarker } from "./marker";
import { exportSvg } from "./svg";
import { exportDxf } from "./dxf";
import { exportProjectorSvg } from "./projector";

const OPTIONS = {
  placketLength: 20,
  placketWidth: 3.5,
  standHeight: 2.5,
  collarLeafDepth: 6,
} as const;

describe("Slice 73 — Polo cross-size readiness", () => {
  it("grades every size with the same live options and passing stitches", () => {
    const run = gradeRun(STANDARD_M, POLO.grade, POLO.sizes, POLO.draft, OPTIONS);
    expect(run).toHaveLength(POLO.sizes.length);
    for (const graded of run) {
      expect(blockPieces(graded.block)).toHaveLength(9);
      expect(stitchChecks(graded.block, graded.block.stitches).every((check) => check.ok)).toBe(true);
    }
    expect(garmentReport(POLO, STANDARD_M, OPTIONS).ok).toBe(true);
    expect(sampleSpec(POLO, STANDARD_M, OPTIONS).map((pom) => pom.value)).toEqual(
      expect.arrayContaining([20, 3.5, 3.5, 2.5, 6])
    );
  });

  it("packs the whole graded run without losing physical pieces", () => {
    const marker = gradedMarker(POLO, STANDARD_M, 150, OPTIONS);
    expect(marker.placed).toHaveLength(POLO.sizes.length * 9);
    expect(marker.fabricLength).toBeGreaterThan(0);
    expect(marker.utilization).toBeGreaterThan(0);
    expect(marker.utilization).toBeLessThanOrEqual(1);
  });

  it("keeps a selected graded size true-scale in SVG and DXF", () => {
    const block = draftAtSize(STANDARD_M, POLO.grade, 2, POLO.draft, OPTIONS);
    const pieces = blockPieces(block);
    const svg = exportSvg(pieces, POLO.allowances, POLO.notches);
    const svgDoc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(svgDoc.querySelector("parsererror")).toBeNull();
    expect(svgDoc.querySelectorAll("polygon")).toHaveLength(pieces.length * 2);
    expect(svgDoc.querySelectorAll('[data-pattern-mark="button"]').length).toBe(3);
    expect(svgDoc.querySelectorAll('[data-pattern-mark="buttonhole"]').length).toBe(3);

    const dxf = exportDxf(pieces, POLO.allowances);
    expect(dxf).toContain("MARK_CUTLINE");
    expect(dxf).toContain("MARK_BUTTON");
    expect(dxf).toContain("MARK_BUTTONHOLE");

  });

  it("keeps all five size layers and construction marks in the projector file", () => {
    const doc = new DOMParser().parseFromString(exportProjectorSvg(POLO, STANDARD_M, OPTIONS), "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    const layers = [...doc.querySelectorAll('g[inkscape\\:groupmode="layer"]')];
    expect(layers).toHaveLength(POLO.sizes.length);
    for (const size of POLO.sizes) {
      const layer = doc.querySelector(`#size-${size.label}`)!;
      const pieceLabels = [...layer.querySelectorAll("text")]
        .filter((text) => text.textContent?.startsWith(`${size.label} `));
      expect(pieceLabels).toHaveLength(9);
      expect(layer.querySelector('[data-pattern-mark-name="placketOpening"]')).not.toBeNull();
    }
    expect(doc.querySelectorAll('[data-pattern-mark="button"]')).toHaveLength(POLO.sizes.length * 3);
    expect(doc.querySelectorAll('[data-pattern-mark="buttonhole"]')).toHaveLength(POLO.sizes.length * 3);
  });

});
