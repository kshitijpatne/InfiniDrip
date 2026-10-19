import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const studioCss = readFileSync(new URL("./studio.css", import.meta.url), "utf8");

describe("selected Tee card contrast", () => {
  it("lets only the selected Tee summary and detail inherit the runtime foreground", () => {
    expect(studioCss).toMatch(
      /#garment-tee\[aria-pressed="true"\]\s+\.garment-card-summary,\s*#garment-tee\[aria-pressed="true"\]\s+\.garment-card-detail\s*\{\s*color:\s*inherit;\s*\}/,
    );
  });

  it("keeps the existing shared copy styling for other card families", () => {
    expect(studioCss).toContain(
      '.fit-intent-card[aria-pressed="true"] .fit-intent-card-description,',
    );
    expect(studioCss).toContain(
      '.material-card[aria-pressed="true"] .material-card-detail { color: #b8e6d0; }',
    );
  });
});