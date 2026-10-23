import { describe, expect, it } from "vitest";
import { STANDARD_M } from "../drafting/measurements";
import { CREWNECK_DEFAULT_OPTIONS, CREWNECK_OPTION_DEFINITIONS } from "../drafting/crewneck-contract";
import type { GarmentOptions } from "../drafting/options";
import { renderCrewneckFigure } from "./crewneck-figure";

describe("renderCrewneckFigure", () => {
  it("renders default front and back schematics, all band cues, and the disclosure", () => {
    const options = Object.freeze({ ...CREWNECK_DEFAULT_OPTIONS });
    const svg = renderCrewneckFigure(STANDARD_M, "#123456", options);

    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain(">FRONT<");
    expect(svg).toContain(">BACK<");
    expect(svg).toContain('data-disclosure="schematic-not-pattern-linked"');
    expect(svg).toMatch(/viewBox="0 0 [\d.]+ 100"/);
    expect(svg).toContain("SCHEMATIC ONLY · NOT PATTERN-LINKED · NO FIT OR MATERIAL CLAIM");
    expect(svg).toContain('data-band-cue="neckband"');
    expect(svg).toContain('data-band-cue="cuff"');
    expect(svg).toContain('data-band-cue="hem-band"');
    for (const definition of CREWNECK_OPTION_DEFINITIONS) {
      expect(svg).toContain('data-option-id="' + definition.id + '"');
      expect(svg).toContain(definition.label + ":");
    }
    expect(svg).toContain('data-invalid="false"');
    expect(svg).toContain('fill="#123456"');
    expect(options).toEqual(CREWNECK_DEFAULT_OPTIONS);
  });

  it("uses custom finite values in both schematic cues and the six-option legend", () => {
    const options = Object.freeze({
      ...CREWNECK_DEFAULT_OPTIONS,
      neckbandDepth: 4,
      cuffDepth: 8,
      hemBandDepth: 10,
      neckbandLength: 42.123456,
      cuffLength: 34,
      hemBandLength: 99,
    });
    const svg = renderCrewneckFigure(STANDARD_M, "#654321", options);

    expect(svg).toContain('data-option-value="4 cm"');
    expect(svg).toContain('data-option-value="42.123456 cm"');
    expect(svg).toContain('data-option-value="8 cm"');
    expect(svg).toContain('data-option-value="34 cm"');
    expect(svg).toContain('data-option-value="10 cm"');
    expect(svg).toContain('data-option-value="99 cm"');
    expect(svg).toContain('y1="60"');
    expect(svg).toMatch(/viewBox="0 0 [\d.]+ 100"/);
    expect(options).toEqual({
      ...CREWNECK_DEFAULT_OPTIONS,
      neckbandDepth: 4,
      cuffDepth: 8,
      hemBandDepth: 10,
      neckbandLength: 42.123456,
      cuffLength: 34,
      hemBandLength: 99,
    });
  });

  it("keeps missing and invalid options visible and skips unsafe depth cues", () => {
    const options = {
      neckbandDepth: 0,
      cuffDepth: Number.NaN,
      hemBandDepth: 16,
      neckbandLength: 0,
      cuffLength: Number.POSITIVE_INFINITY,
      hemBandLength: 201,
    } as unknown as GarmentOptions;
    const svg = renderCrewneckFigure(STANDARD_M, "#123456", options);

    expect(svg).toContain('data-option-value="0 cm"');
    expect(svg).toContain('data-option-value="NaN"');
    expect(svg).toContain('data-option-value="16 cm"');
    expect(svg).toContain('data-option-value="Infinity"');
    expect(svg).toContain("invalid; set within 1–8 cm");
    expect(svg).toContain("invalid; set within 2–15 cm");
    expect(svg).toContain("invalid; set within 1–120 cm");
    expect(svg).toContain("invalid; set within 1–100 cm");
    expect(svg).toContain("invalid; set within 1–200 cm");
    expect(svg).not.toContain('data-edge="option-neckbandDepth"');
    expect(svg).not.toContain('data-edge="option-cuffDepth"');
    expect(svg).not.toContain('data-edge="option-hemBandDepth"');
    expect(svg).toContain('data-invalid="true"');

    const missing = renderCrewneckFigure(
      STANDARD_M,
      "#123456",
      {} as GarmentOptions,
    );
    expect(missing).toContain('data-option-value="missing"');
    expect(missing).not.toContain('data-edge="option-neckbandDepth"');
    expect(missing).not.toContain('data-edge="option-cuffDepth"');
    expect(missing).not.toContain('data-edge="option-hemBandDepth"');
  });
});
