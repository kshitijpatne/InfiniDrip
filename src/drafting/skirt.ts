// The skirt — a structurally different garment that proves the engine/recipe split.
//
// It shares NOTHING tee-shaped: no sleeve, no armhole, no neckline. A panel is
// waist (top) → side seam (tapering out to the hip, then straight to the hem) →
// hem (bottom) → centre (the fold). Front and back are the same simple block.
//
// This is a dartless block: the waist is eased in at the side seam rather than
// darted. K01 adds a bounded digital hem sweep; it does not transfer a dart.

import { point } from "../geometry";
import { Measurements } from "./measurements";
import { Edge, Piece, edgeLength, pieceEdge, edgeStart, edgeEnd } from "./piece";
import { Block, rolePiece } from "./block";
import { CheckResult, squareCorner } from "../guidance/check";
import { Note } from "../guidance/note";
import { GradeRule } from "./grading";
import { Pom, spanX, spanY, PointRef } from "./pom";
import { PieceNotches } from "./tshirt-notches";
import { Stitch, edgeRef, iface, matchedNotch } from "./stitch";
import { Component } from "./component";
import { lineMark } from "./pattern-mark";
import { waistband, WAISTBAND_DEFAULT } from "./waistband";
import { componentNode, composeBlock, garmentGrammar } from "./grammar";
import type { GarmentOption, GarmentOptions } from "./options";

export const SKIRT_A_LINE_ENTRY_ID = "skirt-a-line-digital-v1";
export const SKIRT_A_LINE_HEM_SWEEP_OPTION_ID = "hemSweepCm";
export const SKIRT_A_LINE_HEM_SWEEP_OPTION: GarmentOption = {
  id: SKIRT_A_LINE_HEM_SWEEP_OPTION_ID,
  label: "Additional hem sweep (whole garment)",
  unit: "cm",
  help: "Adds width at the hem while keeping the waist and hip unchanged. This is an editable software geometry choice, not a physical pattern standard.",
  group: "Hem",
  appliesToStarterEntryId: SKIRT_A_LINE_ENTRY_ID,
  preserveInvalidWhenRestored: true,
  defaultValue: 12,
  min: 4,
  max: 24,
  step: 1,
};

export const SKIRT_PENCIL_ENTRY_ID = "skirt-pencil-digital-v1";
export const SKIRT_PENCIL_HEM_TAPER_OPTION_ID = "hemTaperCm";
export const SKIRT_PENCIL_HEM_TAPER_OPTION: GarmentOption = {
  id: SKIRT_PENCIL_HEM_TAPER_OPTION_ID,
  label: "Hem taper (whole garment)",
  unit: "cm",
  help: "Narrows the digital hem from the hip while keeping the waist and hip unchanged. This is a software geometry choice, not a physical pattern standard.",
  group: "Hem",
  appliesToStarterEntryId: SKIRT_PENCIL_ENTRY_ID,
  preserveInvalidWhenRestored: true,
  defaultValue: 8,
  min: 4,
  max: 12,
  step: 1,
};

export const SKIRT_GATHERED_ENTRY_ID = "skirt-gathered-pull-on-digital-v1";
export const SKIRT_GATHER_RATIO_OPTION_ID = "gatherRatio";
export const SKIRT_CASING_DEPTH_OPTION_ID = "casingDepthCm";
export const SKIRT_GATHER_RATIO_OPTION: GarmentOption = {
  id: SKIRT_GATHER_RATIO_OPTION_ID,
  label: "Waist gathering ratio (software setting)",
  unit: "ratio",
  help: "Sets the digital cut-waist width before gathering; the measured waist remains the gathered-to reference and ease affects hip width only. The range is a software choice, not a physical standard or fabric-specific gathering recommendation.",
  group: "Waist finish",
  appliesToStarterEntryId: SKIRT_GATHERED_ENTRY_ID,
  preserveInvalidWhenRestored: true,
  defaultValue: 1.5,
  min: 1.25,
  max: 2,
  step: 0.25,
};
export const SKIRT_CASING_DEPTH_OPTION: GarmentOption = {
  id: SKIRT_CASING_DEPTH_OPTION_ID,
  label: "Casing depth (software setting)",
  unit: "cm",
  help: "Sets the digital fold-to-stitch guide depth. Elastic width and physical casing compatibility are unspecified.",
  group: "Waist finish",
  appliesToStarterEntryId: SKIRT_GATHERED_ENTRY_ID,
  preserveInvalidWhenRestored: true,
  defaultValue: 4,
  min: 2,
  max: 5,
  step: 0.5,
};

export const SKIRT_BOX_PLEAT_ENTRY_ID = "skirt-box-pleat-guide-digital-v1";
export const SKIRT_BOX_PLEAT_COUNT_OPTION_ID = "boxPleatCount";
export const SKIRT_BOX_PLEAT_SPACING_OPTION_ID = "boxPleatGuideSpacingCm";
export const SKIRT_BOX_PLEAT_COUNT_OPTION: GarmentOption = {
  id: SKIRT_BOX_PLEAT_COUNT_OPTION_ID,
  label: "Box-pleat guide groups (whole garment)",
  unit: "groups",
  help: "Sets illustrative fold/roll/placement guide groups over the existing Skirt outline. This does not add cut fullness or define a sewn pleat.",
  group: "Pleat guide",
  appliesToStarterEntryId: SKIRT_BOX_PLEAT_ENTRY_ID,
  preserveInvalidWhenRestored: true,
  defaultValue: 4,
  min: 4,
  max: 12,
  step: 4,
};
export const SKIRT_BOX_PLEAT_SPACING_OPTION: GarmentOption = {
  id: SKIRT_BOX_PLEAT_SPACING_OPTION_ID,
  label: "Guide-line spacing",
  unit: "cm",
  help: "Controls the separation of digital pleat-guide lines only; it is not pleat intake, fabric width or sewn depth.",
  group: "Pleat guide",
  appliesToStarterEntryId: SKIRT_BOX_PLEAT_ENTRY_ID,
  preserveInvalidWhenRestored: true,
  defaultValue: 3,
  min: 1,
  max: 4,
  step: 0.5,
};

export const SKIRT_TIERED_ENTRY_ID = "skirt-tiered-gathered-digital-v1";
export const SKIRT_TIER_COUNT_OPTION_ID = "tierCount";
export const SKIRT_TIER_GATHER_RATIO_OPTION_ID = "tierGatherRatio";
export const SKIRT_TIER_COUNT_OPTION: GarmentOption = {
  id: SKIRT_TIER_COUNT_OPTION_ID,
  label: "Total skirt tiers (software setting)",
  unit: "tiers",
  help: "Selects 2–4 total digital panels including the shaped upper tier. The count is a software construction choice, not a physical standard.",
  group: "Tier construction",
  appliesToStarterEntryId: SKIRT_TIERED_ENTRY_ID,
  preserveInvalidWhenRestored: true,
  defaultValue: 3,
  min: 2,
  max: 4,
  step: 1,
};
export const SKIRT_TIER_GATHER_RATIO_OPTION: GarmentOption = {
  id: SKIRT_TIER_GATHER_RATIO_OPTION_ID,
  label: "Gathered join ratio (software setting)",
  unit: "ratio",
  help: "Sets each lower tier's cut edge relative to the previous panel's seam edge. This 1.25 or 1.50 ratio is an InfiniDrip software choice, not a fabric-specific or sewing standard.",
  group: "Tier construction",
  appliesToStarterEntryId: SKIRT_TIERED_ENTRY_ID,
  preserveInvalidWhenRestored: true,
  defaultValue: 1.25,
  min: 1.25,
  max: 1.5,
  step: 0.25,
};

export const SKIRT_WRAP_ENTRY_ID = "skirt-wrap-front-overlap-digital-v1";
export const SKIRT_WRAP_OVERLAP_OPTION_ID = "frontOverlapCm";
export const SKIRT_WRAP_FACING_WIDTH_OPTION_ID = "overlapFacingWidthCm";
export const SKIRT_WRAP_OVERLAP_OPTION: GarmentOption = {
  id: SKIRT_WRAP_OVERLAP_OPTION_ID,
  label: "Front overlap width (software setting)",
  unit: "cm",
  help: "Adds a digital extension at the open center-front edge. This is an InfiniDrip setting, not a physical coverage or fit guarantee.",
  group: "Wrap front",
  appliesToStarterEntryId: SKIRT_WRAP_ENTRY_ID,
  preserveInvalidWhenRestored: true,
  defaultValue: 20,
  min: 10,
  max: 40,
  step: 5,
};
export const SKIRT_WRAP_FACING_WIDTH_OPTION: GarmentOption = {
  id: SKIRT_WRAP_FACING_WIDTH_OPTION_ID,
  label: "Overlap facing width (software setting)",
  unit: "cm",
  help: "Sets the separate digital facing width along the open overlap edge. This is not a physical finishing or seam-allowance standard.",
  group: "Wrap front",
  appliesToStarterEntryId: SKIRT_WRAP_ENTRY_ID,
  preserveInvalidWhenRestored: true,
  defaultValue: 5,
  min: 3,
  max: 8,
  step: 0.5,
};

