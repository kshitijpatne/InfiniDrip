import { describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting";
import { JEANS_POM_DEFINITIONS, JEANS_SIZES } from "../drafting/jeans-tables";
import { parseJeansT02PomDefinitions } from "./jeans-t02";
import { TECH_PACK_POM_RECIPE_IDS } from "./tech-pack-pom-records";

describe("Jeans T02 POM source definitions", () => {
  it("strictly parses digital landmarks and the shared XS–XL redraft sources", () => {
    const result = parseJeansT02PomDefinitions();
    expect(result.ok).toBe(true);
    expect(TECH_PACK_POM_RECIPE_IDS[TECH_PACK_POM_RECIPE_IDS.length - 1]).toBe("jeans");
    expect(GARMENTS.some(({ name }) => name === "jeans")).toBe(false);
    expect(JEANS_SIZES.map(({ label }) => label)).toEqual(["XS", "S", "M", "L", "XL"]);
    if (!result.ok) return;

    const { definitions } = result.value;
    expect(definitions).toHaveLength(JEANS_POM_DEFINITIONS.length);
    expect(definitions.map(({ id }) => id)).toEqual(JEANS_POM_DEFINITIONS.map(({ id }) => id));
    for (const definition of definitions) {
      expect(definition.method.status).toBe("SOURCE_CONFIRMED");
      expect(definition.landmarks.status).toBe("SOURCE_CONFIRMED");
      expect(definition.method.status === "SOURCE_CONFIRMED" && definition.method.source.uri)
        .toBe("src/drafting/jeans-tables.ts");
      expect(definition.landmarks.status === "SOURCE_CONFIRMED" && definition.landmarks.value.length).toBeGreaterThan(0);
      expect(definition.tolerance).toMatchObject({
        status: "UNRESOLVED",
        value: null,
        unresolvedReason: expect.stringContaining("No physically sewn"),
        nextAction: expect.stringContaining("Sew and measure"),
      });
      expect(definition.sizeRangeSource).toMatchObject({
        status: "SOURCE_CONFIRMED",
        value: { rangeLabel: "XS–XL digital redraft", sizeIds: ["XS", "S", "M", "L", "XL"], baseSizeId: "M" },
      });
      expect(definition.gradeRuleSource).toMatchObject({
        status: "SOURCE_CONFIRMED",
        value: { ruleId: "lower-body.trouser-grade", version: "1" },
      });
    }
  });
});
