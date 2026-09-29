import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../drafting";
import { compileTechnicalFlatLiveView, technicalFlatPrimitiveRole } from "./technical-flat-live";
import type { TechnicalFlatPrimitive } from "./technical-flat";

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
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const front = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-tee-42", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "woven", shine: 12 });
    const back = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-tee-42", kind: "BACK_FLAT",
      placements: [], colorHex: "#456789", texture: "woven", shine: 12 });
    expect(front.issues).toEqual([]);
    expect(back.issues).toEqual([]);
    expect(front.view?.revisionId).toBe(back.view?.revisionId);
    expect(front.view?.primitives.every((primitive) => primitive.source.revisionId === "live-tee-42")).toBe(true);
    expect(back.view?.primitives.every((primitive) => primitive.source.revisionId === "live-tee-42")).toBe(true);
    expect(front.view?.primitives.some((primitive) => primitive.kind === "callout")).toBe(true);
    expect(back.view?.notices.some((notice) => notice.message.includes("no back anchor is inferred"))).toBe(true);
    expect(front.view?.primitives.find((primitive) => primitive.kind === "path")?.kind).toBe("path");
    const artwork = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-tee-art", kind: "FRONT_FLAT",
      placements: [{ id: "chest-mark", kind: "print", pieceRole: "front", widthCm: 1, heightCm: 1,
        transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1, sourceName: "Chest mark" }],
      colorHex: "#456789", texture: "woven", shine: 12 });
    expect(artwork.issues).toEqual([]);
    expect(artwork.view?.primitives.some((primitive) => primitive.kind === "artwork")).toBe(true);
    expect(artwork.colorway).toMatchObject({ revisionId: "live-tee-art", colorHex: "#456789" });
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

    const disconnected = compileTechnicalFlatLiveView({ recipe, block: { ...block, stitches: [] },
      revisionId: "live-tee-disconnected", kind: "FRONT_FLAT", placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(disconnected.view).toBeNull();
    expect(disconnected.issues.some((issue) => issue.stage === "transform" && issue.message.includes("no sewn placement"))).toBe(true);
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
    const result = compileTechnicalFlatLiveView({ recipe, block, revisionId: "live-tee-residual", kind: "FRONT_FLAT",
      placements: [], colorHex: "#456789", texture: "smooth", shine: 0 });
    expect(result.issues).toEqual([]);
    const residual = result.view?.notices.find((notice) => notice.message.includes("leaves its sewn endpoints"));
    expect(residual?.sourceId).toContain("stitch:");
  });
});
