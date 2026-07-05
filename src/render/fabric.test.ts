import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { renderFabricNest, NestPlacement } from "./fabric";

const placed: NestPlacement[] = [
  { name: "front", cut: [point(1, 1), point(11, 1), point(11, 21), point(1, 21)] },
];

describe("renderFabricNest", () => {
  it("draws an SVG sheet with the piece outline and label", () => {
    const svg = renderFabricNest(placed, 150, 30, 0.42, true);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('viewBox="0 0 150 40"'); // 30 length + 10 caption
    expect(svg).toContain("<path");
    expect(svg).toContain(">FRONT<");
  });

  it("captions the fabric length and utilization", () => {
    const svg = renderFabricNest(placed, 150, 30, 0.42, true);
    expect(svg).toContain("150 cm wide");
    expect(svg).toContain("needs 30.0 cm");
    expect(svg).toContain("42% used");
  });

  it("warns when a piece does not fit the fabric", () => {
    const svg = renderFabricNest(placed, 8, 30, 0.42, false);
    expect(svg).toContain("wider than this fabric");
  });

  it("omits the warning when everything fits", () => {
    const svg = renderFabricNest(placed, 150, 30, 0.42, true);
    expect(svg).not.toContain("wider than this fabric");
  });
});
