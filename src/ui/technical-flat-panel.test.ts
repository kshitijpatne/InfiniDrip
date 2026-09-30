import { describe, expect, it } from "vitest";
import { GARMENTS, STANDARD_M, defaultGarmentOptions } from "../drafting";
import type { TechnicalFlatMeasureText } from "../render/technical-flat-svg";
import { technicalFlatIssueList, technicalFlatPanelMarkup } from "./technical-flat-panel";

// Tee sleeve contours are correctly held by the current source map. Use Tank,
// the supported emitting fixture, for success-path panel markup assertions.
const recipe = GARMENTS.find((candidate) => candidate.name === "tank")!;
const block = recipe.draft(STANDARD_M, defaultGarmentOptions(recipe.options ?? []));
const measure: TechnicalFlatMeasureText = (text, size) => ({ widthCm: text.length * size * 0.3, ascentCm: size * 0.7, descentCm: size * 0.2 });
const base = {
  recipe,
  measurements: STANDARD_M,
  rawOptions: defaultGarmentOptions(recipe.options ?? []),
  revisionId: "live-tank-42",
  placements: [],
  colorHex: "#456789",
  texture: "woven" as const,
  shine: 12,
  sizeReady: true,
  block,
  measureText: measure,
};

describe("technicalFlatPanelMarkup", () => {
  it("preserves the original row for a single matching edge diagnostic", () => {
    const markup = technicalFlatIssueList([{
      stage: "geometry", sourceId: "pattern:sample:role:panel:edge:waist",
      message: "Visible FRONT_FLAT is withheld because edge “panel.waist” is unresolved: add its source map.",
    }]);
    expect(markup).toContain("pattern:sample:role:panel:edge:waist");
    expect(markup).toContain("edge “panel.waist” is unresolved: add its source map");
    expect(markup).not.toContain("Affected source edges:");
  });

  it("renders a measured front or back face with a revision-bound status", () => {
    for (const kind of ["FRONT_FLAT", "BACK_FLAT"] as const) {
      const markup = technicalFlatPanelMarkup({ ...base, kind });
      expect(markup).toContain(`data-technical-flat-revision="${base.revisionId}"`);
      expect(markup).toContain(`${kind === "FRONT_FLAT" ? "Front" : "Back"} · live draft revision`);
      expect(markup).toContain(`data-technical-flat-svg data-revision-id="${base.revisionId}"`);
      expect(markup).toContain("viewBox=");
    }
  });

  it("shows actionable raw option errors before looking up a block", () => {
    const polo = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const options = defaultGarmentOptions(polo.options ?? []);
    const option = polo.options!.find((candidate) => candidate.step > 0 && candidate.min < candidate.max)!;
    const markup = technicalFlatPanelMarkup({ ...base, kind: "FRONT_FLAT", recipe: polo,
      rawOptions: { ...options, [option.id]: option.min + option.step / 2 }, block: null });
    expect(markup).toContain("OPTION_OFF_STEP");
    expect(markup).toContain("declared step value");
    expect(markup).toContain("Technical flat withheld");
  });

  it("withholds unready or unavailable selected sizes", () => {
    expect(technicalFlatPanelMarkup({ ...base, kind: "FRONT_FLAT", sizeReady: false, block: null }))
      .toContain("Review or rebase");
    expect(technicalFlatPanelMarkup({ ...base, kind: "BACK_FLAT", block: null }))
      .toContain("selected pattern size is unavailable");
  });

  it("surfaces missing mapped source roles without showing a partial face", () => {
    const broken = { ...block, roles: { ...block.roles, front: undefined } } as unknown as typeof block;
    const markup = technicalFlatPanelMarkup({ ...base, kind: "FRONT_FLAT", block: broken });
    expect(markup).toContain("no partial face is shown");
    expect(markup).toContain("geometry");
    expect(markup).toContain("absent from the exact drafted block");
  });

  it("groups identical Woven edge holds while retaining every source edge and distinct POM blocker", () => {
    const woven = GARMENTS.find((candidate) => candidate.name === "woven-shirt")!;
    const markup = technicalFlatPanelMarkup({ ...base, recipe: woven,
      rawOptions: defaultGarmentOptions(woven.options ?? []), block: woven.draft(STANDARD_M, defaultGarmentOptions(woven.options ?? [])),
      kind: "FRONT_FLAT" });
    const repeatedReason = "Woven source still lacks a front/back sleeve-cap boundary";
    expect(markup.split(repeatedReason).length - 1).toBe(1);
    expect(markup).toContain("Affected source edges:");
    for (const edge of ["neckline", "shoulder", "armhole", "sideUpper", "sideMiddle", "sideLower", "vent", "hem", "centerFront"]) {
      expect(markup).toContain(`pattern:woven-shirt:role:front:edge:${edge}`);
    }
    expect(markup).toContain("POM callouts need the mapped role outline");
    expect(markup).toContain("no partial face is shown");
  });

  it("does not group different source blockers or different mapped roles", () => {
    const polo = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const markup = technicalFlatPanelMarkup({ ...base, recipe: polo,
      rawOptions: defaultGarmentOptions(polo.options ?? []), block: polo.draft(STANDARD_M, defaultGarmentOptions(polo.options ?? [])),
      kind: "FRONT_FLAT" });
    expect(markup).toContain("pattern:polo:role:outerStand");
    expect(markup).toContain("pattern:polo:role:upperCollar");
    expect(markup).toContain("stand&#39;s exterior contour has no authored front/back split landmark");
    expect(markup).toContain("collar&#39;s exterior contour has no authored front/back split landmark");
  });

  it("withholds geometry when browser measured text overlaps", () => {
    const excessiveText: TechnicalFlatMeasureText = (text, size) => ({ widthCm: text.length * size * 20, ascentCm: size, descentCm: size });
    const markup = technicalFlatPanelMarkup({ ...base, kind: "BACK_FLAT", measureText: excessiveText });
    expect(markup).toContain("measured drawing is unreadable or incomplete");
    expect(markup).toContain("INVALID_FONT_METRICS");
  });

  it("escapes revision and recipe labels and provides source fallbacks in issue rows", () => {
    const hostile = { ...recipe, label: "Tank <sample> & 'fit'" };
    const markup = technicalFlatPanelMarkup({ ...base, recipe: hostile, revisionId: 'live-<draft>&"', kind: "FRONT_FLAT" });
    expect(markup).toContain("Tank &lt;sample&gt; &amp; &#39;fit&#39;");
    expect(markup).toContain("data-technical-flat-revision=\"live-&lt;draft&gt;&amp;&quot;\"");
  });
});
