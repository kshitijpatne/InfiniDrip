import type { GarmentRecipe } from "../drafting/recipe";
import type { Block } from "../drafting/block";
import { edgeEnd, edgeStart } from "../drafting/piece";
import type { ArtworkPlacement } from "../surface/placement";
import type { TechnicalFlatColorwayOverlay } from "./technical-flat-overlays";
import {
  TECHNICAL_FLAT_SCHEMA_VERSION,
  type FlatPoint,
  type FlatPathCommand,
  type FlatCalloutPrimitive,
  type TechnicalFlatPrimitive,
  type TechnicalFlatView,
  type TechnicalFlatViewKind,
} from "./technical-flat";
import { G04_TECHNICAL_FLAT_MAPPINGS } from "./technical-flat-mapping";
import { createG04TechnicalFlatProjectionMap, type FlatProjectionPhysicalPairReflection,
  type FlatProjectionOppositeSideReflection, type FlatProjectionViewPairReflection } from "./technical-flat-projection";
import { compileTechnicalFlatSourceGeometry } from "./technical-flat-geometry";
import { assembleTechnicalFlatRoles, type FlatRoleTransform } from "./technical-flat-assembly";
import { compileTechnicalFlatOverlays } from "./technical-flat-overlays";
import { compileTechnicalFlatPomCallouts, type TechnicalFlatPomResolvedAnchor } from "./technical-flat-poms";
import { transformFlatPoint, transformFlatPrimitive } from "./technical-flat-transform";
import { compileTrouserWaistbandFragments } from "./technical-flat-fragment-compiler";
import { composeWovenDetachedBandDetails } from "./woven-detached-band-detail";
import { createWovenCollarProjector, projectWovenCollarPrimitive, type WovenCollarRoleId } from "./woven-collar-view-projection";
import type { Pom } from "../drafting/pom";

export interface TechnicalFlatLiveIssue {
  readonly stage: "geometry" | "assembly" | "overlay" | "pom" | "transform";
  readonly sourceId: string;
  readonly message: string;
}

export interface TechnicalFlatLiveInput {
  readonly recipe: GarmentRecipe;
  readonly block: Block;
  readonly revisionId: string;
  readonly kind: TechnicalFlatViewKind;
  readonly placements: readonly ArtworkPlacement[];
  readonly colorHex: string;
  readonly texture: "smooth" | "woven" | "rib" | "heather";
  readonly shine: number;
}

export interface TechnicalFlatLiveResult {
  readonly view: TechnicalFlatView | null;
  readonly colorway: TechnicalFlatColorwayOverlay | null;
  readonly issues: readonly TechnicalFlatLiveIssue[];
}

export function technicalFlatAssemblyNotices(
  recipeId: string,
  kind: TechnicalFlatViewKind,
  assemblyIssues: ReturnType<typeof assembleTechnicalFlatRoles>["issues"],
) {
  return assemblyIssues.filter((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL").map((issue) => ({
    id: `notice:${recipeId}:${kind}:assembly:${issue.sourceId}`,
    feature: "seam" as const,
    reason: "SOURCE_NOT_REPRESENTED" as const,
    sourceId: issue.sourceId,
    message: issue.message,
  }));
}

export function placeTechnicalFlatPrimitive(primitive: TechnicalFlatPrimitive, roleId: string,
  placement: FlatRoleTransform | undefined, issues?: TechnicalFlatLiveIssue[]) {
  if (!placement) {
    const issue = {
    stage: "transform" as const,
    sourceId: primitive.source.sourceId,
    message: `Source “${primitive.source.sourceId}” has no sewn placement on this face; the flat is withheld.`,
    };
    issues?.push(issue);
    return [];
  }
  return [{ placed: transformFlatPrimitive(primitive, { offset: placement.offset,
    rotationDegrees: placement.rotationDegrees, mirrorX: placement.mirrorX ?? false }), roleId, placement }];
}

export function technicalFlatPrimitiveRole(primitive: TechnicalFlatPrimitive, primitives: readonly TechnicalFlatPrimitive[], roleIds: readonly string[]): string {
  if (primitive.kind === "artwork") return primitive.targetRoleId;
  const sourceId = primitive.kind === "callout"
    ? primitives.find((candidate) => candidate.id === primitive.anchor.primitiveId)?.source.sourceId ?? ""
    : primitive.source.sourceId;
  const sourceTokens = sourceId.split(":");
  const hasIdentifier = (marker: string, roleId: string, requireFollowingToken = false) =>
    sourceTokens.some((token, index) => token === marker
      && sourceTokens[index + 1] === roleId
      && (!requireFollowingToken || sourceTokens[index + 2] !== undefined));
  return roleIds.find((roleId) => hasIdentifier("role", roleId)
    || hasIdentifier("mark", roleId, true) || hasIdentifier("dart", roleId, true)) ?? "";
}

/** Close only the approved Woven sleeve colorway fills from the exact assembled
 * body seam graph. Any missing or ambiguous source pairing leaves a hold issue. */
export function projectWovenSleeveFillClosures(transformed: TechnicalFlatPrimitive[]): TechnicalFlatLiveIssue[] {
  const closureIssues: TechnicalFlatLiveIssue[] = [];
    const seamPaths = transformed.filter((primitive): primitive is Extract<TechnicalFlatPrimitive, { kind: "path" }> => primitive.kind === "path" && primitive.id.includes(":view-seam:woven-sleeve-cap:"));
    const endpoints = (primitive: Extract<TechnicalFlatPrimitive, { kind: "path" }>): [FlatPoint, FlatPoint] | undefined => {
      const first = primitive.commands.find((command) => command.op === "move");
      const last = primitive.commands[primitive.commands.length - 1];
      if (first?.op !== "move" || !last || last.op === "close") return undefined;
      return [first.point, last.point];
    };
    const pathEnds = seamPaths.map(endpoints);
    const neighbors = seamPaths.map(() => new Set<number>());
    for (let left = 0; left < pathEnds.length; left += 1) for (let right = left + 1; right < pathEnds.length; right += 1) {
      const a = pathEnds[left]; const b = pathEnds[right];
      if (a && b && a.some((point) => b.some((other) => Math.hypot(point.x - other.x, point.y - other.y) <= 1e-6))) {
        neighbors[left]!.add(right); neighbors[right]!.add(left);
      }
    }
    const components: { indexes: number[]; terminals: FlatPoint[] }[] = [];
    const visited = new Set<number>();
    for (let seed = 0; seed < seamPaths.length; seed += 1) {
      if (visited.has(seed)) continue;
      const queue = [seed]; const indexes: number[] = []; visited.add(seed);
      while (queue.length) {
        const current = queue.shift()!; indexes.push(current);
        for (const next of neighbors[current]!) if (!visited.has(next)) { visited.add(next); queue.push(next); }
      }
      const vertices: { point: FlatPoint; degree: number }[] = [];
      for (const index of indexes) for (const endpoint of pathEnds[index] ?? []) {
        const vertex = vertices.find((candidate) => Math.hypot(candidate.point.x - endpoint.x, candidate.point.y - endpoint.y) <= 1e-6);
        if (vertex) vertex.degree += 1; else vertices.push({ point: endpoint, degree: 1 });
      }
      components.push({ indexes, terminals: vertices.filter((vertex) => vertex.degree === 1).map((vertex) => vertex.point) });
    }
    const closures = transformed.filter((primitive): primitive is Extract<TechnicalFlatPrimitive, { kind: "path" }> =>
      primitive.kind === "path" && primitive.colorwayBoundaryOnly === true
        && primitive.id.includes(":view-boundary:approved-woven-sleeve-area-closure"));
    const sleeveOutlines = transformed.filter((primitive): primitive is Extract<TechnicalFlatPrimitive, { kind: "path" }> =>
      primitive.kind === "path" && primitive.id.includes(":component:sleeve:outline"));
    const usedComponents = new Set<number>();
    for (const closure of closures) {
      const start = closure.commands.find((command) => command.op === "move");
      if (start?.op !== "move") continue;
      const sleeveOutline = sleeveOutlines.find((candidate) => {
        const points = endpoints(candidate);
        return !!points && Math.hypot(points[1].x - start.point.x, points[1].y - start.point.y) <= 1e-6;
      });
      const sleeveEnds = sleeveOutline && endpoints(sleeveOutline);
      if (!sleeveEnds) {
        closureIssues.push({ stage: "transform", sourceId: closure.source.sourceId,
          message: "The approved Woven sleeve-cap fill closure has no exact same-instance sleeve hem endpoint." });
        continue;
      }
      const ranked = components.map((component, index) => ({ component, index,
        distance: Math.min(...component.terminals.map((point) => Math.hypot(point.x - sleeveEnds[0].x, point.y - sleeveEnds[0].y))) }))
        .filter((entry) => !usedComponents.has(entry.index) && entry.component.terminals.length === 2)
        .sort((a, b) => a.distance - b.distance);
      if (ranked.length === 0 || !Number.isFinite(ranked[0]!.distance) || ranked[0]!.distance > 1e-6
        || (ranked.length > 1 && Math.abs(ranked[0]!.distance - ranked[1]!.distance) < 1e-7)) {
        closureIssues.push({ stage: "transform", sourceId: "view:woven-shirt:sleeve:cap-seam-closure",
          message: "The approved Woven sleeve-cap seam does not resolve one unambiguous paired body contour for the sleeve fill closure." });
        continue;
      }
      const match = ranked[0]!; usedComponents.add(match.index);
      const target = [...match.component.terminals].sort((a, b) =>
        Math.hypot(b.x - sleeveEnds[0].x, b.y - sleeveEnds[0].y) - Math.hypot(a.x - sleeveEnds[0].x, a.y - sleeveEnds[0].y))[0]!;
      const last = closure.commands[closure.commands.length - 1];
      if (!last || last.op !== "line") {
        closureIssues.push({ stage: "transform", sourceId: closure.source.sourceId,
          message: "The approved Woven sleeve-cap fill closure must end at one exact line station." });
        continue;
      }
      transformed[transformed.indexOf(closure)] = { ...closure, commands: [...closure.commands.slice(0, -1), { op: "line", point: target }] };
    }
    if (usedComponents.size !== components.length || closures.length !== components.length) {
      closureIssues.push({ stage: "transform", sourceId: "view:woven-shirt:sleeve:cap-seam-closure",
        message: "The approved Woven sleeve-cap seam and reflected sleeve instances do not form a one-to-one set of closed colorway contours." });
    }
    for (const seam of seamPaths) transformed.push({ ...seam,
      id: `${seam.id}:sleeve-fill-boundary`, layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source: { ...seam.source, sourceId: `view:woven-shirt:role:sleeve:decision:G04-S344-WOVEN-SLEEVE-CAP-PROJECTION:body-edge:${seam.source.sourceId}` },
      colorwayBoundaryOnly: true,
    });

  return closureIssues;
}

