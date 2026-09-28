import { describe, expect, it } from "vitest";
import { STANDARD_M, type Measurements } from "../drafting";
import { gradePlanRunMarkup } from "./grade-plan-run-panel";
import type { GradePlanRunEvaluation } from "./grade-plan-run";

const base: GradePlanRunEvaluation = {
  recipeId: "tee", approved: true, wholeRunReady: false, issues: ["No approved run <yet>."], sizes: [],
};

describe("gradePlanRunMarkup", () => {
  it("escapes blockers and reports no applicable POMs when a declared size has none", () => {
    const blocked = gradePlanRunMarkup(base);
    expect(blocked).toContain("No approved run &lt;yet&gt;.");
    expect(blocked).toContain("Graded outputs stay blocked");
    const noPoms = gradePlanRunMarkup({
      ...base, issues: [], sizes: [{ label: "S", position: -1, measurements: null, options: null,
        block: null, poms: [], issues: [], ready: true }], wholeRunReady: true,
    });
    expect(noPoms).toContain("Every declared size passes");
    expect(noPoms).toContain("No applicable POM rows.");
    expect(noPoms).toContain("No drafting or POM blockers");
  });

  it("shows exact values and safely renders an explicit not-applicable reason", () => {
    const markup = gradePlanRunMarkup({
      ...base, issues: [], sizes: [{ label: "L", position: 1, measurements: null, options: null,
        block: null, issues: ["Needs review <now>"], ready: false, poms: [
          { targetId: "pom.x", label: "Chest <circ>", unit: "cm", expected: 101, actual: 101,
            difference: 0, exceptionReason: null, matches: true },
          { targetId: "pom.y", label: "Sleeve", unit: "cm", expected: null, actual: null,
            difference: null, exceptionReason: "Absent & intentionally omitted", matches: true },
          { targetId: "pom.z", label: "Unresolved POM", unit: "cm", expected: null, actual: null,
            difference: null, exceptionReason: null, matches: false },
        ] }],
    });
    expect(markup).toContain("Chest &lt;circ&gt;");
    expect(markup).toContain("101 cm");
    expect(markup).toContain("Exact match");
    expect(markup).toContain("Absent &amp; intentionally omitted");
    expect(markup).toContain("Unresolved POM");
    expect(markup).toContain("Blocked");
    expect(markup).toContain("—");
    expect(markup).toContain("Needs review &lt;now&gt;");
  });

  it("lists every generated tee measurement with shared labels and units beside the POM rows", () => {
    const partial = { ...STANDARD_M, extraNote: 5 } as unknown as Record<string, number>;
    delete partial.bicep;
    const markup = gradePlanRunMarkup({
      ...base, recipeId: "tee", issues: [], wholeRunReady: true, sizes: [{
        label: "M <&>", position: 0, measurements: partial as unknown as Measurements, options: {},
        block: null, issues: [], ready: true, poms: [
          { targetId: "pom.x", label: "Chest <circ>", unit: "cm", expected: 101, actual: 101,
            difference: 0, exceptionReason: null, matches: true },
        ],
      }],
    });
    // The inputs table is explicit, escaped, and sits alongside the POM table.
    expect(markup).toContain("M &lt;&amp;&gt; · generated drafting inputs");
    expect(markup).toContain("Chest</th><td>Measurement</td>");
    expect(markup).toContain(`${STANDARD_M.chest} cm`);
    expect(markup).toContain("Sleeve length (cap to hem target)");
    expect(markup).toContain("Bicep</th><td>Measurement</td><td>—</td>");
    expect(markup).toContain("extraNote</th><td>Measurement</td><td>5</td>");
    expect(markup).toContain("M &lt;&amp;&gt; · raw centimetre POM reconciliation");
    expect(markup).toContain("Chest &lt;circ&gt;");
  });

  it("lists supported polo design options with declared units and kinds", () => {
    const markup = gradePlanRunMarkup({
      ...base, recipeId: "polo", issues: [], wholeRunReady: true, sizes: [{
        label: "M", position: 0, measurements: { ...STANDARD_M }, options: { standHeight: 2, extraOption: 1 },
        block: null, issues: [], ready: true, poms: [],
      }],
    });
    expect(markup).toContain("M · generated drafting inputs");
    expect(markup).toContain("Finished stand height</th><td>Design option</td><td>2 cm</td>");
    expect(markup).toContain("Finished placket length</th><td>Design option</td><td>—</td>");
    expect(markup).toContain("extraOption</th><td>Design option</td><td>1</td>");
    expect(markup).toContain("Chest</th><td>Measurement</td>");
  });

  it("states explicitly when generated inputs are unavailable or unrecorded", () => {
    const neither = gradePlanRunMarkup({
      ...base, recipeId: "tee", issues: [], sizes: [{ label: "S", position: -1,
        measurements: null, options: null, block: null, poms: [], issues: ["Unresolved"], ready: false }],
    });
    expect(neither).toContain("Generated inputs are unavailable until the listed input blockers resolve.");
    const mixed = gradePlanRunMarkup({
      ...base, recipeId: "tee", issues: [], sizes: [{ label: "S", position: -1,
        measurements: { ...STANDARD_M }, options: null, block: null, poms: [], issues: ["Unresolved"], ready: false }],
    });
    expect(mixed).toContain("Generated inputs are unavailable until the listed input blockers resolve.");
    const empty = gradePlanRunMarkup({
      ...base, recipeId: "unknown-recipe", issues: [], sizes: [{ label: "S", position: -1,
        measurements: {} as unknown as Measurements, options: {}, block: null, poms: [], issues: [], ready: false }],
    });
    expect(empty).toContain("No generated inputs recorded for this size.");
  });

  it("falls back to safely escaped raw keys for recipes without shared definitions", () => {
    const markup = gradePlanRunMarkup({
      ...base, recipeId: "unknown-recipe", issues: [], sizes: [{ label: "S", position: -1,
        measurements: { chest: 92, "<evil>": 1 } as unknown as Measurements,
        options: { customChoice: 3 }, block: null, poms: [], issues: [], ready: false }],
    });
    expect(markup).toContain("S · generated drafting inputs");
    expect(markup).toContain(">chest</th><td>Measurement</td><td>92</td>");
    expect(markup).toContain("&lt;evil&gt;</th><td>Measurement</td><td>1</td>");
    expect(markup).toContain("customChoice</th><td>Design option</td><td>3</td>");
    expect(markup).not.toContain("<evil>");
  });
});
