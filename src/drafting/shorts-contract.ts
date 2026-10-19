import type { LowerBodyUpperOptions } from "./lower-body-upper";
import type { GarmentOption } from "./options";

export interface ShortsGeometryOptions extends LowerBodyUpperOptions {
  readonly shortsInseam: number;
  readonly hemOpening: number;
}

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
