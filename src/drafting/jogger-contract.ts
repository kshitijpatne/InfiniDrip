import type { Measurements } from "./measurements";
import type { GarmentOption, GarmentOptions } from "./options";
import type { StyleDef } from "../style";

/** Jogger uses the existing trouser measurement fields without changing the
 * global Measurements shape or the save format. */
export const JOGGER_FIELDS = [
  "waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease",
] as const satisfies readonly (keyof Measurements)[];

/** One named P0 recipe. Empty numeric ranges avoid inventing a fit envelope. */
export const JOGGER_STYLES: readonly StyleDef[] = [
  { name: "Adult knit jogger P0", ranges: {} },
];

export interface JoggerOptions extends GarmentOptions {
  readonly frontRiseEase: number;
  readonly backRiseEase: number;
  readonly waistbandDepth: number;
  readonly thighEase: number;
  readonly kneeEase: number;
  readonly legOpening: number;
  readonly elasticWidth: number;
  readonly pocketOpening: number;
  readonly pocketAngle: number;
  readonly pocketBagDepth: number;
  readonly pocketDrop: number;
  readonly drawcordLength: number;
  readonly drawcordCutWidth: number;
  readonly drawcordExitSpacing: number;
  /** 0 omits the pair of exits; 1 drafts the centre-front pair. */
  readonly drawcordExit: number;
}

/** Digital starting values from the G03S packet, not sourced construction
 * standards. Guardrails remain visible to consumers; they do not clamp drafts. */
export const JOGGER_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  { id: "frontRiseEase", label: "Front rise ease", unit: "cm", group: "Rise & waistband", help: "Digital starting value for the finished front rise; adjust it to change front rise length.", defaultValue: 1, min: -2, max: 8, step: 0.5 },
  { id: "backRiseEase", label: "Back rise ease", unit: "cm", group: "Rise & waistband", help: "Digital starting value for the finished back rise; keep it greater than the front rise for seat room.", defaultValue: 9, min: 2, max: 14, step: 0.5 },
  { id: "waistbandDepth", label: "Casing depth", unit: "cm", group: "Rise & waistband", help: "Digital starting value for the separate self-fabric casing; guidance checks its elastic and drawcord channel.", defaultValue: 5.5, min: 2, max: 8, step: 0.5 },
  { id: "thighEase", label: "Thigh ease", unit: "cm", group: "Leg fit", help: "Adds finished room at the upper thigh; adjust it if the jogger feels too close or too loose.", defaultValue: 8, min: 0, max: 20, step: 0.5 },
  { id: "kneeEase", label: "Knee ease", unit: "cm", group: "Leg fit", help: "Adds finished room at the knee; guidance checks the knee-to-hem taper.", defaultValue: 5, min: 0, max: 15, step: 0.5 },
  { id: "legOpening", label: "Leg opening", unit: "cm", group: "Leg fit", help: "Sets the finished plain-hem opening circumference; guidance compares it with the knee.", defaultValue: 40, min: 25, max: 65, step: 0.5 },
  { id: "elasticWidth", label: "Elastic width", unit: "cm", group: "Rise & waistband", help: "User-adjustable elastic width; measure and test-fit the elastic cut length.", defaultValue: 3.8, min: 1, max: 5, step: 0.1 },
  { id: "pocketOpening", label: "Pocket opening", unit: "cm", group: "Pocket", help: "Sets each angled front pocket opening; shorten it if it leaves the front panel.", defaultValue: 16, min: 8, max: 25, step: 0.5 },
  { id: "pocketAngle", label: "Pocket angle", unit: "°", group: "Pocket", help: "Sets the opening angle down from the side waist; adjust it if the opening approaches centre front or the rise.", defaultValue: 58, min: 35, max: 70, step: 1 },
  { id: "pocketBagDepth", label: "Pocket bag depth", unit: "cm", group: "Pocket", help: "Sets the pocket bag depth; reduce it if the bag reaches the knee or hem.", defaultValue: 23, min: 12, max: 35, step: 0.5 },
  { id: "pocketDrop", label: "Pocket drop", unit: "cm", group: "Pocket", help: "Moves the opening down from the jogger waist seam; adjust it to keep the opening inside the front panel.", defaultValue: 2, min: 0, max: 15, step: 0.5 },
  { id: "drawcordLength", label: "Drawcord length", unit: "cm", group: "Drawcord", help: "Digital product seed; measure and test-fit the finished cord length.", defaultValue: 120, min: 80, max: 180, step: 1 },
  { id: "drawcordCutWidth", label: "Drawcord cut width", unit: "cm", group: "Drawcord", help: "Digital product seed for the raw strip before folding; guidance checks the casing channel.", defaultValue: 3, min: 1.5, max: 5, step: 0.1 },
  { id: "drawcordExitSpacing", label: "Drawcord exit spacing", unit: "cm", group: "Drawcord", help: "Centre-to-centre spacing for the front buttonhole pair; reduce it if the pair leaves the casing channel.", defaultValue: 4, min: 2, max: 8, step: 0.5 },
  { id: "drawcordExit", label: "Drawcord exits", group: "Drawcord", help: "Choose whether the centre-front buttonhole pair is drafted.", defaultValue: 1, min: 0, max: 1, step: 1 },
];

