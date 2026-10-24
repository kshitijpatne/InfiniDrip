// The drafting engine: measurements in, t-shirt block out.
//
// Coordinate convention (all cm): each piece has its own frame, x increases
// right, y increases down (matching SVG). FRONT and BACK are half-pieces cut on
// the fold — the fold is the left edge (x = 0). SLEEVE is a full, symmetric piece.
//
// Pieces are built by placing named construction points, then joining them with
// named straight or curved edges. Curve control points bend an edge toward
// themselves without touching — that is how necklines and armholes scoop.
//
// The sleeve cap is special: its length is fitted to the armhole length (plus a
// little ease) so the sleeve actually sews into the armhole — see draftSleeve.

import { Measurements, derive } from "./measurements";
import { NECKLINE_DEFAULT, NecklineParams, necklineEdge } from "./neckline";
import type { Note } from "../guidance/note";
import { Piece, edgeLength, pieceEdge } from "./piece";
import { Block } from "./block";
import { vNeckBodyPieces } from "./vneck-band-output";
import { sleevedTopStitches } from "./tshirt-checks";
import { bodice } from "./bodice";
import { sleeve as sleeveComponent } from "./sleeve";
import { componentNode, composeBlock, garmentGrammar } from "./grammar";
import type { Component } from "./component";
import type { GarmentOption, GarmentOptions } from "./options";

export type TeeConstruction = "set-in" | "raglan";

export const TEE_V_NECK_DROP_OPTION_ID = "teeVNeckDropCm";
export const TEE_SCOOP_NECK_DROP_OPTION_ID = "teeScoopNeckDropCm";

export function isTeeVNeckActive(options: GarmentOptions = {}): boolean {
  return Object.prototype.hasOwnProperty.call(options, TEE_V_NECK_DROP_OPTION_ID);
}

export function isTeeScoopNeckActive(options: GarmentOptions = {}): boolean {
  return Object.prototype.hasOwnProperty.call(options, TEE_SCOOP_NECK_DROP_OPTION_ID);
}

export function hasConflictingTeeNecklineOptions(options: GarmentOptions = {}): boolean {
  return isTeeVNeckActive(options) && isTeeScoopNeckActive(options);
}

export function hasTeeNecklineOverride(options: GarmentOptions = {}): boolean {
  return isTeeVNeckActive(options) || isTeeScoopNeckActive(options);
}

export function teeFrontNecklineParams(options: GarmentOptions = {}): NecklineParams {
  if (hasConflictingTeeNecklineOptions(options)) return NECKLINE_DEFAULT;
  if (isTeeVNeckActive(options)) {
    return {
      shape: "v",
      widthEase: 0,
      frontDrop: options[TEE_V_NECK_DROP_OPTION_ID]!,
    };
  }
  if (isTeeScoopNeckActive(options)) {
    return {
      shape: "scoop",
      widthEase: 0,
      frontDrop: options[TEE_SCOOP_NECK_DROP_OPTION_ID]!,
    };
  }
  return NECKLINE_DEFAULT;
}

function teeNecklineGuardrailNotes(
  m: Measurements,
  options: GarmentOptions,
  optionId: string,
  shapeLabel: "V" | "Scoop",
): Note[] {
  const derived = derive(m);
  const notes = necklineEdge("front", derived.neckWidthHalf, derived.frontNeckDepth,
    derived.shoulderHalf, m.armholeDepth, teeFrontNecklineParams(options)).notes;
  return [
    ...notes.filter((note) => note.field === "neckDrop").map((note) => ({
      ...note,
      field: "option-" + optionId,
      text: shapeLabel === "V"
        ? "The front V drops below the underarm; reduce the V drop or increase armhole depth."
        : "The front Scoop drops below the underarm; reduce its extra depth or increase armhole depth.",
    })),
    ...notes.filter((note) => note.field === "neckWidthEase").map((note) => ({
      ...note,
      field: "shoulderWidth",
      text: shapeLabel === "V"
        ? "The front V reaches the shoulder seam; review the shoulder width or neckline placement."
        : "The front Scoop reaches the shoulder seam; review shoulder width or neckline placement.",
    })),
  ];
}

export function teeVNeckNotes(m: Measurements, options: GarmentOptions = {}): Note[] {
  if (!isTeeVNeckActive(options) || hasConflictingTeeNecklineOptions(options)) return [];
  return teeNecklineGuardrailNotes(m, options, TEE_V_NECK_DROP_OPTION_ID, "V");
}

export function teeScoopNeckNotes(m: Measurements, options: GarmentOptions = {}): Note[] {
  if (!isTeeScoopNeckActive(options) || hasConflictingTeeNecklineOptions(options)) return [];
  return teeNecklineGuardrailNotes(m, options, TEE_SCOOP_NECK_DROP_OPTION_ID, "Scoop");
}