export interface WrapSkirtSettings {
  readonly frontOverlapCm: number;
  readonly overlapFacingWidthCm: number;
}

export function isWrapSkirtProfile(options: GarmentOptions = {}): boolean {
  return Object.prototype.hasOwnProperty.call(options, SKIRT_WRAP_OVERLAP_OPTION_ID)
    || Object.prototype.hasOwnProperty.call(options, SKIRT_WRAP_FACING_WIDTH_OPTION_ID);
}

export function wrapSkirtOptions(options: GarmentOptions = {}): WrapSkirtSettings {
  const frontOverlapCm = options[SKIRT_WRAP_OVERLAP_OPTION_ID] ?? SKIRT_WRAP_OVERLAP_OPTION.defaultValue;
  const overlapFacingWidthCm = options[SKIRT_WRAP_FACING_WIDTH_OPTION_ID] ?? SKIRT_WRAP_FACING_WIDTH_OPTION.defaultValue;
  if (![10, 15, 20, 25, 30, 35, 40].includes(frontOverlapCm)) {
    throw new RangeError("K06 front overlap must be 10–40 cm in 5 cm steps; keep the saved value and choose a supported setting to restore the digital draft");
  }
  if (!Number.isFinite(overlapFacingWidthCm) || overlapFacingWidthCm < 3 || overlapFacingWidthCm > 8
    || Math.round((overlapFacingWidthCm - 3) * 2) !== (overlapFacingWidthCm - 3) * 2) {
    throw new RangeError("K06 overlap facing width must be 3–8 cm in 0.5 cm steps; keep the saved value and choose a supported setting to restore the digital draft");
  }
  return { frontOverlapCm, overlapFacingWidthCm };
}

export function wrapSkirtProblem(m: Measurements, options: GarmentOptions = {}): string | null {
  if (!isWrapSkirtProfile(options)) return null;
  if (Object.prototype.hasOwnProperty.call(options, SKIRT_A_LINE_HEM_SWEEP_OPTION_ID)
    || Object.prototype.hasOwnProperty.call(options, SKIRT_PENCIL_HEM_TAPER_OPTION_ID)
    || Object.prototype.hasOwnProperty.call(options, SKIRT_GATHER_RATIO_OPTION_ID)
    || Object.prototype.hasOwnProperty.call(options, SKIRT_CASING_DEPTH_OPTION_ID)
    || Object.prototype.hasOwnProperty.call(options, SKIRT_BOX_PLEAT_COUNT_OPTION_ID)
    || Object.prototype.hasOwnProperty.call(options, SKIRT_BOX_PLEAT_SPACING_OPTION_ID)
    || Object.prototype.hasOwnProperty.call(options, SKIRT_TIER_COUNT_OPTION_ID)
    || Object.prototype.hasOwnProperty.call(options, SKIRT_TIER_GATHER_RATIO_OPTION_ID)) {
    return "K06 front-overlap construction cannot be combined with another skirt profile. Keep only the K06 overlap and facing settings; the preview and outputs stay paused.";
  }
  let settings: WrapSkirtSettings;
  try {
    settings = wrapSkirtOptions(options);
  } catch (error) {
    return error instanceof Error ? error.message : "K06 overlap settings are invalid; correct them to restore the digital draft.";
  }
  const { waistHalf, hipHalf } = skirtWidths(m);
  if (![m.waist, m.hip, m.hipDepth, m.length, m.ease, waistHalf, hipHalf]
    .every(Number.isFinite) || waistHalf <= 0 || hipHalf <= 0) {
    return "K06 needs positive finite waist-plus-ease and hip-plus-ease widths. Correct the measurements to restore the preview and outputs.";
  }
  if (m.hipDepth <= 0) return "K06 hip depth must be positive so both front panels and the facing can be drafted.";
  if (m.length <= m.hipDepth) return "K06 skirt length must exceed hip depth so the open front edge and side opening run below the hip. Increase length or reduce hip depth.";
  if (settings.frontOverlapCm >= 2 * hipHalf) {
    return `K06 front overlap (${settings.frontOverlapCm} cm) must be smaller than the ${2 * hipHalf} cm modeled digital front width. Reduce overlap or increase the modeled hip/ease width; the preview and outputs stay paused.`;
  }
  return null;
}

export interface TieredSkirtSettings {
  readonly tierCount: number;
  readonly gatherRatio: number;
}

export function isTieredSkirtProfile(options: GarmentOptions = {}): boolean {
  return Object.prototype.hasOwnProperty.call(options, SKIRT_TIER_COUNT_OPTION_ID)
    || Object.prototype.hasOwnProperty.call(options, SKIRT_TIER_GATHER_RATIO_OPTION_ID);
}

export function tieredSkirtOptions(options: GarmentOptions = {}): TieredSkirtSettings {
  const tierCount = options[SKIRT_TIER_COUNT_OPTION_ID] ?? SKIRT_TIER_COUNT_OPTION.defaultValue;
  const gatherRatio = options[SKIRT_TIER_GATHER_RATIO_OPTION_ID] ?? SKIRT_TIER_GATHER_RATIO_OPTION.defaultValue;
  if (![2, 3, 4].includes(tierCount)) {
    throw new RangeError("K05 total tier count must be 2, 3 or 4; the saved value is retained until corrected");
  }
  if (![1.25, 1.5].includes(gatherRatio)) {
    throw new RangeError("K05 gathered join ratio must be 1.25 or 1.50; the saved value is retained until corrected");
  }
  return { tierCount, gatherRatio };
}

export function tieredSkirtProblem(m: Measurements, options: GarmentOptions = {}): string | null {
  if (!isTieredSkirtProfile(options)) return null;
  if (Object.prototype.hasOwnProperty.call(options, SKIRT_A_LINE_HEM_SWEEP_OPTION_ID)
      || Object.prototype.hasOwnProperty.call(options, SKIRT_PENCIL_HEM_TAPER_OPTION_ID)
      || Object.prototype.hasOwnProperty.call(options, SKIRT_GATHER_RATIO_OPTION_ID)
      || Object.prototype.hasOwnProperty.call(options, SKIRT_CASING_DEPTH_OPTION_ID)
      || Object.prototype.hasOwnProperty.call(options, SKIRT_BOX_PLEAT_COUNT_OPTION_ID)
      || Object.prototype.hasOwnProperty.call(options, SKIRT_BOX_PLEAT_SPACING_OPTION_ID)) {
    return "K05 tier construction cannot be combined with another skirt profile. Keep only the K05 tier settings; the preview and outputs stay paused.";
  }
  try {
    tieredSkirtOptions(options);
  } catch (error) {
    return error instanceof Error ? error.message : "K05 tier settings are invalid; correct them to restore the digital draft.";
  }
  const widths = skirtWidths(m);
  if (![m.waist, m.hip, m.hipDepth, m.length, m.ease, widths.waistHalf, widths.hipHalf]
    .every(Number.isFinite) || widths.waistHalf <= 0 || widths.hipHalf <= 0) {
    return "K05 needs positive finite waist-plus-ease and hip-plus-ease widths. Correct the measurements to restore the preview and outputs.";
  }
  if (m.hipDepth <= 0) return "K05 hip depth must be positive so the upper tier can be drafted. Correct hip depth to restore the preview and outputs.";
  if (m.length <= m.hipDepth) {
    return "K05 total skirt length must exceed hip depth so every tier has positive length. Correct skirt length to restore the preview and outputs.";
  }
  // The largest supported multiplier is 1.5^3 = 3.375, below the quarter-
  // width divisor; a finite full hip width therefore keeps every cut width
  // finite. Each component rechecks its concrete dimensions before drafting.
  return null;
}

export interface BoxPleatGuideGroup {
  readonly index: number;
  readonly centerX: number;
  readonly leftFoldX: number;
  readonly leftPlacementX: number;
  readonly rollX: number;
  readonly rightPlacementX: number;
  readonly rightFoldX: number;
}

