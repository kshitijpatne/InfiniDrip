// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { STANDARD_M, Measurements } from "../drafting";
import { renderSkirtGarment, renderSkirtBody } from "./skirt-figure";

const parse = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");
const wellFormed = (svg: string): Document => {
  const doc = parse(svg);
  expect(doc.querySelector("parsererror")).toBeNull();
  return doc;
};

// ── reading the DRAWING, not the formula ──────────────────────────────────────
// Everything below measures the emitted `d` string. That is the whole point: the
// Slice 43 silhouette bug (the left leg traced in the wrong direction, so the
// outline never visited the left hip) passed every "is it the right width / the
// right height" test, because the outer envelope was still correct on a broken
// path. Only parsing the path finds it.

type Pt = { x: number; y: number };

/** The ON-PATH points of a path: the M and L targets and the endpoint of each C.
 *  Control points are deliberately excluded — a hip that only appears as a control
 *  point is not a corner of the silhouette. */
function vertices(d: string): Pt[] {
  const out: Pt[] = [];
  const tokens = d.trim().split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "M" || t === "L") {
      out.push({ x: Number(tokens[i + 1]), y: Number(tokens[i + 2]) });
      i += 2;
    } else if (t === "C") {
      out.push({ x: Number(tokens[i + 5]), y: Number(tokens[i + 6]) });
      i += 6;
    }
  }
  return out;
}

const cubic = (a: number, b: number, c: number, e: number, t: number): number => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * e;
};

/** Every point the outline actually passes through, curves sampled. */
function flatten(d: string, steps = 24): Pt[] {
  const out: Pt[] = [];
  const tokens = d.trim().split(/\s+/);
  let cur: Pt = { x: 0, y: 0 };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === "M" || t === "L") {
      cur = { x: Number(tokens[i + 1]), y: Number(tokens[i + 2]) };
      out.push(cur);
      i += 2;
    } else if (t === "C") {
      const n = tokens.slice(i + 1, i + 7).map(Number);
      const [c1x, c1y, c2x, c2y, ex, ey] = n as [number, number, number, number, number, number];
      for (let s = 1; s <= steps; s++) {
        const u = s / steps;
        out.push({ x: cubic(cur.x, c1x, c2x, ex, u), y: cubic(cur.y, c1y, c2y, ey, u) });
      }
      cur = { x: ex, y: ey };
      i += 6;
    }
  }
  return out;
}

const pathOf = (svg: string, part: string): string =>
  wellFormed(svg).querySelector(`[data-part="${part}"]`)!.getAttribute("d")!;

const silhouette = (m: Measurements): string => pathOf(renderSkirtBody(m), "silhouette");

const has = (pts: Pt[], x: number, y: number, tol = 0.01): boolean =>
  pts.some((p) => Math.abs(p.x - x) < tol && Math.abs(p.y - y) < tol);

/** The drawn half-width at a given height, read off the flattened outline. */
function halfWidthAt(pts: Pt[], y: number, tol = 0.35): number {
  const band = pts.filter((p) => Math.abs(p.y - y) < tol);
  expect(band.length).toBeGreaterThan(0);
  return Math.max(...band.map((p) => Math.abs(p.x)));
}

const viewBoxOf = (svg: string): number[] =>
  wellFormed(svg).querySelector("svg")!.getAttribute("viewBox")!.split(/\s+/).map(Number);

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
    const panelWidth = (m: Measurements): number => {
      const doc = wellFormed(renderSkirtGarment(m, "#3A4150"));
      const panel = [...doc.querySelectorAll("path")].find((p) => p.getAttribute("fill") === "#3A4150")!;
      const xs = vertices(panel.getAttribute("d")!).map((p) => p.x);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(panelWidth({ ...STANDARD_M, hip: 130 })).toBeGreaterThan(panelWidth(STANDARD_M));
  });
});

