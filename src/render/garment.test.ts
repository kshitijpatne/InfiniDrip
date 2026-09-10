import { describe, it, expect } from "vitest";
import { STANDARD_M, derive, necklineEdge, NECKLINE_DEFAULT } from "../drafting";
import { tankFrontNeckline, tankBackNeckline } from "../drafting/tank";
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

describe("renderGarment — real neckline sync (Slice 61)", () => {
  const pathsOf = (svg: string): string[] => [...svg.matchAll(/<path d="([^"]+)"/g)].map((mm) => mm[1]);

  it("draws the front collar from the real necklineEdge(), not a fixed placeholder", () => {
    const d = derive(STANDARD_M);
    const { cNeck, hps } = necklineEdge(
      "front", d.neckWidthHalf, d.frontNeckDepth, d.shoulderHalf, STANDARD_M.armholeDepth, NECKLINE_DEFAULT);
    const [frontD] = pathsOf(renderGarment(STANDARD_M, "#123456"));
    expect(frontD).toContain(`${hps.x} 0`);
    expect(frontD).toContain(`0 ${cNeck.y}`);
    expect(frontD).toContain("C "); // real cubic curve, not the old "Q" placeholder
  });

  it("changing only the FRONT neckline shape moves only the front path, not the back's", () => {
    const [front1, back1] = pathsOf(renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT));
    const [front2, back2] = pathsOf(renderGarment(STANDARD_M, "#123456", true, tankFrontNeckline(STANDARD_M), NECKLINE_DEFAULT));
    expect(front2).not.toBe(front1); // the shape that changed
    expect(back2).toBe(back1);       // the shape that didn't
  });

  it("defaults both necklines to crew (NECKLINE_DEFAULT) when omitted", () => {
    expect(renderGarment(STANDARD_M, "#123456", true))
      .toEqual(renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT));
  });
});

describe("renderGarment — real strap position for a sleeveless garment (Slice 63)", () => {
  const pathsOf = (svg: string): string[] => [...svg.matchAll(/<path d="([^"]+)"/g)].map((mm) => mm[1]);

  it("draws BOTH front and back shoulder corners at the REAL strapWidth, not the full sleeved shoulder point", () => {
    const [front, back] = pathsOf(renderGarment(
      STANDARD_M, "#123456", false, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M), 15));
    expect(front).toContain("15 4"); // strapX at derive()'s shoulderSlope
    expect(back).toContain("15 4");
    expect(front).not.toContain("22.5 4"); // NOT the full sleeved shoulderHalf
  });

  it("defaults to the full sleeved shoulder point when strapWidth is omitted — byte-identical to before Slice 63", () => {
    expect(renderGarment(STANDARD_M, "#123456", true, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M)))
      .toEqual(renderGarment(
        STANDARD_M, "#123456", true, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M), undefined));
  });

  it("moves the drawn strap point when strapWidth changes", () => {
    const [narrow] = pathsOf(renderGarment(
      STANDARD_M, "#123456", false, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M), 12));
    const [wide] = pathsOf(renderGarment(
      STANDARD_M, "#123456", false, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M), 20));
    expect(narrow).not.toBe(wide);
  });
});
