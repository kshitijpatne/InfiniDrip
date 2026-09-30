import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import {
  createG04TechnicalFlatProjectionMap,
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
  return {
    version: 1,
    recipeId,
    revisionId: REVISION,
    faces: source.faces.map((face) => ({
      kind: face.kind,
      roles: face.roles.map((role) => {
        const piece = block.roles[role.roleId];
        const hidden = role.treatment === "INTERIOR_HIDDEN";
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
            if (G04_UNRESOLVED_PROJECTION_ROLES[recipe.name]?.[role.roleId]) expect(role.heldEdges.length).toBe(piece.edges.length);
          }
        }
      }
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
              expect(role.heldEdges).toHaveLength(piece.edges.length);
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
