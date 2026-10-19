import type { Measurements } from "./measurements";

export type LowerBodyUpperMeasurements = Pick<
  Measurements,
  "waist" | "hip" | "ease" | "crotchDepth"
>;

export interface LowerBodyUpperOptions {
  readonly frontRiseEase: number;
  readonly backRiseEase: number;
  readonly waistbandDepth: number;
}

export interface LowerBodyUpperMetrics {
  readonly finishedWaist: number;
  readonly finishedSeat: number;
  /** Finished-garment target supplied by the recipe; no recipe ease is added here. */
  readonly finishedThigh: number;
  readonly frontRise: number;
  readonly backRise: number;
  readonly frontCrotchY: number;
  readonly backCrotchY: number;
  readonly thighY: number;
}

/**
 * Shared waist-to-thigh calculations for lower-body blocks.
 * The caller supplies its finished-thigh target, keeping trouser thighEase
 * separate from recipes whose thigh field is already the finished target.
 */
export function lowerBodyUpperMetrics(
  measurements: LowerBodyUpperMeasurements,
  options: LowerBodyUpperOptions,
  finishedThigh: number,
): LowerBodyUpperMetrics {
  const frontRise = measurements.crotchDepth + options.frontRiseEase;
  const backRise = measurements.crotchDepth + options.backRiseEase;
  const frontCrotchY = frontRise - options.waistbandDepth;
  const backCrotchY = backRise - options.waistbandDepth;
  return {
    finishedWaist: measurements.waist + measurements.ease,
    finishedSeat: measurements.hip + measurements.ease,
    finishedThigh,
    frontRise,
    backRise,
    frontCrotchY,
    backCrotchY,
    thighY: backCrotchY + 2.5,
  };
}
