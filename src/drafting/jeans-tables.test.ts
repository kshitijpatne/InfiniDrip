import { describe, expect, it } from "vitest";
import { gradeMeasurements } from "./grading";
import { resolveGrainline, resolveNotch } from "../render/notch";
import { blockPieces } from "./block";
import { draftJeansCore } from "./jeans";
import { STANDARD_M } from "./measurements";
import { JEANS_NOTCHES } from "./jeans-tables";
import { TROUSER_GRADE } from "./trouser-tables";

describe("Jeans notch and grainline rules", () => {
  it("names every draft role and resolves its matched marks from live geometry", () => {
    expect(JEANS_NOTCHES.map(({ pieceName }) => pieceName)).toEqual([
      "jeans front left", "jeans front right",
      "jeans back yoke left", "jeans back yoke right",
      "jeans back lower left", "jeans back lower right",
    ]);

    for (const step of [-2, 0, 2]) {
      const measurements = gradeMeasurements(STANDARD_M, TROUSER_GRADE, step);
      const draft = draftJeansCore(measurements);
      const pieces = blockPieces(draft);
      for (const rule of JEANS_NOTCHES) {
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
      const frontSideNotch = resolveNotch(front, { edgeName: "sideWaistToYoke", t: 1 });
      const yokeSideRule = JEANS_NOTCHES.find(({ pieceName }) => pieceName === "jeans back yoke left")!
        .notches.find(({ edgeName }) => edgeName === "sideWaistToYoke")!;
      const yokeSideNotch = resolveNotch(yoke, yokeSideRule);
      expect(frontSideNotch.point).toEqual(yokeSideNotch.point);
    }
  });
});
