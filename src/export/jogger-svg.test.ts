import { describe, expect, it } from "vitest";
import { blockPieces } from "../drafting/block";
import { STANDARD_M } from "../drafting/measurements";
import { draftJogger } from "../drafting/jogger";
import { exportSvg } from "./svg";

describe("Jogger true-scale SVG labels", () => {
  it("rotates pocket-bag names and separates casing labels around source marks", () => {
    const svg = exportSvg(blockPieces(draftJogger(STANDARD_M)), { default: 1 });
    expect(svg).toContain("JOGGER POCKET BAG LEFT");
    expect(svg).toContain("JOGGER POCKET BAG RIGHT");
    expect(svg.match(/transform="rotate\(90 /gu)).toHaveLength(2);
    expect(svg).toContain('data-pattern-mark-name="elasticChannelTop"');
    expect(svg).toContain("elastic channel top");
    expect(svg).toContain("elastic channel bottom");
    expect(svg).toContain("drawcord channel top");
    expect(svg).toContain("drawcord channel bottom");
    expect(svg).toContain("drawcord exit left");
    expect(svg).toContain("drawcord exit right");
    expect(svg).toContain("centre-back drawcord retention");
    expect(svg).toContain("JOGGER WAISTBAND CASING");
  });
});
