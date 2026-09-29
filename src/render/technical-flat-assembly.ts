import type { Block } from "../drafting/block";
import type { Edge, Piece } from "../drafting/piece";
import type { InterfaceRef, Stitch } from "../drafting/stitch";
import { cubicLength, cubicPoint } from "../geometry";
import type { FlatPoint, TechnicalFlatViewKind } from "./technical-flat";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";

export interface FlatRoleTransform {
  readonly offset: FlatPoint;
  readonly rotationDegrees: number;
}

export interface TechnicalFlatAssemblyIssue {
  readonly code: "UNSUPPORTED_RECIPE" | "MISSING_MAPPED_ROLE" | "UNRESOLVED_STITCH_REFERENCE"
    | "UNPLACED_COMPONENT_ROLE" | "INCONSISTENT_STITCH_TRANSFORM" | "STITCH_ENDPOINT_RESIDUAL";
  readonly sourceId: string;
  readonly message: string;
}

export interface TechnicalFlatAssembly {
  readonly recipeId: string;
  readonly kind: TechnicalFlatViewKind;
  readonly transforms: Readonly<Record<string, FlatRoleTransform>>;
  readonly joinedStitchLabels: readonly string[];
  readonly issues: readonly TechnicalFlatAssemblyIssue[];
}

interface Rigid { readonly rotation: number; readonly offset: FlatPoint }
interface Relation { readonly from: string; readonly to: string; readonly toFrom: Rigid; readonly label: string; readonly endpointResidualCm: number }

const radians = (degrees: number): number => degrees * Math.PI / 180;
const point = (x: number, y: number): FlatPoint => ({ x, y });
const distance = (a: FlatPoint, b: FlatPoint): number => Math.hypot(a.x - b.x, a.y - b.y);

function edgeMeasure(edge: Edge): number {
  return edge.kind === "line" ? distance(edge.start, edge.end) : cubicLength(edge.curve, 128);
}

function pointOnEdge(edge: Edge, fraction: number): FlatPoint {
  if (edge.kind === "line") return point(
    edge.start.x + (edge.end.x - edge.start.x) * fraction,
    edge.start.y + (edge.end.y - edge.start.y) * fraction,
  );
  return cubicPoint(edge.curve, fraction);
}

interface RefMeasure { readonly roleId: string; readonly ref: InterfaceRef; readonly length: number }

function measureRef(block: Block, ref: InterfaceRef): RefMeasure | null {
  const piece: Piece | undefined = block.roles[ref.piece];
  if (!piece) return null;
  if ("edge" in ref) {
    const edge = piece.edges.find((candidate) => candidate.name === ref.edge);
    return edge ? { roleId: ref.piece, ref, length: edgeMeasure(edge) } : null;
  }
  const mark = piece.marks?.find((candidate) => candidate.name === ref.mark);
  if (!mark || !("start" in mark)) return null;
  return { roleId: ref.piece, ref, length: distance(mark.start, mark.end) };
}

function pointOnRef(block: Block, measured: RefMeasure, fraction: number): FlatPoint {
  const piece = block.roles[measured.roleId]!;
  const sourceFraction = "edge" in measured.ref && measured.ref.reversed ? 1 - fraction : fraction;
  if ("edge" in measured.ref) {
    const edgeName = (measured.ref as { readonly edge: string }).edge;
    const edge = piece.edges.find((candidate) => candidate.name === edgeName)!;
    return pointOnEdge(edge, sourceFraction);
  }
  const markName = (measured.ref as { readonly mark: string }).mark;
  const mark = piece.marks?.find((candidate) => candidate.name === markName) as { readonly start: FlatPoint; readonly end: FlatPoint };
  return point(mark.start.x + (mark.end.x - mark.start.x) * sourceFraction,
    mark.start.y + (mark.end.y - mark.start.y) * sourceFraction);
}

