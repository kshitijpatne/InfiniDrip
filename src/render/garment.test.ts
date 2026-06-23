import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { renderGarment, FABRICS, DEFAULT_FABRIC } from "./garment";

describe("FABRICS", () => {
  it("offers a few fabric colours", () => {
    expect(FABRICS.length).toBeGreaterThan(2);
  });
  it("uses a real fabric colour as the default", () => {
    expect(FABRICS.map((f) => f.color)).toContain(DEFAULT_FABRIC);
  });
});

describe("renderGarment", () => {
  const svg = renderGarment(STANDARD_M, "#123456");
  it("produces one svg", () => {
    expect(svg.startsWith("<svg")).toBe(true);
  });
  it("draws the front and back silhouettes", () => {
    expect((svg.match(/<g transform/g) || []).length).toBe(2);
    expect(svg).toContain(">FRONT<");
    expect(svg).toContain(">BACK<");
  });
  it("fills the garment with the chosen fabric colour", () => {
    expect(svg).toContain('fill="#123456"');
  });
});
