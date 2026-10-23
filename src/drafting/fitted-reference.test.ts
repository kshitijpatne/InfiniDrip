import { describe, expect, it } from "vitest";
import { fittedPrincessLineReferences } from "./fitted-reference";
import type { Edge } from "./piece";

const line: Edge = { kind: "line", name: "reference", start: { x: 0, y: 0 }, end: { x: 2, y: 3 } };
const curve: Edge = { kind: "curve", name: "reference", curve: {
  start: { x: 0, y: 0 }, control1: { x: 0, y: 1 }, control2: { x: 1, y: 2 }, end: { x: 2, y: 3 },
} };

describe("fittedPrincessLineReferences", () => {
  it("returns the three straight references used to split the princess seam", () => {
    expect(fittedPrincessLineReferences(line, line, line)).toEqual({ shoulder: line, hem: line, centerFront: line });
  });

  it.each([0, 1, 2])("rejects a curved reference in position %i", (index) => {
    const edges: Edge[] = [line, line, line];
    edges[index] = curve;
    expect(() => fittedPrincessLineReferences(edges[0]!, edges[1]!, edges[2]!))
      .toThrow("Princess-seam fitted geometry requires straight shoulder, hem, and center-front references.");
  });
});
