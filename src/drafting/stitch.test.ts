import { describe, it, expect } from "vitest";
import { Piece } from "./piece";
import { Block, block } from "./block";
import { Point } from "../geometry";
import { Stitch, edgeRef, iface, interfaceLength, stitchChecks } from "./stitch";
import { TEE, FITTED, SKIRT } from "./recipe";
import { STANDARD_M, Measurements } from "./measurements";
import { CheckResult } from "../guidance/check";

// ── unit tests on synthetic data — the new module in isolation ────────────────

const p = (x: number, y: number): Point => ({ x, y });

/** A minimal piece: every edge a straight line, named exactly as given. */
function linePiece(name: string, edges: Readonly<Record<string, readonly [Point, Point]>>): Piece {
  return {
    name,
    onFold: false,
    edges: Object.entries(edges).map(([edgeName, [start, end]]) => ({
      kind: "line" as const,
      name: edgeName,
      start,
      end,
    })),
  };
}

describe("interfaceLength", () => {
  it("returns a single edge's own length for a one-edge interface", () => {
    const b: Block = block({ a: linePiece("A", { top: [p(0, 0), p(10, 0)] }) });
    expect(interfaceLength(b, iface(edgeRef("a", "top")))).toBeCloseTo(10, 6);
  });

  it("sums every edge in a multi-edge interface — the darted-side-seam case", () => {
    const b: Block = block({
      front: linePiece("Front", { sideUpper: [p(0, 0), p(0, 6)], sideLower: [p(0, 6), p(0, 11)] }),
    });
    const i = iface(edgeRef("front", "sideUpper"), edgeRef("front", "sideLower"));
    expect(interfaceLength(b, i)).toBeCloseTo(6 + 5, 6);
  });

  it("can span two different pieces — the armhole-spans-front-and-back case", () => {
    const b: Block = block({
      front: linePiece("Front", { armhole: [p(0, 0), p(0, 8)] }),
      back: linePiece("Back", { armhole: [p(0, 0), p(0, 7)] }),
    });
    const i = iface(edgeRef("front", "armhole"), edgeRef("back", "armhole"));
    expect(interfaceLength(b, i)).toBeCloseTo(15, 6);
  });

  it("throws the same loud error pieceEdge always has when an edge is missing", () => {
    const b: Block = block({ a: linePiece("A", { top: [p(0, 0), p(1, 0)] }) });
    expect(() => interfaceLength(b, iface(edgeRef("a", "bottom")))).toThrow('no edge named "bottom"');
  });
});

describe("stitchChecks", () => {
  const b: Block = block({
    front: linePiece("Front", { shoulder: [p(0, 0), p(5, 0)], cap: [p(0, 0), p(0, 6)] }),
    back: linePiece("Back", { shoulder: [p(0, 0), p(5.05, 0)], armhole: [p(0, 0), p(0, 5)] }),
  });

  it("passes an ordinary (no-ease) stitch when both sides match within tolerance", () => {
    const s: Stitch = { label: "Shoulder", a: iface(edgeRef("front", "shoulder")), b: iface(edgeRef("back", "shoulder")) };
    const [r] = stitchChecks(b, [s]);
    expect(r.ok).toBe(true);
    expect(r.name).toBe("Shoulder");
  });

  it("fails an ordinary stitch when the two sides genuinely differ", () => {
    const uneven: Stitch = { label: "Uneven", a: iface(edgeRef("front", "cap")), b: iface(edgeRef("back", "armhole")) };
    const [r] = stitchChecks(b, [uneven]); // 6 vs 5 — outside 0.1 tolerance
    expect(r.ok).toBe(false);
    expect(r.name).toBe("Uneven");
  });

  it("passes an ease-band stitch when the difference sits inside [lo, hi]", () => {
    const s: Stitch = {
      label: "Cap ease",
      a: iface(edgeRef("front", "cap")),      // 6
      b: iface(edgeRef("back", "armhole")),   // 5, diff = 1
      ease: { lo: -1, hi: 4 },
    };
    const [r] = stitchChecks(b, [s]);
    expect(r.ok).toBe(true);
  });

  it("fails an ease-band stitch when the difference falls outside [lo, hi]", () => {
    const s: Stitch = {
      label: "Cap ease too tight",
      a: iface(edgeRef("front", "cap")),      // 6
      b: iface(edgeRef("back", "armhole")),   // 5, diff = 1
      ease: { lo: 2, hi: 4 }, // 1 is below lo
    };
    const [r] = stitchChecks(b, [s]);
    expect(r.ok).toBe(false);
  });

  it("returns one CheckResult per stitch, in the same order they were declared", () => {
    const s1: Stitch = { label: "First", a: iface(edgeRef("front", "shoulder")), b: iface(edgeRef("back", "shoulder")) };
    const s2: Stitch = { label: "Second", a: iface(edgeRef("front", "cap")), b: iface(edgeRef("back", "armhole")), ease: { lo: -1, hi: 4 } };
    const results = stitchChecks(b, [s1, s2]);
    expect(results.map((r) => r.name)).toEqual(["First", "Second"]);
  });
});

