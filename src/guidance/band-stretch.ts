/** Input fields that can make a band stretch calculation unrepresentable. */
export type BandStretchIssueField = "openingLengthCm" | "bandLengthCm" | "calculation";

/** A correction prompt; it describes math/input validity, never material suitability. */
export interface BandStretchIssue {
  readonly field: BandStretchIssueField;
  readonly code: "non-finite" | "not-positive" | "unrepresentable";
  readonly message: string;
}

export type BandStretchAnalysis =
  | {
      readonly calculable: true;
      readonly openingLengthCm: number;
      readonly bandLengthCm: number;
      readonly openingToBandRatio: number;
      readonly requiredStretchPercent: number;
      readonly issues: readonly [];
    }
  | {
      readonly calculable: false;
      readonly openingLengthCm: number;
      readonly bandLengthCm: number;
      readonly openingToBandRatio: null;
      readonly requiredStretchPercent: null;
      readonly issues: readonly BandStretchIssue[];
    };

/**
 * Compare an actual walked opening with its user-owned finished band length.
 * A calculable result is math only: it does not judge material, recovery, fit,
 * pass-over, sewability, or physical suitability.
 */
export function analyzeBandStretch(
  openingLengthCm: number,
  bandLengthCm: number,
): BandStretchAnalysis {
  const issues: BandStretchIssue[] = [];

  if (!Number.isFinite(openingLengthCm)) {
    issues.push({
      field: "openingLengthCm",
      code: "non-finite",
      message: "Opening length must be a finite value in centimetres.",
    });
  } else if (openingLengthCm <= 0) {
    issues.push({
      field: "openingLengthCm",
      code: "not-positive",
      message: "Opening length must be greater than zero centimetres.",
    });
  }

  if (!Number.isFinite(bandLengthCm)) {
    issues.push({
      field: "bandLengthCm",
      code: "non-finite",
      message: "Band length must be a finite value in centimetres.",
    });
  } else if (bandLengthCm <= 0) {
    issues.push({
      field: "bandLengthCm",
      code: "not-positive",
      message: "Band length must be greater than zero centimetres.",
    });
  }

  if (issues.length > 0) {
    return {
      calculable: false,
      openingLengthCm,
      bandLengthCm,
      openingToBandRatio: null,
      requiredStretchPercent: null,
      issues,
    };
  }

  const openingToBandRatio = openingLengthCm / bandLengthCm;
  if (!Number.isFinite(openingToBandRatio) || openingToBandRatio <= 0) {
    return {
      calculable: false,
      openingLengthCm,
      bandLengthCm,
      openingToBandRatio: null,
      requiredStretchPercent: null,
      issues: [{
        field: "calculation",
        code: "unrepresentable",
        message: "Opening divided by band length is outside the representable positive number range; review both lengths.",
      }],
    };
  }

  const requiredStretchPercent = (openingToBandRatio - 1) * 100;
  if (!Number.isFinite(requiredStretchPercent)) {
    return {
      calculable: false,
      openingLengthCm,
      bandLengthCm,
      openingToBandRatio: null,
      requiredStretchPercent: null,
      issues: [{
        field: "calculation",
        code: "unrepresentable",
        message: "The implied stretch percentage is outside the representable number range; review both lengths.",
      }],
    };
  }

  return {
    calculable: true,
    openingLengthCm,
    bandLengthCm,
    openingToBandRatio,
    requiredStretchPercent,
    issues: [],
  };
}
