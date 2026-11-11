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

  it("keeps full box-pleat labels aligned to vertical and horizontal guide lines", () => {
    const guides = [
      lineMark("foldLine", "fold", point(3, 0), point(3, 10), "Box pleat 1 fold"),
      lineMark("foldLine", "roll", point(0, 4), point(10, 4), "Box pleat 2 roll"),
      lineMark("foldLine", "other", point(4, 0), point(4, 10), "Custom construction guide"),
      lineMark("foldLine", "edge", point(0, 0), point(0, 10), "Box pleat 3 fold"),
      lineMark("foldLine", "outside", point(-0.4, 0), point(-0.4, 10), "Box pleat 4 fold"),
      lineMark("foldLine", "outside", point(20.4, 0), point(20.4, 10), "Box pleat 5 fold"),
      lineMark("foldLine", "short", point(6, 4), point(6, 5), "Box pleat 6 fold"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides", 20);

    expect(pdf).toMatch(/BT \/F1 7 Tf 0 1 -1 0 [\d.]+ [\d.]+ Tm \(Box pleat 1 fold\) Tj ET/);
    expect(pdf).toMatch(/BT \/F1 7 Tf [\d.]+ [\d.]+ Td \(Box pleat 2 roll\) Tj ET/);
    expect(pdf).toMatch(/BT \/F1 7 Tf 0 1 -1 0 11\.339 [\d.]+ Tm \(Box pleat 3 fold\) Tj ET/);
    expect(pdf).not.toContain("(Box pleat 4 fold) Tj ET");
    expect(pdf).not.toContain("(Box pleat 5 fold) Tj ET");
    expect(pdf).not.toContain("(Box pleat 6 fold) Tj ET");
    expect(pdf).toContain("(Custom construction guide) Tj ET");
    expect(pdf).toContain("Box pleat 1 fold");
    expect(pdf).toContain("Box pleat 2 roll");
  });

  it("keeps the no-page-width aligned-label helper fallback for both line orientations", () => {
    const guides = [
      lineMark("foldLine", "fold", point(3, 0), point(3, 10), "Box pleat 1 fold"),
      lineMark("foldLine", "roll", point(0, 4), point(10, 4), "Box pleat 2 roll"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides");

    expect(pdf).toMatch(/0 1 -1 0 [\d.]+ [\d.]+ Tm \(Box pleat 1 fold\) Tj ET/);
    expect(pdf).toMatch(/BT \/F1 7 Tf [\d.]+ [\d.]+ Td \(Box pleat 2 roll\) Tj ET/);
  });

  it("keeps horizontal guide labels on-page and omits off-page or too-short fragments", () => {
    const guides = [
      lineMark("foldLine", "outside", point(0, -0.1), point(20, -0.1), "Box pleat 1 fold"),
      lineMark("foldLine", "outside", point(0, 20.1), point(20, 20.1), "Box pleat 2 fold"),
      lineMark("foldLine", "short", point(0, 10), point(1, 10), "Box pleat 3 fold"),
      lineMark("foldLine", "bottom-edge", point(0, 19.9), point(20, 19.9), "Box pleat 4 fold"),
      lineMark("foldLine", "top-edge", point(0, 0.1), point(20, 0.1), "Box pleat 5 fold"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides", 20);

    expect(pdf).not.toContain("(Box pleat 1 fold) Tj ET");
    expect(pdf).not.toContain("(Box pleat 2 fold) Tj ET");
    expect(pdf).not.toContain("(Box pleat 3 fold) Tj ET");
    expect(pdf).toContain("(Box pleat 4 fold) Tj ET");
    expect(pdf).toContain("(Box pleat 5 fold) Tj ET");
  });

  it("does not place a label on a diagonal guide or duplicate it where no free segment remains", () => {
    const guides = [
      lineMark("foldLine", "diagonal", point(0, 0), point(5, 4), "Box pleat 1 fold"),
      lineMark("foldLine", "short-a", point(3, 8), point(3, 12), "Box pleat 2 fold"),
      lineMark("foldLine", "short-b", point(3, 8), point(3, 12), "Box pleat 2 fold"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides", 20);

    expect(pdf).toContain("(Box pleat 1 fold) Tj ET");
    expect([...pdf.matchAll(/\(Box pleat 2 fold\) Tj ET/g)]).toHaveLength(1);
  });

  it("searches within a clipped guide segment without moving its label outside the segment", () => {
    const guide = lineMark("foldLine", "fold", point(3, -3), point(3, 5), "Box pleat 1 fold");
    const pdf = patternMarksPdfOps([guide], 20, "line-aligned-box-pleat-guides", 20);

    expect(pdf).toMatch(/0 1 -1 0 [\d.]+ [\d.]+ Tm \(Box pleat 1 fold\) Tj ET/);
  });

  it("does not misplace a label on a second identical horizontal guide", () => {
    const guides = [
      lineMark("foldLine", "roll-a", point(0, 10), point(5, 10), "Box pleat 1 roll"),
      lineMark("foldLine", "roll-b", point(0, 10), point(5, 10), "Box pleat 1 roll"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides", 20);

    expect([...pdf.matchAll(/\(Box pleat 1 roll\) Tj ET/g)]).toHaveLength(1);
  });

  it("separates labels on crowded parallel vertical guides without clipping them", () => {
    const labels = [
      lineMark("placementLine", "placement", point(19.2, 0), point(19.2, 20), "Box pleat 1 placement"),
      lineMark("placementLine", "placement", point(19.45, 0), point(19.45, 20), "Box pleat 2 placement"),
    ];
    const pdf = patternMarksPdfOps(labels, 20, "line-aligned-box-pleat-guides", 20);
    const starts = Array.from(pdf.matchAll(/0 1 -1 0 ([\d.]+) ([\d.]+) Tm \(Box pleat \d placement\) Tj ET/g), (match) => ({
      x: Number(match[1]),
      y: Number(match[2]),
    }));
    const labelWidth = "Box pleat 1 placement".length * 7 * 0.5;

    expect(starts).toHaveLength(2);
    expect(starts[0].x).toBeGreaterThan(0);
    expect(starts[0].x).toBeLessThan(20 * 72 / 2.54);
    expect(Math.abs(starts[0].y - starts[1].y)).toBeGreaterThan(labelWidth);
    for (const start of starts) {
      expect(start.y).toBeGreaterThan(0);
      expect(start.y + labelWidth).toBeLessThan(20 * 72 / 2.54);
    }
  });

  it("separates labels on crowded parallel horizontal guides within the page", () => {
    const labels = [
      lineMark("placementLine", "placement", point(0, 9.9), point(20, 9.9), "Box pleat 1 placement"),
      lineMark("placementLine", "placement", point(0, 10.1), point(20, 10.1), "Box pleat 2 placement"),
    ];
    const pdf = patternMarksPdfOps(labels, 20, "line-aligned-box-pleat-guides", 20);
    const starts = Array.from(pdf.matchAll(/BT \/F1 7 Tf ([\d.]+) ([\d.]+) Td \(Box pleat \d placement\) Tj ET/g), (match) => ({
      x: Number(match[1]),
      y: Number(match[2]),
    }));
    const labelWidth = "Box pleat 1 placement".length * 7 * 0.5;

    expect(starts).toHaveLength(2);
    expect(Math.abs(starts[0].x - starts[1].x)).toBeGreaterThan(labelWidth);
    for (const start of starts) {
      expect(start.x).toBeGreaterThan(0);
      expect(start.x + labelWidth).toBeLessThan(20 * 72 / 2.54);
      expect(start.y).toBeGreaterThan(0);
      expect(start.y).toBeLessThan(20 * 72 / 2.54);
    }
  });
});