export function teeNecklineNotes(m: Measurements, options: GarmentOptions = {}): Note[] {
  if (hasConflictingTeeNecklineOptions(options)) {
    const message = "Both V and Scoop neckline options are active. Reset one option; while they conflict, the preview uses crew. Both entered values are preserved.";
    return [
      { field: "option-" + TEE_V_NECK_DROP_OPTION_ID, level: "warn", text: message },
      { field: "option-" + TEE_SCOOP_NECK_DROP_OPTION_ID, level: "warn", text: message },
    ];
  }
  return [
    ...teeVNeckNotes(m, options),
    ...teeScoopNeckNotes(m, options),
  ];
}
type TeeBodiceParams = {
  readonly position: "front" | "back";
  readonly chestEase?: number;
  readonly necklineParams?: NecklineParams;
};
const teeBodice: Component<TeeBodiceParams> = (m, params) => bodice(
  params.chestEase === undefined ? m : { ...m, ease: params.chestEase },
  { position: params.position, necklineParams: params.necklineParams },
);

/** Thin wrapper over the Bodice component (Phase B2, Slice 53) — kept so
 *  existing callers (armholeLength below, fitted.ts's draftBack reuse,
 *  tests) don't need to know a component exists underneath. */
export function draftFront(m: Measurements): Piece {
  return bodice(m, { position: "front" }).pieces.front;
}

export function draftBack(m: Measurements): Piece {
  return bodice(m, { position: "back" }).pieces.back;
}

/** Total armhole length (front + back) of a GENERIC tee bodice — a
 *  re-derivation, kept for callers with no real assembled bodice on hand
 *  (direct tests, the legacy draftSleeve wrapper below). Phase B3 (Slice
 *  54, §2.4): production drafting no longer goes through this — draftTshirt
 *  and draftFitted measure the armhole off the ACTUAL pieces they just
 *  assembled instead, so a future bodice whose armhole genuinely differs
 *  can no longer silently fit a sleeve to the wrong number. */
export function armholeLength(m: Measurements): number {
  return edgeLength(pieceEdge(draftFront(m), "armhole")) +
         edgeLength(pieceEdge(draftBack(m), "armhole"));
}

/** Thin wrapper over the Sleeve component (Phase B3, Slice 54), fit to the
 *  GENERIC tee armhole above — kept for direct callers/tests. Real recipes
 *  call the `sleeve` component directly with their own measured armhole. */
export function draftSleeve(m: Measurements): Piece {
  return sleeveComponent(m, { targetArmhole: armholeLength(m) }).pieces.sleeve;
}

/** The tee composition is the smallest real grammar: two bodice instances
 * feed the sleeve's target from their exposed armhole interfaces. Keeping the
 * resolver here makes the dependency visible without changing the public
 * `draftTshirt(m): Block` seam. */
export const TEE_GRAMMAR = garmentGrammar(
  "tee",
  [
    componentNode("front", "bodice", teeBodice, (context) => ({
      position: "front" as const,
      ...(context.options.chestEase === undefined ? {} : { chestEase: context.options.chestEase }),
      ...(hasTeeNecklineOverride(context.options)
        ? { necklineParams: teeFrontNecklineParams(context.options) }
        : {}),
    })),
    componentNode("back", "bodice", teeBodice, (context) => ({
      position: "back" as const,
      ...(context.options.chestEase === undefined ? {} : { chestEase: context.options.chestEase }),
    })),
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
  ],
  () => sleevedTopStitches(["side"], false),
);

/** Draft a complete t-shirt block from one set of measurements. */
export function draftTshirt(m: Measurements, options: GarmentOptions = {}): Block {
  return composeBlock(TEE_GRAMMAR, m, options);
}

/** Tee neckband controls are draft recommendations, not fit or recovery claims. */
export const TEE_NECKBAND_OPTIONS: readonly GarmentOption[] = [
  {
    id: "teeNeckbandLengthPercent",
    label: "Neckband length",
    unit: "%",
    group: "Neckband",
    defaultValue: 75,
    min: 75,
    max: 90,
    step: 1,
    help: "Provisional drafting ratio. Start at 75% for rib knit; adjust for the selected fabric. Recovery and physical fit have not been validated.",
  },
  {
    id: "teeNeckbandFinishedWidthCm",
    label: "Finished neckband width",
    unit: "cm",
    group: "Neckband",
    defaultValue: 2,
    min: 1.5,
    max: 3,
    step: 0.1,
    help: "Provisional design setting measured from fold to join seam after sewing. Editable; not a comfort or fit claim.",
  },
];

