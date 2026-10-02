import { describe, expect, it } from "vitest";
import type { Block } from "../drafting/block";
import type { Pom } from "../drafting/pom";
import { GARMENTS } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import { edgeStart } from "../drafting/piece";
import type { TechnicalFlatPrimitive } from "./technical-flat";
import { compileTechnicalFlatSourceGeometry } from "./technical-flat-geometry";
import { compileTrouserWaistbandFragments } from "./technical-flat-fragment-compiler";
import { assembleTechnicalFlatRoles } from "./technical-flat-assembly";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { compileTechnicalFlatPomCallouts, technicalFlatLeaderCrossesBox, technicalFlatLeaderSegmentsCross } from "./technical-flat-poms";

const revisionId = "revision-g04-pom";

function faceGeometry(recipeId: string, block: Block, kind: "FRONT_FLAT" | "BACK_FLAT", revision = revisionId): TechnicalFlatPrimitive[] {
  return [...compileTechnicalFlatSourceGeometry(recipeId, block, revision, kind).primitives];
}

function trouserBackGeometry(block: Block) {
  const assembly = assembleTechnicalFlatRoles("trouser", block, "BACK_FLAT");
  const fragments = compileTrouserWaistbandFragments(block, revisionId, "BACK_FLAT", assembly.sourceFragments, assembly.transforms);
  return {
    geometry: [...faceGeometry("trouser", block, "BACK_FLAT"), ...fragments.primitives],
    resolve: (pom: Pom, point: { x: number; y: number }) => {
      if (!pom.backMarkAnchor) return { targetGeometryId: "flat:trouser:BACK_FLAT:component:backLeft:outline", point };
      const markAnchor = pom.backMarkAnchor;
      const mark = fragments.primitives.find((primitive) => primitive.kind === "mark"
        && primitive.source.sourceId === `pattern:trouser:mark:${markAnchor.roleId}:${markAnchor.markName}`);
      return mark?.kind === "mark" ? { targetGeometryId: mark.id, point: mark.at } : undefined;
    },
  };
}