// ── the real proof: declared stitches reproduce the real checks, byte-for-byte ─
//
// This is the deliverable this slice owes. Not "looks equivalent" — every
// CheckResult's name, ok, AND detail string compared field by field, on REAL
// drafted blocks, across several measurement points (not just STANDARD_M),
// against the actual existing hand-written check functions. Block itself is
// untouched: these stitch tables live only in this test file, exactly as
// COMPONENT-ARCHITECTURE.md §11 Q4 scoped Phase A1.

const TEE_STITCHES: readonly Stitch[] = [
  { label: "Shoulder seam (front ↔ back)", a: iface(edgeRef("front", "shoulder")), b: iface(edgeRef("back", "shoulder")) },
  { label: "Side seam (front ↔ back)", a: iface(edgeRef("front", "side")), b: iface(edgeRef("back", "side")) },
  { label: "Sleeve underarm (left ↔ right)", a: iface(edgeRef("sleeve", "sideLeft")), b: iface(edgeRef("sleeve", "sideRight")) },
  {
    label: "Sleeve-cap ease",
    a: iface(edgeRef("sleeve", "capLeft"), edgeRef("sleeve", "capRight")),
    b: iface(edgeRef("front", "armhole"), edgeRef("back", "armhole")),
    ease: { lo: -1, hi: 4 },
  },
];

const FITTED_STITCHES: readonly Stitch[] = [
  { label: "Shoulder seam (front ↔ back)", a: iface(edgeRef("front", "shoulder")), b: iface(edgeRef("back", "shoulder")) },
  {
    label: "Side seam (front ↔ back)",
    a: iface(edgeRef("front", "sideUpper"), edgeRef("front", "sideLower")),
    b: iface(edgeRef("back", "side")),
  },
  { label: "Sleeve underarm (left ↔ right)", a: iface(edgeRef("sleeve", "sideLeft")), b: iface(edgeRef("sleeve", "sideRight")) },
  {
    label: "Sleeve-cap ease",
    a: iface(edgeRef("sleeve", "capLeft"), edgeRef("sleeve", "capRight")),
    b: iface(edgeRef("front", "armhole"), edgeRef("back", "armhole")),
    ease: { lo: -1, hi: 4 },
  },
  { label: "Dart legs equal", a: iface(edgeRef("front", "bustDartUpper")), b: iface(edgeRef("front", "bustDartLower")) },
];

const SKIRT_STITCHES: readonly Stitch[] = [
  {
    label: "Side seam (front ↔ back)",
    a: iface(edgeRef("front", "sideUpper"), edgeRef("front", "sideLower")),
    b: iface(edgeRef("back", "sideUpper"), edgeRef("back", "sideLower")),
  },
];