export function isBoxPleatedSkirtProfile(options: GarmentOptions = {}): boolean {
  return Object.prototype.hasOwnProperty.call(options, SKIRT_BOX_PLEAT_COUNT_OPTION_ID);
}

/** Return the user-facing, fail-closed reason when a K04 guide cannot fit. */
export function boxPleatGuideProblem(m: Measurements, options: GarmentOptions = {}): string | null {
  if (!isBoxPleatedSkirtProfile(options)) return null;
  if (Object.prototype.hasOwnProperty.call(options, SKIRT_A_LINE_HEM_SWEEP_OPTION_ID)
      || Object.prototype.hasOwnProperty.call(options, SKIRT_PENCIL_HEM_TAPER_OPTION_ID)
      || isGatheredSkirtProfile(options)) {
    return "The box-pleat guide cannot be combined with another skirt profile. Keep only the box-pleat guide settings; the preview and outputs stay paused.";
  }
  const count = options[SKIRT_BOX_PLEAT_COUNT_OPTION_ID] ?? SKIRT_BOX_PLEAT_COUNT_OPTION.defaultValue;
  if (![4, 8, 12].includes(count)) {
    return "Box-pleat guide groups must be 4, 8 or 12. The saved value is retained; choose one of those settings to restore the preview and outputs.";
  }
  const spacing = options[SKIRT_BOX_PLEAT_SPACING_OPTION_ID] ?? SKIRT_BOX_PLEAT_SPACING_OPTION.defaultValue;
  if (!Number.isFinite(spacing) || spacing < 1 || spacing > 4 || (spacing - 1) * 2 % 1 !== 0) {
    return "Box-pleat guide spacing must be 1–4 cm in 0.5 cm steps. The saved value is retained; choose a supported spacing to restore the preview and outputs.";
  }
  const { waistHalf } = skirtWidths(m);
  if (!Number.isFinite(waistHalf) || waistHalf <= 0 || !Number.isFinite(m.length) || m.length <= 0) {
    return "The box-pleat guides need a positive finite waist-plus-ease width and skirt length. Correct those measurements to restore the preview and outputs.";
  }
  const groupsPerQuarter = count / 4;
  const groupPitch = waistHalf / (groupsPerQuarter + 1);
  if (2 * spacing >= groupPitch) {
    return `The ${count} box-pleat guide groups at ${spacing} cm spacing overlap or cross the on-fold panel edge. Reduce guide spacing, choose fewer groups, or increase the modeled waist/ease width; the preview and outputs stay paused.`;
  }
  return null;
}

export function boxPleatGuideGroups(m: Measurements, options: GarmentOptions = {}): BoxPleatGuideGroup[] {
  const problem = boxPleatGuideProblem(m, options);
  if (problem) throw new RangeError(problem);
  const count = options[SKIRT_BOX_PLEAT_COUNT_OPTION_ID] ?? SKIRT_BOX_PLEAT_COUNT_OPTION.defaultValue;
  const spacing = options[SKIRT_BOX_PLEAT_SPACING_OPTION_ID] ?? SKIRT_BOX_PLEAT_SPACING_OPTION.defaultValue;
  const { waistHalf } = skirtWidths(m);
  const groupsPerQuarter = count / 4;
  const pitch = waistHalf / (groupsPerQuarter + 1);
  return Array.from({ length: groupsPerQuarter }, (_, index) => {
    const centerX = (index + 1) * pitch;
    return {
      index: index + 1,
      centerX,
      leftFoldX: centerX - spacing,
      leftPlacementX: centerX - spacing / 2,
      rollX: centerX,
      rightPlacementX: centerX + spacing / 2,
      rightFoldX: centerX + spacing,
    };
  });
}

export function boxPleatPanelMarks(m: Measurements, options: GarmentOptions = {}) {
  return boxPleatGuideGroups(m, options).flatMap((group) => [
    lineMark("foldLine", `boxPleat${group.index}LeftFold`, point(group.leftFoldX, 0), point(group.leftFoldX, m.length), `Box pleat ${group.index} fold`, "instruction"),
    lineMark("placementLine", `boxPleat${group.index}LeftPlacement`, point(group.leftPlacementX, 0), point(group.leftPlacementX, m.length), `Box pleat ${group.index} placement`, "instruction"),
    lineMark("foldLine", `boxPleat${group.index}Roll`, point(group.rollX, 0), point(group.rollX, m.length), `Box pleat ${group.index} roll`, "instruction"),
    lineMark("placementLine", `boxPleat${group.index}RightPlacement`, point(group.rightPlacementX, 0), point(group.rightPlacementX, m.length), `Box pleat ${group.index} placement`, "instruction"),
    lineMark("foldLine", `boxPleat${group.index}RightFold`, point(group.rightFoldX, 0), point(group.rightFoldX, m.length), `Box pleat ${group.index} fold`, "instruction"),
  ]);
}

export function isGatheredSkirtProfile(options: GarmentOptions = {}): boolean {
  return Object.prototype.hasOwnProperty.call(options, SKIRT_GATHER_RATIO_OPTION_ID);
}

function gatheredSkirtOption(options: GarmentOptions, id: string, fallback: number): number {
  const value = options[id] ?? fallback;
  if (!Number.isFinite(value)) {
    throw new RangeError(`K03 ${id} must be finite; enter a supported value to restore the digital draft`);
  }
  return value;
}

export function gatheredSkirtOptions(options: GarmentOptions = {}): { gatherRatio: number; casingDepthCm: number } {
  return {
    gatherRatio: gatheredSkirtOption(options, SKIRT_GATHER_RATIO_OPTION_ID, 1.5),
    casingDepthCm: gatheredSkirtOption(options, SKIRT_CASING_DEPTH_OPTION_ID, 4),
  };
}

/** Additional width assigned to each of the four on-fold quarter panels. */
export function skirtHemSweepQuarterCm(options: GarmentOptions = {}): number {
  return (options[SKIRT_A_LINE_HEM_SWEEP_OPTION_ID] ?? 0) / 4;
}

/** Inward width removed from each of the four on-fold quarter panels. */
export function skirtHemTaperQuarterCm(options: GarmentOptions = {}): number {
  return (options[SKIRT_PENCIL_HEM_TAPER_OPTION_ID] ?? 0) / 4;
}

/** Signed quarter-panel hem adjustment, keeping sweep and taper options separate. */
export function skirtHemAdjustmentQuarterCm(options: GarmentOptions = {}): number {
  const sweep = skirtHemSweepQuarterCm(options);
  const taper = skirtHemTaperQuarterCm(options);
  if (!Number.isFinite(sweep) || !Number.isFinite(taper)) {
    throw new Error("A skirt hem adjustment must be finite");
  }
  if (sweep < 0 || taper < 0) {
    throw new Error("A skirt hem sweep or taper cannot be negative");
  }
  if (sweep > 0 && taper > 0) {
    throw new Error("A skirt panel cannot combine hem sweep and hem taper");
  }
  return sweep - taper;
}

/** The skirt's own half-widths at the waist and hip — the single source of
 *  truth `panel()` drafts from and `render/skirt-figure.ts` must draw from
 *  too. Exported (Slice 61) after the figure view was found computing its
 *  OWN independent approximation (`waist * 0.20`, `hip * 0.22` — dropping
 *  ease entirely) a few lines away from `renderSkirtGarment`'s correct
 *  formula in the very same file. Same fix as `derive().chestWidthHalf` for
 *  the upper body: one function, every consumer reads it. */
export function skirtWidths(m: Measurements): { waistHalf: number; hipHalf: number } {
  return {
    waistHalf: (m.waist + m.ease) / 4, // quarter-panel at the waist
    hipHalf: (m.hip + m.ease) / 4,     // quarter-panel at the hip (the widest)
  };
}

