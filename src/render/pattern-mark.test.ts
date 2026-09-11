import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { lineMark, pointMark } from "../drafting";
import { patternMarksSvg } from "./pattern-mark";

const STYLE = { stroke: "#000", width: 0.2 };

describe("patternMarksSvg", () => {
  it("does nothing for no marks", () => {
    expect(patternMarksSvg(undefined, STYLE)).toBe("");
  });

  it("draws every line and point kind with semantic data attributes", () => {
    const svg = patternMarksSvg([
      lineMark("cutLine", "slit", point(0, 0), point(0, 14), "CUT SLIT"),
      lineMark("foldLine", "fold", point(1, 0), point(1, 14)),
      lineMark("placementLine", "attach", point(2, 0), point(2, 14), "ATTACH"),
      pointMark("button", "button-1", point(3, 4), "BUTTON 1"),
      pointMark("buttonhole", "hole-1", point(3, 7)),
      pointMark("placementPoint", "point", point(3, 10), "POINT"),
    ], STYLE, 5, 6);
    expect(svg).toContain('data-pattern-mark="cutLine"');
    expect(svg).toContain('stroke-dasharray="3 1.5"');
    expect(svg).toContain('stroke-dasharray="1.5 1.5"');
    expect(svg).toContain('stroke-dasharray="0.8 1.2"');
    expect(svg).toContain('<circle');
    expect(svg).toContain('data-pattern-mark="buttonhole"');
    expect(svg).toContain("CUT SLIT");
    expect(svg).toContain('x1="5"');
  });
});