/** Use frozen selected-size settings when present; otherwise use the live Tee controls. */
export function teeNeckbandSettings(
  plannedSize: { readonly options?: GarmentOptions | null } | null | undefined,
  currentOptions: GarmentOptions,
): { readonly lengthPercent: number; readonly finishedWidthCm: number } {
  const plannedOptions = plannedSize?.options;
  return {
    lengthPercent: plannedOptions?.teeNeckbandLengthPercent ?? currentOptions.teeNeckbandLengthPercent,
    finishedWidthCm: plannedOptions?.teeNeckbandFinishedWidthCm ?? currentOptions.teeNeckbandFinishedWidthCm,
  };
}

/**
 * Build a separate, true-scale Tee neckband SVG from the live neckline edges.
 * Body half pieces are doubled; an off-fold sleeve neckline edge is present
 * twice, once for each sleeve. Set-in output retains its existing bytes.
 */
export function teeNeckbandTemplateSvg(
  pieces: readonly Piece[],
  lengthPercent: number,
  finishedWidthCm: number,
): string {
  const percentageOption = TEE_NECKBAND_OPTIONS[0]!;
  const widthOption = TEE_NECKBAND_OPTIONS[1]!;
  if (!Number.isFinite(lengthPercent) || lengthPercent < percentageOption.min || lengthPercent > percentageOption.max) {
    throw new Error(`Neckband length must be ${percentageOption.min}–${percentageOption.max}% of the drafted neckline.`);
  }
  if (!Number.isFinite(finishedWidthCm) || finishedWidthCm < widthOption.min || finishedWidthCm > widthOption.max) {
    throw new Error(`Finished neckband width must be ${widthOption.min}–${widthOption.max} cm.`);
  }

  const front = pieces.find((piece) => piece.name.trim().toLowerCase() === "front");
  const back = pieces.find((piece) => piece.name.trim().toLowerCase() === "back");
  if (!front || !back) throw new Error("The selected Tee pattern must include front and back pieces.");
  const sleeve = pieces.find((piece) => piece.name.trim().toLowerCase() === "sleeve");

  const frontNecklineCm = edgeLength(pieceEdge(front, "neckline"));
  const backNecklineCm = edgeLength(pieceEdge(back, "neckline"));
  const sleeveNecklineEdge = sleeve?.edges.find((edge) => edge.name === "neckline");
  const sleeveNecklineCm = sleeveNecklineEdge ? edgeLength(sleeveNecklineEdge) : 0;
  if (!Number.isFinite(frontNecklineCm) || frontNecklineCm <= 0 ||
      !Number.isFinite(backNecklineCm) || backNecklineCm <= 0) {
    throw new Error("The selected Tee neckline geometry is not usable for a neckband template.");
  }

  const necklineCircumferenceCm = 2 * (frontNecklineCm + backNecklineCm + sleeveNecklineCm);
  const loopSeamlineCm = necklineCircumferenceCm * lengthPercent / 100;
  const endSeamAllowanceCm = 1;
  const necklineSeamAllowanceCm = 0.6;
  const cutLengthCm = loopSeamlineCm + 2 * endSeamAllowanceCm;
  const cutWidthCm = 2 * (finishedWidthCm + necklineSeamAllowanceCm);
  const marginCm = 1;
  const topSpaceCm = 2;
  const bottomSpaceCm = 2.4;
  const sheetWidthCm = cutLengthCm + marginCm * 2;
  const sheetHeightCm = topSpaceCm + cutWidthCm + bottomSpaceCm;
  const x = marginCm;
  const y = topSpaceCm;
  const format = (value: number): string => Number(value.toFixed(3)).toString();
  const dimension = (value: number): string => value.toFixed(1);
  const loopStartX = x + endSeamAllowanceCm;
  const loopEndX = loopStartX + loopSeamlineCm;
  const raglanJoinPositions = sleeveNecklineEdge ? [
    { name: "back-raglan-1", distanceCm: backNecklineCm },
    { name: "front-raglan-1", distanceCm: backNecklineCm + sleeveNecklineCm },
    { name: "center-front", distanceCm: backNecklineCm + sleeveNecklineCm + frontNecklineCm },
    { name: "front-raglan-2", distanceCm: backNecklineCm + sleeveNecklineCm + 2 * frontNecklineCm },
    { name: "back-raglan-2", distanceCm: backNecklineCm + sleeveNecklineCm + 2 * frontNecklineCm + sleeveNecklineCm },
  ] : [];
  const raglanNotches = raglanJoinPositions.map(({ name, distanceCm }) => {
    const offsetCm = distanceCm * lengthPercent / 100;
    const notchX = loopStartX + offsetCm;
    const notchHalfWidth = 0.12;
    const notchDepth = 0.28;
    return `<path data-neckband-match="${name}" data-neckband-offset-cm="${format(offsetCm)}" d="M ${format(notchX - notchHalfWidth)} ${format(y)} ` +
      `L ${format(notchX)} ${format(y + notchDepth)} L ${format(notchX + notchHalfWidth)} ${format(y)} ` +
      `M ${format(notchX - notchHalfWidth)} ${format(y + cutWidthCm)} ` +
      `L ${format(notchX)} ${format(y + cutWidthCm - notchDepth)} ` +
      `L ${format(notchX + notchHalfWidth)} ${format(y + cutWidthCm)}"/>`;
  }).join("");
  const quarterNotches = [0.25, 0.5, 0.75].map((fraction) => {
    const notchX = x + endSeamAllowanceCm + loopSeamlineCm * fraction;
    const notchHalfWidth = 0.12;
    const notchDepth = 0.28;
    return `<path data-quarter-notch="${fraction}" d="M ${format(notchX - notchHalfWidth)} ${format(y)} ` +
      `L ${format(notchX)} ${format(y + notchDepth)} L ${format(notchX + notchHalfWidth)} ${format(y)} ` +
      `M ${format(notchX - notchHalfWidth)} ${format(y + cutWidthCm)} ` +
      `L ${format(notchX)} ${format(y + cutWidthCm - notchDepth)} ` +
      `L ${format(notchX + notchHalfWidth)} ${format(y + cutWidthCm)}"/>`;
  }).join("");
  const scaleY = y + cutWidthCm + 1.72;
  const stretchY = y + cutWidthCm + 0.48;
  const necklineJoinY1 = y + necklineSeamAllowanceCm;
  const necklineJoinY2 = y + cutWidthCm - necklineSeamAllowanceCm;
  const registrationNotches = sleeveNecklineEdge ? raglanNotches : quarterNotches;
  const endSeamLandmark = sleeveNecklineEdge ? " data-neckband-anchor=\"center-back\"" : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" ` +
    `width="${format(sheetWidthCm)}cm" height="${format(sheetHeightCm)}cm" ` +
    `viewBox="0 0 ${format(sheetWidthCm)} ${format(sheetHeightCm)}" ` +
    `data-neckline-circumference-cm="${format(necklineCircumferenceCm)}" ` +
    `data-loop-seamline-cm="${format(loopSeamlineCm)}" ` +
    `data-cut-length-cm="${format(cutLengthCm)}" data-cut-width-cm="${format(cutWidthCm)}">` +
    `<title>${sleeveNecklineEdge ? "Raglan Tee" : "Tee"} neckband provisional cutting template</title>` +
    `<desc>True-scale pattern rectangle calculated from the selected Tee front and back neckline curves` +
    `${sleeveNecklineEdge ? " and both sleeve neckline edges. The band short ends meet at center back; marks follow the measured center-front and four raglan join positions" : ""}. ` +
    `Print at 100 percent and verify the ten centimetre calibration line. Physical fit and fabric recovery are unvalidated.</desc>` +
    `<g fill="none" stroke="#111" stroke-width="0.035">` +
    `<rect data-cut-outline="true" x="${format(x)}" y="${format(y)}" ` +
    `width="${format(cutLengthCm)}" height="${format(cutWidthCm)}"/>` +
    `<line data-neckline-seamline="true" x1="${format(x)}" y1="${format(necklineJoinY1)}" ` +
    `x2="${format(x + cutLengthCm)}" y2="${format(necklineJoinY1)}" stroke-dasharray="0.16 0.1"/>` +
    `<line data-neckline-seamline="true" x1="${format(x)}" y1="${format(necklineJoinY2)}" ` +
    `x2="${format(x + cutLengthCm)}" y2="${format(necklineJoinY2)}" stroke-dasharray="0.16 0.1"/>` +
    `<line data-end-seamline="true"${endSeamLandmark} x1="${format(loopStartX)}" y1="${format(y)}" ` +
    `x2="${format(loopStartX)}" y2="${format(y + cutWidthCm)}" stroke-dasharray="0.06 0.08"/>` +
    `<line data-end-seamline="true"${endSeamLandmark} x1="${format(loopEndX)}" y1="${format(y)}" ` +
    `x2="${format(loopEndX)}" y2="${format(y + cutWidthCm)}" stroke-dasharray="0.06 0.08"/>` +
    `<line data-fold-line="true" x1="${format(x)}" y1="${format(y + cutWidthCm / 2)}" ` +
    `x2="${format(x + cutLengthCm)}" y2="${format(y + cutWidthCm / 2)}" stroke-dasharray="0.28 0.12 0.06 0.12"/>` +
    registrationNotches +
    `<line data-stretch-direction="lengthwise" x1="${format(x)}" y1="${format(stretchY)}" ` +
    `x2="${format(x + 2.5)}" y2="${format(stretchY)}" marker-end="url(#neckband-arrow)"/>` +
    `<line data-calibration-length-cm="10" x1="${format(x)}" y1="${format(scaleY)}" ` +
    `x2="${format(x + 10)}" y2="${format(scaleY)}"/>` +
    `<line x1="${format(x)}" y1="${format(scaleY - 0.12)}" x2="${format(x)}" y2="${format(scaleY + 0.12)}"/>` +
    `<line x1="${format(x + 10)}" y1="${format(scaleY - 0.12)}" x2="${format(x + 10)}" y2="${format(scaleY + 0.12)}"/>` +
    `</g><defs><marker id="neckband-arrow" markerWidth="0.18" markerHeight="0.18" ` +
    `refX="0.16" refY="0.09" orient="auto" markerUnits="userSpaceOnUse">` +
    `<path d="M 0 0 L 0.18 0.09 L 0 0.18 z" fill="#111"/></marker></defs>` +
    `<g fill="#111" font-family="Arial, sans-serif">` +
    `<text x="${format(x)}" y="0.62" font-size="0.3">${sleeveNecklineEdge ? "RAGLAN TEE" : "TEE"} NECKBAND — PROVISIONAL TEMPLATE · SELECTED SIZE</text>` +
    `<text x="${format(x)}" y="1.15" font-size="0.22">Neckline ${dimension(necklineCircumferenceCm)} cm · loop ${dimension(loopSeamlineCm)} cm at ${dimension(lengthPercent)}% · cut ${dimension(cutLengthCm)} × ${dimension(cutWidthCm)} cm</text>` +
    `<text x="${format(x)}" y="1.63" font-size="0.22">CUT 1 RIB · FOLD ON DASH-DOT LINE</text>` +
    `<text x="${format(x + 2.8)}" y="${format(stretchY + 0.08)}" font-size="0.22">PLACE MAXIMUM STRETCH ALONG LENGTH</text>` +
    `<text x="${format(x + 10.2)}" y="${format(scaleY + 0.08)}" font-size="0.22">10 cm scale check — print at 100%</text>` +
    `<text x="${format(x)}" y="${format(scaleY + 0.43)}" font-size="0.22">0.6 cm seam allowance · both long edges · 1 cm ends · ${sleeveNecklineEdge ? "center-back end seam; center-front and matched raglan join notches" : "quarter notches"} · fit/recovery not validated</text>` +
    `</g></svg>`;
}

