// Polo V1 shell (Slice 69): tee body/sleeve plus a real centre-front slit and
// two folded plackets. Collar and stand join this block in Slice 70.

import { distance, point } from "../geometry";
import { Block, block, rolePiece } from "./block";
import { bodice } from "./bodice";
import { Measurements } from "./measurements";
import { GarmentOption } from "./options";
import { Edge, Piece, edgeEnd, edgeLength, edgeStart, pieceEdge } from "./piece";
import { lineMark, pointMark } from "./pattern-mark";
import { sleeve as sleeveComponent } from "./sleeve";
import { edgeRef, iface, interfaceLength, markRef, stitchChecks, Stitch } from "./stitch";
import { sleevedTopStitches } from "./tshirt-checks";
import { AllowanceSpec } from "./allowance";
import { Note } from "../guidance/note";
import { sleevedTopGuidance } from "./tshirt-guidance";
import { Pom, seam, spanY } from "./pom";
import { PieceNotches } from "./tshirt-notches";
import { TSHIRT_NOTCHES } from "./tshirt-notches";
import type { ComponentResult } from "./component";
import { componentNode, composeBlock, garmentGrammar } from "./grammar";
import { buildPoloCollarGeometry, PoloCollarGeometry, PoloCollarIssueCode, PoloNecklineInputs, reversePoloEdge } from "./polo-collar";

export interface PoloOptions {
  readonly placketLength: number;
  readonly placketWidth: number;
  readonly standHeight: number;
  readonly collarLeafDepth: number;
  readonly standFrontRise: number;
  readonly collarPointExtension: number;
  readonly sideVentDepth: number;
  readonly backHemDrop: number;
}

export const POLO_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  { id: "placketLength", label: "Finished placket length", unit: "cm", group: "Front closure", help: "Sets the finished slit length; shorten it if the placket reaches the vent or hem allowance.", defaultValue: 14, min: 14, max: 30, step: 0.5 },
  { id: "placketWidth", label: "Finished placket width", unit: "cm", group: "Front closure", help: "Sets the finished folded placket face; keep it inside the declared 2–4 cm range.", defaultValue: 3, min: 2, max: 4, step: 0.5 },
  { id: "standHeight", label: "Finished stand height", unit: "cm", group: "Neck & collar", help: "Raises the collar stand above the neckline; reduce it if it exceeds the collar leaf.", defaultValue: 2, min: 1, max: 3, step: 0.5 },
  { id: "collarLeafDepth", label: "Finished pointed collar leaf", unit: "cm", group: "Neck & collar", help: "Sets the collar leaf depth from the stand; increase it when the point extension dominates.", defaultValue: 5, min: 4, max: 7, step: 0.5 },
  { id: "standFrontRise", label: "Stand front rise", unit: "cm", group: "Neck & collar", help: "Lifts the front stand toward the centre front; reduce it if the shaped seam reverses or cannot preserve length.", defaultValue: 0.75, min: 0, max: 2, step: 0.25 },
  { id: "collarPointExtension", label: "Collar point extension", unit: "cm", group: "Neck & collar", help: "Extends the collar point beyond the centre-front base; reduce it if the outline self-intersects.", defaultValue: 1.5, min: 0.5, max: 3, step: 0.25 },
  { id: "sideVentDepth", label: "Side vent depth", unit: "cm", group: "Hem & vents", help: "Opens the side seam from the hem; set to 0 cm to close the vent, or increase it when the sewn reserve is too short.", defaultValue: 6, min: 0, max: 15, step: 0.5 },
  { id: "backHemDrop", label: "Back hem drop", unit: "cm", group: "Hem & vents", help: "Extends only the back hem below the front; reduce it when it exceeds the vent depth or when vents are disabled.", defaultValue: 1.5, min: 0, max: 5, step: 0.5 },
];

export const DEFAULT_POLO_OPTIONS: PoloOptions = {
  placketLength: 14,
  placketWidth: 3,
  standHeight: 2,
  collarLeafDepth: 5,
  standFrontRise: 0.75,
  collarPointExtension: 1.5,
  sideVentDepth: 6,
  backHemDrop: 1.5,
};

