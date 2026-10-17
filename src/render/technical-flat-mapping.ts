import type { Block } from "../drafting/block";
import type { Pom } from "../drafting/pom";
import type { Stitch, InterfaceRef } from "../drafting/stitch";
import type { ArtworkPlacement } from "../surface/placement";
import type { TechnicalFlatFeature, TechnicalFlatLayer, TechnicalFlatViewKind } from "./technical-flat";
import { edgeEnd, edgeStart } from "../drafting/piece";

/** Resolve only the authored point name; an absent property remains undefined and fails validation. */
function markedPoint(mark: NonNullable<Block["roles"][string]["marks"]>[number], pointName: "at" | "start" | "end") {
  return (mark as unknown as Readonly<Record<"at" | "start" | "end", { x: number; y: number }>>)[pointName];
}

export type FlatRoleTreatment = "SHELL" | "VISIBLE_OVERLAY" | "INTERIOR_HIDDEN";

export interface FlatRoleMapping {
  readonly roleId: string;
  readonly treatment: FlatRoleTreatment;
  /** Optional foreground role that this mapped source role sits behind. */
  readonly behindRoleId?: string;
}

export interface FlatFaceMapping {
  readonly kind: TechnicalFlatViewKind;
  readonly roles: readonly FlatRoleMapping[];
}

export interface TechnicalFlatRecipeMapping {
  readonly recipeId: string;
  readonly faces: readonly [FlatFaceMapping, FlatFaceMapping];
  /** Source-coordinate role for front anchors and optional back anchors. */
  readonly pomAnchorRole: string;
  /** Optional source role for recipe methods that define a back-face landmark. */
  readonly backPomAnchorRole?: string;
}

type FaceRoleInput = readonly [string, FlatRoleTreatment] | FlatRoleMapping;

const face = (kind: TechnicalFlatViewKind, roles: readonly FaceRoleInput[]): FlatFaceMapping => ({
  kind,
  roles: roles.map((role) => "roleId" in role
    ? role
    : { roleId: role[0], treatment: role[1] }),
});

const shell = (role: string): readonly [string, FlatRoleTreatment] => [role, "SHELL"];
const overlay = (role: string): readonly [string, FlatRoleTreatment] => [role, "VISIBLE_OVERLAY"];
const interior = (role: string): readonly [string, FlatRoleTreatment] => [role, "INTERIOR_HIDDEN"];
const interiorBehind = (role: string, behindRoleId: string): FlatRoleMapping => ({
  roleId: role, treatment: "INTERIOR_HIDDEN", behindRoleId,
});

const makeMapping = (
  recipeId: string,
  front: readonly FaceRoleInput[],
  back: readonly FaceRoleInput[],
  pomAnchorRole: string,
  backPomAnchorRole?: string,
): TechnicalFlatRecipeMapping => ({
  recipeId,
  faces: [face("FRONT_FLAT", front), face("BACK_FLAT", back)],
  pomAnchorRole,
  ...(backPomAnchorRole ? { backPomAnchorRole } : {}),
});

/** Explicit role-to-face mapping for every recipe admitted under G04. These
 * records establish source membership and visibility class, not placement
 * coordinates; V02 computes the actual assembled geometry. */
