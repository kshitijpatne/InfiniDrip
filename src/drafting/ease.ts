// Fabric & ease GUIDANCE — not an automatic transform.
//
// The user owns the ease number (it's a normal slider). This module never
// writes it. Instead it answers a question the user can act on:
//   "Given this fabric and the fit I'm aiming for, what ease is conventional?"
//
// Two fabric families behave differently, and that difference is the whole point
// of surfacing it as advice:
//   • WOVEN — no stretch, so a tee needs POSITIVE ease (wearing room you add).
//   • KNIT  — stretches, so a good tee often uses NEGATIVE ease (cut smaller
//             than the body; the fabric stretches to fit). Scales with stretch %.
//
// A heuristic, not drape physics. The user supplies the fabric's stretch % and
// decides what to actually dial in — a muslin still settles fit.

export type FabricFamily = "woven" | "knit";

export interface StretchFabric {
  readonly name: string;
  readonly family: FabricFamily;
  readonly stretchPercent: number; // 0 for woven; e.g. 50 means stretches 50%
}

/** Fabrics the user can pick to inform the ease advice. */
export const STRETCH_FABRICS: readonly StretchFabric[] = [
  { name: "Cotton woven", family: "woven", stretchPercent: 0 },
  { name: "Linen",        family: "woven", stretchPercent: 0 },
  { name: "Cotton jersey", family: "knit", stretchPercent: 25 },
  { name: "Rib knit",      family: "knit", stretchPercent: 50 },
  { name: "Spandex blend", family: "knit", stretchPercent: 80 },
];

// For a knit, suggested negative ease scales with the fabric's stretch and the
// chest: more stretch (or a bigger chest) → cut a little smaller.
const NEGATIVE_EASE_FACTOR = 0.10;

// A sensible woven wearing-ease default to anchor the advice (the style
// selector is where the user picks tighter/looser; this is just the baseline).
const WOVEN_BASELINE_EASE = 10;

/**
 * The ease (cm at the chest) this fabric conventionally calls for, at a given
 * chest. Woven → a positive baseline; knit → negative, scaled to stretch %.
 * Rounded to the nearest 0.5 cm. This is ADVICE — the caller shows it, the user
 * decides whether to match it.
 */
export function suggestedEase(fabric: StretchFabric, chest: number): number {
  const raw = fabric.family === "woven"
    ? WOVEN_BASELINE_EASE
    : -(fabric.stretchPercent / 100) * NEGATIVE_EASE_FACTOR * chest;
  return Math.round(raw * 2) / 2;
}

/** A short, plain-English note about what this fabric implies for ease. */
export function fabricEaseNote(fabric: StretchFabric, chest: number): string {
  const ease = suggestedEase(fabric, chest);
  if (fabric.family === "woven") {
    return `${fabric.name} has no stretch — add positive ease (around ${ease} cm is typical).`;
  }
  return `${fabric.name} stretches ~${fabric.stretchPercent}% — consider negative ease ` +
    `(around ${ease} cm: cut smaller than the body so it stretches to fit).`;
}