export function skirtHemWidthQuarterCm(m: Measurements, options: GarmentOptions = {}): number {
  const width = skirtWidths(m).hipHalf + skirtHemAdjustmentQuarterCm(options);
  if (skirtHemTaperQuarterCm(options) > 0 && (!Number.isFinite(width) || width <= 0)) {
    throw new Error("A skirt hem taper must leave a positive finite quarter-panel width");
  }
  return width;
}
/** One skirt panel (front or back), cut on the fold at the centre (x = 0). */
function panel(m: Measurements, name: string, hemOffsetQuarterCm = 0): Piece {
  const { waistHalf: waistQ, hipHalf: hipQ } = skirtWidths(m);

  const cWaist = point(0, 0);
  const sWaist = point(waistQ, 0);
  const sHip = point(hipQ, m.hipDepth);
  const sHem = point(hipQ + hemOffsetQuarterCm, m.length);
  const cHem = point(0, m.length);

  const edges: Edge[] = [
    { kind: "line", name: "waist", start: cWaist, end: sWaist },
    { kind: "line", name: "sideUpper", start: sWaist, end: sHip },
    { kind: "line", name: "sideLower", start: sHip, end: sHem },
    { kind: "line", name: "hem", start: sHem, end: cHem },
    { kind: "line", name: "center", start: cHem, end: cWaist },
  ];
  return { name, onFold: true, edges };
}

export interface SkirtPanelParams {
  readonly position: "front" | "back";
  /** Straight keeps the base hem; flare and taper require explicit positive quarter-panel changes. */
  readonly silhouette: "straight" | "flare" | "taper";
  /** Whole-garment sweep divided across four on-fold quarter panels. */
  readonly hemSweepQuarterCm?: number;
  /** Whole-garment taper removed from each of four on-fold quarter panels. */
  readonly hemTaperQuarterCm?: number;
}

/** The SkirtPanel component (Phase C1, Slice 58): formalises `panel` — the
 *  skirt's own real implementation since Slice 1 — behind the same
 *  `Component` shape every other Phase B/C piece uses, mirroring `bodice`'s
 *  `{position}` pattern exactly. Not a new abstraction invented for a second
 *  consumer that doesn't exist yet (§5's "two real consumers" rule is about
 *  inventing, not about wrapping an already-real implementation for
 *  consistency) — `panel`'s geometry is untouched, so this is byte-identical. */
export const skirtPanel: Component<SkirtPanelParams> = (m, params) => {
  if (params.silhouette !== "straight" && params.silhouette !== "flare" && params.silhouette !== "taper") {
    throw new Error("Skirt silhouette is not supported");
  }
  if (params.silhouette === "flare") {
    if (!Number.isFinite(params.hemSweepQuarterCm) || params.hemSweepQuarterCm! <= 0) {
      throw new Error("A flared skirt panel requires a positive finite hem-sweep value");
    }
    if (params.hemTaperQuarterCm !== undefined && params.hemTaperQuarterCm !== 0) {
      throw new Error("A flared skirt panel cannot include hem taper");
    }
    return {
      pieces: { [params.position]: panel(m, params.position, params.hemSweepQuarterCm) },
      stitches: [],
      interfaces: { waist: iface(edgeRef(params.position, "waist")) },
    };
  }
  if (params.silhouette === "taper") {
    if (!Number.isFinite(params.hemTaperQuarterCm) || params.hemTaperQuarterCm! <= 0) {
      throw new Error("A tapered skirt panel requires a positive finite hem-taper value");
    }
    if (params.hemSweepQuarterCm !== undefined && params.hemSweepQuarterCm !== 0) {
      throw new Error("A tapered skirt panel cannot include hem sweep");
    }
    const hemWidth = skirtWidths(m).hipHalf - params.hemTaperQuarterCm!;
    if (!Number.isFinite(hemWidth) || hemWidth <= 0) {
      throw new Error("A skirt hem taper must leave a positive finite quarter-panel width");
    }
    return {
      pieces: { [params.position]: panel(m, params.position, -params.hemTaperQuarterCm!) },
      stitches: [],
      interfaces: { waist: iface(edgeRef(params.position, "waist")) },
    };
  }
  if (params.hemSweepQuarterCm !== undefined && params.hemSweepQuarterCm !== 0) {
    throw new Error("A straight skirt panel cannot include hem sweep");
  }
  if (params.hemTaperQuarterCm !== undefined && params.hemTaperQuarterCm !== 0) {
    throw new Error("A straight skirt panel cannot include hem taper");
  }
  return {
    pieces: { [params.position]: panel(m, params.position) },
    stitches: [],
    interfaces: { waist: iface(edgeRef(params.position, "waist")) },
  };
};

export interface GatheredSkirtPanelParams {
  readonly position: "front" | "back";
  readonly gatherRatio: number;
  readonly casingDepthCm: number;
}

/** K03's flat cut piece carries a gathered waist extension above the finished
 * fold line. Its cut edge is deliberately distinct from the modeled waist. */
export const gatheredSkirtPanel: Component<GatheredSkirtPanelParams> = (m, params) => {
  const { gatherRatio, casingDepthCm } = gatheredSkirtOptions({
    [SKIRT_GATHER_RATIO_OPTION_ID]: params.gatherRatio,
    [SKIRT_CASING_DEPTH_OPTION_ID]: params.casingDepthCm,
  });
  const finishedWaistQ = m.waist / 4;
  const { hipHalf } = skirtWidths(m);
  const cutWaistQ = (m.waist * gatherRatio) / 4;
  const cutTopCenter = point(0, -casingDepthCm);
  const cutTopSide = point(cutWaistQ, -casingDepthCm);
  const waistSide = point(finishedWaistQ, 0);
  const hipSide = point(hipHalf, m.hipDepth);
  const hemSide = point(hipHalf, m.length);
  const hemCenter = point(0, m.length);
  const casingGuideY = casingDepthCm;
  const casingGuideX = m.hipDepth > 0
    ? finishedWaistQ + (hipHalf - finishedWaistQ) * casingDepthCm / m.hipDepth
    : finishedWaistQ;
  const edges: Edge[] = [
    { kind: "line", name: "waist", start: cutTopCenter, end: cutTopSide },
    { kind: "line", name: "casingSide", start: cutTopSide, end: waistSide },
    { kind: "line", name: "sideUpper", start: waistSide, end: hipSide },
    { kind: "line", name: "sideLower", start: hipSide, end: hemSide },
    { kind: "line", name: "hem", start: hemSide, end: hemCenter },
    { kind: "line", name: "center", start: hemCenter, end: cutTopCenter },
  ];
  return {
    pieces: {
      [params.position]: {
        name: params.position,
        onFold: true,
        edges,
        marks: [
          lineMark("foldLine", "casingFold", point(0, 0), point(finishedWaistQ, 0),
            "Finished waist fold line", "instruction"),
          lineMark("placementLine", "casingStitchGuide", point(0, casingGuideY), point(casingGuideX, casingGuideY),
            "Casing stitch guide (software depth)", "instruction"),
        ],
      },
    },
    stitches: [],
    interfaces: { waist: iface(edgeRef(params.position, "waist")) },
  };
};

const GATHERED_SKIRT_SIDE_SEAM: Stitch = {
  label: "Side seam (gathered front ↔ back)",
  a: iface(edgeRef("front", "casingSide"), edgeRef("front", "sideUpper"), edgeRef("front", "sideLower")),
  b: iface(edgeRef("back", "casingSide"), edgeRef("back", "sideUpper"), edgeRef("back", "sideLower")),
};

export const SKIRT_GATHERED_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "front",
    notches: [matchedNotch(GATHERED_SKIRT_SIDE_SEAM, "a", 0.5, 1)],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "back",
    notches: [
      matchedNotch(GATHERED_SKIRT_SIDE_SEAM, "b", 0.5, 1),
      matchedNotch(GATHERED_SKIRT_SIDE_SEAM, "b", 0.5, 1),
    ],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
];

export const SKIRT_GATHERED_GRAMMAR = garmentGrammar(
  "skirt-gathered-pull-on",
  [
    componentNode("front", "gathered-skirt-panel", gatheredSkirtPanel, (context) => ({
      position: "front" as const,
      ...gatheredSkirtOptions(context.options),
    })),
    componentNode("back", "gathered-skirt-panel", gatheredSkirtPanel, (context) => ({
      position: "back" as const,
      ...gatheredSkirtOptions(context.options),
    })),
  ],
  () => [GATHERED_SKIRT_SIDE_SEAM],
);

export const SKIRT_GATHERED_POMS: readonly Pom[] = [
  {
    label: "Cut waist edge (before gathering)",
    measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "waist", at: "end" }, FOLD),
    anchor: (b) => edgeEnd(pieceEdge(rolePiece(b, "front"), "waist")),
    backAnchor: (b) => edgeEnd(pieceEdge(rolePiece(b, "back"), "waist")),
  },
  {
    label: "Measured waist (digital gathered-to reference)",
    measure: (b) => {
      const fold = rolePiece(b, "front").marks?.find((mark) => mark.name === "casingFold");
      if (!fold || !("start" in fold)) throw new Error("K03 front panel is missing its casing fold line");
      return 4 * Math.abs(fold.end.x - fold.start.x);
    },
  },
  {
    label: "Hip (modeled)",
    tolerance: 1.3,
    measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "sideLower", at: "start" }, FOLD),
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "sideLower")),
    backAnchor: (b) => edgeStart(pieceEdge(rolePiece(b, "back"), "sideLower")),
  },
  {
    label: "Length (finished top fold–hem)",
    tolerance: 1.3,
    measure: (b) => spanY(rolePiece(b, "front"), { edge: "sideUpper", at: "start" }, { edge: "hem", at: "end" }),
  },
];

