import { describe, expect, it } from "vitest";
import { STANDARD_M } from "../drafting/measurements";
import { renderJoggerBody, renderJoggerBodyPair, renderJoggerGarment } from "./jogger-figure";

describe("hidden Jogger lower-body views", () => {
  it("renders front and back Body views from their live paired draft roles", () => {
    const front = renderJoggerBody(STANDARD_M, {}, "front");
    const back = renderJoggerBody(STANDARD_M, {}, "back");
    const pair = renderJoggerBodyPair(STANDARD_M);

    expect(front).toContain('aria-label="Jogger front body figure"');
    expect(front).toContain('data-role="frontLeft"');
    expect(front).toContain('data-role="frontRight"');
    expect(front).toContain('data-pattern-mark-name="pocketOpening"');
    expect(front).not.toContain('data-role="backLeft"');
    expect(back).toContain('aria-label="Jogger back body figure"');
    expect(back).toContain('data-role="backLeft"');
    expect(back).toContain('data-role="backRight"');
    expect(pair.match(/<svg /gu)).toHaveLength(2);
  });

  it("renders the assembled default, custom, and invalid-finite source components", () => {
    const defaultView = renderJoggerGarment(STANDARD_M, "#123456");
    const customView = renderJoggerGarment(STANDARD_M, "#123456", { pocketBagDepth: 30, legOpening: 32 });
    const invalidFiniteView = renderJoggerGarment(STANDARD_M, "#123456", {
      waistbandDepth: 2, elasticWidth: 3, drawcordCutWidth: 5, drawcordExit: 1,
    });

    for (const svg of [defaultView, customView, invalidFiniteView]) {
      expect(svg).toContain('aria-label="Jogger assembled lower-body view"');
      for (const role of ["frontLeft", "frontRight", "backLeft", "backRight", "waistband", "pocketBagLeft", "pocketBagRight"]) {
        expect(svg).toContain(`data-role="${role}"`);
      }
      expect(svg).toContain("WAISTBAND CASING");
      expect(svg).toContain("LEFT POCKET BAG");
      expect(svg).toContain("RIGHT POCKET BAG");
      expect(svg).toContain("elastic channel top");
      expect(svg).toContain("drawcord exit left");
      expect(svg).toContain("centre-back drawcord retention");
    }
    expect(customView).not.toBe(defaultView);
    expect(invalidFiniteView).not.toContain("NaN");
    expect(invalidFiniteView).not.toContain("Infinity");
  });
});