function measureInterface(block: Block, refs: readonly InterfaceRef[]): RefMeasure[] | null {
  const measured = refs.map((ref) => measureRef(block, ref));
  if (measured.length === 0 || measured.some((entry) => entry === null)) return null;
  const segments = measured as RefMeasure[];
  return segments.every((segment) => Number.isFinite(segment.length) && segment.length > 1e-8) ? segments : null;
}

function pointOnInterface(
  block: Block, segments: readonly RefMeasure[], fraction: number, atEndBoundary = false,
): { roleId: string; point: FlatPoint } | null {
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  const remaining = Math.max(0, Math.min(1, fraction)) * total;
  const prefixes: number[] = [];
  let consumed = 0;
  for (const segment of segments) {
    prefixes.push(consumed);
    consumed += segment.length;
  }
  const index = segments.findIndex((segment, candidateIndex) => {
    const end = prefixes[candidateIndex]! + segment.length;
    return (atEndBoundary ? remaining <= end : remaining < end) || candidateIndex === segments.length - 1;
  });
  const segment = segments[index]!;
  const prefix = prefixes[index]!;
  return { roleId: segment.roleId, point: pointOnRef(block, segment, Math.min(1, (remaining - prefix) / segment.length)) };
}

function interfaceBreakpoints(segments: readonly RefMeasure[]): number[] {
  const total = segments.reduce((sum, segment) => sum + segment.length, 0);
  let consumed = 0;
  const points = [0];
  for (const segment of segments) {
    consumed += segment.length;
    points.push(consumed / total);
  }
  return points;
}

function transformPoint(value: FlatPoint, transform: Rigid): FlatPoint {
  const angle = radians(transform.rotation);
  return point(value.x * Math.cos(angle) - value.y * Math.sin(angle) + transform.offset.x,
    value.x * Math.sin(angle) + value.y * Math.cos(angle) + transform.offset.y);
}

function fitRigid(source: readonly FlatPoint[], target: readonly FlatPoint[]): { transform: Rigid; rms: number } {
  const paired = source.map((item, index) => ({ a: item, b: target[index]! }));
  const centerA = paired.reduce((sum, item) => point(sum.x + item.a.x / paired.length, sum.y + item.a.y / paired.length), point(0, 0));
  const centerB = paired.reduce((sum, item) => point(sum.x + item.b.x / paired.length, sum.y + item.b.y / paired.length), point(0, 0));
  let dot = 0; let cross = 0;
  for (const item of paired) {
    const ax = item.a.x - centerA.x; const ay = item.a.y - centerA.y;
    const bx = item.b.x - centerB.x; const by = item.b.y - centerB.y;
    dot += ax * bx + ay * by;
    cross += ax * by - ay * bx;
  }
  const rotation = Math.atan2(cross, dot) * 180 / Math.PI;
  const angle = radians(rotation);
  const offset = point(centerB.x - (centerA.x * Math.cos(angle) - centerA.y * Math.sin(angle)),
    centerB.y - (centerA.x * Math.sin(angle) + centerA.y * Math.cos(angle)));
  const transform = { rotation, offset };
  const rms = Math.sqrt(paired.reduce((sum, item) => sum + distance(transformPoint(item.a, transform), item.b) ** 2, 0) / paired.length);
  return { transform, rms };
}

