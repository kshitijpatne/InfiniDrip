import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { lineMark, pointMark } from "../drafting";
import { JOGGER_CASING_MARK_LABEL_OFFSETS, patternMarksSvg } from "./pattern-mark";

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

  it("can move compact-mark labels beside their geometry", () => {
    const svg = patternMarksSvg([
      lineMark("cutLine", "slit", point(0, 0), point(0, 14), "CUT SLIT"),
      pointMark("button", "button-1", point(3, 4), "BUTTON 1"),
    ], { ...STYLE, labelPlacement: "offset" });
    expect(svg).toContain('text-anchor="start"');
    expect(svg).toContain('font-size="1.6"');
  });

  it("applies mark-specific offsets and anchors without moving source geometry", () => {
    const svg = patternMarksSvg([
      lineMark("placementLine", "elasticChannelTop", point(0, 2), point(20, 2), "elastic channel top"),
      pointMark("buttonhole", "drawcordExitLeft", point(8, 3), "drawcord exit left"),
    ], {
      ...STYLE,
      labelOffsets: {
        elasticChannelTop: { dx: -5, dy: 1 },
        drawcordExitLeft: { dx: -1, dy: -2, anchor: "end" },
      },
    });
    expect(svg).toContain('x1="0" y1="2"');
    expect(svg).toContain('x="5" y="2.5"');
    expect(svg).toContain('text-anchor="middle">elastic channel top</text>');
    expect(svg).toContain('x="7" y="0.15"');
    expect(svg).toContain('text-anchor="end">drawcord exit left</text>');
  });

  it("keeps Jogger channel labels away from the two center-front exits", () => {
    const svg = patternMarksSvg([
      lineMark("placementLine", "drawcordChannelTop", point(0, 4.5), point(94, 4.5), "drawcord channel top"),
      lineMark("placementLine", "drawcordChannelBottom", point(0, 5.3), point(94, 5.3), "drawcord channel bottom"),
      pointMark("buttonhole", "drawcordExitLeft", point(44, 4.9), "drawcord exit left"),
      pointMark("buttonhole", "drawcordExitRight", point(50, 4.9), "drawcord exit right"),
    ], { ...STYLE, labelSize: 0.8, labelOffsets: JOGGER_CASING_MARK_LABEL_OFFSETS });
    expect(svg).toContain('<text x="22" y="4"');
    expect(svg).toContain('text-anchor="middle">drawcord channel top</text>');
    expect(svg).toContain('<text x="72" y="4.8"');
    expect(svg).toContain('x="43" y="4.05"');
    expect(svg).toContain('text-anchor="end">drawcord exit left</text>');
    expect(svg).toContain('x="51" y="4.05"');
    expect(svg).toContain('text-anchor="start">drawcord exit right</text>');
  });
});
