// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { STANDARD_M, derive, necklineEdge, NECKLINE_DEFAULT } from "../drafting";
import { tankFrontNeckline, tankBackNeckline } from "../drafting/tank";
import { renderBody, renderBodyPair } from "./body";
import { upperCroquisFigure } from "./croquis";

const svg = renderBody(STANDARD_M);

const viewBoxOf = (s: string): number[] =>
  s.match(/viewBox="([-\d. ]+)"/)![1].split(" ").map(Number);

describe("renderBody", () => {
  it("renders front and back figures together for Body view", () => {
    const pair = renderBodyPair(STANDARD_M, false, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M), STANDARD_M.strapWidth);
    expect(pair).toContain(">Front<");
    expect(pair).toContain(">Back<");
    expect((pair.match(/<svg/g) ?? []).length).toBe(2);
  });
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

  it("takes its torso and arm paths from the shared upper croquis contract", () => {
    const d = derive(STANDARD_M);
    const neckline = necklineEdge(
      "front", d.neckWidthHalf, d.frontNeckDepth, d.shoulderHalf, STANDARD_M.armholeDepth, NECKLINE_DEFAULT);
    const figure = upperCroquisFigure(STANDARD_M, "front", { neckline });
    const paths = [...new DOMParser().parseFromString(svg, "image/svg+xml").querySelectorAll("path")]
      .map((p) => p.getAttribute("d"));

    expect(paths).toEqual([...figure.armPaths, figure.torsoPath]);
  });
});

