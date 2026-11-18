// Trouser-specific guidance for the assembled lower-body block.
//
// These checks describe relationships the geometry can expose but cannot
// silently repair: body order, rise/waistband fit, fly reach, and a coherent
// straight-leg progression. Pocket-specific checks stay with the pocket
// component and are appended here so the recipe gets one guidance stream.

import { Note } from "../guidance/note";
import { Block } from "./block";
import { Measurements } from "./measurements";
import {
  TROUSER_OPTION_DEFINITIONS,
  resolveTrouserOptions,
  TROUSER_TAPERED_PROFILE_ROUTE_KEY,
  TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY,
  TROUSER_BOOTCUT_PROFILE_ROUTE_KEY,
  TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY,
  TROUSER_BARREL_LEG_ENTRY_ID,
  TROUSER_PLEATED_FRONT_ENTRY_ID,
  TrouserOptions,
} from "./trouser-contract";
import { trouserMetrics, trouserPocketGuidance, trouserPocketOpening } from "./trouser";

function optionRangeNotes(options: TrouserOptions): Note[] {
  const notes: Note[] = [];
  const activeEntryId = options[TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY] === 1
    ? TROUSER_BARREL_LEG_ENTRY_ID
    : options[TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY] === 1
      ? TROUSER_PLEATED_FRONT_ENTRY_ID
      : undefined;
  for (const definition of TROUSER_OPTION_DEFINITIONS.filter((d) => d.group !== "Pocket")) {
    if (definition.appliesToStarterEntryId !== undefined
      && definition.appliesToStarterEntryId !== activeEntryId) continue;
    const value = options[definition.id as Exclude<
      keyof TrouserOptions,
      typeof TROUSER_TAPERED_PROFILE_ROUTE_KEY | typeof TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY
        | typeof TROUSER_BOOTCUT_PROFILE_ROUTE_KEY | typeof TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY
    >];
    if (typeof value !== "number" || !Number.isFinite(value) || value < definition.min || value > definition.max) {
      notes.push({
        field: `option-${definition.id}`,
        level: "warn",
        text: `${definition.label} (${value} cm) is outside V1's ${definition.min}–${definition.max} cm range — adjust it into that range.`,
      });
    }
  }
  return notes;
}