export interface TieredSkirtPanelParams {
  readonly roleId: string;
  readonly tier: "upper" | "lower";
  readonly topHalfWidthCm: number;
  readonly bottomHalfWidthCm: number;
  readonly lengthCm: number;
}

/** A K05 on-fold panel. The upper tier is shaped waist-to-hip; lower tiers are
 * constant-width cut rectangles whose top edges are gathered during assembly. */
export const tieredSkirtPanel: Component<TieredSkirtPanelParams> = (_m, params) => {
  const { topHalfWidthCm: topWidth, bottomHalfWidthCm: bottomWidth, lengthCm } = params;
  if (![topWidth, bottomWidth, lengthCm].every(Number.isFinite)
    || topWidth <= 0 || bottomWidth <= 0 || lengthCm <= 0) {
    throw new RangeError("K05 panel widths and length must be positive and finite");
  }
  if (params.tier === "lower" && Math.abs(topWidth - bottomWidth) > 1e-9) {
    throw new RangeError("K05 lower-tier cut panels must keep constant width from top to hem");
  }
  const topCenter = point(0, 0);
  const topSide = point(topWidth, 0);
  const bottomSide = point(bottomWidth, lengthCm);
  const bottomCenter = point(0, lengthCm);
  const sideName = params.tier === "upper" ? "sideUpper" : "side";
  const piece: Piece = {
    name: params.roleId,
    onFold: true,
    edges: [
      { kind: "line", name: "waist", start: topCenter, end: topSide },
      { kind: "line", name: sideName, start: topSide, end: bottomSide },
      { kind: "line", name: "hem", start: bottomSide, end: bottomCenter },
      { kind: "line", name: "center", start: bottomCenter, end: topCenter },
    ],
  };
  return {
    pieces: { [params.roleId]: piece },
    stitches: [],
    interfaces: {
      waist: iface(edgeRef(params.roleId, "waist")),
      hem: iface(edgeRef(params.roleId, "hem")),
      side: iface(edgeRef(params.roleId, sideName)),
    },
  };
};

function lowerTierRole(tier: number, position: "front" | "back"): string {
  return `tier${tier}${position === "front" ? "Front" : "Back"}`;
}

function tieredCutHalfWidths(m: Measurements, settings: TieredSkirtSettings): number[] {
  const widths: number[] = [];
  let width = skirtWidths(m).hipHalf;
  for (let tier = 1; tier < settings.tierCount; tier += 1) {
    width *= settings.gatherRatio;
    widths.push(width);
  }
  return widths;
}

function tieredSkirtStitches(settings: TieredSkirtSettings): Stitch[] {
  const stitches: Stitch[] = [
    {
      label: "Side seam (upper tier front ↔ back)",
      a: iface(edgeRef("front", "sideUpper")),
      b: iface(edgeRef("back", "sideUpper")),
    },
    {
      label: "Waistband (upper tier front + back ↔ matching bands)",
      a: iface(edgeRef("front", "waist"), edgeRef("back", "waist", true)),
      b: iface(edgeRef("waistbandFront", "seam", true), edgeRef("waistbandBack", "seam")),
    },
    {
      label: "Waistband side seam (front ↔ back)",
      a: iface(edgeRef("waistbandFront", "side")),
      b: iface(edgeRef("waistbandBack", "side")),
    },
    {
      label: "Side zipper path (waistband → hip)",
      a: iface(edgeRef("waistbandFront", "side"), edgeRef("front", "sideUpper")),
      b: iface(edgeRef("waistbandBack", "side"), edgeRef("back", "sideUpper")),
    },
  ];
  for (let tier = 1; tier < settings.tierCount; tier += 1) {
    const frontRole = lowerTierRole(tier, "front");
    const backRole = lowerTierRole(tier, "back");
    stitches.push({
      label: `Side seam (tier ${tier} front ↔ back)`,
      a: iface(edgeRef(frontRole, "side")),
      b: iface(edgeRef(backRole, "side")),
    });
    const previousFront = tier === 1 ? "front" : lowerTierRole(tier - 1, "front");
    const previousBack = tier === 1 ? "back" : lowerTierRole(tier - 1, "back");
    stitches.push({
      label: `Gathered tier ${tier} join (cut ÷ target ${settings.gatherRatio.toFixed(2)})`,
      a: iface(edgeRef(previousFront, "hem"), edgeRef(previousBack, "hem")),
      b: iface(edgeRef(frontRole, "waist"), edgeRef(backRole, "waist")),
      gather: { cutSide: "b", ratio: settings.gatherRatio },
    });
  }
  return stitches;
}

export function tieredSkirtGrammar(options: GarmentOptions = {}) {
  const settings = tieredSkirtOptions(options);
  const nodes = [
    componentNode("front", "tiered-skirt-upper-panel", tieredSkirtPanel, (context) => {
      const widths = skirtWidths(context.measurements);
      return { roleId: "front", tier: "upper" as const, topHalfWidthCm: widths.waistHalf,
        bottomHalfWidthCm: widths.hipHalf, lengthCm: context.measurements.hipDepth };
    }),
    componentNode("back", "tiered-skirt-upper-panel", tieredSkirtPanel, (context) => {
      const widths = skirtWidths(context.measurements);
      return { roleId: "back", tier: "upper" as const, topHalfWidthCm: widths.waistHalf,
        bottomHalfWidthCm: widths.hipHalf, lengthCm: context.measurements.hipDepth };
    }),
    componentNode("waistband", "waistband", waistband, (context) => ({
      ...WAISTBAND_DEFAULT,
      frontSeamLength: context.interfaceLength("front", "waist"),
      backSeamLength: context.interfaceLength("back", "waist"),
    }), ["front", "back"]),
    ...Array.from({ length: settings.tierCount - 1 }, (_, index) => {
      const tier = index + 1;
      return (["front", "back"] as const).map((position) => {
        const roleId = lowerTierRole(tier, position);
        return componentNode(roleId, "tiered-skirt-lower-panel", tieredSkirtPanel, (context) => {
          const width = tieredCutHalfWidths(context.measurements, settings)[index]!;
          return { roleId, tier: "lower" as const, topHalfWidthCm: width, bottomHalfWidthCm: width,
            lengthCm: (context.measurements.length - context.measurements.hipDepth) / (settings.tierCount - 1) };
        });
      });
    }).flat(),
  ];
  return garmentGrammar("skirt-tiered-gathered", nodes, () => tieredSkirtStitches(settings));
}