export const JOGGER_DEFAULT_OPTIONS: JoggerOptions = {
  frontRiseEase: 1,
  backRiseEase: 9,
  waistbandDepth: 5.5,
  thighEase: 8,
  kneeEase: 5,
  legOpening: 40,
  elasticWidth: 3.8,
  pocketOpening: 16,
  pocketAngle: 58,
  pocketBagDepth: 23,
  pocketDrop: 2,
  drawcordLength: 120,
  drawcordCutWidth: 3,
  drawcordExitSpacing: 4,
  drawcordExit: 1,
};

/** Missing values receive product defaults; numeric values outside guardrails,
 * including NaN and infinities, remain unchanged for actionable guidance. */
export function resolveJoggerOptions(raw: Partial<JoggerOptions> = {}): JoggerOptions {
  return {
    frontRiseEase: raw.frontRiseEase ?? JOGGER_DEFAULT_OPTIONS.frontRiseEase,
    backRiseEase: raw.backRiseEase ?? JOGGER_DEFAULT_OPTIONS.backRiseEase,
    waistbandDepth: raw.waistbandDepth ?? JOGGER_DEFAULT_OPTIONS.waistbandDepth,
    thighEase: raw.thighEase ?? JOGGER_DEFAULT_OPTIONS.thighEase,
    kneeEase: raw.kneeEase ?? JOGGER_DEFAULT_OPTIONS.kneeEase,
    legOpening: raw.legOpening ?? JOGGER_DEFAULT_OPTIONS.legOpening,
    elasticWidth: raw.elasticWidth ?? JOGGER_DEFAULT_OPTIONS.elasticWidth,
    pocketOpening: raw.pocketOpening ?? JOGGER_DEFAULT_OPTIONS.pocketOpening,
    pocketAngle: raw.pocketAngle ?? JOGGER_DEFAULT_OPTIONS.pocketAngle,
    pocketBagDepth: raw.pocketBagDepth ?? JOGGER_DEFAULT_OPTIONS.pocketBagDepth,
    pocketDrop: raw.pocketDrop ?? JOGGER_DEFAULT_OPTIONS.pocketDrop,
    drawcordLength: raw.drawcordLength ?? JOGGER_DEFAULT_OPTIONS.drawcordLength,
    drawcordCutWidth: raw.drawcordCutWidth ?? JOGGER_DEFAULT_OPTIONS.drawcordCutWidth,
    drawcordExitSpacing: raw.drawcordExitSpacing ?? JOGGER_DEFAULT_OPTIONS.drawcordExitSpacing,
    drawcordExit: raw.drawcordExit ?? JOGGER_DEFAULT_OPTIONS.drawcordExit,
  };
}
