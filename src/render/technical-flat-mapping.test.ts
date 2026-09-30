import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting/recipe";
import type { Block } from "../drafting/block";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import {
  G04_TECHNICAL_FLAT_MAPPINGS,
  type TechnicalFlatRecipeMapping,
  mapTechnicalFlatSources,
  validateFlatRoleMapping,
} from "./technical-flat-mapping";

const draft = (name: string) => {
  const recipe = GARMENTS.find((candidate) => candidate.name === name)!;
  const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
  return { recipe, block };
};

describe("mapTechnicalFlatSources", () => {
  it("maps every supported recipe's drafted roles, construction sources and POMs", () => {
    for (const recipe of GARMENTS) {
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      const mapping = mapTechnicalFlatSources(recipe.name, block, recipe.poms);
      expect(mapping.issues, recipe.name).toEqual([]);
      expect(mapping.faces.map((face) => face.kind)).toEqual(["FRONT_FLAT", "BACK_FLAT"]);
      const mappedRoles = new Set(mapping.faces.flatMap((face) => face.roles.map((role) => role.roleId)));
      expect([...Object.keys(block.roles)].every((role) => mappedRoles.has(role)), recipe.name).toBe(true);
      expect(mapping.sources.some((source) => source.kind === "stitch"), recipe.name).toBe(true);
      expect(mapping.sources.filter((source) => source.kind === "stitch").every((source) =>
        source.layer === "SEAM" && source.treatment === "VISIBILITY_UNRESOLVED"), recipe.name).toBe(true);
      expect(mapping.sources.some((source) => source.kind === "pom"), recipe.name).toBe(true);
      expect(mapping.notices.some((notice) => notice.feature === "topstitch"), recipe.name).toBe(true);
      expect(mapping.notices.some((notice) => notice.feature === "pleat"), recipe.name).toBe(true);
      for (const pom of mapping.sources.filter((source) => source.kind === "pom" && source.treatment === "ANCHORED")) {
        expect(pom.targetGeometryId).toMatch(/^flat:.*:component:.*:outline$/);
        expect(pom.anchorPoint).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
      }
      const backAnchors = mapping.sources.filter((source) => source.kind === "pom"
        && source.treatment === "ANCHORED" && source.viewKinds.includes("BACK_FLAT"));
      expect(backAnchors, recipe.name).toHaveLength(recipe.name === "trouser" ? 1 : 0);
      if (recipe.name === "trouser") {
        expect(backAnchors[0]).toMatchObject({
          sourceId: "pom:trouser:back-rise-finished-incl-waistband",
          viewKinds: ["BACK_FLAT"],
          targetGeometryId: "flat:trouser:BACK_FLAT:component:backLeft:outline",
          anchorPoint: { x: 0, y: expect.any(Number) },
        });
      }
    }
  });

  it("keeps every declared numeric option endpoint inside its recipe's mapped topology", () => {
    for (const recipe of GARMENTS) {
      for (const option of recipe.options ?? []) {
        for (const value of [option.min, option.max]) {
          const options = { ...defaultGarmentOptions(recipe.options ?? []), [option.id]: value };
          const block = recipe.draft(STANDARD_M, options);
          expect(mapTechnicalFlatSources(recipe.name, block).issues, `${recipe.name}.${option.id}=${value}`).toEqual([]);
        }
      }
    }
  });

  it("exposes recipe-specific darts, pockets, closures and modeled absences", () => {
    const tee = mapTechnicalFlatSources("tee", draft("tee").block);
    const fitted = mapTechnicalFlatSources("fitted", draft("fitted").block);
    const woven = mapTechnicalFlatSources("woven-shirt", draft("woven-shirt").block);
    const trouser = mapTechnicalFlatSources("trouser", draft("trouser").block);
    expect(tee.notices.map((notice) => notice.feature)).toEqual(["topstitch", "pleat", "dart", "pocket", "closure"]);
    expect(fitted.sources.some((source) => source.kind === "dart" && source.viewKinds.includes("FRONT_FLAT"))).toBe(true);
    expect(fitted.notices.some((notice) => notice.feature === "dart")).toBe(false);
    expect(woven.sources.some((source) => source.feature === "pocket" && source.sourceId.includes(":mark:pocket:"))).toBe(true);
    expect(woven.sources.some((source) => source.feature === "closure")).toBe(true);
    expect(trouser.sources.some((source) => source.feature === "pocket" && source.sourceId.includes("pocketOpening"))).toBe(true);
    expect(trouser.sources.some((source) => source.feature === "closure")).toBe(true);
  });

  it("rejects an unadmitted recipe instead of inferring a similar map", () => {
    const result = mapTechnicalFlatSources("dress", draft("tee").block);
    expect(result.issues).toEqual([expect.objectContaining({ code: "UNSUPPORTED_RECIPE" })]);
    expect(result.sources).toEqual([]);
  });

  it("reports missing and newly added roles against the exact mapped topology", () => {
    const { block } = draft("tee");
    const missingFront = { ...block, roles: { back: block.roles.back, sleeve: block.roles.sleeve } };
    const addedCollar = { ...block, roles: { ...block.roles, collar: block.roles.front } };
    expect(mapTechnicalFlatSources("tee", missingFront).issues.map((issue) => issue.code)).toContain("MISSING_MAPPED_ROLE");
    expect(mapTechnicalFlatSources("tee", addedCollar).issues).toContainEqual(expect.objectContaining({
      code: "UNMAPPED_BLOCK_ROLE", sourceId: "collar",
    }));
  });

  it("rejects a role repeated within one face mapping", () => {
    const { block } = draft("tee");
    const base = G04_TECHNICAL_FLAT_MAPPINGS.tee;
    const duplicate = {
      ...base,
      faces: [
        { ...base.faces[0], roles: [...base.faces[0].roles, base.faces[0].roles[0]] },
        base.faces[1],
      ],
    } as const;
    expect(validateFlatRoleMapping(duplicate, block)).toContainEqual(expect.objectContaining({
      code: "DUPLICATE_FACE_ROLE", sourceId: "FRONT_FLAT:front",
    }));
  });

  it("validates stitch role, edge and mark references", () => {
    const { block } = draft("tee");
    const malformed = {
      ...block,
      stitches: [{
        label: "bad stitch",
        a: { edges: [
          { piece: "missing", edge: "shoulder" },
          { piece: "front", edge: "missingEdge" },
          { piece: "front", mark: "missingMark", side: "left" },
        ] },
        b: { edges: [] },
      }],
    };
    expect(mapTechnicalFlatSources("tee", malformed as unknown as Block).issues.map((issue) => issue.code)).toEqual([
      "MISSING_STITCH_ROLE", "MISSING_STITCH_EDGE", "MISSING_STITCH_MARK",
    ]);
  });

  it("keeps an unanchored POM table-only and reports invalid or missing anchor geometry", () => {
    const { recipe, block } = draft("tee");
    const tableOnly = { label: "Unanchored", measure: () => 1 };
    const invalidAnchor = { label: "Bad anchor", measure: () => 1, anchor: () => ({ x: Number.NaN, y: 0 }) };
    const missingRole = { ...block, roles: { back: block.roles.back, sleeve: block.roles.sleeve } };
    const tableResult = mapTechnicalFlatSources(recipe.name, block, [tableOnly]);
    expect(tableResult.sources.find((source) => source.kind === "pom")).toMatchObject({ kind: "pom", treatment: "TABLE_ONLY" });
    expect(tableResult.notices).toContainEqual(expect.objectContaining({ reason: "SOURCE_REFERENCE_MISSING" }));
    expect(mapTechnicalFlatSources(recipe.name, block, [invalidAnchor]).issues).toContainEqual(expect.objectContaining({
      code: "INVALID_POM_ANCHOR",
    }));
    expect(mapTechnicalFlatSources(recipe.name, missingRole, [invalidAnchor]).issues).toContainEqual(expect.objectContaining({
      code: "MISSING_POM_ANCHOR_ROLE",
    }));
  });

  it("requires an admitted back role when a source method declares a back anchor", () => {
    const { recipe, block } = draft("trouser");
    const mappings = G04_TECHNICAL_FLAT_MAPPINGS as unknown as Record<string, TechnicalFlatRecipeMapping>;
    const saved = mappings.trouser;
    try {
      mappings.trouser = { ...saved, backPomAnchorRole: undefined };
      const result = mapTechnicalFlatSources(recipe.name, block, recipe.poms);
      expect(result.issues).toContainEqual(expect.objectContaining({
        code: "MISSING_POM_ANCHOR_ROLE",
        sourceId: "pom:trouser:back-rise-finished-incl-waistband",
      }));

      mappings.trouser = { ...saved, backPomAnchorRole: "missingBack" };
      const missingBack = mapTechnicalFlatSources(recipe.name, block, recipe.poms);
      expect(missingBack.issues).toContainEqual(expect.objectContaining({
        code: "MISSING_POM_ANCHOR_ROLE",
        sourceId: "pom:trouser:back-rise-finished-incl-waistband",
      }));

      mappings.trouser = saved;
      const invalidX = mapTechnicalFlatSources(recipe.name, block, [{
        label: "Invalid back X", measure: () => 1, backAnchor: () => ({ x: Number.NaN, y: 0 }),
      }]);
      expect(invalidX.issues).toContainEqual(expect.objectContaining({ code: "INVALID_POM_ANCHOR" }));
      const invalidY = mapTechnicalFlatSources(recipe.name, block, [{
        label: "Invalid back Y", measure: () => 1, backAnchor: () => ({ x: 0, y: Number.POSITIVE_INFINITY }),
      }]);
      expect(invalidY.issues).toContainEqual(expect.objectContaining({ code: "INVALID_POM_ANCHOR" }));
    } finally {
      mappings.trouser = saved;
    }
  });

  it("uses deterministic positional fallback IDs only when a source label is blank", () => {
    const { recipe, block } = draft("tee");
    const blankStitch = { ...block.stitches[0], label: "" };
    const stitchBlock = { ...block, stitches: [blankStitch] };
    const result = mapTechnicalFlatSources(recipe.name, stitchBlock, [
      { label: "", measure: () => 1 },
      { label: "", measure: () => 1, anchor: () => ({ x: 1, y: 2 }) },
    ]);
    expect(result.sources.some((source) => source.id === "flat:tee:stitch:0")).toBe(true);
    expect(result.sources.some((source) => source.id === "flat:tee:pom:0")).toBe(true);
    expect(result.sources.some((source) => source.id === "flat:tee:FRONT_FLAT:component:front:outline:callout:1")).toBe(true);
    const trouser = draft("trouser");
    const blankBackAnchor = mapTechnicalFlatSources("trouser", trouser.block, [
      { label: " ", measure: () => 1, backAnchor: () => ({ x: 0, y: 0 }) },
    ]);
    expect(blankBackAnchor.sources.some((source) =>
      source.id === "flat:trouser:BACK_FLAT:component:backLeft:outline:callout:0")).toBe(true);
  });

  it("maps artwork overlays to each exposed face and rejects unmapped or hidden targets", () => {
    const { block } = draft("tee");
    const artwork = (pieceRole: string, id = "placement") => ({
      id, kind: "print" as const, pieceRole, widthCm: 4, heightCm: 3,
      transform: { dx: 0, dy: 0, scale: 1, rotationDeg: 0 }, zOrder: 1, sourceName: "Print",
    });
    const sleeveMap = mapTechnicalFlatSources("tee", block, [], [artwork("sleeve")]);
    expect(sleeveMap.sources[sleeveMap.sources.length - 1]).toMatchObject({
      kind: "artwork", treatment: "VISIBLE_OVERLAY", viewKinds: ["FRONT_FLAT", "BACK_FLAT"],
    });
    expect(mapTechnicalFlatSources("tee", block, [], [artwork("unknown")]).issues).toContainEqual(expect.objectContaining({
      code: "UNMAPPED_ARTWORK_ROLE",
    }));
    const trouser = draft("trouser").block;
    const hiddenArtworkSources = mapTechnicalFlatSources("trouser", trouser, [], [artwork("pocketBagLeft")]).sources;
    expect(hiddenArtworkSources[hiddenArtworkSources.length - 1]).toMatchObject({
      kind: "artwork", treatment: "INTERIOR_HIDDEN",
    });
  });
});