/** Close the Polo reflected sleeve colorway contours on the exact receiving
 * armhole shoulder stations chosen by its normalized-arclength view map. The
 * pattern cap endpoint and receiving endpoint may differ because of ease. */
export function projectPoloSleeveFillClosures(
  transformed: TechnicalFlatPrimitive[], revisionId: string,
): TechnicalFlatLiveIssue[] {
  const issues: TechnicalFlatLiveIssue[] = [];
  const seamPaths = transformed.filter((primitive): primitive is Extract<TechnicalFlatPrimitive, { kind: "path" }> =>
    primitive.kind === "path" && primitive.id.includes(":view-seam:polo-sleeve-cap:"));
  const closures = transformed.filter((primitive): primitive is Extract<TechnicalFlatPrimitive, { kind: "path" }> =>
    primitive.kind === "path" && primitive.colorwayBoundaryOnly === true
      && primitive.id.includes(":view-boundary:approved-sleeve-area-closure")
      && primitive.source.sourceId.includes("G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH"));
  const sleeveOutlines = transformed.filter((primitive): primitive is Extract<TechnicalFlatPrimitive, { kind: "path" }> =>
    primitive.kind === "path" && primitive.id.includes(":component:sleeve:outline"));
  const endpoints = (primitive: Extract<TechnicalFlatPrimitive, { kind: "path" }>) => {
    const first = primitive.commands.find((command) => command.op === "move");
    const last = primitive.commands[primitive.commands.length - 1];
    return first?.op === "move" && last && last.op !== "close"
      ? [first.point, last.point] as const : undefined;
  };
  const usedSeams = new Set<string>();
  for (const closure of closures) {
    const start = closure.commands.find((command) => command.op === "move");
    const last = closure.commands[closure.commands.length - 1];
    if (start?.op !== "move" || last?.op !== "line") {
      issues.push({ stage: "transform", sourceId: closure.source.sourceId,
        message: "The approved Polo sleeve colorway closure must have exact hem and shoulder endpoints." });
      continue;
    }
    const outline = sleeveOutlines.find((candidate) => {
      const ends = endpoints(candidate);
      return !!ends && ends.some((point) => Math.hypot(point.x - start.point.x, point.y - start.point.y) <= 1e-6);
    });
    if (!outline || closure.source.revisionId !== revisionId) {
      issues.push({ stage: "transform", sourceId: closure.source.sourceId,
        message: "The approved Polo sleeve colorway closure has no exact same-revision reflected sleeve contour." });
      continue;
    }
    const candidates = seamPaths.flatMap((seam) => {
      const ends = endpoints(seam);
      return seam.source.revisionId === revisionId && ends
        ? [{ seam, shoulder: ends[0], distance: Math.hypot(ends[0].x - last.point.x, ends[0].y - last.point.y) }] : [];
    }).sort((a, b) => a.distance - b.distance);
    const nearest = candidates[0];
    if (!nearest || usedSeams.has(nearest.seam.id)
      || (candidates[1] && Math.abs(candidates[1].distance - nearest.distance) <= 1e-7)) {
      issues.push({ stage: "transform", sourceId: closure.source.sourceId,
        message: "The approved Polo sleeve colorway closure does not resolve one unique receiving armhole shoulder station." });
      continue;
    }
    const armholeSource = /^pattern:polo:role:(front|back):edge:armhole$/u.exec(nearest.seam.source.sourceId);
    if (!armholeSource || (nearest.seam.sourceEdgeIds !== undefined
      && (nearest.seam.sourceEdgeIds.length !== 1 || nearest.seam.sourceEdgeIds[0] !== nearest.seam.source.sourceId))) {
      issues.push({ stage: "transform", sourceId: closure.source.sourceId,
        message: "The approved Polo sleeve colorway boundary requires the exact mapped same-revision front/back armhole source edge." });
      continue;
    }
    usedSeams.add(nearest.seam.id);
    transformed[transformed.indexOf(closure)] = { ...closure,
      commands: [...closure.commands.slice(0, -1), { op: "line", point: nearest.shoulder }] };
    transformed.push({ ...nearest.seam,
      id: `${nearest.seam.id}:polo-sleeve-colorway-boundary`,
      layer: "GARMENT_SILHOUETTE", feature: "silhouette",
      source: { ...nearest.seam.source, sourceId: `view:polo:role:sleeve:decision:G04-S351-POLO-CAP-ARMHOLE-ARCLENGTH:armhole-boundary:${armholeSource[1]}` },
      sourceEdgeIds: [nearest.seam.source.sourceId], colorwayBoundaryOnly: true,
    });
  }
  if (closures.length !== 2 || seamPaths.length !== 2 || usedSeams.size !== seamPaths.length) {
    issues.push({ stage: "transform", sourceId: "view:polo:sleeve:cap-armhole-closure",
      message: "The approved Polo sleeve colorway projection requires two exact reflected sleeve closures and receiving armhole contours." });
  }
  return issues;
}

