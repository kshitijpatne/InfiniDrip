// The numbers a t-shirt block is built from. All in centimetres.
// "Raw" inputs are what a person measures; everything else is derived from them
// so the pattern stays internally consistent when any input changes.

export interface Measurements {
  readonly chest: number;        // full chest circumference
  readonly shoulderWidth: number; // shoulder point to shoulder point
  readonly bicep: number;        // upper-arm circumference
  readonly length: number;       // high-point-shoulder down to hem
  readonly armholeDepth: number; // high-point-shoulder down to the underarm line
  readonly sleeveLength: number; // cap top to sleeve hem
  readonly ease: number;         // wearing room added around the chest
}

/** A standard size M, used as the starting point. */
export const STANDARD_M: Measurements = {
  chest: 100, shoulderWidth: 45, bicep: 38,
  length: 70, armholeDepth: 24, sleeveLength: 22, ease: 10,
};

// Values the draft computes from the raw measurements. Exposed (not hidden
// inside the draft) so they can be inspected and tested on their own.
export interface Derived {
  readonly chestWidthHalf: number; // width of a half-piece at the chest
  readonly shoulderHalf: number;   // shoulder point, measured from centre
  readonly neckWidthHalf: number;  // half the neck opening width
  readonly frontNeckDepth: number; // how far the front neck dips
  readonly backNeckDepth: number;  // the back neck barely dips
  readonly shoulderSlope: number;  // how far the shoulder falls
}

export function derive(m: Measurements): Derived {
  const neckWidthHalf = m.chest / 20 + 2;
  return {
    chestWidthHalf: (m.chest + m.ease) / 4,
    shoulderHalf: m.shoulderWidth / 2,
    neckWidthHalf,
    frontNeckDepth: neckWidthHalf + 1,
    backNeckDepth: 2.5,
    shoulderSlope: 4,
  };
}
