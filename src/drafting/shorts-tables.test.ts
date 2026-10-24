import { describe, expect, it } from "vitest";
import { distance } from "../geometry";
import type { Point } from "../geometry";
import { flattenPiece } from "../export/layout";
import { exportSvg } from "../export/svg";
import { allowanceFor } from "./allowance";
import { blockPieces, rolePiece } from "./block";
import { gradeMeasurements } from "./grading";
import { STANDARD_M } from "./measurements";
import { edgeEnd, edgeStart, pieceEdge } from "./piece";
import { specSheet } from "./pom";
import { resolveGrainline, resolveNotch } from "../render/notch";
import { stitchChecks } from "./stitch";
import { draftShortsWithComponents, shortsComponentGuidance } from "./shorts-components";
import { DEFAULT_SHORTS_OPTIONS, SHORTS_ROLE_IDS } from "./shorts-contract";
import {
  SHORTS_ALLOWANCES,
  SHORTS_GRADE,
  SHORTS_NOTCHES,
  SHORTS_POMS,
  SHORTS_SIZES,
  SHORTS_TECH_PACK,
} from "./shorts-tables";

function polygonArea(points: readonly Point[]): number {
  return Math.abs(points.reduce((sum, point, index) => {
    const next = points[(index + 1) % points.length]!;
    return sum + point.x * next.y - next.x * point.y;
  }, 0)) / 2;
}

function hasProperCrossing(points: readonly Point[]): boolean {
  const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;
  for (let first = 0; first < points.length; first += 1) {
    const a = points[first]!;
    const b = points[(first + 1) % points.length]!;
    for (let second = first + 2; second < points.length; second += 1) {
      if (first === 0 && second === points.length - 1) continue;
      const c = points[second]!;
      const d = points[(second + 1) % points.length]!;
      const ab = { x: b.x - a.x, y: b.y - a.y };
      const ac = { x: c.x - a.x, y: c.y - a.y };
      const ad = { x: d.x - a.x, y: d.y - a.y };
      const cd = { x: d.x - c.x, y: d.y - c.y };
      const ca = { x: a.x - c.x, y: a.y - c.y };
      const cb = { x: b.x - c.x, y: b.y - c.y };
      if (cross(ab, ac) * cross(ab, ad) < -1e-12 && cross(cd, ca) * cross(cd, cb) < -1e-12) return true;
    }
  }
  return false;
}

function sizeDraft(sizeIndex: number, options: Partial<typeof DEFAULT_SHORTS_OPTIONS> = {}) {
  const size = SHORTS_SIZES[sizeIndex]!;
  const measurements = gradeMeasurements(STANDARD_M, SHORTS_GRADE, size.step);
  const selectedOptions = { ...DEFAULT_SHORTS_OPTIONS, ...options };
  return {
    label: size.label,
    step: size.step,
    measurements,
    options: selectedOptions,
    block: draftShortsWithComponents(measurements, selectedOptions),
  };
}