/** Add approved Polo dimension references after same-face assembly transforms are known. */
export function mapPoloDimensionCallouts(block: Block, kind: TechnicalFlatViewKind,
  poms: readonly Pom[], callouts: readonly FlatCalloutPrimitive[], transforms: Readonly<Record<string, FlatRoleTransform>>) {
  const issues: TechnicalFlatLiveIssue[] = [];
  const mapped = callouts.map((callout) => {
    const pom = poms.find((candidate) => `pom:polo:${candidate.label.toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}` === callout.source.sourceId);
    const dimension = pom?.viewDimension;
    if (!dimension || dimension.view !== kind) return callout;
    if (dimension.kind === "edge-length") {
      const placement = transforms[dimension.roleId];
      const edge = block.roles[dimension.roleId]?.edges.find((candidate) => candidate.name === dimension.edgeId);
      if (!placement || !edge) {
        issues.push({ stage: "pom", sourceId: callout.source.sourceId,
          message: "The exact collar-fold dimension reference has no same-revision source edge or face transform." });
        return callout;
      }
      const sourceEntityId = `pattern:polo:role:${dimension.roleId}:edge:${dimension.edgeId}`;
      const transform = { offset: placement.offset, rotationDegrees: placement.rotationDegrees, mirrorX: placement.mirrorX ?? false };
      return { ...callout, layer: "ANNOTATION" as const, dimensionReferences: { kind: "edge-length" as const, references: [
        { point: transformFlatPoint(edgeStart(edge), transform), sourceEntityId },
        { point: transformFlatPoint(edgeEnd(edge), transform), sourceEntityId },
      ] } };
    }
    const placement = transforms[dimension.lowerRoleId];
    const upperEdge = block.roles[dimension.upperRoleId]?.edges.find((candidate) => candidate.name === dimension.upperEdgeId);
    const lowerEdge = block.roles[dimension.lowerRoleId]?.edges.find((candidate) => candidate.name === dimension.lowerEdgeId);
    if (!placement || !upperEdge || !lowerEdge) {
      issues.push({ stage: "pom", sourceId: callout.source.sourceId,
        message: "The exact two hem-level references have no same-revision source edges or back-face transform." });
      return callout;
    }
    // The bracket sits just beyond the back hem's side endpoint; source levels
    // are projected there without drawing a front-to-back join.
    const transform = { offset: placement.offset, rotationDegrees: placement.rotationDegrees, mirrorX: placement.mirrorX ?? false };
    const projected = (y: number) => transformFlatPoint({ x: edgeStart(lowerEdge).x + 1, y }, transform);
    return { ...callout, layer: "ANNOTATION" as const, dimensionReferences: { kind: "vertical-levels" as const, references: [
      { point: projected(edgeStart(upperEdge).y), sourceEntityId: `pattern:polo:role:${dimension.upperRoleId}:edge:${dimension.upperEdgeId}` },
      { point: projected(edgeStart(lowerEdge).y), sourceEntityId: `pattern:polo:role:${dimension.lowerRoleId}:edge:${dimension.lowerEdgeId}` },
    ] } };
  });
  return { callouts: mapped, issues };
}

/** Apply the approved Polo-only, view-bound C marker and unchanged POM schedule. */
export function mapPoloCollarPointKeyedCallout(kind: TechnicalFlatViewKind, revisionId: string,
  callouts: readonly FlatCalloutPrimitive[]) {
  const sourceId = "pom:polo:collar-point-extension";
  if (kind !== "FRONT_FLAT") return { callouts, issues: [] as TechnicalFlatLiveIssue[] };
  const matches = callouts.filter((callout) => callout.source.sourceId === sourceId);
  if (matches.length === 0) return { callouts, issues: [] as TechnicalFlatLiveIssue[] };
  const callout = matches[0]!;
  if (matches.length !== 1 || callout.source.revisionId !== revisionId
    || callout.anchor.primitiveId !== "flat:polo:FRONT_FLAT:component:upperCollar:outline"
    || callout.anchor.sourceEntityId !== "pattern:polo:role:upperCollar:edge:frontTip") {
    return { callouts, issues: [{ stage: "pom" as const, sourceId,
      message: "The approved Polo collar-point key requires one exact same-revision upperCollar.frontTip endpoint mapped to its front outline." }] };
  }
  return { callouts: callouts.map((candidate) => candidate.id === callout.id ? { ...candidate,
    presentation: { kind: "keyed-marker-schedule" as const, key: "C", markerRadiusCm: 0.22 } } : candidate),
  issues: [] as TechnicalFlatLiveIssue[] };
}

/** Apply the approved Woven-only keyed presentation to the exact front placket-width POM. */
export function mapWovenPlacketWidthKeyedCallout(kind: TechnicalFlatViewKind, revisionId: string,
  callouts: readonly FlatCalloutPrimitive[], required = false) {
  const sourceId = "pom:woven-shirt:finished-placket-width";
  if (kind !== "FRONT_FLAT") return { callouts, issues: [] as TechnicalFlatLiveIssue[] };
  const matches = callouts.filter((callout) => callout.source.sourceId === sourceId);
  if (matches.length === 0) return { callouts, issues: required ? [{ stage: "pom" as const, sourceId,
    message: "The approved Woven W key requires the finished-placket-width POM on the front flat." }] : [] as TechnicalFlatLiveIssue[] };
  const callout = matches[0]!;
  if (matches.length !== 1 || callout.source.revisionId !== revisionId
    || callout.anchor.primitiveId !== "flat:woven-shirt:FRONT_FLAT:component:buttonPlacket:outline"
    || callout.anchor.sourceEntityId !== "pattern:woven-shirt:role:buttonPlacket:edge:top") {
    return { callouts, issues: [{ stage: "pom" as const, sourceId,
      message: "The Woven W key requires one exact same-revision buttonPlacket.top midpoint mapped to its front outline." }] };
  }
  return { callouts: callouts.map((candidate) => candidate.id === callout.id ? { ...candidate, layer: "ANNOTATION" as const,
    presentation: { kind: "keyed-marker-schedule" as const, key: "W", markerRadiusCm: 0.22, markerStyle: "open-halo" as const } }
    : candidate), issues: [] as TechnicalFlatLiveIssue[] };
}

/** Map the source interval POM to its approved derived midpoint marker without
 * changing the source anchor, measurement, or schedule row. */
export function mapWovenButtonSpacingKeyedCallout(kind: TechnicalFlatViewKind, revisionId: string,
  callouts: readonly FlatCalloutPrimitive[], marks: readonly TechnicalFlatPrimitive[]) {
  const sourceId = "pom:woven-shirt:front-button-spacing";
  if (kind !== "FRONT_FLAT") return { callouts, issues: [] as TechnicalFlatLiveIssue[] };
  const matches = callouts.filter((candidate) => candidate.source.sourceId === sourceId);
  if (matches.length === 0) return { callouts, issues: [] as TechnicalFlatLiveIssue[] };
  const markIds = ["button-1", "button-2"] as const;
  const sources = markIds.map((markName) => `pattern:woven-shirt:mark:buttonPlacket:${markName}`);
  const resolved = sources.map((sourceEntityId) => marks.filter((candidate): candidate is Extract<TechnicalFlatPrimitive, { kind: "mark" }> => candidate.kind === "mark"
    && candidate.source.sourceId === sourceEntityId && candidate.source.revisionId === revisionId));
  const callout = matches[0];
  if (matches.length !== 1 || !callout || callout.source.revisionId !== revisionId
    || callout.anchor.primitiveId !== "flat:woven-shirt:FRONT_FLAT:mark:buttonPlacket:button-1"
    || callout.anchor.sourceEntityId !== sources[0] || resolved.some((items) => items.length !== 1)) {
    return { callouts, issues: [{ stage: "pom" as const, sourceId,
      message: "The approved Woven D key requires the exact same-revision front POM and one emitted button-1/button-2 mark pair." }] };
  }
  const first = resolved[0]![0]!;
  const second = resolved[1]![0]!;
  const point = { x: (first.at.x + second.at.x) / 2, y: (first.at.y + second.at.y) / 2 };
  return { callouts: callouts.map((candidate) => candidate.id === callout.id ? { ...candidate, layer: "ANNOTATION" as const,
    presentation: { kind: "keyed-marker-schedule" as const, key: "D", markerRadiusCm: 0.22,
      markerStyle: "open-halo" as const, markerPoint: { point, sourceEntityIds: sources } } } : candidate),
  issues: [] as TechnicalFlatLiveIssue[] };
}

function pathSubpaths(primitive: Extract<TechnicalFlatPrimitive, { kind: "path" }>) {
  const groups: FlatPathCommand[][] = [];
  let current: FlatPathCommand[] = [];
  for (const command of primitive.commands) {
    if (command.op === "move" && current.length) { groups.push(current); current = []; }
    current.push(command);
  }
  if (current.length) groups.push(current);
  return groups;
}

/** Attach the approved exact source-edge masks to the assembled Woven front.
 * Missing or ambiguous source subpaths fail closed. */
