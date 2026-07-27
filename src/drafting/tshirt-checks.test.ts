import { describe, it, expect } from "vitest";
import { STANDARD_M, draftTshirt, draftFitted } from "./index";
import { sleevedTopChecks, frontHemWidth, dartLegCheck } from "./tshirt-checks";

describe("sleevedTopChecks", () => {
  it("produces the four sleeved-top seam/cap checks", () => {
    const checks = sleevedTopChecks(["side"], true)(draftTshirt(STANDARD_M), STANDARD_M);
    const names = checks.map((c) => c.name);
    expect(names).toContain("Shoulder seam (front ↔ back)");
    expect(names).toContain("Side seam (front ↔ back)");
    expect(names).toContain("Sleeve underarm (left ↔ right)");
    expect(names).toContain("Sleeve-cap ease");
  });

  it("adds the square-hem check only when the recipe declares a trued hem", () => {
    const trued = sleevedTopChecks(["side"], true)(draftTshirt(STANDARD_M), STANDARD_M).map((c) => c.name);
    const untrued = sleevedTopChecks(["side"], false)(draftTshirt(STANDARD_M), STANDARD_M).map((c) => c.name);
    expect(trued).toContain("Hem square to the fold");
    expect(untrued).not.toContain("Hem square to the fold");
  });

  it("adds the dart-leg check only when the front is darted", () => {
    const tee = sleevedTopChecks(["side"], true)(draftTshirt(STANDARD_M), STANDARD_M).map((c) => c.name);
    const fitted = sleevedTopChecks(["sideUpper", "sideLower"], false)(draftFitted(STANDARD_M), STANDARD_M).map((c) => c.name);
    expect(tee).not.toContain("Dart legs equal");
    expect(fitted).toContain("Dart legs equal");
  });

  it("passes cleanly on a real drafted tee", () => {
    const checks = sleevedTopChecks(["side"], true)(draftTshirt(STANDARD_M), STANDARD_M);
    expect(checks.every((c) => c.ok)).toBe(true);
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
