import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import type { ArtworkPlacement } from "../surface/placement";
import { pieceFrames } from "../surface/piece-frames";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { compileTechnicalFlatOverlays } from "./technical-flat-overlays";
import { validateTechnicalFlatOptions } from "./technical-flat-options";

const revisionId = "revision-g04";
const validColorway = { color: "#3669a4", texture: "woven", shine: 24 } as const;

function placement(overrides: Partial<ArtworkPlacement> = {}): ArtworkPlacement {
  return {
    id: "chest-mark", kind: "print", pieceRole: "front", widthCm: 4, heightCm: 3,
    transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 2,
    sourceName: "Chest mark", assetId: "builtin-chest-mark", ...overrides,
  };
}

describe("technical-flat colorway and artwork overlays", () => {
  it("carries selected presentation and maps visible artwork for every supported recipe", () => {
    for (const recipe of GARMENTS) {
      const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipe.name];
      if (!mapping) throw new Error(`Missing G04 map for ${recipe.name}`);
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      const visibleTargets = [...new Set(mapping.faces.flatMap((face) => face.roles
        .filter((role) => role.treatment !== "INTERIOR_HIDDEN").map((role) => role.roleId)))];
      const placements = visibleTargets.map((pieceRole, index) => placement({
        id: `${recipe.name}-${index}`, pieceRole,
      }));
      const result = compileTechnicalFlatOverlays(recipe, block, revisionId, placements,
        validColorway.color, validColorway.texture, validColorway.shine);
      expect(result.issues, recipe.name).toEqual([]);
      expect(result.faces).toHaveLength(2);
      for (const face of result.faces ?? []) {
        expect(face.revisionId).toBe(revisionId);
        expect(face.colorway).toMatchObject({ colorHex: "#3669a4", texture: "woven", shine: 24, revisionId });
        expect(face.colorway.targetRoleIds.length).toBeGreaterThan(0);
        expect(face.artwork.every((item) => item.source.revisionId === revisionId)).toBe(true);
      }
      expect(result.faces?.map((face) => face.artwork.map((item) => item.targetRoleId).sort()))
        .toEqual(mapping.faces.map((face) => face.roles
          .filter((role) => role.treatment !== "INTERIOR_HIDDEN").map((role) => role.roleId).sort()));
    }
  });

  it("keeps saved offsets, transforms, assets, and z-order attached to cut-frame anchors", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const frame = pieceFrames(block, recipe.allowances).frames.get("front");
    if (!frame) throw new Error("Tee front frame is missing.");
    const input = [
      placement({ id: "upper", transform: { dx: 2, dy: -3, scale: 1.25, rotationDeg: 30 }, zOrder: 8 }),
      placement({ id: "lower", transform: { dx: -2, dy: 1, scale: 0.8, rotationDeg: -10 }, zOrder: 1, assetId: undefined }),
    ];
    const result = compileTechnicalFlatOverlays(recipe, block, revisionId, input,
      validColorway.color, "smooth", 0);
    expect(result.issues).toEqual([]);
    const front = result.faces?.[0];
    expect(front?.artwork.map((item) => item.placementId)).toEqual(["lower", "upper"]);
    expect(front?.artwork[0]).not.toHaveProperty("assetId");
    expect(front?.artwork[0].transform).toMatchObject({
      dx: (frame.minX + frame.maxX) / 2 - 2,
      dy: (frame.minY + frame.maxY) / 2 + 1,
      scale: 0.8,
      rotationDegrees: -10,
    });
    expect(front?.notices).toContainEqual(expect.objectContaining({ reason: "SOURCE_REFERENCE_MISSING" }));
  });

  it("binds overlays to the revision and exact block returned by option topology validation", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt");
    if (!recipe) throw new Error("Woven shirt recipe is missing.");
    const options = defaultGarmentOptions(recipe.options ?? []);
    const validated = validateTechnicalFlatOptions(recipe, STANDARD_M, options, revisionId);
    expect(validated.issues).toEqual([]);
    const block = recipe.draft(STANDARD_M, validated.options ?? {});
    const overlays = compileTechnicalFlatOverlays(recipe, block, validated.revisionId,
      [placement({ pieceRole: "pocket" })], validColorway.color, validColorway.texture, validColorway.shine);
    expect(overlays.issues).toEqual([]);
    expect(overlays.faces?.every((face) => face.revisionId === validated.revisionId
      && face.artwork.every((item) => item.source.revisionId === face.revisionId))).toBe(true);
  });

  it("reports hidden roles, out-of-frame placements, missing assets, and overlaps", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "trouser");
    if (!recipe) throw new Error("Trouser recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const result = compileTechnicalFlatOverlays(recipe, block, revisionId, [
      placement({ id: "hidden", pieceRole: "pocketBagLeft" }),
      placement({ id: "wide", pieceRole: "frontLeft", widthCm: 500, heightCm: 500, assetId: undefined }),
      placement({ id: "overlap-a", pieceRole: "frontLeft", widthCm: 3, heightCm: 3, transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 } }),
      placement({ id: "overlap-b", pieceRole: "frontLeft", widthCm: 3, heightCm: 3, transform: { dx: 1, dy: 0, scale: 1, rotationDeg: 0 } }),
    ], validColorway.color, "rib", 100);
    expect(result.issues).toEqual([]);
    expect(result.faces?.[0].notices).toEqual(expect.arrayContaining([
      expect.objectContaining({ reason: "HIDDEN_BY_VIEW", sourceId: "style:artwork:hidden" }),
      expect.objectContaining({ reason: "OPTION_TOPOLOGY_MISMATCH", sourceId: "style:artwork:wide" }),
      expect.objectContaining({ reason: "SOURCE_REFERENCE_MISSING", sourceId: "style:artwork:wide" }),
      expect.objectContaining({ message: expect.stringContaining("overlaps") }),
    ]));
    expect(result.faces?.[0].colorway.texture).toBe("rib");
    expect(result.faces?.[0].colorway.shine).toBe(100);
  });

  it("does not call edge-touching rectangles an overlap", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const result = compileTechnicalFlatOverlays(recipe, block, revisionId, [
      placement({ id: "left", widthCm: 2, heightCm: 2, transform: { dx: -2, dy: 0, scale: 1, rotationDeg: 0 } }),
      placement({ id: "right", widthCm: 2, heightCm: 2, transform: { dx: 2, dy: 0, scale: 1, rotationDeg: 0 } }),
    ], validColorway.color, "heather", 0);
    expect(result.faces?.flatMap((face) => face.notices).some((notice) => notice.message.includes("overlaps"))).toBe(false);
  });

  it("rejects invalid source identities, duplicate placements, and unmapped roles", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const duplicate = placement();
    const result = compileTechnicalFlatOverlays(recipe, block, revisionId, [
      null,
      placement({ id: "blank-label", sourceName: " " }),
      duplicate,
      duplicate,
      placement({ id: "unmapped", pieceRole: "collar" }),
    ], validColorway.color, "woven", 5);
    expect(result.faces).toBeNull();
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "INVALID_PLACEMENT", "DUPLICATE_PLACEMENT_ID", "UNMAPPED_PLACEMENT_ROLE",
    ]));
  });

  it("returns actionable issues for malformed list, revision, colorway, recipe, and missing frame", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const malformed = compileTechnicalFlatOverlays(recipe, block, " ", null,
      "red", "unsupported", Number.NaN);
    expect(malformed.faces).toBeNull();
    expect(malformed.issues.map((issue) => issue.code)).toEqual([
      "INVALID_REVISION_ID", "INVALID_COLORWAY", "INVALID_PLACEMENT_LIST",
    ]);
    const nonStringRevision = compileTechnicalFlatOverlays(recipe, block, null as unknown as string, [],
      validColorway.color, validColorway.texture, validColorway.shine);
    expect(nonStringRevision.revisionId).toBe("");

    const unsupported = compileTechnicalFlatOverlays({ ...recipe, name: "unsupported" }, block, revisionId,
      [], validColorway.color, validColorway.texture, validColorway.shine);
    expect(unsupported.issues).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_RECIPE" }));

    const noFrameBlock = { ...block, roles: { sleeve: block.roles.sleeve } };
    const missingFrame = compileTechnicalFlatOverlays(recipe, noFrameBlock, revisionId,
      [placement({ pieceRole: "front" })], validColorway.color, validColorway.texture, validColorway.shine);
    expect(missingFrame.faces).toBeNull();
    expect(missingFrame.issues).toContainEqual(expect.objectContaining({ code: "MISSING_PIECE_FRAME" }));

    const invalidBlock = { ...block, roles: null };
    const invalidGeometry = compileTechnicalFlatOverlays(recipe, invalidBlock as never, revisionId,
      [], validColorway.color, validColorway.texture, validColorway.shine);
    expect(invalidGeometry.issues).toContainEqual(expect.objectContaining({ code: "INVALID_PATTERN_GEOMETRY" }));
    const nonErrorBlock = { ...block, roles: new Proxy({}, { ownKeys: () => { throw "bad role table"; } }) };
    const nonErrorGeometry = compileTechnicalFlatOverlays(recipe, nonErrorBlock, revisionId,
      [], validColorway.color, validColorway.texture, validColorway.shine);
    expect(nonErrorGeometry.issues[0].message).toContain("pattern geometry could not be framed");
  });
});
