import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { renderBody } from "./body";

const svg = renderBody(STANDARD_M);

const viewBoxOf = (s: string): number[] =>
  s.match(/viewBox="([-\d. ]+)"/)![1].split(" ").map(Number);

describe("renderBody", () => {
  it("returns a self-contained SVG with a viewBox", () => {
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain("viewBox=");
  });

  it("draws a torso plus two arms (at least three paths)", () => {
    expect(svg.match(/<path/g)!.length).toBeGreaterThanOrEqual(3);
  });

  it("labels every raw measured input on the body", () => {
    expect(svg).toContain("Shoulder 45");
    expect(svg).toContain("Chest 100");
    expect(svg).toContain("Length 70");
    expect(svg).toContain("Armhole depth 24");
    expect(svg).toContain("Sleeve 22");
    expect(svg).toContain("Bicep 38");
  });

  it("marks only the girth inputs (chest, bicep) as '(circ)', not the linear ones", () => {
    expect(svg).toContain("Chest 100 (circ)");
    expect(svg).toContain("Bicep 38 (circ)");
    expect(svg).not.toContain("Length 70 (circ)");
    // exactly the two circumference labels carry the marker
    expect(svg.match(/\(circ\)/g)!.length).toBe(2);
  });

  it("carries a faint head placeholder (orientation only, no data)", () => {
    expect(svg).toContain("<circle");
    expect(svg).toContain('stroke-opacity="0.5"');
  });

  it("scales the figure with the measurements — a longer body is taller", () => {
    const short = viewBoxOf(renderBody({ ...STANDARD_M, length: 60 }));
    const long = viewBoxOf(renderBody({ ...STANDARD_M, length: 90 }));
    expect(long[3]).toBeGreaterThan(short[3]); // viewBox height
  });
});