describe("renderBody — measurement linking", () => {
  it("wraps each dimension in a group tagged with its measurement field", () => {
    for (const field of ["chest", "shoulderWidth", "length", "armholeDepth", "sleeveLength", "bicep"]) {
      expect(svg).toContain(`data-dim="${field}"`);
    }
  });

  it("has one tagged group per raw input (six), and none for ease", () => {
    expect(svg.match(/data-dim="/g)!.length).toBe(6);
    expect(svg).not.toContain('data-dim="ease"');
  });
});

describe("renderBody — outline edge linking", () => {
  const RAW = ["chest", "shoulderWidth", "length", "armholeDepth", "sleeveLength", "bicep"];

  it("tags outline segments for every raw input, plus the silhouette", () => {
    for (const field of RAW) expect(svg).toContain(`data-edge="${field}"`);
    expect(svg).toContain('data-edge="figure"');
  });

  it("tags exactly the six raw inputs and the figure — nothing for ease", () => {
    expect(svg.match(/data-edge="/g)!.length).toBe(RAW.length + 1);
    expect(svg).not.toContain('data-edge="ease"');
  });

  it("names edge groups from the same vocabulary as the dimension groups", () => {
    const named = (attr: string): string[] =>
      [...svg.matchAll(new RegExp(`${attr}="([^"]+)"`, "g"))]
        .map((mm) => mm[1])
        .filter((v) => v !== "figure")
        .sort();
    // A row hovers by field name; if the two maps ever drift, the hover silently
    // lights the dimension line but no outline. Pin them together.
    expect(named("data-edge")).toEqual(named("data-dim"));
  });

  it("gives every measurement a non-empty, non-overlapping set of real segments", () => {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();

    const seen = new Set<string>();
    for (const field of RAW) {
      const g = doc.querySelector(`[data-edge="${field}"]`)!;
      const lines = [...g.querySelectorAll("line")];
      expect(lines.length).toBeGreaterThan(0);
      for (const ln of lines) {
        // a real segment, not a zero-length stub
        const x1 = Number(ln.getAttribute("x1")), y1 = Number(ln.getAttribute("y1"));
        const x2 = Number(ln.getAttribute("x2")), y2 = Number(ln.getAttribute("y2"));
        expect(Math.hypot(x2 - x1, y2 - y1)).toBeGreaterThan(0);
        // no segment is claimed by two measurements
        const key = [x1, y1, x2, y2].join(",");
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });

  it("draws the overlay on top of the silhouette it highlights", () => {
    // Painter's order: if an edge were drawn first, the figure would cover it.
    expect(svg.indexOf('data-edge="figure"')).toBeLessThan(svg.indexOf('data-edge="chest"'));
  });

  it("moves the tagged edges when the measurement they own changes", () => {
    const hemOf = (s: string): string =>
      s.match(/data-edge="length">(.*?)<\/g>/)![1];
    expect(hemOf(renderBody({ ...STANDARD_M, length: 60 })))
      .not.toBe(hemOf(renderBody({ ...STANDARD_M, length: 90 })));
  });
});

describe("renderBody — sleeveless (Slice 60)", () => {
  const sleeveless = renderBody(STANDARD_M, false);

  it("still returns a valid, self-contained SVG", () => {
    expect(sleeveless.startsWith("<svg")).toBe(true);
    expect(sleeveless).toContain("viewBox=");
  });

  it("draws torso plus neckline hover overlays — no arm quads", () => {
    expect(sleeveless.match(/<path/g)!.length).toBe(3);
  });

  it("carries no Sleeve or Bicep dimension/edge — neither measurement drives this garment", () => {
    expect(sleeveless).not.toContain("Sleeve");
    expect(sleeveless).not.toContain("Bicep");
    expect(sleeveless).not.toContain('data-dim="sleeveLength"');
    expect(sleeveless).not.toContain('data-dim="bicep"');
    expect(sleeveless).not.toContain('data-edge="sleeveLength"');
    expect(sleeveless).not.toContain('data-edge="bicep"');
  });

  it("still labels the four inputs a sleeveless garment DOES use", () => {
    expect(sleeveless).toContain("Shoulder 45");
    expect(sleeveless).toContain("Chest 100");
    expect(sleeveless).toContain("Length 70");
    expect(sleeveless).toContain("Armhole depth 24");
  });

  it("is narrower than the sleeved figure — no margin reserved for an arm that isn't drawn", () => {
    const vb = viewBoxOf(sleeveless);
    const vbSleeved = viewBoxOf(svg);
    expect(vb[2]).toBeLessThan(vbSleeved[2]); // viewBox width
  });

  it("defaults hasSleeve to true when omitted", () => {
    expect(renderBody(STANDARD_M)).toEqual(renderBody(STANDARD_M, true));
  });
});

describe("renderBody — real chest width and neckline sync (Slice 61)", () => {
  it("draws the torso at derive()'s real chestWidthHalf, not an independent guess", () => {
    const d = derive(STANDARD_M);
    // Slice 60 shipped this at bodyHalf = chest * 0.22 = 22, silently
    // diverging from the pattern's real 27.5 (chest 100 + ease 10) / 4.
    // Confirm the fix reads the SAME derived value the draft uses, not just
    // a coincidentally-updated literal.
    expect(d.chestWidthHalf).toBe(27.5);
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    // The chest DIMENSION line spans the full width horizontally (the two
    // "chest" EDGE lines are each one vertical side seam, not a span).
    const chestDim = doc.querySelector('[data-dim="chest"] line')!;
    const width = Math.abs(Number(chestDim.getAttribute("x2")) - Number(chestDim.getAttribute("x1")));
    expect(width).toBeCloseTo(2 * d.chestWidthHalf);
  });

  it("draws the real front collar geometry from necklineEdge(), not a fixed placeholder", () => {
    const d = derive(STANDARD_M);
    // Compute the expected curve the SAME way the render function does —
    // not a hardcoded literal that could drift from necklineEdge() unnoticed.
    const { cNeck, hps } = necklineEdge(
      "front", d.neckWidthHalf, d.frontNeckDepth, d.shoulderHalf, STANDARD_M.armholeDepth, NECKLINE_DEFAULT);
    const torso = svg.match(/<path d="([^"]+)" fill="[^"]*" stroke="[^"]*" stroke-width="1.4"/)![1];
    expect(torso).toContain(`${hps.x} 0`); // the collar meets the shoulder at the real width
    expect(torso).toContain(`0 ${cNeck.y}`); // the collar's deepest point is the real front depth
    expect(torso).toContain("C "); // a real cubic curve, not the old "Q" placeholder
  });

  it("draws a genuinely different collar for a deeper neckline shape (scoop vs crew)", () => {
    const crew = renderBody(STANDARD_M);
    const scoop = renderBody(STANDARD_M, true, tankFrontNeckline(STANDARD_M));
    const torsoOf = (s: string): string =>
      s.match(/<path d="([^"]+)" fill="[^"]*" stroke="[^"]*" stroke-width="1.4"/)![1];
    expect(torsoOf(scoop)).not.toBe(torsoOf(crew));
  });
});

describe("renderBody — real strap position for a sleeveless garment (Slice 63)", () => {
  const torsoOf = (s: string): string =>
    s.match(/<path d="([^"]+)" fill="[^"]*" stroke="[^"]*" stroke-width="1.4"/)![1];

  it("draws the torso's shoulder corner at the REAL strapWidth, not the full sleeved shoulder point", () => {
    const svgStrap = renderBody(STANDARD_M, false, tankFrontNeckline(STANDARD_M), 8);
    const torso = torsoOf(svgStrap);
    expect(torso).toContain("15 3.15"); // strapX at body.ts's own schematic shoulder slope
    expect(torso).not.toContain("22.5 3.15"); // NOT the full sleeved shoulderHalf
  });

  it("defaults to the full sleeved shoulder point when strapWidth is omitted — byte-identical to before Slice 63", () => {
    expect(renderBody(STANDARD_M, true, tankFrontNeckline(STANDARD_M)))
      .toEqual(renderBody(STANDARD_M, true, tankFrontNeckline(STANDARD_M), undefined));
  });

  it("moves the drawn strap point when strapWidth changes", () => {
    const narrow = torsoOf(renderBody(STANDARD_M, false, tankFrontNeckline(STANDARD_M), 12));
    const wide = torsoOf(renderBody(STANDARD_M, false, tankFrontNeckline(STANDARD_M), 20));
    expect(narrow).not.toBe(wide);
  });

  it("uses the drafted curved armhole for a tank, not a straight diagonal", () => {
    const svgStrap = renderBody(STANDARD_M, false, tankFrontNeckline(STANDARD_M), 8);
    expect(svgStrap).toContain("C 13.75 9 20 19 27.5 24");
  });
});

describe("renderBody — Polo V1", () => {
  it("adds exact selected collar, stand, placket, and three button references to Front only", () => {
    const pair = renderBodyPair(STANDARD_M, true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, {
      placketLength: 14, placketWidth: 3, standHeight: 2, collarLeafDepth: 5,
    });
    expect(pair).toContain('width="3" height="14"');
    expect((pair.match(/r="0.35"/g) ?? []).length).toBe(3);
  });
});
