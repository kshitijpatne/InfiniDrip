import { edgeEnd, edgeStart, type Edge, type Piece } from "../drafting/piece";
import type { Block } from "../drafting/block";
import { G04_TECHNICAL_FLAT_MAPPINGS, type FlatRoleTreatment } from "./technical-flat-mapping";
import type { TechnicalFlatViewKind } from "./technical-flat";

export type FlatProjectionLandmark =
  | { readonly kind: "edge-endpoint"; readonly edgeId: string; readonly endpoint: "start" | "end" }
  | { readonly kind: "pattern-mark"; readonly markId: string; readonly point: "at" | "start" | "end" };

export interface FlatProjectionEdgeRun {
  readonly edgeId: string;
  readonly from: FlatProjectionLandmark;
  readonly to: FlatProjectionLandmark;
}

export interface FlatProjectionHeldEdge {
  readonly edgeId: string;
  readonly reason: string;
}

export interface FlatProjectionRole {
  readonly roleId: string;
  /** A logical garment-component identity shared by its front/back projections. */
  readonly instanceId: string;
  readonly treatment: FlatRoleTreatment;
  readonly runs: readonly FlatProjectionEdgeRun[];
  /** Every unprojected source edge remains accounted for as an explicit hold. */
  readonly heldEdges: readonly FlatProjectionHeldEdge[];
}

export interface FlatProjectionFace {
  readonly kind: TechnicalFlatViewKind;
  readonly roles: readonly FlatProjectionRole[];
}

/** Explicit edge-to-face metadata. Revision binding is supplied by the exact
 * live draft and must match before any mapped geometry can be emitted. */
export interface TechnicalFlatProjectionMap {
  readonly version: 1;
  readonly recipeId: string;
  readonly revisionId: string;
  readonly faces: readonly [FlatProjectionFace, FlatProjectionFace];
}

/** Source roles whose face-visible contour cannot be split from existing
 * authored edge/mark landmarks. Keep the whole affected face unresolved until
 * construction-source landmarks and instance rules are available. */
export const G04_UNRESOLVED_PROJECTION_ROLES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  polo: {
    outerStand: "The stand's exterior contour has no authored front/back split landmark.",
    upperCollar: "The collar's exterior contour has no authored front/back split landmark.",
  },
  "woven-shirt": {
    outerStand: "The stand's exterior contour has no authored front/back split landmark.",
    upperCollar: "The collar's exterior contour has no authored front/back split landmark.",
  },
};

/** Build the current per-recipe map from explicit V01 role membership and the
 * exact drafted edges. Whole-role contours are included only where the role
 * map defines their face membership; known unsplittable visible roles and
 * zero-length edges remain explicit holds. */
export function createG04TechnicalFlatProjectionMap(
  recipeId: string,
  block: Block,
  revisionId: string,
): TechnicalFlatProjectionMap | undefined {
  const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipeId];
  if (!mapping) return undefined;
  return {
    version: 1,
    recipeId,
    revisionId,
    faces: mapping.faces.map((face) => ({
      kind: face.kind,
      roles: face.roles.map((role) => {
        const piece = block.roles[role.roleId];
        if (!piece) {
          return { roleId: role.roleId, instanceId: role.roleId, treatment: role.treatment, runs: [], heldEdges: [] };
        }
        const heldRoleReason = role.treatment === "INTERIOR_HIDDEN"
          ? `Interior role “${role.roleId}” is intentionally hidden in this exterior view.`
          : G04_UNRESOLVED_PROJECTION_ROLES[recipeId]?.[role.roleId];
        const runs: FlatProjectionEdgeRun[] = [];
        const heldEdges: FlatProjectionHeldEdge[] = [];
        for (const edge of piece.edges) {
          const start = edgeStart(edge);
          const end = edgeEnd(edge);
          if (heldRoleReason) {
            heldEdges.push({ edgeId: edge.name, reason: heldRoleReason });
          } else if (start.x === end.x && start.y === end.y) {
            heldEdges.push({ edgeId: edge.name, reason: "This drafted edge has identical endpoints and cannot form a visible contour." });
          } else {
            runs.push({
              edgeId: edge.name,
              from: { kind: "edge-endpoint", edgeId: edge.name, endpoint: "start" },
              to: { kind: "edge-endpoint", edgeId: edge.name, endpoint: "end" },
            });
          }
        }
        return { roleId: role.roleId, instanceId: role.roleId, treatment: role.treatment, runs, heldEdges };
      }),
    })) as unknown as TechnicalFlatProjectionMap["faces"],
  };
}

