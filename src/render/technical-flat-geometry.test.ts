import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import type { Block } from "../drafting/block";
import { compileTechnicalFlatSourceGeometry } from "./technical-flat-geometry";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { TECHNICAL_FLAT_SCHEMA_VERSION, validateTechnicalFlat } from "./technical-flat";

const revisionId = "style-revision-17";

describe("technical-flat source geometry", () => {
  it("compiles exact mapped role outlines, marks and darts for every recipe and option endpoint", () => {
    for (const recipe of GARMENTS) {
      const optionSets = [defaultGarmentOptions(recipe.options ?? [])];
      for (const option of recipe.options ?? []) {
        optionSets.push({ ...defaultGarmentOptions(recipe.options ?? []), [option.id]: option.min });
        optionSets.push({ ...defaultGarmentOptions(recipe.options ?? []), [option.id]: option.max });
      }
      for (const options of optionSets) {
        const block = recipe.draft(STANDARD_M, options);
        for (const face of G04_TECHNICAL_FLAT_MAPPINGS[recipe.name].faces) {
          const output = compileTechnicalFlatSourceGeometry(recipe.name, block, revisionId, face.kind);
          expect(output.issues, `${recipe.name}/${face.kind}`).toEqual([]);
          expect(output.units).toBe("cm");
          expect(validateTechnicalFlat({
            schemaVersion: TECHNICAL_FLAT_SCHEMA_VERSION, viewId: `${recipe.name}:${face.kind}`,
            revisionId, recipeId: recipe.name, kind: face.kind, units: "cm",
            primitives: output.primitives, notices: output.notices,
          }), `${recipe.name}/${face.kind} primitive validation`).toEqual([]);
          for (const role of face.roles) {
            const outline = output.primitives.find((primitive) => primitive.id ===
              `flat:${recipe.name}:${face.kind}:component:${role.roleId}:outline`);
            if (role.treatment === "INTERIOR_HIDDEN") {
              expect(outline).toBeUndefined();
              expect(output.notices).toContainEqual(expect.objectContaining({
                sourceId: `pattern:${recipe.name}:role:${role.roleId}`, reason: "HIDDEN_BY_VIEW",
              }));
              continue;
            }
            const piece = block.roles[role.roleId];
            expect(outline).toMatchObject({ kind: "path", layer: "GARMENT_SILHOUETTE", feature: "silhouette",
              source: { sourceClass: "PATTERN_DERIVED", sourceId: `pattern:${recipe.name}:role:${role.roleId}`, revisionId } });
            if (outline?.kind !== "path") throw new Error("Mapped role outline must be a path.");
            expect(outline.commands.length).toBe(piece.edges.length * 2);
            for (const edge of piece.edges) {
              const expected = edge.kind === "line"
                ? [{ op: "move", point: edge.start }, { op: "line", point: edge.end }]
                : [{ op: "move", point: edge.curve.start }, { op: "cubic", control1: edge.curve.control1,
                  control2: edge.curve.control2, point: edge.curve.end }];
              expect(outline.commands).toContainEqual(expected[0]);
              expect(outline.commands).toContainEqual(expected[1]);
            }
            for (const mark of piece.marks ?? []) {
              const primitive = output.primitives.find((candidate) => candidate.id ===
                `flat:${recipe.name}:${face.kind}:mark:${role.roleId}:${mark.name}`);
              expect(primitive?.source).toMatchObject({ sourceId: `pattern:${recipe.name}:mark:${role.roleId}:${mark.name}`, revisionId });
              if ("at" in mark) {
                expect(primitive).toMatchObject({ kind: "mark", markKind: mark.kind, markName: mark.name, at: mark.at });
              } else {
                expect(primitive).toMatchObject({ kind: "path", commands: [
                  { op: "move", point: mark.start }, { op: "line", point: mark.end },
                ], patternMark: { kind: mark.kind, name: mark.name, label: mark.label, labelRole: mark.labelRole } });
              }
            }
            if (piece.dart) {
              for (const edgeName of piece.dart.legs) {
                const edge = piece.edges.find((candidate) => candidate.name === edgeName);
                const dart = output.primitives.find((candidate) => candidate.id ===
                  `flat:${recipe.name}:${face.kind}:dart:${role.roleId}:${edgeName}`);
                expect(edge).toBeDefined();
                expect(dart).toMatchObject({ kind: "path", layer: "DART", feature: "dart" });
              }
            }
          }
          expect(output.primitives.some((primitive) => primitive.source.sourceId.includes(":stitch:"))).toBe(false);
        }
      }
    }
  });

  it("returns actionable issues for an invalid revision and invalid source coordinates", () => {
    const tee = GARMENTS.find((recipe) => recipe.name === "tee");
    if (!tee) throw new Error("Tee recipe is missing.");
    const block = tee.draft(STANDARD_M, defaultGarmentOptions(tee.options ?? []));
    expect(compileTechnicalFlatSourceGeometry("tee", block, " ", "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_REVISION_ID" }));
    const front = block.roles.front;
    const invalidBlock = { ...block, roles: { ...block.roles,
      front: { ...front, edges: [{ ...front.edges[0], kind: "line", start: { x: Number.NaN, y: 0 } }, ...front.edges.slice(1)] },
    } } as unknown as Block;
    expect(compileTechnicalFlatSourceGeometry("tee", invalidBlock, revisionId, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_SOURCE_EDGE", sourceId: "pattern:tee:role:front" }));
    const invalidMarkBlock = { ...block, roles: { ...block.roles,
      front: { ...front, marks: [{ kind: "placementPoint", name: "invalid", at: { x: 0, y: Number.NaN } }] },
    } } as unknown as Block;
    expect(compileTechnicalFlatSourceGeometry("tee", invalidMarkBlock, revisionId, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_SOURCE_EDGE", sourceId: "pattern:tee:mark:front:invalid" }));
    const invalidLineMarkBlock = { ...block, roles: { ...block.roles,
      front: { ...front, marks: [{ kind: "foldLine", name: "invalid-line", start: { x: 0, y: 0 }, end: { x: Number.NaN, y: 1 } }] },
    } } as unknown as Block;
    expect(compileTechnicalFlatSourceGeometry("tee", invalidLineMarkBlock, revisionId, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_SOURCE_EDGE", sourceId: "pattern:tee:mark:front:invalid-line" }));
    const invalidPointShapeBlock = { ...block, roles: { ...block.roles,
      front: { ...front, marks: [{ kind: "button", name: "array-point", at: [], label: "Button label" }] },
    } } as unknown as Block;
    expect(compileTechnicalFlatSourceGeometry("tee", invalidPointShapeBlock, revisionId, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_SOURCE_EDGE", sourceId: "pattern:tee:mark:front:array-point" }));
    const labelledPointBlock = { ...block, roles: { ...block.roles,
      front: { ...front, marks: [{ kind: "button", name: "labelled-point", at: { x: 2, y: 3 }, label: "Button" }] },
    } } as unknown as Block;
    expect(compileTechnicalFlatSourceGeometry("tee", labelledPointBlock, revisionId, "FRONT_FLAT").primitives)
      .toContainEqual(expect.objectContaining({ kind: "mark", markName: "labelled-point", label: "Button" }));
    const missingRole = { ...block, roles: { back: block.roles.back, sleeve: block.roles.sleeve } };
    expect(compileTechnicalFlatSourceGeometry("tee", missingRole, revisionId, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "MISSING_MAPPED_ROLE", sourceId: "front" }));
    expect(compileTechnicalFlatSourceGeometry("tee", block, revisionId, "SIDE_VIEW" as "FRONT_FLAT").primitives).toEqual([]);
    const emptyOutline = { ...block, roles: { ...block.roles, front: { ...front, edges: [] } } } as unknown as Block;
    expect(compileTechnicalFlatSourceGeometry("tee", emptyOutline, revisionId, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_SOURCE_EDGE", sourceId: "pattern:tee:role:front" }));
    const curveRole = Object.entries(block.roles).find(([, piece]) => piece.edges.some((edge) => edge.kind === "curve"));
    if (!curveRole) throw new Error("Expected a drafted curve edge in the tee block.");
    const [roleId, curvedPiece] = curveRole;
    const curveIndex = curvedPiece.edges.findIndex((edge) => edge.kind === "curve");
    const curve = curvedPiece.edges[curveIndex];
    if (curve.kind !== "curve") throw new Error("Expected curve edge fixture.");
    const invalidCurve = { ...block, roles: { ...block.roles, [roleId]: { ...curvedPiece,
      edges: curvedPiece.edges.map((edge, index) => index === curveIndex
        ? { ...curve, curve: { ...curve.curve, control1: { x: Number.NaN, y: 0 } } } : edge),
    } } } as unknown as Block;
    expect(compileTechnicalFlatSourceGeometry("tee", invalidCurve, revisionId, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_SOURCE_EDGE", sourceId: `pattern:tee:role:${roleId}` }));
  });

  it("keeps unsupported recipes explicit and does not invent point-mark dimensions", () => {
    const tee = GARMENTS.find((recipe) => recipe.name === "tee");
    if (!tee) throw new Error("Tee recipe is missing.");
    const block = tee.draft(STANDARD_M, defaultGarmentOptions(tee.options ?? []));
    const unsupported = compileTechnicalFlatSourceGeometry("dress", block, revisionId, "FRONT_FLAT");
    expect(unsupported.primitives).toEqual([]);
    expect(unsupported.issues).toContainEqual(expect.objectContaining({ code: "UNSUPPORTED_RECIPE" }));
    const points = compileTechnicalFlatSourceGeometry("woven-shirt",
      GARMENTS.find((recipe) => recipe.name === "woven-shirt")!.draft(STANDARD_M, defaultGarmentOptions([])),
      revisionId, "FRONT_FLAT").primitives.filter((primitive) => primitive.kind === "mark");
    expect(points.length).toBeGreaterThan(0);
    expect(points.every((primitive) => !("radius" in primitive) && !("widthCm" in primitive))).toBe(true);
  });

  it("reports dart references that no longer resolve to source edges", () => {
    const fitted = GARMENTS.find((recipe) => recipe.name === "fitted");
    if (!fitted) throw new Error("Darted tee recipe is missing.");
    const block = fitted.draft(STANDARD_M, defaultGarmentOptions(fitted.options ?? []));
    const front = block.roles.front;
    const invalidBlock = { ...block, roles: { ...block.roles,
      front: { ...front, dart: { legs: ["missing-upper", "missing-lower"] as const } },
    } } as unknown as Block;
    expect(compileTechnicalFlatSourceGeometry("fitted", invalidBlock, revisionId, "FRONT_FLAT").issues)
      .toContainEqual(expect.objectContaining({ code: "INVALID_SOURCE_EDGE", sourceId: "pattern:fitted:dart:front:missing-upper:missing-lower" }));
  });
});
