import type { Block } from "../drafting/block";
import type { Edge, Piece } from "../drafting/piece";
import type { PatternMark } from "../drafting/pattern-mark";
import type { EdgeRef } from "../drafting/stitch";
import type { FlatPoint, FlatPathPrimitive, FlatPointMarkPrimitive, TechnicalFlatPrimitive, TechnicalFlatViewKind } from "./technical-flat";
import type { FlatRoleTransform, TechnicalFlatSourceFragment } from "./technical-flat-assembly";
import { transformFlatPoint } from "./technical-flat-transform";

export interface TechnicalFlatFragmentIssue {
  readonly code: "INVALID_FRAGMENT_SOURCE" | "UNRESOLVED_FRAGMENT_ATTACHMENT"
    | "UNRESOLVED_FRAGMENT_JOIN" | "UNRESOLVED_FRAGMENT_CLOSURE" | "UNRESOLVED_FRAGMENT_MARK";
  readonly sourceId: string;
  readonly message: string;
}

export interface TechnicalFlatFragmentCompilation {
  readonly primitives: readonly TechnicalFlatPrimitive[];
  readonly issues: readonly TechnicalFlatFragmentIssue[];
}

const WAIST_STITCH = "Waistband (four legs ↔ separate waistband)";
const TOLERANCE = 1e-8;
type LineEdge = Extract<Edge, { readonly kind: "line" }>;

function closePoint(a: FlatPoint, b: FlatPoint): boolean {
  return Number.isFinite(a.x) && Number.isFinite(a.y) && Number.isFinite(b.x) && Number.isFinite(b.y)
    && Math.hypot(a.x - b.x, a.y - b.y) <= TOLERANCE;
}

function line(piece: Piece | undefined, name: string): LineEdge | undefined {
  const edge = piece?.edges.find((candidate) => candidate.name === name);
  if (edge?.kind !== "line" || !closePoint(edge.start, edge.start) || !closePoint(edge.end, edge.end)) return undefined;
  return edge;
}

function at(edge: LineEdge, fraction: number): FlatPoint {
  return { x: edge.start.x + (edge.end.x - edge.start.x) * fraction,
    y: edge.start.y + (edge.end.y - edge.start.y) * fraction };
}

function transform(point: FlatPoint, placement: FlatRoleTransform): FlatPoint | undefined {
  try {
    return transformFlatPoint(point, { ...placement, mirrorX: false });
  } catch {
    return undefined;
  }
}

function edgeSource(edgeId: string): string {
  return `pattern:trouser:role:waistband:edge:${edgeId}`;
}

function pathPrimitive(revisionId: string, kind: TechnicalFlatViewKind, suffix: string,
  edgeId: string, layer: FlatPathPrimitive["layer"], feature: FlatPathPrimitive["feature"],
  start: FlatPoint, end: FlatPoint): FlatPathPrimitive {
  return {
    kind: "path", id: `live-flat:trouser:${kind}:waistband:${suffix}`, layer, feature,
    source: { sourceClass: "PATTERN_DERIVED", sourceId: edgeSource(edgeId), revisionId },
    sourceEdgeIds: [edgeSource(edgeId)],
    commands: [{ op: "move", point: start }, { op: "line", point: end }],
  };
}

function markLayer(mark: PatternMark): FlatPointMarkPrimitive["layer"] {
  return mark.kind === "button" || mark.kind === "buttonhole" ? "CLOSURE" : "ANNOTATION";
}