/** Uses a supplied live value verbatim. Guardrails report bad values; they do
 * not silently turn a person’s chosen design back into a default. */
export function resolvePoloOptions(values: Partial<PoloOptions> = {}): PoloOptions {
  return {
    placketLength: finiteOr(values.placketLength, DEFAULT_POLO_OPTIONS.placketLength),
    placketWidth: finiteOr(values.placketWidth, DEFAULT_POLO_OPTIONS.placketWidth),
    standHeight: finiteOr(values.standHeight, DEFAULT_POLO_OPTIONS.standHeight),
    collarLeafDepth: finiteOr(values.collarLeafDepth, DEFAULT_POLO_OPTIONS.collarLeafDepth),
    standFrontRise: finiteOr(values.standFrontRise, DEFAULT_POLO_OPTIONS.standFrontRise),
    collarPointExtension: finiteOr(values.collarPointExtension, DEFAULT_POLO_OPTIONS.collarPointExtension),
    sideVentDepth: finiteOr(values.sideVentDepth, DEFAULT_POLO_OPTIONS.sideVentDepth),
    backHemDrop: finiteOr(values.backHemDrop, DEFAULT_POLO_OPTIONS.backHemDrop),
  };
}

function finiteOr(value: number | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

const BUTTON_CENTRES = [3.5, 7, 10.5] as const;
const PLACKET_SEAM_ALLOWANCE = 1;
const MIN_BUTTON_END_CLEARANCE = 3.5;

/** Polo's production allowances. Internal fold/attachment marks have no
 * allowance themselves: their surrounding sew-outline edges own it. */
export const POLO_ALLOWANCES: AllowanceSpec = {
  default: 1,
  byEdge: {
    centerFront: 0,
    centerBack: 0,
    hem: 2,
    attachmentRaw: 1,
    outerRaw: 1,
    neckline: 1,
    collar: 1,
    backNeckline: 1,
    frontNeckline: 1,
    backCollar: 1,
    frontCollar: 1,
    backCollarBase: 1,
    frontCollarBase: 1,
    vent: 1,
    frontEnd: 1,
    frontTip: 1,
    outer: 1,
  },
};

/** A 3 cm finished placket is a 3 cm outer face plus a 3 cm inner facing,
 * with 1 cm attachment and turn-under allowances. Its fold/attachment lines
 * are construction marks, not invented exterior seams. */
function placketPiece(
  role: "buttonPlacket" | "buttonholePlacket", options: PoloOptions
): Piece {
  const cutWidth = options.placketWidth * 2 + PLACKET_SEAM_ALLOWANCE * 2;
  const faceStart = PLACKET_SEAM_ALLOWANCE;
  const foldX = faceStart + options.placketWidth;
  const turnX = foldX + options.placketWidth;
  const markKind = role === "buttonPlacket" ? "button" : "buttonhole";
  return {
    name: role === "buttonPlacket" ? "button placket" : "buttonhole placket",
    onFold: false,
    edges: [
      { kind: "line", name: "top", start: point(0, 0), end: point(cutWidth, 0) },
      { kind: "line", name: "outerRaw", start: point(cutWidth, 0), end: point(cutWidth, options.placketLength) },
      { kind: "line", name: "bottom", start: point(cutWidth, options.placketLength), end: point(0, options.placketLength) },
      { kind: "line", name: "attachmentRaw", start: point(0, options.placketLength), end: point(0, 0) },
    ],
    marks: [
      lineMark("placementLine", "attachmentLine", point(faceStart, 0), point(faceStart, options.placketLength), "SEW TO FRONT SLIT", "instruction"),
      lineMark("foldLine", "placketFold", point(foldX, 0), point(foldX, options.placketLength), "FOLD", "instruction"),
      lineMark("foldLine", "turnUnder", point(turnX, 0), point(turnX, options.placketLength), "TURN UNDER", "instruction"),
      ...BUTTON_CENTRES.map((y, index) => pointMark(
        markKind, `${markKind}-${index + 1}`, point(faceStart + options.placketWidth / 2, y),
        markKind === "button" ? "BUTTON" : "BUTTONHOLE"
      )),
    ],
  };
}

/** Keep the Polo's lower-body topology local to the recipe. The woven shirt
 * has its own curved-hem/vent contract; changing that shared-looking helper
 * would silently alter its export bytes. With zero vent and zero drop this
 * returns the original bodice object and therefore the original uninterrupted
 * side/hem topology. */
function poloBodyPiece(m: Measurements, position: "front" | "back", options: PoloOptions): Piece {
  const drafted = bodice(m, { position }).pieces[position];
  const backDrop = position === "back" ? options.backHemDrop : 0;
  if (options.sideVentDepth === 0 && backDrop === 0) return drafted;

  const side = pieceEdge(drafted, "side");
  const hem = pieceEdge(drafted, "hem");
  const center = pieceEdge(drafted, position === "front" ? "centerFront" : "centerBack");
  const sideHem = point(edgeStart(hem).x, edgeStart(hem).y + backDrop);
  const centerHem = point(edgeEnd(hem).x, edgeEnd(hem).y + backDrop);
  const ventTop = point(edgeEnd(side).x, edgeEnd(side).y - options.sideVentDepth);
  const ventEnabled = options.sideVentDepth !== 0;
  const edges = drafted.edges.flatMap((edge): Edge[] => {
    if (edge.name === "side") {
      const sewnSide: Edge = { kind: "line", name: "side", start: edgeStart(edge), end: ventEnabled ? ventTop : sideHem };
      return ventEnabled ? [sewnSide, { kind: "line", name: "vent", start: ventTop, end: sideHem }] : [sewnSide];
    }
    if (edge.name === "hem") {
      return [{ kind: "line", name: "hem", start: sideHem, end: centerHem }];
    }
    if (edge.name === center.name) {
      return [{ kind: "line", name: edge.name, start: centerHem, end: edgeEnd(edge) }];
    }
    return [edge];
  });
  return {
    ...drafted,
    edges,
    marks: ventEnabled
      ? [...(drafted.marks ?? []), pointMark("placementPoint", "ventTop", ventTop, "VENT TOP")]
      : drafted.marks,
  };
}

function poloFront(m: Measurements, options: PoloOptions): Piece {
  const drafted = poloBodyPiece(m, "front", options);
  const neckline = pieceEdge(drafted, "neckline");
  const slitStart = edgeStart(neckline);
  const slitEnd = point(slitStart.x, slitStart.y + options.placketLength);
  const clipSpan = PLACKET_SEAM_ALLOWANCE;
  const clipUpper = point(slitEnd.x + clipSpan, slitEnd.y - clipSpan);
  const clipLower = point(slitEnd.x + clipSpan, slitEnd.y + clipSpan);
  return {
    ...drafted,
    marks: [
      ...(drafted.marks ?? []),
      pointMark("placementPoint", "centerFront", edgeStart(neckline), "CENTER FRONT"),
      pointMark("placementPoint", "shoulder", edgeEnd(neckline), "SHOULDER"),
      lineMark("cutLine", "placketOpening", slitStart, slitEnd, "CUT FRONT SLIT", "instruction"),
      lineMark("cutLine", "placketBaseClipLeft", slitEnd, clipUpper, "CLIP PLACKET BASE LEFT", "instruction"),
      lineMark("cutLine", "placketBaseClipRight", slitEnd, clipLower, "CLIP PLACKET BASE RIGHT", "instruction"),
      lineMark("placementLine", "placketBaseReinforcement", clipUpper, clipLower, "REINFORCE PLACKET BASE BOX", "instruction"),
    ],
  };
}

function poloBack(m: Measurements, options: PoloOptions): Piece {
  const drafted = poloBodyPiece(m, "back", options);
  const neckline = pieceEdge(drafted, "neckline");
  return {
    ...drafted,
    marks: [
      ...(drafted.marks ?? []),
      pointMark("placementPoint", "centerBack", edgeStart(neckline), "CENTER BACK"),
      pointMark("placementPoint", "shoulder", edgeEnd(neckline), "SHOULDER"),
    ],
  };
}

export const POLO_SHELL_STITCHES = (): readonly Stitch[] => [
  ...sleevedTopStitches(["side"], false),
  {
    label: "Button placket ↔ left front slit",
    a: iface(markRef("front", "placketOpening", "left")),
    b: iface(markRef("buttonPlacket", "attachmentLine", "left")),
  },
  {
    label: "Buttonhole placket ↔ right front slit",
    a: iface(markRef("front", "placketOpening", "right")),
    b: iface(markRef("buttonholePlacket", "attachmentLine", "right")),
  },
];

/** Drafts only components resolved for Slice 69. `options` remains in the
 * signature so Slice 70 can add collar/stand without changing this contract. */
export function draftPoloShell(m: Measurements, rawOptions: Partial<PoloOptions> = {}): Block {
  const options = resolvePoloOptions(rawOptions);
  const front = poloFront(m, options);
  const back = poloBack(m, options);
  const armhole = edgeLength(pieceEdge(front, "armhole")) + edgeLength(pieceEdge(back, "armhole"));
  const sleeve = sleeveComponent(m, { targetArmhole: armhole }).pieces.sleeve;
  return block({
    front,
    back,
    sleeve,
    buttonPlacket: placketPiece("buttonPlacket", options),
    buttonholePlacket: placketPiece("buttonholePlacket", options),
  }, POLO_SHELL_STITCHES());
}

function namedEdge(edge: Edge, name: string): Edge {
  return { ...edge, name };
}

function collarLandmarkMarks(geometry: PoloCollarGeometry, path: "lowerStand" | "collarBase"): readonly ReturnType<typeof pointMark>[] {
  const labels = { centerBack: "CENTER BACK", shoulder: "SHOULDER", centerFront: "CENTER FRONT" } as const;
  return geometry[path].landmarks.map((landmark) =>
    pointMark("placementPoint", landmark.name, landmark.point, labels[landmark.name]));
}

/** One shaped stand half, cut on the centre-back fold. The lower seam is the
 * actual body neckline; its two measured segments are reversed at the end of
 * the outline so the piece remains a closed physical pattern. */
function standPiece(name: string, geometry: PoloCollarGeometry): Piece {
  const lower = geometry.lowerStand;
  const upper = geometry.upperStand;
  const lowerCenterBack = lower.landmarks[0].point;
  const lowerCenterFront = lower.landmarks[2].point;
  const upperCenterBack = upper.landmarks[0].point;
  const upperCenterFront = upper.landmarks[2].point;
  const upperBack = namedEdge(upper.segments[0], "backCollar");
  const upperFront = namedEdge(upper.segments[1], "frontCollar");
  const lowerFront = reversePoloEdge(lower.segments[1], "frontNeckline");
  const lowerBack = reversePoloEdge(lower.segments[0], "backNeckline");
  return {
    name,
    onFold: true,
    edges: [
      { kind: "line", name: "centerBack", start: lowerCenterBack, end: upperCenterBack },
      upperBack,
      upperFront,
      { kind: "line", name: "frontEnd", start: upperCenterFront, end: lowerCenterFront },
      lowerFront,
      lowerBack,
    ],
    marks: [
      lineMark("placementLine", "centerMatch", lowerCenterBack, upperCenterBack, "PLACE ON FOLD", "instruction"),
      ...collarLandmarkMarks(geometry, "lowerStand"),
    ],
  };
}

/** One shaped pointed collar leaf, also cut on the centre-back fold. The
 * measured upper stand seam is copied as the collar base; only its outer
 * edges use the leaf-depth and point-extension options. */
function collarPiece(name: string, geometry: PoloCollarGeometry): Piece {
  const base = geometry.collarBase;
  return {
    name,
    onFold: true,
    edges: [
      namedEdge(geometry.collar.centerBack, "centerBack"),
      namedEdge(base.segments[0], "backCollarBase"),
      namedEdge(base.segments[1], "frontCollarBase"),
      namedEdge(geometry.collar.frontTip, "frontTip"),
      namedEdge(geometry.collar.outer, "outer"),
    ],
    marks: [
      lineMark("placementLine", "centerMatch", edgeEnd(geometry.collar.centerBack), edgeStart(geometry.collar.centerBack), "PLACE ON FOLD", "instruction"),
      ...collarLandmarkMarks(geometry, "collarBase"),
    ],
  };
}

function poloCollarStitches(): readonly Stitch[] {
  return [
    {
      label: "Outer stand ↔ polo neckline",
      a: iface(edgeRef("outerStand", "frontNeckline"), edgeRef("outerStand", "backNeckline")),
      b: iface(edgeRef("front", "neckline"), edgeRef("back", "neckline")),
    },
    {
      label: "Under collar ↔ outer stand",
      a: iface(edgeRef("underCollar", "backCollarBase"), edgeRef("underCollar", "frontCollarBase")),
      b: iface(edgeRef("outerStand", "backCollar"), edgeRef("outerStand", "frontCollar")),
    },
    {
      label: "Upper collar ↔ inner stand",
      a: iface(edgeRef("upperCollar", "backCollarBase"), edgeRef("upperCollar", "frontCollarBase")),
      b: iface(edgeRef("innerStand", "backCollar"), edgeRef("innerStand", "frontCollar")),
    },
    {
      label: "Collar outer seam (upper ↔ under)",
      a: iface(edgeRef("upperCollar", "frontTip"), edgeRef("upperCollar", "outer")),
      b: iface(edgeRef("underCollar", "frontTip"), edgeRef("underCollar", "outer")),
    },
  ];
}

const poloFrontComponent = (m: Measurements, options: PoloOptions): ComponentResult => {
  const front = poloFront(m, options);
  return {
    pieces: { front },
    stitches: [],
    interfaces: {
      armhole: iface(edgeRef("front", "armhole")),
      neckline: iface(edgeRef("front", "neckline")),
      placketOpeningLeft: iface(markRef("front", "placketOpening", "left")),
      placketOpeningRight: iface(markRef("front", "placketOpening", "right")),
    },
  };
};

const poloBackComponent = (m: Measurements, options: PoloOptions): ComponentResult => {
  const piece = poloBack(m, options);
  return {
    pieces: { back: piece },
    stitches: [],
    interfaces: {
      armhole: iface(edgeRef("back", "armhole")),
      neckline: iface(edgeRef("back", "neckline")),
    },
  };
};

const poloPlacketsComponent = (_m: Measurements, options: PoloOptions): ComponentResult => ({
  pieces: {
    buttonPlacket: placketPiece("buttonPlacket", options),
    buttonholePlacket: placketPiece("buttonholePlacket", options),
  },
  stitches: [],
  interfaces: {
    button: iface(edgeRef("buttonPlacket", "attachmentRaw")),
    buttonhole: iface(edgeRef("buttonholePlacket", "attachmentRaw")),
  },
});

const poloCollarComponent = (
  _m: Measurements,
  params: { readonly options: PoloOptions; readonly neckline: PoloNecklineInputs },
): ComponentResult => {
  const result = buildPoloCollarGeometry(params.neckline, params.options);
  if (!result.geometry) {
    throw new Error(result.issues.map((entry) => entry.text).join(" "));
  }
  const geometry = result.geometry;
  return {
    pieces: {
      outerStand: standPiece("outer collar stand", geometry),
      innerStand: standPiece("inner collar stand", geometry),
      upperCollar: collarPiece("upper pointed collar", geometry),
      underCollar: collarPiece("under pointed collar", geometry),
    },
    stitches: [],
    interfaces: {
      neckline: iface(
        edgeRef("outerStand", "frontNeckline"),
        edgeRef("outerStand", "backNeckline"),
      ),
      collar: iface(
        edgeRef("underCollar", "backCollarBase"),
        edgeRef("underCollar", "frontCollarBase"),
      ),
    },
  };
};

/** The complete Polo grammar keeps the existing role order while making the
 * sleeve and collar lengths depend on the actual preceding interfaces. The
 * public draft function below remains the only recipe-facing seam. */
export const POLO_GRAMMAR = garmentGrammar(
  "polo",
  [
    componentNode("front", "polo-front", poloFrontComponent, (context) => resolvePoloOptions(context.options)),
    componentNode("back", "bodice", poloBackComponent, (context) => resolvePoloOptions(context.options)),
    componentNode(
      "sleeve",
      "sleeve",
      sleeveComponent,
      (context) => ({
        targetArmhole:
          context.interfaceLength("front", "armhole") +
          context.interfaceLength("back", "armhole"),
      }),
      ["front", "back"],
    ),
    componentNode(
      "plackets",
      "placket",
      poloPlacketsComponent,
      (context) => resolvePoloOptions(context.options),
      ["front"],
    ),
    componentNode(
      "collar",
      "collar-stand",
      poloCollarComponent,
      (context) => ({
        options: resolvePoloOptions(context.options),
        neckline: {
          front: pieceEdge(context.block.roles.front, "neckline"),
          back: pieceEdge(context.block.roles.back, "neckline"),
        },
      }),
      ["front", "back"],
    ),
  ],
  () => [...POLO_SHELL_STITCHES(), ...poloCollarStitches()],
);

/** Completes the Slice 70 draft. Four layer pieces are emitted instead of a
 * metadata-only “cut two”, so nesting/export have actual physical quantities. */
export function draftPolo(m: Measurements, rawOptions: Partial<PoloOptions> = {}): Block {
  return composeBlock(POLO_GRAMMAR, m, rawOptions);
}

// Guidance must point to a visible, recoverable control. The pure collar
// solver uses a semantic source field such as "polo-collar" for geometry
// diagnostics, but the UI can only route option-* fields to a control row.
const POLO_COLLAR_ISSUE_FIELDS: Readonly<Record<PoloCollarIssueCode, string>> = {
  "non-finite-input": "option-standHeight",
  "empty-neckline": "option-standHeight",
  "negative-dimension": "option-standHeight",
  "stand-rise-exceeds-height": "option-standFrontRise",
  "front-rise-unsolved": "option-standFrontRise",
  "seam-reverses": "option-standFrontRise",
  "collar-point-dominates": "option-collarPointExtension",
  "collar-outline-self-intersects": "option-collarPointExtension",
  "non-finite-output": "option-standHeight",
};

/** Polo-specific warnings. Every value stays drafted exactly as supplied; a
 * warning names the correction rather than altering it behind the maker's back. */
export function poloGuidance(block: Block, m: Measurements, rawOptions: Partial<PoloOptions> = {}): Note[] {
  const options = resolvePoloOptions(rawOptions);
  const notes = [...sleevedTopGuidance(block, m)];
  for (const definition of POLO_OPTION_DEFINITIONS) {
    const value = options[definition.id as keyof PoloOptions];
    if (value < definition.min || value > definition.max) {
      notes.push({ field: `option-${definition.id}`, level: "warn", text: `${definition.label} (${value} cm) is outside the declared ${definition.min}–${definition.max} cm range — adjust it into that range.` });
    }
  }
  const minimumLength = BUTTON_CENTRES[BUTTON_CENTRES.length - 1] + MIN_BUTTON_END_CLEARANCE;
  if (options.placketLength < minimumLength) {
    notes.push({ field: "option-placketLength", level: "warn", text: `Placket (${options.placketLength} cm) is too short for the fixed button group — increase it to at least ${minimumLength} cm.` });
  }
  const frontNeckline = edgeStart(pieceEdge(block.roles.front, "neckline"));
  const frontVentTopY = edgeEnd(pieceEdge(block.roles.front, "side")).y;
  if (frontNeckline.y + options.placketLength > frontVentTopY - 2) {
    const target = Math.max(0, frontVentTopY - 2 - frontNeckline.y);
    const region = options.sideVentDepth === 0 ? "hem allowance" : "front vent region";
    notes.push({ field: "option-placketLength", level: "warn", text: `Placket reaches the ${region} — shorten it to ${target.toFixed(1)} cm or less.` });
  }
  if (options.standHeight > options.collarLeafDepth) {
    notes.push({ field: "option-standHeight", level: "warn", text: "Stand is deeper than the collar leaf — reduce stand height or increase collar leaf depth." });
  }
  const collarResult = buildPoloCollarGeometry({
    front: pieceEdge(block.roles.front, "neckline"),
    back: pieceEdge(block.roles.back, "neckline"),
  }, options);
  for (const issue of collarResult.issues) {
    notes.push({
      field: POLO_COLLAR_ISSUE_FIELDS[issue.code],
      level: "warn",
      text: issue.text,
    });
  }
  if (options.sideVentDepth === 0 && options.backHemDrop > 0) {
    notes.push({ field: "option-backHemDrop", level: "warn", text: "Back hem drop is positive while the vent is disabled — set back hem drop to 0 cm or enable a side vent." });
  }
  if (options.sideVentDepth > 0 && options.sideVentDepth < 3) {
    notes.push({ field: "option-sideVentDepth", level: "warn", text: "Side vent is too shallow to finish cleanly — increase it to at least 3 cm or set it to 0 cm." });
  }
  const maximumVentDepth = Math.max(0, m.length - (m.armholeDepth + 4));
  if (options.sideVentDepth > maximumVentDepth) {
    notes.push({ field: "option-sideVentDepth", level: "warn", text: `Side vent reaches the upper body — reduce it to ${maximumVentDepth.toFixed(1)} cm or less so ${m.armholeDepth + 4} cm remains sewn below the armhole.` });
  }
  if (options.sideVentDepth > 0 && options.backHemDrop > options.sideVentDepth) {
    notes.push({ field: "option-backHemDrop", level: "warn", text: `Back hem drop (${options.backHemDrop} cm) exceeds the side vent depth (${options.sideVentDepth} cm) — reduce the drop or increase the vent.` });
  }
  for (const [index, result] of stitchChecks(block, block.stitches).entries()) {
    if (!result.ok) {
      const stitch = block.stitches[index];
      const measuredA = interfaceLength(block, stitch.a);
      const measuredB = interfaceLength(block, stitch.b);
      const sideSeamField = options.sideVentDepth === 0 && options.backHemDrop > 0
        ? "option-backHemDrop"
        : "option-sideVentDepth";
      notes.push({ field: stitch.label === "Side seam (front ↔ back)" ? sideSeamField : "option-placketLength", level: "warn", text: `${stitch.label} measures ${measuredA.toFixed(1)} cm versus ${measuredB.toFixed(1)} cm — correct the named interface before sewing.` });
    }
  }
  return notes;
}

function markedPoint(block: Block, pieceRole: string, name: string): { readonly x: number; readonly y: number } {
  const mark = rolePiece(block, pieceRole).marks?.find((candidate) => candidate.name === name);
  if (!mark || !("at" in mark)) throw new Error(`Polo piece "${pieceRole}" has no point mark "${name}"`);
  return mark.at;
}

/** Polo keeps the tee's body/sleeve POMs and adds every new finished V2 fact. */
export const POLO_POMS: readonly Pom[] = [
  // Kept local rather than sharing the exported array by reference: a Polo
  // tech pack must remain self-contained if the tee later gains a tee-only POM.
  {
    label: "Finished placket length",
    tolerance: 0.3,
    measure: (block) => seam(rolePiece(block, "buttonPlacket"), "attachmentRaw"),
  },
  {
    label: "Finished placket width",
    tolerance: 0.2,
    measure: (block) => {
      const piece = rolePiece(block, "buttonPlacket");
      const attachment = piece.marks?.find((mark) => mark.name === "attachmentLine");
      const fold = piece.marks?.find((mark) => mark.name === "placketFold");
      if (!attachment || !fold || !("start" in attachment) || !("start" in fold)) {
        throw new Error("Polo placket construction marks are missing");
      }
      return distance(attachment.start, fold.start);
    },
  },
  {
    label: "Button spacing",
    tolerance: 0.15,
    measure: (block) => distance(
      markedPoint(block, "buttonPlacket", "button-1"),
      markedPoint(block, "buttonPlacket", "button-2")
    ),
  },
  {
    label: "Finished collar stand height",
    tolerance: 0.2,
    measure: (block) => seam(rolePiece(block, "outerStand"), "frontEnd"),
  },
  {
    label: "Finished pointed collar leaf",
    tolerance: 0.3,
    measure: (block) => seam(rolePiece(block, "upperCollar"), "centerBack"),
  },
  {
    label: "Stand front rise",
    tolerance: 0.2,
    measure: (block) => {
      const front = rolePiece(block, "front");
      const back = rolePiece(block, "back");
      const stand = rolePiece(block, "outerStand");
      return edgeStart(pieceEdge(front, "neckline")).y - edgeStart(pieceEdge(back, "neckline")).y -
        edgeStart(pieceEdge(stand, "frontNeckline")).y;
    },
  },
  {
    label: "Collar point extension",
    tolerance: 0.2,
    measure: (block) => {
      const tip = pieceEdge(rolePiece(block, "upperCollar"), "frontTip");
      return edgeEnd(tip).x - edgeStart(tip).x;
    },
  },
  {
    label: "Front side-vent depth",
    tolerance: 0.3,
    measure: (block) => {
      const vent = rolePiece(block, "front").edges.find((edge) => edge.name === "vent");
      return vent ? edgeLength(vent) : 0;
    },
  },
  {
    label: "Back side-vent depth",
    tolerance: 0.3,
    measure: (block) => {
      const vent = rolePiece(block, "back").edges.find((edge) => edge.name === "vent");
      return vent ? edgeLength(vent) : 0;
    },
  },
  {
    label: "Front body length (HPS–hem)",
    tolerance: 1.3,
    measure: (block) => spanY(rolePiece(block, "front"), { edge: "shoulder", at: "start" }, { edge: "hem", at: "start" }),
  },
  {
    label: "Back body length (HPS–hem)",
    tolerance: 1.3,
    measure: (block) => spanY(rolePiece(block, "back"), { edge: "shoulder", at: "start" }, { edge: "hem", at: "start" }),
  },
  {
    label: "Back hem drop",
    tolerance: 0.2,
    measure: (block) => edgeStart(pieceEdge(rolePiece(block, "back"), "hem")).y -
      edgeStart(pieceEdge(rolePiece(block, "front"), "hem")).y,
  },
];

/** Notches and grainlines for every Polo piece. Sleeve/body tables are reused
 * verbatim because those pieces are the current tee geometry, not lookalikes. */
export const POLO_NOTCHES: readonly PieceNotches[] = [
  ...TSHIRT_NOTCHES,
  {
    pieceName: "button placket",
    notches: [{ edgeName: "attachmentRaw", t: 0.5 }],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 },
  },
  {
    pieceName: "buttonhole placket",
    notches: [{ edgeName: "attachmentRaw", t: 0.5 }],
    grainline: { topEdge: "top", topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 },
  },
  ...["outer collar stand", "inner collar stand"].map((pieceName) => ({
    pieceName,
    notches: [
      { edgeName: "backCollar", t: 0 },
      { edgeName: "backCollar", t: 1 },
      { edgeName: "frontCollar", t: 1 },
    ],
    grainline: { topEdge: "backCollar", topT: 0.5, bottomEdge: "backNeckline", bottomT: 0.5 },
  })),
  ...["upper pointed collar", "under pointed collar"].map((pieceName) => ({
    pieceName,
    notches: [
      { edgeName: "backCollarBase", t: 0 },
      { edgeName: "backCollarBase", t: 1 },
      { edgeName: "frontCollarBase", t: 1 },
    ],
    grainline: { topEdge: "backCollarBase", topT: 0.5, bottomEdge: "outer", bottomT: 0.5 },
  })),
];
