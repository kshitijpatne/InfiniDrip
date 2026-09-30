import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../drafting";
import { compileTechnicalFlatLiveView, reflectFoldPrimitive, technicalFlatPrimitiveRole } from "./technical-flat-live";
import { assembleTechnicalFlatRoles } from "./technical-flat-assembly";
import type { FlatPathPrimitive, TechnicalFlatPrimitive } from "./technical-flat";

describe("compileTechnicalFlatLiveView", () => {
  it("resolves role ownership for geometry, marks, darts, artwork and anchored callouts", () => {
    const base = { layer: "ANNOTATION" as const, feature: "annotation" as const,
      source: { sourceClass: "PATTERN_DERIVED" as const, sourceId: "pattern:tee:role:front", revisionId: "live" } };
    const outline: TechnicalFlatPrimitive = { ...base, kind: "path", id: "outline", commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 1, y: 0 } },
    ] };
    const mark: TechnicalFlatPrimitive = { ...base, kind: "mark", id: "mark", markKind: "button",
      markName: "button", at: { x: 0, y: 0 }, source: { ...base.source, sourceId: "pattern:tee:mark:front:button" } };
    const dart: TechnicalFlatPrimitive = { ...base, kind: "path", id: "dart", commands: outline.commands,
      source: { ...base.source, sourceId: "pattern:tee:dart:front:waist" } };
    const artwork: TechnicalFlatPrimitive = { ...base, kind: "artwork", id: "art", feature: "artwork",
      source: { ...base.source, sourceClass: "USER_REFERENCE", sourceId: "style:artwork:1" }, artworkKind: "print",
      placementId: "1", sourceName: "sample", targetRoleId: "front", widthCm: 1, heightCm: 1,
      transform: { dx: 0, dy: 0, scale: 1, rotationDegrees: 0 }, zOrder: 0 };
    const callout: TechnicalFlatPrimitive = { ...base, kind: "callout", id: "pom", feature: "pom", text: "Chest",
      anchor: { primitiveId: "outline", point: { x: 0, y: 0 } }, labelAt: { x: 2, y: 0 } };
    expect(technicalFlatPrimitiveRole(outline, [outline], ["front"])).toBe("front");
    expect(technicalFlatPrimitiveRole(mark, [mark], ["front"])).toBe("front");
    expect(technicalFlatPrimitiveRole(dart, [dart], ["front"])).toBe("front");
    expect(technicalFlatPrimitiveRole(artwork, [artwork], ["front"])).toBe("front");
    expect(technicalFlatPrimitiveRole(callout, [outline, callout], ["front"])).toBe("front");
    expect(technicalFlatPrimitiveRole(callout, [callout], ["front"])).toBe("");
    expect(technicalFlatPrimitiveRole({ ...base, kind: "text", id: "free-note", at: { x: 0, y: 0 }, text: "note",
      source: { ...base.source, sourceId: "style:note" } }, [], ["front"])).toBe("");
  });

  it("binds front/back primitives, overlays and callouts to one transformed draft revision", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tank")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const front = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-tank-42", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "woven", shine: 12 });
    const back = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-tank-42", kind: "BACK_FLAT",
      placements: [], colorHex: "#456789", texture: "woven", shine: 12 });
    expect(front.issues).toEqual([]);
    expect(back.issues).toEqual([]);
    expect(front.view?.revisionId).toBe(back.view?.revisionId);
    expect(front.view?.primitives.every((primitive) => primitive.source.revisionId === "live-tank-42")).toBe(true);
    expect(back.view?.primitives.every((primitive) => primitive.source.revisionId === "live-tank-42")).toBe(true);
    expect(front.view?.primitives.some((primitive) => primitive.kind === "callout")).toBe(true);
    expect(back.view?.notices.some((notice) => notice.message.includes("no back anchor is inferred"))).toBe(true);
    expect(front.view?.primitives.find((primitive) => primitive.kind === "path")?.kind).toBe("path");
    expect(front.view?.primitives.filter((primitive) => primitive.kind === "path")
      .every((primitive) => primitive.sourceEdgeIds?.every((id) => id.startsWith("pattern:tank:role:")))).toBe(true);
    const artwork = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-tank-art", kind: "FRONT_FLAT",
      placements: [{ id: "chest-mark", kind: "print", pieceRole: "front", widthCm: 1, heightCm: 1,
        transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1, sourceName: "Chest mark" }],
      colorHex: "#456789", texture: "woven", shine: 12 });
    expect(artwork.issues).toEqual([]);
    expect(artwork.view?.primitives.some((primitive) => primitive.kind === "artwork")).toBe(true);
    expect(artwork.colorway).toMatchObject({ revisionId: "live-tank-art", colorHex: "#456789" });
  });

  it("withholds Tee/Fitted sleeves and the Skirt waistband until their face contours are source-mapped", () => {
    for (const [recipeId, roleId] of [["tee", "sleeve"], ["fitted", "sleeve"], ["skirt", "waistband"]] as const) {
      const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: `live-${recipeId}-${kind}`, kind,
          placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
        expect(result.view, `${recipeId}.${kind}`).toBeNull();
        expect(result.colorway).toBeNull();
        expect(result.issues.some((issue) => issue.stage === "geometry"
          && issue.sourceId.includes(`role:${roleId}:edge:`)
          && (issue.message.includes("source does not identify") || issue.message.includes("source does not establish")))).toBe(true);
      }
    }
  });

  it("withholds Polo and Woven collar faces when the drafted source has no face split landmarks", () => {
    for (const recipeId of ["polo", "woven-shirt"]) {
      const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: `live-${recipeId}-${kind}`, kind,
          placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
        expect(result.view).toBeNull();
        expect(result.colorway).toBeNull();
        expect(result.issues.some((issue) => issue.stage === "geometry"
          && issue.message.includes("no authored front/back split landmark"))).toBe(true);
      }
    }
  });

  it("reflects authored fold geometry without duplicating the axis or non-geometric overlays", () => {
    const base = { layer: "ANNOTATION" as const, feature: "annotation" as const,
      source: { sourceClass: "PATTERN_DERIVED" as const, sourceId: "pattern:tee:role:front", revisionId: "r1" } };
    const outline: TechnicalFlatPrimitive = { ...base, kind: "path", id: "outline",
      sourceEdgeIds: ["pattern:tee:role:front:edge:centerFront", "pattern:tee:role:front:edge:neck", "pattern:tee:role:front:edge:side"],
      commands: [{ op: "move", point: { x: 0, y: 4 } }, { op: "line", point: { x: 0, y: 0 } },
        { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 2, y: 1 } },
        { op: "move", point: { x: 2, y: 1 } }, { op: "line", point: { x: 4, y: 0 } }] };
    expect(reflectFoldPrimitive(outline, "centerFront")).toMatchObject({ id: "outline:fold-reflection",
      sourceEdgeIds: ["pattern:tee:role:front:edge:neck", "pattern:tee:role:front:edge:side"],
      commands: [{ point: { x: 0, y: 0 } }, { point: { x: 2, y: 1 } }, { point: { x: 2, y: 1 } }, { point: { x: 4, y: 0 } }] });
    expect(reflectFoldPrimitive({ ...outline, sourceEdgeIds: ["pattern:tee:role:front:edge:centerFront"],
      commands: outline.commands.slice(0, 2) }, "centerFront")).toBeUndefined();
    expect(reflectFoldPrimitive({ ...outline, sourceEdgeIds: undefined, commands: [] }, "centerFront")).toBeUndefined();
    expect(reflectFoldPrimitive({ ...outline, sourceEdgeIds: undefined, commands: [
      { op: "move", point: { x: 0, y: 0 } }, { op: "line", point: { x: 0, y: 1 } },
    ] }, "centerFront")).toBeUndefined();
    expect(reflectFoldPrimitive({ ...outline, sourceEdgeIds: undefined, commands: [
      { op: "move", point: { x: 0, y: 1 } },
      { op: "cubic", control1: { x: 1, y: 2 }, control2: { x: 2, y: 2 }, point: { x: 3, y: 1 } },
      { op: "close" },
    ] }, "centerFront")?.id).toBe("outline:fold-reflection");
    expect(reflectFoldPrimitive({ ...base, kind: "mark", id: "mark", markKind: "placementPoint", markName: "side", at: { x: 2, y: 0 } }, "centerFront")?.id)
      .toBe("mark:fold-reflection");
    expect(reflectFoldPrimitive({ ...base, kind: "mark", id: "axis", markKind: "placementPoint", markName: "axis", at: { x: 0, y: 0 } }, "centerFront"))
      .toBeUndefined();
    expect(reflectFoldPrimitive({ ...base, kind: "circle", id: "circle", center: { x: 2, y: 0 }, radius: 1 }, "centerFront")?.id)
      .toBe("circle:fold-reflection");
    expect(reflectFoldPrimitive({ ...base, kind: "circle", id: "axis-circle", center: { x: 0, y: 0 }, radius: 1 }, "centerFront"))
      .toBeUndefined();
    expect(reflectFoldPrimitive({ ...base, kind: "text", id: "text", at: { x: 1, y: 1 }, text: "note" }, "centerFront"))
      .toBeUndefined();
  });

  it("renders the second half from source-declared folds while preserving the drafted block and single POM anchors", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tank")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const before = structuredClone(block);
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "fold-view", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(result.issues).toEqual([]);
    expect(result.view).not.toBeNull();
    expect(block).toEqual(before);
    const outlines = result.view!.primitives.filter((primitive): primitive is FlatPathPrimitive => primitive.kind === "path"
      && primitive.source.sourceId === "pattern:tank:role:front");
    const original = outlines.find((primitive) => primitive.id.endsWith(":outline"))!;
    const reflected = outlines.find((primitive) => primitive.id.endsWith(":outline:fold-reflection"))!;
    expect(original.sourceEdgeIds).toContain("pattern:tank:role:front:edge:centerFront");
    expect(reflected.sourceEdgeIds).not.toContain("pattern:tank:role:front:edge:centerFront");
    expect(result.view!.primitives.some((primitive) => primitive.kind === "callout" && primitive.id.includes(":fold-reflection")))
      .toBe(false);
    expect(result.view!.primitives.some((primitive) => primitive.kind === "artwork" && primitive.id.includes(":fold-reflection")))
      .toBe(false);
  });

  it("withholds unsupported recipes and exposes mapping and assembly corrections", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const unsupported = compileTechnicalFlatLiveView({ recipe: { ...recipe, name: "future" } as typeof recipe, block,
      revisionId: "live-future-1", kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    const unsupportedBack = compileTechnicalFlatLiveView({ recipe: { ...recipe, name: "future" } as typeof recipe, block,
      revisionId: "live-future-2", kind: "BACK_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(unsupported.view).toBeNull();
    expect(unsupportedBack.view).toBeNull();
    expect(unsupported.issues.some((issue) => issue.stage === "geometry" || issue.stage === "assembly")).toBe(true);

    const missing = { ...block, roles: { ...block.roles, front: undefined } } as unknown as typeof block;
    const assembly = compileTechnicalFlatLiveView({ recipe, block: missing, revisionId: "live-tee-2", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(assembly.view).toBeNull();
    expect(assembly.issues.some((issue) => issue.stage === "assembly" && issue.message.includes("absent"))).toBe(true);

    const disconnected = assembleTechnicalFlatRoles("tee", { ...block, stitches: [] }, "FRONT_FLAT");
    expect(disconnected.issues.some((issue) => issue.code === "UNPLACED_COMPONENT_ROLE" && issue.sourceId === "sleeve")).toBe(true);
  });

  it("reports invalid revision and presentation values from their source stages", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "", kind: "BACK_FLAT",
      placements: [], colorHex: "bad", texture: "smooth", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues.some((issue) => issue.stage === "geometry" && issue.message.includes("revision"))).toBe(true);
    expect(result.issues.some((issue) => issue.stage === "overlay" && issue.message.includes("color"))).toBe(true);
    expect(result.issues.some((issue) => issue.stage === "pom" && issue.message.includes("revision"))).toBe(true);
  });

  it("retains assembly residuals as visible source notices while preserving rigid scale", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const result = assembleTechnicalFlatRoles("tee", block, "FRONT_FLAT");
    const residual = result.issues.find((issue) => issue.message.includes("leaves its sewn endpoints"));
    expect(residual?.sourceId).toContain("stitch:");
  });
});
