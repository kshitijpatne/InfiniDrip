// @vitest-environment jsdom
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
