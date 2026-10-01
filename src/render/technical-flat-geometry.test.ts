import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import { lineMark, pointMark } from "../drafting/pattern-mark";
import { cubicPoint } from "../geometry/curve";
import type { Block } from "../drafting/block";
import { compileTechnicalFlatSourceGeometry, parameterForLandmark, projectedCommands } from "./technical-flat-geometry";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { createG04TechnicalFlatProjectionMap, edgeParameterAtArclengthFraction, resolveFlatProjectionLandmark,
  type TechnicalFlatProjectionMap } from "./technical-flat-projection";
import { TECHNICAL_FLAT_SCHEMA_VERSION, validateTechnicalFlat } from "./technical-flat";

const revisionId = "style-revision-17";

/** The Polo face is production-held for its sleeve view. This test-only map
 * clears that hold solely to exercise the independent collar fill compiler. */
function poloColorwayDiagnosticMap(block: Block): TechnicalFlatProjectionMap {
  return createG04TechnicalFlatProjectionMap("polo", block, revisionId)!;
}

function projectionMap(recipeId: string, block: Block): TechnicalFlatProjectionMap {
  const base = G04_TECHNICAL_FLAT_MAPPINGS[recipeId];
  const authored = ["woven-shirt", "tee", "fitted", "polo"].includes(recipeId)
    ? createG04TechnicalFlatProjectionMap(recipeId, block, revisionId)! : undefined;
  if (recipeId === "polo" || recipeId === "woven-shirt") return authored!;
  return {
    version: 1, recipeId, revisionId,
    faces: base.faces.map((face) => ({
      kind: face.kind,
      roles: face.roles.map((role) => {
        const piece = block.roles[role.roleId];
        const hidden = role.treatment === "INTERIOR_HIDDEN";
        const pairReflection = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.physicalPairReflection;
        const viewPairReflection = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.viewPairReflection;
        const viewBoundaries = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.viewBoundaries;
        const reversedStitchEdges = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.reversedStitchEdges;
        const localYReflection = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.localYReflection;
        const oppositeSideReflection = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.oppositeSideReflection;
        const isZero = (edge: (typeof piece.edges)[number]) => {
          const start = edge.kind === "line" ? edge.start : edge.curve.start;
          const end = edge.kind === "line" ? edge.end : edge.curve.end;
          return start.x === end.x && start.y === end.y;
        };
        return {
          roleId: role.roleId, instanceId: role.roleId, treatment: role.treatment,
          runs: hidden ? [] : piece.edges.filter((edge) => !isZero(edge)).map((edge) => ({
            edgeId: edge.name,
            from: { kind: "edge-endpoint" as const, edgeId: edge.name, endpoint: "start" as const },
            to: { kind: "edge-endpoint" as const, edgeId: edge.name, endpoint: "end" as const },
          })),
          heldEdges: piece.edges.filter((edge) => hidden || isZero(edge)).map((edge) => ({
            edgeId: edge.name, reason: hidden ? "Interior role is hidden." : "Zero-length edge is unresolved.",
          })),
          ...(pairReflection ? { physicalPairReflection: pairReflection } : {}),
          ...(viewPairReflection ? { viewPairReflection } : {}),
          ...(viewBoundaries ? { viewBoundaries } : {}),
          ...(reversedStitchEdges ? { reversedStitchEdges } : {}),
          ...(localYReflection ? { localYReflection } : {}),
          ...(oppositeSideReflection ? { oppositeSideReflection } : {}),
        };
      }),
    })) as unknown as TechnicalFlatProjectionMap["faces"],
  };
}