export const G04_TECHNICAL_FLAT_MAPPINGS: Readonly<Record<string, TechnicalFlatRecipeMapping>> = {
  tee: makeMapping("tee", [shell("front"), shell("sleeve")], [shell("back"), shell("sleeve")], "front", "back"),
  fitted: makeMapping("fitted", [shell("front"), shell("sleeve")], [shell("back"), shell("sleeve")], "front"),
  tank: makeMapping("tank", [shell("front")], [shell("back")], "front", "back"),
  polo: makeMapping("polo",
    [shell("front"), shell("sleeve"), overlay("buttonPlacket"), interior("buttonholePlacket"), overlay("outerStand"), interior("innerStand"), overlay("underCollar"), overlay("upperCollar")],
    [shell("back"), shell("sleeve"), overlay("outerStand"), interior("innerStand"), overlay("underCollar"), overlay("upperCollar")],
    "front", "back"),
  "woven-shirt": makeMapping("woven-shirt",
    [shell("front"), shell("sleeve"), overlay("pocket"), overlay("outerStand"), interior("innerStand"), overlay("underCollar"), overlay("upperCollar"), overlay("buttonholePlacket"), overlay("buttonPlacket"), overlay("sleeveBand")],
    [shell("back"), shell("yoke"), shell("sleeve"), overlay("outerStand"), interior("innerStand"), overlay("underCollar"), overlay("upperCollar"), overlay("sleeveBand")],
    "front"),
  skirt: makeMapping("skirt", [shell("front"), overlay("waistbandFront")], [shell("back"), overlay("waistbandBack")], "front", "back"),
  trouser: makeMapping("trouser",
    [shell("frontLeft"), shell("frontRight"), overlay("waistband"), interiorBehind("flyUnderlap", "frontLeft"), interior("flyShield"), interior("pocketBagLeft"), interior("pocketBagRight")],
    [shell("backLeft"), shell("backRight"), overlay("waistband"), interior("flyUnderlap"), interior("flyShield"), interior("pocketBagLeft"), interior("pocketBagRight")],
    "frontLeft", "backLeft"),
};

export type FlatSourceKind = "component" | "stitch" | "mark" | "dart" | "pom" | "artwork";
export type FlatSourceTreatment = FlatRoleTreatment | "ANCHORED" | "TABLE_ONLY" | "VISIBILITY_UNRESOLVED";

export interface FlatSourceMapping {
  readonly id: string;
  readonly kind: FlatSourceKind;
  readonly feature: TechnicalFlatFeature;
  readonly layer: TechnicalFlatLayer;
  readonly sourceId: string;
  readonly viewKinds: readonly TechnicalFlatViewKind[];
  readonly treatment: FlatSourceTreatment;
  readonly targetGeometryId?: string;
  readonly anchorPoint?: { readonly x: number; readonly y: number };
  readonly relatedIds?: readonly string[];
}

export type FlatMappingIssueCode =
  | "UNSUPPORTED_RECIPE"
  | "MISSING_MAPPED_ROLE"
  | "UNMAPPED_BLOCK_ROLE"
  | "DUPLICATE_FACE_ROLE"
  | "INVALID_LAYER_ORDER_REFERENCE"
  | "MISSING_STITCH_ROLE"
  | "MISSING_STITCH_EDGE"
  | "MISSING_STITCH_MARK"
  | "INVALID_POM_ANCHOR"
  | "MISSING_POM_ANCHOR_ROLE"
  | "UNMAPPED_ARTWORK_ROLE";

export interface FlatMappingIssue {
  readonly code: FlatMappingIssueCode;
  readonly sourceId: string;
  readonly message: string;
}

export interface FlatMappingNotice {
  readonly id: string;
  readonly feature: TechnicalFlatFeature;
  readonly reason: "SOURCE_NOT_REPRESENTED" | "SOURCE_REFERENCE_MISSING";
  readonly message: string;
  readonly sourceId?: string;
}

export interface TechnicalFlatSourceMap {
  readonly recipeId: string;
  readonly faces: readonly [FlatFaceMapping, FlatFaceMapping];
  readonly sources: readonly FlatSourceMapping[];
  readonly notices: readonly FlatMappingNotice[];
  readonly issues: readonly FlatMappingIssue[];
}

function viewsForRole(mapping: TechnicalFlatRecipeMapping, roleId: string): FlatFaceMapping[] {
  return mapping.faces.filter((candidate) => candidate.roles.some((role) => role.roleId === roleId));
}

function treatmentForRole(faceMapping: FlatFaceMapping, roleId: string): FlatRoleTreatment | undefined {
  return faceMapping.roles.find((role) => role.roleId === roleId)?.treatment;
}