describe("renderSkirtBody (annotated body view)", () => {
  const svg = renderSkirtBody(STANDARD_M);

  it("is well-formed SVG", () => {
    wellFormed(svg);
  });

  it("marks a dimension line for each raw skirt input, and none for ease", () => {
    const doc = wellFormed(svg);
    for (const field of ["waist", "hip", "hipDepth", "length"]) {
      expect(doc.querySelector(`[data-dim="${field}"]`)).not.toBeNull();
    }
    expect(doc.querySelector('[data-dim="ease"]')).toBeNull(); // ease isn't a body measurement
    expect(svg).toContain("(circ)"); // girths are labelled as circumference, honestly
  });

  it("prints the live value in every dimension label", () => {
    const m: Measurements = { ...STANDARD_M, waist: 77, hip: 111, hipDepth: 23, length: 63 };
    const out = renderSkirtBody(m);
    expect(out).toContain("Waist 77 (circ)");
    expect(out).toContain("Hip 111 (circ)");
    expect(out).toContain("Hip depth 23");
    expect(out).toContain("Length 63");
  });

  it("tags the silhouette 'figure' and gives each measurement its own edge group", () => {
    const doc = wellFormed(svg);
    expect(doc.querySelector('[data-edge="figure"]')).not.toBeNull();
    for (const field of ["waist", "hipDepth", "length"]) {
      const g = doc.querySelector(`[data-edge="${field}"]`)!;
      expect([...g.querySelectorAll("line")].length).toBeGreaterThan(0);
    }
    // The hip is shaped by two CURVED seams, so its overlay is paths, not lines.
    const hip = doc.querySelector('[data-edge="hip"]')!;
    expect([...hip.querySelectorAll("path")]).toHaveLength(2);
  });

  it("draws a body and drapes cloth over it — two distinct shapes", () => {
    const doc = wellFormed(svg);
    const figure = doc.querySelector('[data-edge="figure"]')!;
    expect(figure.querySelector('[data-part="silhouette"]')).not.toBeNull();
    expect(figure.querySelector('[data-part="cloth"]')).not.toBeNull();
    expect(pathOf(svg, "cloth")).not.toBe(pathOf(svg, "silhouette"));
  });
});

// ── the Slice 43 guardrails, both mutation-tested ─────────────────────────────
// The bug: the left leg was emitted forwards, so the outline ran
// waist → right hip → right leg → crotch → left leg-from-the-crotch-outward, then
// jumped straight home to the waist — never touching the left hip. Reintroducing
// it makes BOTH of these fail; the envelope tests below it stay green.

describe("the silhouette is a correctly-traced closed outline (Slice 43)", () => {
  it("traces BOTH hip points as real on-path vertices", () => {
    for (const [waist, hip, hipDepth] of [[84, 100, 20], [70, 92, 14], [120, 125, 32]]) {
      const d = silhouette({ ...STANDARD_M, waist, hip, hipDepth });
      const v = vertices(d);
      const hipHalf = halfWidthAt(flatten(d), hipDepth);
      expect(has(v, hipHalf, hipDepth, 0.05)).toBe(true);  // right hip
      expect(has(v, -hipHalf, hipDepth, 0.05)).toBe(true); // LEFT hip — the bug
    }
  });

  it("is mirror-symmetric about the centre line", () => {
    const pts = flatten(silhouette(STANDARD_M));
    for (const p of pts) {
      expect(pts.some((q) => Math.abs(q.x + p.x) < 0.02 && Math.abs(q.y - p.y) < 0.02)).toBe(true);
    }
  });

  it("closes: the last vertex returns to the first", () => {
    const v = vertices(silhouette(STANDARD_M));
    expect(silhouette(STANDARD_M).trim().endsWith("Z")).toBe(true);
    expect(v[v.length - 1]).toEqual(v[0]);
  });
});

