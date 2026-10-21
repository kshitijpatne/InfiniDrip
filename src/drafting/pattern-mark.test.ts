import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { lineMark, pointMark } from "./pattern-mark";

describe("pattern marks", () => {
  it("creates typed line and point construction data", () => {
    expect(lineMark("cutLine", "slit", point(0, 0), point(0, 14), "CUT")).toEqual({
      kind: "cutLine", name: "slit", start: point(0, 0), end: point(0, 14), label: "CUT",
    });
    expect(pointMark("button", "button-1", point(2, 3))).toEqual({
      kind: "button", name: "button-1", at: point(2, 3),
    });
    expect(pointMark("button", "button-2", point(4, 5), "BUTTON", "instruction")).toEqual({
      kind: "button", name: "button-2", at: point(4, 5), label: "BUTTON", labelRole: "instruction",
    });
  });

  it("omits an undefined optional line label and keeps explicit label roles", () => {
    const unlabeled = lineMark("foldLine", "bandFold", point(0, 1), point(8, 1));
    expect(unlabeled).toEqual({
      kind: "foldLine", name: "bandFold", start: point(0, 1), end: point(8, 1),
    });
    expect(Object.prototype.hasOwnProperty.call(unlabeled, "label")).toBe(false);
    expect(JSON.stringify(unlabeled)).toBe('{"kind":"foldLine","name":"bandFold","start":{"x":0,"y":1},"end":{"x":8,"y":1}}');

    const labeled = lineMark("placementLine", "greatestStretchDirection", point(0, 2), point(8, 2), "GREATEST STRETCH", "instruction");
    expect(labeled).toEqual({
      kind: "placementLine", name: "greatestStretchDirection", start: point(0, 2), end: point(8, 2),
      label: "GREATEST STRETCH", labelRole: "instruction",
    });
  });

  it("omits an undefined optional point label while preserving canonical serialization", () => {
    const unlabeled = pointMark("placementPoint", "placement", point(3, 4), undefined, "instruction");
    expect(unlabeled).toEqual({
      kind: "placementPoint", name: "placement", at: point(3, 4), labelRole: "instruction",
    });
    expect(Object.prototype.hasOwnProperty.call(unlabeled, "label")).toBe(false);
    expect(JSON.stringify(unlabeled)).toBe('{"kind":"placementPoint","name":"placement","at":{"x":3,"y":4},"labelRole":"instruction"}');
  });
});
