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
import { Edge, Piece, pieceEdge, edgeStart, edgeEnd } from "./piece";
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
    notes.push({ field: "ease", level: "warn", text: `Ease is ${m.ease} cm — a skirt needs a little room to sit over the hip.` });
  } else if (m.ease > 12) {
    notes.push({ field: "ease", level: "info", text: `Ease is ${m.ease} cm — loose; the skirt will sit away from the body.` });
  } else {
    notes.push({ field: "ease", level: "ok", text: `Ease is ${m.ease} cm — comfortable for a skirt.` });
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
