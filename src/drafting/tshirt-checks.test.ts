import { describe, it, expect } from "vitest";
import { STANDARD_M, draftTshirt, draftFitted } from "./index";
import { sleevedTopStitches, sleevedTopPanelChecks, frontHemWidth, dartLegCheck } from "./tshirt-checks";
import { stitchChecks } from "./stitch";
import { CheckResult } from "../guidance/check";

describe("sleevedTopStitches", () => {
  it("produces the four seam/cap stitches shared by every sleeved top", () => {
    const names = sleevedTopStitches(["side"], false).map((s) => s.label);
    expect(names).toContain("Shoulder seam (front ↔ back)");
    expect(names).toContain("Side seam (front ↔ back)");
    expect(names).toContain("Sleeve underarm (left ↔ right)");
    expect(names).toContain("Sleeve-cap ease");
  });

  it("adds the dart-leg stitch only when hasDart is true", () => {
    const tee = sleevedTopStitches(["side"], false).map((s) => s.label);
    const fitted = sleevedTopStitches(["sideUpper", "sideLower"], true).map((s) => s.label);
    expect(tee).not.toContain("Dart legs equal");
    expect(fitted).toContain("Dart legs equal");
  });

  it("uses every edge in frontSideEdges for the side-seam interface — the darted case", () => {
    const single = sleevedTopStitches(["side"], false).find((s) => s.label === "Side seam (front ↔ back)")!;
    const darted = sleevedTopStitches(["sideUpper", "sideLower"], true).find((s) => s.label === "Side seam (front ↔ back)")!;
    expect(single.a.edges).toHaveLength(1);
    expect(darted.a.edges).toHaveLength(2);
  });

  it("passes cleanly on a real drafted tee", () => {
    const b = draftTshirt(STANDARD_M);
    const checks: CheckResult[] = stitchChecks(b, sleevedTopStitches(["side"], false));
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it("passes cleanly on a real drafted fitted garment, dart included", () => {
    const b = draftFitted(STANDARD_M);
    const checks: CheckResult[] = stitchChecks(b, sleevedTopStitches(["sideUpper", "sideLower"], true));
    expect(checks.every((c) => c.ok)).toBe(true);
  });
});

describe("sleevedTopPanelChecks", () => {
  it("returns the square-hem check only when the recipe declares a trued hem", () => {
    const b = draftTshirt(STANDARD_M);
    const trued = sleevedTopPanelChecks(true)(b, STANDARD_M).map((c) => c.name);
    const untrued = sleevedTopPanelChecks(false)(b, STANDARD_M).map((c) => c.name);
    expect(trued).toContain("Hem square to the fold");
    expect(untrued).toEqual([]); // an untrued front opts out entirely — no checks left
  });
});

describe("dartLegCheck", () => {
  it("is null for an undarted front and equal-legged for a darted one", () => {
    expect(dartLegCheck(draftTshirt(STANDARD_M))).toBeNull();
    expect(dartLegCheck(draftFitted(STANDARD_M))!.ok).toBe(true);
  });
});

describe("frontHemWidth", () => {
  it("measures the front hem and grows with the chest", () => {
    const narrow = frontHemWidth(draftTshirt(STANDARD_M));
    const wide = frontHemWidth(draftTshirt({ ...STANDARD_M, chest: 120 }));
    expect(narrow).toBeGreaterThan(0);
    expect(wide).toBeGreaterThan(narrow);
  });
});