export type FlatProjectionIssueCode =
  | "UNSUPPORTED_RECIPE" | "INVALID_REVISION" | "REVISION_MISMATCH" | "INVALID_FACES"
  | "INVALID_FACE" | "DUPLICATE_FACE" | "MISSING_ROLE" | "UNEXPECTED_ROLE"
  | "DUPLICATE_ROLE" | "MISSING_INSTANCE" | "DUPLICATE_INSTANCE" | "INSTANCE_MISMATCH" | "TREATMENT_MISMATCH"
  | "MISSING_EDGE_ACCOUNTING" | "DUPLICATE_EDGE_ACCOUNTING" | "UNKNOWN_EDGE"
  | "INVALID_RUN_LANDMARK" | "LANDMARK_ROLE_MISMATCH" | "LANDMARK_EDGE_MISMATCH"
  | "LANDMARK_NOT_ON_EDGE" | "EMPTY_HOLD_REASON" | "RUN_ON_HIDDEN_ROLE";

export interface FlatProjectionIssue {
  readonly code: FlatProjectionIssueCode;
  readonly sourceId: string;
  readonly message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function samePoint(a: { readonly x: number; readonly y: number }, b: { readonly x: number; readonly y: number }): boolean {
  return a.x === b.x && a.y === b.y;
}

function pointAtEdgeEnd(edge: Edge, end: "start" | "end") {
  return end === "start" ? edgeStart(edge) : edgeEnd(edge);
}

function pointForLandmark(
  roleId: string,
  edge: Edge,
  landmark: unknown,
  piece: Piece,
  issues: FlatProjectionIssue[],
  sourceId: string,
) {
  if (!isRecord(landmark) || typeof landmark.kind !== "string") {
    issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: "Projection run has a malformed source landmark." });
    return undefined;
  }
  if (landmark.kind === "edge-endpoint") {
    if (landmark.edgeId !== edge.name) {
      issues.push({ code: "LANDMARK_EDGE_MISMATCH", sourceId, message: "Endpoint landmark must name the run's exact drafted edge." });
      return undefined;
    }
    if (landmark.endpoint !== "start" && landmark.endpoint !== "end") {
      issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: "Endpoint landmark must select start or end." });
      return undefined;
    }
    return pointAtEdgeEnd(edge, landmark.endpoint);
  }
  if (landmark.kind === "pattern-mark") {
    if (typeof landmark.markId !== "string" || landmark.markId.length === 0
      || (landmark.point !== "at" && landmark.point !== "start" && landmark.point !== "end")) {
      issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: "Pattern-mark landmark needs a mark ID and valid point selector." });
      return undefined;
    }
    const mark = piece.marks?.find((candidate) => candidate.name === landmark.markId);
    if (!mark) {
      issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: `Pattern mark “${landmark.markId}” does not resolve in role “${roleId}”.` });
      return undefined;
    }
    const point = "at" in mark
      ? landmark.point === "at" ? mark.at : undefined
      : landmark.point === "start" ? mark.start : landmark.point === "end" ? mark.end : undefined;
    if (!point) {
      issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: `Pattern mark “${landmark.markId}” has no selected ${String(landmark.point)} point.` });
      return undefined;
    }
    if (!samePoint(point, edgeStart(edge)) && !samePoint(point, edgeEnd(edge))) {
      issues.push({ code: "LANDMARK_NOT_ON_EDGE", sourceId, message: `Pattern mark “${landmark.markId}” is not an exact endpoint of drafted edge “${edge.name}”; an interior split is unsupported.` });
      return undefined;
    }
    return point;
  }
  issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: "Unsupported source landmark kind." });
  return undefined;
}