export function applyWovenFrontApprovedViewClips(primitives: readonly TechnicalFlatPrimitive[], revisionId: string) {
  const rules = [
    { source: "pattern:woven-shirt:role:front:edge:neckline", decisionId: "G04-S457-WOVEN-NECKLINE-LEAF-MASK", roles: ["underCollar", "upperCollar"] },
    { source: "pattern:woven-shirt:role:front:edge:shoulder", decisionId: "G04-S404-WOVEN-SHOULDER-COLLAR-OCCLUSION", roles: ["outerStand"] },
    { source: "pattern:woven-shirt:role:buttonPlacket:edge:top", decisionId: "G04-S406-WOVEN-COLLAR-OVER-PLACKETS", roles: ["outerStand", "underCollar", "upperCollar"] },
    { source: "pattern:woven-shirt:role:buttonPlacket:edge:outerRaw", decisionId: "G04-S406-WOVEN-COLLAR-OVER-PLACKETS", roles: ["pocket", "outerStand", "underCollar", "upperCollar"] },
    { source: "pattern:woven-shirt:role:buttonholePlacket:edge:top", decisionId: "G04-S406-WOVEN-COLLAR-OVER-PLACKETS", roles: ["outerStand", "underCollar", "upperCollar"] },
    { source: "pattern:woven-shirt:role:buttonholePlacket:edge:outerRaw", decisionId: "G04-S406-WOVEN-COLLAR-OVER-PLACKETS", roles: ["outerStand", "underCollar", "upperCollar"] },
  ] as const;
  const issues: TechnicalFlatLiveIssue[] = [];
  const targets = new Map<string, { owner: Extract<TechnicalFlatPrimitive, { kind: "path" }>;
    clipped: Map<number, (typeof rules)[number]> }>();
  for (const rule of rules) {
    const wholePrimitiveSource = rule.source === "pattern:woven-shirt:role:front:edge:neckline";
    const owners = primitives.filter((primitive): primitive is Extract<TechnicalFlatPrimitive, { kind: "path" }> => primitive.kind === "path"
      && primitive.source.revisionId === revisionId
      && (wholePrimitiveSource ? primitive.layer === "SEAM" && primitive.feature === "seam"
        && (primitive.source.sourceId === rule.source || primitive.sourceEdgeIds?.includes(rule.source) === true)
        : primitive.sourceEdgeIds !== undefined && primitive.sourceEdgeIds.includes(rule.source)));
    const occurrences = owners.flatMap((owner) => pathSubpaths(owner).map((commands, groupIndex) => ({ owner,
      commands, groupIndex, sourceEdgeId: owner.sourceEdgeIds?.[groupIndex]
        ?? (wholePrimitiveSource && owner.source.sourceId === rule.source ? rule.source : undefined) }))
      .filter((item) => item.sourceEdgeId === rule.source));
    const expectedCount = rule.source.includes(":role:front:") ? 2 : 1;
    if (occurrences.length !== expectedCount || occurrences.some((item) => !item.sourceEdgeId)) {
      issues.push({ stage: "transform", sourceId: rule.source,
        message: `Approved Woven view clipping requires ${expectedCount} exact same-revision assembled ${rule.source.split(":")[rule.source.split(":").length - 1]} edge instance(s); found ${occurrences.length} from ${owners.length} source path(s) [${owners.map((owner) => owner.id).join(", " )}], so this face is withheld.` });
      continue;
    }
    for (const item of occurrences) {
      const ownerId = item.owner.id;
      const target = targets.get(ownerId) ?? { owner: item.owner, clipped: new Map<number, (typeof rules)[number]>() };
      const groupIndex = item.groupIndex;
      target.clipped.set(groupIndex, rule);
      targets.set(ownerId, target);
    }
  }
  if (issues.length) return { primitives, issues };
  const replacements = new Map<string, TechnicalFlatPrimitive[]>();
  for (const [ownerId, target] of targets) {
    const groups = pathSubpaths(target.owner);
    // A target can only be added by the exact-edge filter above.
    const sourceIds = target.owner.sourceEdgeIds
      ?? groups.map(() => target.owner.source.sourceId);
    const calloutEdges = primitives.filter((primitive): primitive is FlatCalloutPrimitive => primitive.kind === "callout"
      && primitive.anchor.primitiveId === ownerId && primitive.anchor.sourceEntityId !== undefined)
      .map((primitive) => primitive.anchor.sourceEntityId!);
    const preferredIndex = sourceIds.findIndex((sourceId) => calloutEdges.includes(sourceId));
    const retained = groups.flatMap((commands, index) => target.clipped.has(index)
      ? [] : [{ commands, sourceEdgeId: sourceIds[index] }]);
    const output: TechnicalFlatPrimitive[] = [];
    if (retained.length) output.push({ ...target.owner, id: preferredIndex < 0 || !target.clipped.has(preferredIndex)
      ? ownerId : `${ownerId}:unclipped-edges`,
      commands: retained.flatMap((part) => part.commands), sourceEdgeIds: retained.map((part) => part.sourceEdgeId!).filter(Boolean) });
    for (const [index, rule] of target.clipped) output.push({ ...target.owner,
      id: index === preferredIndex ? ownerId : `${ownerId}:view-clip-${rule.source.split(":")[rule.source.split(":").length - 1]}`,
      commands: groups[index]!, sourceEdgeIds: [rule.source],
      viewClip: { decisionId: rule.decisionId, roleIds: [...rule.roles] } });
    replacements.set(ownerId, output);
  }
  const output = primitives.flatMap((primitive) => replacements.get(primitive.id) ?? [primitive]);
  return { primitives: output, issues };
}

/** Apply the approved source-centered Polo keys while retaining one full POM
 * schedule row per source measurement. These are display anchors, not joins. */
export function mapPoloSourceCenteredKeyedCallouts(kind: TechnicalFlatViewKind, revisionId: string,
  callouts: readonly FlatCalloutPrimitive[], requiredPomSourceIds: readonly string[] = []) {
  const keyed = [
    ["pom:polo:across-shoulder", "A", "flat:polo:FRONT_FLAT:component:front:outline", "pattern:polo:role:front:edge:shoulder"],
    ["pom:polo:body-chest-finished", "B", "flat:polo:FRONT_FLAT:component:front:outline", "pattern:polo:role:front:edge:side"],
    ["pom:polo:sleeve-bicep-width", "B", "flat:polo:FRONT_FLAT:component:sleeve:outline", "pattern:polo:role:sleeve:edge:sideLeft"],
    ["pom:polo:button-spacing", "D", "flat:polo:FRONT_FLAT:mark:buttonPlacket:button-1", "pattern:polo:mark:buttonPlacket:button-1"],
    ["pom:polo:finished-placket-length", "E", "flat:polo:FRONT_FLAT:component:buttonPlacket:outline", "pattern:polo:role:buttonPlacket:edge:attachmentRaw"],
    ["pom:polo:finished-placket-width", "FG", "flat:polo:FRONT_FLAT:mark:buttonPlacket:attachmentLine", "pattern:polo:mark:buttonPlacket:attachmentLine"],
    ["pom:polo:front-neck-drop", "FG", "flat:polo:FRONT_FLAT:component:front:outline", "pattern:polo:role:front:edge:neckline"],
    ["pom:polo:finished-collar-stand-height", "J", "flat:polo:FRONT_FLAT:component:outerStand:outline", "pattern:polo:role:outerStand:edge:frontEnd"],
    ["pom:polo:stand-front-rise", "FG", "flat:polo:FRONT_FLAT:component:outerStand:outline", "pattern:polo:role:outerStand:edge:frontNeckline"],
    ["pom:polo:neck-width", "H", "flat:polo:FRONT_FLAT:component:front:outline", "pattern:polo:role:front:edge:shoulder"],
    ["pom:polo:shoulder-seam", "H", "flat:polo:FRONT_FLAT:component:front:outline", "pattern:polo:role:front:edge:shoulder"],
    ["pom:polo:finished-pointed-collar-leaf", "I", "flat:polo:FRONT_FLAT:component:upperCollar:outline", "pattern:polo:role:upperCollar:edge:centerBack"],
  ] as const;
  if (kind !== "FRONT_FLAT") return { callouts, issues: [] as TechnicalFlatLiveIssue[] };
  const issues: TechnicalFlatLiveIssue[] = [];
  const mapped = callouts.map((callout) => {
    const row = keyed.find(([sourceId]) => sourceId === callout.source.sourceId);
    if (!row) return callout;
    const [sourceId, key, targetId, sourceEntityId] = row;
    const matches = callouts.filter((candidate) => candidate.source.sourceId === sourceId);
    if (matches.length !== 1 || callout.source.revisionId !== revisionId
      || callout.anchor.primitiveId !== targetId || callout.anchor.sourceEntityId !== sourceEntityId) {
      issues.push({ stage: "pom", sourceId,
        message: `Polo ${key} key requires one exact same-revision source POM and its approved target and source entity.` });
      return callout;
    }
    return { ...callout, layer: "ANNOTATION" as const,
      presentation: { kind: "keyed-marker-schedule" as const, key, markerRadiusCm: 0.22,
        markerStyle: key === "H" ? "segmented-open-halo" as const : "open-halo" as const } };
  });
  for (const [sourceId, key] of keyed) {
    if (requiredPomSourceIds.includes(sourceId) && !callouts.some((callout) => callout.source.sourceId === sourceId)) {
      issues.push({ stage: "pom", sourceId,
        message: `Polo ${key} keyed schedule is missing a required source POM for this recipe revision.` });
    }
  }
  const fgIds = ["pom:polo:finished-placket-width", "pom:polo:front-neck-drop", "pom:polo:stand-front-rise"];
  const fgCallouts = fgIds.map((sourceId) => callouts.filter((callout) => callout.source.sourceId === sourceId));
  const fgRequired = fgIds.some((sourceId) => requiredPomSourceIds.includes(sourceId));
  const fgPresent = fgCallouts.every((matches) => matches.length === 1);
  if ((fgRequired || fgCallouts.some((matches) => matches.length > 0)) && !fgPresent) {
    issues.push({ stage: "pom", sourceId: "pom:polo:fg-schedule-group",
      message: "The approved Polo FG display requires exactly one same-revision placket-width, front-neck-drop, and stand-front-rise POM." });
  }
  if (!fgPresent) return { callouts: mapped, issues };
  const fgMembers = fgCallouts.map((matches) => matches[0]!);
  const standFrontRise = fgMembers[2]!;
  const expectedTargets = [
    ["flat:polo:FRONT_FLAT:mark:buttonPlacket:attachmentLine", "pattern:polo:mark:buttonPlacket:attachmentLine"],
    ["flat:polo:FRONT_FLAT:component:front:outline", "pattern:polo:role:front:edge:neckline"],
    ["flat:polo:FRONT_FLAT:component:outerStand:outline", "pattern:polo:role:outerStand:edge:frontNeckline"],
  ] as const;
  const fgSourcesMatch = fgMembers.every((callout, index) => callout.source.revisionId === revisionId
    && callout.anchor.primitiveId === expectedTargets[index]![0]
    && callout.anchor.sourceEntityId === expectedTargets[index]![1]);
  if (!fgSourcesMatch) {
    issues.push({ stage: "pom", sourceId: "pom:polo:fg-schedule-group",
      message: "The approved Polo FG display requires three exact same-revision source POMs and their distinct mapped anchors." });
    return { callouts: mapped, issues };
  }
  const markerPoint = { point: standFrontRise.anchor.point,
    sourceEntityIds: fgMembers.map((callout) => callout.anchor.sourceEntityId!) };
  const grouped = mapped.map((callout) => fgIds.includes(callout.source.sourceId) && callout.presentation?.key === "FG"
    ? { ...callout, presentation: { ...callout.presentation, markerPoint } } : callout);
  return { callouts: grouped, issues };
}

