import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting/recipe";
import { STANDARD_M } from "../drafting/measurements";
import { defaultGarmentOptions } from "../drafting/options";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { validateTechnicalFlatProjectionMap, type TechnicalFlatProjectionMap } from "./technical-flat-projection";

const REVISION = "draft-r7";

function validMap(recipeId: string, block: ReturnType<(typeof GARMENTS)[number]["draft"]>): TechnicalFlatProjectionMap {
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
