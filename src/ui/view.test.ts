import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { DEFAULT_FABRIC } from "../render";
import { matchStyle, styleNames } from "../style";
import { controlsMarkup, appShellMarkup, guidanceMarkup, styleMarkup, fabricSwatchesMarkup } from "./view";

describe("controlsMarkup", () => {
  it("renders an input for every measurement, showing its value", () => {
    const html = controlsMarkup(STANDARD_M);
    expect(html).toContain('data-field="chest"');
    expect(html).toContain('value="100"'); // STANDARD_M.chest
    expect(html).toContain('data-field="ease"');
  });
});

describe("fabricSwatchesMarkup", () => {
  it("renders a clickable swatch per fabric and highlights the current one", () => {
    const html = fabricSwatchesMarkup(DEFAULT_FABRIC);
    expect(html).toContain(`data-fabric="${DEFAULT_FABRIC}"`);
    expect(html).toContain("outline:2px solid"); // the current swatch is ringed
  });
});

describe("appShellMarkup", () => {
  it("includes the controls, canvas, garment, guidance, and style hosts", () => {
    const html = appShellMarkup(STANDARD_M, DEFAULT_FABRIC);
    expect(html).toContain('id="canvas-host"');
    expect(html).toContain('id="garment-host"');
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
  it("renders the target selector with all styles and the chosen one selected", () => {
    const html = styleMarkup("Classic tee", matchStyle(STANDARD_M, "Classic tee"), styleNames());
    expect(html).toContain('id="style-target"');
    expect(html).toContain("Oversized tee"); // an option
    expect(html).toContain("Target fit");
  });

  it("confirms when you already match the chosen target", () => {
    const html = styleMarkup("Classic tee", matchStyle(STANDARD_M, "Classic tee"), styleNames());
    expect(html).toContain("You're making a Classic tee");
  });

  it("shows the gap to a target you are not yet in", () => {
    const html = styleMarkup("Oversized tee", matchStyle(STANDARD_M, "Oversized tee"), styleNames());
    expect(html).toContain("To reach Oversized tee");
    expect(html).toContain("Ease +9 cm");
  });

  it("shows a negative delta without a plus sign", () => {
    const html = styleMarkup("Crop tee", matchStyle(STANDARD_M, "Crop tee"), styleNames());
    expect(html).toContain("Length -13 cm");
  });
});