function expectedIntervals(block: Block, bottom: LineEdge): Map<string, readonly [number, number]> | undefined {
  const matches = block.stitches.filter((stitch) => stitch.label === WAIST_STITCH);
  const stitch = matches[0];
  if (matches.length !== 1 || !stitch || stitch.ease !== undefined || stitch.a.edges.length !== 4
    || stitch.b.edges.length !== 1 || !stitch.b.edges[0] || !("edge" in stitch.b.edges[0])
    || stitch.b.edges[0].piece !== "waistband" || stitch.b.edges[0].edge !== "bottom"
    || stitch.b.edges[0].reversed) return undefined;
  const expected = ["backLeft", "frontLeft", "frontRight", "backRight"];
  const lengths: number[] = [];
  for (const [index, ref] of stitch.a.edges.entries()) {
    if (!("edge" in ref) || ref.piece !== expected[index] || ref.edge !== "waist") return undefined;
    const edge = line(block.roles[ref.piece], ref.edge);
    if (!edge) return undefined;
    const length = Math.hypot(edge.end.x - edge.start.x, edge.end.y - edge.start.y);
    if (!(length > 0) || !Number.isFinite(length)) return undefined;
    lengths.push(length);
  }
  const total = lengths.reduce((sum, value) => sum + value, 0);
  const bandLength = Math.hypot(bottom.end.x - bottom.start.x, bottom.end.y - bottom.start.y);
  if (!(total > 0) || !Number.isFinite(total) || Math.abs(total - bandLength) > TOLERANCE) return undefined;
  let consumed = 0;
  const result = new Map<string, readonly [number, number]>();
  for (const [index, roleId] of expected.entries()) {
    const start = consumed / total;
    consumed += lengths[index]!;
    const end = consumed / total;
    result.set(roleId, [1 - end, 1 - start]);
  }
  return result;
}

function addIssue(issues: TechnicalFlatFragmentIssue[], code: TechnicalFlatFragmentIssue["code"],
  sourceId: string, message: string): void {
  issues.push({ code, sourceId, message });
}

/** Compile view-only pieces of the one drafted Trouser waistband role. The
 * bottom joining edge is validated against the exact panel interface and is
 * represented by that panel edge in the output, so it is not stroked twice. */