/** Compare two CheckResult arrays field by field: name, ok, and detail. */
function expectSameChecks(actual: readonly CheckResult[], expected: readonly CheckResult[]): void {
  expect(actual.length).toBe(expected.length);
  actual.forEach((a, i) => {
    expect(a.name).toBe(expected[i].name);
    expect(a.ok).toBe(expected[i].ok);
    expect(a.detail).toBe(expected[i].detail);
  });
}

// Real measurement points, not just the default — including one deliberately
// implausible chest (per this project's own "warn, never clamp" philosophy,
// an implausible number still drafts and still must check out correctly) and
// one at each garment's field extremes where they're independently tunable.
const TEE_POINTS: readonly Measurements[] = [
  STANDARD_M,
  { ...STANDARD_M, chest: 130, shoulderWidth: 50 },
  { ...STANDARD_M, chest: 70, shoulderWidth: 36, ease: 4 },
  { ...STANDARD_M, chest: 160 }, // implausible on purpose — still must check out
];

describe("stitch-declared checks reproduce the real tee checks exactly", () => {
  for (const m of TEE_POINTS) {
    it(`matches sleevedTopChecks at chest=${m.chest}, shoulder=${m.shoulderWidth}`, () => {
      const b = TEE.draft(m);
      const real = TEE.checks(b, m).slice(0, 4); // the 4 stitch-derivable ones; hem-square is index 4
      const declared = stitchChecks(b, TEE_STITCHES);
      expectSameChecks(declared, real);
    });
  }
});

const FITTED_POINTS: readonly Measurements[] = [
  STANDARD_M,
  { ...STANDARD_M, chest: 120, shoulderWidth: 48 },
  { ...STANDARD_M, chest: 76, shoulderWidth: 38 },
];

describe("stitch-declared checks reproduce the real fitted checks exactly", () => {
  for (const m of FITTED_POINTS) {
    it(`matches sleevedTopChecks at chest=${m.chest}, shoulder=${m.shoulderWidth}`, () => {
      const b = FITTED.draft(m);
      const real = FITTED.checks(b, m); // ALL 5 of fitted's checks are stitch-derivable — no hem-square
      const declared = stitchChecks(b, FITTED_STITCHES);
      expectSameChecks(declared, real);
    });
  }
});

const SKIRT_POINTS: readonly Measurements[] = [
  STANDARD_M,
  { ...STANDARD_M, waist: 70, hip: 96, hipDepth: 18 },
  { ...STANDARD_M, waist: 94, hip: 130, hipDepth: 25 },
];

describe("stitch-declared checks reproduce the real skirt checks exactly", () => {
  for (const m of SKIRT_POINTS) {
    it(`matches skirtChecks at waist=${m.waist}, hip=${m.hip}`, () => {
      const b = SKIRT.draft(m);
      const real = SKIRT.checks(b, m).slice(0, 1); // the 1 stitch-derivable one; hem/waist-square are panel checks
      const declared = stitchChecks(b, SKIRT_STITCHES);
      expectSameChecks(declared, real);
    });
  }
});

describe("what's deliberately NOT claimed as a stitch (panel properties)", () => {
  it("tee's hem-square-to-fold is excluded from TEE_STITCHES on purpose", () => {
    const b = TEE.draft(STANDARD_M);
    const real = TEE.checks(b, STANDARD_M);
    expect(real[4].name).toBe("Hem square to the fold");
    expect(TEE_STITCHES.some((s) => s.label === "Hem square to the fold")).toBe(false);
  });

  it("skirt's hem- and waist-square are excluded from SKIRT_STITCHES on purpose", () => {
    const b = SKIRT.draft(STANDARD_M);
    const real = SKIRT.checks(b, STANDARD_M);
    expect(real.map((r) => r.name)).toEqual([
      "Side seam (front ↔ back)",
      "Hem square to the fold",
      "Waist square to the fold",
    ]);
    expect(SKIRT_STITCHES).toHaveLength(1);
  });
});
