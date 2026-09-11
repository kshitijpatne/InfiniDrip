import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { lineMark, pointMark } from "./pattern-mark";

describe("pattern marks", () => {
  it("creates typed line and point construction data", () => {
    expect(lineMark("cutLine", "slit", point(0, 0), point(0, 14), "CUT")).toEqual({
      kind: "cutLine", name: "slit", start: point(0, 0), end: point(0, 14), label: "CUT",
    });
    expect(pointMark("button", "button-1", point(2, 3))).toEqual({
      kind: "button", name: "button-1", at: point(2, 3), label: undefined,
    });
  });
});
