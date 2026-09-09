import { describe, it, expect } from "vitest";
import { Piece } from "./piece";
import { Block, block } from "./block";
import { Point } from "../geometry";
import { Stitch, edgeRef, iface, interfaceLength, stitchChecks, matchedNotch } from "./stitch";
import { TEE, FITTED, SKIRT } from "./recipe";
import { TSHIRT_NOTCHES } from "./tshirt-notches";
import { FITTED_NOTCHES } from "./fitted-tables";
import { SKIRT_NOTCHES } from "./skirt";
import { STANDARD_M } from "./measurements";
import { CheckResult } from "../guidance/check";
import {
  TEE_GOLDEN_POINTS, TEE_GOLDEN_REPORTS,
  FITTED_GOLDEN_POINTS, FITTED_GOLDEN_REPORTS,
  SKIRT_GOLDEN_POINTS, SKIRT_GOLDEN_REPORTS,
} from "./garment-check-golden";

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
    const b: Block = block({ a: linePiece("A", { top: [p(0, 0), p(10, 0)] }) }, []);
    expect(interfaceLength(b, iface(edgeRef("a", "top")))).toBeCloseTo(10, 6);
  });

  it("sums every edge in a multi-edge interface — the darted-side-seam case", () => {
    const b: Block = block({
      front: linePiece("Front", { sideUpper: [p(0, 0), p(0, 6)], sideLower: [p(0, 6), p(0, 11)] }),
    }, []);
    const i = iface(edgeRef("front", "sideUpper"), edgeRef("front", "sideLower"));
    expect(interfaceLength(b, i)).toBeCloseTo(6 + 5, 6);
  });

  it("can span two different pieces — the armhole-spans-front-and-back case", () => {
    const b: Block = block({
      front: linePiece("Front", { armhole: [p(0, 0), p(0, 8)] }),
      back: linePiece("Back", { armhole: [p(0, 0), p(0, 7)] }),
    }, []);
    const i = iface(edgeRef("front", "armhole"), edgeRef("back", "armhole"));
    expect(interfaceLength(b, i)).toBeCloseTo(15, 6);
  });

  it("throws the same loud error pieceEdge always has when an edge is missing", () => {
    const b: Block = block({ a: linePiece("A", { top: [p(0, 0), p(1, 0)] }) }, []);
    expect(() => interfaceLength(b, iface(edgeRef("a", "bottom")))).toThrow('no edge named "bottom"');
  });
});