describe("technical-flat source geometry", () => {
  it("emits the approved Woven base seam once from the body edge and retains both source fill boundaries", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const source = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const mapping = createG04TechnicalFlatProjectionMap(recipe.name, source, revisionId)!;
    for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
      const result = compileTechnicalFlatSourceGeometry(recipe.name, source, revisionId, kind, mapping);
      expect(result.issues, kind).toEqual([]);
      const visibleRoleId = kind === "FRONT_FLAT" ? "front" : "yoke";
      const seamSource = `pattern:woven-shirt:role:${visibleRoleId}:edge:neckline`;
      const visibleSeams = result.primitives.filter((primitive) => primitive.layer === "SEAM"
        && primitive.source.sourceId === seamSource);
      expect(visibleSeams).toHaveLength(1);
      expect(visibleSeams[0]).toMatchObject({ feature: "seam", kind: "path" });
      const visibleOutlines = result.primitives.filter((primitive) => primitive.kind === "path"
        && primitive.layer === "GARMENT_SILHOUETTE" && primitive.colorwayBoundaryOnly !== true);
      expect(visibleOutlines.some((primitive) => primitive.kind === "path" && primitive.sourceEdgeIds?.includes(seamSource))).toBe(false);
      expect(visibleOutlines.some((primitive) => primitive.kind === "path" && primitive.sourceEdgeIds
        ?.includes("pattern:woven-shirt:role:outerStand:edge:neckline"))).toBe(false);
      expect(result.primitives.filter((primitive) => primitive.kind === "path" && primitive.colorwayBoundaryOnly === true
        && primitive.sourceEdgeIds?.some((id) => id.endsWith(":edge:neckline")))).toHaveLength(2);
    }
  });

  it("compiles Polo shoulder closures as same-revision fill-only boundaries without mutating the drafted block", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const original = structuredClone(block);
    const productionMap = poloColorwayDiagnosticMap(block);
    for (const face of productionMap.faces) {
      const output = compileTechnicalFlatSourceGeometry("polo", block, revisionId, face.kind, productionMap);
      expect(output.issues).toEqual([]);
      expect(output.primitives.some((primitive) => primitive.id ===
        `flat:polo:${face.kind}:component:sleeve:outline`)).toBe(true);
    }
    const map = productionMap;
    for (const face of map.faces) {
      const compiled = compileTechnicalFlatSourceGeometry("polo", block, revisionId, face.kind, map);
      expect(compiled.issues).toEqual([]);
      for (const roleId of ["outerStand", "underCollar", "upperCollar"]) {
        const boundary = face.roles.find((role) => role.roleId === roleId)!.viewBoundaries![0]!;
        const primitive = compiled.primitives.find((entry) => entry.kind === "path"
          && entry.id.endsWith(`component:${roleId}:view-boundary:${boundary.id}`));
        expect(primitive).toMatchObject({
          kind: "path", layer: "GARMENT_SILHOUETTE", feature: "silhouette", colorwayBoundaryOnly: true,
          source: { sourceClass: "PATTERN_DERIVED", revisionId,
            sourceId: `view:polo:role:${roleId}:decision:G04-S321-COLLAR-EXTERIOR-ARCLENGTH:boundary:${boundary.id}` },
        });
        if (primitive?.kind !== "path" || primitive.commands[0]?.op !== "move" || primitive.commands[1]?.op !== "line") {
          throw new Error("Approved Polo fill closure must compile to one non-stroked line primitive.");
        }
        expect(primitive.commands[0].point).toEqual(resolveFlatProjectionLandmark(block, roleId, face.kind, boundary.from));
        expect(primitive.commands[1].point).toEqual(resolveFlatProjectionLandmark(block, roleId, face.kind, boundary.to));
      }
    }
    expect(block).toEqual(original);
  });

  it("does not invent a cubic parameter for a stitch-interface landmark", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const piece = block.roles.upperCollar!;
    const edge = piece.edges.find((candidate) => candidate.name === "outer")!;
    expect(parameterForLandmark(edge, piece, {
      kind: "stitch-interface-boundary", stitchLabel: "Upper collar ↔ inner stand",
      boundarySide: "a", receiverSide: "b", afterEdgeIndex: 0, faceSegmentEdgeIndex: 0, receiverEdgeIndex: 0,
    })).toBeUndefined();
  });

  it("resolves only validated source endpoint and edge parameter landmarks", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const piece = block.roles.upperCollar!;
    const edge = piece.edges.find((candidate) => candidate.name === "outer")!;
    const start = edge.kind === "curve" ? edge.curve.start : edge.start;
    const end = edge.kind === "curve" ? edge.curve.end : edge.end;
    const markedPiece = { ...piece, marks: [
      pointMark("placementPoint", "atStart", start),
      pointMark("placementPoint", "inside", { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }),
      lineMark("placementLine", "edgeEnds", start, end),
    ] };
    expect(parameterForLandmark(edge, markedPiece, { kind: "edge-endpoint", edgeId: "other", endpoint: "start" })).toBeUndefined();
    expect(parameterForLandmark(edge, piece, { kind: "edge-endpoint", edgeId: "outer", endpoint: "middle" } as never)).toBeUndefined();
    expect(parameterForLandmark(edge, piece, { kind: "edge-arclength", edgeId: "other", fraction: 0.5 })).toBeUndefined();
    expect(parameterForLandmark(edge, markedPiece, { kind: "pattern-mark", markId: "missing", point: "at" })).toBeUndefined();
    expect(parameterForLandmark(edge, markedPiece, { kind: "pattern-mark", markId: "atStart", point: "start" })).toBeUndefined();
    expect(parameterForLandmark(edge, markedPiece, { kind: "pattern-mark", markId: "inside", point: "at" })).toBeUndefined();
    expect(parameterForLandmark(edge, markedPiece, { kind: "pattern-mark", markId: "edgeEnds", point: "start" })).toBe(0);
    expect(parameterForLandmark(edge, markedPiece, { kind: "pattern-mark", markId: "edgeEnds", point: "end" })).toBe(1);
    expect(parameterForLandmark(edge, markedPiece, { kind: "pattern-mark", markId: "edgeEnds", point: "at" })).toBeUndefined();
    expect(parameterForLandmark(edge, markedPiece, { kind: "pattern-mark", markId: "atStart", point: "at" })).toBe(0);
  });

  it("fails closed for malformed projected line and cubic runs", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const collar = block.roles.upperCollar!;
    const outer = collar.edges.find((candidate) => candidate.name === "outer")!;
    const line = collar.edges.find((candidate) => candidate.kind === "line")!;
    const invalidLandmark = { kind: "edge-endpoint" as const, edgeId: "wrong", endpoint: "start" as const };
    expect(projectedCommands("polo", block, "FRONT_FLAT", collar, { roleId: "upperCollar", instanceId: "test",
      treatment: "VISIBLE_OVERLAY", heldEdges: [], runs: [{ edgeId: line.name, from: invalidLandmark, to: invalidLandmark }] })).toBeNull();
    expect(projectedCommands("polo", block, "FRONT_FLAT", collar, { roleId: "upperCollar", instanceId: "test",
      treatment: "VISIBLE_OVERLAY", heldEdges: [], runs: [{ edgeId: outer.name, from: invalidLandmark, to: invalidLandmark }] })).toBeNull();
    expect(projectedCommands("polo", block, "FRONT_FLAT", collar,
      { roleId: "upperCollar", instanceId: "test", treatment: "VISIBLE_OVERLAY", heldEdges: [], runs: [] })).toBeNull();
  });

  it("compiles exact front and back cubic subcurves at Polo's transferred collar station", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const revision = revisionId;
    const map = poloColorwayDiagnosticMap(block);
    for (const face of map.faces) for (const roleId of ["underCollar", "upperCollar"]) {
      const output = compileTechnicalFlatSourceGeometry("polo", block, revision, face.kind, map);
      expect(output.issues).toEqual([]);
      const outline = output.primitives.find((primitive) => primitive.id ===
        `flat:polo:${face.kind}:component:${roleId}:outline`);
      if (outline?.kind !== "path") throw new Error("Mapped Polo collar must compile to a path.");
      const projection = face.roles.find((role) => role.roleId === roleId)!;
      const runIndex = projection.runs.findIndex((run) => run.edgeId === "outer");
      const run = projection.runs[runIndex]!;
      const t = run.to.kind === "normalized-edge-transfer" ? run.to.fraction
        : run.from.kind === "normalized-edge-transfer" ? run.from.fraction : undefined;
      if (t === undefined) throw new Error("Polo outer collar run needs its approved arclength station.");
      const outer = block.roles[roleId]!.edges.find((edge) => edge.name === "outer")!;
      if (outer.kind !== "curve") throw new Error("Polo outer collar edge must remain cubic.");
      const transferParameter = edgeParameterAtArclengthFraction(outer, t)!;
      const startCommand = outline.commands[runIndex * 2];
      const curveCommand = outline.commands[runIndex * 2 + 1];
      if (startCommand?.op !== "move" || curveCommand?.op !== "cubic") throw new Error("Transferred collar segment must preserve cubic geometry.");
      const emittedCurve = { start: startCommand.point,
        control1: curveCommand.control1, control2: curveCommand.control2, end: curveCommand.point };
      const fromParameter = face.kind === "FRONT_FLAT" ? 0 : transferParameter;
      const toParameter = face.kind === "FRONT_FLAT" ? transferParameter : 1;
      for (const fraction of [0, 0.2, 0.5, 0.8, 1]) {
        const actual = cubicPoint(emittedCurve, fraction);
        const expected = cubicPoint(outer.curve,
          fromParameter + (toParameter - fromParameter) * fraction);
        expect(actual.x).toBeCloseTo(expected.x, 12);
        expect(actual.y).toBeCloseTo(expected.y, 12);
      }
    }
  });

  it("retains provenance for view-only boundaries from alternate exact landmarks", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "skirt")!;
    const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const map = createG04TechnicalFlatProjectionMap("skirt", block, revisionId)!;
    const face = map.faces[0];
    const frontBand = face.roles.find((role) => role.roleId === "waistband")!;
    const endpoint = { kind: "edge-endpoint" as const, edgeId: "top", endpoint: "start" as const };
    const alternate = { ...map, faces: map.faces.map((candidate, index) => index === 0 ? { ...candidate,
      roles: candidate.roles.map((role) => role.roleId === "waistband" ? { ...role, viewBoundaries: [
        { id: "stitch-on-to", from: endpoint, to: frontBand.runs[0]!.to },
        { id: "stitch-on-from", from: frontBand.runs[0]!.to, to: endpoint },
        { id: "endpoint-pair", from: endpoint, to: { kind: "edge-endpoint" as const, edgeId: "top", endpoint: "end" as const } },
      ] } : role) } : candidate),
    } as unknown as TechnicalFlatProjectionMap;
    const output = compileTechnicalFlatSourceGeometry("skirt", block, revisionId, "FRONT_FLAT", alternate);
    expect(output.issues).toEqual([]);
    expect(output.primitives.filter((primitive) => primitive.id.includes("view-boundary")))
      .toMatchObject([{ source: { sourceId: expect.stringContaining(":stitch:Waistband") } },
        { source: { sourceId: expect.stringContaining(":stitch:Waistband") } },
        { source: { sourceId: expect.stringContaining(":stitch:unknown") } }]);
  });

  it("compiles approved Tee/Fitted sleeve areas after S330 clears the default-view mapping hold", () => {
    for (const recipeId of ["tee", "fitted"] as const) {
      const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
      const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
      for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
        const map = createG04TechnicalFlatProjectionMap(recipeId, block, revisionId)!;
        const output = compileTechnicalFlatSourceGeometry(recipeId, block, revisionId, kind, map);
        expect(output.issues).toEqual([]);
        expect(output.primitives.some((primitive) => primitive.source.sourceId === `pattern:${recipeId}:role:sleeve`)).toBe(true);
        expect(output.primitives.some((primitive) => primitive.kind === "path" && primitive.colorwayBoundaryOnly === true
          && primitive.source.sourceId.includes("G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR"))).toBe(true);
      }
    }
  });

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

  it("compiles approved Woven collar, sleeve, and closure source maps before assembly review", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const revision = revisionId;
    const openBlock = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
    const openMap = createG04TechnicalFlatProjectionMap("woven-shirt", openBlock, revision)!;
    const front = compileTechnicalFlatSourceGeometry("woven-shirt", openBlock, revision, "FRONT_FLAT", openMap);
    const back = compileTechnicalFlatSourceGeometry("woven-shirt", openBlock, revision, "BACK_FLAT", openMap);
    expect(front.issues).toEqual([]);
    expect(back.issues.some((issue) => issue.code === "UNRESOLVED_PROJECTION_EDGE"
      && issue.message.includes("Woven sleeve-cap placement"))).toBe(false);
    expect(front.primitives.some((primitive) => primitive.source.sourceId === "pattern:woven-shirt:role:front")).toBe(true);
    expect(front.primitives.some((primitive) => primitive.source.sourceId === "pattern:woven-shirt:role:sleeve")).toBe(true);
    expect(front.primitives.some((primitive) => primitive.source.sourceId === "pattern:woven-shirt:role:buttonholePlacket")).toBe(true);
    expect(back.primitives.some((primitive) => primitive.source.sourceId === "pattern:woven-shirt:role:back")).toBe(true);
    expect(back.primitives.some((primitive) => primitive.source.sourceId === "pattern:woven-shirt:role:yoke")).toBe(true);
    for (const face of openMap.faces) for (const roleId of ["outerStand", "upperCollar", "underCollar"]) {
      const role = face.roles.find((candidate) => candidate.roleId === roleId)!;
      expect(role.runs.some((run) => run.from.kind === "normalized-edge-transfer"
        || run.to.kind === "normalized-edge-transfer")).toBe(true);
      expect(role.heldEdges).toEqual([]);
    }
    for (const face of openMap.faces) {
      if (face.kind === "BACK_FLAT") {
        for (const bodyRoleId of ["back", "yoke"]) {
          const bodyRole = face.roles.find((role) => role.roleId === bodyRoleId)!;
          expect(bodyRole.heldEdges).toEqual([]);
          expect(bodyRole.foldAxisReflection).toMatchObject({ edgeId: "centerBack", source: "Piece.onFold" });
        }
      } else {
        expect(face.roles.find((role) => role.roleId === "front")?.heldEdges).toEqual([]);
      }
      const lowerRole = face.roles.find((role) => role.roleId === (face.kind === "FRONT_FLAT" ? "front" : "back"));
      if (lowerRole) {
        expect(lowerRole.runs.some((run) => run.edgeId === "vent")
          || lowerRole.heldEdges.some((held) => held.edgeId === "vent")).toBe(true);
        expect(lowerRole.faceExcludedEdges?.some((excluded) => excluded.edgeId === "vent") ?? false).toBe(false);
      }
    }

    const closedBlock = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), sideVentDepth: 0 });
    const closedMap = createG04TechnicalFlatProjectionMap("woven-shirt", closedBlock, revision)!;
    const closedFront = closedMap.faces[0].roles.find((role) => role.roleId === "front")!;
    expect(closedFront.runs.some((run) => run.edgeId === "vent")).toBe(false);
    expect(closedFront.faceExcludedEdges).toContainEqual(expect.objectContaining({ edgeId: "vent" }));
    const closedFrontOutput = compileTechnicalFlatSourceGeometry("woven-shirt", closedBlock, revision, "FRONT_FLAT", closedMap);
    expect(closedFrontOutput.issues).toEqual([]);
    expect(closedFrontOutput.primitives.length).toBeGreaterThan(0);
  });

  it("compiles only validated projected source runs and retains per-edge provenance", () => {
    const tee = GARMENTS.find((recipe) => recipe.name === "tee")!;
    const block = tee.draft(STANDARD_M, defaultGarmentOptions(tee.options ?? []));
    const map = projectionMap("tee", block);
    const legacy = compileTechnicalFlatSourceGeometry("tee", block, revisionId, "FRONT_FLAT");
    const projected = compileTechnicalFlatSourceGeometry("tee", block, revisionId, "FRONT_FLAT", map);
    expect(projected.issues).toEqual([]);
    expect(projected.primitives).toHaveLength(legacy.primitives.length + 1);
    expect(projected.primitives.filter((primitive) => primitive.kind === "path" && primitive.colorwayBoundaryOnly === true))
      .toHaveLength(1);
    for (const roleMap of map.faces[0].roles.filter((role) => role.treatment !== "INTERIOR_HIDDEN")) {
      const outline = projected.primitives.find((primitive) => primitive.id ===
        `flat:tee:FRONT_FLAT:component:${roleMap.roleId}:outline`);
      expect(outline).toMatchObject({ kind: "path", source: { sourceId: `pattern:tee:role:${roleMap.roleId}` },
        sourceEdgeIds: roleMap.runs.map((run) => `pattern:tee:role:${roleMap.roleId}:edge:${run.edgeId}`) });
      if (outline?.kind !== "path") throw new Error("Projected outline must be a path.");
      expect(outline.commands).toHaveLength(roleMap.runs.length * 2);
      const legacyOutline = legacy.primitives.find((primitive) => primitive.id === outline.id);
      expect(legacyOutline?.kind).toBe("path");
      expect(outline.id).toBe(legacyOutline?.id);
      expect(legacyOutline?.kind === "path" ? legacyOutline.sourceEdgeIds : undefined).toBeUndefined();
    }
  });

  it("uses source-bound pattern-mark endpoints and exercises every supported option topology", () => {
    const tee = GARMENTS.find((recipe) => recipe.name === "tee")!;
    const block = tee.draft(STANDARD_M, defaultGarmentOptions(tee.options ?? []));
    const map = projectionMap("tee", block);
    const face = map.faces[0];
    const role = face.roles.find((candidate) => candidate.treatment !== "INTERIOR_HIDDEN")!;
    const edgeId = role.runs[0].edgeId;
    const edge = block.roles[role.roleId].edges.find((candidate) => candidate.name === edgeId)!;
    const start = edge.kind === "line" ? edge.start : edge.curve.start;
    const end = edge.kind === "line" ? edge.end : edge.curve.end;
    const pointMark = { kind: "placementPoint" as const, name: "endpoint-point", at: start };
    const lineMark = { kind: "placementLine" as const, name: "endpoint-line", start, end };
    const markedBlock = { ...block, roles: { ...block.roles, [role.roleId]: { ...block.roles[role.roleId], marks: [pointMark, lineMark] } } };
    const markedRole = { ...role, runs: role.runs.map((run, index) => index ? run : ({ ...run,
      from: { kind: "pattern-mark" as const, markId: "endpoint-point", point: "at" as const },
      to: { kind: "pattern-mark" as const, markId: "endpoint-line", point: "end" as const },
    })) };
    const markedFace = { ...face, roles: face.roles.map((candidate) => candidate.roleId === role.roleId ? markedRole : candidate) };
    const markedMap = { ...map, faces: [markedFace, map.faces[1]] } as unknown as TechnicalFlatProjectionMap;
    const marked = compileTechnicalFlatSourceGeometry("tee", markedBlock, revisionId, "FRONT_FLAT", markedMap);
    expect(marked.issues).toEqual([]);
    const lineStartRole = { ...role, runs: role.runs.map((run, index) => index ? run : ({ ...run,
      from: { kind: "pattern-mark" as const, markId: "endpoint-line", point: "start" as const },
      to: { kind: "edge-endpoint" as const, edgeId: run.edgeId, endpoint: "end" as const },
    })) };
    const lineStartMap = { ...map, faces: [{ ...face, roles: face.roles.map((candidate) => candidate.roleId === role.roleId ? lineStartRole : candidate) }, map.faces[1]] } as unknown as TechnicalFlatProjectionMap;
    expect(compileTechnicalFlatSourceGeometry("tee", markedBlock, revisionId, "FRONT_FLAT", lineStartMap).issues).toEqual([]);

    for (const recipe of GARMENTS) {
      const optionSets = [defaultGarmentOptions(recipe.options ?? [])];
      for (const option of recipe.options ?? []) {
        optionSets.push({ ...defaultGarmentOptions(recipe.options ?? []), [option.id]: option.min });
        optionSets.push({ ...defaultGarmentOptions(recipe.options ?? []), [option.id]: option.max });
      }
      for (const options of optionSets) {
        const optionBlock = recipe.draft(STANDARD_M, options);
        const optionMap = projectionMap(recipe.name, optionBlock);
        for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
          const output = compileTechnicalFlatSourceGeometry(recipe.name, optionBlock, revisionId, kind, optionMap);
          const visibleHeld = optionMap.faces.find((candidate) => candidate.kind === kind)!.roles
            .some((candidate) => candidate.treatment !== "INTERIOR_HIDDEN" && candidate.heldEdges.length > 0);
          if (visibleHeld) {
            expect(output.issues.some((issue) => issue.code === "UNRESOLVED_PROJECTION_EDGE"), `${recipe.name}/${kind}`).toBe(true);
            expect(output.primitives, `${recipe.name}/${kind}`).toEqual([]);
          } else {
            expect(output.issues, `${recipe.name}/${kind}`).toEqual([]);
          }
        }
      }
    }
  });

  it("reverses cubic controls exactly and withholds a face containing visible held edges", () => {
    const tee = GARMENTS.find((recipe) => recipe.name === "tee")!;
    const block = tee.draft(STANDARD_M, defaultGarmentOptions(tee.options ?? []));
    const map = projectionMap("tee", block);
    const curveRole = map.faces[0].roles.find((role) => role.runs.some((run) =>
      block.roles[role.roleId].edges.some((edge) => edge.name === run.edgeId && edge.kind === "curve")))!;
    const curveRun = curveRole.runs.find((run) => block.roles[curveRole.roleId].edges.some((edge) => edge.name === run.edgeId && edge.kind === "curve"))!;
    const faceWithReverse = {
      ...map,
      faces: map.faces.map((face, index) => index ? face : ({ ...face, roles: face.roles.map((role) => role.roleId !== curveRole.roleId ? role : ({
        ...role, runs: role.runs.map((run) => run.edgeId !== curveRun.edgeId ? run : ({
          ...run,
          from: { kind: "edge-endpoint" as const, edgeId: run.edgeId, endpoint: "end" as const },
          to: { kind: "edge-endpoint" as const, edgeId: run.edgeId, endpoint: "start" as const },
        })),
      })) })),
    } as unknown as TechnicalFlatProjectionMap;
    const reversed = compileTechnicalFlatSourceGeometry("tee", block, revisionId, "FRONT_FLAT", faceWithReverse);
    expect(reversed.issues).toEqual([]);
    const reversedOutline = reversed.primitives.find((primitive) => primitive.id ===
      `flat:tee:FRONT_FLAT:component:${curveRole.roleId}:outline`);
    const sourceCurve = block.roles[curveRole.roleId].edges.find((edge) => edge.name === curveRun.edgeId)!;
    if (sourceCurve.kind !== "curve" || reversedOutline?.kind !== "path") throw new Error("Expected a curved projected run.");
    expect(reversedOutline.commands).toContainEqual({ op: "move", point: sourceCurve.curve.end });
    expect(reversedOutline.commands).toContainEqual({ op: "cubic", control1: sourceCurve.curve.control2,
      control2: sourceCurve.curve.control1, point: sourceCurve.curve.start });

    const firstRole = map.faces[0].roles[0];
    const heldMap = { ...map, faces: map.faces.map((face, index) => index ? face : ({ ...face, roles: face.roles.map((role) =>
      role.roleId === firstRole.roleId ? ({ ...role, runs: role.runs.slice(1), heldEdges: [
        ...role.heldEdges, { edgeId: role.runs[0].edgeId, reason: "Face boundary has unresolved source visibility." },
      ] }) : role) })) } as unknown as TechnicalFlatProjectionMap;
    const held = compileTechnicalFlatSourceGeometry("tee", block, revisionId, "FRONT_FLAT", heldMap);
    expect(held.issues).toContainEqual(expect.objectContaining({ code: "UNRESOLVED_PROJECTION_EDGE" }));
    expect(held.primitives).toEqual([]);
  });

  it("rejects stale maps and preserves explicit interior-hidden roles", () => {
    const polo = GARMENTS.find((recipe) => recipe.name === "polo")!;
    const block = polo.draft(STANDARD_M, defaultGarmentOptions(polo.options ?? []));
    const map = projectionMap("polo", block);
    const stale = { ...map, revisionId: "old-revision" };
    expect(compileTechnicalFlatSourceGeometry("polo", block, revisionId, "FRONT_FLAT", stale).issues)
      .toContainEqual(expect.objectContaining({ code: "REVISION_MISMATCH" }));
    const output = compileTechnicalFlatSourceGeometry("polo", block, revisionId, "FRONT_FLAT", map);
    expect(output.notices).toContainEqual(expect.objectContaining({ sourceId: "pattern:polo:role:buttonholePlacket", reason: "HIDDEN_BY_VIEW" }));
  });

  it("withholds projected geometry when drafted source coordinates or paths are invalid", () => {
    const tee = GARMENTS.find((recipe) => recipe.name === "tee")!;
    const block = tee.draft(STANDARD_M, defaultGarmentOptions(tee.options ?? []));
    const roleId = "front";
    const front = block.roles[roleId];
    const lineIndex = front.edges.findIndex((edge) => edge.kind === "line");
    const badLineEdges = front.edges.map((edge, index) => index === lineIndex && edge.kind === "line"
      ? { ...edge, start: { x: Number.NaN, y: edge.start.y } } : edge);
    const badLineBlock = { ...block, roles: { ...block.roles, [roleId]: { ...front, edges: badLineEdges } } };
    const badLine = compileTechnicalFlatSourceGeometry("tee", badLineBlock, revisionId, "FRONT_FLAT", projectionMap("tee", badLineBlock));
    expect(badLine.issues.some((issue) => issue.code === "INVALID_PROJECTION_MAP"
      || issue.code === "INVALID_VIEW_PAIR_REFLECTION")).toBe(true);
    expect(badLine.primitives).toEqual([]);

    const curveIndex = front.edges.findIndex((edge) => edge.kind === "curve");
    const badCurveEdges = front.edges.map((edge, index) => index === curveIndex && edge.kind === "curve"
      ? { ...edge, curve: { ...edge.curve, control1: { x: Number.POSITIVE_INFINITY, y: edge.curve.control1.y } } } : edge);
    const badCurveBlock = { ...block, roles: { ...block.roles, [roleId]: { ...front, edges: badCurveEdges } } };
    const badCurve = compileTechnicalFlatSourceGeometry("tee", badCurveBlock, revisionId, "FRONT_FLAT", projectionMap("tee", badCurveBlock));
    expect(badCurve.issues.some((issue) => ["INVALID_PROJECTION_MAP", "INVALID_STITCH_ENDPOINT_ORIENTATION",
      "INVALID_LOCAL_Y_REFLECTION"].includes(issue.code))).toBe(true);
    expect(badCurve.primitives).toEqual([]);

    const emptyRoleBlock = { ...block, roles: { ...block.roles, [roleId]: { ...front, edges: [] } } };
    const emptyRole = compileTechnicalFlatSourceGeometry("tee", emptyRoleBlock, revisionId, "FRONT_FLAT", projectionMap("tee", emptyRoleBlock));
    expect(emptyRole.issues.some((issue) => issue.code === "INVALID_PROJECTION_MAP"
      || issue.code === "INVALID_VIEW_PAIR_REFLECTION" || issue.code === "MISSING_STITCH_EDGE")).toBe(true);
    expect(emptyRole.primitives).toEqual([]);
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