describe("the figure is a lower body, drawn only where there is a number (Slice 43)", () => {
  it("draws nothing above the waist line — no head, no shoulder stub", () => {
    for (const p of flatten(silhouette(STANDARD_M))) expect(p.y).toBeGreaterThanOrEqual(-0.001);
    expect(wellFormed(renderSkirtBody(STANDARD_M)).querySelector("circle")).toBeNull();
  });

  it("the waist is the narrowest point and the hip the widest (measured off the path)", () => {
    const pts = flatten(silhouette(STANDARD_M));
    const atWaist = halfWidthAt(pts, 0);
    const atHip = halfWidthAt(pts, STANDARD_M.hipDepth);
    expect(atHip).toBeGreaterThan(atWaist);
    expect(Math.max(...pts.map((p) => Math.abs(p.x)))).toBeCloseTo(atHip, 2);
  });

  it("has legs that outrun the longest hem the slider allows, so a hem always lands on a body", () => {
    const deepest = Math.max(...flatten(silhouette(STANDARD_M)).map((p) => p.y));
    expect(deepest).toBeGreaterThan(100); // the length slider maxes at 100
    for (const length of [40, 70, 100]) {
      const hem = Math.max(...flatten(pathOf(renderSkirtBody({ ...STANDARD_M, length }), "cloth"))
        .map((p) => p.y));
      expect(hem).toBeCloseTo(length, 3);
      expect(hem).toBeLessThan(deepest);
    }
  });

  it("has a crotch below the hip line, so the legs are separate below it", () => {
    for (const hipDepth of [12, 20, 35]) {
      const v = vertices(silhouette({ ...STANDARD_M, hipDepth }));
      const centre = v.filter((p) => Math.abs(p.x) < 0.001 && p.y > 0);
      expect(centre).toHaveLength(1);            // exactly one crotch point
      expect(centre[0].y).toBeGreaterThan(hipDepth);
    }
  });

  it("keeps the cloth outside the body at the waist and the hip", () => {
    const body = flatten(silhouette(STANDARD_M));
    const cloth = flatten(pathOf(renderSkirtBody(STANDARD_M), "cloth"));
    expect(halfWidthAt(cloth, 0)).toBeGreaterThan(halfWidthAt(body, 0));
    expect(halfWidthAt(cloth, STANDARD_M.hipDepth))
      .toBeGreaterThan(halfWidthAt(body, STANDARD_M.hipDepth));
  });

  it("fits everything it draws inside its own viewBox", () => {
    // A waist wider than the hip is reachable (and warned) — the gutter must still clear.
    for (const m of [STANDARD_M, { ...STANDARD_M, waist: 140, hip: 60 }, { ...STANDARD_M, hip: 150 }]) {
      const svg = renderSkirtBody(m);
      const [vx, vy, vw, vh] = viewBoxOf(svg);
      for (const part of ["silhouette", "cloth"]) {
        for (const p of flatten(pathOf(svg, part))) {
          expect(p.x).toBeGreaterThanOrEqual(vx);
          expect(p.x).toBeLessThanOrEqual(vx + vw);
          expect(p.y).toBeGreaterThanOrEqual(vy);
          expect(p.y).toBeLessThanOrEqual(vy + vh);
        }
      }
    }
  });

  it("keeps the dimension gutters clear of the figure, even when the waist is wider than the hip", () => {
    // Reachable (and warned) state: waist 140 / hip 60 makes the CLOTH AT THE WAIST
    // the widest thing drawn, not the cloth at the hip. Sizing the gutter off the hip
    // alone runs the figure straight through its own dimension lines.
    for (const m of [STANDARD_M, { ...STANDARD_M, waist: 140, hip: 60 }]) {
      const svg = renderSkirtBody(m);
      const drawn = [...flatten(pathOf(svg, "silhouette")), ...flatten(pathOf(svg, "cloth"))];
      const widest = Math.max(...drawn.map((p) => Math.abs(p.x)));
      const doc = wellFormed(svg);
      for (const field of ["hipDepth", "length"]) {
        const spine = doc.querySelector(`[data-dim="${field}"] line`)!;
        expect(Math.abs(Number(spine.getAttribute("x1")))).toBeGreaterThan(widest);
      }
    }
  });

  it("stays well-formed across the whole slider range, warned states included", () => {
    for (const waist of [50, 140]) {
      for (const hip of [60, 150]) {
        for (const hipDepth of [10, 40]) {
          for (const length of [40, 100]) {
            wellFormed(renderSkirtBody({ ...STANDARD_M, waist, hip, hipDepth, length }));
          }
        }
      }
    }
  });
});

// Slice 42: HIP_DROP = 20 was duplicated in this module and in drafting/skirt.ts.
// Both figures now read m.hipDepth. The gate parses the emitted path and MEASURES
// the y-coordinate of the hip vertex — it never re-derives what the code wrote.
describe("both figures track the real hipDepth measurement (Slice 42)", () => {
  it("the assembled panel puts its hip vertex at m.hipDepth", () => {
    for (const hipDepth of [14, 20, 30]) {
      const doc = wellFormed(renderSkirtGarment({ ...STANDARD_M, hipDepth }, "#3A4150"));
      const panel = [...doc.querySelectorAll("path")].find((p) => p.getAttribute("fill") === "#3A4150")!;
      const first = vertices(panel.getAttribute("d")!).find((p) => p.y > 0)!;
      expect(first.y).toBeCloseTo(hipDepth, 3);
    }
  });

  it("the body figure puts BOTH hip vertices at m.hipDepth", () => {
    for (const hipDepth of [14, 20, 30]) {
      const d = silhouette({ ...STANDARD_M, hipDepth });
      const hipHalf = halfWidthAt(flatten(d), hipDepth);
      const atHip = vertices(d).filter((p) => Math.abs(Math.abs(p.x) - hipHalf) < 0.05);
      expect(atHip).toHaveLength(2);
      for (const p of atHip) expect(p.y).toBeCloseTo(hipDepth, 3);
    }
  });

  it("the body figure gives hipDepth its own dimension line, measured to the hip", () => {
    for (const hipDepth of [14, 20, 30]) {
      const doc = wellFormed(renderSkirtBody({ ...STANDARD_M, hipDepth }));
      const g = doc.querySelector('[data-dim="hipDepth"]')!;
      const spine = [...g.querySelectorAll("line")][0];
      expect(Number(spine.getAttribute("y1"))).toBeCloseTo(0, 3);
      expect(Number(spine.getAttribute("y2"))).toBeCloseTo(hipDepth, 3);
      expect(g.querySelector("text")!.textContent).toBe(`Hip depth ${hipDepth}`);
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
