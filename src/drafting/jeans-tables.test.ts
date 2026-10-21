import { describe, expect, it } from "vitest";
import { gradeMeasurements } from "./grading";
import { resolveGrainline, resolveNotch } from "../render/notch";
import { blockPieces } from "./block";
import { draftJeansCore } from "./jeans";
import { STANDARD_M } from "./measurements";
import { JEANS_NOTCHES, jeansNotchesForDraft } from "./jeans-tables";
import { TROUSER_GRADE } from "./trouser-tables";

describe("Jeans notch and grainline rules", () => {
  it("names every draft role and resolves its matched marks from live geometry", () => {
    expect(JEANS_NOTCHES.map(({ pieceName }) => pieceName)).toEqual([
      "jeans front left", "jeans front right",
      "jeans back yoke left", "jeans back yoke right",
      "jeans back lower left", "jeans back lower right",
      "jeans front pocket facing left", "jeans front pocket facing right",
      "jeans front pocket bag left", "jeans front pocket bag right",
      "jeans front pocket stay left", "jeans front pocket stay right",
      "jeans right coin-pocket facing extension", "jeans coin pocket",
      "jeans back patch pocket left", "jeans back patch pocket right",
    ]);

    for (const step of [-2, 0, 2]) {
      const measurements = gradeMeasurements(STANDARD_M, TROUSER_GRADE, step);
      const draft = draftJeansCore(measurements);
      const pieces = blockPieces(draft);
      const notches = jeansNotchesForDraft(draft);
      for (const rule of notches) {
        const piece = pieces.find(({ name }) => name === rule.pieceName)!;
        for (const notchRule of rule.notches) {
          const resolved = resolveNotch(piece, notchRule);
          expect([resolved.point.x, resolved.point.y, resolved.normal.x, resolved.normal.y]
            .every(Number.isFinite)).toBe(true);
        }
        const grain = resolveGrainline(piece, rule.grainline);
        expect([grain.top.x, grain.top.y, grain.bottom.x, grain.bottom.y]
          .every(Number.isFinite)).toBe(true);
        expect(grain.top).not.toEqual(grain.bottom);
      }

      const front = pieces.find(({ name }) => name === "jeans front left")!;
      const yoke = pieces.find(({ name }) => name === "jeans back yoke left")!;
      const frontSideNotch = resolveNotch(front, { edgeName: "sidePocketDropToYoke", t: 1 });
      const yokeSideRule = notches.find(({ pieceName }) => pieceName === "jeans back yoke left")!
        .notches.find(({ edgeName }) => edgeName === "sideWaistToYoke")!;
      const yokeSideNotch = resolveNotch(yoke, yokeSideRule);
      expect(frontSideNotch.point).toEqual(yokeSideNotch.point);

      const frontHipNotch = resolveNotch(front, {
        edgeName: "sideHipToThigh",
        t: 0,
      });
      const backLower = pieces.find(({ name }) => name === "jeans back lower left")!;
      const backHipRule = notches.find(({ pieceName }) => pieceName === "jeans back lower left")!
        .notches.find(({ edgeName }) => edgeName === "sideYokeToHip")!;
      expect(frontHipNotch.point).toEqual(resolveNotch(backLower, backHipRule).point);
    }
  });

  it("moves the front yoke notch onto the facing when a deeper pocket crosses that side station", () => {
    const draft = draftJeansCore(STANDARD_M, { frontPocketDrop: 12 });
    const notches = jeansNotchesForDraft(draft);
    const pieces = blockPieces(draft);
    const facing = pieces.find(({ name }) => name === "jeans front pocket facing left")!;
    const yoke = pieces.find(({ name }) => name === "jeans back yoke left")!;
    const facingSideRule = notches.find(({ pieceName }) => pieceName === "jeans front pocket facing left")!
      .notches.find(({ edgeName }) => edgeName === "sideFacing")!;
    const yokeSideRule = notches.find(({ pieceName }) => pieceName === "jeans back yoke left")!
      .notches.find(({ edgeName }) => edgeName === "sideWaistToYoke")!;
    expect(resolveNotch(facing, facingSideRule).point).toEqual(resolveNotch(yoke, yokeSideRule).point);
  });
});
