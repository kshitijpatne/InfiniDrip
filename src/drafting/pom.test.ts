import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { gradeRun } from "./grading";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "./tshirt-grade";
import { draftTshirt } from "./tshirt";
import { modeledPomLabel, seam, spanX, spanY, specSheet, Pom, withModeledPomLabels } from "./pom";
import { TEE_POMS, TSHIRT_POMS } from "./tshirt-pom";
import { TANK_POMS } from "./tank";
import { rolePiece } from "./block";

const block = draftTshirt(STANDARD_M);

describe("query helpers", () => {
  it("seam returns a named edge's length", () => {
    expect(seam(rolePiece(block, "front"), "shoulder")).toBeGreaterThan(0);
  });

  it("seam throws for an unknown edge", () => {
    expect(() => seam(rolePiece(block, "front"), "nope")).toThrow();
  });

  it("spanX measures horizontal distance between two named points", () => {
    // hps (neckWidthHalf, 0) to the fold (x=0) = the half neck width
    const half = spanX(rolePiece(block, "front"), { edge: "shoulder", at: "start" }, { edge: "centerFront", at: "start" });
    expect(half).toBeGreaterThan(0);
    expect(half).toBeCloseTo(STANDARD_M.chest / 20 + 2, 6); // neckWidthHalf
  });

  it("spanY measures vertical distance between two named points", () => {
    // HPS (y=0) to hem (y=length) = body length
    const len = spanY(rolePiece(block, "front"), { edge: "shoulder", at: "start" }, { edge: "hem", at: "start" });
    expect(len).toBeCloseTo(STANDARD_M.length, 6);
  });
});

describe("TSHIRT_POMS", () => {
  it("body chest finished equals chest + ease", () => {
    const chest = TSHIRT_POMS.find((p) => p.label === "Body chest (finished)")!;
    expect(chest.measure(block)).toBeCloseTo(STANDARD_M.chest + STANDARD_M.ease, 4);
  });

  it("across shoulder equals the shoulder-width measurement", () => {
    const across = TSHIRT_POMS.find((p) => p.label === "Across shoulder")!;
    expect(across.measure(block)).toBeCloseTo(STANDARD_M.shoulderWidth, 4);
  });

  it("every POM reads a positive number off the block", () => {
    for (const pom of TSHIRT_POMS) {
      expect(pom.measure(block)).toBeGreaterThan(0);
    }
  });
});

describe("TEE_POMS source-backed back anchors", () => {
  it("uses exact matching back vertices while retaining front methods and keeping Polo's shared table front-only", () => {
    const measurements = [STANDARD_M, { ...STANDARD_M, chest: STANDARD_M.chest + 8, shoulderWidth: STANDARD_M.shoulderWidth + 2, length: STANDARD_M.length + 5 }];
    const anchoredLabels = ["Body chest (finished)", "Body length (HPS–hem)", "Across shoulder", "Neck width"];
    for (const current of measurements) {
      const currentBlock = draftTshirt(current);
      for (const label of anchoredLabels) {
        const tee = TEE_POMS.find((pom) => pom.label === label)!;
        const shared = TSHIRT_POMS.find((pom) => pom.label === label)!;
        const point = tee.backAnchor!(currentBlock);
        expect(point).toEqual(shared.anchor!(currentBlock));
        expect(tee.measure(currentBlock)).toBe(shared.measure(currentBlock));
        expect(tee.tolerance).toBe(shared.tolerance);
      }
      expect(TEE_POMS.find((pom) => pom.label === "Front neck drop")?.backAnchor).toBeUndefined();
      expect(TEE_POMS.find((pom) => pom.label === "Shoulder seam")?.backAnchor).toBeUndefined();
      expect(TEE_POMS.find((pom) => pom.label === "Armhole (front + back)")?.backAnchor).toBeUndefined();
    }
    expect(TSHIRT_POMS.every((pom) => pom.backAnchor === undefined)).toBe(true);
  });
});

describe("modeled POM labels", () => {
  it("uses a Tee-only calculated label while preserving canonical POM names", () => {
    const teeChest = TEE_POMS[0]!;
    const sharedChest = TSHIRT_POMS[0]!;
    const modeled = withModeledPomLabels(TEE_POMS, true);

    expect(teeChest.label).toBe("Body chest (finished)");
    expect("modeledLabel" in teeChest).toBe(false);
    expect(modeledPomLabel(teeChest, true)).toBe("Modeled chest circumference");
    expect(modeled[0]!.label).toBe("Modeled chest circumference");
    expect(teeChest.label).toBe("Body chest (finished)");
    expect(modeledPomLabel(teeChest, false)).toBe("Body chest (finished)");
    expect(TANK_POMS[0]).toBe(teeChest);
    expect("modeledLabel" in TANK_POMS[0]!).toBe(false);
    expect(modeledPomLabel(TANK_POMS[0]!)).toBe("Body chest (finished)");
    expect(sharedChest.label).toBe("Body chest (finished)");
    expect(withModeledPomLabels(TSHIRT_POMS, false)[0]!.label).toBe("Body chest (finished)");
    expect(withModeledPomLabels(TEE_POMS, false)[0]!.label).toBe("Body chest (finished)");
    expect(modeled.slice(1)).toEqual(TEE_POMS.slice(1));
  });
});

describe("specSheet", () => {
  const graded = gradeRun(STANDARD_M, TSHIRT_GRADE, TSHIRT_SIZES, draftTshirt);
  const rows = specSheet(graded, TSHIRT_POMS);

  it("has one row per POM and one value per size", () => {
    expect(rows.length).toBe(TSHIRT_POMS.length);
    for (const row of rows) expect(row.values.length).toBe(TSHIRT_SIZES.length);
  });

  it("rounds values to 0.1 cm", () => {
    for (const row of rows) {
      for (const v of row.values) expect(v * 10).toBeCloseTo(Math.round(v * 10), 9);
    }
  });

  it("grows monotonically across the size run (chest gets bigger each size up)", () => {
    const chest = rows.find((r) => r.label === "Body chest (finished)")!;
    for (let i = 1; i < chest.values.length; i++) {
      expect(chest.values[i]).toBeGreaterThan(chest.values[i - 1]);
    }
  });

  it("the base (M) column matches measuring the base block directly", () => {
    const baseIdx = graded.findIndex((g) => g.step === 0);
    const custom: Pom = { label: "chest half", measure: (b) => spanX(rolePiece(b, "front"), { edge: "side", at: "start" }, { edge: "centerFront", at: "start" }) };
    const sheet = specSheet(graded, [custom]);
    const direct = spanX(rolePiece(block, "front"), { edge: "side", at: "start" }, { edge: "centerFront", at: "start" });
    expect(sheet[0].values[baseIdx]).toBeCloseTo(Math.round(direct * 10) / 10, 9);
  });
});

describe("specSheet — tolerances", () => {
  const graded = gradeRun(STANDARD_M, TSHIRT_GRADE, TSHIRT_SIZES, draftTshirt);

  it("carries a POM's tolerance onto its spec row, unchanged across sizes", () => {
    const rows = specSheet(graded, [
      { label: "Chest", tolerance: 1.3, measure: (b) => seam(rolePiece(b, "front"), "hem") },
    ]);
    expect(rows[0].tolerance).toBe(1.3); // one value, not one per size
  });

  it("leaves the tolerance undefined when the POM declares none", () => {
    const rows = specSheet(graded, [
      { label: "No tol", measure: (b) => seam(rolePiece(b, "front"), "hem") },
    ]);
    expect(rows[0].tolerance).toBeUndefined();
  });
});