export function reflectFoldPrimitive(
  primitive: TechnicalFlatPrimitive,
  foldEdgeId: string,
): TechnicalFlatPrimitive | undefined {
  if (primitive.kind === "path") {
    if (primitive.sourceEdgeIds) {
      const keepIndexes = primitive.sourceEdgeIds.flatMap((sourceId, index) =>
        sourceId.endsWith(`:edge:${foldEdgeId}`) ? [] : [index]);
      if (keepIndexes.length === 0) return undefined;
      return {
        ...primitive,
        id: `${primitive.id}:fold-reflection`,
        sourceEdgeIds: keepIndexes.map((index) => primitive.sourceEdgeIds![index]!),
        commands: keepIndexes.flatMap((index) => primitive.commands.slice(index * 2, index * 2 + 2)),
      };
    }
    const points = primitive.commands.flatMap((command) => {
      if (command.op === "close") return [];
      if (command.op === "cubic") return [command.control1, command.control2, command.point];
      return [command.point];
    });
    if (points.length === 0 || points.every((point) => point.x === 0)) return undefined;
    return { ...primitive, id: `${primitive.id}:fold-reflection` };
  }
  if (primitive.kind === "mark") {
    return primitive.at.x === 0 ? undefined : { ...primitive, id: `${primitive.id}:fold-reflection` };
  }
  if (primitive.kind === "circle") {
    return primitive.center.x === 0 ? undefined : { ...primitive, id: `${primitive.id}:fold-reflection` };
  }
  return undefined;
}

export function reflectPhysicalPairPrimitive(
  primitive: TechnicalFlatPrimitive,
  reflection: FlatProjectionPhysicalPairReflection | undefined,
  placement: FlatRoleTransform | undefined,
): TechnicalFlatPrimitive | undefined {
  if (!reflection || !placement || primitive.source.sourceClass !== "PATTERN_DERIVED") return undefined;
  const reflected = reflectFoldPrimitive(primitive, reflection.edgeId);
  if (!reflected) return undefined;
  return transformFlatPrimitive({
    ...reflected,
    id: reflected.id.replace(/:fold-reflection$/, ":physical-pair-reflection"),
  }, {
    offset: placement.offset,
    rotationDegrees: placement.rotationDegrees,
    mirrorX: true,
  });
}

export function appendPhysicalPairReflection(
  primitives: TechnicalFlatPrimitive[],
  primitive: TechnicalFlatPrimitive,
  reflection: FlatProjectionPhysicalPairReflection | undefined,
  placement: FlatRoleTransform | undefined,
): void {
  const mirrored = reflectPhysicalPairPrimitive(primitive, reflection, placement);
  if (mirrored) primitives.push(mirrored);
}

function pointOnLine(point: FlatPoint, start: FlatPoint, end: FlatPoint): boolean {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  const cross = Math.abs((point.x - start.x) * dy - (point.y - start.y) * dx);
  const dot = (point.x - start.x) * dx + (point.y - start.y) * dy;
  return cross <= 1e-8 * length && dot >= -1e-8 && dot <= length * length + 1e-8;
}

function reflectPointAcrossLine(point: FlatPoint, start: FlatPoint, end: FlatPoint): FlatPoint {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const nearest = { x: start.x + projection * dx, y: start.y + projection * dy };
  return { x: 2 * nearest.x - point.x, y: 2 * nearest.y - point.y };
}

/** Reflect source-derived geometry across a sewn-to panel axis in assembled coordinates. */
export function reflectPrimitiveAcrossLine(
  primitive: TechnicalFlatPrimitive, start: FlatPoint, end: FlatPoint,
): TechnicalFlatPrimitive | undefined {
  if (!(Math.hypot(end.x - start.x, end.y - start.y) > 0)) return undefined;
  if (primitive.kind === "path") {
    const groups: FlatPathCommand[][] = [];
    let current: FlatPathCommand[] = [];
    for (const command of primitive.commands) {
      if (command.op === "move" && current.length > 0) {
        groups.push(current);
        current = [];
      }
      current.push(command);
    }
    if (current.length > 0) groups.push(current);
    if (primitive.sourceEdgeIds && primitive.sourceEdgeIds.length !== groups.length) return undefined;
    const commands: FlatPathCommand[] = [];
    const sourceEdgeIds: string[] = [];
    groups.forEach((group, index) => {
      // A component's own fold edge is the shared center boundary. Its sewn-to
      // panel places that boundary on the same axis, so reflecting it would
      // emit a duplicate seam even when the assembly fit has tiny residuals.
      if (primitive.sourceEdgeIds?.[index]?.endsWith(":edge:fold")) return;
      const points = group.flatMap((command) => command.op === "cubic"
        ? [command.control1, command.control2, command.point]
        : command.op === "close" ? [] : [command.point]);
      if (points.length === 0 || points.every((point) => pointOnLine(point, start, end))) return;
      commands.push(...group.map((command) => {
        if (command.op === "close") return command;
        if (command.op === "cubic") return {
          ...command,
          control1: reflectPointAcrossLine(command.control1, start, end)!,
          control2: reflectPointAcrossLine(command.control2, start, end)!,
          point: reflectPointAcrossLine(command.point, start, end)!,
        };
        return { ...command, point: reflectPointAcrossLine(command.point, start, end)! };
      }));
      if (primitive.sourceEdgeIds) sourceEdgeIds.push(primitive.sourceEdgeIds[index]!);
    });
    if (commands.length === 0) return undefined;
    return { ...primitive, id: `${primitive.id}:attached-fold-reflection`, commands,
      ...(primitive.sourceEdgeIds ? { sourceEdgeIds } : {}) };
  }
  if (primitive.kind === "mark") {
    if (pointOnLine(primitive.at, start, end)) return undefined;
    return { ...primitive, id: `${primitive.id}:attached-fold-reflection`, at: reflectPointAcrossLine(primitive.at, start, end) };
  }
  if (primitive.kind === "circle") {
    if (pointOnLine(primitive.center, start, end)) return undefined;
    return { ...primitive, id: `${primitive.id}:attached-fold-reflection`, center: reflectPointAcrossLine(primitive.center, start, end) };
  }
  return undefined;
}