/** Complete digital guidance for the V1 relaxed straight-leg trouser. */
export function trouserGuidance(
  drafted: Block, m: Measurements, rawOptions: Partial<TrouserOptions> = {}
): Note[] {
  const options = resolveTrouserOptions(rawOptions);
  const metrics = trouserMetrics(m, options);
  const notes = optionRangeNotes(options);

  if (m.waist >= m.hip) {
    notes.push({
      field: "waist",
      level: "warn",
      text: `Waist (${m.waist} cm) is not smaller than the hip (${m.hip} cm) — increase the hip or reduce the waist for a trouser block.`,
    });
  }
  if (m.hipDepth >= m.crotchDepth) {
    notes.push({
      field: "hipDepth",
      level: "warn",
      text: `Hip depth (${m.hipDepth} cm) reaches the sitting crotch depth (${m.crotchDepth} cm) — reduce hip depth or increase crotch depth so the seat station comes first.`,
    });
  }
  if (!(m.inseam > 0)) {
    notes.push({
      field: "inseam",
      level: "warn",
      text: `Inseam (${m.inseam} cm) must be positive — enter the finished crotch-to-hem length.`,
    });
  }
  if (metrics.finishedWaist <= 0 || metrics.finishedSeat <= 0) {
    notes.push({
      field: "ease",
      level: "warn",
      text: "Finished waist and seat must stay positive — increase the body measurement or ease instead of drafting a reversed panel.",
    });
  }
  if (options[TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY] === 1) {
    // The profile resolver supplies all three software defaults for this identity.
    const offset = options.frontPleatOffsetCm!;
    const intake = options.frontPleatIntakeCm!;
    const depth = options.frontPleatStitchDepthCm!;
    const waistQuarter = metrics.finishedWaist / 4;
    if (offset + intake >= waistQuarter) {
      notes.push({
        field: "option-frontPleatOffsetCm",
        level: "warn",
        text: `Pleat placement plus intake (${(offset + intake).toFixed(1)} cm) reaches the side waist (${waistQuarter.toFixed(1)} cm) — move the pleat toward centre front or reduce its intake.`,
      });
    }
    const opening = trouserPocketOpening(m, options);
    const pleatX = [offset, offset + intake / 2, offset + intake];
    const crossesPocket = pleatX.some((x) => {
      const minX = Math.min(opening.start.x, opening.end.x);
      const maxX = Math.max(opening.start.x, opening.end.x);
      if (x < minX || x > maxX || opening.end.x === opening.start.x) return false;
      const y = opening.start.y + ((x - opening.start.x) / (opening.end.x - opening.start.x))
        * (opening.end.y - opening.start.y);
      return y >= 0 && y <= depth;
    });
    if (crossesPocket) {
      notes.push({
        field: "option-frontPleatOffsetCm",
        level: "warn",
        text: "The pleat fold, roll, or placement guide crosses the pocket opening — move the pleat toward centre front or shorten its stitch-down depth.",
      });
    }
  }
  if (metrics.backRise <= metrics.frontRise) {
    notes.push({
      field: "option-backRiseEase",
      level: "warn",
      text: `Back rise (${metrics.backRise.toFixed(1)} cm) is not greater than the front rise (${metrics.frontRise.toFixed(1)} cm) — increase back rise ease or reduce front rise ease for seat room.`,
    });
  }
  if (options.waistbandDepth >= metrics.frontCrotchY || options.waistbandDepth >= metrics.backCrotchY) {
    notes.push({
      field: "option-waistbandDepth",
      level: "warn",
      text: "Waistband depth reaches the front or back crotch station — reduce waistband depth or increase the corresponding rise ease.",
    });
  }
  if (options.flyLength >= metrics.frontCrotchY) {
    notes.push({
      field: "option-flyLength",
      level: "warn",
      text: `Fly length (${options.flyLength} cm) reaches the front rise after the waistband (${metrics.frontCrotchY.toFixed(1)} cm) — shorten the fly or increase front rise ease.`,
    });
  }
  if (metrics.finishedThigh <= 0 || metrics.finishedKnee <= 0 || options.legOpening <= 0) {
    notes.push({
      field: "option-thighEase",
      level: "warn",
      text: "Finished thigh, knee, and leg opening must be positive — increase the body girth/ease values before drafting.",
    });
  }
  if (metrics.finishedThigh <= metrics.finishedKnee) {
    notes.push({
      field: "thigh",
      level: "warn",
      text: `Finished thigh (${metrics.finishedThigh.toFixed(1)} cm) is not wider than the knee (${metrics.finishedKnee.toFixed(1)} cm) — increase thigh room or reduce knee ease.`,
    });
  }
  const isBarrelLeg = options[TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY] === 1;
  const isBootcut = options[TROUSER_BOOTCUT_PROFILE_ROUTE_KEY] === 1;
  if (isBootcut
    ? options.legOpening <= metrics.finishedKnee
    : isBarrelLeg
    ? metrics.finishedKnee <= options.legOpening
    : metrics.finishedKnee < options.legOpening) {
    notes.push({
      field: "option-legOpening",
      level: "warn",
      text: isBootcut
        ? `Bootcut opening (${options.legOpening} cm) must be wider than the finished knee (${metrics.finishedKnee.toFixed(1)} cm) — increase the opening or reduce knee ease to restore the flare.`
        : isBarrelLeg
        ? "Barrel-leg opening (" + options.legOpening + " cm) must be smaller than the finished knee (" + metrics.finishedKnee.toFixed(1) + " cm) — reduce the opening or increase knee girth/ease to retain the ankle taper."
        : "Leg opening (" + options.legOpening + " cm) is wider than the finished knee (" + metrics.finishedKnee.toFixed(1) + " cm) — reduce the opening or increase knee girth/ease for a straight leg.",
    });
  }
  if (!isBootcut && metrics.finishedKnee - options.legOpening > 12) {
    notes.push({
      field: "option-legOpening",
      level: "warn",
      text: `The knee-to-opening drop is ${(
        metrics.finishedKnee - options.legOpening
      ).toFixed(1)} cm — increase the opening or reduce knee ease so the leg does not taper sharply.`,
    });
  }

  notes.push(...trouserPocketGuidance(drafted, m, options));
  return notes;
}