export function compileTrouserWaistbandFragments(
  block: Block,
  revisionId: string,
  kind: TechnicalFlatViewKind,
  fragments: readonly TechnicalFlatSourceFragment[],
  placements: Readonly<Record<string, FlatRoleTransform>>,
): TechnicalFlatFragmentCompilation {
  const issues: TechnicalFlatFragmentIssue[] = [];
  const piece = block.roles.waistband;
  const top = line(piece, "top");
  const bottom = line(piece, "bottom");
  const leftEnd = line(piece, "endLeft");
  const rightEnd = line(piece, "endRight");
  if (typeof revisionId !== "string" || revisionId.trim().length === 0 || !piece || !top || !bottom || !leftEnd || !rightEnd
    || !closePoint(top.start, leftEnd.end) || !closePoint(top.end, rightEnd.start)
    || !closePoint(rightEnd.end, bottom.start) || !closePoint(bottom.end, leftEnd.start)
    || Math.abs(Math.hypot(top.end.x - top.start.x, top.end.y - top.start.y)
      - Math.hypot(bottom.end.x - bottom.start.x, bottom.end.y - bottom.start.y)) > TOLERANCE
    || Math.abs(top.end.y - top.start.y) > TOLERANCE || Math.abs(bottom.end.y - bottom.start.y) > TOLERANCE) {
    addIssue(issues, "INVALID_FRAGMENT_SOURCE", "pattern:trouser:role:waistband",
      "Trouser waistband fragments require one finite closed four-line source outline named top, endRight, bottom, and endLeft.");
    return { primitives: [], issues };
  }
  const intervals = expectedIntervals(block, bottom);
  if (!intervals || fragments.length !== 2) {
    addIssue(issues, "INVALID_FRAGMENT_SOURCE", edgeSource("bottom"),
      "The exact zero-ease waistband-to-four-waists source interface and two face fragments are required.");
    return { primitives: [], issues };
  }
  const roleIds = kind === "BACK_FLAT" ? ["backLeft", "backRight"] : ["frontLeft", "frontRight"];
  const selected = roleIds.map((roleId) => fragments.find((fragment) => fragment.attachedRoleId === roleId));
  if (selected.some((fragment) => !fragment) || new Set(fragments.map((fragment) => fragment.id)).size !== 2
    || new Set(fragments.map((fragment) => fragment.attachedRoleId)).size !== 2) {
    addIssue(issues, "INVALID_FRAGMENT_SOURCE", edgeSource("bottom"),
      `This ${kind === "BACK_FLAT" ? "back" : "front"} view requires one distinct source fragment for ${roleIds.join(" and ")}.`);
    return { primitives: [], issues };
  }
  const faceFragments = selected as TechnicalFlatSourceFragment[];
  const attachments = new Map<string, { fragment: TechnicalFlatSourceFragment; panel: FlatRoleTransform;
    bottomPoints: readonly [FlatPoint, FlatPoint] }>();
  for (const fragment of faceFragments) {
    const expected = intervals.get(fragment.attachedRoleId);
    const bandStart = fragment.sourceInterval?.[0];
    const bandEnd = fragment.sourceInterval?.[1];
    const panel = placements[fragment.attachedRoleId];
    const panelPiece = block.roles[fragment.attachedRoleId];
    const panelEdge = line(panelPiece, "waist");
    const stitch = block.stitches.find((candidate) => candidate.label === WAIST_STITCH);
    const ref = stitch?.a.edges.find((candidate) => "edge" in candidate
      && candidate.piece === fragment.attachedRoleId && candidate.edge === "waist") as EdgeRef | undefined;
    if (fragment.roleId !== "waistband" || fragment.edgeId !== "bottom" || fragment.attachedEdgeId !== "waist"
      || fragment.stitchLabel !== WAIST_STITCH || !expected || !Array.isArray(fragment.sourceInterval)
      || !Number.isFinite(bandStart) || !Number.isFinite(bandEnd) || bandStart! < 0 || bandEnd! > 1
      || !(bandEnd! > bandStart!) || Math.abs(bandStart! - expected[0]) > TOLERANCE
      || Math.abs(bandEnd! - expected[1]) > TOLERANCE || !panel || !panelPiece || !panelEdge || !ref) {
      addIssue(issues, "INVALID_FRAGMENT_SOURCE", edgeSource("bottom"),
        `Fragment for “${fragment.attachedRoleId}” does not preserve its exact source interval, sewn role, or panel transform.`);
      continue;
    }
    const sourceStart = at(bottom, bandStart!);
    const sourceEnd = at(bottom, bandEnd!);
    const attachedStart = transform(sourceStart, fragment.transform);
    const attachedEnd = transform(sourceEnd, fragment.transform);
    const targetStart = ref.reversed ? panelEdge.start : panelEdge.end;
    const targetEnd = ref.reversed ? panelEdge.end : panelEdge.start;
    const viewStart = transform(targetStart, panel);
    const viewEnd = transform(targetEnd, panel);
    if (!attachedStart || !attachedEnd || !closePoint(attachedStart, targetStart) || !closePoint(attachedEnd, targetEnd)
      || !viewStart || !viewEnd) {
      addIssue(issues, "UNRESOLVED_FRAGMENT_ATTACHMENT", `stitch:${WAIST_STITCH}:${fragment.attachedRoleId}`,
        `Waistband fragment “${fragment.id}” does not land on its exact same-revision ${fragment.attachedRoleId}.waist endpoints.`);
      continue;
    }
    attachments.set(fragment.attachedRoleId, { fragment, panel, bottomPoints: [viewStart, viewEnd] });
  }
  if (issues.length > 0 || attachments.size !== 2) return { primitives: [], issues };

  const topAtFragment = (fragment: TechnicalFlatSourceFragment, panel: FlatRoleTransform): readonly [FlatPoint, FlatPoint] | undefined => {
    const start = at(top, 1 - fragment.sourceInterval[1]);
    const end = at(top, 1 - fragment.sourceInterval[0]);
    const a = transform(start, fragment.transform); const b = transform(end, fragment.transform);
    const placedA = a && transform(a, panel); const placedB = b && transform(b, panel);
    return placedA && placedB ? [placedA, placedB] : undefined;
  };
  const output: TechnicalFlatPrimitive[] = [];
  const topSegments = faceFragments.map((fragment) => {
    const placement = attachments.get(fragment.attachedRoleId)!;
    return topAtFragment(fragment, placement.panel);
  });
  const bottomSegments = faceFragments.map((fragment) => attachments.get(fragment.attachedRoleId)!.bottomPoints);
  if (topSegments.some((segment) => !segment)) {
    addIssue(issues, "UNRESOLVED_FRAGMENT_ATTACHMENT", edgeSource("top"),
      "A clipped waistband top or sewn edge could not be placed by a finite rigid transform.");
    return { primitives: [], issues };
  }
  if (kind === "FRONT_FLAT") {
    const leftFragment = attachments.get("frontLeft")!.fragment;
    const rightFragment = attachments.get("frontRight")!.fragment;
    const leftPanel = attachments.get("frontLeft")!.panel;
    const rightPanel = attachments.get("frontRight")!.panel;
    const sharedFraction = leftFragment.sourceInterval[0];
    const sharedSourcePoint = at(bottom, sharedFraction);
    const sharedTopPoint = at(top, 1 - sharedFraction);
    const leftBottom = transform(sharedSourcePoint, leftFragment.transform);
    const rightBottom = transform(sharedSourcePoint, rightFragment.transform);
    const leftTop = transform(sharedTopPoint, leftFragment.transform);
    const rightTop = transform(sharedTopPoint, rightFragment.transform);
    const leftBottomPlaced = leftBottom && transform(leftBottom, leftPanel);
    const rightBottomPlaced = rightBottom && transform(rightBottom, rightPanel);
    const leftTopPlaced = leftTop && transform(leftTop, leftPanel);
    const rightTopPlaced = rightTop && transform(rightTop, rightPanel);
    if (!leftBottomPlaced || !rightBottomPlaced || !leftTopPlaced || !rightTopPlaced
      || !closePoint(leftBottomPlaced, rightBottomPlaced) || !closePoint(leftTopPlaced, rightTopPlaced)) {
      addIssue(issues, "UNRESOLVED_FRAGMENT_JOIN", "view:trouser:waistband:center-front",
        "The front waistband fragments do not share one exact center-front join in this assembled view; the complete face remains held.");
      return { primitives: [], issues };
    }
  } else {
    const leftBottom = bottomSegments[0]!;
    const rightBottom = bottomSegments[1]!;
    const leftTop = topSegments[0]!;
    const rightTop = topSegments[1]!;
    if (!leftBottom || !rightBottom || !leftTop || !rightTop
      || !closePoint(leftBottom[1], rightBottom[0]) || !closePoint(leftTop[0], rightTop[1])) {
      addIssue(issues, "UNRESOLVED_FRAGMENT_CLOSURE", "view:trouser:waistband:center-back",
        "The back waistband fragments do not meet at a single center-back join at both sewn and top edges; the complete face remains held.");
      return { primitives: [], issues };
    }
    // The closed four-edge source outline makes each authored short end the
    // exact line between its top/bottom endpoint pair. Matching both joined
    // endpoint pairs under the same rigid placement therefore proves the two
    // short-end lines coincide without emitting a duplicate center-back stroke.
  }

  for (const [index, fragment] of faceFragments.entries()) {
    const segment = topSegments[index]!;
    const topPrimitive = pathPrimitive(revisionId, kind, `${fragment.id}:top`, "top", "GARMENT_SILHOUETTE", "silhouette",
      segment[0], segment[1]);
    output.push(topPrimitive);
    const interiorBoundary = fragment.sourceInterval.find((value) => value > TOLERANCE && value < 1 - TOLERANCE);
    if (kind === "BACK_FLAT" && interiorBoundary !== undefined) {
      const localIndex = Math.abs(interiorBoundary - fragment.sourceInterval[0]) <= TOLERANCE ? 0 : 1;
      const bottomView = bottomSegments[index]![localIndex]!;
      const topView = topSegments[index]![1 - localIndex]!;
      output.push({ kind: "path", id: `live-flat:trouser:${kind}:waistband:${fragment.id}:side-boundary`,
        layer: "GARMENT_SILHOUETTE", feature: "silhouette",
        source: { sourceClass: "PATTERN_DERIVED", sourceId: `view:trouser:stitch:${WAIST_STITCH}:boundary:${fragment.attachedRoleId}`, revisionId },
        commands: [{ op: "move", point: topView }, { op: "line", point: bottomView }],
      });
    }
  }

  if (kind === "BACK_FLAT") {
    const leftBottom = bottomSegments[0]!;
    const leftTop = topSegments[0]!;
    output.push(pathPrimitive(revisionId, kind, "center-back-closure", "endLeft", "CLOSURE", "closure",
      leftBottom[1], leftTop[0]));
  }

  const marks = piece.marks ?? [];
  const markSourceIds = new Set<string>();
  for (const mark of marks) {
    if (!("at" in mark)) {
      addIssue(issues, "UNRESOLVED_FRAGMENT_MARK", `pattern:trouser:mark:waistband:${mark.name}`,
        `Waistband mark “${mark.name}” is not a source point and cannot be safely assigned to a view fragment.`);
      continue;
    }
    const sourceFraction = (mark.at.x - bottom.start.x) / (bottom.end.x - bottom.start.x);
    if (!Number.isFinite(sourceFraction) || mark.at.x < Math.min(bottom.start.x, bottom.end.x) - TOLERANCE
      || mark.at.x > Math.max(bottom.start.x, bottom.end.x) + TOLERANCE
      || mark.at.y < Math.min(top.start.y, bottom.start.y) - TOLERANCE
      || mark.at.y > Math.max(top.start.y, bottom.start.y) + TOLERANCE) {
      addIssue(issues, "UNRESOLVED_FRAGMENT_MARK", `pattern:trouser:mark:waistband:${mark.name}`,
        `Waistband mark “${mark.name}” is outside the exact top/bottom source strip.`);
      continue;
    }
    const candidates = faceFragments.filter((fragment) => sourceFraction >= fragment.sourceInterval[0] - TOLERANCE
      && sourceFraction <= fragment.sourceInterval[1] + TOLERANCE);
    if (candidates.length === 0) continue;
    // Topology and endpoint checks above constrain the source point to the
    // closed rectangle; the same finite rigid transform used by its endpoints
    // maps every point inside it to a finite view coordinate.
    const placed = candidates.map((fragment) => {
      const attachment = attachments.get(fragment.attachedRoleId)!;
      const local = transform(mark.at, fragment.transform);
      return local && transform(local, attachment.panel);
    });
    if (markSourceIds.has(mark.name)) {
      addIssue(issues, "UNRESOLVED_FRAGMENT_MARK", `pattern:trouser:mark:waistband:${mark.name}`,
        `Waistband mark “${mark.name}” is duplicated in the source record.`);
      continue;
    }
    markSourceIds.add(mark.name);
    output.push({ kind: "mark", id: `live-flat:trouser:${kind}:waistband:mark:${mark.name}`,
      layer: markLayer(mark), feature: mark.kind === "button" || mark.kind === "buttonhole" ? "closure" : "annotation",
      source: { sourceClass: "PATTERN_DERIVED", sourceId: `pattern:trouser:mark:waistband:${mark.name}`, revisionId },
      markKind: mark.kind, markName: mark.name, at: placed[0]!, label: mark.label,
      labelRole: mark.labelRole,
    });
  }
  if (issues.length > 0) return { primitives: [], issues };
  return { primitives: output, issues };
}