function validateRole(
  faceKind: TechnicalFlatViewKind,
  mappingRole: unknown,
  block: Block,
  expectedTreatment: FlatRoleTreatment,
  usedInstances: Set<string>,
  issues: FlatProjectionIssue[],
) {
  const roleHint = isRecord(mappingRole) && typeof mappingRole.roleId === "string" ? mappingRole.roleId : "?";
  const sourceId = `${faceKind}:${roleHint}`;
  if (!isRecord(mappingRole) || typeof mappingRole.roleId !== "string") {
    issues.push({ code: "UNEXPECTED_ROLE", sourceId, message: "Projection role must identify a mapped drafted role." });
    return;
  }
  const roleId = mappingRole.roleId;
  const piece = block.roles[roleId];
  if (!piece) {
    issues.push({ code: "UNEXPECTED_ROLE", sourceId, message: `Projection role “${roleId}” is absent from the exact drafted block.` });
    return;
  }
  if (mappingRole.treatment !== expectedTreatment) {
    issues.push({ code: "TREATMENT_MISMATCH", sourceId, message: `Projection treatment for “${roleId}” must match the admitted role map.` });
  }
  if (typeof mappingRole.instanceId !== "string" || mappingRole.instanceId.trim().length === 0) {
    issues.push({ code: "MISSING_INSTANCE", sourceId, message: `Role “${roleId}” needs an explicit physical component instance ID.` });
  } else if (usedInstances.has(mappingRole.instanceId)) {
    issues.push({ code: "DUPLICATE_INSTANCE", sourceId, message: `Component instance “${mappingRole.instanceId}” is repeated in ${faceKind}.` });
  } else {
    usedInstances.add(mappingRole.instanceId);
  }
  if (!Array.isArray(mappingRole.runs) || !Array.isArray(mappingRole.heldEdges)) {
    issues.push({ code: "MISSING_EDGE_ACCOUNTING", sourceId, message: `Role “${roleId}” must list projected runs and explicit held edges.` });
    return;
  }
  if (expectedTreatment === "INTERIOR_HIDDEN" && mappingRole.runs.length > 0) {
    issues.push({ code: "RUN_ON_HIDDEN_ROLE", sourceId, message: `Hidden interior role “${roleId}” cannot emit exterior edge runs.` });
  }
  const accounted = new Set<string>();
  const account = (edgeId: unknown, category: "run" | "hold") => {
    if (typeof edgeId !== "string" || edgeId.length === 0 || !piece.edges.some((edge) => edge.name === edgeId)) {
      issues.push({ code: "UNKNOWN_EDGE", sourceId, message: `Projection ${category} references an edge missing from “${roleId}”.` });
      return;
    }
    if (accounted.has(edgeId)) {
      issues.push({ code: "DUPLICATE_EDGE_ACCOUNTING", sourceId, message: `Source edge “${roleId}.${edgeId}” is accounted for more than once.` });
      return;
    }
    accounted.add(edgeId);
  };
  for (const run of mappingRole.runs) {
    if (!isRecord(run)) {
      issues.push({ code: "UNKNOWN_EDGE", sourceId, message: `Projection run for “${roleId}” is malformed.` });
      continue;
    }
    account(run.edgeId, "run");
    const edge = typeof run.edgeId === "string" ? piece.edges.find((candidate) => candidate.name === run.edgeId) : undefined;
    if (!edge) continue;
    const from = pointForLandmark(roleId, edge, run.from, piece, issues, sourceId);
    const to = pointForLandmark(roleId, edge, run.to, piece, issues, sourceId);
    if (from && to && samePoint(from, to)) {
      issues.push({ code: "INVALID_RUN_LANDMARK", sourceId, message: `Run on “${roleId}.${edge.name}” must have distinct source endpoints.` });
    }
  }
  for (const hold of mappingRole.heldEdges) {
    if (!isRecord(hold)) {
      issues.push({ code: "UNKNOWN_EDGE", sourceId, message: `Held edge for “${roleId}” is malformed.` });
      continue;
    }
    account(hold.edgeId, "hold");
    if (typeof hold.reason !== "string" || hold.reason.trim().length === 0) {
      issues.push({ code: "EMPTY_HOLD_REASON", sourceId, message: `Held edge on “${roleId}” needs an actionable visible reason.` });
    }
  }
  for (const edge of piece.edges) {
    if (!accounted.has(edge.name)) {
      issues.push({ code: "MISSING_EDGE_ACCOUNTING", sourceId: `${sourceId}:${edge.name}`, message: `Source edge “${roleId}.${edge.name}” is neither projected nor held.` });
    }
  }
}

/** Validate a recipe's exact per-face edge map against its current drafted
 * topology. Every source edge is either a fully source-bounded run or an
 * explicit hold; interior splits require authored source landmarks. */
