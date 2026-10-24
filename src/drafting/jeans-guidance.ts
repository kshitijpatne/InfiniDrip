/** Actionable Jeans option, relationship, and live seam guidance. */
import type { CheckResult } from "../guidance/check";
import type { Note } from "../guidance/note";
import { JEANS_FIELDS, JEANS_OPTION_DEFINITIONS, resolveJeansOptions, type JeansOptions } from "./jeans-contract";
import { type Block } from "./block";
import { draftJeansCore, jeansMetrics } from "./jeans";
import type { Measurements } from "./measurements";
import { gradeRun, type GradedSize } from "./grading";
import { specSheet, type SpecRow } from "./pom";
import { stitchChecks } from "./stitch";
import { JEANS_GRADE, JEANS_POMS, JEANS_SIZES } from "./jeans-tables";

export interface JeansDraftGuidance {
  readonly ready: boolean;
  readonly block: Block | null;
  readonly checks: readonly CheckResult[];
  readonly notes: readonly Note[];
}

export interface JeansSizeRunGuidance {
  readonly ready: boolean;
  readonly graded: readonly GradedSize[];
  readonly poms: readonly SpecRow[];
  readonly notes: readonly Note[];
}

function warning(field: string, text: string): Note {
  return { field, level: "warn", text };
}

function optionRangeNotes(rawOptions: Partial<JeansOptions>): Note[] {
  const options = resolveJeansOptions(rawOptions);
  const notes: Note[] = [];
  for (const definition of JEANS_OPTION_DEFINITIONS) {
    const value = options[definition.id as keyof JeansOptions];
    const field = `option-${definition.id}`;
    if (typeof value !== "number" || !Number.isFinite(value)) {
      notes.push(warning(field,
        `${definition.label} must be a finite value from ${definition.min} to ${definition.max} cm; correct this value before drafting.`));
    } else if (value < definition.min || value > definition.max) {
      notes.push(warning(field,
        `${definition.label} (${value} cm) is outside the supported ${definition.min}–${definition.max} cm range; adjust it into that range.`));
    }
  }
  return notes;
}

function measurementAndRelationshipNotes(
  measurements: Measurements,
  rawOptions: Partial<JeansOptions>,
): Note[] {
  const options = resolveJeansOptions(rawOptions);
  const notes: Note[] = [];
  for (const field of JEANS_FIELDS) {
    const value = measurements[field];
    if (!Number.isFinite(value)) {
      notes.push(warning(field, `${field} must be a finite body measurement in centimetres; enter a valid value before drafting.`));
    } else if (field !== "ease" && value <= 0) {
      notes.push(warning(field, `${field} (${value} cm) must be positive; enter the measured lower-body value.`));
    }
  }
  if (!JEANS_FIELDS.every((field) => Number.isFinite(measurements[field]))) return notes;

  if (measurements.waist >= measurements.hip) {
    notes.push(warning("waist",
      `Waist (${measurements.waist} cm) is not smaller than hip (${measurements.hip} cm); increase hip or reduce waist for this lower-body draft.`));
  }
  if (measurements.hipDepth >= measurements.crotchDepth) {
    notes.push(warning("hipDepth",
      `Hip depth (${measurements.hipDepth} cm) reaches the sitting crotch depth (${measurements.crotchDepth} cm); reduce hip depth or increase crotch depth.`));
  }

  const metrics = jeansMetrics(measurements, options);
  if (metrics.finishedWaist <= 0 || metrics.finishedSeat <= 0) {
    notes.push(warning("ease", "Finished waist and seat must remain positive; adjust the body girths or ease."));
  }
  if (metrics.finishedThigh <= 0 || metrics.finishedKnee <= 0) {
    notes.push(warning("thigh", "Finished thigh and knee girths must remain positive; increase the body girth or the corresponding ease."));
  }
  if (metrics.backRise <= metrics.frontRise) {
    notes.push(warning("option-backRiseEase",
      `Back rise (${metrics.backRise.toFixed(1)} cm) is not greater than front rise (${metrics.frontRise.toFixed(1)} cm); increase backRiseEase or reduce frontRiseEase.`));
  }
  if (options.waistbandDepth >= metrics.frontCrotchY || options.waistbandDepth >= metrics.backCrotchY) {
    notes.push(warning("option-waistbandDepth",
      "Waistband depth reaches a front or back crotch station; reduce waistbandDepth or increase the corresponding rise ease."));
  }
  if (options.flyLength >= metrics.frontCrotchY) {
    notes.push(warning("option-flyLength",
      `Fly length (${options.flyLength} cm) reaches the front crotch station (${metrics.frontCrotchY.toFixed(1)} cm); shorten flyLength or increase frontRiseEase.`));
  }
  if (options.frontPocketDrop >= measurements.hipDepth) {
    notes.push(warning("option-frontPocketDrop",
      `Front pocket drop (${options.frontPocketDrop} cm) reaches the hip station (${measurements.hipDepth} cm); reduce frontPocketDrop.`));
  }
  if (options.yokeDepth / 2 >= measurements.hipDepth) {
    notes.push(warning("option-yokeDepth",
      `Half the yoke depth (${(options.yokeDepth / 2).toFixed(1)} cm) reaches the hip station (${measurements.hipDepth} cm); reduce yokeDepth or increase hipDepth.`));
  }
  return notes;
}

