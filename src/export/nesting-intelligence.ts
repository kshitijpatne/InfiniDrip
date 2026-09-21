// Nesting-intelligence planning metrics — pure helpers around NestResult.
//
// The shelf packer (`nestPieces`) remains the only placement truth. Everything
// here derives planning numbers from its result without touching geometry,
// grain rules, placement order, exports, or save schemas:
//
//   wastePercent  : share of the sheet that is not pattern, in percent.
//   plannedLength : required length plus the cutting buffer, in centimetres.
//   fitResult     : fits / short-by-X verdict against fabric on hand.
//   napNoticeText : the truthful directional-print assumption.
//
// Unratable input yields null (unknown), never a fabricated number. Display
// rounding and raw-input preservation belong to the UI layer; invalid values
// are reported by the *Error helpers so guidance can name the exact control.

export const BUFFER_DEFAULT_PCT = 10;
export const BUFFER_MIN_PCT = 0;
export const BUFFER_MAX_PCT = 50;
export const BUFFER_STEP_PCT = 1;

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const validBuffer = (value: unknown): value is number =>
  finite(value) && value >= BUFFER_MIN_PCT && value <= BUFFER_MAX_PCT;

/** Actionable error for a cutting-buffer entry, or null when usable. */
export function bufferError(value: unknown): string | null {
  if (!finite(value)) return "Cutting buffer: enter a finite number.";
  if (!validBuffer(value)) {
    return `Cutting buffer: enter ${BUFFER_MIN_PCT}–${BUFFER_MAX_PCT}.`;
  }
  return null;
}

/** Planned fabric requirement: required length plus buffer. Null unless both
 * inputs are usable (finite, non-negative length, buffer within 0–50). */
export function plannedLength(requiredLengthCm: unknown, bufferPct: unknown): number | null {
  if (!finite(requiredLengthCm) || requiredLengthCm < 0) return null;
  if (!validBuffer(bufferPct)) return null;
  return requiredLengthCm * (1 + bufferPct / 100);
}

/** Waste share of the sheet in percent. Null unless utilization is a finite
 * 0..1 fraction. The raw value is returned; the UI rounds for display. */
export function wastePercent(utilization: unknown): number | null {
  if (!finite(utilization) || utilization < 0 || utilization > 1) return null;
  return (1 - utilization) * 100;
}

/** Actionable error for a fabric-on-hand entry, or null when usable. Blank
 * (undefined, null, or empty text) is not an error — it means unknown. */
export function availableLengthError(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const length = typeof value === "string" ? Number(value) : value;
  if (!finite(length) || length <= 0) {
    return "Fabric on hand: enter a number above 0, or leave it blank.";
  }
  return null;
}

export type FitVerdict =
  | { readonly verdict: "unknown" }
  | { readonly verdict: "fits" }
  | { readonly verdict: "short"; readonly shortByCm: number };

/** Fits / short-by-X against the planned length. Unknown covers blank,
 * invalid, and unratable planned inputs — never a false fit verdict. */
export function fitResult(availableLengthCm: unknown, plannedLengthCm: unknown): FitVerdict {
  const raw = availableLengthCm === undefined || availableLengthCm === null ||
    (typeof availableLengthCm === "string" && availableLengthCm.trim() === "")
    ? null
    : typeof availableLengthCm === "string"
      ? Number(availableLengthCm)
      : availableLengthCm;
  if (raw === null || !finite(raw) || raw <= 0) return { verdict: "unknown" };
  if (!finite(plannedLengthCm) || plannedLengthCm < 0) return { verdict: "unknown" };
  if (raw >= plannedLengthCm) return { verdict: "fits" };
  return { verdict: "short", shortByCm: plannedLengthCm - raw };
}

/** Truthful directional-print notice. The estimator keeps grain upright and
 * never rotates pieces either way; the flag only records the assumption. */
export function napNoticeText(napAware: boolean): string {
  return napAware
    ? "Directional print assumed: grain stays upright and pieces never rotate, so directional yardage is honest."
    : "Treated as non-directional: the estimator still keeps grain upright with no rotation, so nothing packs tighter.";
}
