import { describe, expect, it } from "vitest";
import { lineMark, STANDARD_M, draftPolo, rolePiece } from "../drafting";
import type { PatternMark } from "../drafting";
import { point } from "../geometry";
import { BLUEPRINT } from "../render/theme";
import { patternAnnotationKeyMarkup } from "./view";

function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string): number => {
    const channels = hex.slice(1).match(/.{2}/g)!.map((channel) => parseInt(channel, 16) / 255);
    const linear = channels.map((channel) => channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4);
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  };
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

describe("Pattern annotation key", () => {
  it("groups readable labels and explicit instructions by their pattern piece", () => {
    const source = rolePiece(draftPolo(STANDARD_M), "buttonPlacket");
    const piece = { ...source, onFold: true };
    const html = patternAnnotationKeyMarkup([piece]);

    expect(html).toContain("Pattern key");
    expect(html).toContain("BUTTON PLACKET");
    expect(html).toContain("Cut on fold");
    expect(html).toContain('class="pattern-annotation-role">Instruction</span>');
    expect(html).toContain('class="pattern-annotation-role">Label</span>');
    expect(html).toContain("TURN UNDER");
    expect(html).toContain("Button mark");
    expect(html).toContain("(3 marks)");
  });

  it("escapes source text and provides an explicit empty state", () => {
    const source = rolePiece(draftPolo(STANDARD_M), "front");
    const malicious: PatternMark = lineMark(
      "placementLine", "user-visible-label", point(0, 0), point(0, 1), '<script>alert("x")</script>',
    );
    const blankLabel = lineMark("placementLine", "blank-label", point(0, 0), point(0, 1), "   ");
    const html = patternAnnotationKeyMarkup([{ ...source, name: "<piece>", onFold: false, marks: [malicious, blankLabel] }]);

    expect(html).toContain("&lt;PIECE&gt;");
    expect(html).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("Cut on fold");
    expect(html.match(/pattern-annotation-row /g)).toHaveLength(1);
  });

  it("offers a keyboard-operable block action with a selected state and feedback region", () => {
    const source = rolePiece(draftPolo(STANDARD_M), "front");
    const html = patternAnnotationKeyMarkup([source], source.name, "Related measurements are highlighted.");
    expect(html).toContain('data-pattern-piece-index="0"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('aria-label="Open related measurements for FRONT pattern block"');
    expect(html).toContain('id="pattern-measurement-feedback"');
    expect(html).toContain("Related measurements are highlighted.");
    expect(html).toContain("Activate a piece or its name to open related measurements.");
  });

  it("uses three high-contrast colors whose meaning is reinforced by text and shape", () => {
    for (const color of [BLUEPRINT.patternHeading, BLUEPRINT.patternLabel, BLUEPRINT.patternInstruction]) {
      expect(contrastRatio(color, BLUEPRINT.background)).toBeGreaterThanOrEqual(4.5);
    }
    expect(BLUEPRINT.patternLabel).not.toBe(BLUEPRINT.patternInstruction);
  });
});