export function tieredSkirtNotches(options: GarmentOptions = {}): readonly PieceNotches[] {
  const settings = tieredSkirtOptions(options);
  const stitches = tieredSkirtStitches(settings);
  const byRole = new Map<string, { notches: { edgeName: string; t: number }[] }>();
  const add = (roleId: string, notch: { edgeName: string; t: number }): void => {
    const entry = byRole.get(roleId) ?? { notches: [] };
    entry.notches.push(notch);
    byRole.set(roleId, entry);
  };
  const topSide = stitches.find((stitch) => stitch.label === "Side seam (upper tier front ↔ back)")!;
  const waistbandSeam = stitches.find((stitch) => stitch.label.startsWith("Waistband ("))!;
  const zipperPath = stitches.find((stitch) => stitch.label === "Side zipper path (waistband → hip)")!;
  add("front", matchedNotch(topSide, "a", 0.5));
  add("back", matchedNotch(topSide, "b", 0.5));
  add("back", matchedNotch(topSide, "b", 0.75));
  add("waistbandFront", matchedNotch(waistbandSeam, "b", 0, 0));
  add("waistbandFront", matchedNotch(zipperPath, "a", 1, 0));
  add("waistbandBack", matchedNotch(waistbandSeam, "b", 0, 1));
  add("waistbandBack", matchedNotch(zipperPath, "b", 1, 0));
  for (let tier = 1; tier < settings.tierCount; tier += 1) {
    const frontRole = lowerTierRole(tier, "front");
    const backRole = lowerTierRole(tier, "back");
    const side = stitches.find((stitch) => stitch.label === `Side seam (tier ${tier} front ↔ back)`)!;
    add(frontRole, matchedNotch(side, "a", 0.5));
    add(backRole, matchedNotch(side, "b", 0.5));
    add(backRole, matchedNotch(side, "b", 0.75));
    const gather = stitches.find((stitch) => stitch.label.startsWith(`Gathered tier ${tier} join `))!;
    add(tier === 1 ? "front" : lowerTierRole(tier - 1, "front"), matchedNotch(gather, "a", 0.5, 0));
    add(tier === 1 ? "back" : lowerTierRole(tier - 1, "back"), matchedNotch(gather, "a", 0.5, 1));
    add(frontRole, matchedNotch(gather, "b", 0.5, 0));
    add(backRole, matchedNotch(gather, "b", 0.5, 1));
  }
  return [...byRole].map(([pieceName, value]) => ({
    pieceName,
    notches: value.notches,
    grainline: pieceName.startsWith("waistband")
      ? { topEdge: "top", topT: 0.5, bottomEdge: "seam", bottomT: 0.5 }
      : { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  }));
}

export function tieredSkirtPoms(tierCount: number): readonly Pom[] {
  const poms: Pom[] = [
    {
      label: "Upper tier waist edge (modeled digital width)",
      measure: (b) => 4 * edgeLength(pieceEdge(rolePiece(b, "front"), "waist")),
      anchor: (b) => edgeEnd(pieceEdge(rolePiece(b, "front"), "waist")),
      backAnchor: (b) => edgeEnd(pieceEdge(rolePiece(b, "back"), "waist")),
      anchorRoleId: "front", anchorEdgeId: "waist", backAnchorRoleId: "back", backAnchorEdgeId: "waist",
    },
    {
      label: "Upper tier hip seam (modeled digital width)",
      measure: (b) => 4 * edgeLength(pieceEdge(rolePiece(b, "front"), "hem")),
      anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "hem")),
      backAnchor: (b) => edgeStart(pieceEdge(rolePiece(b, "back"), "hem")),
      anchorRoleId: "front", anchorEdgeId: "hem", backAnchorRoleId: "back", backAnchorEdgeId: "hem",
    },
    {
      label: "Upper tier length (digital)",
      measure: (b) => spanY(rolePiece(b, "front"), { edge: "center", at: "start" }, { edge: "center", at: "end" }),
    },
  ];
  for (let tier = 1; tier < tierCount; tier += 1) {
    const frontRole = lowerTierRole(tier, "front");
    const backRole = lowerTierRole(tier, "back");
    poms.push({
      label: `Tier ${tier} cut width before gathering (digital)`,
      measure: (b) => 4 * edgeLength(pieceEdge(rolePiece(b, frontRole), "waist")),
      anchor: (b) => edgeEnd(pieceEdge(rolePiece(b, frontRole), "waist")),
      backAnchor: (b) => edgeEnd(pieceEdge(rolePiece(b, backRole), "waist")),
      anchorRoleId: frontRole, anchorEdgeId: "waist",
      backAnchorRoleId: backRole, backAnchorEdgeId: "waist",
    });
    poms.push({
      label: `Tier ${tier} cut panel length (digital)`,
      measure: (b) => spanY(rolePiece(b, frontRole), { edge: "center", at: "start" }, { edge: "center", at: "end" }),
    });
  }
  poms.push({
    label: "Total modeled skirt length (digital)",
    measure: (b) => spanY(rolePiece(b, "front"), { edge: "center", at: "start" }, { edge: "center", at: "end" })
      + Array.from({ length: tierCount - 1 }, (_, index) => spanY(rolePiece(b, lowerTierRole(index + 1, "front")),
        { edge: "center", at: "start" }, { edge: "center", at: "end" })).reduce((sum, length) => sum + length, 0),
  });
  return poms;
}

function wrapSkirtFrontPanel(m: Measurements, name: string, centerFrontX: number): Piece {
  const { waistHalf, hipHalf } = skirtWidths(m);
  const centerWaist = point(centerFrontX, 0);
  const sideWaist = point(waistHalf, 0);
  const sideHip = point(hipHalf, m.hipDepth);
  const sideHem = point(hipHalf, m.length);
  const centerHem = point(centerFrontX, m.length);
  return {
    name,
    onFold: false,
    edges: [
      { kind: "line", name: "waist", start: centerWaist, end: sideWaist },
      { kind: "line", name: "sideUpper", start: sideWaist, end: sideHip },
      { kind: "line", name: "sideLower", start: sideHip, end: sideHem },
      { kind: "line", name: "hem", start: sideHem, end: centerHem },
      { kind: "line", name: "centerFront", start: centerHem, end: centerWaist },
    ],
  };
}

function wrapSkirtFacing(m: Measurements, settings: WrapSkirtSettings): Piece {
  const outerX = -settings.frontOverlapCm + settings.overlapFacingWidthCm;
  return {
    name: "Wrap overlap facing",
    onFold: false,
    edges: [
      { kind: "line", name: "join", start: point(-settings.frontOverlapCm, 0), end: point(-settings.frontOverlapCm, m.length) },
      { kind: "line", name: "hem", start: point(-settings.frontOverlapCm, m.length), end: point(outerX, m.length) },
      { kind: "line", name: "free", start: point(outerX, m.length), end: point(outerX, 0) },
      { kind: "line", name: "waist", start: point(outerX, 0), end: point(-settings.frontOverlapCm, 0) },
    ],
  };
}

export const wrapSkirtFrontPanels: Component<WrapSkirtSettings> = (m, settings) => {
  const options = {
    [SKIRT_WRAP_OVERLAP_OPTION_ID]: settings.frontOverlapCm,
    [SKIRT_WRAP_FACING_WIDTH_OPTION_ID]: settings.overlapFacingWidthCm,
  };
  const problem = wrapSkirtProblem(m, options);
  if (problem) throw new RangeError(problem);
  return {
    pieces: {
      front: wrapSkirtFrontPanel(m, "Wrap overlap front", -settings.frontOverlapCm),
      frontUnderlap: wrapSkirtFrontPanel(m, "Wrap underlap front", 0),
      overlapFacing: wrapSkirtFacing(m, settings),
    },
    stitches: [],
    interfaces: {
      frontWaist: iface(edgeRef("front", "waist"), edgeRef("frontUnderlap", "waist")),
      overlapEdge: iface(edgeRef("front", "centerFront")),
      facingJoin: iface(edgeRef("overlapFacing", "join")),
    },
  };
};

export interface WrapSkirtWaistbandParams {
  readonly depth: number;
  readonly frontSeamLength: number;
  readonly backSeamLength: number;
}

export const wrapSkirtWaistband: Component<WrapSkirtWaistbandParams> = (m, params) => {
  const bands = waistband(m, params);
  const front = bands.pieces.waistbandFront!;
  const back = bands.pieces.waistbandBack!;
  return {
    ...bands,
    pieces: {
      wrapWaistbandFront: {
        ...front,
        name: "Wrap waistband front",
        onFold: false,
        edges: front.edges.map((edge) => edge.name === "fold" ? { ...edge, name: "sideLeft" } : edge),
      },
      waistbandBack: { ...back, name: "Wrap waistband back" },
    },
    interfaces: {
      ...bands.interfaces,
      frontWaist: iface(edgeRef("wrapWaistbandFront", "seam", true)),
      frontSide: iface(edgeRef("wrapWaistbandFront", "side")),
      backWaist: iface(edgeRef("waistbandBack", "seam", true)),
      backSide: iface(edgeRef("waistbandBack", "side")),
      frontSideLeft: iface(edgeRef("wrapWaistbandFront", "sideLeft")),
    },
  };
};

