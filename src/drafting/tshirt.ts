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

import { Measurements } from "./measurements";
import { Piece, edgeLength, pieceEdge } from "./piece";
import { Block } from "./block";
import { sleevedTopStitches } from "./tshirt-checks";
import { bodice } from "./bodice";
import { sleeve as sleeveComponent } from "./sleeve";
import { componentNode, composeBlock, garmentGrammar } from "./grammar";
import type { Component } from "./component";
import type { GarmentOption, GarmentOptions } from "./options";

type TeeBodiceParams = { readonly position: "front" | "back"; readonly chestEase?: number };
const teeBodice: Component<TeeBodiceParams> = (m, params) => bodice(
  params.chestEase === undefined ? m : { ...m, ease: params.chestEase },
  { position: params.position },
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
 * Build a separate, true-scale Tee neckband SVG from the live front/back
 * neckline curves. The front and back blocks are half pieces on the fold, so
 * their seam lengths are doubled to get the complete neckline.
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

  const frontNecklineCm = edgeLength(pieceEdge(front, "neckline"));
  const backNecklineCm = edgeLength(pieceEdge(back, "neckline"));
  if (!Number.isFinite(frontNecklineCm) || frontNecklineCm <= 0 ||
      !Number.isFinite(backNecklineCm) || backNecklineCm <= 0) {
    throw new Error("The selected Tee neckline geometry is not usable for a neckband template.");
  }

  const necklineCircumferenceCm = 2 * (frontNecklineCm + backNecklineCm);
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
  const loopStartX = x + endSeamAllowanceCm;
  const loopEndX = loopStartX + loopSeamlineCm;

  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" ` +
    `width="${format(sheetWidthCm)}cm" height="${format(sheetHeightCm)}cm" ` +
    `viewBox="0 0 ${format(sheetWidthCm)} ${format(sheetHeightCm)}" ` +
    `data-neckline-circumference-cm="${format(necklineCircumferenceCm)}" ` +
    `data-loop-seamline-cm="${format(loopSeamlineCm)}" ` +
    `data-cut-length-cm="${format(cutLengthCm)}" data-cut-width-cm="${format(cutWidthCm)}">` +
    `<title>Tee neckband provisional cutting template</title>` +
    `<desc>True-scale pattern rectangle calculated from the selected Tee front and back neckline curves. ` +
    `Print at 100 percent and verify the ten centimetre calibration line. Physical fit and fabric recovery are unvalidated.</desc>` +
    `<g fill="none" stroke="#111" stroke-width="0.035">` +
    `<rect data-cut-outline="true" x="${format(x)}" y="${format(y)}" ` +
    `width="${format(cutLengthCm)}" height="${format(cutWidthCm)}"/>` +
    `<line data-neckline-seamline="true" x1="${format(x)}" y1="${format(necklineJoinY1)}" ` +
    `x2="${format(x + cutLengthCm)}" y2="${format(necklineJoinY1)}" stroke-dasharray="0.16 0.1"/>` +
    `<line data-neckline-seamline="true" x1="${format(x)}" y1="${format(necklineJoinY2)}" ` +
    `x2="${format(x + cutLengthCm)}" y2="${format(necklineJoinY2)}" stroke-dasharray="0.16 0.1"/>` +
    `<line data-end-seamline="true" x1="${format(loopStartX)}" y1="${format(y)}" ` +
    `x2="${format(loopStartX)}" y2="${format(y + cutWidthCm)}" stroke-dasharray="0.06 0.08"/>` +
    `<line data-end-seamline="true" x1="${format(loopEndX)}" y1="${format(y)}" ` +
    `x2="${format(loopEndX)}" y2="${format(y + cutWidthCm)}" stroke-dasharray="0.06 0.08"/>` +
    `<line data-fold-line="true" x1="${format(x)}" y1="${format(y + cutWidthCm / 2)}" ` +
    `x2="${format(x + cutLengthCm)}" y2="${format(y + cutWidthCm / 2)}" stroke-dasharray="0.28 0.12 0.06 0.12"/>` +
    quarterNotches +
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
    `<text x="${format(x)}" y="0.62" font-size="0.3">TEE NECKBAND — PROVISIONAL TEMPLATE · SELECTED SIZE</text>` +
    `<text x="${format(x)}" y="1.15" font-size="0.22">Neckline ${dimension(necklineCircumferenceCm)} cm · loop ${dimension(loopSeamlineCm)} cm at ${dimension(lengthPercent)}% · cut ${dimension(cutLengthCm)} × ${dimension(cutWidthCm)} cm</text>` +
    `<text x="${format(x)}" y="1.63" font-size="0.22">CUT 1 RIB · FOLD ON DASH-DOT LINE</text>` +
    `<text x="${format(x + 2.8)}" y="${format(stretchY + 0.08)}" font-size="0.22">PLACE MAXIMUM STRETCH ALONG LENGTH</text>` +
    `<text x="${format(x + 10.2)}" y="${format(scaleY + 0.08)}" font-size="0.22">10 cm scale check — print at 100%</text>` +
    `<text x="${format(x)}" y="${format(scaleY + 0.43)}" font-size="0.22">0.6 cm seam allowance · both long edges · 1 cm ends · quarter notches · fit/recovery not validated</text>` +
    `</g></svg>`;
}
