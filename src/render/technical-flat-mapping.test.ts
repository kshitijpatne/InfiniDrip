import { describe, expect, it } from "vitest";
import { CREWNECK, GARMENTS } from "../drafting/recipe";
import type { Block } from "../drafting/block";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import { draftJogger } from "../drafting/jogger";
import {
  G04_TECHNICAL_FLAT_MAPPINGS,
  type TechnicalFlatRecipeMapping,
  mapTechnicalFlatSources,
  validateFlatRoleMapping,
} from "./technical-flat-mapping";

const G04_RECIPES = GARMENTS.filter((recipe) => G04_TECHNICAL_FLAT_MAPPINGS[recipe.name] !== undefined);

const draft = (name: string) => {
  const recipe = GARMENTS.find((candidate) => candidate.name === name)!;
  const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
  return { recipe, block };
};

describe("mapTechnicalFlatSources", () => {
  it("maps all seven hidden Jogger roles to source-aware front and back faces", () => {
    const block = draftJogger(STANDARD_M);
    const mapping = mapTechnicalFlatSources("jogger", block);
    expect(mapping.issues).toEqual([]);
    expect(mapping.faces.map((candidate) => candidate.kind)).toEqual(["FRONT_FLAT", "BACK_FLAT"]);
    expect(mapping.faces[0]?.roles.map((role) => role.roleId)).toEqual([
      "frontLeft", "frontRight", "waistband", "pocketBagLeft", "pocketBagRight",
    ]);
    expect(mapping.faces[1]?.roles.map((role) => role.roleId)).toEqual([
      "backLeft", "backRight", "waistband",
    ]);
    expect(mapping.faces[0]?.roles.find((role) => role.roleId === "pocketBagLeft"))
      .toEqual({ roleId: "pocketBagLeft", treatment: "INTERIOR_HIDDEN", behindRoleId: "frontLeft" });
    expect(mapping.sources.filter((source) => source.kind === "component").map((source) => source.sourceId))
      .toEqual(expect.arrayContaining(Object.keys(block.roles).map((roleId) => `pattern:jogger:role:${roleId}`)));
    expect(mapping.sources.filter((source) => source.kind === "stitch").every((source) =>
      source.layer === "SEAM" && source.treatment === "VISIBILITY_UNRESOLVED")).toBe(true);
  });

  it("maps all crewneck roles while keeping bands explicitly detached from assembly", () => {
    const block = CREWNECK.draft(STANDARD_M, defaultGarmentOptions(CREWNECK.options ?? []));
    const mapping = mapTechnicalFlatSources(CREWNECK.name, block, CREWNECK.poms);
    expect(mapping.issues).toEqual([]);
    expect(mapping.faces[0]?.roles.map((role) => [role.roleId, role.treatment])).toEqual([
      ["front", "SHELL"], ["sleeveLeft", "SHELL"], ["neckband", "DETACHED_DETAIL"],
      ["cuffLeft", "DETACHED_DETAIL"], ["cuffRight", "DETACHED_DETAIL"], ["hemBand", "DETACHED_DETAIL"],
    ]);
    expect(mapping.faces[1]?.roles.map((role) => [role.roleId, role.treatment])).toEqual([
      ["back", "SHELL"], ["sleeveRight", "SHELL"], ["neckband", "DETACHED_DETAIL"],
      ["cuffLeft", "DETACHED_DETAIL"], ["cuffRight", "DETACHED_DETAIL"], ["hemBand", "DETACHED_DETAIL"],
    ]);
    expect(mapping.sources.filter((source) => source.kind === "component")).toHaveLength(12);
    expect(new Set(mapping.sources.filter((source) => source.kind === "component").map((source) => source.sourceId)))
      .toEqual(new Set(Object.keys(block.roles).map((roleId) => `pattern:crewneck:role:${roleId}`)));
  });

  it("maps every supported recipe's drafted roles, construction sources and POMs", () => {
    for (const recipe of G04_RECIPES) {
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
        expect(pom.targetGeometryId).toMatch(/^flat:.*:(component:.*:outline|mark:.*)$/);
        expect(pom.anchorPoint).toMatchObject({ x: expect.any(Number), y: expect.any(Number) });
      }
      const backAnchors = mapping.sources.filter((source) => source.kind === "pom"
        && source.treatment === "ANCHORED" && source.viewKinds.includes("BACK_FLAT"));
      expect(backAnchors, recipe.name).toHaveLength(recipe.name === "trouser" || recipe.name === "skirt" || recipe.name === "shorts" ? 2
        : recipe.name === "tank" || recipe.name === "tee" ? 4 : recipe.name === "polo" ? 11 : recipe.name === "woven-shirt" ? 1 : 0);
      if (recipe.name === "tank" || recipe.name === "tee") {
        expect(G04_TECHNICAL_FLAT_MAPPINGS[recipe.name].pomAnchorRole).toBe("front");
        const backRole = "back";
        const mappedTankAnchors = [
          ["body-chest-finished", "side", "start"],
          ["body-length-hps-hem", "hem", "start"],
          ["across-shoulder", "shoulder", "end"],
          ["neck-width", "shoulder", "start"],
        ] as const;
        for (const [label, edge, end] of mappedTankAnchors) {
          expect(backAnchors.find((source) => source.sourceId === `pom:${recipe.name}:${label}`)).toMatchObject({
            viewKinds: ["BACK_FLAT"], treatment: "ANCHORED",
            targetGeometryId: `flat:${recipe.name}:BACK_FLAT:component:${G04_TECHNICAL_FLAT_MAPPINGS[recipe.name].backPomAnchorRole}:outline`,
          });
          const method = recipe.poms.find((pom) => pom.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") === label)!;
          const point = method.backAnchor!(block);
          const piece = block.roles[backRole]!;
          const target = piece.edges.find((candidate) => candidate.name === edge)!;
          expect(backAnchors.find((source) => source.sourceId === `pom:${recipe.name}:${label}`)?.anchorPoint)
            .toEqual(end === "start" ? (target.kind === "line" ? target.start : target.curve.start)
              : (target.kind === "line" ? target.end : target.curve.end));
          expect(point).toEqual(backAnchors.find((source) => source.sourceId === `pom:${recipe.name}:${label}`)?.anchorPoint);
        }
        expect(backAnchors.some((source) => source.sourceId === `pom:${recipe.name}:front-neck-drop`)).toBe(false);
        expect(recipe.poms.find((pom) => pom.label === "Body chest (finished)")?.anchor!(block))
          .toEqual(recipe.poms.find((pom) => pom.label === "Body chest (finished)")?.backAnchor!(block));
      }
      if (recipe.name === "skirt") {
        expect(mapping.notices).toContainEqual(expect.objectContaining({
          sourceId: "pom:skirt:length-waist-hem", reason: "SOURCE_REFERENCE_MISSING",
        }));
        expect(backAnchors.find((source) => source.sourceId === "pom:skirt:waist-finished")).toMatchObject({
          viewKinds: ["BACK_FLAT"],
          targetGeometryId: "flat:skirt:BACK_FLAT:component:back:outline",
          anchorPoint: { x: expect.any(Number), y: 0 },
        });
        expect(backAnchors.find((source) => source.sourceId === "pom:skirt:hip-finished")).toMatchObject({
          viewKinds: ["BACK_FLAT"],
          targetGeometryId: "flat:skirt:BACK_FLAT:component:back:outline",
          anchorPoint: { x: expect.any(Number), y: STANDARD_M.hipDepth },
        });
      }
      if (recipe.name === "polo") {
        expect(mapping.sources.find((source) => source.sourceId === "pom:polo:finished-placket-length")).toMatchObject({
          targetGeometryId: "flat:polo:FRONT_FLAT:component:buttonPlacket:outline",
          relatedIds: ["edge:buttonPlacket:attachmentRaw"], treatment: "ANCHORED",
        });
        expect(mapping.sources.find((source) => source.sourceId === "pom:polo:finished-placket-width")).toMatchObject({
          targetGeometryId: "flat:polo:FRONT_FLAT:mark:buttonPlacket:attachmentLine",
          relatedIds: ["mark:buttonPlacket:attachmentLine"], treatment: "ANCHORED",
        });
        expect(mapping.sources.find((source) => source.sourceId === "pom:polo:body-chest-finished")).toMatchObject({
          targetGeometryId: "flat:polo:FRONT_FLAT:component:front:outline",
          relatedIds: ["edge:front:side"], treatment: "ANCHORED",
        });
        expect(mapping.sources.find((source) => source.sourceId === "pom:polo:back-body-length-hps-hem"
          && source.viewKinds.includes("BACK_FLAT"))).toMatchObject({
          targetGeometryId: "flat:polo:BACK_FLAT:component:back:outline",
          relatedIds: ["edge:back:hem"], treatment: "ANCHORED",
        });
        expect(mapping.sources.find((source) => source.sourceId === "pom:polo:finished-pointed-collar-leaf"))
          .toMatchObject({ treatment: "ANCHORED", viewKinds: ["FRONT_FLAT"],
            targetGeometryId: "flat:polo:FRONT_FLAT:component:upperCollar:outline",
            relatedIds: ["edge:upperCollar:centerBack"] });
      }
      if (recipe.name === "trouser") {
        expect(G04_TECHNICAL_FLAT_MAPPINGS.trouser.faces[0].roles).toContainEqual({
          roleId: "flyUnderlap", treatment: "INTERIOR_HIDDEN", behindRoleId: "frontLeft",
        });
        expect(G04_TECHNICAL_FLAT_MAPPINGS.trouser.faces[1].roles.some((role) =>
          role.roleId === "flyUnderlap" && role.treatment === "INTERIOR_HIDDEN")).toBe(true);
        expect(backAnchors.find((source) => source.sourceId.endsWith("back-rise-finished-incl-waistband"))).toMatchObject({
          sourceId: "pom:trouser:back-rise-finished-incl-waistband",
          viewKinds: ["BACK_FLAT"],
          targetGeometryId: "flat:trouser:BACK_FLAT:component:backLeft:outline",
          anchorPoint: { x: 0, y: expect.any(Number) },
        });
        expect(backAnchors.find((source) => source.sourceId.endsWith("waistband-depth-finished"))).toMatchObject({
          sourceId: "pom:trouser:waistband-depth-finished",
          viewKinds: ["BACK_FLAT"],
          targetGeometryId: "flat:trouser:BACK_FLAT:mark:waistband:centerBack",
          anchorPoint: { x: 0, y: expect.any(Number) },
        });
      }
      if (recipe.name === "shorts") {
        expect(G04_TECHNICAL_FLAT_MAPPINGS.shorts.faces[0].roles).toContainEqual({
          roleId: "flyUnderlap", treatment: "INTERIOR_HIDDEN", behindRoleId: "frontLeft",
        });
        expect(G04_TECHNICAL_FLAT_MAPPINGS.shorts.faces[0].roles.map((role) => role.roleId)).toEqual([
          "frontLeft", "frontRight", "waistband", "flyUnderlap", "flyShield", "pocketBagLeft", "pocketBagRight",
        ]);
        expect(G04_TECHNICAL_FLAT_MAPPINGS.shorts.faces[1].roles.map((role) => role.roleId)).toEqual([
          "backLeft", "backRight", "waistband",
        ]);
        expect(backAnchors.map((source) => source.sourceId).sort()).toEqual([
          "pom:shorts:back-rise-finished-incl-waistband", "pom:shorts:waistband-depth-finished",
        ]);
        expect(mapping.sources.find((source) => source.sourceId === "pom:shorts:left-pocket-opening-finished"))
          .toMatchObject({ targetGeometryId: "flat:shorts:FRONT_FLAT:mark:frontLeft:pocketOpening",
            relatedIds: ["mark:frontLeft:pocketOpening"], treatment: "ANCHORED" });
        for (const sourceId of ["pom:shorts:pocket-bag-depth-finished", "pom:shorts:pocket-bag-width-finished"]) {
          expect(mapping.notices).toContainEqual(expect.objectContaining({
            sourceId, reason: "SOURCE_REFERENCE_MISSING",
            message: expect.stringContaining("table-only on the front view"),
          }));
        }
      }
    }
  });

  it("keeps absent Polo vent anchors table-only when the option removes the vent geometry", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const options = { ...defaultGarmentOptions(recipe.options ?? []), sideVentDepth: 0 };
    const block = recipe.draft(STANDARD_M, options);
    const mapped = mapTechnicalFlatSources(recipe.name, block, recipe.poms);
    expect(mapped.issues).toEqual([]);
    expect(mapped.sources.find((source) => source.sourceId === "pom:polo:front-side-vent-depth"))
      .toMatchObject({ treatment: "TABLE_ONLY", viewKinds: ["FRONT_FLAT"] });
    expect(mapped.notices).toContainEqual(expect.objectContaining({
      sourceId: "pom:polo:front-side-vent-depth", reason: "SOURCE_NOT_REPRESENTED",
    }));
    expect(mapped.sources.find((source) => source.sourceId === "pom:polo:back-side-vent-depth"
      && source.viewKinds.includes("BACK_FLAT")))
      .toMatchObject({ treatment: "TABLE_ONLY", viewKinds: ["BACK_FLAT"] });
    expect(mapped.notices).toContainEqual(expect.objectContaining({
      sourceId: "pom:polo:back-side-vent-depth", reason: "SOURCE_NOT_REPRESENTED",
    }));
    const noBackVentWithBlankLabel = mapTechnicalFlatSources(recipe.name, block, [{ label: "", measure: () => 0,
      backAnchor: () => ({ x: 0, y: 0 }), backAnchorRoleId: "back", backAnchorEdgeId: "missing",
      backAnchorAvailable: () => false }]);
    expect(noBackVentWithBlankLabel.sources).toContainEqual(expect.objectContaining({
      sourceId: "pom:polo:0", treatment: "TABLE_ONLY", viewKinds: ["BACK_FLAT"],
    }));
  });

  it("maps an explicitly selected endpoint of a source line mark", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const mapped = mapTechnicalFlatSources(recipe.name, block, [{ label: "Attachment end", measure: () => 1,
      frontMarkAnchor: { roleId: "buttonPlacket", markName: "attachmentLine", point: "end" } }]);
    expect(mapped.issues).toEqual([]);
    expect(mapped.sources.find((source) => source.sourceId === "pom:polo:attachment-end")).toMatchObject({
      treatment: "ANCHORED", relatedIds: ["mark:buttonPlacket:attachmentLine"],
      targetGeometryId: "flat:polo:FRONT_FLAT:mark:buttonPlacket:attachmentLine",
    });
    const attachment = block.roles.buttonPlacket.marks?.find((mark) => mark.name === "attachmentLine");
    if (!attachment || !("end" in attachment)) throw new Error("Expected the authored attachment line mark.");
    expect(mapped.sources.find((source) => source.sourceId === "pom:polo:attachment-end")?.anchorPoint).toEqual(attachment.end);
    const blankLabel = mapTechnicalFlatSources(recipe.name, block, [{ label: "", measure: () => 1,
      frontMarkAnchor: { roleId: "buttonPlacket", markName: "attachmentLine", point: "end" } }]);
    expect(blankLabel.sources.find((source) => source.sourceId === "pom:polo:0")).toMatchObject({
      treatment: "ANCHORED", relatedIds: ["mark:buttonPlacket:attachmentLine"],
    });
    const lineStart = mapTechnicalFlatSources(recipe.name, block, [{ label: "Attachment start", measure: () => 1,
      frontMarkAnchor: { roleId: "buttonPlacket", markName: "attachmentLine", point: "start" } }]);
    expect(lineStart.issues).toEqual([]);
    expect(lineStart.sources.find((source) => source.sourceId === "pom:polo:attachment-start"))
      .toMatchObject({ treatment: "ANCHORED", relatedIds: ["mark:buttonPlacket:attachmentLine"] });
    const buttonPoint = mapTechnicalFlatSources(recipe.name, block, [{ label: "Button mark", measure: () => 1,
      frontMarkAnchor: { roleId: "buttonPlacket", markName: "button-1", point: "at" } }]);
    expect(buttonPoint.issues).toEqual([]);
    const buttonMark = block.roles.buttonPlacket.marks?.find((mark) => mark.name === "button-1");
    if (!buttonMark || !("at" in buttonMark)) throw new Error("Expected the authored button point mark.");
    expect(buttonPoint.sources.find((source) => source.sourceId === "pom:polo:button-mark")?.anchorPoint)
      .toEqual(buttonMark.at);
    const unavailableFront = mapTechnicalFlatSources(recipe.name, block, [{ label: "", measure: () => 1,
      anchor: () => ({ x: 0, y: 0 }), anchorRoleId: "front", anchorAvailable: () => false }]);
    expect(unavailableFront.sources).toContainEqual(expect.objectContaining({
      sourceId: "pom:polo:0", treatment: "TABLE_ONLY", viewKinds: ["FRONT_FLAT"],
    }));
  });

  it("keeps every declared numeric option endpoint inside its recipe's mapped topology", () => {
    for (const recipe of G04_RECIPES) {
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
    const jeans = GARMENTS.find((recipe) => recipe.name === "jeans")!;
    const jeansResult = mapTechnicalFlatSources("jeans", jeans.draft(STANDARD_M, defaultGarmentOptions(jeans.options ?? [])));
    expect(jeansResult.issues).toEqual([expect.objectContaining({ code: "UNSUPPORTED_RECIPE" })]);
    expect(jeansResult.sources).toEqual([]);
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

  it("requires layer-order targets to be earlier visible roles on the same face", () => {
    const { block } = draft("trouser");
    const base = G04_TECHNICAL_FLAT_MAPPINGS.trouser;
    expect(validateFlatRoleMapping(base, block)).toEqual([]);
    const malformed: TechnicalFlatRecipeMapping = {
      ...base,
      faces: [
        { ...base.faces[0], roles: base.faces[0].roles.map((role) => role.roleId === "flyUnderlap"
          ? { ...role, behindRoleId: "flyShield" } : role) },
        base.faces[1],
      ],
    };
    expect(validateFlatRoleMapping(malformed, block)).toContainEqual(expect.objectContaining({
      code: "INVALID_LAYER_ORDER_REFERENCE", sourceId: "FRONT_FLAT:flyUnderlap",
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
    const polo = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const poloBlock = polo.draft(STANDARD_M, defaultGarmentOptions(polo.options ?? []));
    expect(mapTechnicalFlatSources("polo", poloBlock, [{ label: "Invalid front edge", measure: () => 1,
      anchor: () => ({ x: 0, y: 0 }), anchorRoleId: "front", anchorEdgeId: "missing" }]).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_POM_ANCHOR" }));
    expect(mapTechnicalFlatSources("polo", poloBlock, [{ label: "Invalid front mark", measure: () => 1,
      frontMarkAnchor: { roleId: "buttonPlacket", markName: "missing", point: "at" } }]).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_POM_ANCHOR" }));
    expect(mapTechnicalFlatSources("polo", poloBlock, [{ label: "Invalid point-mark endpoint", measure: () => 1,
      frontMarkAnchor: { roleId: "buttonPlacket", markName: "button-1", point: "start" } }]).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_POM_ANCHOR" }));
    expect(mapTechnicalFlatSources("polo", poloBlock, [{ label: "Invalid back line mark", measure: () => 1,
      backMarkAnchor: { roleId: "buttonPlacket", markName: "attachmentLine" } }]).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_POM_ANCHOR" }));
    expect(mapTechnicalFlatSources("polo", poloBlock, [{ label: "Invalid back edge", measure: () => 1,
      backAnchor: () => ({ x: 0, y: 0 }), backAnchorRoleId: "back", backAnchorEdgeId: "missing" }]).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_POM_ANCHOR" }));
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
      const invalidMark = mapTechnicalFlatSources(recipe.name, block, [{
        label: "Invalid back mark", measure: () => 1,
        backMarkAnchor: { roleId: "waistband", markName: "missing" },
      }]);
      expect(invalidMark.issues).toContainEqual(expect.objectContaining({ code: "INVALID_POM_ANCHOR" }));
      const blankMarkLabel = mapTechnicalFlatSources(recipe.name, block, [{
        label: " ", measure: () => 1, backMarkAnchor: { roleId: "waistband", markName: "centerBack" },
      }]);
      expect(blankMarkLabel.sources.some((source) => source.id
        === "flat:trouser:BACK_FLAT:mark:waistband:centerBack:callout:0")).toBe(true);
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
