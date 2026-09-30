import { describe, expect, it } from "vitest";
import type { Block } from "../drafting/block";
import type { Pom } from "../drafting/pom";
import { GARMENTS } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import type { TechnicalFlatPrimitive } from "./technical-flat";
import { compileTechnicalFlatSourceGeometry } from "./technical-flat-geometry";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { compileTechnicalFlatPomCallouts, technicalFlatLeaderCrossesBox, technicalFlatLeaderSegmentsCross } from "./technical-flat-poms";

const revisionId = "revision-g04-pom";

function faceGeometry(recipeId: string, block: Block, kind: "FRONT_FLAT" | "BACK_FLAT", revision = revisionId): TechnicalFlatPrimitive[] {
  return [...compileTechnicalFlatSourceGeometry(recipeId, block, revision, kind).primitives];
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
      const declaredAnchored = (recipe.poms ?? []).filter((pom) => pom.anchor).length;
      expect(front.issues, recipe.name).toEqual([]);
      expect(front.callouts, recipe.name).toHaveLength(declaredAnchored);
      expect(front.callouts?.every((callout) => callout.anchor.primitiveId
        === `flat:${recipe.name}:FRONT_FLAT:component:${mapping.pomAnchorRole}:outline`
        && callout.source.revisionId === revisionId)).toBe(true);
      expect(front.callouts?.every((callout) => callout.anchor.point.x !== callout.labelAt.x
        || callout.anchor.point.y !== callout.labelAt.y)).toBe(true);
      expect(front.callouts?.every((callout) => /: \d+\.\d cm/.test(callout.text))).toBe(true);
      if (recipe.name === "trouser") {
        expect(front.notices).toContainEqual(expect.objectContaining({
          sourceId: "pom:trouser:back-rise-finished-incl-waistband",
          message: expect.stringContaining("back-face anchor and remains table-only on the front view"),
        }));
      }

      const back = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId,
        "BACK_FLAT", recipe.poms ?? [], faceGeometry(recipe.name, block, "BACK_FLAT"));
      expect(back.issues, `${recipe.name} back`).toEqual([]);
      const declaredBackAnchored = (recipe.poms ?? []).filter((pom) => pom.backAnchor).length;
      expect(back.callouts, `${recipe.name} back`).toHaveLength(declaredBackAnchored);
      if (declaredBackAnchored > 0) {
        expect(back.callouts?.every((callout) => callout.anchor.primitiveId
          === `flat:${recipe.name}:BACK_FLAT:component:${mapping.backPomAnchorRole}:outline`
          && callout.source.revisionId === revisionId)).toBe(true);
      }
      expect(back.notices.some((notice) => notice.message.includes("front-only source anchor")))
        .toBe((recipe.poms ?? []).some((pom) => pom.anchor && !pom.backAnchor));
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

  it("rejects unsupported revisions, target geometry and mapped roles", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const geometry = faceGeometry(recipe.name, block, "FRONT_FLAT");
    const invalidRevision = compileTechnicalFlatPomCallouts(recipe.name, block, " ", "FRONT_FLAT", [], geometry);
    expect(invalidRevision.issues).toContainEqual(expect.objectContaining({ code: "INVALID_REVISION_ID" }));
    const unsupported = compileTechnicalFlatPomCallouts("unsupported", block, revisionId, "FRONT_FLAT", [], []);
    expect(unsupported.issues).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_RECIPE" }));
    const noGeometry = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT", [], []);
    expect(noGeometry.issues).toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    const wrongRevisionGeometry = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId,
      "FRONT_FLAT", [], faceGeometry(recipe.name, block, "FRONT_FLAT", "older-revision"));
    expect(wrongRevisionGeometry.issues).toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    const wrongKindGeometry = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "FRONT_FLAT", [], [
      { kind: "text", id: "flat:tee:FRONT_FLAT:component:front:outline", layer: "ANNOTATION", feature: "annotation",
        source: { sourceClass: "PATTERN_DERIVED", sourceId: "pattern:tee:front", revisionId }, at: { x: 0, y: 0 }, text: "not geometry" },
    ]);
    expect(wrongKindGeometry.issues).toContainEqual(expect.objectContaining({ code: "MISSING_ANCHOR_GEOMETRY" }));
    const noRoleBlock = { ...block, roles: { sleeve: block.roles.sleeve } };
    const noRole = compileTechnicalFlatPomCallouts(recipe.name, noRoleBlock, revisionId, "FRONT_FLAT", [], []);
    expect(noRole.issues.map((issue) => issue.code)).toEqual([]);
  });

  it("fails closed when a back anchor has no mapped role or exact same-revision outline", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee");
    if (!recipe) throw new Error("Tee recipe is missing.");
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const backOnly: Pom[] = [{ label: "Back only", measure: () => 4, backAnchor: () => ({ x: 0, y: 0 }) }];
    const unmapped = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, "BACK_FLAT", backOnly, []);
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
