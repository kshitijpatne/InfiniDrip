import { describe, expect, it } from "vitest";
import { patternLabelPose } from "./pattern-label-layout";

describe("pattern piece label layout", () => {
  it("keeps legacy piece labels centered at their original size", () => {
    expect(patternLabelPose("tee front", "TEE FRONT", { minX: 2, minY: 4, width: 8, height: 12 }, 1))
      .toEqual({ x: 6, y: 10, fontSize: 1, rotation: 0 });
  });

  it("moves the shorts waistband label away from its center grainline", () => {
    const pose = patternLabelPose("shorts waistband", "SHORTS WAISTBAND",
      { minX: 0, minY: 0, width: 72, height: 4 }, 1);
    expect(pose).toEqual({ x: 18, y: 2, fontSize: 1, rotation: 0 });
    expect(Math.abs(pose.x - 36)).toBeGreaterThan(17);
  });

  it.each(["shorts fly shield", "shorts fly underlap", "shorts pocket bag left", "shorts pocket bag right"])(
    "rotates and bounds %s labels inside the piece", (pieceName) => {
      const bounds = { minX: -4, minY: 2, width: 5, height: 14 };
      const label = pieceName.toUpperCase();
      const pose = patternLabelPose(pieceName, label, bounds, 2.5);
      expect(pose.rotation).toBe(90);
      expect(pose.x).toBeGreaterThan(bounds.minX);
      expect(pose.x).toBeLessThan(bounds.minX + bounds.width / 2);
      if (pieceName.includes("pocket bag")) {
        expect(pose.y).toBe(bounds.minY + bounds.height * 0.68);
        expect(label.length * pose.fontSize * 0.58).toBeLessThanOrEqual(bounds.height * 0.45 + 1e-8);
      } else {
        expect(pose.y).toBe(bounds.minY + bounds.height / 2);
        expect(label.length * pose.fontSize * 0.58).toBeLessThanOrEqual(bounds.height - 1 + 1e-8);
      }
      expect(pose.fontSize).toBeGreaterThan(0);
      expect(pose.fontSize).toBeLessThanOrEqual(2.5);
    },
  );
});
