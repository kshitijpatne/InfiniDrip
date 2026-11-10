import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { lineMark, pointMark } from "../drafting";
import { patternMarksDxf, patternMarksPdfOps, translatePatternMarks, unfoldPatternMarks } from "./pattern-mark";

const MARKS = [
  lineMark("cutLine", "slit", point(0, 0), point(0, 14), "CUT SLIT"),
  lineMark("foldLine", "fold", point(2, 0), point(2, 14)),
  lineMark("placementLine", "attach", point(3, 0), point(3, 14)),
  pointMark("button", "button-1", point(4, 4), "BUTTON 1"),
  pointMark("buttonhole", "hole-1", point(4, 7)),
  pointMark("placementPoint", "point", point(4, 10)),
] as const;

describe("export pattern marks", () => {
  it("translates marks and preserves an on-fold mark once when unfolding", () => {
    const translated = translatePatternMarks(MARKS, 5, 6);
    expect((translated[0] as { start: { x: number } }).start.x).toBe(5);
    expect(unfoldPatternMarks(MARKS)).toHaveLength(11); // one on-fold line; every other mark mirrors
    expect(translatePatternMarks(undefined, 0, 0)).toEqual([]);
    expect(unfoldPatternMarks(undefined)).toEqual([]);
  });

  it("writes line, button, and point entities to dedicated DXF layers", () => {
    const dxf = patternMarksDxf(MARKS, 20);
    expect(dxf).toContain("0\nLINE\n8\nMARK_CUTLINE");
    expect(dxf).toContain("0\nCIRCLE\n8\nMARK_BUTTON");
    expect(dxf).toContain("0\nPOINT\n8\nMARK_BUTTONHOLE");
    expect(patternMarksDxf(undefined, 20)).toBe("");
  });

  it("keeps the legacy point by default and can draw a buttonhole cross at its exact center", () => {
    const legacy = patternMarksDxf([MARKS[4]], 20);
    const candidate = patternMarksDxf([MARKS[4]], 20, 6, "cross");
    expect(legacy).toContain("0\nPOINT\n8\nMARK_BUTTONHOLE");
    expect(candidate.match(/\nLINE\n/g)).toHaveLength(2);
    expect(candidate).toContain("10\n3.75\n20\n13\n11\n4.25\n21\n13\n");
    expect(candidate).toContain("10\n4\n20\n12.75\n11\n4\n21\n13.25\n");
  });

  it("writes true-scale PDF operators and optional labels", () => {
    const pdf = patternMarksPdfOps(MARKS, 20);
    expect(pdf).toContain("CUT SLIT");
    expect(pdf).toContain(" re S");
    expect(pdf).toContain(" m ");
    expect(patternMarksPdfOps(undefined, 20)).toBe("");
  });

  it("stagger-layouts only recognized box-pleat guide labels on vertical lines", () => {
    const guides = [
      lineMark("foldLine", "fold", point(3, 0), point(3, 10), "Box pleat 1 fold"),
      lineMark("foldLine", "roll", point(4, 0), point(4, 10), "Box pleat 1 roll"),
      lineMark("placementLine", "placement", point(5, 0), point(5, 10), "Box pleat 1 placement"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "staggered-box-pleat-guides");
    expect(pdf).toContain("92.126 462.047 Td (Box pleat 1 fold) Tj ET");
    expect(pdf).toContain("120.472 439.37 Td (Box pleat 1 roll) Tj ET");
    expect(pdf).toContain("148.819 416.693 Td (Box pleat 1 placement) Tj ET");
    expect(patternMarksPdfOps(guides, 20)).not.toContain("92.126 462.047 Td");
  });
});
