import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../drafting";
import { compileTechnicalFlatLiveView, placeTechnicalFlatPrimitive, reflectFoldPrimitive, reflectPrimitiveAcrossLine, technicalFlatAssemblyNotices, technicalFlatPrimitiveRole } from "./technical-flat-live";
import { assembleTechnicalFlatRoles } from "./technical-flat-assembly";
import type { FlatPathPrimitive, TechnicalFlatPrimitive } from "./technical-flat";
import type { TechnicalFlatLiveIssue } from "./technical-flat-live";

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

  it("withholds Tee/Fitted sleeves until their face contours are source-mapped", () => {
    for (const [recipeId, roleId] of [["tee", "sleeve"], ["fitted", "sleeve"]] as const) {
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

  it("emits source-segmented skirt waistbands and reflects each face segment across its panel axis", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "skirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    for (const [kind, segmentEdges] of [
      ["FRONT_FLAT", ["seam", "top", "end"]],
      ["BACK_FLAT", ["seam", "top"]],
    ] as const) {
      const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: `live-skirt-${kind}`, kind,
        placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
      expect(result.issues, kind).toEqual([]);
      expect(result.view, kind).not.toBeNull();
      const paths = result.view!.primitives.filter((primitive) => primitive.kind === "path"
        && primitive.source.sourceId.includes("role:waistband"));
      const outline = paths.find((primitive) => primitive.id.endsWith("component:waistband:outline"));
      const reflected = paths.find((primitive) => primitive.id.endsWith("component:waistband:outline:attached-fold-reflection"));
      const sideBoundary = paths.find((primitive) => primitive.id.endsWith("view-boundary:side-seam-outline"));
      const reflectedBoundary = paths.find((primitive) => primitive.id.endsWith("view-boundary:side-seam-outline:attached-fold-reflection"));
      expect(outline?.kind).toBe("path");
      expect(reflected?.kind).toBe("path");
      expect(sideBoundary).toMatchObject({ layer: "GARMENT_SILHOUETTE", feature: "silhouette" });
      expect(reflectedBoundary).toMatchObject({ layer: "GARMENT_SILHOUETTE", feature: "silhouette" });
      if (outline?.kind !== "path" || reflected?.kind !== "path") throw new Error("Expected waistband segment paths.");
      expect(outline.sourceEdgeIds?.map((sourceId) => sourceId.split(":edge:").pop())).toEqual(segmentEdges);
      expect(reflected.sourceEdgeIds).toEqual(outline.sourceEdgeIds?.filter((sourceId) =>
        !sourceId.endsWith(kind === "FRONT_FLAT" ? ":edge:end" : ":edge:fold")));
      expect(outline.commands).not.toEqual(reflected.commands);
      expect(paths.some((primitive) => primitive.kind === "path" && primitive.feature === "seam"
        && primitive.source.sourceId.includes("view-boundary"))).toBe(false);
    }
  });

  it("withholds artwork placed across the Skirt face-segment boundary", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "skirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-skirt-art", kind: "FRONT_FLAT",
      placements: [{ id: "art-band", pieceRole: "waistband", assetId: "print", x: 1, y: 1,
        width: 1, height: 1, rotation: 0 } as never], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues).toContainEqual(expect.objectContaining({ stage: "overlay", sourceId: "style:artwork:waistband",
      message: expect.stringContaining("Reposition it on the front or back panel") }));
  });

  it("reflects attached source primitives across an arbitrary assembled axis and rejects malformed geometry", () => {
    const base = { layer: "ANNOTATION" as const, feature: "annotation" as const,
      source: { sourceClass: "PATTERN_DERIVED" as const, sourceId: "pattern:skirt:role:waistband", revisionId: "r1" } };
    const path: FlatPathPrimitive = { ...base, kind: "path", id: "band",
      sourceEdgeIds: ["pattern:skirt:role:waistband:edge:top", "pattern:skirt:role:waistband:edge:fold"],
      commands: [{ op: "move", point: { x: 0, y: 0 } }, { op: "cubic", control1: { x: 1, y: 0 },
        control2: { x: 1, y: 1 }, point: { x: 2, y: 1 } }, { op: "close" }, { op: "move", point: { x: 0, y: 0 } },
        { op: "line", point: { x: 0, y: 2 } }] };
    const placementIssues: TechnicalFlatLiveIssue[] = [];
    const missingPlacement = placeTechnicalFlatPrimitive(path, "waistband", undefined, placementIssues);
    expect(missingPlacement).toEqual([]);
    expect(placementIssues[0]?.message).toContain("no sewn placement");
    expect(placementIssues).toHaveLength(1);
    expect(placeTechnicalFlatPrimitive(path, "waistband", { offset: { x: 1, y: 2 }, rotationDegrees: 0 }))
      .toMatchObject([{ placed: { kind: "path", id: "band" } }]);
    const reflected = reflectPrimitiveAcrossLine(path, { x: 0, y: 0 }, { x: 0, y: 3 });
    expect(reflected).toMatchObject({ id: "band:attached-fold-reflection", kind: "path",
      sourceEdgeIds: ["pattern:skirt:role:waistband:edge:top"],
      commands: [{ op: "move", point: { x: 0, y: 0 } }, { op: "cubic", control1: { x: -1, y: 0 },
        control2: { x: -1, y: 1 }, point: { x: -2, y: 1 } }, { op: "close" }] });
    expect(reflectPrimitiveAcrossLine(path, { x: 2, y: 2 }, { x: 2, y: 2 })).toBeUndefined();
    expect(reflectPrimitiveAcrossLine({ ...path, sourceEdgeIds: ["wrong"] }, { x: 0, y: 0 }, { x: 0, y: 1 })).toBeUndefined();
    expect(reflectPrimitiveAcrossLine({ ...path, sourceEdgeIds: undefined, commands: [] }, { x: 0, y: 0 }, { x: 0, y: 1 })).toBeUndefined();
    const mark = { ...base, kind: "mark" as const, id: "mark", markKind: "button" as const,
      markName: "b", at: { x: 2, y: 1 } };
    expect(reflectPrimitiveAcrossLine(mark, { x: 0, y: 0 }, { x: 0, y: 2 })).toMatchObject({ at: { x: -2, y: 1 } });
    expect(reflectPrimitiveAcrossLine({ ...mark, at: { x: 0, y: 1 } }, { x: 0, y: 0 }, { x: 0, y: 2 })).toBeUndefined();
    const circle = { ...base, kind: "circle" as const, id: "circle", center: { x: 2, y: 1 }, radius: 1 };
    expect(reflectPrimitiveAcrossLine(circle, { x: 0, y: 0 }, { x: 0, y: 2 })).toMatchObject({ center: { x: -2, y: 1 } });
    expect(reflectPrimitiveAcrossLine({ ...circle, center: { x: 0, y: 1 } }, { x: 0, y: 0 }, { x: 0, y: 2 })).toBeUndefined();
    expect(reflectPrimitiveAcrossLine({ ...base, kind: "text", id: "text", at: { x: 1, y: 1 }, text: "note" },
      { x: 0, y: 0 }, { x: 0, y: 2 })).toBeUndefined();
  });

  it("keeps Polo and visually incoherent Woven assembled faces held", () => {
    for (const recipeId of ["polo", "woven-shirt"]) {
      const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: `live-${recipeId}-${kind}`, kind,
          placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
        if (recipeId === "polo") {
          expect(result.view).toBeNull();
          expect(result.colorway).toBeNull();
          expect(result.issues.some((issue) => issue.stage === "geometry"
            && issue.message.includes("no authored front/back split landmark"))).toBe(true);
        } else {
          expect(result.view).toBeNull();
          expect(result.colorway).toBeNull();
          if (kind === "FRONT_FLAT") {
            expect(result.issues.some((issue) => issue.stage === "geometry"
              && issue.message.includes("crossing source roles"))).toBe(true);
          } else {
            expect(result.issues.some((issue) => issue.stage === "geometry"
              && issue.message.includes("Woven sleeve-cap placement"))).toBe(false);
            expect(result.issues.some((issue) => issue.stage === "assembly"
              && issue.message.includes("Woven sleeve-cap ease"))).toBe(true);
          }
          expect(result.issues.some((issue) => issue.stage === "geometry"
            && issue.message.includes("no authored front/back split landmark"))).toBe(false);
        }
      }
    }
  });

  it("reports unavailable sewn placements and preserves residual-endpoint notices", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const disconnected = { ...block, stitches: [] };
    const result = compileTechnicalFlatLiveView({ recipe, block: disconnected, revisionId: "live-disconnected",
      kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(result.view).toBeNull();
    expect(result.issues.some((issue) => issue.stage === "assembly" && issue.message.includes("no rigid placement supported"))).toBe(true);
    expect(technicalFlatAssemblyNotices("woven-shirt", "FRONT_FLAT", [
      { code: "STITCH_ENDPOINT_RESIDUAL", sourceId: "stitch:collar", message: "Residual 0.4 cm." },
      { code: "INCONSISTENT_STITCH_TRANSFORM", sourceId: "stitch:cycle", message: "Cycle conflict." },
    ])).toEqual([expect.objectContaining({ id: "notice:woven-shirt:FRONT_FLAT:assembly:stitch:collar",
      reason: "SOURCE_NOT_REPRESENTED", feature: "seam" })]);
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
    expect(original.sourceEdgeIds).not.toContain("pattern:tank:role:front:edge:centerFront");
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
