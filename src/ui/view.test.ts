import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { styleSuggestions } from "../style";
import { controlsMarkup, appShellMarkup, guidanceMarkup, styleMarkup } from "./view";

describe("controlsMarkup", () => {
  it("renders an input for every measurement, showing its value", () => {
    const html = controlsMarkup(STANDARD_M);
    expect(html).toContain('data-field="chest"');
    expect(html).toContain('value="100"'); // STANDARD_M.chest
    expect(html).toContain('data-field="ease"');
  });
});

describe("appShellMarkup", () => {
  it("includes the controls, canvas host, guidance host, and style host", () => {
    const html = appShellMarkup(STANDARD_M);
    expect(html).toContain('id="canvas-host"');
    expect(html).toContain('id="guidance-host"');
    expect(html).toContain('id="style-host"');
  });
});

describe("guidanceMarkup", () => {
  it("renders one row per note with its text", () => {
    const html = guidanceMarkup([
      { level: "ok", text: "All good" },
      { level: "warn", text: "Fix this" },
    ]);
    expect(html).toContain("All good");
    expect(html).toContain("Fix this");
    expect(html).toContain("Guidance");
  });
});

describe("styleMarkup", () => {
  it("shows the current style and a nearby style with its change", () => {
    const html = styleMarkup(styleSuggestions(STANDARD_M));
    expect(html).toContain("Classic tee");   // current
    expect(html).toContain("Relaxed tee");   // nearby
    expect(html).toContain("Ease +3 cm");    // the change to reach it
  });
  it("says 'Between styles' when nothing matches", () => {
    const html = styleMarkup({ current: [], nearby: [] });
    expect(html).toContain("Between styles");
  });
});
