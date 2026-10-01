import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import { edgeEnd, edgeLength, edgeStart } from "../drafting/piece";
import { cubicPoint } from "../geometry/curve";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import {
  createG04TechnicalFlatProjectionMap,
  edgeParameterAtArclengthFraction,
  G04_NON_MIRRORED_ON_FOLD_ROLES,
  G04_UNRESOLVED_PROJECTION_ROLES,
  resolveFlatProjectionLandmark,
  validateTechnicalFlatProjectionMap,
  type TechnicalFlatProjectionMap,
} from "./technical-flat-projection";

const REVISION = "draft-r7";

function validMap(recipeId: string, block: ReturnType<(typeof GARMENTS)[number]["draft"]>): TechnicalFlatProjectionMap {
  if (recipeId === "skirt") return createG04TechnicalFlatProjectionMap(recipeId, block, REVISION)!;
  const source = G04_TECHNICAL_FLAT_MAPPINGS[recipeId];
  const authored = ["woven-shirt", "tee", "fitted"].includes(recipeId)
    ? createG04TechnicalFlatProjectionMap(recipeId, block, REVISION)! : undefined;
  return {
    version: 1,
    recipeId,
    revisionId: REVISION,
    faces: source.faces.map((face) => ({
      kind: face.kind,
      roles: face.roles.map((role) => {
        const piece = block.roles[role.roleId];
        const hidden = role.treatment === "INTERIOR_HIDDEN";
        const pairReflection = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.physicalPairReflection;
        const viewPairReflection = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.viewPairReflection;
        const oppositeSideReflection = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.oppositeSideReflection;
        const viewBoundaries = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.viewBoundaries;
        const reversedStitchEdges = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.reversedStitchEdges;
        const localYReflection = authored?.faces.find((candidate) => candidate.kind === face.kind)?.roles
          .find((candidate) => candidate.roleId === role.roleId)?.localYReflection;
        const zeroLength = (edge: (typeof piece.edges)[number]) => {
          const start = edge.kind === "line" ? edge.start : edge.curve.start;
          const end = edge.kind === "line" ? edge.end : edge.curve.end;
          return start.x === end.x && start.y === end.y;
        };
        return {
          roleId: role.roleId,
          instanceId: role.roleId,
          treatment: role.treatment,
          runs: hidden ? [] : piece.edges.filter((edge) => !zeroLength(edge)).map((edge) => ({
            edgeId: edge.name,
            from: { kind: "edge-endpoint" as const, edgeId: edge.name, endpoint: "start" as const },
            to: { kind: "edge-endpoint" as const, edgeId: edge.name, endpoint: "end" as const },
          })),
          heldEdges: hidden
            ? piece.edges.map((edge) => ({ edgeId: edge.name, reason: "Interior layer is hidden in this exterior face." }))
            : piece.edges.filter(zeroLength).map((edge) => ({ edgeId: edge.name, reason: "Zero-length source edge has no displayable contour." })),
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

function draft(recipeId: string, options = {}) {
  const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
  const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...options });
  return { recipe, block };
}

describe("validateTechnicalFlatProjectionMap", () => {
  it("requires the exact front sleeve-cap endpoint-order rule for Tee and Fitted", () => {
    for (const recipeId of ["tee", "fitted"] as const) {
      const { block } = draft(recipeId);
      const map = createG04TechnicalFlatProjectionMap(recipeId, block, REVISION)!;
      expect(validateTechnicalFlatProjectionMap(recipeId, block, REVISION, map)).toEqual([]);
      const malformed = structuredClone(map) as unknown as { faces: Array<{ kind: string; roles: Array<{ roleId: string; reversedStitchEdges?: readonly unknown[] }> }> };
      const sleeve = malformed.faces.find((face) => face.kind === "FRONT_FLAT")!.roles.find((role) => role.roleId === "sleeve")!;
      sleeve.reversedStitchEdges = [];
      expect(validateTechnicalFlatProjectionMap(recipeId, block, REVISION, malformed))
        .toContainEqual(expect.objectContaining({ code: "INVALID_STITCH_ENDPOINT_ORIENTATION" }));
      const malformedBack = structuredClone(map) as unknown as { faces: Array<{ kind: string; roles: Array<{
        roleId: string; localYReflection?: { axis: string; basis: string; decisionId: string };
      }> }> };
      const backSleeve = malformedBack.faces.find((face) => face.kind === "BACK_FLAT")!.roles
        .find((role) => role.roleId === "sleeve")!;
      backSleeve.localYReflection = { axis: "LOCAL_Y", basis: "SOURCE_EVIDENCE", decisionId: "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR" };
      expect(validateTechnicalFlatProjectionMap(recipeId, block, REVISION, malformedBack))
        .toContainEqual(expect.objectContaining({ code: "INVALID_LOCAL_Y_REFLECTION" }));
    }
  });

  it("maps the Polo stand at its encoded junction and transfers both collar layers onto exact cubic arclength", () => {
    const { block } = draft("polo");
    const map = createG04TechnicalFlatProjectionMap("polo", block, REVISION)!;
    expect(validateTechnicalFlatProjectionMap("polo", block, REVISION, map)).toEqual([]);
    const collarRole = block.roles.upperCollar!;
    const backBase = collarRole.edges.find((edge) => edge.name === "backCollarBase")!;
    const frontBase = collarRole.edges.find((edge) => edge.name === "frontCollarBase")!;
    const r = edgeLength(backBase) / (edgeLength(backBase) + edgeLength(frontBase));
    for (const face of map.faces) {
      const stand = face.roles.find((role) => role.roleId === "outerStand")!;
      const visibleStandInterval = face.kind === "FRONT_FLAT" ? "frontCollar" : "backCollar";
      const hiddenStandInterval = face.kind === "FRONT_FLAT" ? "backCollar" : "frontCollar";
      expect(stand.runs.map((run) => run.edgeId)).toContain(visibleStandInterval);
      expect(stand.faceExcludedEdges?.map((entry) => entry.edgeId)).toContain(hiddenStandInterval);
      expect(stand.viewBoundaries).toBeUndefined();
      const shoulder = edgeEnd(block.roles.outerStand!.edges.find((edge) => edge.name === "backCollar")!);
      expect(shoulder).toEqual(edgeStart(block.roles.outerStand!.edges.find((edge) => edge.name === "frontCollar")!));
      for (const roleId of ["underCollar", "upperCollar"]) {
        const role = face.roles.find((candidate) => candidate.roleId === roleId)!;
        expect(role.treatment).toBe("VISIBLE_OVERLAY");
        const run = role.runs.find((candidate) => candidate.edgeId === "outer")!;
        const transfer = run.from.kind === "normalized-edge-transfer" ? run.from : run.to;
        expect(transfer.kind).toBe("normalized-edge-transfer");
        if (transfer.kind !== "normalized-edge-transfer") throw new Error("Expected approved collar arclength metadata.");
        expect(transfer.basis).toBe("POLO_COLLAR_BASE");
        expect(transfer.fraction).toBeCloseTo(1 - r, 10);
        const edge = block.roles[roleId]!.edges.find((candidate) => candidate.name === "outer")!;
        expect(edge.kind).toBe("curve");
        if (edge.kind !== "curve") throw new Error("Polo collar exterior must retain its authored cubic.");
        const t = edgeParameterAtArclengthFraction(edge, transfer.fraction)!;
        expect(resolveFlatProjectionLandmark(block, roleId, face.kind, transfer, "outer"))
          .toEqual(cubicPoint(edge.curve, t));
      }
      const underIndex = face.roles.findIndex((role) => role.roleId === "underCollar");
      const upperIndex = face.roles.findIndex((role) => role.roleId === "upperCollar");
      expect(underIndex).toBeLessThan(upperIndex);
    }
  });

  it("covers invalid arclengths and line/cubic endpoint parameter resolution", () => {
    const line = { kind: "line" as const, name: "line", start: { x: 0, y: 0 }, end: { x: 2, y: 0 } };
    const curve = { kind: "curve" as const, name: "curve", curve: {
      start: { x: 0, y: 0 }, control1: { x: 0, y: 1 }, control2: { x: 1, y: 1 }, end: { x: 1, y: 0 },
    } };
    expect(edgeParameterAtArclengthFraction(line, 0.4)).toBe(0.4);
    expect(edgeParameterAtArclengthFraction(curve, 0)).toBe(0);
    expect(edgeParameterAtArclengthFraction(curve, 1)).toBe(1);
    for (const fraction of [Number.NaN, Number.POSITIVE_INFINITY, -0.1, 1.1]) {
      expect(edgeParameterAtArclengthFraction(curve, fraction)).toBeUndefined();
    }
  });

  it("holds Polo collar mappings when the exact source junction or fold axis is broken", () => {
    const { block } = draft("polo");
    const brokenStand = { ...block, roles: { ...block.roles, outerStand: { ...block.roles.outerStand!, edges:
      block.roles.outerStand!.edges.map((edge) => edge.name === "frontCollar"
        ? edge.kind === "line" ? { ...edge, start: { ...edge.start, x: edge.start.x + 0.25 } }
          : { ...edge, curve: { ...edge.curve, start: { ...edge.curve.start, x: edge.curve.start.x + 0.25 } } }
        : edge) } } };
    const standMap = createG04TechnicalFlatProjectionMap("polo", brokenStand, REVISION)!;
    const stand = standMap.faces[0]!.roles.find((role) => role.roleId === "outerStand")!;
    expect(stand.runs).toEqual([]);
    expect(stand.heldEdges).toHaveLength(brokenStand.roles.outerStand!.edges.length);

    const offFold = { ...block, roles: { ...block.roles, upperCollar: { ...block.roles.upperCollar!, onFold: false } } };
    const collarMap = createG04TechnicalFlatProjectionMap("polo", offFold, REVISION)!;
    const collar = collarMap.faces[0]!.roles.find((role) => role.roleId === "upperCollar")!;
    expect(collar.runs).toEqual([]);
    expect(collar.heldEdges).toHaveLength(offFold.roles.upperCollar!.edges.length);

    const missingBase = { ...block, roles: { ...block.roles, upperCollar: { ...block.roles.upperCollar!, edges:
      block.roles.upperCollar!.edges.filter((edge) => edge.name !== "frontCollarBase") } } };
    const missingBaseMap = createG04TechnicalFlatProjectionMap("polo", missingBase, REVISION)!;
    expect(missingBaseMap.faces[0]!.roles.find((role) => role.roleId === "upperCollar")?.runs).toEqual([]);

    const missingOuter = { ...block, roles: { ...block.roles, upperCollar: { ...block.roles.upperCollar!, edges:
      block.roles.upperCollar!.edges.filter((edge) => edge.name !== "outer") } } };
    const missingOuterMap = createG04TechnicalFlatProjectionMap("polo", missingOuter, REVISION)!;
    expect(missingOuterMap.faces[0]!.roles.find((role) => role.roleId === "upperCollar")?.runs).toEqual([]);
  });

  it("splits source-folded Woven collars at the sewn CB-to-shoulder station", () => {
    const { block } = draft("woven-shirt");
    const map = createG04TechnicalFlatProjectionMap("woven-shirt", block, REVISION)!;
    expect(validateTechnicalFlatProjectionMap("woven-shirt", block, REVISION, map)).toEqual([]);
    const backRoleId = block.roles.yoke ? "yoke" : "back";
    const backLength = edgeLength(block.roles[backRoleId]!.edges.find((edge) => edge.name === "neckline")!);
    const frontLength = edgeLength(block.roles.front!.edges.find((edge) => edge.name === "neckline")!);
    const baseFraction = backLength / (backLength + frontLength);
    for (const face of map.faces) {
      for (const roleId of ["outerStand", "upperCollar", "underCollar"]) {
        const role = face.roles.find((candidate) => candidate.roleId === roleId)!;
        if (roleId !== "outerStand") expect(role.treatment).toBe("VISIBLE_OVERLAY");
        expect(role.foldAxisReflection).toMatchObject({ edgeId: "centerBack", axis: "LOCAL_Y", source: "Piece.onFold" });
        const boundaryRun = role.runs.find((run) => run.from.kind === "normalized-edge-transfer"
          || run.to.kind === "normalized-edge-transfer")!;
        const landmark = boundaryRun.from.kind === "normalized-edge-transfer" ? boundaryRun.from : boundaryRun.to;
        if (landmark.kind !== "normalized-edge-transfer") throw new Error("Expected approved normalized collar transfer metadata.");
        expect(landmark.decisionId).toBe("G04-S321-COLLAR-EXTERIOR-ARCLENGTH");
        expect(landmark.basis).toBe("WOVEN_NECKLINE");
        expect(landmark.fraction).toBeCloseTo(roleId === "outerStand" ? baseFraction : 1 - baseFraction, 10);
        const point = resolveFlatProjectionLandmark(block, roleId, face.kind, landmark, boundaryRun.edgeId);
        const receiver = block.roles[roleId]!.edges.find((edge) => edge.name === boundaryRun.edgeId)!;
        if (receiver.kind !== "line") throw new Error("Expected an authored Woven collar line.");
        expect(point).toEqual({
          x: receiver.start.x + (receiver.end.x - receiver.start.x) * landmark.fraction,
          y: receiver.start.y + (receiver.end.y - receiver.start.y) * landmark.fraction,
        });
      }
      expect(face.roles.findIndex((role) => role.roleId === "underCollar"))
        .toBeLessThan(face.roles.findIndex((role) => role.roleId === "upperCollar"));
    }
    const closed = draft("woven-shirt", { sideVentDepth: 0 }).block;
    const closedMap = createG04TechnicalFlatProjectionMap("woven-shirt", closed, REVISION)!;
    for (const face of closedMap.faces) for (const roleId of ["front", "back"]) {
      const role = face.roles.find((candidate) => candidate.roleId === roleId);
      if (!role) continue;
      expect(role.runs.some((run) => run.edgeId === "vent")).toBe(false);
      expect(role.faceExcludedEdges).toContainEqual(expect.objectContaining({ edgeId: "vent", reason: expect.stringContaining("zero-depth") }));
      expect(role.heldEdges.some((held) => held.edgeId === "vent")).toBe(false);
    }
    const open = createG04TechnicalFlatProjectionMap("woven-shirt", block, REVISION)!;
    const openFront = open.faces.find((face) => face.kind === "FRONT_FLAT")!.roles.find((role) => role.roleId === "front")!;
    const openBack = open.faces.find((face) => face.kind === "BACK_FLAT")!.roles.find((role) => role.roleId === "back")!;
    expect(openFront.runs.some((run) => run.edgeId === "vent")).toBe(true);
    expect(openBack.runs.some((run) => run.edgeId === "vent")).toBe(true);
  });

  it("fails closed when Woven collar source seams or closed-vent adjacency are inconsistent", () => {
    const { block } = draft("woven-shirt", { sideVentDepth: 0 });
    const boundaryMap = createG04TechnicalFlatProjectionMap("woven-shirt", block, REVISION)!;
    const collarRole = boundaryMap.faces[0].roles.find((role) => role.roleId === "outerStand")!;
    const collarRun = collarRole.runs.find((run) => run.from.kind === "normalized-edge-transfer")!;
    const resolveBoundary = (input: typeof block, roleId = "outerStand", edgeId = "collar", landmark: unknown = collarRun.from) =>
      resolveFlatProjectionLandmark(input, roleId, "FRONT_FLAT", landmark, edgeId);
    expect(resolveFlatProjectionLandmark(block, "outerStand", "FRONT_FLAT",
      { ...collarRun.from, decisionId: "wrong decision" }, collarRun.edgeId)).toBeUndefined();
    expect(resolveFlatProjectionLandmark(block, "outerStand", "FRONT_FLAT",
      { ...collarRun.from, basis: "POLO_COLLAR_BASE" }, collarRun.edgeId)).toBeUndefined();
    expect(resolveFlatProjectionLandmark(block, "outerStand", "FRONT_FLAT",
      { ...collarRun.from, basis: "UNKNOWN" }, collarRun.edgeId)).toBeUndefined();
    expect(resolveBoundary(block, "pocket")).toBeUndefined();
    expect(resolveBoundary(block, "underCollar", "stand")).toBeUndefined();
    expect(resolveFlatProjectionLandmark(block, "outerStand", "FRONT_FLAT",
      { kind: "edge-endpoint", edgeId: "collar", endpoint: "start" })).toBeDefined();
    const offFold = { ...block, roles: { ...block.roles, outerStand: { ...block.roles.outerStand!, onFold: false } } };
    expect(resolveBoundary(offFold)).toBeUndefined();
    const noAxisRoles = { ...block.roles, outerStand: { ...block.roles.outerStand!, edges:
      block.roles.outerStand!.edges.map((edge) => edge.name === "centerBack" ? { ...edge, name: "renamed-fold" } : edge) } };
    expect(resolveBoundary({ ...block, roles: noAxisRoles })).toBeUndefined();
    const nonLineRoles = { ...block.roles, outerStand: { ...block.roles.outerStand!, edges:
      block.roles.outerStand!.edges.map((edge) => edge.name === "collar" && edge.kind === "line"
        ? { kind: "curve" as const, name: edge.name, curve: { start: edge.start, control1: edge.start, control2: edge.end, end: edge.end } }
        : edge) } };
    expect(resolveBoundary({ ...block, roles: nonLineRoles })).toBeDefined();

    const brokenStitch = (update: (stitch: (typeof block.stitches)[number]) => (typeof block.stitches)[number]) => ({
      ...block, stitches: block.stitches.map((stitch) => stitch.label === "Outer stand ↔ woven neckline" ? update(stitch) : stitch),
    });
    expect(resolveBoundary(brokenStitch((stitch) => ({ ...stitch, ease: { lo: 0, hi: 1 } })))).toBeUndefined();
    expect(resolveBoundary(brokenStitch((stitch) => ({ ...stitch, a: { edges: [] } })))).toBeUndefined();
    expect(resolveBoundary(brokenStitch((stitch) => ({ ...stitch, a: { edges: [{ piece: "front", edge: "neckline" }] } })))).toBeUndefined();
    expect(resolveBoundary(brokenStitch((stitch) => ({ ...stitch, b: { edges: [stitch.b.edges[0]!] } })))).toBeUndefined();
    expect(resolveBoundary(brokenStitch((stitch) => ({ ...stitch, b: { edges: [stitch.b.edges[0]!, { piece: "back", edge: "other" }] } })))).toBeUndefined();

    const missingBase = { ...block, roles: { ...block.roles, underCollar: undefined } } as unknown as typeof block;
    expect(resolveBoundary(missingBase)).toBeUndefined();
    const noFront = { ...block, roles: { ...block.roles, front: undefined } } as unknown as typeof block;
    expect(resolveBoundary(noFront)).toBeUndefined();
    const noYoke = { ...block, roles: { ...block.roles, yoke: undefined, back: undefined } } as unknown as typeof block;
    expect(resolveBoundary(noYoke)).toBeUndefined();
    const noFrontNeck = { ...block, roles: { ...block.roles, front: { ...block.roles.front!, edges:
      block.roles.front!.edges.filter((edge) => edge.name !== "neckline") } } };
    expect(resolveBoundary(noFrontNeck)).toBeUndefined();
    const noYokeNeck = { ...block, roles: { ...block.roles, yoke: { ...block.roles.yoke!, edges:
      block.roles.yoke!.edges.filter((edge) => edge.name !== "neckline") } } };
    expect(resolveBoundary(noYokeNeck)).toBeUndefined();
    const missingExterior = { ...block, roles: { ...block.roles, underCollar: { ...block.roles.underCollar!, edges:
      block.roles.underCollar!.edges.filter((edge) => edge.name !== "outer") } } };
    const missingExteriorMap = createG04TechnicalFlatProjectionMap("woven-shirt", missingExterior, REVISION)!;
    expect(missingExteriorMap.faces[0]!.roles.find((role) => role.roleId === "underCollar")?.runs).toEqual([]);
    const shortStand = { ...block, roles: { ...block.roles, outerStand: { ...block.roles.outerStand!, edges:
      block.roles.outerStand!.edges.map((edge) => edge.name === "neckline" && edge.kind === "line"
        ? { ...edge, end: { ...edge.end, x: edge.end.x + 0.25 } } : edge) } } };
    expect(resolveBoundary(shortStand)).toBeUndefined();
    const outsideStation = { ...block, roles: { ...block.roles, upperCollar: { ...block.roles.upperCollar!, edges:
      block.roles.upperCollar!.edges.map((edge) => edge.name === "outer" && edge.kind === "line"
        ? { ...edge, start: { ...edge.start, x: -0.25 } } : edge) } } };
    expect(resolveBoundary(outsideStation, "upperCollar", "outer")).toBeUndefined();
    const slopedTarget = { ...block, roles: { ...block.roles, upperCollar: { ...block.roles.upperCollar!, edges:
      block.roles.upperCollar!.edges.map((edge) => edge.name === "outer" && edge.kind === "line"
        ? { ...edge, start: { ...edge.start, y: edge.start.y + 0.25 } } : edge) } } };
    expect(resolveBoundary(slopedTarget, "upperCollar", "outer")).toBeUndefined();
    const station = edgeLength(block.roles.yoke!.edges.find((edge) => edge.name === "neckline")!);
    const zeroTarget = { ...block, roles: { ...block.roles, upperCollar: { ...block.roles.upperCollar!, edges:
      block.roles.upperCollar!.edges.map((edge) => edge.name === "outer" && edge.kind === "line"
        ? { ...edge, start: { x: station, y: edge.start.y }, end: { x: station, y: edge.start.y } } : edge) } } };
    expect(resolveBoundary(zeroTarget, "upperCollar", "outer")).toBeUndefined();

    const malformedJunction = { ...block, roles: { ...block.roles,
      yoke: { ...block.roles.yoke!, edges: block.roles.yoke!.edges.map((edge) => edge.name === "neckline" && edge.kind === "curve"
        ? { ...edge, curve: { ...edge.curve, end: { ...edge.curve.end, x: edge.curve.end.x + 0.25 } } } : edge) },
    } };
    const invalidMap = createG04TechnicalFlatProjectionMap("woven-shirt", malformedJunction, REVISION)!;
    expect(validateTechnicalFlatProjectionMap("woven-shirt", malformedJunction, REVISION, invalidMap)).toEqual([]);
    expect(invalidMap.faces.flatMap((face) => face.roles)
      .filter((role) => ["outerStand", "upperCollar", "underCollar"].includes(role.roleId))
      .every((role) => role.runs.length === 0 && role.heldEdges.length > 0)).toBe(true);

    const front = block.roles.front!;
    const badVentAdjacency = { ...block, roles: { ...block.roles,
      front: { ...front, edges: front.edges.map((edge) => edge.name === "hem" && edge.kind === "curve"
        ? { ...edge, curve: { ...edge.curve, start: { ...edge.curve.start, x: edge.curve.start.x + 0.25 } } } : edge) },
    } };
    const badVentMap = createG04TechnicalFlatProjectionMap("woven-shirt", badVentAdjacency, REVISION)!;
    expect(badVentMap.faces[0].roles.find((role) => role.roleId === "front")?.heldEdges)
      .toContainEqual(expect.objectContaining({ edgeId: "vent" }));

    const noCollarAxis = { ...block, roles: { ...block.roles, outerStand: { ...block.roles.outerStand!, edges:
      block.roles.outerStand!.edges.map((edge) => edge.name === "centerBack" ? { ...edge, name: "off-source-axis" } : edge) } } };
    const noCollarAxisMap = createG04TechnicalFlatProjectionMap("woven-shirt", noCollarAxis, REVISION)!;
    const heldStand = noCollarAxisMap.faces[0].roles.find((role) => role.roleId === "outerStand")!;
    expect(heldStand.runs).toEqual([]);
    expect(heldStand.heldEdges).toHaveLength(noCollarAxis.roles.outerStand!.edges.length);
    expect(heldStand.foldAxisReflection).toBeUndefined();
    expect(validateTechnicalFlatProjectionMap("woven-shirt", noCollarAxis, REVISION, noCollarAxisMap)).toEqual([]);

    const roles = { ...block.roles };
    delete roles.pocket;
    const missingRole = { ...block, roles } as unknown as typeof block;
    const missingRoleMap = createG04TechnicalFlatProjectionMap("woven-shirt", missingRole, REVISION)!;
    expect(missingRoleMap.faces[0].roles.find((role) => role.roleId === "pocket"))
      .toMatchObject({ runs: [], heldEdges: [] });
  });

  it("fails closed when a source stitch boundary becomes stale or internally inconsistent", () => {
    const { block } = draft("skirt");
    const map = createG04TechnicalFlatProjectionMap("skirt", block, REVISION)!;
    const waistband = map.faces[0].roles.find((role) => role.roleId === "waistband")!;
    const boundary = waistband.runs[0]!.to;
    if (boundary.kind !== "stitch-interface-boundary") throw new Error("Expected an exact stitch-derived boundary.");
    const resolve = (landmark: unknown, input = block, roleId = "waistband", face = "FRONT_FLAT" as const, edgeId = "seam") =>
      resolveFlatProjectionLandmark(input, roleId, face, landmark, edgeId);
    expect(resolve(boundary)).toBeDefined();
    expect(resolve(null)).toBeUndefined();
    expect(resolve({ kind: "edge-endpoint", edgeId: "absent", endpoint: "start" })).toBeUndefined();
    expect(resolve({ kind: "edge-endpoint", edgeId: "seam", endpoint: "middle" })).toBeUndefined();
    expect(resolve({ kind: "pattern-mark", markId: "absent", point: "at" })).toBeUndefined();
    expect(resolve({ kind: "pattern-mark", markId: "button", point: "at" })).toBeUndefined();
    expect(resolve({ kind: "other" })).toBeUndefined();

    const malformed = { ...boundary, boundarySide: "other" };
    expect(resolve(malformed)).toBeUndefined();
    expect(resolve({ ...boundary, stitchLabel: "missing" })).toBeUndefined();
    expect(resolveFlatProjectionLandmark(block, "waistband", "FRONT_FLAT", { ...boundary, stitchLabel: "missing" })).toBeUndefined();
    const malformedRef = { ...block, stitches: block.stitches.map((stitch) => stitch.label === boundary.stitchLabel
      ? { ...stitch, a: { edges: [{ piece: "front" }, ...stitch.a.edges.slice(1)] } } : stitch) } as unknown as typeof block;
    expect(resolve(boundary, malformedRef)).toBeUndefined();
    const reversedTarget = { ...block, stitches: block.stitches.map((stitch) => stitch.label === boundary.stitchLabel
      ? { ...stitch, b: { edges: stitch.b.edges.map((ref) => "edge" in ref ? { ...ref, reversed: true } : ref) } } : stitch) };
    expect(resolve(boundary, reversedTarget)).toBeDefined();
    const duplicate = { ...block, stitches: [...block.stitches, block.stitches.find((stitch) => stitch.label === boundary.stitchLabel)!] };
    expect(resolve(boundary, duplicate)).toBeUndefined();
    expect(resolve({ ...boundary, afterEdgeIndex: 8 })).toBeUndefined();
    expect(resolve({ ...boundary, pairedEdgeId: "seam" }, block, "waistband", "FRONT_FLAT", "seam")).toBeUndefined();
    expect(resolve({ ...boundary, pairedEdgeId: "fold" }, block, "waistband", "FRONT_FLAT", "fold")).toBeUndefined();
    expect(resolve(boundary, block, "front", "FRONT_FLAT", "waist")).toBeUndefined();
    expect(resolve({ ...boundary, faceSegmentEdgeIndex: 1 })).toBeUndefined();
    const seam = block.roles.waistband!.edges.find((edge) => edge.name === "seam")!;
    const start = seam.kind === "line" ? seam.start : seam.curve.start;
    const end = seam.kind === "line" ? seam.end : seam.curve.end;
    const curvedTarget = { ...block, roles: { ...block.roles, waistband: { ...block.roles.waistband!, edges:
      block.roles.waistband!.edges.map((edge) => edge.name === "seam" ? { kind: "curve" as const, name: "seam",
        curve: { start, control1: { x: start.x - 2, y: start.y }, control2: { x: end.x + 2, y: end.y }, end } } : edge) } } };
    expect(resolve(boundary, curvedTarget)).toBeUndefined();
    const eased = { ...block, stitches: block.stitches.map((stitch) => stitch.label === boundary.stitchLabel
      ? { ...stitch, ease: { lo: 0, hi: 1 } } : stitch) };
    expect(resolve(boundary, eased)).toBeUndefined();
    const brokenJunction = { ...block, stitches: block.stitches.map((stitch) => stitch.label === boundary.stitchLabel
      ? { ...stitch, a: { edges: stitch.a.edges.map((ref, index) => index === 1 && "edge" in ref ? { ...ref, reversed: false } : ref) } } : stitch) };
    expect(resolve(boundary, brokenJunction)).toBeUndefined();
    const unequal = { ...block, roles: { ...block.roles, waistband: { ...block.roles.waistband!, edges:
      block.roles.waistband!.edges.map((edge) => edge.name === "seam" && edge.kind === "line"
        ? { ...edge, end: { ...edge.end, x: edge.end.x + 5 } } : edge) } } };
    expect(resolve(boundary, unequal)).toBeUndefined();
    const sourceSeam = block.roles.waistband!.edges.find((edge) => edge.name === "seam")!;
    if (sourceSeam.kind !== "line") throw new Error("Expected the authored waistband seam to be straight.");
    const splitPoint = { x: sourceSeam.start.x - 5, y: sourceSeam.start.y };
    const multiSegmentRoles = { ...block.roles, waistband: { ...block.roles.waistband!, edges:
      block.roles.waistband!.edges.flatMap((edge) => edge.name === "seam" && edge.kind === "line"
        ? [{ ...edge, end: splitPoint }, { kind: "line" as const, name: "seam2", start: splitPoint, end: edge.end }]
        : [edge]) } };
    const multiSegment = { ...block, roles: multiSegmentRoles, stitches: block.stitches.map((stitch) => stitch.label === boundary.stitchLabel
      ? { ...stitch, b: { edges: [{ piece: "waistband", edge: "seam" }, { piece: "waistband", edge: "seam2" }] } } : stitch) } as unknown as typeof block;
    expect(resolve(boundary, multiSegment, "waistband", "FRONT_FLAT", "seam")).toBeUndefined();
    const noPiece = { ...block, roles: { ...block.roles, waistband: undefined } } as unknown as typeof block;
    expect(resolve(boundary, noPiece)).toBeUndefined();
    const front = block.roles.front!;
    const noCenterAxis = { ...block, roles: { ...block.roles, front: { ...front, onFold: false } } };
    const heldMap = createG04TechnicalFlatProjectionMap("skirt", noCenterAxis, REVISION)!;
    expect(heldMap.faces[0].roles.find((role) => role.roleId === "waistband")?.heldEdges.length).toBe(block.roles.waistband!.edges.length);
  });

  it("validates explicit exclusions, fold axes and view-only boundary metadata", () => {
    const { block } = draft("skirt");
    const map = createG04TechnicalFlatProjectionMap("skirt", block, REVISION)!;
    const updateWaistband = (faceIndex: number, update: (role: TechnicalFlatProjectionMap["faces"][number]["roles"][number]) => unknown) => ({
      ...map,
      faces: map.faces.map((face, index) => index === faceIndex ? { ...face,
        roles: face.roles.map((role) => role.roleId === "waistband" ? update(role) : role) } : face),
    }) as unknown as TechnicalFlatProjectionMap;
    expect(validateTechnicalFlatProjectionMap("skirt", block, REVISION,
      updateWaistband(0, (role) => ({ ...role, faceExcludedEdges: [null] }))).map((issue) => issue.code))
      .toContain("UNKNOWN_EDGE");
    expect(validateTechnicalFlatProjectionMap("skirt", block, REVISION,
      updateWaistband(0, (role) => ({ ...role, faceExcludedEdges: [...(role.faceExcludedEdges ?? []), { edgeId: "missing", reason: "bad" }] })))
      .map((issue) => issue.code)).toContain("UNKNOWN_EDGE");
    expect(validateTechnicalFlatProjectionMap("skirt", block, REVISION,
      updateWaistband(0, (role) => ({ ...role, faceExcludedEdges: role.faceExcludedEdges?.map((edge) => ({ ...edge, reason: " " })) })))
      .map((issue) => issue.code)).toContain("EMPTY_HOLD_REASON");
    expect(validateTechnicalFlatProjectionMap("skirt", block, REVISION,
      updateWaistband(0, (role) => ({ ...role, viewBoundaries: {} }))).map((issue) => issue.code))
      .toContain("INVALID_VIEW_BOUNDARY");
    expect(validateTechnicalFlatProjectionMap("skirt", block, REVISION,
      updateWaistband(0, (role) => ({ ...role, viewBoundaries: [null] }))).map((issue) => issue.code))
      .toContain("INVALID_VIEW_BOUNDARY");
    expect(validateTechnicalFlatProjectionMap("skirt", block, REVISION,
      updateWaistband(0, (role) => ({ ...role, viewBoundaries: [{ id: " ", from: {}, to: {} }] }))).map((issue) => issue.code))
      .toContain("INVALID_VIEW_BOUNDARY");
    expect(validateTechnicalFlatProjectionMap("skirt", block, REVISION,
      updateWaistband(0, (role) => ({ ...role, viewBoundaries: [{ id: "unknown", from: {}, to: {} }] }))).map((issue) => issue.code))
      .toContain("INVALID_VIEW_BOUNDARY");
    const { block: teeBlock } = draft("tee");
    const teeMap = createG04TechnicalFlatProjectionMap("tee", teeBlock, REVISION)!;
    const malformedFillBoundary = { ...teeMap, faces: teeMap.faces.map((face) => face.kind === "FRONT_FLAT" ? { ...face,
      roles: face.roles.map((role) => role.roleId === "sleeve" ? { ...role, viewBoundaries: [{
        ...role.viewBoundaries![0]!, from: { kind: "edge-arclength", edgeId: "hem", fraction: 0.45 },
      }] } : role) } : face) } as unknown as TechnicalFlatProjectionMap;
    expect(validateTechnicalFlatProjectionMap("tee", teeBlock, REVISION, malformedFillBoundary).map((issue) => issue.code))
      .toContain("INVALID_VIEW_BOUNDARY");
    expect(validateTechnicalFlatProjectionMap("skirt", block, REVISION,
      updateWaistband(1, (role) => ({ ...role, foldAxisReflection: { ...role.foldAxisReflection!, axisRoleId: "front" } })))
      .map((issue) => issue.code)).toContain("INVALID_FOLD_AXIS_REFLECTION");
    expect(validateTechnicalFlatProjectionMap("skirt", block, REVISION,
      updateWaistband(0, (role) => ({ ...role, runs: role.runs.slice(1) }))).map((issue) => issue.code))
      .toContain("MISSING_EDGE_ACCOUNTING");
  });

  it("creates source-edge maps for every supported recipe and numeric option endpoint", () => {
    for (const recipe of GARMENTS) {
      const endpointOptions = [undefined, ...(recipe.options ?? []).flatMap((option) => [option.min, option.max].map((value) => ({ [option.id]: value })))];
      for (const options of endpointOptions) {
        const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...options });
        const map = createG04TechnicalFlatProjectionMap(recipe.name, block, REVISION)!;
        expect(validateTechnicalFlatProjectionMap(recipe.name, block, REVISION, map), recipe.name).toEqual([]);
        for (const face of map.faces) {
          for (const role of face.roles) {
            expect(role.instanceId).toBe(role.roleId);
            const piece = block.roles[role.roleId]!;
            expect([...role.runs.map((run) => run.edgeId), ...role.heldEdges.map((edge) => edge.edgeId),
              ...(role.faceExcludedEdges ?? []).map((edge) => edge.edgeId)].sort())
              .toEqual(piece.edges.map((edge) => edge.name).sort());
            if (role.treatment === "INTERIOR_HIDDEN") expect(role.runs).toEqual([]);
            if (G04_UNRESOLVED_PROJECTION_ROLES[recipe.name]?.[role.roleId]) {
              expect(role.runs).toEqual([]);
              expect(role.heldEdges.length + (role.faceExcludedEdges?.length ?? 0)).toBe(piece.edges.length);
            }
          }
        }
      }
    }
  });

  it("maps approved Tee and Fitted sleeve halves without drawing the view partition", () => {
    for (const recipeId of ["tee", "fitted"] as const) {
      const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
      const endpointOptions = [undefined, ...(recipe.options ?? []).flatMap((option) =>
        [option.min, option.max].map((value) => ({ [option.id]: value })))];
      for (const options of endpointOptions) {
        for (const measurements of [STANDARD_M, { ...STANDARD_M, chest: 92, shoulderWidth: 39,
          bicep: 38, length: 66, armholeDepth: 21, sleeveLength: 22, ease: 10 }]) {
        const block = recipe.draft(measurements, { ...defaultGarmentOptions(recipe.options ?? []), ...options });
        const map = createG04TechnicalFlatProjectionMap(recipeId, block, REVISION)!;
        expect(validateTechnicalFlatProjectionMap(recipeId, block, REVISION, map), `${recipeId}:${JSON.stringify(options)}`).toEqual([]);
        for (const face of map.faces) {
          const sleeve = face.roles.find((role) => role.roleId === "sleeve")!;
          expect(sleeve.heldEdges).toEqual([]);
          expect(sleeve.viewBoundaries).toMatchObject([{
            id: "approved-sleeve-area-closure",
            from: { kind: "edge-arclength", edgeId: "hem", fraction: 0.5 },
            to: { kind: "edge-endpoint", edgeId: face.kind === "FRONT_FLAT" ? "capLeft" : "capRight",
              endpoint: face.kind === "FRONT_FLAT" ? "end" : "start" },
            fillOnlyColorway: { source: "MAINTAINER_VIEW_DECISION",
              decisionId: "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR" },
          }]);
          expect(sleeve.viewPairReflection).toMatchObject({
            axisRoleId: face.kind === "FRONT_FLAT" ? "front" : "back",
            edgeId: face.kind === "FRONT_FLAT" ? "centerFront" : "centerBack",
            axis: "ASSEMBLED_BODY_CENTER", source: "MAINTAINER_VIEW_DECISION",
            decisionId: "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR", quantity: 2,
          });
          expect(sleeve.runs.map((run) => run.edgeId)).toEqual(face.kind === "FRONT_FLAT"
            ? ["capLeft", "sideLeft", "hem"] : ["capRight", "sideRight", "hem"]);
          expect(sleeve.faceExcludedEdges?.map((edge) => edge.edgeId)).toEqual(face.kind === "FRONT_FLAT"
            ? ["capRight", "sideRight"] : ["capLeft", "sideLeft"]);
          const hemRun = sleeve.runs.find((run) => run.edgeId === "hem")!;
          expect(hemRun.from.kind).toBe("edge-endpoint");
          expect(hemRun.to).toEqual({ kind: "edge-arclength", edgeId: "hem", fraction: 0.5 });
          const hem = block.roles.sleeve!.edges.find((edge) => edge.name === "hem")!;
          const midpoint = resolveFlatProjectionLandmark(block, "sleeve", face.kind, hemRun.to);
          expect(midpoint?.x).toBeCloseTo((edgeStart(hem).x + edgeEnd(hem).x) / 2, 12);
          expect(midpoint?.y).toBeCloseTo((edgeStart(hem).y + edgeEnd(hem).y) / 2, 12);
        }
        }
      }
    }
  });

  it("rejects a paired sleeve decision that names the wrong body axis or approval", () => {
    const { block } = draft("tee");
    const map = createG04TechnicalFlatProjectionMap("tee", block, REVISION)!;
    const invalid = structuredClone(map) as unknown as {
      faces: { kind: string; roles: { roleId: string; viewPairReflection?: Record<string, unknown> }[] }[];
    };
    const sleeve = invalid.faces.find((face) => face.kind === "FRONT_FLAT")!.roles.find((role) => role.roleId === "sleeve")!;
    sleeve.viewPairReflection!.decisionId = "unapproved";
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, invalid).map((issue) => issue.code))
      .toContain("INVALID_VIEW_PAIR_REFLECTION");
    sleeve.viewPairReflection!.decisionId = "G04-S321-TEE-FITTED-SLEEVE-VIEW-PAIR";
    sleeve.viewPairReflection!.edgeId = "side";
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, invalid).map((issue) => issue.code))
      .toContain("INVALID_VIEW_PAIR_REFLECTION");
  });

  it("resolves only interior fractions on the exact straight hem edge", () => {
    const { block } = draft("tee");
    const piece = block.roles.sleeve!;
    const hem = piece.edges.find((edge) => edge.name === "hem")!;
    const hemStart = edgeStart(hem);
    const hemEnd = edgeEnd(hem);
    const midpoint = resolveFlatProjectionLandmark(block, "sleeve", "FRONT_FLAT",
      { kind: "edge-arclength", edgeId: "hem", fraction: 0.5 });
    expect(midpoint).toEqual({ x: (hemStart.x + hemEnd.x) / 2, y: hemStart.y });
    for (const landmark of [
      { kind: "edge-arclength", edgeId: "sideLeft", fraction: 0.5 },
      { kind: "edge-arclength", edgeId: "hem", fraction: 0 },
      { kind: "edge-arclength", edgeId: "hem", fraction: 1 },
      { kind: "edge-arclength", edgeId: "hem", fraction: Number.NaN },
      { kind: "edge-arclength", edgeId: "other", fraction: 0.5 },
    ]) {
      expect(resolveFlatProjectionLandmark(block, "sleeve", "FRONT_FLAT", landmark, "hem")).toBeUndefined();
    }
  });

  it("records only source-validated local-y fold axes across every recipe option endpoint", () => {
    for (const recipe of GARMENTS) {
      const endpointOptions = [undefined, ...(recipe.options ?? []).flatMap((option) => [option.min, option.max].map((value) => ({ [option.id]: value })))];
      for (const options of endpointOptions) {
        const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...options });
        const map = createG04TechnicalFlatProjectionMap(recipe.name, block, REVISION)!;
        expect(validateTechnicalFlatProjectionMap(recipe.name, block, REVISION, map), recipe.name).toEqual([]);
        for (const face of map.faces) for (const role of face.roles) {
          const piece = block.roles[role.roleId]!;
          if (recipe.name === "skirt" && role.roleId === "waistband") {
            expect(role.foldAxisReflection).toMatchObject({
              axis: "LOCAL_Y", source: "Piece.onFold", axisRoleId: face.kind === "FRONT_FLAT" ? "front" : "back",
              viaStitchLabel: "Waistband (front + back ↔ waistband)",
            });
            expect(role.viewBoundaries).toHaveLength(1);
            expect(role.faceExcludedEdges).toHaveLength(face.kind === "FRONT_FLAT" ? 1 : 2);
            if (face.kind === "BACK_FLAT") {
              expect(role.runs.some((run) => run.edgeId === "fold")).toBe(false);
              expect(role.faceExcludedEdges).toContainEqual(expect.objectContaining({ edgeId: "fold" }));
            }
            expect(role.heldEdges).toEqual([]);
            continue;
          }
          const expectedReflection = piece.onFold && role.treatment !== "INTERIOR_HIDDEN"
            && !G04_UNRESOLVED_PROJECTION_ROLES[recipe.name]?.[role.roleId]
            && !G04_NON_MIRRORED_ON_FOLD_ROLES[recipe.name]?.[role.roleId];
          expect(Boolean(role.foldAxisReflection)).toBe(expectedReflection);
          if (expectedReflection) {
            expect(piece.onFold).toBe(true);
            expect(role.foldAxisReflection).toMatchObject({ axis: "LOCAL_Y", source: "Piece.onFold" });
            const edge = piece.edges.find((candidate) => candidate.name === role.foldAxisReflection?.edgeId);
            expect(edge).toMatchObject({ kind: "line", start: { x: 0 }, end: { x: 0 } });
            expect(role.runs.some((run) => run.edgeId === role.foldAxisReflection?.edgeId)).toBe(false);
            expect(role.faceExcludedEdges).toContainEqual(expect.objectContaining({ edgeId: role.foldAxisReflection?.edgeId }));
            expect(piece.edges.every((candidate) => {
              const points = candidate.kind === "line" ? [candidate.start, candidate.end]
                : [candidate.curve.start, candidate.curve.control1, candidate.curve.control2, candidate.curve.end];
              return points.every((point) => point.x >= 0);
            })).toBe(true);
          } else {
            if (G04_UNRESOLVED_PROJECTION_ROLES[recipe.name]?.[role.roleId]) {
              expect(role.runs).toEqual([]);
              expect(role.heldEdges.length + (role.faceExcludedEdges?.length ?? 0)).toBe(piece.edges.length);
              expect(role.foldAxisReflection).toBeUndefined();
              continue;
            }
            if (G04_NON_MIRRORED_ON_FOLD_ROLES[recipe.name]?.[role.roleId]) {
              expect(role.heldEdges).toEqual([]);
              expect(role.runs).toHaveLength(piece.edges.length);
            }
          }
        }
      }
    }
  });

  it("maps Woven back and yoke from their source-declared center-back folds", () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const endpointOptions = [undefined, ...(recipe.options ?? []).flatMap((option) =>
      [option.min, option.max].map((value) => ({ [option.id]: value })) )];
    for (const options of endpointOptions) {
      const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...options });
      const map = createG04TechnicalFlatProjectionMap(recipe.name, block, REVISION)!;
      expect(validateTechnicalFlatProjectionMap(recipe.name, block, REVISION, map)).toEqual([]);
      const backFace = map.faces.find((face) => face.kind === "BACK_FLAT")!;
      for (const roleId of ["back", "yoke"]) {
        const role = backFace.roles.find((candidate) => candidate.roleId === roleId)!;
        const piece = block.roles[roleId]!;
        expect(piece.onFold).toBe(true);
        expect(role.foldAxisReflection).toMatchObject({
          edgeId: "centerBack", axis: "LOCAL_Y", source: "Piece.onFold",
        });
        expect(role.runs.some((run) => run.edgeId === "centerBack")).toBe(false);
        expect(role.faceExcludedEdges).toContainEqual(expect.objectContaining({ edgeId: "centerBack" }));
        expect(role.heldEdges).toEqual([]);
        expect(piece.edges.every((edge) => {
          const points = edge.kind === "line" ? [edge.start, edge.end]
            : [edge.curve.start, edge.curve.control1, edge.curve.control2, edge.curve.end];
          return points.every((point) => point.x >= 0);
        })).toBe(true);
      }
    }
  });

  it("rejects a fold reflection that does not resolve to the exact drafted fold edge", () => {
    const { block } = draft("tee");
    const map = createG04TechnicalFlatProjectionMap("tee", block, REVISION)!;
    const invalid = { ...map, faces: map.faces.map((face, index) => index === 0 ? { ...face,
      roles: face.roles.map((role) => role.roleId === "front" ? { ...role,
        foldAxisReflection: { ...role.foldAxisReflection!, edgeId: "side" } } : role) } : face) } as unknown as TechnicalFlatProjectionMap;
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, invalid).map((issue) => issue.code))
      .toContain("INVALID_FOLD_AXIS_REFLECTION");
    const malformed = { ...map, faces: map.faces.map((face, index) => index === 0 ? { ...face,
      roles: face.roles.map((role) => role.roleId === "front" ? { ...role,
        foldAxisReflection: { ...role.foldAxisReflection!, edgeId: 23 } } : role) } : face) } as unknown as TechnicalFlatProjectionMap;
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, malformed).map((issue) => issue.code))
      .toContain("INVALID_FOLD_AXIS_REFLECTION");
  });

  it("holds an on-fold role if its explicit source boundary is no longer available", () => {
    const { block } = draft("tee");
    const front = block.roles.front!;
    const invalidBlock = { ...block, roles: { ...block.roles, front: { ...front,
      onFold: true, edges: front.edges.map((edge) => edge.name === "centerFront" ? { ...edge, name: "renamed-boundary" } : edge) } } };
    const map = createG04TechnicalFlatProjectionMap("tee", invalidBlock, REVISION)!;
    expect(map.faces[0].roles.find((role) => role.roleId === "front")?.heldEdges[0]?.reason)
      .toContain("one explicit straight center/fold edge");
    const offAxisBlock = { ...block, roles: { ...block.roles, front: { ...front,
      edges: front.edges.map((edge) => edge.name === "centerFront" && edge.kind === "line"
        ? { ...edge, start: { ...edge.start, x: 0.1 } } : edge) } } };
    const offAxisMap = createG04TechnicalFlatProjectionMap("tee", offAxisBlock, REVISION)!;
    expect(offAxisMap.faces[0].roles.find((role) => role.roleId === "front")?.heldEdges[0]?.reason)
      .toContain("one explicit straight center/fold edge");
    const nonAxisLine = front.edges.find((edge) => edge.name !== "centerFront" && edge.kind === "line")!;
    const crossedBlock = { ...block, roles: { ...block.roles, front: { ...front,
      edges: front.edges.map((edge) => edge.name === nonAxisLine.name && edge.kind === "line"
        ? { ...edge, start: { ...edge.start, x: -0.1 } } : edge) } } };
    const crossedMap = createG04TechnicalFlatProjectionMap("tee", crossedBlock, REVISION)!;
    expect(crossedMap.faces[0].roles.find((role) => role.roleId === "front")?.heldEdges[0]?.reason)
      .toContain("one explicit straight center/fold edge");
  });

  it("holds degenerate role geometry visibly and leaves unsupported recipes unmapped", () => {
    const { block } = draft("tee");
    expect(createG04TechnicalFlatProjectionMap("future", block, REVISION)).toBeUndefined();
    const front = block.roles.front!;
    const degenerate = { ...block, roles: { ...block.roles, front: { ...front,
      edges: front.edges.map((edge, index) => index === 0
        ? { kind: "line" as const, name: "degenerate", start: { x: 1, y: 1 }, end: { x: 1, y: 1 } }
        : edge) } } };
    const map = createG04TechnicalFlatProjectionMap("tee", degenerate, REVISION)!;
    expect(map.faces[0].roles[0]?.heldEdges).toContainEqual({ edgeId: "degenerate",
      reason: "This drafted edge has identical endpoints and cannot form a visible contour." });
    expect(validateTechnicalFlatProjectionMap("tee", degenerate, REVISION, map)).toEqual([]);
  });

  it("accepts explicit per-face edge accounting for every supported recipe and option endpoint", () => {
    for (const recipe of GARMENTS) {
      const endpointOptions = [undefined, ...(recipe.options ?? []).flatMap((option) => [option.min, option.max].map((value) => ({ [option.id]: value })))];
      for (const options of endpointOptions) {
        const block = recipe.draft(STANDARD_M, { ...defaultGarmentOptions(recipe.options ?? []), ...options });
        const mapping = validMap(recipe.name, block);
        expect(validateTechnicalFlatProjectionMap(recipe.name, block, REVISION, mapping), recipe.name).toEqual([]);
      }
    }
  });

  it("binds Woven front-pair reflection to its separate-piece quantity and exact center axis", () => {
    const { block } = draft("woven-shirt");
    const map = createG04TechnicalFlatProjectionMap("woven-shirt", block, REVISION)!;
    const frontFace = map.faces.find((face) => face.kind === "FRONT_FLAT")!;
    const backFace = map.faces.find((face) => face.kind === "BACK_FLAT")!;
    const frontRole = frontFace.roles.find((role) => role.roleId === "front")!;
    expect(frontRole.physicalPairReflection).toEqual({ edgeId: "centerFront", axis: "LOCAL_Y",
      source: "WOVEN_SHIRT_PHYSICAL_ROLES", quantity: 2 });
    expect(frontRole.heldEdges).toEqual([]);
    expect(frontRole.faceExcludedEdges).toContainEqual(expect.objectContaining({ edgeId: "centerFront" }));
    expect(backFace.roles.some((role) => role.physicalPairReflection !== undefined)).toBe(false);
    expect(validateTechnicalFlatProjectionMap("woven-shirt", block, REVISION, map)).toEqual([]);

    const invalidReflection = (reflection: unknown) => {
      const invalid = structuredClone(map) as unknown as { faces: { kind: string; roles: { roleId: string; physicalPairReflection?: unknown }[] }[] };
      const front = invalid.faces.find((face) => face.kind === "FRONT_FLAT")!.roles.find((role) => role.roleId === "front")!;
      if (reflection === undefined) delete front.physicalPairReflection;
      else front.physicalPairReflection = reflection;
      return validateTechnicalFlatProjectionMap("woven-shirt", block, REVISION, invalid)
        .some((issue) => issue.code === "INVALID_PHYSICAL_PAIR_REFLECTION");
    };
    expect(invalidReflection(undefined)).toBe(true);
    expect(invalidReflection(null)).toBe(true);
    expect(invalidReflection({ ...frontRole.physicalPairReflection, quantity: 1 })).toBe(true);
    expect(invalidReflection({ ...frontRole.physicalPairReflection, source: "Piece.onFold" })).toBe(true);
    expect(invalidReflection({ ...frontRole.physicalPairReflection, axis: "LOCAL_X" })).toBe(true);
    expect(invalidReflection({ ...frontRole.physicalPairReflection, edgeId: "shoulder" })).toBe(true);

    const front = block.roles.front!;
    const onFoldBlock = { ...block, roles: { ...block.roles, front: { ...front, onFold: true } } };
    expect(validateTechnicalFlatProjectionMap("woven-shirt", onFoldBlock, REVISION, map)
      .some((issue) => issue.code === "INVALID_PHYSICAL_PAIR_REFLECTION")).toBe(true);
    const renamedAxis = { ...block, roles: { ...block.roles, front: { ...front,
      edges: front.edges.map((edge) => edge.name === "centerFront" ? { ...edge, name: "renamed-axis" } : edge) } } };
    expect(validateTechnicalFlatProjectionMap("woven-shirt", renamedAxis, REVISION, map)
      .some((issue) => issue.code === "INVALID_PHYSICAL_PAIR_REFLECTION")).toBe(true);
    const nonLineAxis = { ...block, roles: { ...block.roles, front: { ...front,
      edges: front.edges.map((edge) => edge.name === "centerFront" && edge.kind === "line"
        ? { kind: "curve" as const, name: edge.name,
          curve: { start: edge.start, control1: edge.start, control2: edge.end, end: edge.end } } : edge) } } };
    expect(validateTechnicalFlatProjectionMap("woven-shirt", nonLineAxis, REVISION, map)
      .some((issue) => issue.code === "INVALID_PHYSICAL_PAIR_REFLECTION")).toBe(true);
    const offAxis = { ...block, roles: { ...block.roles, front: { ...front,
      edges: front.edges.map((edge) => edge.name === "centerFront" && edge.kind === "line"
        ? { ...edge, start: { ...edge.start, x: 0.1 } } : edge) } } };
    expect(validateTechnicalFlatProjectionMap("woven-shirt", offAxis, REVISION, map)
      .some((issue) => issue.code === "INVALID_PHYSICAL_PAIR_REFLECTION")).toBe(true);
    const oppositeSideEdge = front.edges.find((edge) => edge.name !== "centerFront" && edge.kind === "line")!;
    const crossed = { ...block, roles: { ...block.roles, front: { ...front,
      edges: front.edges.map((edge) => edge.name === oppositeSideEdge.name && edge.kind === "line"
        ? { ...edge, start: { ...edge.start, x: -0.1 } } : edge) } } };
    expect(validateTechnicalFlatProjectionMap("woven-shirt", crossed, REVISION, map)
      .some((issue) => issue.code === "INVALID_PHYSICAL_PAIR_REFLECTION")).toBe(true);
    const duplicateAxis = { ...block, roles: { ...block.roles, front: { ...front,
      edges: [...front.edges, front.edges.find((edge) => edge.name === "centerFront")!] } } };
    expect(validateTechnicalFlatProjectionMap("woven-shirt", duplicateAxis, REVISION, map)
      .some((issue) => issue.code === "INVALID_PHYSICAL_PAIR_REFLECTION")).toBe(true);

    const wrongFace = structuredClone(map) as unknown as { faces: { kind: string; roles: { roleId: string; physicalPairReflection?: unknown }[] }[] };
    wrongFace.faces.find((face) => face.kind === "BACK_FLAT")!.roles.find((role) => role.roleId === "back")!.physicalPairReflection = frontRole.physicalPairReflection;
    expect(validateTechnicalFlatProjectionMap("woven-shirt", block, REVISION, wrongFace)
      .some((issue) => issue.code === "INVALID_PHYSICAL_PAIR_REFLECTION")).toBe(true);
    const wrongRecipe = validMap("tee", draft("tee").block) as unknown as { faces: { roles: { roleId: string; physicalPairReflection?: unknown }[] }[] };
    wrongRecipe.faces[0]!.roles.find((role) => role.roleId === "front")!.physicalPairReflection = frontRole.physicalPairReflection;
    expect(validateTechnicalFlatProjectionMap("tee", draft("tee").block, REVISION, wrongRecipe)
      .some((issue) => issue.code === "INVALID_PHYSICAL_PAIR_REFLECTION")).toBe(true);
  });

  it("transfers the Woven sleeve station over its ordered live stitch without drawing a partition", () => {
    const { block } = draft("woven-shirt");
    const map = createG04TechnicalFlatProjectionMap("woven-shirt", block, REVISION)!;
    expect(validateTechnicalFlatProjectionMap("woven-shirt", block, REVISION, map)).toEqual([]);
    const frontBody = edgeLength(block.roles.front!.edges.find((edge) => edge.name === "armhole")!);
    const bodyTotal = frontBody + edgeLength(block.roles.yoke!.edges.find((edge) => edge.name === "armholeUpper")!)
      + edgeLength(block.roles.back!.edges.find((edge) => edge.name === "armholeLower")!);
    const leftLength = edgeLength(block.roles.sleeve!.edges.find((edge) => edge.name === "capLeft")!);
    const rightLength = edgeLength(block.roles.sleeve!.edges.find((edge) => edge.name === "capRight")!);
    const transferred = frontBody / bodyTotal * (leftLength + rightLength);
    const expectedEdge = transferred < leftLength ? "capLeft" : "capRight";
    const expectedFraction = transferred < leftLength ? transferred / leftLength : (transferred - leftLength) / rightLength;
    const front = map.faces.find((face) => face.kind === "FRONT_FLAT")!;
    const back = map.faces.find((face) => face.kind === "BACK_FLAT")!;
    const frontSleeve = front.roles.find((role) => role.roleId === "sleeve")!;
    const backSleeve = back.roles.find((role) => role.roleId === "sleeve")!;
    const frontBoundary = frontSleeve.runs.flatMap((run) => [run.from, run.to])
      .find((landmark) => landmark.kind === "normalized-edge-transfer")!;
    const backBoundary = backSleeve.runs.flatMap((run) => [run.from, run.to])
      .find((landmark) => landmark.kind === "normalized-edge-transfer")!;
    expect(frontBoundary).toMatchObject({ kind: "normalized-edge-transfer", edgeId: expectedEdge,
      fraction: expectedFraction, basis: "WOVEN_SLEEVE_CAP", decisionId: "G04-S321-WOVEN-SLEEVE-CAP-ARCLENGTH" });
    expect(backBoundary).toEqual(frontBoundary);
    const transferEdge = block.roles.sleeve!.edges.find((edge) => edge.name === expectedEdge)!;
    if (transferEdge.kind !== "curve") throw new Error("Expected a Woven sleeve-cap cubic.");
    expect(resolveFlatProjectionLandmark(block, "sleeve", "FRONT_FLAT", frontBoundary, expectedEdge))
      .toEqual(cubicPoint(transferEdge.curve, edgeParameterAtArclengthFraction(transferEdge, expectedFraction)!));
    expect(resolveFlatProjectionLandmark(block, "upperCollar", "FRONT_FLAT", frontBoundary, "outer")).toBeUndefined();
    expect(resolveFlatProjectionLandmark(block, "sleeve", "FRONT_FLAT",
      { ...frontBoundary, fraction: expectedFraction / 2 }, expectedEdge)).toBeUndefined();
    expect(frontSleeve.viewPairReflection).toMatchObject({ quantity: 2, source: "WOVEN_SHIRT_PHYSICAL_ROLES",
      decisionId: "G04-S321-WOVEN-SLEEVE-BAND-VIEW-PAIR", edgeId: "centerFront" });
    expect(backSleeve.viewPairReflection).toMatchObject({ quantity: 2, source: "WOVEN_SHIRT_PHYSICAL_ROLES",
      decisionId: "G04-S321-WOVEN-SLEEVE-BAND-VIEW-PAIR", edgeId: "centerBack" });
    expect(frontSleeve.viewBoundaries).toBeUndefined();
    expect(frontSleeve.faceExcludedEdges?.some((entry) => entry.edgeId === "sideRight")).toBe(true);
    expect(backSleeve.faceExcludedEdges?.some((entry) => entry.edgeId === "sideLeft")).toBe(true);
    for (const face of [front, back]) {
      const band = face.roles.find((role) => role.roleId === "sleeveBand")!;
      expect(band.runs.map((run) => run.edgeId)).toEqual(["top", "sideRight", "bottom", "sideLeft"]);
      expect(band.viewPairReflection?.quantity).toBe(2);
    }
    const backYoke = back.roles.find((role) => role.roleId === "yoke")!;
    expect(back.roles.indexOf(backYoke)).toBeLessThan(back.roles.findIndex((role) => role.roleId === "sleeve"));
  });

  it("maps a Woven sleeve boundary on capRight and holds a missing ordered ease interface", () => {
    const { block } = draft("woven-shirt");
    const front = block.roles.front!;
    const armhole = front.edges.find((edge) => edge.name === "armhole")!;
    if (armhole.kind !== "curve") throw new Error("Expected the authored woven front armhole cubic.");
    const stretched = { ...block, roles: { ...block.roles, front: { ...front, edges: front.edges.map((edge) =>
      edge.name === "armhole" && edge.kind === "curve" ? { ...edge, curve: { ...edge.curve,
        control1: { x: edge.curve.control1.x + 100, y: edge.curve.control1.y } } } : edge) } } };
    const capRightMap = createG04TechnicalFlatProjectionMap("woven-shirt", stretched, REVISION)!;
    expect(validateTechnicalFlatProjectionMap("woven-shirt", stretched, REVISION, capRightMap)).toEqual([]);
    for (const face of capRightMap.faces) {
      const sleeve = face.roles.find((role) => role.roleId === "sleeve")!;
      expect(sleeve.runs.flatMap((run) => [run.from, run.to])
        .some((landmark) => landmark.kind === "normalized-edge-transfer" && landmark.edgeId === "capRight")).toBe(true);
      if (face.kind === "FRONT_FLAT") expect(sleeve.runs.map((run) => run.edgeId)).toContain("capRight");
      else expect(sleeve.runs.some((run) => run.edgeId === "capLeft")).toBe(false);
    }
    const missingInterface = { ...block, stitches: block.stitches.filter((stitch) => stitch.label !== "Woven sleeve-cap ease") };
    const missingMap = createG04TechnicalFlatProjectionMap("woven-shirt", missingInterface, REVISION)!;
    for (const face of missingMap.faces) {
      const sleeve = face.roles.find((role) => role.roleId === "sleeve")!;
      expect(sleeve.runs).toEqual([]);
      expect(sleeve.heldEdges).toHaveLength(block.roles.sleeve!.edges.length);
    }
    const missingFront = { ...block, roles: Object.fromEntries(Object.entries(block.roles).filter(([roleId]) => roleId !== "front")) } as typeof block;
    const missingFrontMap = createG04TechnicalFlatProjectionMap("woven-shirt", missingFront, REVISION)!;
    expect(validateTechnicalFlatProjectionMap("woven-shirt", missingFront, REVISION, missingFrontMap)
      .some((issue) => issue.code === "INVALID_OPPOSITE_SIDE_REFLECTION")).toBe(true);
    const missingBandStitch = { ...block, stitches: block.stitches.filter((stitch) => stitch.label !== "Folded sleeve band ↔ sleeve hem") };
    const missingBandMap = createG04TechnicalFlatProjectionMap("woven-shirt", missingBandStitch, REVISION)!;
    expect(missingBandMap.faces.flatMap((face) => face.roles).filter((role) => role.roleId === "sleeveBand")
      .every((role) => role.runs.length === 0 && role.heldEdges.length === block.roles.sleeveBand!.edges.length)).toBe(true);
    const sleeve = block.roles.sleeve!;
    const cap = sleeve.edges.find((edge) => edge.name === "capLeft")!;
    if (cap.kind !== "curve") throw new Error("Expected a Woven sleeve cap curve.");
    const point = cap.curve.start;
    const degenerate = { kind: "curve" as const, name: "capLeft", curve: { start: point, control1: point, control2: point, end: point } };
    const zeroCap = { ...block, roles: { ...block.roles, sleeve: { ...sleeve,
      edges: sleeve.edges.map((edge) => edge.name === "capLeft" ? degenerate : edge) } } };
    const zeroCapMap = createG04TechnicalFlatProjectionMap("woven-shirt", zeroCap, REVISION)!;
    expect(zeroCapMap.faces.flatMap((face) => face.roles).filter((role) => role.roleId === "sleeve")
      .every((role) => role.runs.length === 0 && role.heldEdges.length === sleeve.edges.length)).toBe(true);
  });

  it("binds Woven closure A to right and left source interfaces and orders the button above the hole", () => {
    const { block } = draft("woven-shirt");
    const map = createG04TechnicalFlatProjectionMap("woven-shirt", block, REVISION)!;
    const front = map.faces.find((face) => face.kind === "FRONT_FLAT")!;
    const holeIndex = front.roles.findIndex((role) => role.roleId === "buttonholePlacket");
    const buttonIndex = front.roles.findIndex((role) => role.roleId === "buttonPlacket");
    const hole = front.roles[holeIndex]!;
    expect(hole.treatment).toBe("VISIBLE_OVERLAY");
    expect(hole.oppositeSideReflection).toEqual({ axisRoleId: "front", edgeId: "centerFront",
      source: "MAINTAINER_VIEW_DECISION", decisionId: "G04-S321-WOVEN-CLOSURE-A", side: "LEFT", quantity: 1 });
    expect(buttonIndex).toBeGreaterThan(holeIndex);
    expect(block.stitches.find((stitch) => stitch.label === "Button placket ↔ right front centre front")?.a.edges)
      .toContainEqual(expect.objectContaining({ piece: "buttonPlacket", edge: "attachmentRaw" }));
    expect(block.stitches.find((stitch) => stitch.label === "Buttonhole placket ↔ left front centre front")?.a.edges)
      .toContainEqual(expect.objectContaining({ piece: "buttonholePlacket", edge: "attachmentRaw" }));
    expect(validateTechnicalFlatProjectionMap("woven-shirt", block, REVISION, map)).toEqual([]);
    const wrongSide = structuredClone(map) as unknown as { faces: { kind: string; roles: { roleId: string; oppositeSideReflection?: Record<string, unknown> }[] }[] };
    wrongSide.faces.find((face) => face.kind === "FRONT_FLAT")!.roles.find((role) => role.roleId === "buttonholePlacket")!
      .oppositeSideReflection!.side = "RIGHT";
    expect(validateTechnicalFlatProjectionMap("woven-shirt", block, REVISION, wrongSide as unknown as TechnicalFlatProjectionMap)
      .some((issue) => issue.code === "INVALID_OPPOSITE_SIDE_REFLECTION")).toBe(true);
  });

  it("binds a map to one supported recipe and the exact live revision", () => {
    const { block } = draft("tee");
    expect(validateTechnicalFlatProjectionMap("unlisted", block, REVISION, {})).toMatchObject([{ code: "UNSUPPORTED_RECIPE" }]);
    expect(validateTechnicalFlatProjectionMap("tee", block, " ", {})).toMatchObject([{ code: "INVALID_REVISION" }]);
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, {})).toMatchObject([{ code: "INVALID_FACES" }]);
    const map = validMap("tee", block);
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, { ...map, revisionId: "draft-r6" })).toMatchObject([{ code: "REVISION_MISMATCH" }]);
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, { ...map, faces: [map.faces[0]] })).toMatchObject([{ code: "INVALID_FACES" }]);
  });

  it("requires both distinct supported faces and exact admitted role membership", () => {
    const { block } = draft("tee");
    const map = validMap("tee", block);
    const duplicateFace = { ...map, faces: [map.faces[0], map.faces[0]] as TechnicalFlatProjectionMap["faces"] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, duplicateFace).map((issue) => issue.code)).toContain("DUPLICATE_FACE");
    const missingFace = { ...map, faces: [map.faces[0], { ...map.faces[1], kind: "FRONT_FLAT" }] as unknown as TechnicalFlatProjectionMap["faces"] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, missingFace).map((issue) => issue.code)).toContain("INVALID_FACES");
    const malformed = { ...map, faces: [null, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, malformed).map((issue) => issue.code)).toContain("INVALID_FACE");
    const missingRole = { ...map, faces: [{ ...map.faces[0], roles: map.faces[0].roles.slice(1) }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, missingRole).map((issue) => issue.code)).toContain("MISSING_ROLE");
    const unexpected = { ...map, faces: [{ ...map.faces[0], roles: [...map.faces[0].roles, map.faces[1].roles[0]] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, unexpected).map((issue) => issue.code)).toContain("UNEXPECTED_ROLE");
    const duplicateRole = { ...map, faces: [{ ...map.faces[0], roles: [...map.faces[0].roles, map.faces[0].roles[0]] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, duplicateRole).map((issue) => issue.code)).toContain("DUPLICATE_ROLE");
    const wrongTreatment = { ...map, faces: [{ ...map.faces[0], roles: map.faces[0].roles.map((role) => ({ ...role, treatment: "VISIBLE_OVERLAY" as const })) }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, wrongTreatment).map((issue) => issue.code)).toContain("TREATMENT_MISMATCH");
  });

  it("requires unique named component instances per face", () => {
    const { block } = draft("tee");
    const map = validMap("tee", block);
    const noInstance = { ...map, faces: [{ ...map.faces[0], roles: map.faces[0].roles.map((role, index) => index ? role : { ...role, instanceId: " " }) }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, noInstance).map((issue) => issue.code)).toContain("MISSING_INSTANCE");
    const duplicate = { ...map, faces: [{ ...map.faces[0], roles: map.faces[0].roles.map((role) => ({ ...role, instanceId: "same" })) }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, duplicate).map((issue) => issue.code)).toContain("DUPLICATE_INSTANCE");
    const inconsistent = { ...map, faces: [map.faces[0], { ...map.faces[1], roles: map.faces[1].roles.map((role) => role.roleId === "sleeve" ? { ...role, instanceId: "sleeve-back" } : role) }] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, inconsistent).map((issue) => issue.code)).toContain("INSTANCE_MISMATCH");
  });

  it("accounts for each current edge exactly once as a run or visible hold", () => {
    const { block } = draft("tee");
    const map = validMap("tee", block);
    const role = map.faces[0].roles[0];
    const missing = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: role.runs.slice(1) }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, missing).map((issue) => issue.code)).toContain("MISSING_EDGE_ACCOUNTING");
    const duplicateEdgeId = role.runs[1].edgeId;
    const duplicateRun = { ...role.runs[0], edgeId: duplicateEdgeId,
      from: { kind: "edge-endpoint" as const, edgeId: duplicateEdgeId, endpoint: "start" as const },
      to: { kind: "edge-endpoint" as const, edgeId: duplicateEdgeId, endpoint: "end" as const } };
    const duplicate = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: [role.runs[0], duplicateRun, ...role.runs.slice(1)] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, duplicate).map((issue) => issue.code)).toContain("DUPLICATE_EDGE_ACCOUNTING");
    const unknown = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, heldEdges: [{ edgeId: "no-edge", reason: "unmapped" }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, unknown).map((issue) => issue.code)).toContain("UNKNOWN_EDGE");
    const noReason = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: role.runs.slice(0, 1), heldEdges: role.runs.slice(1).map((run) => ({ edgeId: run.edgeId, reason: " " })) }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, noReason).map((issue) => issue.code)).toContain("EMPTY_HOLD_REASON");
  });

  it("rejects guessed, stale, mismatched, or unsupported run landmarks", () => {
    const { block } = draft("tee");
    const map = validMap("tee", block);
    const role = map.faces[0].roles[0];
    const run = role.runs[0];
    const endpointMismatch = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: [{ ...run, from: { kind: "edge-endpoint", edgeId: "wrong", endpoint: "start" } }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, endpointMismatch).map((issue) => issue.code)).toContain("LANDMARK_EDGE_MISMATCH");
    const invalidEndpoint = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: [{ ...run, from: { kind: "edge-endpoint", edgeId: run.edgeId, endpoint: "middle" } }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, invalidEndpoint).map((issue) => issue.code)).toContain("INVALID_RUN_LANDMARK");
    const rolePiece = block.roles[role.roleId];
    const edge = rolePiece.edges.find((candidate) => candidate.name === run.edgeId)!;
    const badMarkSelector = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: [{ ...run, from: { kind: "pattern-mark", markId: "missing", point: "middle" } }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, badMarkSelector).map((issue) => issue.code)).toContain("INVALID_RUN_LANDMARK");
    const noMarkPoint = { ...block, roles: { ...block.roles, [role.roleId]: { ...rolePiece, marks: [{ kind: "placementPoint" as const, name: "point-only", at: edge.kind === "line" ? edge.start : edge.curve.start }] } } };
    const wrongSelector = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: [{ ...run, from: { kind: "pattern-mark", markId: "point-only", point: "start" } }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", noMarkPoint, REVISION, wrongSelector).map((issue) => issue.code)).toContain("INVALID_RUN_LANDMARK");
    const unknownKind = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: [{ ...run, from: { kind: "coordinate", x: 1, y: 2 } }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, unknownKind).map((issue) => issue.code)).toContain("INVALID_RUN_LANDMARK");
    const markAtEnd = { kind: "placementPoint" as const, name: "edge-tip", at: edge.kind === "line" ? edge.start : edge.curve.start };
    const withMark = { ...block, roles: { ...block.roles, [role.roleId]: { ...rolePiece, marks: [...(rolePiece.marks ?? []), markAtEnd] } } };
    const markRun = { ...run, from: { kind: "pattern-mark" as const, markId: "edge-tip", point: "at" as const } };
    const marked = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: [markRun, ...role.runs.slice(1)] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", withMark, REVISION, marked)).toEqual([]);
    const lineMark = { kind: "placementLine" as const, name: "edge-line", start: edge.kind === "line" ? edge.start : edge.curve.start, end: edge.kind === "line" ? edge.end : edge.curve.end };
    const withLineMark = { ...block, roles: { ...block.roles, [role.roleId]: { ...rolePiece, marks: [lineMark] } } };
    for (const [selector, expected] of [["start", edge.kind === "line" ? edge.start : edge.curve.start], ["end", edge.kind === "line" ? edge.end : edge.curve.end]] as const) {
      const opposite = selector === "start" ? "end" : "start";
      const lineMarkRun = { ...run, from: { kind: "pattern-mark" as const, markId: "edge-line", point: selector },
        to: { kind: "edge-endpoint" as const, edgeId: run.edgeId, endpoint: opposite } };
      const lineMarked = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: [lineMarkRun, ...role.runs.slice(1)] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
      expect(validateTechnicalFlatProjectionMap("tee", withLineMark, REVISION, lineMarked)).toEqual([]);
      expect(lineMarkRun.from.point).toBe(selector);
      expect(expected).toBeDefined();
    }
    const invalidLineMarkRun = { ...run, from: { kind: "pattern-mark" as const, markId: "edge-line", point: "at" as const } };
    const invalidLineMark = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: [invalidLineMarkRun, ...role.runs.slice(1)] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", withLineMark, REVISION, invalidLineMark).map((issue) => issue.code)).toContain("INVALID_RUN_LANDMARK");
    const offEdge = { ...block, roles: { ...block.roles, [role.roleId]: { ...rolePiece, marks: [{ kind: "placementPoint" as const, name: "off-edge", at: { x: 999, y: 999 } }] } } };
    const offEdgeMap = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: [{ ...run, from: { kind: "pattern-mark", markId: "off-edge", point: "at" } }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", offEdge, REVISION, offEdgeMap).map((issue) => issue.code)).toContain("LANDMARK_NOT_ON_EDGE");
    const badSelector = { ...map, faces: [{ ...map.faces[0], roles: [{ ...role, runs: [{ ...run, from: { kind: "pattern-mark", markId: "missing", point: "at" } }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, badSelector).map((issue) => issue.code)).toContain("INVALID_RUN_LANDMARK");
    const hiddenRole = draft("polo");
    const hiddenMap = validMap("polo", hiddenRole.block);
    const hiddenFace = hiddenMap.faces[0];
    const hidden = hiddenFace.roles.find((candidate) => candidate.treatment === "INTERIOR_HIDDEN")!;
    const falseRun = hiddenMap.faces[0].roles.map((candidate) => candidate.roleId === hidden.roleId ? { ...candidate, runs: [{ edgeId: hiddenRole.block.roles[hidden.roleId].edges[0].name, from: run.from, to: run.to }] } : candidate);
    const misleading = { ...hiddenMap, faces: [{ ...hiddenFace, roles: falseRun }, hiddenMap.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("polo", hiddenRole.block, REVISION, misleading).map((issue) => issue.code)).toContain("RUN_ON_HIDDEN_ROLE");
  });

  it("fails closed for malformed role and edge-accounting records", () => {
    const { block } = draft("tee");
    const map = validMap("tee", block);
    const malformedRole = { ...map, faces: [{ ...map.faces[0], roles: [null, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, malformedRole).map((issue) => issue.code)).toContain("UNEXPECTED_ROLE");
    const blankRoleId = { ...map, faces: [{ ...map.faces[0], roles: [{ roleId: "" }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, blankRoleId).map((issue) => issue.code)).toContain("UNEXPECTED_ROLE");
    const noArrays = { ...map, faces: [{ ...map.faces[0], roles: [{ ...map.faces[0].roles[0], runs: null }] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, noArrays).map((issue) => issue.code)).toContain("MISSING_EDGE_ACCOUNTING");
    const malformedRun = { ...map, faces: [{ ...map.faces[0], roles: [{ ...map.faces[0].roles[0], runs: [null] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, malformedRun).map((issue) => issue.code)).toContain("UNKNOWN_EDGE");
    const malformedHold = { ...map, faces: [{ ...map.faces[0], roles: [{ ...map.faces[0].roles[0], runs: [], heldEdges: [null] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, malformedHold).map((issue) => issue.code)).toContain("UNKNOWN_EDGE");
    const malformedLandmark = { ...map, faces: [{ ...map.faces[0], roles: [{ ...map.faces[0].roles[0], runs: [{ ...map.faces[0].roles[0].runs[0], from: null }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, malformedLandmark).map((issue) => issue.code)).toContain("INVALID_RUN_LANDMARK");
    const edgeRun = map.faces[0].roles[0].runs[0];
    const noEdge = { ...map, faces: [{ ...map.faces[0], roles: [{ ...map.faces[0].roles[0], runs: [{ ...edgeRun, edgeId: "missing" }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, noEdge).map((issue) => issue.code)).toContain("UNKNOWN_EDGE");
    const malformedEdgeId = { ...map, faces: [{ ...map.faces[0], roles: [{ ...map.faces[0].roles[0], runs: [{ ...edgeRun, edgeId: 12 }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, malformedEdgeId).map((issue) => issue.code)).toContain("UNKNOWN_EDGE");
    const sameEndpoint = { ...map, faces: [{ ...map.faces[0], roles: [{ ...map.faces[0].roles[0], runs: [{ ...edgeRun, to: edgeRun.from }] }, ...map.faces[0].roles.slice(1)] }, map.faces[1]] };
    expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, sameEndpoint).map((issue) => issue.code)).toContain("INVALID_RUN_LANDMARK");
    const missingBlockRole = { ...block, roles: Object.fromEntries(Object.entries(block.roles).filter(([roleId]) => roleId !== map.faces[0].roles[0].roleId)) };
    expect(validateTechnicalFlatProjectionMap("tee", missingBlockRole, REVISION, map).map((issue) => issue.code)).toContain("UNEXPECTED_ROLE");
  });

  it("reports an admitted recipe-face invariant violation as invalid", () => {
    const { block } = draft("tee");
    const original = G04_TECHNICAL_FLAT_MAPPINGS.tee;
    const map = validMap("tee", block);
    try {
      (G04_TECHNICAL_FLAT_MAPPINGS as Record<string, typeof original>).tee = { ...original, faces: [original.faces[0]] as unknown as typeof original.faces };
      expect(validateTechnicalFlatProjectionMap("tee", block, REVISION, map).map((issue) => issue.code)).toContain("INVALID_FACE");
    } finally {
      (G04_TECHNICAL_FLAT_MAPPINGS as Record<string, typeof original>).tee = original;
    }
  });
});