function stitchRelations(block: Block, stitch: Stitch, visible: ReadonlySet<string>): Relation[] | null {
  const a = measureInterface(block, stitch.a.edges);
  const b = measureInterface(block, stitch.b.edges);
  if (!a || !b) return null;
  const totalA = a.reduce((sum, segment) => sum + segment.length, 0);
  const totalB = b.reduce((sum, segment) => sum + segment.length, 0);
  const allowedDifference = stitch.ease ? Math.max(Math.abs(stitch.ease.lo), Math.abs(stitch.ease.hi)) + 0.1 : 0.1;
  if (Math.abs(totalA - totalB) > allowedDifference) return null;

  const groups = new Map<string, { from: string; to: string; source: FlatPoint[]; target: FlatPoint[] }>();
  const breakpoints = [...new Set([...interfaceBreakpoints(a), ...interfaceBreakpoints(b)])].sort((left, right) => left - right);
  for (let index = 0; index < breakpoints.length - 1; index += 1) {
    const startFraction = breakpoints[index]!;
    const endFraction = breakpoints[index + 1]!;
    const midpoint = (startFraction + endFraction) / 2;
    const startA = pointOnInterface(block, a, startFraction)!;
    const endA = pointOnInterface(block, a, endFraction, true)!;
    const startB = pointOnInterface(block, b, startFraction)!;
    const endB = pointOnInterface(block, b, endFraction, true)!;
    const middleA = pointOnInterface(block, a, midpoint)!;
    const middleB = pointOnInterface(block, b, midpoint)!;
    if (!visible.has(middleA.roleId) || !visible.has(middleB.roleId) || middleA.roleId === middleB.roleId) continue;
    // Segment boundaries come directly from the source edge lengths. Include
    // each exact seam subdivision endpoint so joins do not depend on a sampled
    // point accidentally landing near a piece transition.
    const key = `${middleA.roleId}:${middleB.roleId}`;
    const group = groups.get(key) ?? { from: middleA.roleId, to: middleB.roleId, source: [], target: [] };
    group.source.push(startB.point, endB.point);
    group.target.push(startA.point, endA.point);
    groups.set(key, group);
  }

  const relations: Relation[] = [];
  for (const group of groups.values()) {
    // Stitch interfaces define length and ordering, while their cut curves can
    // differ after ease and seam truing. Use their authored ends as placement
    // landmarks; preserve every intervening curve point without warping it.
    // The relation stores B's local coordinates in A's frame. When A is fixed,
    // this is the transform that places B; the reverse graph traversal inverts
    // it. Keep the source/target order explicit to match that contract.
    const best = fitRigid(group.source, group.target);
    relations.push({ from: group.from, to: group.to, toFrom: best.transform, label: stitch.label,
      endpointResidualCm: best.rms });
  }
  return relations;
}

function compose(outer: Rigid, inner: Rigid): Rigid {
  const angle = radians(outer.rotation);
  return { rotation: outer.rotation + inner.rotation,
    offset: point(inner.offset.x * Math.cos(angle) - inner.offset.y * Math.sin(angle) + outer.offset.x,
      inner.offset.x * Math.sin(angle) + inner.offset.y * Math.cos(angle) + outer.offset.y) };
}

function invert(transform: Rigid): Rigid {
  const rotation = -transform.rotation; const angle = radians(rotation);
  return { rotation, offset: point(-transform.offset.x * Math.cos(angle) + transform.offset.y * Math.sin(angle),
    -transform.offset.x * Math.sin(angle) - transform.offset.y * Math.cos(angle)) };
}

function difference(a: Rigid, b: Rigid): number {
  const rotation = Math.abs(((a.rotation - b.rotation + 540) % 360) - 180);
  return distance(a.offset, b.offset) + rotation * Math.PI / 180;
}

/** Position visible components from source-ordered sewn interfaces. Curves are
 * sampled by their authored parameter and never scaled or rewritten. An
 * interface that cannot support a rigid placement blocks the view explicitly. */
