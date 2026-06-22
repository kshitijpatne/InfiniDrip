import { describe, it, expect } from "vitest";
import { STANDARD_M } from "../drafting";
import { controlsMarkup, appShellMarkup } from "./view";

describe("controlsMarkup", () => {
  it("renders an input for every measurement, showing its value", () => {
    const html = controlsMarkup(STANDARD_M);
    expect(html).toContain('data-field="chest"');
    expect(html).toContain('value="100"'); // STANDARD_M.chest
    expect(html).toContain('data-field="ease"');
  });
});

describe("appShellMarkup", () => {
  it("includes the controls panel and an empty canvas host", () => {
    const html = appShellMarkup(STANDARD_M);
    expect(html).toContain('id="canvas-host"');
    expect(html).toContain('data-field="length"');
  });
});
