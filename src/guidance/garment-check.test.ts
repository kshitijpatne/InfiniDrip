import { describe, it, expect } from "vitest";
import { FITTED, PieceNotches, STANDARD_M, TEE, draftFitted, draftTshirt, rolePiece, dartLegCheck } from "../drafting";
import { garmentReport, notchGrainCheck } from "./garment-check";

describe("garmentReport — the tee", () => {
  it("passes a sound standard t-shirt on every check", () => {
    const r = garmentReport(TEE, STANDARD_M);
    expect(r.ok).toBe(true);
    expect(r.checks).toHaveLength(7);
  });

  it("checks the hem is square to the fold, and has no dart check", () => {
    const names = garmentReport(TEE, STANDARD_M).checks.map((c) => c.name);
    expect(names).toContain("Hem square to the fold");
    expect(names).not.toContain("Dart legs equal");
  });

  it("fails when the sleeve cap can't be eased into the armhole", () => {
    const r = garmentReport(TEE, { ...STANDARD_M, bicep: 60 });
    expect(r.ok).toBe(false);
    expect(r.checks.find((c) => c.name === "Sleeve-cap ease")!.ok).toBe(false);
  });
});

describe("garmentReport — the fitted block", () => {
  const r = garmentReport(FITTED, STANDARD_M);

  it("passes: the darted front's side seam matches the back once the dart closes", () => {
    expect(r.ok).toBe(true);
    const side = r.checks.find((c) => c.name.startsWith("Side seam"))!;
    expect(side.ok).toBe(true);
    expect(side.detail).toContain("agree");
  });

  it("adds a dart-leg check and skips hem-square (the front is untrued)", () => {
    const names = r.checks.map((c) => c.name);
    expect(names).toContain("Dart legs equal");
    expect(names).not.toContain("Hem square to the fold");
  });
});

describe("dartLegCheck", () => {
  it("is skipped for an undarted block and passes for equal legs", () => {
    expect(dartLegCheck(draftTshirt(STANDARD_M))).toBeNull();
    expect(dartLegCheck(draftFitted(STANDARD_M))!.ok).toBe(true);
  });

  it("fails when one leg is longer than the other", () => {
    const b = draftFitted(STANDARD_M);
    const edges = rolePiece(b, "front").edges.map((e) =>
      e.kind === "line" && e.name === "bustDartLower" ? { ...e, end: { x: 99, y: 99 } } : e);
    const skewed = { ...b, roles: { ...b.roles, front: { ...rolePiece(b, "front"), edges } } };
    expect(dartLegCheck(skewed)!.ok).toBe(false);
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
    expect(notchGrainCheck(["front", "back"], table).ok).toBe(false);
  });

  it("fails when a declared piece has an empty notch list", () => {
    const empty: PieceNotches[] = [
      { pieceName: "front", notches: [],
        grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 } },
    ];
    expect(notchGrainCheck(["front"], empty).ok).toBe(false);
  });
});

import { point } from "../geometry";
import { block, TSHIRT_GRADE, TSHIRT_SIZES, edgeLength, pieceEdge, GarmentRecipe } from "../drafting";
import { present } from "./check";

describe("garmentReport — garment-agnostic (the skirt-bridge payoff)", () => {
  // A minimal sleeveless stub: one "panel" piece with a hem, and NO front/back/
  // sleeve roles. Before Slice 35 this threw inside garmentReport; now the checker
  // asks the recipe for its own checks and never reaches for a sleeve.
  const STUB: GarmentRecipe = {
    name: "stub",
    label: "Stub",
    draft: (m) =>
      block({
        panel: {
          name: "panel",
          onFold: true,
          edges: [{ kind: "line", name: "hem", start: point(0, m.length), end: point(m.chest / 4, m.length) }],
        },
      }),
    checks: () => [present("Panel drafted", true, "ok")], // no seam pairs, no sleeve
    guidance: () => [],
    sizeMetric: (b) => edgeLength(pieceEdge(rolePiece(b, "panel"), "hem")),
    notches: [
      {
        pieceName: "panel",
        notches: [{ edgeName: "hem", t: 0.5 }],
        grainline: { topEdge: "hem", topT: 0, bottomEdge: "hem", bottomT: 1 },
      },
    ],
    poms: [],
    grade: TSHIRT_GRADE,
    sizes: TSHIRT_SIZES,
    techPack: { bom: [], construction: [] },
    allowances: { default: 1, byEdge: {} },
  };

  it("runs without throwing on a garment that has no sleeve", () => {
    expect(() => garmentReport(STUB, STANDARD_M)).not.toThrow();
  });

  it("folds the recipe's own checks in with the agnostic ones, and adds no seam checks itself", () => {
    const names = garmentReport(STUB, STANDARD_M).checks.map((c) => c.name);
    expect(names).toContain("Panel drafted"); // recipe-owned
    expect(names).toContain("Notches + grainline on every piece"); // agnostic
    expect(names).toContain("Size run grows in order"); // agnostic
    expect(names).not.toContain("Sleeve-cap ease"); // the engine never invents this
  });
});