/**
 * Build the selected-size Fitted Scoop rectangle by adapting the shared Tee
 * resolver to the Fitted front-piece name. The underlying Tee output remains
 * byte-identical for its established callers.
 */
export function fittedScoopNeckbandTemplateSvg(
  pieces: readonly Piece[],
  lengthPercent: number,
  finishedWidthCm: number,
): string {
  const fittedFront = pieces.find((piece) => piece.name.trim().toLowerCase() === "fitted front");
  if (!fittedFront) throw new Error("The selected Fitted Scoop Tee pattern must include a fitted front piece.");
  const teeNamedPieces = pieces.map((piece) => piece === fittedFront ? { ...piece, name: "front" } : piece);
  return teeNeckbandTemplateSvg(teeNamedPieces, lengthPercent, finishedWidthCm)
    .replace("<svg xmlns=\"http://www.w3.org/2000/svg\" role=\"img\"", "<svg xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" data-pattern-family=\"fitted-scoop-tee\"")
    .replace("<title>Tee neckband provisional cutting template</title>", "<title>Fitted Scoop-neck Tee neckband provisional cutting template</title>")
    .replace("selected Tee front and back neckline curves", "selected Fitted Scoop-neck Tee front and back neckline curves")
    .replace("TEE NECKBAND — PROVISIONAL TEMPLATE · SELECTED SIZE", "FITTED SCOOP-NECK TEE NECKBAND — PROVISIONAL TEMPLATE · SELECTED SIZE");
}

