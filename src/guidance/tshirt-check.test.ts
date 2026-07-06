import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { PieceNotches } from "../drafting/tshirt-notches";
import { tshirtReport, notchGrainCheck } from "./tshirt-check";

describe("tshirtReport", () => {
  it("passes a sound standard t-shirt on every check", () => {
    const r = tshirtReport(STANDARD_M);
    expect(r.ok).toBe(true);
    expect(r.checks).toHaveLength(7);
    expect(r.checks.every((c) => c.ok)).toBe(true);
  });

  it("reports the seams that sew together as matched", () => {
    const r = tshirtReport(STANDARD_M);
    const shoulder = r.checks.find((c) => c.name.startsWith("Shoulder"))!;
    expect(shoulder.ok).toBe(true);
    expect(shoulder.detail).toContain("agree");
  });

  it("finds the hem square to the fold", () => {
    const fold = tshirtReport(STANDARD_M).checks.find((c) => c.name.includes("fold"))!;
    expect(fold.ok).toBe(true);
    expect(fold.detail).toContain("90.0°");
  });

  it("fails the verdict when the sleeve cap can't be eased into the armhole", () => {
    const r = tshirtReport({ ...STANDARD_M, bicep: 60 });
    expect(r.ok).toBe(false);
    const ease = r.checks.find((c) => c.name === "Sleeve-cap ease")!;
    expect(ease.ok).toBe(false);
  });
});

describe("notchGrainCheck", () => {
  const table: PieceNotches[] = [
    { pieceName: "front", notches: [{ edgeName: "side", t: 0.5 }],
      grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 } },
  ];

  it("passes when every named piece is declared with notches", () => {
    const c = notchGrainCheck(["front"], table);
    expect(c.ok).toBe(true);
    expect(c.detail).toContain("1 pieces marked");
  });

  it("fails when a piece has no entry", () => {
    const c = notchGrainCheck(["front", "back"], table);
    expect(c.ok).toBe(false);
    expect(c.detail).toContain("missing");
  });

  it("fails when a declared piece has an empty notch list", () => {
    const empty: PieceNotches[] = [
      { pieceName: "front", notches: [],
        grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 } },
    ];
    expect(notchGrainCheck(["front"], empty).ok).toBe(false);
  });
});
