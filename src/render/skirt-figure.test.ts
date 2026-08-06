// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { renderSkirtGarment, renderSkirtBody } from "./skirt-figure";

const parse = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");
const wellFormed = (svg: string): Document => {
  const doc = parse(svg);
  expect(doc.querySelector("parsererror")).toBeNull();
  return doc;
};

describe("renderSkirtGarment (assembled view)", () => {
  const svg = renderSkirtGarment(STANDARD_M, "#3A4150");

  it("is well-formed SVG with a viewBox", () => {
    wellFormed(svg);
    expect(svg).toContain("viewBox=");
  });

  it("draws two panels (front + back) filled in the fabric colour, with no tee geometry", () => {
    const doc = wellFormed(svg);
    const panels = [...doc.querySelectorAll("path")].filter((p) => p.getAttribute("fill") === "#3A4150");
    expect(panels).toHaveLength(2);
    expect(svg).toContain(">FRONT<");
    expect(svg).toContain(">BACK<");
    expect(svg).not.toMatch(/Q /); // no neckline scoop — it isn't a tee
  });

  it("responds to the hip — the assembled view widens as the hip grows (the s38 bug)", () => {
    const wide = renderSkirtGarment({ ...STANDARD_M, hip: 130 }, "#3A4150");
    expect(wide).not.toBe(svg);
    const hipHalf = (h: number): number => (h + STANDARD_M.ease) / 4;
    expect(hipHalf(130)).toBeGreaterThan(hipHalf(STANDARD_M.hip));
  });
});

describe("renderSkirtBody (annotated body view)", () => {
  const svg = renderSkirtBody(STANDARD_M);

  it("is well-formed SVG", () => {
    wellFormed(svg);
  });

  it("marks a dimension line for each raw skirt input, and none for ease", () => {
    const doc = wellFormed(svg);
    for (const field of ["waist", "hip", "length"]) {
      expect(doc.querySelector(`[data-dim="${field}"]`)).not.toBeNull();
    }
    expect(doc.querySelector('[data-dim="ease"]')).toBeNull(); // ease isn't a body measurement
    expect(svg).toContain("(circ)"); // girths are labelled as circumference, honestly
  });

  it("tags the silhouette 'figure' and gives each measurement its own edge group", () => {
    const doc = wellFormed(svg);
    expect(doc.querySelector('[data-edge="figure"]')).not.toBeNull();
    for (const field of ["waist", "hip", "length"]) {
      const g = doc.querySelector(`[data-edge="${field}"]`)!;
      expect([...g.querySelectorAll("line")].length).toBeGreaterThan(0);
    }
  });

  it("tapers waist to hip (the hip is drawn wider than the waist)", () => {
    // waistHalf = waist*0.20 = 16.8, hipHalf = hip*0.22 = 22 → hip wider
    expect(STANDARD_M.hip * 0.22).toBeGreaterThan(STANDARD_M.waist * 0.2);
  });

  it("responds to the hip", () => {
    expect(renderSkirtBody({ ...STANDARD_M, hip: 130 })).not.toBe(svg);
  });
});

// Slice 42: HIP_DROP = 20 was duplicated in this module and in drafting/skirt.ts.
// Both figures now read m.hipDepth. The gate parses the emitted path and MEASURES
// the y-coordinate of the hip vertex — it never re-derives what the code wrote.
describe("both figures track the real hipDepth measurement (Slice 42)", () => {
  // The y of the first vertex the outline reaches after leaving the waist line.
  const hipVertexY = (pathD: string): number => {
    const commands = pathD.trim().split(/(?=[ML])/).map((s) => s.trim()).filter(Boolean);
    const ys = commands.map((c) => Number(c.replace(/^[ML]\s*/, "").split(/\s+/)[1]));
    return ys.find((y) => y > 0)!; // first vertex below the waist = the hip point
  };

  const bodyOutline = (svg: string): string => {
    const doc = wellFormed(svg);
    const paths = [...doc.querySelectorAll("path")];
    return paths[paths.length - 1].getAttribute("d")!;
  };

  it("the assembled panel puts its hip vertex at m.hipDepth", () => {
    for (const hipDepth of [14, 20, 30]) {
      const doc = wellFormed(renderSkirtGarment({ ...STANDARD_M, hipDepth }, "#3A4150"));
      const panel = [...doc.querySelectorAll("path")].find((p) => p.getAttribute("fill") === "#3A4150")!;
      expect(hipVertexY(panel.getAttribute("d")!)).toBeCloseTo(hipDepth, 3);
    }
  });

  it("the body figure puts its hip vertex at m.hipDepth", () => {
    for (const hipDepth of [14, 20, 30]) {
      expect(hipVertexY(bodyOutline(renderSkirtBody({ ...STANDARD_M, hipDepth })))).toBeCloseTo(hipDepth, 3);
    }
  });

  it("both figures change when hipDepth changes — the constant is really gone", () => {
    expect(renderSkirtGarment({ ...STANDARD_M, hipDepth: 30 }, "#3A4150"))
      .not.toBe(renderSkirtGarment(STANDARD_M, "#3A4150"));
    expect(renderSkirtBody({ ...STANDARD_M, hipDepth: 30 })).not.toBe(renderSkirtBody(STANDARD_M));
  });

  it("stays well-formed across the whole hipDepth range", () => {
    for (const hipDepth of [12, 20, 35]) {
      wellFormed(renderSkirtGarment({ ...STANDARD_M, hipDepth }, "#3A4150"));
      wellFormed(renderSkirtBody({ ...STANDARD_M, hipDepth }));
    }
  });
});