describe("shorts construction and output tables", () => {
  it("uses a named 2.5 cm hem turn and the one-centimetre woven default", () => {
    expect(allowanceFor(SHORTS_ALLOWANCES, "hem", "shorts front left")).toBe(2.5);
    for (const edge of ["waist", "centerFront", "centerBack", "crotch", "opening", "bagLower", "top", "bottom"]) {
      expect(allowanceFor(SHORTS_ALLOWANCES, edge, "shorts front left")).toBe(1);
    }
  });

  it("grades only lower-body inputs and keeps five-size style options fixed", () => {
    expect(SHORTS_GRADE).toEqual({
      waist: 4,
      hip: 4,
      hipDepth: 1,
      crotchDepth: 1,
      thigh: 2,
    });
    expect(SHORTS_SIZES.map(({ label }) => label)).toEqual(["XS", "S", "M", "L", "XL"]);
    const samples = SHORTS_SIZES.map((_, index) => sizeDraft(index));
    expect(samples.map(({ options }) => options)).toEqual(
      Array.from({ length: 5 }, () => DEFAULT_SHORTS_OPTIONS),
    );
    expect(samples.map(({ measurements }) => measurements.knee)).toEqual([40, 40, 40, 40, 40]);
    expect(samples.map(({ measurements }) => measurements.inseam)).toEqual([78, 78, 78, 78, 78]);
    expect(samples.every(({ measurements }) => measurements.ease === STANDARD_M.ease)).toBe(true);
  });

  it("measures finished POMs from live geometry and omits a knee POM", () => {
    const sizes = SHORTS_SIZES.map((_, index) => sizeDraft(index));
    const rows = specSheet(
      sizes.map(({ label, step, measurements, block }) => ({ label, step, measurements, block })),
      SHORTS_POMS,
    );
    expect(rows.map(({ label }) => label)).toEqual([
      "Waist (finished)",
      "Waistband depth (finished)",
      "Seat / hip (finished)",
      "Hip depth (body reference)",
      "Front rise (finished incl. waistband)",
      "Back rise (finished incl. waistband)",
      "Thigh (finished)",
      "Shorts length (modeled vertical crotch-to-hem station)",
      "Inseam (finished seam length)",
      "Outseam (finished incl. waistband)",
      "Leg opening (finished)",
      "Front fly length (finished)",
      "Left pocket opening (finished)",
      "Right pocket opening (finished)",
      "Pocket bag depth (finished)",
      "Pocket bag width (finished)",
      "Pocket drop (finished placement)",
    ]);
    expect(rows.every((row) => row.values.length === 5 && row.values.every(Number.isFinite))).toBe(true);
    expect(rows.find((row) => row.label === "Waist (finished)")?.values).toEqual([86, 90, 94, 98, 102]);
    expect(rows.find((row) => row.label.startsWith("Shorts length"))?.values).toEqual([20, 20, 20, 20, 20]);
    expect(rows.map(({ label }) => label.toLowerCase()).some((label) => label.includes("knee"))).toBe(false);
  });

  it("resolves every notch and grainline rule against each of the nine live roles", () => {
    for (const sample of SHORTS_SIZES.map((_, index) => sizeDraft(index))) {
      expect(SHORTS_NOTCHES.map((entry) => entry.pieceName)).toEqual(blockPieces(sample.block).map((piece) => piece.name));
      expect(SHORTS_NOTCHES).toHaveLength(SHORTS_ROLE_IDS.length);
      for (const rule of SHORTS_NOTCHES) {
        const piece = blockPieces(sample.block).find((candidate) => candidate.name === rule.pieceName)!;
        expect(rule.notches.length).toBeGreaterThan(0);
        for (const notch of rule.notches) {
          const resolved = resolveNotch(piece, notch);
          expect(Number.isFinite(resolved.point.x) && Number.isFinite(resolved.point.y)).toBe(true);
        }
        const grainline = resolveGrainline(piece, rule.grainline);
        expect(Number.isFinite(grainline.top.x) && Number.isFinite(grainline.top.y)).toBe(true);
        expect(Number.isFinite(grainline.bottom.x) && Number.isFinite(grainline.bottom.y)).toBe(true);
        expect(distance(grainline.top, grainline.bottom)).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the press crease on the actual thigh-to-hem midline without adding knee marks", () => {
    for (const sample of SHORTS_SIZES.map((_, index) => sizeDraft(index))) {
      for (const role of ["frontLeft", "frontRight", "backLeft", "backRight"]) {
        const piece = rolePiece(sample.block, role);
        const sideThigh = edgeStart(pieceEdge(piece, "sideThighToHem"));
        const innerThigh = edgeEnd(pieceEdge(piece, "inseamThighToHem"));
        const sideHem = edgeEnd(pieceEdge(piece, "sideThighToHem"));
        const innerHem = edgeStart(pieceEdge(piece, "inseamThighToHem"));
        const mark = piece.marks!.find((candidate) => candidate.name === "pressCrease")!;
        expect(mark.kind).toBe("placementLine");
        expect("start" in mark).toBe(true);
        if ("start" in mark) {
          expect(mark.start).toEqual({ x: (sideThigh.x + innerThigh.x) / 2, y: (sideThigh.y + innerThigh.y) / 2 });
          expect(mark.end).toEqual({ x: (sideHem.x + innerHem.x) / 2, y: (sideHem.y + innerHem.y) / 2 });
        }
        expect(piece.marks!.some((candidate) => candidate.name.toLowerCase().includes("knee"))).toBe(false);
      }
    }
  });

  it("keeps the nine roles, 11 matched stitches, and finite closed allowance outlines for XS–XL and pressure samples", () => {
    const samples = [
      ...SHORTS_SIZES.map((_, index) => sizeDraft(index)),
      sizeDraft(0, { shortsInseam: 5.5, hemOpening: 40 }),
      sizeDraft(4, { shortsInseam: 45, hemOpening: 90 }),
    ];
    for (const sample of samples) {
      expect(Object.keys(sample.block.roles)).toEqual(SHORTS_ROLE_IDS);
      expect(sample.block.stitches).toHaveLength(11);
      expect(stitchChecks(sample.block, sample.block.stitches).every((check) => check.ok)).toBe(true);
      expect(shortsComponentGuidance(sample.block, sample.measurements, sample.options)).toEqual([]);
      for (const piece of blockPieces(sample.block)) {
        const first = piece.edges[0]!;
        const last = piece.edges[piece.edges.length - 1]!;
        expect(edgeEnd(last)).toEqual(edgeStart(first));
        const flat = flattenPiece(piece, SHORTS_ALLOWANCES);
        expect(flat.cut.length).toBeGreaterThanOrEqual(4);
        expect(flat.cut.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
        expect(polygonArea(flat.cut)).toBeGreaterThan(0);
        expect(hasProperCrossing(flat.cut)).toBe(false);
      }
    }
  });

  it("emits qualified BOM and construction data for the eight researched operations", () => {
    expect(SHORTS_TECH_PACK.bom).toHaveLength(6);
    expect(SHORTS_TECH_PACK.construction).toHaveLength(8);
    expect(SHORTS_TECH_PACK.constructionNotice).toContain("Digital construction guidance only");
    expect(SHORTS_TECH_PACK.constructionNotice).toContain("no physical fit or production validation");
    expect(SHORTS_TECH_PACK.bom.some((row) => row.qty.startsWith("TBD"))).toBe(true);
    expect(SHORTS_TECH_PACK.construction[0]).toContain("pocket bags");
    expect(SHORTS_TECH_PACK.construction[3]).toContain("back rise");
    expect(SHORTS_TECH_PACK.construction[7]).toContain("straight hems");
  });

  it("renders actual M pieces with allowance, grain, notches, and press-crease labels", () => {
    const drafted = sizeDraft(2).block;
    const svg = exportSvg(blockPieces(drafted), SHORTS_ALLOWANCES, SHORTS_NOTCHES);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("<polygon");
    expect(svg).toContain("front press crease");
    expect(svg).toContain("back press crease");
    expect(svg.toLowerCase()).not.toContain("knee");
  });
});
