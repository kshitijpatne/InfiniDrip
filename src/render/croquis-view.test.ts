// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { STANDARD_M } from "../drafting";
import { lowerCroquisPath, upperCroquisPath } from "./croquis";
import { renderSideCroquis } from "./croquis-view";

const parse = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");

describe("renderSideCroquis", () => {
  it("renders the upper side path from the shared upper croquis contract", () => {
    const svg = renderSideCroquis(STANDARD_M, "upper");
    const doc = parse(svg);

    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelector("svg")?.getAttribute("data-croquis-region")).toBe("upper");
    expect(doc.querySelector("svg")?.getAttribute("data-croquis-view")).toBe("side");
    expect(doc.querySelector('[data-part="side-silhouette"]')?.getAttribute("d"))
      .toBe(upperCroquisPath(STANDARD_M, "side"));
    expect(doc.querySelector("[data-dim]")).toBeNull();
    expect(doc.querySelector("[data-edge]")).toBeNull();
    expect(doc.querySelector("text")?.textContent).toBe("SIDE · SCHEMATIC");
  });

  it("renders the lower side path from the shared lower croquis contract", () => {
    const svg = renderSideCroquis(STANDARD_M, "lower");
    const doc = parse(svg);

    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelector("svg")?.getAttribute("data-croquis-region")).toBe("lower");
    expect(doc.querySelector('[data-part="side-silhouette"]')?.getAttribute("d"))
      .toBe(lowerCroquisPath(STANDARD_M, "side"));
    expect(doc.querySelector('[data-part="side-silhouette"]')?.getAttribute("d"))
      .toContain(` ${STANDARD_M.length} `);
    expect(doc.querySelector("[data-dim]")).toBeNull();
    expect(doc.querySelector("[data-edge]")).toBeNull();
  });
});