function placedPoint(pointValue: FlatPoint, placement: { readonly offset: FlatPoint; readonly rotationDegrees: number; readonly mirrorX?: boolean }): FlatPoint {
  const angle = placement.rotationDegrees * Math.PI / 180;
  const localX = placement.mirrorX ? -pointValue.x : pointValue.x;
  return {
    x: localX * Math.cos(angle) - pointValue.y * Math.sin(angle) + placement.offset.x,
    y: localX * Math.sin(angle) + pointValue.y * Math.cos(angle) + placement.offset.y,
  };
}

export function appendApprovedViewPairReflection(
  primitives: TechnicalFlatPrimitive[], primitive: TechnicalFlatPrimitive,
  reflection: FlatProjectionViewPairReflection | undefined, block: Block,
  transforms: Readonly<Record<string, FlatRoleTransform>>, issues: TechnicalFlatLiveIssue[],
): void {
  if (!reflection) return;
  const placement = transforms[reflection.axisRoleId];
  const piece = block.roles[reflection.axisRoleId];
  const edge = piece?.edges.find((candidate) => candidate.name === reflection.edgeId);
  if (!placement || !edge || edge.kind !== "line") {
    issues.push({ stage: "transform", sourceId: primitive.source.sourceId,
      message: `The approved paired view for “sleeve” has no exact assembled ${reflection.axisRoleId}.${reflection.edgeId} axis.` });
    return;
  }
  const start = placedPoint(edgeStart(edge), placement);
  const end = placedPoint(edgeEnd(edge), placement);
  const mirrored = reflectPrimitiveAcrossLine(primitive, start, end);
  if (mirrored) {
    primitives.push({ ...mirrored, id: mirrored.id.replace(/:attached-fold-reflection$/, ":approved-view-pair") });
  } else if (primitive.kind === "artwork" || primitive.kind === "text" || primitive.kind === "callout") {
    issues.push({ stage: "overlay", sourceId: primitive.source.sourceId,
      message: `The paired sleeve view cannot mirror ${primitive.kind} content without an explicit placement transform; the face is withheld.` });
  }
}

/** @internal Reflect one source-declared closure instance to its approved
 * opposite garment side without emitting the unreflected duplicate. */
export function appendOppositeSideReflection(
  primitives: TechnicalFlatPrimitive[], primitive: TechnicalFlatPrimitive,
  reflection: FlatProjectionOppositeSideReflection | undefined, block: Block,
  transforms: Readonly<Record<string, FlatRoleTransform>>, issues: TechnicalFlatLiveIssue[],
): boolean {
  if (!reflection) return false;
  const placement = transforms[reflection.axisRoleId];
  const piece = block.roles[reflection.axisRoleId];
  const edge = piece?.edges.find((candidate) => candidate.name === reflection.edgeId);
  if (!placement || !edge || edge.kind !== "line") {
    issues.push({ stage: "transform", sourceId: primitive.source.sourceId,
      message: `The approved left-side closure placement has no exact assembled ${reflection.axisRoleId}.${reflection.edgeId} axis.` });
    return true;
  }
  const start = placedPoint(edgeStart(edge), placement);
  const end = placedPoint(edgeEnd(edge), placement);
  const reflected = reflectPrimitiveAcrossLine(primitive, start, end);
  if (!reflected) {
    if (primitive.kind === "path" && primitive.colorwayBoundaryOnly === true
      && primitive.source.sourceId === "view:woven-shirt:role:buttonholePlacket:decision:G04-S321-WOVEN-CLOSURE-A:boundary:approved-woven-left-placket-area-closure"
      && primitive.commands.flatMap((command) => command.op === "cubic"
        ? [command.control1, command.control2, command.point]
        : command.op === "close" ? [] : [command.point]).every((point) => pointOnLine(point, start, end))) {
      // The approved left closure uses the source attachment edge lying on CF.
      // It is invariant under the right/left reflection, so emit one copy for
      // the reflected instance without drawing or duplicating a stroke.
      primitives.push({ ...primitive, id: `${primitive.id}:approved-left-closure` });
      return true;
    }
    issues.push({ stage: "transform", sourceId: primitive.source.sourceId,
      message: "The approved left buttonhole placket cannot be represented on its opposite front side from the current attachment geometry." });
    return true;
  }
  primitives.push({ ...reflected, id: reflected.id.replace(/:attached-fold-reflection$/, ":approved-left-closure") });
  return true;
}

