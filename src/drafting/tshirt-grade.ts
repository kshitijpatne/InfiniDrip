// T-shirt grade recipe — the only garment-specific part of grading.
// Per-size-step increments (cm) and the size run itself. Ease is deliberately
// absent: the user's dialled-in ease carries through every size unchanged.

import { GradeRule, SizeStep } from "./grading";

/** cm added to each measurement per +1 size step (a typical tee grade). */
export const TSHIRT_GRADE: GradeRule = {
  chest: 5,
  shoulderWidth: 1.2,
  bicep: 1.5,
  length: 2,
  armholeDepth: 0.6,
  sleeveLength: 0.8,
};

/** The default size run, base (M) at step 0. Ordered smallest → largest. */
export const TSHIRT_SIZES: readonly SizeStep[] = [
  { label: "XS", step: -2 },
  { label: "S", step: -1 },
  { label: "M", step: 0 },
  { label: "L", step: 1 },
  { label: "XL", step: 2 },
];