/**
 * Build the selected-size T06 V-band strip. This is a product-defined digital
 * construction: the full included V angle comes from mirroring the active
 * front neckline line, and the strip end join is mitered by half of that
 * included angle. The formula is not a sourced universal pattern rule and
 * does not predict physical fit or material behavior.
 *
 * The open strip is laid flat with its two opposing center-front join seams
 * marked at its ends. Registration points follow the measured front/back
 * neckline proportions, while the V schematic records the actual garment
 * center-front point used to derive the join.
 */
export function teeVNeckbandTemplateSvg(
  pieces: readonly Piece[],
  lengthPercent: number,
  finishedWidthCm: number,
  familyLabel = "T06",
): string {
  const percentageOption = TEE_NECKBAND_OPTIONS[0]!;
  const widthOption = TEE_NECKBAND_OPTIONS[1]!;
  const validSetting = (value: number, option: GarmentOption): boolean => Number.isFinite(value)
    && value >= option.min
    && value <= option.max
    && Math.abs((value - option.min) / option.step - Math.round((value - option.min) / option.step)) <= 1e-7;
  if (!validSetting(lengthPercent, percentageOption)) {
    throw new Error(`Neckband length must be ${percentageOption.min}–${percentageOption.max}% of the drafted neckline.`);
  }
  if (!validSetting(finishedWidthCm, widthOption)) {
    throw new Error(`Finished neckband width must be ${widthOption.min}–${widthOption.max} cm.`);
  }

  const patternFamily = familyLabel === "T06" ? "Tee" : familyLabel;
  const { front, back } = vNeckBodyPieces(pieces, patternFamily);

  const frontEdge = pieceEdge(front, "neckline");
  const backEdge = pieceEdge(back, "neckline");
  if (frontEdge.kind !== "line") {
    throw new Error("The selected front neckline is not a straight V and cannot define the V-band join.");
  }
  const frontNecklineCm = edgeLength(frontEdge);
  const backNecklineCm = edgeLength(backEdge);
  if (!Number.isFinite(frontNecklineCm) || frontNecklineCm <= 0 ||
      !Number.isFinite(backNecklineCm) || backNecklineCm <= 0) {
    throw new Error(`The selected ${patternFamily} neckline geometry is not usable for a V-band template.`);
  }

  // The folded front is at x=0; accept either edge direction so this helper
  // still consumes actual geometry rather than depending on edge ordering.
  const centerFront = Math.abs(frontEdge.start.x) <= Math.abs(frontEdge.end.x)
    ? frontEdge.start : frontEdge.end;
  const shoulder = centerFront === frontEdge.start ? frontEdge.end : frontEdge.start;
  const frontHalfWidthCm = Math.abs(shoulder.x - centerFront.x);
  const frontDropCm = Math.abs(shoulder.y - centerFront.y);
  const halfVAngleRadians = Math.atan2(frontHalfWidthCm, frontDropCm);
  const includedVAngleRadians = 2 * halfVAngleRadians;
  if (!Number.isFinite(frontHalfWidthCm) || frontHalfWidthCm <= 0 ||
      !Number.isFinite(frontDropCm) || frontDropCm <= 0 ||
      !Number.isFinite(includedVAngleRadians) || includedVAngleRadians <= 0 || includedVAngleRadians >= Math.PI) {
    throw new Error("The selected front V geometry cannot define a center-front band join; review the V drop and neckline draft.");
  }

  const necklineCircumferenceCm = 2 * (frontNecklineCm + backNecklineCm);
  if (!Number.isFinite(necklineCircumferenceCm) || necklineCircumferenceCm <= 0) {
    throw new Error(`The selected ${patternFamily} neckline geometry is not usable for a V-band template.`);
  }
  const loopSeamlineCm = necklineCircumferenceCm * lengthPercent / 100;
  const endSeamAllowanceCm = 1;
  const necklineSeamAllowanceCm = 0.6;
  const cutLengthCm = loopSeamlineCm + 2 * endSeamAllowanceCm;
  const cutWidthCm = 2 * (finishedWidthCm + necklineSeamAllowanceCm);
  const joinWidthCm = cutWidthCm - 2 * necklineSeamAllowanceCm;
  const miterRunCm = joinWidthCm / Math.tan(halfVAngleRadians);
  if (!Number.isFinite(miterRunCm) || miterRunCm <= 0 || miterRunCm * 2 >= loopSeamlineCm) {
    throw new Error("The selected front V is too sharp for this band length to keep the center-front join clear; review the V draft or band settings.");
  }

  const marginCm = 1;
  const topSpaceCm = 4.4;
  const bottomSpaceCm = 2.6;
  const sheetWidthCm = cutLengthCm + marginCm * 2;
  const sheetHeightCm = topSpaceCm + cutWidthCm + bottomSpaceCm;
  const x = marginCm;
  const y = topSpaceCm;
  const loopStartX = x + endSeamAllowanceCm;
  const loopEndX = loopStartX + loopSeamlineCm;
  const format = (value: number): string => Number(value.toFixed(3)).toString();
  const dimension = (value: number): string => value.toFixed(1);
  const angleDegrees = includedVAngleRadians * 180 / Math.PI;
  const vReferenceLabel = familyLabel === "T06"
    ? "GARMENT FRONT V REFERENCE · SCHEMATIC"
    : `${familyLabel.toUpperCase()} FRONT V REFERENCE · SCHEMATIC`;
  const bandDescription = familyLabel === "T06"
    ? "True-scale one-piece digital band strip from the selected Tee front V and crew back. "
    : `True-scale one-piece digital band strip from the selected ${familyLabel} front V and crew back. `;

  const registrationMarks = [
    { id: "center-front-start", label: "CF", bodyPosition: 0, bandPosition: 0 },
    {
      id: "shoulder-front", label: "SHOULDER", bodyPosition: frontNecklineCm,
      bandPosition: loopSeamlineCm * frontNecklineCm / necklineCircumferenceCm,
    },
    {
      id: "center-back", label: "CB", bodyPosition: frontNecklineCm + backNecklineCm,
      bandPosition: loopSeamlineCm / 2,
    },
    {
      id: "shoulder-back", label: "SHOULDER", bodyPosition: frontNecklineCm + 2 * backNecklineCm,
      bandPosition: loopSeamlineCm * (frontNecklineCm + 2 * backNecklineCm) / necklineCircumferenceCm,
    },
    {
      id: "center-front-end", label: "CF", bodyPosition: necklineCircumferenceCm,
      bandPosition: loopSeamlineCm,
    },
  ].map((mark) => {
    const notchX = loopStartX + mark.bandPosition;
    const notchHalfWidth = 0.12;
    const notchDepth = 0.28;
    const top = `M ${format(notchX - notchHalfWidth)} ${format(y)} L ${format(notchX)} ${format(y + notchDepth)} L ${format(notchX + notchHalfWidth)} ${format(y)}`;
    const bottom = `M ${format(notchX - notchHalfWidth)} ${format(y + cutWidthCm)} L ${format(notchX)} ${format(y + cutWidthCm - notchDepth)} L ${format(notchX + notchHalfWidth)} ${format(y + cutWidthCm)}`;
    const markType = mark.label === "CF" ? "center-front" : mark.label === "CB" ? "center-back" : "shoulder";
    return `<g data-registration="${mark.id}" data-registration-type="${markType}" ` +
      `data-body-position-cm="${format(mark.bodyPosition)}" ` +
      `data-band-position-cm="${format(mark.bandPosition)}">` +
      `<path data-registration-notch="true" d="${top}${bottom}"/>` +
      `</g>`;
  }).join("");

  const vDiagramScale = Math.min(1, 5.2 / (2 * frontHalfWidthCm), 1.7 / frontDropCm);
  const vDiagramCenterX = x + cutLengthCm / 2;
  const vDiagramTopY = 2.05;
  const vDiagramPointY = vDiagramTopY + frontDropCm * vDiagramScale;
  const vDiagramLeftX = vDiagramCenterX - frontHalfWidthCm * vDiagramScale;
  const vDiagramRightX = vDiagramCenterX + frontHalfWidthCm * vDiagramScale;
  const startJoin = `M ${format(loopStartX)} ${format(y + necklineSeamAllowanceCm)} ` +
    `L ${format(loopStartX + miterRunCm)} ${format(y + cutWidthCm - necklineSeamAllowanceCm)}`;
  const endJoin = `M ${format(loopEndX)} ${format(y + necklineSeamAllowanceCm)} ` +
    `L ${format(loopEndX - miterRunCm)} ${format(y + cutWidthCm - necklineSeamAllowanceCm)}`;
  const scaleY = y + cutWidthCm + 1.78;
  const necklineJoinY1 = y + necklineSeamAllowanceCm;
  const necklineJoinY2 = y + cutWidthCm - necklineSeamAllowanceCm;

  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" ` +
    `width="${format(sheetWidthCm)}cm" height="${format(sheetHeightCm)}cm" ` +
    `viewBox="0 0 ${format(sheetWidthCm)} ${format(sheetHeightCm)}" ` +
    `data-neckline-circumference-cm="${format(necklineCircumferenceCm)}" ` +
    `data-loop-seamline-cm="${format(loopSeamlineCm)}" ` +
    `data-cut-length-cm="${format(cutLengthCm)}" data-cut-width-cm="${format(cutWidthCm)}" ` +
    `data-finished-width-cm="${format(finishedWidthCm)}" data-v-included-angle-deg="${format(angleDegrees)}" ` +
    `data-v-miter-run-cm="${format(miterRunCm)}" data-front-v-drop-cm="${format(frontDropCm)}" ` +
    `data-front-v-half-width-cm="${format(frontHalfWidthCm)}" ` +
    `data-v-center-front-x-cm="${format(centerFront.x)}" data-v-center-front-y-cm="${format(centerFront.y)}" ` +
    `data-v-shoulder-x-cm="${format(shoulder.x)}" data-v-shoulder-y-cm="${format(shoulder.y)}">` +
    `<title>${familyLabel} V-neck band provisional cutting template</title>` +
    `<desc>${bandDescription}` +
    `Opposing center-front join seams use a product-defined miter derived from the active V angle. ` +
    `Print at 100 percent and verify the ten centimetre calibration line. Material behavior and physical fit are unvalidated.</desc>` +
    `<g fill="none" stroke="#111" stroke-width="0.035">` +
    `<rect data-cut-outline="true" x="${format(x)}" y="${format(y)}" ` +
    `width="${format(cutLengthCm)}" height="${format(cutWidthCm)}"/>` +
    `<line data-neckline-seamline="true" x1="${format(x)}" y1="${format(necklineJoinY1)}" ` +
    `x2="${format(x + cutLengthCm)}" y2="${format(necklineJoinY1)}" stroke-dasharray="0.16 0.1"/>` +
    `<line data-neckline-seamline="true" x1="${format(x)}" y1="${format(necklineJoinY2)}" ` +
    `x2="${format(x + cutLengthCm)}" y2="${format(necklineJoinY2)}" stroke-dasharray="0.16 0.1"/>` +
    `<path data-v-forming-join="start" data-center-front="true" d="${startJoin}" stroke-dasharray="0.08 0.06"/>` +
    `<path data-v-forming-join="end" data-center-front="true" d="${endJoin}" stroke-dasharray="0.08 0.06"/>` +
    `<line data-fold-line="true" x1="${format(x)}" y1="${format(y + cutWidthCm / 2)}" ` +
    `x2="${format(x + cutLengthCm)}" y2="${format(y + cutWidthCm / 2)}" stroke-dasharray="0.28 0.12 0.06 0.12"/>` +
    registrationMarks +
    `<line data-calibration-length-cm="10" x1="${format(x)}" y1="${format(scaleY)}" ` +
    `x2="${format(x + 10)}" y2="${format(scaleY)}"/>` +
    `<line x1="${format(x)}" y1="${format(scaleY - 0.12)}" x2="${format(x)}" y2="${format(scaleY + 0.12)}"/>` +
    `<line x1="${format(x + 10)}" y1="${format(scaleY - 0.12)}" x2="${format(x + 10)}" y2="${format(scaleY + 0.12)}"/>` +
    `</g>` +
    `<g fill="#111" font-family="Arial, sans-serif">` +
    `<text x="${format(x)}" y="0.48" font-size="0.3">${familyLabel} V-NECK BAND — PROVISIONAL TEMPLATE · SELECTED SIZE</text>` +
    `<text x="${format(x)}" y="0.95" font-size="0.22">Body neckline ${dimension(necklineCircumferenceCm)} cm · band target ${dimension(loopSeamlineCm)} cm at ${dimension(lengthPercent)}% · finished width ${dimension(finishedWidthCm)} cm</text>` +
    `<text x="${format(x)}" y="1.38" font-size="0.22">CF miter ${dimension(angleDegrees)}° included V angle · matching CF, shoulder and CB registration marks</text>` +
    `<text x="${format(vDiagramCenterX - 2.5)}" y="1.72" font-size="0.2">${vReferenceLabel}</text>` +
    `<text x="${format(vDiagramLeftX - 0.28)}" y="${format(vDiagramTopY + 0.12)}" font-size="0.18">SHOULDER</text>` +
    `<text x="${format(vDiagramRightX + 0.12)}" y="${format(vDiagramTopY + 0.12)}" font-size="0.18">SHOULDER</text>` +
    `<text x="${format(vDiagramCenterX + 0.15)}" y="${format(vDiagramPointY + 0.12)}" font-size="0.18">CF</text>` +
    `<text x="${format(x)}" y="${format(y + 1.25)}" font-size="0.22">CUT 1 BAND STRIP · FOLD ON DASH-DOT LINE · JOIN THE OPPOSING MITER SEAMS AT CENTER FRONT</text>` +
    `<text x="${format(x)}" y="${format(scaleY + 0.08)}" font-size="0.22">10 cm scale check — print at 100%</text>` +
    `<text x="${format(x)}" y="${format(scaleY + 0.43)}" font-size="0.22">0.6 cm long-edge allowance · 1 cm end allowance · digital software choices · physical fit/material behavior unvalidated</text>` +
    `</g>` +
    `<g fill="none" stroke="#111" stroke-width="0.045" data-garment-v-reference="true">` +
    `<path data-garment-v-neckline="true" d="M ${format(vDiagramLeftX)} ${format(vDiagramTopY)} ` +
    `L ${format(vDiagramCenterX)} ${format(vDiagramPointY)} L ${format(vDiagramRightX)} ${format(vDiagramTopY)}"/>` +
    `<circle data-garment-center-front="true" cx="${format(vDiagramCenterX)}" cy="${format(vDiagramPointY)}" r="0.09" fill="#111"/>` +
    `<path data-v-join-diagram="true" d="M ${format(vDiagramCenterX - 0.38)} ${format(vDiagramPointY + 0.16)} ` +
    `L ${format(vDiagramCenterX)} ${format(vDiagramPointY + 0.52)} L ${format(vDiagramCenterX + 0.38)} ${format(vDiagramPointY + 0.16)}"/>` +
    `</g></svg>`;
}