export function validateTechnicalFlatProjectionMap(
  recipeId: string,
  block: Block,
  liveRevisionId: string,
  input: unknown,
): FlatProjectionIssue[] {
  const base = G04_TECHNICAL_FLAT_MAPPINGS[recipeId];
  if (!base) return [{ code: "UNSUPPORTED_RECIPE", sourceId: recipeId, message: `Recipe “${recipeId}” has no admitted G04 mapping.` }];
  if (typeof liveRevisionId !== "string" || liveRevisionId.trim().length === 0) {
    return [{ code: "INVALID_REVISION", sourceId: recipeId, message: "Projection mapping requires the live design revision ID." }];
  }
  if (!isRecord(input) || input.version !== 1 || input.recipeId !== recipeId
    || typeof input.revisionId !== "string" || !Array.isArray(input.faces)) {
    return [{ code: "INVALID_FACES", sourceId: recipeId, message: "Projection map must have version 1, the exact recipe/revision, and two face records." }];
  }
  if (input.revisionId !== liveRevisionId) {
    return [{ code: "REVISION_MISMATCH", sourceId: recipeId, message: "Projection metadata belongs to a different live design revision." }];
  }
  if (input.faces.length !== 2) {
    return [{ code: "INVALID_FACES", sourceId: recipeId, message: "Projection map must define exactly front and back faces." }];
  }
  const issues: FlatProjectionIssue[] = [];
  const faceKinds = new Set<string>();
  const instancesByRole = new Map<string, string>();
  for (const [index, rawFace] of input.faces.entries()) {
    if (!isRecord(rawFace) || (rawFace.kind !== "FRONT_FLAT" && rawFace.kind !== "BACK_FLAT") || !Array.isArray(rawFace.roles)) {
      issues.push({ code: "INVALID_FACE", sourceId: `${recipeId}:face:${index}`, message: "Projection face must identify a front/back kind and role list." });
      continue;
    }
    const faceKind = rawFace.kind;
    if (faceKinds.has(faceKind)) issues.push({ code: "DUPLICATE_FACE", sourceId: faceKind, message: `Projection map repeats ${faceKind}.` });
    faceKinds.add(faceKind);
    const expectedFace = base.faces.find((face) => face.kind === faceKind);
    if (!expectedFace) {
      issues.push({ code: "INVALID_FACE", sourceId: faceKind, message: `Recipe “${recipeId}” has no admitted ${faceKind} mapping.` });
      continue;
    }
    const expectedRoles = new Map(expectedFace.roles.map((role) => [role.roleId, role.treatment]));
    const seenRoles = new Set<string>();
    const usedInstances = new Set<string>();
    for (const rawRole of rawFace.roles) {
      if (!isRecord(rawRole) || typeof rawRole.roleId !== "string") {
        validateRole(faceKind, rawRole, block, "SHELL", usedInstances, issues);
        continue;
      }
      const roleId = rawRole.roleId;
      if (roleId && seenRoles.has(roleId)) {
        issues.push({ code: "DUPLICATE_ROLE", sourceId: `${faceKind}:${roleId}`, message: `Projection map repeats role “${roleId}”.` });
        continue;
      }
      if (roleId) seenRoles.add(roleId);
      const treatment = expectedRoles.get(roleId);
      if (!treatment) {
        issues.push({ code: "UNEXPECTED_ROLE", sourceId: `${faceKind}:${roleId || "?"}`, message: `Role “${roleId || "?"}” is not admitted on ${faceKind}.` });
        continue;
      }
      validateRole(faceKind, rawRole, block, treatment, usedInstances, issues);
      if (typeof rawRole.instanceId === "string" && rawRole.instanceId.trim().length > 0) {
        const existingInstanceId = instancesByRole.get(roleId);
        if (existingInstanceId !== undefined && existingInstanceId !== rawRole.instanceId) {
          issues.push({ code: "INSTANCE_MISMATCH", sourceId: `${faceKind}:${roleId}`, message: `Role “${roleId}” must keep the same component instance ID across front and back.` });
        } else {
          instancesByRole.set(roleId, rawRole.instanceId);
        }
      }
    }
    for (const role of expectedFace.roles) {
      if (!seenRoles.has(role.roleId)) {
        issues.push({ code: "MISSING_ROLE", sourceId: `${faceKind}:${role.roleId}`, message: `Projection map omits admitted role “${role.roleId}” from ${faceKind}.` });
      }
    }
  }
  for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
    if (!faceKinds.has(kind)) issues.push({ code: "INVALID_FACES", sourceId: kind, message: `Projection map is missing ${kind}.` });
  }
  return issues;
}
