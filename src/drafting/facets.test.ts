import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { MEASURE_ROLE, measurementFacet, roleTag } from "./facets";

describe("MEASURE_ROLE", () => {
  it("classifies the body measurements and the finished dimensions", () => {
    expect(MEASURE_ROLE.chest.role).toBe("body");
    expect(MEASURE_ROLE.bicep.role).toBe("body");
    expect(MEASURE_ROLE.shoulderWidth.role).toBe("body");
    expect(MEASURE_ROLE.length.role).toBe("finished");
    expect(MEASURE_ROLE.armholeDepth.role).toBe("finished");
    expect(MEASURE_ROLE.sleeveLength.role).toBe("finished");
  });

  it("marks the girths as circumferences (chest, bicep, waist, hip)", () => {
    expect(MEASURE_ROLE.chest.circumference).toBe(true);
    expect(MEASURE_ROLE.bicep.circumference).toBe(true);
    expect(MEASURE_ROLE.waist.circumference).toBe(true);
    expect(MEASURE_ROLE.hip.circumference).toBe(true);
    expect(MEASURE_ROLE.shoulderWidth.circumference).toBe(false);
  });

  it("classifies waist and hip as body measurements", () => {
    expect(MEASURE_ROLE.waist.role).toBe("body");
    expect(MEASURE_ROLE.hip.role).toBe("body");
  });

  it("does not classify ease (it is a parameter, not a measurement)", () => {
    expect("ease" in MEASURE_ROLE).toBe(false);
  });
});

describe("measurementFacet — finished values", () => {
  it("adds full ease to the chest (matches the draft's (chest+ease)/4)", () => {
    // finished chest circumference = chest + ease = 100 + 10
    expect(measurementFacet(STANDARD_M, "chest").finished).toBe(110);
  });

  it("adds half the ease to the bicep (matches the sleeve width = bicep + ease*0.5)", () => {
    // 38 + 10*0.5 = 43
    expect(measurementFacet(STANDARD_M, "bicep").finished).toBe(43);
  });

  it("tracks ease as it changes", () => {
    expect(measurementFacet({ ...STANDARD_M, ease: 20 }, "chest").finished).toBe(120);
    expect(measurementFacet({ ...STANDARD_M, ease: 0 }, "chest").finished).toBe(100);
  });

  it("leaves body-no-ease and finished fields without a finished value", () => {
    expect(measurementFacet(STANDARD_M, "shoulderWidth").finished).toBeUndefined();
    expect(measurementFacet(STANDARD_M, "length").finished).toBeUndefined();
    // Slice 42: ease is room around a girth — it never applies to a vertical drop.
    expect(measurementFacet({ ...STANDARD_M, ease: 20 }, "hipDepth").finished).toBeUndefined();
  });

  it("carries the role and circumference through", () => {
    const f = measurementFacet(STANDARD_M, "chest");
    expect(f.role).toBe("body");
    expect(f.circumference).toBe(true);
  });
});

describe("roleTag", () => {
  it("labels a body circumference", () => {
    expect(roleTag("chest")).toBe("body · circ");
  });
  it("labels a body linear measurement", () => {
    expect(roleTag("shoulderWidth")).toBe("body");
  });
  it("labels a finished dimension", () => {
    expect(roleTag("length")).toBe("finished");
  });
  it("returns null for ease and for unknown fields", () => {
    expect(roleTag("ease")).toBeNull();
    expect(roleTag("nonsense")).toBeNull();
  });

  // Slice 42: hipDepth is a vertical distance taken off a person — a body
  // measurement, but not a girth, and ease never applies to it.
  it("labels hipDepth as a body linear measurement, not a circumference", () => {
    expect(roleTag("hipDepth")).toBe("body");
  });
});