/** Compose one face from a single exact block, revision and sewn-role solution. */
export function compileTechnicalFlatLiveView(input: TechnicalFlatLiveInput): TechnicalFlatLiveResult {
  const { recipe, block, revisionId, kind } = input;
  const projectionMap = createG04TechnicalFlatProjectionMap(recipe.name, block, revisionId);
  const geometry = compileTechnicalFlatSourceGeometry(recipe.name, block, revisionId, kind, projectionMap);
  const assembly = assembleTechnicalFlatRoles(recipe.name, block, kind, projectionMap);
  const wovenCollarProjectors = recipe.name === "woven-shirt"
    ? new Map(((["outerStand", "innerStand", "upperCollar", "underCollar"] as const).flatMap((roleId) => {
      const projector = createWovenCollarProjector(block, revisionId, roleId, kind, assembly.transforms);
      return projector ? [[roleId, projector] as const] : [];
    })))
    : new Map<WovenCollarRoleId, ReturnType<typeof createWovenCollarProjector> extends infer T ? Exclude<T, undefined> : never>();
  const waistbandFragments = recipe.name === "trouser"
    ? compileTrouserWaistbandFragments(block, revisionId, kind, assembly.sourceFragments, assembly.transforms)
    : { primitives: [], issues: [] };
  const overlays = compileTechnicalFlatOverlays(recipe, block, revisionId, input.placements,
    input.colorHex, input.texture, input.shine);
  let resolvePomAnchor: ((pom: GarmentRecipe["poms"][number], point: FlatPoint) =>
    TechnicalFlatPomResolvedAnchor | undefined) | undefined;
  if (recipe.name === "trouser") {
    resolvePomAnchor = (pom, point) => {
      const markAnchor = kind === "BACK_FLAT" ? pom.backMarkAnchor : undefined;
      if (markAnchor) {
        const target = waistbandFragments.primitives.find((primitive) => primitive.kind === "mark"
          && primitive.source.sourceId === `pattern:${recipe.name}:mark:${markAnchor.roleId}:${markAnchor.markName}`
          && primitive.source.revisionId === revisionId);
        return target?.kind === "mark" ? { targetGeometryId: target.id, point: target.at } : undefined;
      }
      const anchorRoleId = kind === "FRONT_FLAT" ? G04_TECHNICAL_FLAT_MAPPINGS[recipe.name]?.pomAnchorRole
        : G04_TECHNICAL_FLAT_MAPPINGS[recipe.name]?.backPomAnchorRole;
      const placement = anchorRoleId ? assembly.transforms[anchorRoleId] : undefined;
      return anchorRoleId && placement ? {
        targetGeometryId: `flat:${recipe.name}:${kind}:component:${anchorRoleId}:outline`,
        point: placedPoint(point, placement), sourcePoint: point,
      } : undefined;
    };
  } else if (recipe.name === "polo") {
    resolvePomAnchor = (pom, point) => {
      const markAnchor = kind === "FRONT_FLAT" ? pom.frontMarkAnchor
        : pom.backMarkAnchor ? { ...pom.backMarkAnchor, point: "at" as const } : undefined;
      const roleId = markAnchor?.roleId ?? (kind === "FRONT_FLAT"
        ? pom.anchorRoleId ?? G04_TECHNICAL_FLAT_MAPPINGS[recipe.name]?.pomAnchorRole
        : pom.backAnchorRoleId ?? G04_TECHNICAL_FLAT_MAPPINGS[recipe.name]?.backPomAnchorRole);
      // Undefined/nonexistent role IDs cannot match a transform key and stay fail-closed.
      const placement = assembly.transforms[roleId as string];
      if (!roleId || !placement) return undefined;
      if (markAnchor) {
        const entityId = `pattern:${recipe.name}:mark:${markAnchor.roleId}:${markAnchor.markName}`;
        return { targetGeometryId: `flat:${recipe.name}:${kind}:mark:${markAnchor.roleId}:${markAnchor.markName}`,
          point: placedPoint(point, placement), sourcePoint: point, sourceEntityId: entityId };
      }
      const anchorEdgeId = kind === "FRONT_FLAT" ? pom.anchorEdgeId : pom.backAnchorEdgeId;
      return { targetGeometryId: `flat:${recipe.name}:${kind}:component:${roleId}:outline`,
        point: placedPoint(point, placement), sourcePoint: point,
        ...(anchorEdgeId ? { sourceEntityId: `pattern:${recipe.name}:role:${roleId}:edge:${anchorEdgeId}` } : {}) };
    };
  } else if (recipe.name === "woven-shirt") {
    resolvePomAnchor = (pom, point) => {
      const markAnchor = kind === "FRONT_FLAT" ? pom.frontMarkAnchor
        : pom.backMarkAnchor ? { ...pom.backMarkAnchor, point: "at" as const } : undefined;
      const roleId = markAnchor?.roleId ?? (kind === "FRONT_FLAT"
        ? pom.anchorRoleId ?? G04_TECHNICAL_FLAT_MAPPINGS[recipe.name]?.pomAnchorRole
        : pom.backAnchorRoleId);
      const placement = assembly.transforms[roleId as string];
      if (!roleId || !placement) return undefined;
      const collarProjector = wovenCollarProjectors.get(roleId as WovenCollarRoleId);
      if (markAnchor) {
        const entityId = `pattern:${recipe.name}:mark:${markAnchor.roleId}:${markAnchor.markName}`;
        const anchorPoint = collarProjector ? collarProjector.projectSourcePoint(point) : placedPoint(point, placement);
        if (!anchorPoint) return undefined;
        return { targetGeometryId: `flat:${recipe.name}:${kind}:mark:${markAnchor.roleId}:${markAnchor.markName}`,
          point: anchorPoint, sourcePoint: point, sourceEntityId: entityId };
      }
      const edgeId = kind === "FRONT_FLAT" ? pom.anchorEdgeId : pom.backAnchorEdgeId;
      const anchorPoint = collarProjector ? collarProjector.projectSourcePoint(point) : placedPoint(point, placement);
      if (!anchorPoint) return undefined;
      return { targetGeometryId: `flat:${recipe.name}:${kind}:component:${roleId}:outline`,
        point: anchorPoint, sourcePoint: point,
        ...(edgeId ? { sourceEntityId: `pattern:${recipe.name}:role:${roleId}:edge:${edgeId}` } : {}) };
    };
  }
  const poms = compileTechnicalFlatPomCallouts(recipe.name, block, revisionId, kind, recipe.poms,
    [...geometry.primitives, ...waistbandFragments.primitives], resolvePomAnchor,
    recipe.name === "polo" && kind === "FRONT_FLAT"
      ? ["pom:polo:finished-collar-stand-height", "pom:polo:stand-front-rise"] : []);
  const poloDimensions = recipe.name === "polo"
    ? mapPoloDimensionCallouts(block, kind, recipe.poms!, poms.callouts ?? [], assembly.transforms) : undefined;
  const mappedDimensionCallouts = poloDimensions ? poloDimensions.callouts : poms.callouts;
  const poloCollarPointKeying = recipe.name === "polo" && mappedDimensionCallouts
    ? mapPoloCollarPointKeyedCallout(kind, revisionId, mappedDimensionCallouts) : undefined;
  const poloSourceCenterKeying = poloCollarPointKeying
    ? mapPoloSourceCenteredKeyedCallouts(kind, revisionId, poloCollarPointKeying.callouts,
      poms.issues.length === 0 ? recipe.poms!.map((pom) => `pom:polo:${pom.label.toLowerCase()
        .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`) : []) : undefined;
  const wovenPlacketWidthKeying = recipe.name === "woven-shirt" && mappedDimensionCallouts
    ? mapWovenPlacketWidthKeyedCallout(kind, revisionId, mappedDimensionCallouts,
      poms.issues.length === 0 && recipe.poms!.some((pom) => pom.label === "Finished placket width")) : undefined;
  let mappedPomCallouts = mappedDimensionCallouts;
  if (poloCollarPointKeying) mappedPomCallouts = poloCollarPointKeying.callouts;
  if (poloSourceCenterKeying) mappedPomCallouts = poloSourceCenterKeying.callouts;
  if (wovenPlacketWidthKeying) mappedPomCallouts = wovenPlacketWidthKeying.callouts;
  const approvedWovenSleeveCap = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
    .find((candidate) => candidate.roleId === "sleeve")?.wovenSleeveCapRepresentation?.decisionId
    === "G04-S344-WOVEN-SLEEVE-CAP-PROJECTION";
  const issues: TechnicalFlatLiveIssue[] = [
    ...geometry.issues.map((issue) => ({ stage: "geometry" as const, sourceId: issue.sourceId, message: issue.message })),
    ...waistbandFragments.issues.map((issue) => ({ stage: "geometry" as const, sourceId: issue.sourceId, message: issue.message })),
    ...assembly.issues.filter((issue) => issue.code !== "STITCH_ENDPOINT_RESIDUAL")
      .map((issue) => ({ stage: "assembly" as const, sourceId: issue.sourceId, message: issue.message })),
    ...overlays.issues.map((issue) => ({ stage: "overlay" as const, sourceId: issue.sourceId, message: issue.message })),
    ...poms.issues.map((issue) => ({ stage: "pom" as const, sourceId: issue.sourceId, message: issue.message })),
    ...(poloDimensions?.issues ?? []),
    ...(poloCollarPointKeying?.issues ?? []),
    ...(poloSourceCenterKeying?.issues ?? []),
    ...(wovenPlacketWidthKeying?.issues ?? []),
  ];
  if (recipe.name === "polo") {
    issues.push(...assembly.issues.filter((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL"
      && issue.sourceId.includes("Sleeve-cap ease")).map((issue) => ({ stage: "assembly" as const,
      sourceId: issue.sourceId,
      message: `${issue.message} Polo front/back flats are withheld until this sleeve-cap join is within the 0.25 cm acceptance tolerance.`,
    })));
  }
  if (recipe.name === "woven-shirt") {
    const approvedWovenCollarProjection = wovenCollarProjectors.has("outerStand");
    issues.push(...assembly.issues.filter((issue) => issue.code === "STITCH_ENDPOINT_RESIDUAL"
      && ((issue.sourceId.includes("Outer stand ↔ woven neckline") && !approvedWovenCollarProjection)
        || (issue.sourceId.includes("Woven sleeve-cap ease") && !approvedWovenSleeveCap))).map((issue) => ({ stage: "assembly" as const,
      sourceId: issue.sourceId,
      message: `${issue.message} Woven front/back flats are withheld until this sleeve or collar join is within the 0.25 cm acceptance tolerance.`,
    })));
  }
  if (recipe.name === "skirt" && input.placements.some((placement) => placement.pieceRole === "waistband")) {
    issues.push({ stage: "overlay", sourceId: "style:artwork:waistband",
      message: "Artwork targeting the Skirt waistband is withheld until its face-specific segment can be clipped without crossing the side-seam boundary. Reposition it on the front or back panel." });
  }
  const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipe.name];
  const face = mapping?.faces.find((candidate) => candidate.kind === kind);
  const overlayFace = overlays.faces?.find((candidate) => candidate.kind === kind);
  const bandArtwork = recipe.name === "trouser" ? (overlayFace?.artwork ?? []).filter((primitive) => primitive.targetRoleId === "waistband") : [];
  for (const artwork of bandArtwork) issues.push({ stage: "overlay", sourceId: artwork.source.sourceId,
    message: "Artwork on the Trouser waistband is withheld until its exact source placement can be clipped to one sewn front/back fragment." });
  const faceRoleIds = face?.roles.map((role) => role.roleId) ?? [];
  const fragmentPrimitiveIds = new Set(waistbandFragments.primitives.map((primitive) => primitive.id));
  const outputSpaceCalloutIds = new Set((mappedPomCallouts ?? []).map((primitive) => primitive.id));
  const geometryPrimitives = recipe.name === "trouser" ? geometry.primitives.filter((primitive) =>
    primitive.source.sourceId !== "pattern:trouser:role:waistband"
      && !primitive.source.sourceId.startsWith("pattern:trouser:mark:waistband:")) : geometry.primitives;
  const combined = [...geometryPrimitives, ...waistbandFragments.primitives,
    ...(overlayFace?.artwork ?? []).filter((primitive) => !bandArtwork.includes(primitive)), ...(mappedPomCallouts ?? [])];
  const transformed: TechnicalFlatPrimitive[] = [];
  for (const primitive of combined) {
    if (outputSpaceCalloutIds.has(primitive.id)) {
      transformed.push(primitive);
      continue;
    }
    if (fragmentPrimitiveIds.has(primitive.id)) {
      transformed.push(primitive);
      continue;
    }
    const roleId = technicalFlatPrimitiveRole(primitive, combined, faceRoleIds);
    for (const { placed, placement } of placeTechnicalFlatPrimitive(primitive, roleId, assembly.transforms[roleId], issues)) {
      const collarProjector = recipe.name === "woven-shirt"
        ? wovenCollarProjectors.get(roleId as WovenCollarRoleId) : undefined;
      // The center-back colorway closure is fill-only. Project its source
      // endpoints with the contour so the fill closes exactly at the mapped
      // collar edges; the visible fold and source seam remain unchanged.
      const displayed = collarProjector
        ? projectWovenCollarPrimitive(placed, collarProjector, placement)
        : placed;
      if (!displayed) {
        issues.push({ stage: "transform", sourceId: primitive.source.sourceId,
          message: `The Woven collar projection cannot map ${roleId} geometry from the exact source revision onto the split body neckline; this face is withheld.` });
        continue;
      }
      const projectionRole = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
        .find((candidate) => candidate.roleId === roleId);
      const oppositeSide = projectionRole?.oppositeSideReflection;
      if (appendOppositeSideReflection(transformed, displayed, oppositeSide, block, assembly.transforms, issues)) continue;
      transformed.push(displayed);
      const foldAxis = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
        .find((candidate) => candidate.roleId === roleId)?.foldAxisReflection;
      if (foldAxis) {
        if (foldAxis.axisRoleId) {
          const axisPlacement = assembly.transforms[foldAxis.axisRoleId];
          const axisPiece = block.roles[foldAxis.axisRoleId];
          const axisEdge = axisPiece?.edges.find((candidate) => candidate.name === foldAxis.edgeId);
          // Projection-map validation guarantees the exact straight source axis;
          // assembly validation guarantees its placement whenever this segment is emitted.
          const axisStart = placedPoint(edgeStart(axisEdge!), axisPlacement!);
          const axisEnd = placedPoint(edgeEnd(axisEdge!), axisPlacement!);
          const mirrored = reflectPrimitiveAcrossLine(displayed, axisStart, axisEnd);
          if (mirrored) transformed.push(mirrored);
        } else {
          const mirrored = reflectFoldPrimitive(primitive, foldAxis.edgeId);
          if (mirrored) transformed.push(transformFlatPrimitive(mirrored, { offset: placement.offset,
            rotationDegrees: placement.rotationDegrees, mirrorX: true }));
        }
      } else {
        const viewPair = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
          .find((candidate) => candidate.roleId === roleId)?.viewPairReflection;
        appendApprovedViewPairReflection(transformed, placed, viewPair, block, assembly.transforms, issues);
        const physicalPair = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
          .find((candidate) => candidate.roleId === roleId)?.physicalPairReflection;
        if (!viewPair) appendPhysicalPairReflection(transformed, primitive, physicalPair, placement);
      }
    }
  }
  if (recipe.name === "woven-shirt" && kind === "BACK_FLAT") {
    const projection = projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
      .find((candidate) => candidate.roleId === "sleeveBand");
    const detailMetadata = projection?.wovenDetachedBandDetailRepresentation;
    const axisPlacement = assembly.transforms.back;
    const axisEdge = block.roles.back?.edges.find((edge) => edge.name === "centerBack");
    const axisStart = axisEdge && axisPlacement ? placedPoint(edgeStart(axisEdge), axisPlacement) : undefined;
    const axisEnd = axisEdge && axisPlacement ? placedPoint(edgeEnd(axisEdge), axisPlacement) : undefined;
    const bandSource = geometry.primitives.filter((primitive) => primitive.source.sourceId === "pattern:woven-shirt:role:sleeveBand"
      || primitive.source.sourceId.startsWith("pattern:woven-shirt:mark:sleeveBand:"));
    if (projection?.viewPairReflection?.decisionId !== "G04-S321-WOVEN-SLEEVE-BAND-VIEW-PAIR"
      || projection.viewPairReflection.quantity !== 2 || projection.viewPairReflection.edgeId !== "centerBack"
      || detailMetadata?.decisionId !== "G04-S370-WOVEN-DETACHED-BAND-DETAIL"
      || detailMetadata.sourcePieceId !== "sleeveBand" || detailMetadata.foldMarkName !== "bandFold"
      || detailMetadata.receiverRoleId !== "sleeve" || detailMetadata.receiverEdgeId !== "hem"
      || detailMetadata.receiverInterval[0] !== 0 || detailMetadata.receiverInterval[1] !== 0.5
      || detailMetadata.minimumClearanceCm !== 1 || detailMetadata.rotationDegrees !== 90
      || !axisStart || !axisEnd || Math.abs(axisStart.x - axisEnd.x) > 1e-8
      || bandSource.some((primitive) => primitive.source.revisionId !== revisionId)) {
      issues.push({ stage: "transform", sourceId: "pattern:woven-shirt:role:sleeveBand",
        message: "The approved detached Woven band detail requires the exact same-revision outline, bandFold mark, and vertical back.centerBack axis; this face is withheld." });
    } else {
      const bodyPrimitives = transformed.filter((primitive) => ["back", "sleeve", "yoke"].some((roleId) =>
        primitive.source.sourceId === `pattern:woven-shirt:role:${roleId}`));
      const details = composeWovenDetachedBandDetails({ bodyPrimitives, bandPrimitives: bandSource, axisX: axisStart.x, revisionId });
      if (details.issue) {
        issues.push({ stage: "transform", sourceId: "pattern:woven-shirt:role:sleeveBand",
          message: details.issue });
      } else {
        // The assembled band is hidden on this face; retain its exact source
        // primitives in two rigid, source-scale side-gutter detail instances.
        const retained = transformed.filter((primitive) => primitive.source.sourceId !== "pattern:woven-shirt:role:sleeveBand"
          && !primitive.source.sourceId.startsWith("pattern:woven-shirt:mark:sleeveBand:"));
        transformed.splice(0, transformed.length, ...retained, ...details.primitives);
      }
    }
  }
  if (recipe.name === "woven-shirt" && approvedWovenSleeveCap) issues.push(...projectWovenSleeveFillClosures(transformed));
  const approvedPoloSleeveCap = recipe.name === "polo"
    && projectionMap?.faces.find((candidate) => candidate.kind === kind)?.roles
      .some((role) => role.roleId === "sleeve" && role.poloSleeveCapRepresentation !== undefined);
  if (approvedPoloSleeveCap) issues.push(...projectPoloSleeveFillClosures(transformed, input.revisionId));
  if (recipe.name === "woven-shirt" && kind === "FRONT_FLAT") {
    const sourceCallouts = transformed.filter((primitive): primitive is FlatCalloutPrimitive => primitive.kind === "callout");
    const spacingKey = mapWovenButtonSpacingKeyedCallout(kind, revisionId, sourceCallouts, transformed);
    issues.push(...spacingKey.issues);
    if (!spacingKey.issues.length) {
      const keyedById = new Map(spacingKey.callouts.map((callout) => [callout.id, callout]));
      for (let index = 0; index < transformed.length; index += 1) {
        const primitive = transformed[index]!;
        // The mapper preserves the full callout list and only replaces the approved D row.
        if (primitive.kind === "callout") transformed[index] = keyedById.get(primitive.id)!;
      }
    }
    const clipped = applyWovenFrontApprovedViewClips(transformed, revisionId);
    issues.push(...clipped.issues);
    if (!clipped.issues.length) transformed.splice(0, transformed.length, ...clipped.primitives);
  }
  if (!mapping || !face) issues.push({ stage: "geometry", sourceId: recipe.name,
    message: `Recipe “${recipe.label}” has no admitted ${kind === "FRONT_FLAT" ? "front" : "back"} flat mapping.` });
  if (issues.length > 0 || !overlayFace || poms.callouts === null) return { view: null, colorway: null, issues };

  const notices = [
    ...geometry.notices,
    ...overlayFace.notices,
    ...poms.notices,
    ...technicalFlatAssemblyNotices(recipe.name, kind, assembly.issues),
  ];
  return {
    view: {
      schemaVersion: TECHNICAL_FLAT_SCHEMA_VERSION,
      viewId: `live-flat:${recipe.name}:${kind}`,
      revisionId,
      recipeId: recipe.name,
      kind,
      units: "cm",
      primitives: transformed,
      notices,
    },
    colorway: overlayFace.colorway,
    issues: [],
  };
}
