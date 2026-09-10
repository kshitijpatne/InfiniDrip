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

describe("renderGarment — sleeveless (Slice 60)", () => {
  const withSleeve = renderGarment(STANDARD_M, "#123456", true);
  const withoutSleeve = renderGarment(STANDARD_M, "#123456", false);

  it("still produces a valid svg with both silhouettes", () => {
    expect(withoutSleeve.startsWith("<svg")).toBe(true);
    expect(withoutSleeve).toContain(">FRONT<");
    expect(withoutSleeve).toContain(">BACK<");
  });

  it("draws a narrower figure than the sleeved version — no sleeve extending outward", () => {
    const widthOf = (svg: string): number => {
      const m = svg.match(/viewBox="0 0 ([\d.]+)/)!;
      return parseFloat(m[1]);
    };
    expect(widthOf(withoutSleeve)).toBeLessThan(widthOf(withSleeve));
  });

  it("draws no dashed armhole seam — a sleeveless armhole is a finished edge, not a seam", () => {
    expect(withSleeve).toContain("stroke-dasharray");
    expect(withoutSleeve).not.toContain("stroke-dasharray");
  });

  it("defaults hasSleeve to true when omitted", () => {
    expect(renderGarment(STANDARD_M, "#123456")).toEqual(withSleeve);
  });
});
