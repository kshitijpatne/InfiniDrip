import { describe, expect, it } from "vitest";
import { lowerBodyUpperMetrics } from "./lower-body-upper";

describe("shared lower-body upper metrics", () => {
  it("builds the common waist-to-thigh stations from recipe inputs", () => {
    expect(lowerBodyUpperMetrics(
      { waist: 84, hip: 100, ease: 10, crotchDepth: 27 },
      { frontRiseEase: 1, backRiseEase: 9, waistbandDepth: 4 },
      66,
    )).toEqual({
      finishedWaist: 94,
      finishedSeat: 110,
      finishedThigh: 66,
      frontRise: 28,
      backRise: 36,
      frontCrotchY: 24,
      backCrotchY: 32,
      thighY: 34.5,
    });
  });

  it("uses the caller's finished thigh target without adding trouser ease", () => {
    expect(lowerBodyUpperMetrics(
      { waist: 91, hip: 109, ease: 7, crotchDepth: 29 },
      { frontRiseEase: -2, backRiseEase: 12, waistbandDepth: 3.5 },
      68,
    )).toEqual({
      finishedWaist: 98,
      finishedSeat: 116,
      finishedThigh: 68,
      frontRise: 27,
      backRise: 41,
      frontCrotchY: 23.5,
      backCrotchY: 37.5,
      thighY: 40,
    });
  });
});