export function wrapSkirtStitches(): readonly Stitch[] {
  return [
    {
      label: "Side seam (overlap front ↔ back)",
      a: iface(edgeRef("front", "sideUpper"), edgeRef("front", "sideLower")),
      b: iface(edgeRef("back", "sideUpper"), edgeRef("back", "sideLower")),
    },
    {
      label: "Side seam (underlap front ↔ back)",
      a: iface(edgeRef("frontUnderlap", "sideUpper"), edgeRef("frontUnderlap", "sideLower")),
      b: iface(edgeRef("back", "sideUpper"), edgeRef("back", "sideLower")),
    },
    {
      label: "Waistband (front + back ↔ matching bands)",
      a: iface(edgeRef("front", "waist"), edgeRef("frontUnderlap", "waist"), edgeRef("back", "waist", true)),
      b: iface(edgeRef("wrapWaistbandFront", "seam", true), edgeRef("waistbandBack", "seam")),
    },
    {
      label: "Waistband side seam (front ↔ back)",
      a: iface(edgeRef("wrapWaistbandFront", "side")),
      b: iface(edgeRef("waistbandBack", "side")),
    },
    {
      label: "Side zipper path (waistband → hip)",
      a: iface(edgeRef("wrapWaistbandFront", "side"), edgeRef("front", "sideUpper")),
      b: iface(edgeRef("waistbandBack", "side"), edgeRef("back", "sideUpper")),
    },
    {
      label: "Overlap facing (open center-front edge ↔ facing join)",
      a: iface(edgeRef("front", "centerFront")),
      b: iface(edgeRef("overlapFacing", "join", true)),
    },
  ];
}

export function wrapSkirtGrammar(options: GarmentOptions = {}) {
  const settings = wrapSkirtOptions(options);
  return garmentGrammar("skirt-wrap-front-overlap", [
    componentNode("frontPanels", "wrap-skirt-front-panels", wrapSkirtFrontPanels, () => settings),
    componentNode("back", "skirt-panel", skirtPanel, () => ({ position: "back" as const, silhouette: "straight" as const })),
    componentNode("waistband", "wrap-skirt-waistband", wrapSkirtWaistband, (context) => ({
      ...WAISTBAND_DEFAULT,
      frontSeamLength: context.interfaceLength("frontPanels", "frontWaist"),
      backSeamLength: context.interfaceLength("back", "waist"),
    }), ["frontPanels", "back"]),
  ], () => wrapSkirtStitches());
}

export function wrapSkirtNotches(): readonly PieceNotches[] {
  const stitches = wrapSkirtStitches();
  const overlapSide = stitches[0]!;
  const underlapSide = stitches[1]!;
  const waist = stitches[2]!;
  const bandSide = stitches[3]!;
  const zipper = stitches[4]!;
  const facing = stitches[5]!;
  return [
    { pieceName: "Wrap overlap front", notches: [matchedNotch(overlapSide, "a", 0.5), matchedNotch(facing, "a", 0.5)],
      grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 } },
    { pieceName: "Wrap underlap front", notches: [matchedNotch(underlapSide, "a", 0.5)],
      grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 } },
    { pieceName: "Wrap overlap facing", notches: [matchedNotch(facing, "b", 0.5)],
      grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 } },
    { pieceName: "back", notches: [matchedNotch(overlapSide, "b", 0.5), matchedNotch(underlapSide, "b", 0.75)],
      grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 } },
    { pieceName: "Wrap waistband front", notches: [matchedNotch(waist, "b", 0.25), matchedNotch(bandSide, "a", 0.5), matchedNotch(zipper, "a", 1)],
      grainline: { topEdge: "top", topT: 0.5, bottomEdge: "seam", bottomT: 0.5 } },
    { pieceName: "Wrap waistband back", notches: [matchedNotch(waist, "b", 0.9), matchedNotch(bandSide, "b", 0.5), matchedNotch(zipper, "b", 1)],
      grainline: { topEdge: "top", topT: 0.5, bottomEdge: "seam", bottomT: 0.5 } },
  ];
}

export function wrapSkirtPoms(options: GarmentOptions = {}): readonly Pom[] {
  const settings = wrapSkirtOptions(options);
  return [
    { label: "Front waist width including digital overlap", measure: (b) =>
      edgeLength(pieceEdge(rolePiece(b, "front"), "waist"))
        + edgeLength(pieceEdge(rolePiece(b, "frontUnderlap"), "waist")) },
    { label: "Back waist width (modeled digital)", measure: (b) => 2 * edgeLength(pieceEdge(rolePiece(b, "back"), "waist")) },
    { label: "Front hip width including digital overlap", measure: (b) =>
      spanX(rolePiece(b, "front"), { edge: "sideLower", at: "start" }, { edge: "centerFront", at: "start" })
        + spanX(rolePiece(b, "frontUnderlap"), { edge: "sideLower", at: "start" }, { edge: "centerFront", at: "start" }) },
    { label: "Front overlap (software setting)", measure: () => settings.frontOverlapCm },
    { label: "Overlap facing width (software setting)", measure: () => settings.overlapFacingWidthCm },
    { label: "Total modeled skirt length (digital)", measure: (b) =>
      spanY(rolePiece(b, "front"), { edge: "centerFront", at: "start" }, { edge: "centerFront", at: "end" }) },
  ];
}

export function wrapSkirtChecks(b: Block): CheckResult[] {
  return (["front", "frontUnderlap"] as const).flatMap((role) => {
    const panel = rolePiece(b, role);
    const hem = pieceEdge(panel, "hem");
    const waist = pieceEdge(panel, "waist");
    const centerFront = pieceEdge(panel, "centerFront");
    return [
      squareCorner(`${panel.name} hem square to open center front`, edgeStart(hem), edgeEnd(hem), edgeEnd(centerFront)),
      squareCorner(`${panel.name} waist square to open center front`, edgeEnd(waist), edgeStart(waist), edgeStart(centerFront)),
    ];
  });
}

export function wrapSkirtTopology(b: Block): boolean {
  return Object.prototype.hasOwnProperty.call(b.roles, "frontUnderlap")
    && Object.prototype.hasOwnProperty.call(b.roles, "overlapFacing")
    && b.roles.front?.edges.some((edge) => edge.name === "centerFront") === true;
}

/** The skirt's stitches preserve the original panel side-seam check, attach
 *  separate front/back waistband pieces to their matching body panels, and
 *  describe the single side zipper path from the band through the upper body
 *  seam to the hip. */
const SKIRT_STITCHES: readonly Stitch[] = [
  {
    label: "Side seam (front ↔ back)",
    a: iface(edgeRef("front", "sideUpper"), edgeRef("front", "sideLower")),
    b: iface(edgeRef("back", "sideUpper"), edgeRef("back", "sideLower")),
  },
  {
    label: "Waistband (front + back ↔ matching bands)",
    // Walk center-front → side seam → center-back. Body edges are authored
    // center-to-side; band seams follow the outline side-to-fold, so reverse
    // the front band seam and retain the back seam for the same ordered path.
    a: iface(edgeRef("front", "waist"), edgeRef("back", "waist", true)),
    b: iface(edgeRef("waistbandFront", "seam", true), edgeRef("waistbandBack", "seam")),
  },
  {
    label: "Waistband side seam (front ↔ back)",
    a: iface(edgeRef("waistbandFront", "side")),
    b: iface(edgeRef("waistbandBack", "side")),
  },
  {
    label: "Side zipper path (waistband → hip)",
    // The zipper replaces one side seam from the band top to the body hip.
    // Its two tape sides have matching band + upper-body lengths.
    a: iface(edgeRef("waistbandFront", "side"), edgeRef("front", "sideUpper")),
    b: iface(edgeRef("waistbandBack", "side"), edgeRef("back", "sideUpper")),
  },
];

export function draftSkirt(m: Measurements, options: GarmentOptions = {}): Block {
  if (isWrapSkirtProfile(options)) {
    const problem = wrapSkirtProblem(m, options);
    if (problem) throw new RangeError(problem);
    return composeBlock(wrapSkirtGrammar(options), m, options);
  }
  if (isTieredSkirtProfile(options)) {
    const problem = tieredSkirtProblem(m, options);
    if (problem) throw new RangeError(problem);
    return composeBlock(tieredSkirtGrammar(options), m, options);
  }
  if (isBoxPleatedSkirtProfile(options)) {
    const problem = boxPleatGuideProblem(m, options);
    if (problem) throw new RangeError(problem);
    const block = composeBlock(SKIRT_GRAMMAR, m, options);
    const marks = boxPleatPanelMarks(m, options);
    return {
      ...block,
      roles: Object.fromEntries(Object.entries(block.roles).map(([role, piece]) => [role, {
        ...piece,
        ...(role === "front" || role === "back" ? { marks: [...(piece.marks ?? []), ...marks] } : {}),
      }])),
    };
  }
  if (isGatheredSkirtProfile(options)) {
    if (Object.prototype.hasOwnProperty.call(options, SKIRT_A_LINE_HEM_SWEEP_OPTION_ID)
        || Object.prototype.hasOwnProperty.call(options, SKIRT_PENCIL_HEM_TAPER_OPTION_ID)) {
      throw new Error("K03 gathered construction cannot combine with a hem sweep or taper profile");
    }
    return composeBlock(SKIRT_GATHERED_GRAMMAR, m, options);
  }
  return composeBlock(SKIRT_GRAMMAR, m, options);
}

