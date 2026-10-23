import type { LowerBodyUpperOptions } from "./lower-body-upper";
import type { GarmentOption } from "./options";
import type { Measurements } from "./measurements";

export const SHORTS_FIELDS: readonly (keyof Measurements)[] = [
  "waist", "hip", "hipDepth", "crotchDepth", "thigh", "ease",
];

export interface ShortsGeometryOptions extends LowerBodyUpperOptions {
  readonly shortsInseam: number;
  readonly hemOpening: number;
}

export interface ShortsComponentOptions {
  readonly flyLength: number;
  readonly pocketOpening: number;
  readonly pocketAngle: number;
  readonly pocketBagDepth: number;
  readonly pocketDrop: number;
}

export type ShortsOptions = ShortsGeometryOptions & ShortsComponentOptions;

export const SHORTS_GEOMETRY_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  { id: "shortsInseam", label: "Shorts length", unit: "cm", group: "Leg shape", help: "Sets the vertical distance from the back crotch station to the finished hem; change it to lengthen or shorten the short without adding a knee station.", defaultValue: 20, min: 5.5, max: 45, step: 0.5 },
  { id: "hemOpening", label: "Hem opening", unit: "cm", group: "Leg shape", help: "Sets the finished opening around one leg at the actual hem; change it to widen or narrow the leg opening.", defaultValue: 60, min: 40, max: 90, step: 0.5 },
  { id: "frontRiseEase", label: "Front rise ease", unit: "cm", group: "Rise & waistband", help: "Adds to crotch depth for the finished front rise; adjust it if the front rise is too long or short.", defaultValue: 1, min: -2, max: 8, step: 0.5 },
  { id: "backRiseEase", label: "Back rise ease", unit: "cm", group: "Rise & waistband", help: "Adds to crotch depth for the finished back rise; keep enough seat room for the intended style.", defaultValue: 9, min: 2, max: 14, step: 0.5 },
  { id: "waistbandDepth", label: "Waistband depth", unit: "cm", group: "Rise & waistband", help: "Sets the separate finished waistband height; it must remain below both finished rises.", defaultValue: 3.5, min: 2, max: 6, step: 0.5 },
];

export const DEFAULT_SHORTS_GEOMETRY_OPTIONS: ShortsGeometryOptions = {
  shortsInseam: 20,
  hemOpening: 60,
  frontRiseEase: 1,
  backRiseEase: 9,
  waistbandDepth: 3.5,
};

export const SHORTS_COMPONENT_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  { id: "flyLength", label: "Fly length", unit: "cm", group: "Front closure", help: "Sets the front fly length; shorten it if it approaches the front rise, pocket opening, or hem turn.", defaultValue: 11, min: 6, max: 18, step: 0.5 },
  { id: "pocketOpening", label: "Pocket opening", unit: "cm", group: "Pocket", help: "Sets each angled front pocket opening; shorten it if it leaves the front panel or approaches the front rise.", defaultValue: 12, min: 8, max: 20, step: 0.5 },
  { id: "pocketAngle", label: "Pocket angle", unit: "°", group: "Pocket", help: "Sets the angled pocket opening; reduce it if the opening approaches center front or the front rise.", defaultValue: 58, min: 35, max: 70, step: 1 },
  { id: "pocketBagDepth", label: "Pocket bag depth", unit: "cm", group: "Pocket", help: "Sets the pocket bag depth; reduce it if the bag reaches the hem turn or leaves the front panel.", defaultValue: 13, min: 8, max: 25, step: 0.5 },
  { id: "pocketDrop", label: "Pocket drop", unit: "cm", group: "Pocket", help: "Moves the pocket opening below the waist seam; adjust it if the opening approaches the front rise or hem.", defaultValue: 2, min: 0, max: 10, step: 0.5 },
];

export const DEFAULT_SHORTS_COMPONENT_OPTIONS: ShortsComponentOptions = {
  flyLength: 11,
  pocketOpening: 12,
  pocketAngle: 58,
  pocketBagDepth: 13,
  pocketDrop: 2,
};

export const SHORTS_OPTION_DEFINITIONS: readonly GarmentOption[] = [
  ...SHORTS_GEOMETRY_OPTION_DEFINITIONS,
  ...SHORTS_COMPONENT_OPTION_DEFINITIONS,
];

export const DEFAULT_SHORTS_OPTIONS: ShortsOptions = {
  ...DEFAULT_SHORTS_GEOMETRY_OPTIONS,
  ...DEFAULT_SHORTS_COMPONENT_OPTIONS,
};

export const SHORTS_ROLE_IDS = [
  "frontLeft",
  "frontRight",
  "backLeft",
  "backRight",
  "waistband",
  "flyShield",
  "flyUnderlap",
  "pocketBagLeft",
  "pocketBagRight",
] as const;

export type ShortsRoleId = typeof SHORTS_ROLE_IDS[number];

export const SHORTS_LEG_ROLE_IDS = [
  "frontLeft",
  "frontRight",
  "backLeft",
  "backRight",
] as const satisfies readonly ShortsRoleId[];

export const SHORTS_ROLE_QUANTITIES: Readonly<Record<ShortsRoleId, 1>> = {
  frontLeft: 1,
  frontRight: 1,
  backLeft: 1,
  backRight: 1,
  waistband: 1,
  flyShield: 1,
  flyUnderlap: 1,
  pocketBagLeft: 1,
  pocketBagRight: 1,
};
