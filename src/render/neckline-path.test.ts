import { describe, it, expect } from "vitest";
import { necklineEdge, NECKLINE_DEFAULT } from "../drafting";
import { necklinePathCommand } from "./neckline-path";

describe("necklinePathCommand", () => {
  it("emits two mirrored cubic curves for a curved shape (crew/scoop) — left half then right half", () => {
    const { cNeck, hps, edge } = necklineEdge("front", 7, 8, 22.5, 24, NECKLINE_DEFAULT);
    const cmd = necklinePathCommand(cNeck, hps, edge);
    const parts = cmd.split(/(?=C )/).filter(Boolean);
    expect(parts).toHaveLength(2);
    expect(parts[0].startsWith("C ")).toBe(true);
    expect(parts[1].startsWith("C ")).toBe(true);
    // both halves land on the shared centre-front point and the (mirrored) shoulder point
    expect(parts[0]).toContain(`${cNeck.x} ${cNeck.y}`);
    expect(parts[1]).toContain(`${hps.x} ${hps.y}`);
  });

  it("emits two straight lines for a V (left leg then right leg), not a curve", () => {
    const { cNeck, hps, edge } = necklineEdge(
      "front", 7, 8, 22.5, 24, { shape: "v", widthEase: 0, frontDrop: 0 });
    const cmd = necklinePathCommand(cNeck, hps, edge);
    expect(cmd).not.toContain("C ");
    expect(cmd).toBe(`L ${cNeck.x} ${cNeck.y} L ${hps.x} ${hps.y}`);
  });

  it("mirrors the curve's control points in x for the left half, keeps y", () => {
    const { cNeck, hps, edge } = necklineEdge("front", 7, 8, 22.5, 24, NECKLINE_DEFAULT);
    if (edge.kind !== "curve") throw new Error("expected a curve for the default crew shape");
    const cmd = necklinePathCommand(cNeck, hps, edge);
    const leftHalf = cmd.split(/(?=C )/)[0];
    // necklinePathCommand rounds to 3 decimals internally — round the same
    // way here, or an irrational-ish product like 7 * 0.5523 (control point
    // coordinates aren't always "nice" numbers any more) mismatches on the
    // digits the render function already trimmed off.
    const round = (n: number): number => Math.round(n * 1000) / 1000;
    expect(leftHalf).toContain(`${round(-edge.curve.control2.x)} ${round(edge.curve.control2.y)}`);
    expect(leftHalf).toContain(`${round(-edge.curve.control1.x)} ${round(edge.curve.control1.y)}`);
  });
});