function errorField(message: string): string {
  const option = JEANS_OPTION_DEFINITIONS.find(({ id }) => message.includes(id));
  if (option) return `option-${option.id}`;
  const lower = message.toLowerCase();
  if (lower.includes("back pocket")) {
    if (lower.includes("center-back") || lower.includes("side seam")) return "option-backPocketOffset";
    if (lower.includes("lower-leg") || lower.includes("hem")) return "option-backPocketHeight";
    return "option-backPocketDrop";
  }
  if (lower.includes("pocket bag")) return "option-frontPocketBagDepth";
  if (lower.includes("pocket opening") || lower.includes("front pocket")) return "option-frontPocketOpening";
  if (lower.includes("fly")) return "option-flyLength";
  if (lower.includes("belt loop")) return "option-beltLoopWidth";
  if (lower.includes("waistband")) return "option-waistbandDepth";
  return "measurements";
}

/** Convert component failures into an actionable Jeans control or body field. */
export function jeansDraftFailure(error: unknown, sizeLabel?: string): Note {
  const message = error instanceof Error && error.message.length > 0
    ? error.message
    : "The digital Jeans draft could not be resolved.";
  const centerBackPocketCollision = message.toLowerCase().includes("back pocket") &&
    message.toLowerCase().includes("center-back seam");
  const actionableMessage = centerBackPocketCollision
    ? message.replace("increase backPocketOffset or reduce backPocketWidth", "reduce backPocketOffset or reduce backPocketWidth")
    : message;
  const prefix = sizeLabel ? `${sizeLabel}: ` : "";
  return warning(errorField(message), `${prefix}${actionableMessage} Correct the named option or body measurement and redraft; no input value was substituted.`);
}

export function inspectJeansStitches(draft: Block): { readonly checks: readonly CheckResult[]; readonly notes: readonly Note[] } {
  const checks = stitchChecks(draft, draft.stitches);
  const notes = checks.filter(({ ok }) => !ok).map((check) => warning(
    "jeans-construction",
    `${check.name}: ${check.detail}. Correct the live joined edges before continuing.`,
  ));
  return { checks, notes };
}

/** Return a block to consumers only when its actual joined edges pass review. */
export function reviewJeansDraft(draft: Block): JeansDraftGuidance {
  const stitchReview = inspectJeansStitches(draft);
  const ready = stitchReview.notes.length === 0;
  return {
    ready,
    block: ready ? draft : null,
    checks: stitchReview.checks,
    notes: stitchReview.notes,
  };
}

/** Draft only when raw values, relationships, and every live join are valid. */
export function draftJeansWithGuidance(
  measurements: Measurements,
  rawOptions: Partial<JeansOptions> = {},
): JeansDraftGuidance {
  const notes = [
    ...optionRangeNotes(rawOptions),
    ...measurementAndRelationshipNotes(measurements, rawOptions),
  ];
  if (notes.length > 0) return { ready: false, block: null, checks: [], notes };

  let draft: Block;
  try {
    draft = draftJeansCore(measurements, rawOptions);
  } catch (error) {
    return { ready: false, block: null, checks: [], notes: [jeansDraftFailure(error)] };
  }
  return reviewJeansDraft(draft);
}

/** True redrafts at each Jeans size; a partial or invalid run emits no POM table. */
export function jeansSizeRunWithGuidance(
  base: Measurements,
  rawOptions: Partial<JeansOptions> = {},
): JeansSizeRunGuidance {
  const optionNotes = optionRangeNotes(rawOptions);
  if (optionNotes.length > 0) return { ready: false, graded: [], poms: [], notes: optionNotes };

  const graded: GradedSize[] = [];
  const notes: Note[] = [];
  for (const size of JEANS_SIZES) {
    try {
      const run = gradeRun(base, JEANS_GRADE, [size], (measurements) => draftJeansCore(measurements, rawOptions));
      const current = run[0]!;
      const relationshipNotes = measurementAndRelationshipNotes(current.measurements, rawOptions);
      for (const note of relationshipNotes) notes.push({ ...note, text: `${size.label}: ${note.text}` });
      const review = inspectJeansStitches(current.block);
      notes.push(...review.notes);
      graded.push(current);
    } catch (error) {
      notes.push(jeansDraftFailure(error, size.label));
    }
  }
  if (notes.length > 0) {
    return { ready: false, graded: [], poms: [], notes };
  }
  return { ready: true, graded, poms: specSheet(graded, JEANS_POMS), notes: [] };
}