describe("technical-flat POM callouts", () => {
  it("detects proper, endpoint, and disjoint leader segment intersections", () => {
    expect(technicalFlatLeaderSegmentsCross({ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }, { x: 4, y: 0 })).toBe(true);
    expect(technicalFlatLeaderSegmentsCross({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 2, y: 0 }, { x: 6, y: 0 })).toBe(true);
    expect(technicalFlatLeaderSegmentsCross({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 6, y: 0 }, { x: 8, y: 0 })).toBe(false);
    expect(technicalFlatLeaderCrossesBox({ x: 5, y: 5 }, { x: 8, y: 8 },
      { minX: 4, minY: 4, maxX: 6, maxY: 6 })).toBe(true);
    expect(technicalFlatLeaderCrossesBox({ x: 0, y: 0 }, { x: 2, y: 0 },
      { minX: 4, minY: 4, maxX: 6, maxY: 6 })).toBe(false);
  });

  it("binds every anchored POM to an exact same-revision front outline vertex across seven recipes", () => {
    for (const recipe of GARMENTS) {
      const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipe.name];
      if (!mapping) throw new Error(`Missing G04 map for ${recipe.name}`);
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      const geometry = faceGeometry(recipe.name, block, "FRONT_FLAT");
      const front = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId,
        "FRONT_FLAT", recipe.poms ?? [], geometry);
      const declaredAnchored = (recipe.poms ?? []).filter((pom) => pom.anchor || pom.frontMarkAnchor).length;
      // This direct compiler exercise uses unassembled draft coordinates. Polo's
      // fold-axis point only gets its actual label position in the live resolver.
      if (recipe.name === "polo") {
        expect(front.issues).toEqual([expect.objectContaining({ code: "LABEL_COLLISION",
          sourceId: "pom:polo:finished-pointed-collar-leaf" })]);
      } else expect(front.issues, recipe.name).toEqual([]);
      if (recipe.name === "polo") expect(front.callouts).toBeNull();
      else expect(front.callouts, recipe.name).toHaveLength(declaredAnchored);
      expect((front.callouts ?? []).every((callout) => callout.source.revisionId === revisionId
        && (recipe.name !== "polo" || typeof callout.anchor.sourceEntityId === "string"))).toBe(true);
      expect((front.callouts ?? []).every((callout) => callout.anchor.point.x !== callout.labelAt.x
        || callout.anchor.point.y !== callout.labelAt.y)).toBe(true);
      expect((front.callouts ?? []).every((callout) => /: \d+\.\d cm/.test(callout.text))).toBe(true);
      if (recipe.name === "trouser") {
        expect(front.notices).toContainEqual(expect.objectContaining({
          sourceId: "pom:trouser:back-rise-finished-incl-waistband",
          message: expect.stringContaining("back-face anchor and remains table-only on the front view"),
        }));
      }

      const backMap = recipe.name === "trouser" ? trouserBackGeometry(block) : undefined;
      const back = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId,
        "BACK_FLAT", recipe.poms ?? [], backMap?.geometry ?? faceGeometry(recipe.name, block, "BACK_FLAT"), backMap?.resolve);
      expect(back.issues, `${recipe.name} back`).toEqual([]);
      const declaredBackAnchored = (recipe.poms ?? []).filter((pom) => pom.backAnchor || pom.backMarkAnchor).length;
      expect(back.callouts, `${recipe.name} back`).toHaveLength(declaredBackAnchored);
      if (declaredBackAnchored > 0) {
        expect(back.callouts?.every((callout) => callout.source.revisionId === revisionId)).toBe(true);
        if (recipe.name === "trouser") {
          expect(back.callouts?.find((callout) => callout.source.sourceId === "pom:trouser:back-rise-finished-incl-waistband")
            ?.anchor.primitiveId).toBe(`flat:${recipe.name}:BACK_FLAT:component:${mapping.backPomAnchorRole}:outline`);
          expect(back.callouts?.find((callout) => callout.source.sourceId === "pom:trouser:waistband-depth-finished")
            ?.anchor.primitiveId).toBe("live-flat:trouser:BACK_FLAT:waistband:mark:centerBack");
          expect(back.notices.some((notice) => notice.sourceId === "pom:trouser:waistband-depth-finished")).toBe(false);
        } else if (recipe.name === "woven-shirt") {
          expect(back.callouts?.map((callout) => callout.anchor.primitiveId)).toEqual([
            "flat:woven-shirt:BACK_FLAT:component:back:outline",
          ]);
          expect(back.notices.some((notice) => notice.sourceId === "pom:woven-shirt:back-yoke-depth"
            && notice.reason === "SOURCE_NOT_REPRESENTED")).toBe(false);
        } else if (recipe.name !== "polo") {
          expect(back.callouts?.every((callout) => callout.anchor.primitiveId
            === `flat:${recipe.name}:BACK_FLAT:component:${mapping.backPomAnchorRole}:outline`)).toBe(true);
        } else {
          expect(back.callouts?.every((callout) => typeof callout.anchor.sourceEntityId === "string")).toBe(true);
        }
      }
      expect(back.notices.some((notice) => notice.message.includes("front-only source anchor")))
        .toBe((recipe.poms ?? []).some((pom) => pom.anchor && !pom.backAnchor && !pom.backMarkAnchor));
      if (declaredAnchored === 0) {
        expect(compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "BACK_FLAT", [], faceGeometry(recipe.name, block, "BACK_FLAT"))).toMatchObject({
          callouts: [], notices: [], issues: [],
        });
      }
    }
  });

  it("keeps table-only methods and reports front-only anchors on the back view", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const poms: Pom[] = [
      { label: "No anchor", measure: () => 9 },
      { label: "One anchor", measure: () => 10, anchor: () => {
        const edge = block.roles.front.edges[0];
        if (edge.kind === "line") return edge.start;
        return edge.curve.start;
      } },
      { label: "---", measure: () => 11, anchor: () => {
        const edge = block.roles.front.edges[0];
        if (edge.kind === "line") return edge.start;
        return edge.curve.start;
      } },
    ];
    const front = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT", poms,
      faceGeometry(recipe.name, block, "FRONT_FLAT"));
    expect(front.issues).toEqual([]);
    expect(front.callouts).toHaveLength(2);
    expect(front.notices).toContainEqual(expect.objectContaining({ sourceId: "pom:tee:no-anchor", reason: "SOURCE_REFERENCE_MISSING" }));
    const back = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "BACK_FLAT", poms, []);
    expect(back.notices).toHaveLength(2);
    expect(back.notices[0].sourceId).toBe("pom:tee:one-anchor");
  });

  it("keeps a collapsed Woven vent POM table-only when its zero-depth edge is omitted", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt");
    if (!recipe) throw new Error("Woven recipe is missing.");
    const options = { ...defaultGarmentOptions(recipe.options ?? []), sideVentDepth: 0 };
    const block = recipe.draft(STANDARD_M, options);
    const result = compileTechnicalFlatPomCallouts("woven-shirt", block, revisionId, "FRONT_FLAT", recipe.poms ?? [],
      faceGeometry("woven-shirt", block, "FRONT_FLAT"));
    expect(result.issues).toEqual([]);
    expect(result.callouts?.some((callout) => callout.source.sourceId === "pom:woven-shirt:side-vent-depth")).toBe(false);
    expect(result.notices).toContainEqual(expect.objectContaining({
      sourceId: "pom:woven-shirt:side-vent-depth", reason: "SOURCE_NOT_REPRESENTED",
      message: expect.stringContaining("no represented source anchor on this option"),
    }));
  });

  it("keeps an authored but unprojected edge POM table-only on that face", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const edge = block.roles.upperCollar.edges.find((candidate) => candidate.name === "centerBack")!;
    const point = edge.kind === "line" ? edgeStart(edge) : edge.curve.start;
    const poms: Pom[] = [{ label: "Unprojected edge", measure: () => 2, anchor: () => point,
      anchorRoleId: "upperCollar", anchorEdgeId: "centerBack" }];
    const projected = faceGeometry(recipe.name, block, "FRONT_FLAT").map((primitive) => primitive.id
      === "flat:polo:FRONT_FLAT:component:upperCollar:outline" && primitive.kind === "path"
      ? { ...primitive, sourceEdgeIds: (primitive.sourceEdgeIds ?? []).filter((edgeId) => !edgeId.endsWith(":edge:centerBack")) }
      : primitive);
    const result = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT", poms,
      projected);
    expect(result.issues).toEqual([]);
    expect(result.callouts).toEqual([]);
    expect(result.notices).toContainEqual(expect.objectContaining({ sourceId: "pom:polo:unprojected-edge",
      reason: "SOURCE_NOT_REPRESENTED", message: expect.stringContaining("value remains table-only") }));
  });

  it("rejects a custom resolver that changes an exact source edge point or entity", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const edge = block.roles.front.edges[0]!;
    const point = edgeStart(edge);
    const pom: Pom = { label: "Resolver source check", measure: () => 2, anchor: () => point,
      anchorRoleId: "front", anchorEdgeId: edge.name };
    const targetGeometryId = "flat:tee:FRONT_FLAT:component:front:outline";
    const sourceEntityId = `pattern:tee:role:front:edge:${edge.name}`;
    const resolve = (sourcePoint: { x: number; y: number }, entity = sourceEntityId) => ({ targetGeometryId,
      point, sourcePoint, sourceEntityId: entity });
    for (const wrong of [resolve({ x: point.x + 1, y: point.y }), resolve({ x: point.x, y: point.y + 1 }),
      resolve(point, `${sourceEntityId}:wrong`)]) {
      expect(compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT", [pom],
        faceGeometry(recipe.name, block, "FRONT_FLAT"), () => wrong).issues)
        .toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    }
    const resolverWithoutSourcePoint = () => ({ targetGeometryId, point, sourceEntityId });
    const acceptedWithoutSourcePoint = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT", [pom],
      faceGeometry(recipe.name, block, "FRONT_FLAT"), resolverWithoutSourcePoint);
    expect(acceptedWithoutSourcePoint.issues).toEqual([]);
    expect(acceptedWithoutSourcePoint.callouts).toHaveLength(1);
  });

  it("rejects unsupported revisions, target geometry and mapped roles", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const geometry = faceGeometry(recipe.name, block, "FRONT_FLAT");
    const invalidRevision = compileTechnicalFlatPomCallouts(recipe.name, block, " ", "FRONT_FLAT", [], geometry);
    expect(invalidRevision.issues).toContainEqual(expect.objectContaining({ code: "INVALID_REVISION_ID" }));
    const unsupported = compileTechnicalFlatPomCallouts("unsupported", block, revisionId, "FRONT_FLAT", [], []);
    expect(unsupported.issues).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_RECIPE" }));
    const anchoredPom = recipe.poms.find((pom) => pom.anchor)!;
    const noGeometry = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT", [anchoredPom], []);
    expect(noGeometry.issues).toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    const wrongRevisionGeometry = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId,
      "FRONT_FLAT", [anchoredPom], faceGeometry(recipe.name, block, "FRONT_FLAT", "older-revision"));
    expect(wrongRevisionGeometry.issues).toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    const wrongKindGeometry = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT", [anchoredPom], [
      { kind: "text", id: "flat:tee:FRONT_FLAT:component:front:outline", layer: "ANNOTATION", feature: "annotation",
        source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:tee:front", revisionId }, at: { x: 0, y: 0 }, text: "not geometry" },
    ]);
    expect(wrongKindGeometry.issues).toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    const noRoleBlock = { ...block, roles: { sleeve: block.roles.sleeve } };
    const noRole = compileTechnicalFlatPomCallouts(recipe.name, noRoleBlock, revisionId, "FRONT_FLAT", [], []);
    expect(noRole.issues.map((issue) => issue.code)).toEqual([]);
    const noMappedRole = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "BACK_FLAT",
      [{ label: "No mapped role", measure: () => 4, backAnchor: () => ({ x: 0, y: 0 }), backAnchorRoleId: "" }],
      faceGeometry(recipe.name, block, "BACK_FLAT"));
    expect(noMappedRole.issues.map((issue) => issue.code)).toContain("MISSING_ANCHOR_ROLE");
  });

  it("fails closed when a back anchor has no mapped role or exact same-revision outline", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const backOnly: Pom[] = [{ label: "Back only", measure: () => 4, backAnchor: () => ({ x: 0, y: 0 }) }];
    const noBackRole = { ...block, roles: { ...block.roles, back: undefined } } as unknown as typeof block;
    const unmapped = compileTechnicalFlatPomCallouts(recipe.name, noBackRole, revisionId, "BACK_FLAT", backOnly, []);
    expect(unmapped.callouts).toBeNull();
    expect(unmapped.issues.map((issue) => issue.code)).toContain("MISSING_ANCHOR_ROLE");

    const trouser = GARMENTS.find((candidate) => candidate.name === "trouser");
    if (!trouser) throw new Error("Trouser recipe is missing.");
    const trouserBlock = trouser.draft(STANDARD_M, defaultGarmentOptions(trouser.options ?? []));
    const backRise = trouser.poms?.filter((pom) => pom.backAnchor) ?? [];
    const noGeometry = compileTechnicalFlatPomCallouts(trouser.name, trouserBlock, revisionId,
      "BACK_FLAT", backRise, []);
    expect(noGeometry.callouts).toBeNull();
    expect(noGeometry.issues.map((issue) => issue.code)).toContain("MISSING_ANCHOR_GEOMETRY");
    const invalidAnchor: Pom[] = [{ label: "Bad back point", measure: () => 4, backAnchor: () => ({ x: Number.NaN, y: 0 }) }];
    const invalid = compileTechnicalFlatPomCallouts(trouser.name, trouserBlock, revisionId, "BACK_FLAT",
      invalidAnchor, faceGeometry(trouser.name, trouserBlock, "BACK_FLAT"));
    expect(invalid.callouts).toBeNull();
    expect(invalid.issues.map((issue) => issue.code)).toContain("INVALID_POM_ANCHOR");
  });

  it("requires a valid same-revision emitted entity for typed mark callouts", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "trouser")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const sourceMark = block.roles.waistband.marks!.find((mark) => mark.name === "centerBack")!;
    if (!("at" in sourceMark)) throw new Error("Expected the centerBack point mark.");
    const mapped = trouserBackGeometry(block);
    const base: Pom = { label: "Mark measure", measure: () => 4,
      backMarkAnchor: { roleId: "waistband", markName: "centerBack" } };
    const compile = (pom: Pom, resolver = mapped.resolve) => compileTechnicalFlatPomCallouts("trouser", block,
      revisionId, "BACK_FLAT", [pom], mapped.geometry, resolver);

    expect(compile({ ...base, backMarkAnchor: { roleId: "", markName: "centerBack" } }).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_POM_ANCHOR" }));
    expect(compile({ ...base, backMarkAnchor: { roleId: "waistband", markName: "missing" } }).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_POM_ANCHOR" }));
    expect(compile({ ...base, measure: () => { throw "bad mark method"; } }).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_POM_MEASURE" }));
    expect(compile({ ...base, measure: () => { throw new Error("bad mark method"); } }).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_POM_MEASURE", message: expect.stringContaining("bad mark method") }));
    expect(compile({ ...base, measure: () => Number.NaN }).issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_POM_MEASURE" }));
    expect(compile(base, () => undefined).issues)
      .toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    expect(compile(base, () => ({ targetGeometryId: "wrong-mark", point: sourceMark.at })).issues)
      .toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    expect(compile(base, () => ({ ...mapped.resolve(base, sourceMark.at)!, point: { x: sourceMark.at.x + 1, y: sourceMark.at.y } })).issues)
      .toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    const frontEdge = block.roles.frontLeft.edges[0]!;
    const frontVertex = frontEdge.kind === "line" ? frontEdge.start : frontEdge.curve.start;
    const ordinaryPom: Pom = { label: "Ordinary", measure: () => 2, anchor: () => frontVertex };
    const ordinaryGeometry = faceGeometry("trouser", block, "FRONT_FLAT");
    expect(compileTechnicalFlatPomCallouts("trouser", block, revisionId, "FRONT_FLAT", [ordinaryPom], ordinaryGeometry,
      () => ({ targetGeometryId: "missing-outline", point: frontVertex })).issues)
      .toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    expect(compileTechnicalFlatPomCallouts("trouser", block, revisionId, "FRONT_FLAT", [ordinaryPom], ordinaryGeometry,
      () => undefined).issues).toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    const withoutTolerance: Pom = { ...base, tolerance: undefined };
    expect(compile(withoutTolerance).callouts?.[0]?.text).toBe("Mark measure: 4.0 cm");
    const crowded = Array.from({ length: 80 }, (_, index): Pom => ({ ...base, label: `Same mark ${index}` }));
    expect(compileTechnicalFlatPomCallouts("trouser", block, revisionId, "BACK_FLAT", crowded,
      mapped.geometry, mapped.resolve).issues.some((issue) => issue.code === "LABEL_COLLISION")).toBe(true);

    const polo = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const poloBlock = polo.draft(STANDARD_M, defaultGarmentOptions(polo.options ?? []));
    const placketWidth = polo.poms?.find((pom) => pom.label === "Finished placket width")!;
    const attachmentLine = poloBlock.roles.buttonPlacket.marks?.find((mark) => mark.name === "attachmentLine");
    if (!attachmentLine || !("start" in attachmentLine)) throw new Error("Expected the authored attachment line mark.");
    const lineMark = compileTechnicalFlatPomCallouts("polo", poloBlock, revisionId, "FRONT_FLAT", [placketWidth],
      faceGeometry("polo", poloBlock, "FRONT_FLAT"));
    expect(lineMark.issues).toEqual([]);
    expect(lineMark.callouts?.[0]?.anchor.sourceEntityId)
      .toBe("pattern:polo:mark:buttonPlacket:attachmentLine");
    const lineMarkEnd = compileTechnicalFlatPomCallouts("polo", poloBlock, revisionId, "FRONT_FLAT", [{ ...placketWidth,
      frontMarkAnchor: { roleId: "buttonPlacket", markName: "attachmentLine", point: "end" } }],
    faceGeometry("polo", poloBlock, "FRONT_FLAT"));
    expect(lineMarkEnd.issues).toEqual([]);
    expect(lineMarkEnd.callouts?.[0]?.anchor.point).toEqual(attachmentLine.end);
    const buttonPoint = poloBlock.roles.buttonPlacket.marks?.find((mark) => mark.name === "button-1");
    if (!buttonPoint || !("at" in buttonPoint)) throw new Error("Expected the authored button point mark.");
    const pointMark = compileTechnicalFlatPomCallouts("polo", poloBlock, revisionId, "FRONT_FLAT", [{
      label: "Button point", measure: () => 1,
      frontMarkAnchor: { roleId: "buttonPlacket", markName: "button-1", point: "at" },
    }], faceGeometry("polo", poloBlock, "FRONT_FLAT"));
    expect(pointMark.issues).toEqual([]);
    expect(pointMark.callouts?.[0]?.anchor.point).toEqual(buttonPoint.at);
    const invalidPointEndpoint = compileTechnicalFlatPomCallouts("polo", poloBlock, revisionId, "FRONT_FLAT", [{ ...placketWidth,
      frontMarkAnchor: { roleId: "buttonPlacket", markName: "button-1", point: "start" } }],
    faceGeometry("polo", poloBlock, "FRONT_FLAT"));
    expect(invalidPointEndpoint.issues).toContainEqual(expect.objectContaining({ code: "INVALID_POM_ANCHOR" }));
    const lineSourceId = "pattern:polo:mark:buttonPlacket:attachmentLine";
    const lineGeometry = faceGeometry("polo", poloBlock, "FRONT_FLAT");
    const lineTargetId = lineMark.callouts?.[0]?.anchor.primitiveId;
    if (!lineTargetId) throw new Error("Expected a same-face emitted line target.");
    const noSourcePointResolver = () => ({ targetGeometryId: lineTargetId, point: attachmentLine.start,
      sourceEntityId: lineSourceId });
    expect(compileTechnicalFlatPomCallouts("polo", poloBlock, revisionId, "FRONT_FLAT", [placketWidth], lineGeometry,
      noSourcePointResolver).issues).toEqual([]);
    const lineTarget = lineGeometry.find((primitive) => primitive.id === lineTargetId);
    if (!lineTarget || lineTarget.kind !== "path") throw new Error("Expected a path representation for the authored line mark.");
    const closeOnlyTarget = { ...lineTarget, commands: lineTarget.commands.filter((command) => command.op === "close") };
    const withoutEndpointGeometry = lineGeometry.map((primitive) => primitive.id === lineTargetId ? closeOnlyTarget : primitive);
    expect(compileTechnicalFlatPomCallouts("polo", poloBlock, revisionId, "FRONT_FLAT", [placketWidth], withoutEndpointGeometry)
      .issues).toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));

    const noVentBlock = polo.draft(STANDARD_M, { ...defaultGarmentOptions(polo.options ?? []), sideVentDepth: 0 });
    const frontVentPom = polo.poms?.find((pom) => pom.label === "Front side-vent depth")!;
    const noVent = compileTechnicalFlatPomCallouts("polo", noVentBlock, revisionId, "FRONT_FLAT", [frontVentPom],
      faceGeometry("polo", noVentBlock, "FRONT_FLAT"));
    expect(noVent.issues).toEqual([]);
    expect(noVent.notices).toContainEqual(expect.objectContaining({ sourceId: "pom:polo:front-side-vent-depth",
      reason: "SOURCE_NOT_REPRESENTED", message: expect.stringContaining("remains table-only") }));
  });

  it("reports malformed methods, duplicate labels, invalid values and source anchors", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const edge = block.roles.front.edges[0];
    const vertex = edge.kind === "line" ? edge.start : edge.curve.start;
    const valid = (overrides: Partial<Pom> = {}): Pom => ({ label: "Valid method", measure: () => 2,
      anchor: () => vertex, ...overrides });
    const poms = [
      null,
      { label: "", measure: () => 1 },
      { label: 17, measure: () => 1 },
      { label: "Missing measurement" },
      valid({ label: "", anchorRoleId: "" }),
      valid({ anchor: "bad" as unknown as Pom["anchor"] }),
      valid(), valid(),
      valid({ label: "Not a vertex", anchor: () => ({ x: 9999, y: -9999 }) }),
      valid({ label: "Non-finite anchor", anchor: () => ({ x: Number.NaN, y: 0 }) }),
      valid({ label: "Bad value", measure: () => Number.POSITIVE_INFINITY }),
      valid({ label: "Negative value", measure: () => -1 }),
      valid({ label: "Bad tolerance", tolerance: Number.NaN }),
      valid({ label: "Throw Error", measure: () => { throw new Error("stale method"); } }),
      valid({ label: "Throw value", anchor: () => { throw "bad anchor"; } }),
    ] as unknown as readonly Pom[];
    const result = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT",
      poms, faceGeometry(recipe.name, block, "FRONT_FLAT"));
    expect(result.callouts).toBeNull();
    expect(result.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "INVALID_POM", "DUPLICATE_POM_ID", "INVALID_POM_ANCHOR", "INVALID_POM_MEASURE",
    ]));
    expect(result.issues.find((issue) => issue.sourceId.endsWith("throw-error"))?.message).toContain("stale method");
    expect(result.issues.find((issue) => issue.sourceId.endsWith("throw-value"))?.message)
      .toContain("POM method rejected");
    const missingRoleWithoutLabel = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT",
      [{ label: undefined, measure: () => 1, anchor: () => vertex, anchorRoleId: "" } as unknown as Pom],
      faceGeometry(recipe.name, block, "FRONT_FLAT"));
    expect(missingRoleWithoutLabel.issues).toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_ROLE",
      sourceId: "pom:tee:0", message: expect.stringContaining("POM “0” has a face anchor") }));
  });

  it("blocks a label set that cannot be placed without label or leader collisions", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const edge = block.roles.front.edges[0];
    const anchor = edge.kind === "line" ? edge.start : edge.curve.start;
    const crowded = Array.from({ length: 100 }, (_, index): Pom => ({
      label: `Crowded method ${index}`, measure: () => 4, anchor: () => anchor,
    }));
    const result = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT",
      crowded, faceGeometry(recipe.name, block, "FRONT_FLAT"));
    expect(result.callouts).toBeNull();
    expect(result.issues.some((issue) => issue.code === "LABEL_COLLISION")).toBe(true);
  });

  it("moves a leader away from one that passes through its source vertex", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const original = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const sourceEdge = original.roles.front.edges[0];
    const anchor = sourceEdge.kind === "line" ? sourceEdge.start : sourceEdge.curve.start;
    const directionLength = Math.hypot(1, 0.4);
    const middle = {
      x: anchor.x + 0.75 * (1 / directionLength),
      y: anchor.y - 0.75 * (0.4 / directionLength),
    };
    const block = { ...original, roles: { ...original.roles, front: {
      ...original.roles.front,
      edges: [...original.roles.front.edges,
        { kind: "line" as const, name: "leader-crossing-fixture", start: middle, end: middle }],
    } } };
    const result = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT", [
      { label: "First", measure: () => 2, anchor: () => anchor },
      { label: "Second", measure: () => 3, anchor: () => middle },
    ], faceGeometry(recipe.name, block, "FRONT_FLAT"));
    expect(result.issues).toEqual([]);
    expect(result.callouts).toHaveLength(2);
    expect(result.callouts?.[1].labelAt).not.toEqual(result.callouts?.[0].labelAt);
  });

  it("returns a non-Error measurement failure as actionable guidance", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const invalid = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT",
      [{ label: "Nope", measure: () => { throw "no measure"; }, anchor: () => ({ x: 0, y: 0 }) }],
      faceGeometry(recipe.name, block, "FRONT_FLAT"));
    expect(invalid.issues[0].message).toContain("the POM method rejected this pattern");
  });
});
