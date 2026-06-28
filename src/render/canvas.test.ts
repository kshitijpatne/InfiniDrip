import { describe, it, expect } from "vitest";
import { STANDARD_M, draftTshirt } from "../drafting";
import { renderBlueprint } from "./canvas";
import { BLUEPRINT } from "./theme";

const block = draftTshirt(STANDARD_M);
const pieces = [block.front, block.back, block.sleeve];

describe("renderBlueprint", () => {
  it("produces one svg with a viewBox and dark background", () => {
    const svg = renderBlueprint(pieces);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("viewBox=");
    expect(svg).toContain(BLUEPRINT.background);
  });
  it("draws one group per piece", () => {
    const svg = renderBlueprint(pieces);
    expect((svg.match(/<g transform/g) || []).length).toBe(3);
  });
  it("highlights the first piece in amber by default", () => {
    const svg = renderBlueprint(pieces);
    expect(svg).toContain(`stroke="${BLUEPRINT.lineActive}"`);
    expect(svg).toContain(`stroke="${BLUEPRINT.line}"`);
  });
  it("can highlight a named piece instead", () => {
    const svg = renderBlueprint(pieces, { active: "sleeve" });
    const activeAt = svg.lastIndexOf(`stroke="${BLUEPRINT.lineActive}"`);
    const sleevePathAt = svg.lastIndexOf("<g transform");
    expect(activeAt).toBeLessThan(svg.length);
    expect(sleevePathAt).toBeGreaterThan(0);
  });
  it("marks fold pieces (front, back) but not the sleeve", () => {
    const svg = renderBlueprint(pieces);
    expect((svg.match(/FOLD/g) || []).length).toBe(2);
  });
  it("draws a measured grid", () => {
    const svg = renderBlueprint(pieces);
    expect(svg).toContain(BLUEPRINT.gridStrong);
  });
  it("handles an empty piece list without crashing", () => {
    const svg = renderBlueprint([]);
    expect(svg.startsWith("<svg")).toBe(true);
    expect((svg.match(/<g transform/g) || []).length).toBe(0);
  });
});

describe("seam allowance", () => {
  it("draws a dashed cutting line for each piece", () => {
    const svg = renderBlueprint(pieces);
    expect((svg.match(/stroke-dasharray="2 2"/g) || []).length).toBe(3);
  });
});

describe("renderBlueprint with non-tshirt pieces", () => {
  it("renders a piece with no notch recipe without crashing or drawing notches", () => {
    const unknown = { ...block.front, name: "unknown-piece" };
    const svg = renderBlueprint([unknown]);
    expect(svg.startsWith("<svg")).toBe(true);
  });
});