/** Each band receives the exact seam length exposed by its matching panel.
 * This keeps the dependency in the grammar instead of re-deriving waist width. */
function skirtPanelParams(position: "front" | "back", options: GarmentOptions): SkirtPanelParams {
  const adjustment = skirtHemAdjustmentQuarterCm(options);
  if (adjustment > 0) return { position, silhouette: "flare", hemSweepQuarterCm: adjustment };
  if (adjustment < 0) return { position, silhouette: "taper", hemTaperQuarterCm: -adjustment };
  return { position, silhouette: "straight" };
}
export const SKIRT_GRAMMAR = garmentGrammar(
  "skirt",
  [
    componentNode("front", "skirt-panel", skirtPanel, (context) => skirtPanelParams("front", context.options)),
    componentNode("back", "skirt-panel", skirtPanel, (context) => skirtPanelParams("back", context.options)),
    componentNode(
      "waistband",
      "waistband",
      waistband,
      (context) => ({
        ...WAISTBAND_DEFAULT,
        frontSeamLength: context.interfaceLength("front", "waist"),
        backSeamLength: context.interfaceLength("back", "waist"),
      }),
      ["front", "back"],
    ),
  ],
  () => SKIRT_STITCHES,
);

// ── sewability checks (recipe-owned) ──────────────────────────────────────────

/** What's left once the side-seam stitch above is declared: the hem and waist
 *  each meeting the fold square — panel properties, not seams between two
 *  pieces, so `stitchChecks` can't express them. No sleeve is ever named. */
export function skirtPanelChecks(b: Block): CheckResult[] {
  if (wrapSkirtTopology(b)) return wrapSkirtChecks(b);
  const front = rolePiece(b, "front");
  const hem = pieceEdge(front, "hem");
  const waist = pieceEdge(front, "waist");
  const center = pieceEdge(front, "center");
  return [
    squareCorner("Hem square to the fold", edgeStart(hem), edgeEnd(hem), edgeEnd(center)),
    squareCorner("Waist square to the fold", edgeEnd(waist), edgeStart(waist), edgeStart(center)),
  ];
}

// ── guidance (recipe-owned) ───────────────────────────────────────────────────

/** Skirt-specific advice: the waist must be smaller than the hip, the hem must
 *  clear the hip line, and a sane ease. */
export function skirtGuidance(_b: Block, m: Measurements): Note[] {
  const notes: Note[] = [];
  if (m.waist >= m.hip) {
    notes.push({
      field: "waist",
      level: "warn",
      text: `Waist (${m.waist} cm) is not smaller than the hip (${m.hip} cm) — a skirt needs ` +
            `the hip to be the wider of the two.`,
    });
  }
  // The draft puts the hip point at hipDepth and the hem at length. If the hem is
  // not BELOW the hip, the side seam runs back upward and the panel folds over
  // itself. Unreachable while hip depth was a constant; reachable now it's a field.
  if (m.length <= m.hipDepth) {
    notes.push({
      field: "length",
      level: "warn",
      text: `Length (${m.length} cm) does not clear the hip depth (${m.hipDepth} cm) — the hem ` +
            `would sit at or above the fullest hip, so the side seam has nowhere to run. ` +
            `Lengthen the skirt or reduce the hip depth.`,
    });
  }
  if (m.ease < 2) {
    notes.push({ field: "ease", level: "warn", text: `Ease is ${m.ease} cm — below the 2 cm software check threshold. Increase the digital value to at least 2 cm; physical fit, comfort, and wear remain unvalidated.` });
  } else if (m.ease > 12) {
    notes.push({ field: "ease", level: "info", text: `Ease is ${m.ease} cm — above the 12 cm software review threshold. Adjust the digital value if this is not intended; physical fit, comfort, and wear remain unvalidated.` });
  } else {
    notes.push({ field: "ease", level: "ok", text: `Ease is ${m.ease} cm — inside the 2–12 cm software check range; physical fit, comfort, and wear remain unvalidated.` });
  }
  return notes;
}

// ── grade, POMs, notches (recipe tables) ──────────────────────────────────────

/** cm added per +1 size step. Declared, like the tee grade. */
export const SKIRT_GRADE: GradeRule = { waist: 4, hip: 4, length: 1.5 };

const FOLD: PointRef = { edge: "center", at: "start" }; // x = 0

export const SKIRT_POMS: readonly Pom[] = [
  {
    label: "Waist (finished)",
    tolerance: 1.0,
    measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "waist", at: "end" }, FOLD),
    anchor: (b) => edgeEnd(pieceEdge(rolePiece(b, "front"), "waist")),
    // Both quarter panels come from the same panel(m, position) source with
    // the same Measurements, so this is the exact counterpart edge point.
    backAnchor: (b) => edgeEnd(pieceEdge(rolePiece(b, "back"), "waist")),
  },
  {
    label: "Hip (finished)",
    tolerance: 1.3,
    measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "sideLower", at: "start" }, FOLD),
    anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "sideLower")),
    backAnchor: (b) => edgeStart(pieceEdge(rolePiece(b, "back"), "sideLower")),
  },
  {
    label: "Length (waist–hem)",
    tolerance: 1.3,
    measure: (b) => spanY(rolePiece(b, "front"), { edge: "waist", at: "start" }, { edge: "hem", at: "end" }),
  },
];

export const SKIRT_A_LINE_HEM_POM: Pom = {
  label: "Hem circumference (modeled)",
  measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "hem", at: "start" }, FOLD),
  anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "hem")),
  backAnchor: (b) => edgeStart(pieceEdge(rolePiece(b, "back"), "hem")),
};

export const SKIRT_PENCIL_HEM_POM: Pom = {
  label: "Hem circumference (modeled)",
  measure: (b) => 4 * spanX(rolePiece(b, "front"), { edge: "hem", at: "start" }, FOLD),
  anchor: (b) => edgeStart(pieceEdge(rolePiece(b, "front"), "hem")),
  backAnchor: (b) => edgeStart(pieceEdge(rolePiece(b, "back"), "hem")),
};
// Phase A3 (Slice 51): both balance notches read off SKIRT_STITCHES' own
// side-seam interface (index 1 = sideLower, the edge nearest the hem) instead
// of a second, separately-typed "sideLower" string.
// Waistband/body and zipper/body junction notches are read from their stitch
// interfaces so pattern marks stay aligned with the declared assembly paths.
const SIDE_SEAM = SKIRT_STITCHES[0];
const WAISTBAND_SEAM = SKIRT_STITCHES[1];
const SIDE_ZIPPER = SKIRT_STITCHES[3];

export const SKIRT_NOTCHES: readonly PieceNotches[] = [
  {
    pieceName: "front",
    notches: [
      matchedNotch(SIDE_SEAM, "a", 0.5, 1), // a balance notch at the side
      matchedNotch(WAISTBAND_SEAM, "a", 1.0, 0), // body side at the front waistband seam
      matchedNotch(SIDE_ZIPPER, "a", 0.0, 1), // zipper junction at the front waist
      matchedNotch(SIDE_ZIPPER, "a", 1.0, 1), // zipper endpoint at the front hip
    ],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "back",
    notches: [
      matchedNotch(SIDE_SEAM, "b", 0.5, 1),
      matchedNotch(SIDE_SEAM, "b", 0.75, 1), // 2 = back
      matchedNotch(WAISTBAND_SEAM, "a", 1.0, 1), // body side at the back waistband seam
      matchedNotch(SIDE_ZIPPER, "b", 0.0, 1), // zipper junction at the back waist
      matchedNotch(SIDE_ZIPPER, "b", 1.0, 1), // zipper endpoint at the back hip
    ],
    grainline: { topEdge: "waist", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
  },
  {
    pieceName: "waistbandFront",
    notches: [
      matchedNotch(WAISTBAND_SEAM, "b", 0.0, 0),
      matchedNotch(SIDE_ZIPPER, "a", 1.0, 0),
    ],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "seam", bottomT: 0.5 },
  },
  {
    pieceName: "waistbandBack",
    notches: [
      matchedNotch(WAISTBAND_SEAM, "b", 0.0, 1),
      matchedNotch(SIDE_ZIPPER, "b", 1.0, 0),
    ],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "seam", bottomT: 0.5 },
  },
];