export function assembleTechnicalFlatRoles(recipeId: string, block: Block, kind: TechnicalFlatViewKind): TechnicalFlatAssembly {
  const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipeId];
  if (!mapping) return { recipeId, kind, transforms: {}, joinedStitchLabels: [], issues: [{
    code: "UNSUPPORTED_RECIPE", sourceId: recipeId, message: `Recipe “${recipeId}” has no admitted front/back role assembly map.`,
  }] };
  const face = mapping.faces.find((candidate) => candidate.kind === kind);
  if (!face) return { recipeId, kind, transforms: {}, joinedStitchLabels: [], issues: [] };
  const visible = new Set(face.roles.filter((role) => role.treatment !== "INTERIOR_HIDDEN").map((role) => role.roleId));
  // Interior pattern pieces may establish where a visible exterior piece is
  // sewn. Include them in the placement graph, then omit their transforms from
  // the face result so the renderer cannot mistake them for exterior geometry.
  const constructionRoles = new Set(face.roles.map((role) => role.roleId));
  const issues: TechnicalFlatAssemblyIssue[] = [];
  for (const roleId of visible) if (!block.roles[roleId]) issues.push({ code: "MISSING_MAPPED_ROLE", sourceId: roleId,
    message: `Mapped visible role “${roleId}” is absent from this pattern revision.` });
  if (issues.length) return { recipeId, kind, transforms: {}, joinedStitchLabels: [], issues };

  const relations: Relation[] = [];
  for (const stitch of block.stitches) {
    const touchesFace = [...stitch.a.edges, ...stitch.b.edges].some((ref) => constructionRoles.has(ref.piece));
    if (!touchesFace) continue;
    if (stitch.a.edges.length === 0 || stitch.b.edges.length === 0) {
      issues.push({ code: "UNRESOLVED_STITCH_REFERENCE", sourceId: `stitch:${stitch.label}`,
        message: `Stitch “${stitch.label}” has an empty sewn interface and cannot position this view.` });
      continue;
    }
    const hasMappedSideA = stitch.a.edges.some((ref) => constructionRoles.has(ref.piece));
    const hasMappedSideB = stitch.b.edges.some((ref) => constructionRoles.has(ref.piece));
    if (!hasMappedSideA || !hasMappedSideB) continue;
    const stitchResults = stitchRelations(block, stitch, constructionRoles);
    if (stitchResults === null) {
      issues.push({ code: "UNRESOLVED_STITCH_REFERENCE", sourceId: `stitch:${stitch.label}`,
        message: `Stitch “${stitch.label}” does not provide a length-compatible rigid placement for this view.` });
    } else {
      relations.push(...stitchResults);
      if (stitchResults.some((relation) => relation.endpointResidualCm > 0.25)) {
        const relation = stitchResults.find((candidate) => candidate.endpointResidualCm > 0.25)!;
        if (!issues.some((issue) => issue.sourceId === `stitch:${relation.label}`)) issues.push({
          code: "STITCH_ENDPOINT_RESIDUAL", sourceId: `stitch:${relation.label}`,
          message: `Stitch “${relation.label}” leaves its sewn endpoints ${relation.endpointResidualCm.toFixed(2)} cm apart after rigid placement; review this construction line before release.`,
        });
      }
    }
  }

  const seed = face.roles.find((role) => role.treatment === "SHELL" && visible.has(role.roleId))!.roleId;
  const solved: Record<string, Rigid> = {};
  solved[seed] = { rotation: 0, offset: point(0, 0) };
  const queue = [seed];
  const conflictLabels = new Set<string>();
  while (queue.length) {
    const current = queue.shift()!;
    for (const relation of relations) {
      if (relation.from === current) {
        const expected = compose(solved[current]!, relation.toFrom);
        if (relation.to in solved) {
          if (difference(expected, solved[relation.to]!) > 0.25 && !conflictLabels.has(relation.label)) {
            conflictLabels.add(relation.label);
            issues.push({ code: "INCONSISTENT_STITCH_TRANSFORM", sourceId: `stitch:${relation.label}`,
              message: `Stitch “${relation.label}” conflicts with the solved sewn placement.` });
          }
        } else { solved[relation.to] = expected; queue.push(relation.to); }
      } else if (relation.to === current && !(relation.from in solved)) {
        const expected = compose(solved[current]!, invert(relation.toFrom));
        solved[relation.from] = expected; queue.push(relation.from);
      }
    }
  }
  for (const roleId of visible) if (!(roleId in solved)) issues.push({ code: "UNPLACED_COMPONENT_ROLE", sourceId: roleId,
    message: `Visible role “${roleId}” has no rigid placement supported by a sewn interface on this face.` });
  return { recipeId, kind, transforms: Object.fromEntries(Object.entries(solved).filter(([roleId]) => visible.has(roleId)).map(([roleId, transform]) => [roleId, {
    offset: transform.offset, rotationDegrees: transform.rotation,
  }])), joinedStitchLabels: [...new Set(relations.map((relation) => relation.label))], issues };
}
