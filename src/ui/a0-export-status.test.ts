import { describe, expect, it } from "vitest";
import { a0ExportStatus } from "./a0-export-status";

describe("A0 export availability copy", () => {
  it("keeps the standard full-sheet state available", () => {
    expect(a0ExportStatus([], false)).toEqual({
      disabled: false,
      description: "Full-sheet print · selected size",
      title: null,
    });
  });

  it("disables A0 when an oversized piece has no opted-in A0 overflow path", () => {
    expect(a0ExportStatus(["trouser back"], false)).toEqual({
      disabled: true,
      description: "trouser back exceeds a single A0 sheet at true scale. Use the tiled PDF export.",
      title: "trouser back exceeds A0 at true scale. Use the tiled PDF export.",
    });
  });

  it("explains true-scale tile assembly when the recipe allows it", () => {
    expect(a0ExportStatus(["Circle skirt front"], true)).toEqual({
      disabled: false,
      description: "A0 sheets tile oversized pieces at true scale. Print at 100% and align the registration marks; a separate scale-check page is included.",
      title: "Oversized pieces are tiled across A0 sheets at true scale; print at 100% and align the registration marks.",
    });
  });
});