function stableSegment(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function refsForInterface(refs: readonly InterfaceRef[]): string[] {
  return refs.map((ref) => "edge" in ref ? `edge:${ref.piece}:${ref.edge}` : `mark:${ref.piece}:${ref.mark}:${ref.side}`);
}

/** Check a recipe's declared role map against one exact drafted topology. */
export function validateFlatRoleMapping(mapping: TechnicalFlatRecipeMapping, block: Block): FlatMappingIssue[] {
  const issues: FlatMappingIssue[] = [];
  const mappedRoles = new Set<string>();
  for (const faceMapping of mapping.faces) {
    const faceRoles = new Set<string>();
    for (const role of faceMapping.roles) {
      if (faceRoles.has(role.roleId)) {
        issues.push({ code: "DUPLICATE_FACE_ROLE", sourceId: `${faceMapping.kind}:${role.roleId}`, message: `Role “${role.roleId}” is repeated in ${faceMapping.kind}.` });
      }
      faceRoles.add(role.roleId);
      mappedRoles.add(role.roleId);
      if (!block.roles[role.roleId]) {
        issues.push({ code: "MISSING_MAPPED_ROLE", sourceId: role.roleId, message: `Mapped role “${role.roleId}” is absent from the drafted block.` });
      }
      if (role.behindRoleId && (!faceRoles.has(role.behindRoleId)
        || !faceMapping.roles.some((candidate) => candidate.roleId === role.behindRoleId && candidate.treatment !== "INTERIOR_HIDDEN"))) {
        issues.push({ code: "INVALID_LAYER_ORDER_REFERENCE", sourceId: `${faceMapping.kind}:${role.roleId}`,
          message: `Mapped role “${role.roleId}” must name an earlier visible role in ${faceMapping.kind} for its behind-layer relation.` });
      }
    }
  }
  for (const roleId of Object.keys(block.roles)) {
    if (!mappedRoles.has(roleId)) {
      issues.push({ code: "UNMAPPED_BLOCK_ROLE", sourceId: roleId, message: `Drafted role “${roleId}” has no front/back mapping.` });
    }
  }
  return issues;
}

function validateStitch(block: Block, stitch: Stitch, issues: FlatMappingIssue[]): string[] {
  const relatedIds: string[] = [];
  for (const ref of [...stitch.a.edges, ...stitch.b.edges]) {
    const piece = block.roles[ref.piece];
    if (!piece) {
      issues.push({ code: "MISSING_STITCH_ROLE", sourceId: `stitch:${stitch.label}`, message: `Stitch “${stitch.label}” refers to missing role “${ref.piece}”.` });
      continue;
    }
    if ("edge" in ref) {
      if (!piece.edges.some((edge) => edge.name === ref.edge)) {
        issues.push({ code: "MISSING_STITCH_EDGE", sourceId: `stitch:${stitch.label}`, message: `Stitch “${stitch.label}” refers to missing edge “${ref.piece}.${ref.edge}”.` });
      }
    } else if (!piece.marks?.some((mark) => mark.name === ref.mark)) {
      issues.push({ code: "MISSING_STITCH_MARK", sourceId: `stitch:${stitch.label}`, message: `Stitch “${stitch.label}” refers to missing mark “${ref.piece}.${ref.mark}”.` });
    }
    relatedIds.push(...refsForInterface([ref]));
  }
  return relatedIds;
}

/** Resolve one drafted recipe block into stable source references for both
 * faces. This traces construction facts and reports gaps; it does not guess
 * line visibility or invent missing topstitch/pleat/closure geometry. */
export function mapTechnicalFlatSources(
  recipeId: string,
  block: Block,
  poms: readonly Pom[] = [],
  artwork: readonly ArtworkPlacement[] = [],
): TechnicalFlatSourceMap {
  const mapping = G04_TECHNICAL_FLAT_MAPPINGS[recipeId];
  if (!mapping) {
    return {
      recipeId,
      faces: [face("FRONT_FLAT", []), face("BACK_FLAT", [])],
      sources: [], notices: [],
      issues: [{ code: "UNSUPPORTED_RECIPE", sourceId: recipeId, message: `Recipe “${recipeId}” has no admitted G04 view map.` }],
    };
  }

  const issues = validateFlatRoleMapping(mapping, block);
  const notices: FlatMappingNotice[] = [];
  const sources: FlatSourceMapping[] = [];

  for (const faceMapping of mapping.faces) {
    for (const role of faceMapping.roles) {
      const piece = block.roles[role.roleId];
      if (!piece) continue;
      const roleSourceId = `pattern:${recipeId}:role:${role.roleId}`;
      sources.push({
        id: `flat:${recipeId}:${faceMapping.kind}:component:${role.roleId}:outline`,
        kind: "component", feature: "silhouette", layer: "GARMENT_SILHOUETTE", sourceId: roleSourceId,
        viewKinds: [faceMapping.kind], treatment: role.treatment,
      });
      if (piece.dart) {
        sources.push({
          id: `flat:${recipeId}:${faceMapping.kind}:dart:${role.roleId}:${piece.dart.legs.join(":")}`,
          kind: "dart", feature: "dart", layer: "DART", sourceId: `pattern:${recipeId}:dart:${role.roleId}:${piece.dart.legs.join(":")}`,
          viewKinds: [faceMapping.kind], treatment: role.treatment,
          relatedIds: piece.dart.legs.map((edge) => `edge:${role.roleId}:${edge}`),
        });
      }
      for (const mark of piece.marks ?? []) {
        const isClosure = mark.kind === "button" || mark.kind === "buttonhole";
        const isPocket = /pocket/i.test(role.roleId) || /pocket/i.test(mark.name);
        sources.push({
          id: `flat:${recipeId}:${faceMapping.kind}:mark:${role.roleId}:${mark.name}`,
          kind: "mark", feature: isClosure ? "closure" : isPocket ? "pocket" : "annotation",
          layer: isClosure ? "CLOSURE" : isPocket ? "CONSTRUCTION" : "ANNOTATION",
          sourceId: `pattern:${recipeId}:mark:${role.roleId}:${mark.name}`,
          viewKinds: [faceMapping.kind], treatment: role.treatment,
        });
      }
    }
  }

  for (const [index, stitch] of block.stitches.entries()) {
    const relatedIds = validateStitch(block, stitch, issues);
    const roleIds = [...stitch.a.edges, ...stitch.b.edges].map((ref) => ref.piece);
    const viewKinds = mapping.faces.filter((faceMapping) => roleIds.some((roleId) =>
      faceMapping.roles.some((mappedRole) => mappedRole.roleId === roleId))).map((faceMapping) => faceMapping.kind);
    sources.push({
      id: `flat:${recipeId}:stitch:${stableSegment(stitch.label) || index}`,
      kind: "stitch", feature: "seam", layer: "SEAM", sourceId: `pattern:${recipeId}:stitch:${stitch.label}`,
      viewKinds, treatment: "VISIBILITY_UNRESOLVED", relatedIds,
    });
  }

  for (const [index, pom] of poms.entries()) {
    const pomId = `pom:${recipeId}:${stableSegment(pom.label) || index}`;
    if (pom.anchor) {
      const roleId = pom.anchorRoleId ?? mapping.pomAnchorRole;
      const anchorRole = block.roles[roleId];
      if (!anchorRole) {
        issues.push({ code: "MISSING_POM_ANCHOR_ROLE", sourceId: pomId,
          message: `POM anchor role “${roleId}” is missing.` });
        continue;
      }
      if (pom.anchorAvailable && !pom.anchorAvailable(block)) {
        sources.push({ id: `flat:${recipeId}:pom:${stableSegment(pom.label) || index}`, kind: "pom", feature: "pom",
          layer: "CALLOUT", sourceId: pomId, viewKinds: ["FRONT_FLAT"], treatment: "TABLE_ONLY" });
        notices.push({ id: `notice:${pomId}:front-source-not-represented`, feature: "pom",
          reason: "SOURCE_NOT_REPRESENTED", sourceId: pomId,
          message: `POM “${pom.label}” has no front source anchor in this option and remains table-only.` });
      } else {
      const point = pom.anchor(block);
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        issues.push({ code: "INVALID_POM_ANCHOR", sourceId: pomId,
          message: `POM “${pom.label}” has a non-finite anchor.` });
        continue;
      }
      const edge = pom.anchorEdgeId ? anchorRole.edges.find((candidate) => candidate.name === pom.anchorEdgeId) : undefined;
      const endpoints = edge ? [edgeStart(edge), edgeEnd(edge)] : [];
      const dimensionMidpoint = pom.viewDimension?.kind === "edge-length" && pom.viewDimension.view === "FRONT_FLAT"
        && pom.viewDimension.roleId === roleId && pom.viewDimension.edgeId === pom.anchorEdgeId
        && edge?.kind === "line" && point.x === (endpoints[0]!.x + endpoints[1]!.x) / 2
        && point.y === (endpoints[0]!.y + endpoints[1]!.y) / 2;
      if (pom.anchorEdgeId && (!edge || (!endpoints.some((candidate) => candidate.x === point.x && candidate.y === point.y)
        && !dimensionMidpoint))) {
        issues.push({ code: "INVALID_POM_ANCHOR", sourceId: pomId,
          message: `POM “${pom.label}” must anchor to a vertex on “${roleId}.${pom.anchorEdgeId}”.` });
        continue;
      }
      sources.push({ id: `flat:${recipeId}:FRONT_FLAT:component:${roleId}:outline:callout:${stableSegment(pom.label) || index}`,
        kind: "pom", feature: "pom", layer: "CALLOUT", sourceId: pomId, viewKinds: ["FRONT_FLAT"], treatment: "ANCHORED",
        targetGeometryId: `flat:${recipeId}:FRONT_FLAT:component:${roleId}:outline`, anchorPoint: point,
        ...(pom.anchorEdgeId ? { relatedIds: [`edge:${roleId}:${pom.anchorEdgeId}`] } : {}) });
      }
    } else if (pom.frontMarkAnchor) {
      const { roleId, markName, point: pointName } = pom.frontMarkAnchor;
      const mark = block.roles[roleId]?.marks?.find((candidate) => candidate.name === markName);
      const anchorPoint = mark && markedPoint(mark, pointName);
      if (!block.roles[roleId] || !anchorPoint) {
        issues.push({ code: "INVALID_POM_ANCHOR", sourceId: pomId,
          message: `POM “${pom.label}” references missing front mark point “${roleId}.${markName}.${pointName}”.` });
        continue;
      }
      sources.push({ id: `flat:${recipeId}:FRONT_FLAT:mark:${roleId}:${markName}:callout:${stableSegment(pom.label) || index}`,
        kind: "pom", feature: "pom", layer: "CALLOUT", sourceId: pomId, viewKinds: ["FRONT_FLAT"], treatment: "ANCHORED",
        targetGeometryId: `flat:${recipeId}:FRONT_FLAT:mark:${roleId}:${markName}`, anchorPoint,
        relatedIds: [`mark:${roleId}:${markName}`] });
    } else {
      sources.push({ id: `flat:${recipeId}:pom:${stableSegment(pom.label) || index}`, kind: "pom", feature: "pom", layer: "CALLOUT",
        sourceId: pomId, viewKinds: ["FRONT_FLAT"], treatment: "TABLE_ONLY" });
      notices.push({ id: `notice:${pomId}:anchor`, feature: "pom", reason: "SOURCE_REFERENCE_MISSING",
        message: `POM “${pom.label}” has no front geometry anchor and is table-only on the front view.`, sourceId: pomId });
    }
    if (pom.backAnchor) {
      const roleId = pom.backAnchorRoleId ?? mapping.backPomAnchorRole;
      const anchorRole = roleId ? block.roles[roleId] : undefined;
      if (!roleId || !anchorRole) {
        issues.push({ code: "MISSING_POM_ANCHOR_ROLE", sourceId: pomId,
          message: `POM “${pom.label}” has a back anchor but no mapped back role.` });
        continue;
      }
      if (pom.backAnchorAvailable && !pom.backAnchorAvailable(block)) {
        sources.push({ id: `flat:${recipeId}:pom:${stableSegment(pom.label) || index}:back`, kind: "pom", feature: "pom",
          layer: "CALLOUT", sourceId: pomId, viewKinds: ["BACK_FLAT"], treatment: "TABLE_ONLY" });
        notices.push({ id: `notice:${pomId}:back-source-not-represented`, feature: "pom",
          reason: "SOURCE_NOT_REPRESENTED", sourceId: pomId,
          message: `POM “${pom.label}” has no back source anchor in this option and remains table-only.` });
        continue;
      }
      const point = pom.backAnchor(block);
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
        issues.push({ code: "INVALID_POM_ANCHOR", sourceId: pomId,
          message: `POM “${pom.label}” has a non-finite back anchor.` });
        continue;
      }
      const edge = pom.backAnchorEdgeId ? anchorRole.edges.find((candidate) => candidate.name === pom.backAnchorEdgeId) : undefined;
      const endpoints = edge ? [edgeStart(edge), edgeEnd(edge)] : [];
      if (pom.backAnchorEdgeId && (!edge || !endpoints.some((candidate) => candidate.x === point.x && candidate.y === point.y))) {
        issues.push({ code: "INVALID_POM_ANCHOR", sourceId: pomId,
          message: `POM “${pom.label}” must anchor to a vertex on “${roleId}.${pom.backAnchorEdgeId}”.` });
        continue;
      }
      sources.push({ id: `flat:${recipeId}:BACK_FLAT:component:${roleId}:outline:callout:${stableSegment(pom.label) || index}`,
        kind: "pom", feature: "pom", layer: "CALLOUT", sourceId: pomId, viewKinds: ["BACK_FLAT"], treatment: "ANCHORED",
        targetGeometryId: `flat:${recipeId}:BACK_FLAT:component:${roleId}:outline`, anchorPoint: point,
        ...(pom.backAnchorEdgeId ? { relatedIds: [`edge:${roleId}:${pom.backAnchorEdgeId}`] } : {}) });
    } else if (pom.backMarkAnchor) {
      const { roleId, markName } = pom.backMarkAnchor;
      const mark = block.roles[roleId]?.marks?.find((candidate) => candidate.name === markName);
      if (!block.roles[roleId] || !mark || !("at" in mark)) {
        issues.push({ code: "INVALID_POM_ANCHOR", sourceId: pomId,
          message: `POM “${pom.label}” references missing back mark “${roleId}.${markName}”.` });
        continue;
      }
      sources.push({ id: `flat:${recipeId}:BACK_FLAT:mark:${roleId}:${markName}:callout:${stableSegment(pom.label) || index}`,
        kind: "pom", feature: "pom", layer: "CALLOUT", sourceId: pomId, viewKinds: ["BACK_FLAT"], treatment: "ANCHORED",
        targetGeometryId: `flat:${recipeId}:BACK_FLAT:mark:${roleId}:${markName}`, anchorPoint: mark.at });
    }
  }

  for (const placement of artwork) {
    const mappedFaces = viewsForRole(mapping, placement.pieceRole);
    if (mappedFaces.length === 0) {
      issues.push({ code: "UNMAPPED_ARTWORK_ROLE", sourceId: `artwork:${placement.id}`,
        message: `Artwork placement “${placement.id}” targets role “${placement.pieceRole}”, which has no view mapping.` });
      continue;
    }
    sources.push({ id: `flat:${recipeId}:artwork:${placement.id}`, kind: "artwork", feature: "artwork", layer: "ARTWORK",
      sourceId: `style:artwork:${placement.id}`, viewKinds: mappedFaces.map((candidate) => candidate.kind),
      treatment: mappedFaces.some((candidate) => treatmentForRole(candidate, placement.pieceRole) !== "INTERIOR_HIDDEN")
        ? "VISIBLE_OVERLAY" : "INTERIOR_HIDDEN" });
  }

  const featurePresent = (feature: TechnicalFlatFeature): boolean => sources.some((source) => source.feature === feature);
  for (const [feature, message] of [
    ["topstitch", "Topstitch geometry is not represented by the current pattern model."],
    ["pleat", "Pleat geometry is not represented by the current pattern model."],
    ["dart", "No dart is declared for this drafted recipe block."],
    ["pocket", "No pocket shape or opening is represented by this drafted recipe block."],
    ["closure", "No closure marks are represented by this drafted recipe block."],
  ] as const) {
    if (!featurePresent(feature)) {
      notices.push({ id: `notice:${recipeId}:${feature}`, feature, reason: "SOURCE_NOT_REPRESENTED", message });
    }
  }

  return { recipeId, faces: mapping.faces, sources, notices, issues };
}
