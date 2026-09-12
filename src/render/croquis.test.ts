// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { derive, necklineEdge, NECKLINE_DEFAULT, STANDARD_M } from "../drafting";
import { tankFrontNeckline } from "../drafting/tank";
import { croquisPath, lowerCroquisPath, upperCroquisFigure, upperCroquisPath } from "./croquis";

describe("croquis library", () => {
  it.each(["front", "side", "back"] as const)("provides an upper %s figure", (view) => {
    const path = upperCroquisPath(STANDARD_M, view);
    expect(path.startsWith("M ")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it.each(["front", "side", "back"] as const)("provides a lower %s figure", (view) => {
    const path = lowerCroquisPath(STANDARD_M, view);
    expect(path.startsWith("M ")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("dispatches by region without conflating upper and lower figures", () => {
    expect(croquisPath("upper", STANDARD_M, "front")).toBe(upperCroquisPath(STANDARD_M, "front"));
    expect(croquisPath("lower", STANDARD_M, "front")).toBe(lowerCroquisPath(STANDARD_M, "front"));
    expect(croquisPath("upper", STANDARD_M, "front")).not.toBe(croquisPath("lower", STANDARD_M, "front"));
  });

  it("keeps side geometry distinct from the front/back envelope", () => {
    expect(upperCroquisPath(STANDARD_M, "side")).not.toBe(upperCroquisPath(STANDARD_M, "front"));
    expect(lowerCroquisPath(STANDARD_M, "side")).not.toBe(lowerCroquisPath(STANDARD_M, "back"));
  });

  it("exposes the figure paths and anchors used by the annotated upper Body view", () => {
    const d = derive(STANDARD_M);
    const neckline = necklineEdge(
      "front", d.neckWidthHalf, d.frontNeckDepth, d.shoulderHalf, STANDARD_M.armholeDepth, NECKLINE_DEFAULT);
    const figure = upperCroquisFigure(STANDARD_M, "front", { neckline });

    expect(figure.armPaths).toHaveLength(2);
    expect(figure.armhole).toBeNull();
    expect(figure.anchors.bodyHalf).toBe(d.chestWidthHalf);
    expect(figure.anchors.neckHalf).toBe(neckline.hps.x);
    expect(upperCroquisPath(STANDARD_M, "front", { neckline }))
      .toBe([figure.torsoPath, ...figure.armPaths].join(" "));
  });

  it("builds a sleeveless figure with the real strap and armhole geometry", () => {
    const d = derive(STANDARD_M);
    const neckline = necklineEdge(
      "front", d.neckWidthHalf, d.frontNeckDepth, d.shoulderHalf, STANDARD_M.armholeDepth,
      tankFrontNeckline(STANDARD_M));
    const figure = upperCroquisFigure(STANDARD_M, "front", {
      hasSleeve: false, strapWidth: 8, neckline,
    });

    expect(figure.armPaths).toEqual([]);
    expect(figure.armhole?.kind).toBe("curve");
    expect(figure.anchors.strapX).toBe(15);
    expect(figure.torsoPath).toContain("C 13.75 9 20 19 27.5 24");
  });
});
