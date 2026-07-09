import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { gradeRun, TSHIRT_GRADE, TSHIRT_SIZES, draftTshirt } from "../drafting";
import { renderNest } from "./nest";

const run = gradeRun(STANDARD_M, TSHIRT_GRADE, TSHIRT_SIZES, draftTshirt);

describe("renderNest", () => {
  const svg = renderNest(run);

  it("is one Blueprint-themed SVG", () => {
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("viewBox");
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);
  });

  it("has a column title for each piece type", () => {
    expect(svg).toContain(">FRONT<");
    expect(svg).toContain(">BACK<");
    expect(svg).toContain(">SLEEVE<");
  });

  it("draws one outline ring per size, per piece (5 sizes × 3 pieces = 15 paths)", () => {
    expect((svg.match(/<path /g) || []).length).toBe(15);
  });

  it("labels every size in the legend and marks the base", () => {
    expect(svg).toContain(">XS<");
    expect(svg).toContain(">XL<");
    expect(svg).toContain("M (base)");
  });

  it("emphasises the base size with a heavier stroke", () => {
    expect(svg).toContain('stroke-width="2.2"');
  });

  it("handles a single-size run without dividing by zero in the colour ramp", () => {
    const one = gradeRun(STANDARD_M, TSHIRT_GRADE, [{ label: "M", step: 0 }], draftTshirt);
    const single = renderNest(one);
    expect(single.startsWith("<svg")).toBe(true);
    expect((single.match(/<path /g) || []).length).toBe(3); // 1 size × 3 pieces
  });
});
