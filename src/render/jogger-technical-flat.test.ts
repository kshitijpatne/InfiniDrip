import { describe, expect, it } from "vitest";
import { STANDARD_M } from "../drafting/measurements";
import { draftJogger } from "../drafting/jogger";
import { TROUSER } from "../drafting/recipe";
import type { GarmentRecipe } from "../drafting/recipe";
import { compileTechnicalFlatLiveView } from "./technical-flat-live";

const JOGGER_RENDER_RECIPE = {
  ...TROUSER, name: "jogger", label: "Jogger", draft: draftJogger, poms: [],
} as unknown as GarmentRecipe;

describe("hidden Jogger technical-flat representation", () => {
  it("compiles both source-aware faces for default, custom, and invalid-finite blocks", () => {
    const cases = [
      { id: "default", options: {} },
      { id: "custom", options: { pocketAngle: 55, pocketOpening: 16, drawcordExitSpacing: 8 } },
      { id: "invalid-finite", options: { waistbandDepth: 2, elasticWidth: 3, drawcordCutWidth: 5 } },
    ];
    for (const scenario of cases) for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
      const output = compileTechnicalFlatLiveView({
        recipe: JOGGER_RENDER_RECIPE,
        block: draftJogger(STANDARD_M, scenario.options),
        revisionId: `jogger-${scenario.id}`,
        kind,
        placements: [],
        colorHex: "#567890",
        texture: "smooth",
        shine: 0,
      });
      if (scenario.id === "invalid-finite") {
        expect(output.view).toBeNull();
        expect(output.issues.some((issue) => issue.sourceId.includes("waistband"))).toBe(true);
        continue;
      }
      expect(output.issues).toEqual([]);
      expect(output.view).not.toBeNull();
      const sourceIds = output.view!.primitives.map((primitive) => primitive.source.sourceId);
      for (const roleId of kind === "FRONT_FLAT" ? ["frontLeft", "frontRight"] : ["backLeft", "backRight"]) {
        expect(sourceIds).toContain(`pattern:jogger:role:${roleId}`);
      }
      for (const markName of ["elasticChannelTop", "elasticChannelBottom", "drawcordChannelTop", "drawcordChannelBottom"]) {
        const segments = output.view!.primitives.filter((primitive) => primitive.kind === "path"
          && primitive.patternMark?.name === markName);
        expect(segments).toHaveLength(2);
        expect(segments.filter((primitive) => primitive.kind === "path" && primitive.patternMark?.label)).toHaveLength(1);
      }
    }
  });

  it("withholds casing artwork until its source placement has an exact fragment projection", () => {
    const result = compileTechnicalFlatLiveView({
      recipe: JOGGER_RENDER_RECIPE,
      block: draftJogger(STANDARD_M, {}),
      revisionId: "jogger-artwork",
      kind: "FRONT_FLAT",
      placements: [{ id: "casing-art", kind: "print", pieceRole: "waistband", widthCm: 2, heightCm: 1,
        transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1, sourceName: "Casing artwork" }],
      colorHex: "#567890",
      texture: "smooth",
      shine: 0,
    });
    expect(result.issues).toContainEqual(expect.objectContaining({
      sourceId: "style:artwork:casing-art",
      message: expect.stringContaining("Jogger casing is withheld"),
    }));
  });
});