describe("stitchChecks", () => {
  const b: Block = block({
    front: linePiece("Front", { shoulder: [p(0, 0), p(5, 0)], cap: [p(0, 0), p(0, 6)] }),
    back: linePiece("Back", { shoulder: [p(0, 0), p(5.05, 0)], armhole: [p(0, 0), p(0, 5)] }),
  }, []);

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

describe("matchedNotch", () => {
  const s: Stitch = {
    label: "Side seam",
    a: iface(edgeRef("front", "sideUpper"), edgeRef("front", "sideLower")),
    b: iface(edgeRef("back", "side")),
  };

  it("reads side a's edge name at the default index (0)", () => {
    expect(matchedNotch(s, "a", 0.5)).toEqual({ edgeName: "sideUpper", t: 0.5 });
  });

  it("reads side b's edge name", () => {
    expect(matchedNotch(s, "b", 0.5)).toEqual({ edgeName: "side", t: 0.5 });
  });

  it("picks a later edge of a multi-edge interface by index", () => {
    expect(matchedNotch(s, "a", 0.5, 1)).toEqual({ edgeName: "sideLower", t: 0.5 });
  });

  it("carries t through unchanged, including a non-default position", () => {
    expect(matchedNotch(s, "b", 0.75)).toEqual({ edgeName: "side", t: 0.75 });
  });
});

// ── Phase A3 proof: each garment's derived notch table matches the ORIGINAL
// hand-written literals exactly, field for field — not just the SVG hash
// (regression.test.ts covers tee/fitted output; skirt has no export baseline,
// so this is skirt's only byte-level proof). These are the literal values
// tshirt-notches.ts / fitted-tables.ts / skirt.ts shipped before this slice.

describe("TSHIRT_NOTCHES matches the pre-migration hand table exactly", () => {
  it("front: shoulder, side, armhole", () => {
    const front = TSHIRT_NOTCHES.find((r) => r.pieceName === "front")!;
    expect(front.notches).toEqual([
      { edgeName: "shoulder", t: 0.5 },
      { edgeName: "side", t: 0.5 },
      { edgeName: "armhole", t: 0.33 },
    ]);
  });

  it("back: shoulder x2 (back reference), side, armhole", () => {
    const back = TSHIRT_NOTCHES.find((r) => r.pieceName === "back")!;
    expect(back.notches).toEqual([
      { edgeName: "shoulder", t: 0.5 },
      { edgeName: "shoulder", t: 0.5 },
      { edgeName: "side", t: 0.5 },
      { edgeName: "armhole", t: 0.33 },
    ]);
  });

  it("sleeve: capLeft, capRight, sideLeft, sideRight", () => {
    const sleeve = TSHIRT_NOTCHES.find((r) => r.pieceName === "sleeve")!;
    expect(sleeve.notches).toEqual([
      { edgeName: "capLeft", t: 0.5 },
      { edgeName: "capRight", t: 0.5 },
      { edgeName: "sideLeft", t: 0.5 },
      { edgeName: "sideRight", t: 0.5 },
    ]);
  });
});

describe("FITTED_NOTCHES matches the pre-migration hand table exactly", () => {
  it("fitted front: shoulder, sideLower, armhole", () => {
    const front = FITTED_NOTCHES.find((r) => r.pieceName === "fitted front")!;
    expect(front.notches).toEqual([
      { edgeName: "shoulder", t: 0.5 },
      { edgeName: "sideLower", t: 0.5 },
      { edgeName: "armhole", t: 0.33 },
    ]);
  });

  it("still reuses the tee's back and sleeve entries verbatim", () => {
    expect(FITTED_NOTCHES.some((r) => r.pieceName === "back")).toBe(true);
    expect(FITTED_NOTCHES.some((r) => r.pieceName === "sleeve")).toBe(true);
    expect(FITTED_NOTCHES.some((r) => r.pieceName === "front")).toBe(false);
  });
});

describe("SKIRT_NOTCHES matches the pre-migration hand table exactly", () => {
  it("front: one balance notch at sideLower", () => {
    const front = SKIRT_NOTCHES.find((r) => r.pieceName === "front")!;
    expect(front.notches).toEqual([{ edgeName: "sideLower", t: 0.5 }]);
  });

  it("back: two notches at different t (2 = back reference)", () => {
    const back = SKIRT_NOTCHES.find((r) => r.pieceName === "back")!;
    expect(back.notches).toEqual([
      { edgeName: "sideLower", t: 0.5 },
      { edgeName: "sideLower", t: 0.75 },
    ]);
  });
});

// ── the real proof: PRODUCTION stitches reproduce recorded truth, byte-for-byte ─
//
// Phase A2 (this slice) changed what this section proves. In A1, `recipe.checks`
// was still the OLD hand-written function, so comparing a locally-declared
// stitch table against it was a genuine external check. Now that `recipe.checks`
// has been narrowed to panel-only checks (Slice 50), comparing against it here
// would be comparing the wrong thing, not just a weaker thing — `TEE.checks`
// no longer returns any stitch-derived result at all.
//
// So the proof now runs against `garment-check-golden.ts`: real numbers,
// captured from the REAL pre-migration garmentReport, frozen before any
// production code changed (see that file's own comment). And rather than a
// second, test-file-only copy of each garment's stitch table (which could
// silently drift from what tshirt.ts/fitted.ts/skirt.ts actually ship), this
// reads `b.stitches` straight off the real drafted block — the actual
// production wiring, not a parallel declaration of what it should be.

/** Compare two CheckResult arrays field by field: name, ok, and detail. */
function expectSameChecks(actual: readonly CheckResult[], expected: readonly CheckResult[]): void {
  expect(actual.length).toBe(expected.length);
  actual.forEach((a, i) => {
    expect(a.name).toBe(expected[i].name);
    expect(a.ok).toBe(expected[i].ok);
    expect(a.detail).toBe(expected[i].detail);
  });
}

describe("PRODUCTION tee stitches reproduce the golden master exactly", () => {
  TEE_GOLDEN_POINTS.forEach((m, i) => {
    it(`matches at chest=${m.chest}, shoulder=${m.shoulderWidth}`, () => {
      const b = TEE.draft(m);
      const expected = TEE_GOLDEN_REPORTS[i].checks.slice(0, 4); // stitch-derivable; hem-square is index 4
      expectSameChecks(stitchChecks(b, b.stitches), expected);
    });
  });
});

describe("PRODUCTION fitted stitches reproduce the golden master exactly", () => {
  FITTED_GOLDEN_POINTS.forEach((m, i) => {
    it(`matches at chest=${m.chest}, shoulder=${m.shoulderWidth}`, () => {
      const b = FITTED.draft(m);
      const expected = FITTED_GOLDEN_REPORTS[i].checks.slice(0, 5); // ALL 5 stitch-derivable — no hem-square
      expectSameChecks(stitchChecks(b, b.stitches), expected);
    });
  });
});

describe("PRODUCTION skirt stitches reproduce the golden master exactly", () => {
  SKIRT_GOLDEN_POINTS.forEach((m, i) => {
    it(`matches at waist=${m.waist}, hip=${m.hip}`, () => {
      const b = SKIRT.draft(m);
      const expected = SKIRT_GOLDEN_REPORTS[i].checks.slice(0, 1); // stitch-derivable; hem/waist-square are panel checks
      expectSameChecks(stitchChecks(b, b.stitches), expected);
    });
  });
});

describe("what's deliberately NOT a stitch (panel properties) — still correct post-migration", () => {
  it("tee's hem-square-to-fold now comes entirely from recipe.checks, not a stitch", () => {
    const b = TEE.draft(STANDARD_M);
    const panel = TEE.checks(b, STANDARD_M);
    expect(panel).toHaveLength(1);
    expect(panel[0].name).toBe("Hem square to the fold");
    expect(b.stitches.some((s) => s.label === "Hem square to the fold")).toBe(false);
  });

  it("skirt's hem- and waist-square now come entirely from recipe.checks, not a stitch", () => {
    const b = SKIRT.draft(STANDARD_M);
    const panel = SKIRT.checks(b, STANDARD_M);
    expect(panel.map((r) => r.name)).toEqual(["Hem square to the fold", "Waist square to the fold"]);
    expect(b.stitches).toHaveLength(1); // just the side seam
  });
});
