import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { lineMark, pointMark } from "../drafting";
import {
  boxPleatGuideKeyPdfOps,
  compactBoxPleatGuideId,
  patternMarksDxf,
  patternMarksPdfOps,
  translatePatternMarks,
  unfoldPatternMarks,
} from "./pattern-mark";

const MARKS = [
  lineMark("cutLine", "slit", point(0, 0), point(0, 14), "CUT SLIT"),
  lineMark("foldLine", "fold", point(2, 0), point(2, 14)),
  lineMark("placementLine", "attach", point(3, 0), point(3, 14)),
  pointMark("button", "button-1", point(4, 4), "BUTTON 1"),
  pointMark("buttonhole", "hole-1", point(4, 7)),
  pointMark("placementPoint", "point", point(4, 10)),
] as const;

describe("export pattern marks", () => {
  it("maps each K04 role and group to a bounded compact identifier", () => {
    expect(compactBoxPleatGuideId("Box pleat 1 fold")).toBe("F1");
    expect(compactBoxPleatGuideId("Box pleat 12 roll")).toBe("R12");
    expect(compactBoxPleatGuideId("Box pleat 12 placement")).toBe("P12");
    expect(compactBoxPleatGuideId("custom guide")).toBeUndefined();
    expect(compactBoxPleatGuideId("Box pleat 0 fold")).toBeUndefined();
    expect(compactBoxPleatGuideId("Box pleat 13 fold")).toBeUndefined();
    expect(compactBoxPleatGuideId("Box pleat " + "9".repeat(400) + " fold")).toBeUndefined();
  });

  it("writes the complete K04 role/group key at the requested page position", () => {
    const key = boxPleatGuideKeyPdfOps(2, 5, 29.7, 9);
    expect(key).toContain("BOX-PLEAT GUIDE KEY");
    expect(key).toContain("(F1-F12  Fold guide lines)");
    expect(key).toContain("(R1-R12  Roll guide lines)");
    expect(key).toContain("(P1-P12  Placement guide lines)");
    expect(key).toContain("(The number identifies the box-pleat group.)");
    expect(key).toMatch(/BT \/F1 11 Tf [\d.]+ [\d.]+ Td \(BOX-PLEAT GUIDE KEY\) Tj ET/);
  });

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

  it("prints compact role/group IDs beside vertical and horizontal guide lines", () => {
    const guides = [
      lineMark("foldLine", "fold", point(3, 0), point(3, 10), "Box pleat 1 fold"),
      lineMark("foldLine", "roll", point(0, 4), point(10, 4), "Box pleat 2 roll"),
      lineMark("foldLine", "other", point(4, 0), point(4, 10), "Custom construction guide"),
      lineMark("foldLine", "edge", point(0, 0), point(0, 10), "Box pleat 3 fold"),
      lineMark("foldLine", "outside", point(-0.4, 0), point(-0.4, 10), "Box pleat 4 fold"),
      lineMark("foldLine", "outside", point(20.4, 0), point(20.4, 10), "Box pleat 5 fold"),
      lineMark("foldLine", "short", point(6, 4), point(6, 5), "Box pleat 6 fold"),
      lineMark("foldLine", "too-short-vertical", point(7, 4), point(7, 4.5), "Box pleat 7 fold"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides", 20);

    expect(pdf).toMatch(/BT \/F1 7 Tf 0 1 -1 0 [\d.]+ [\d.]+ Tm \(F1\) Tj ET/);
    expect(pdf).toMatch(/BT \/F1 7 Tf [\d.]+ [\d.]+ Td \(R2\) Tj ET/);
    expect(pdf).toMatch(/BT \/F1 7 Tf 0 1 -1 0 [\d.]+ [\d.]+ Tm \(F3\) Tj ET/);
    expect(pdf).not.toContain("(Box pleat 4 fold) Tj ET");
    expect(pdf).not.toContain("(Box pleat 5 fold) Tj ET");
    expect(pdf).not.toContain("(Box pleat 6 fold) Tj ET");
    expect(pdf).not.toContain("(F7) Tj ET");
    expect(pdf).toContain("(Custom construction guide) Tj ET");
    expect(pdf).not.toContain("Box pleat 1 fold");
    expect(pdf).not.toContain("Box pleat 2 roll");
  });

  it("keeps the no-page-width aligned-label helper fallback for both line orientations", () => {
    const guides = [
      lineMark("foldLine", "fold", point(3, 0), point(3, 10), "Box pleat 1 fold"),
      lineMark("foldLine", "roll", point(0, 4), point(10, 4), "Box pleat 2 roll"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides");

    expect(pdf).toMatch(/0 1 -1 0 [\d.]+ [\d.]+ Tm \(F1\) Tj ET/);
    expect(pdf).toMatch(/BT \/F1 7 Tf [\d.]+ [\d.]+ Td \(R2\) Tj ET/);
  });

  it("keeps horizontal guide labels on-page and omits off-page or too-short fragments", () => {
    const guides = [
      lineMark("foldLine", "outside", point(0, -0.1), point(20, -0.1), "Box pleat 1 fold"),
      lineMark("foldLine", "outside", point(0, 20.1), point(20, 20.1), "Box pleat 2 fold"),
      lineMark("foldLine", "short", point(0, 10), point(1, 10), "Box pleat 3 fold"),
      lineMark("foldLine", "bottom-edge", point(0, 19.9), point(20, 19.9), "Box pleat 4 fold"),
      lineMark("foldLine", "top-edge", point(0, 0.1), point(20, 0.1), "Box pleat 5 fold"),
      lineMark("foldLine", "too-short-horizontal", point(0, 10), point(0.5, 10), "Box pleat 6 fold"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides", 20);

    expect(pdf).not.toContain("(Box pleat 1 fold) Tj ET");
    expect(pdf).not.toContain("(Box pleat 2 fold) Tj ET");
    expect(pdf).not.toContain("(Box pleat 3 fold) Tj ET");
    expect(pdf).toContain("(F4) Tj ET");
    expect(pdf).toContain("(F5) Tj ET");
    expect(pdf).not.toContain("(F6) Tj ET");
  });

  it("does not place a label on a diagonal guide or duplicate it where no free segment remains", () => {
    const guides = [
      lineMark("foldLine", "diagonal", point(0, 0), point(5, 4), "Box pleat 1 fold"),
      lineMark("foldLine", "short-a", point(3, 8), point(3, 12), "Box pleat 2 fold"),
      lineMark("foldLine", "short-b", point(3, 8), point(3, 12), "Box pleat 2 fold"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides", 20);

    expect(pdf).toContain("(Box pleat 1 fold) Tj ET");
    expect([...pdf.matchAll(/\(F2\) Tj ET/g)]).toHaveLength(1);
  });

  it("searches within a clipped guide segment without moving its label outside the segment", () => {
    const guide = lineMark("foldLine", "fold", point(3, -3), point(3, 5), "Box pleat 1 fold");
    const pdf = patternMarksPdfOps([guide], 20, "line-aligned-box-pleat-guides", 20);

    expect(pdf).toMatch(/0 1 -1 0 [\d.]+ [\d.]+ Tm \(F1\) Tj ET/);
  });

  it("does not misplace a label on a second identical horizontal guide", () => {
    const guides = [
      lineMark("foldLine", "roll-a", point(0, 10), point(5, 10), "Box pleat 1 roll"),
      lineMark("foldLine", "roll-b", point(0, 10), point(5, 10), "Box pleat 1 roll"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides", 20);

    expect([...pdf.matchAll(/\(R1\) Tj ET/g)]).toHaveLength(1);
  });

  it("keeps unsupported K04 groups as geometry without inventing a compact ID", () => {
    const guides = [
      lineMark("foldLine", "invalid-vertical", point(5, 1), point(5, 9), "Box pleat 13 fold"),
      lineMark("foldLine", "invalid-horizontal", point(1, 5), point(9, 5), "Box pleat 0 roll"),
    ];
    const pdf = patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides", 20);

    expect(pdf).toContain("141.732 538.583 m 141.732 311.811 l S");
    expect(pdf).toContain("28.346 425.197 m 255.118 425.197 l S");
    expect(pdf).not.toContain("(Box pleat 13 fold) Tj ET");
    expect(pdf).not.toContain("(Box pleat 0 roll) Tj ET");
  });

  it("fails explicitly when distinct guide IDs cannot fit on their shared short segment", () => {
    const shortSegmentCm = 7 / 28.346 + 0.5;
    const guides = [
      lineMark("foldLine", "same-geometry-fold", point(10, 2), point(10, 2 + shortSegmentCm), "Box pleat 1 fold"),
      lineMark("placementLine", "same-geometry-placement", point(10, 2), point(10, 2 + shortSegmentCm), "Box pleat 1 placement"),
    ];

    expect(() => patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides", 20))
      .toThrow("K04 guide ID has no collision-free segment slot");
  });

  it("rejects out-of-range alternate positions after all safe slots are occupied", () => {
    const segmentCm = 7 / 28.346 + 0.5 + 0.8;
    const guides = [
      lineMark("foldLine", "shared-slot-one", point(10, 2), point(10, 2 + segmentCm), "Box pleat 1 fold"),
      lineMark("foldLine", "shared-slot-two", point(10, 2), point(10, 2 + segmentCm), "Box pleat 2 fold"),
      lineMark("foldLine", "shared-slot-three", point(10, 2), point(10, 2 + segmentCm), "Box pleat 3 fold"),
    ];

    expect(() => patternMarksPdfOps(guides, 20, "line-aligned-box-pleat-guides", 20))
      .toThrow("K04 guide ID has no collision-free segment slot");
  });

  it("fails explicitly when no clear label slot exists instead of dropping a guide ID", () => {
    const vertical = [
      lineMark("foldLine", "near-edge-a", point(0.05, 0), point(0.05, 10), "Box pleat 1 fold"),
      lineMark("foldLine", "near-edge-b", point(0.15, 0), point(0.15, 10), "Box pleat 2 fold"),
    ];
    const horizontal = [
      lineMark("foldLine", "near-edge-a", point(0, 0.05), point(10, 0.05), "Box pleat 1 fold"),
      lineMark("foldLine", "near-edge-b", point(0, 0.15), point(10, 0.15), "Box pleat 2 fold"),
    ];
    expect(() => patternMarksPdfOps(vertical, 20, "line-aligned-box-pleat-guides", 20))
      .toThrow("K04 guide ID has no clear horizontal slot on the page");
    expect(() => patternMarksPdfOps(horizontal, 20, "line-aligned-box-pleat-guides", 20))
      .toThrow("K04 guide ID has no clear vertical slot on the page");
  });

  it("separates labels on crowded parallel vertical guides without clipping them", () => {
    const labels = [
      lineMark("placementLine", "placement", point(19.2, 0), point(19.2, 20), "Box pleat 1 placement"),
      lineMark("placementLine", "placement", point(19.45, 0), point(19.45, 20), "Box pleat 2 placement"),
    ];
    const pdf = patternMarksPdfOps(labels, 20, "line-aligned-box-pleat-guides", 20);
    const starts = Array.from(pdf.matchAll(/0 1 -1 0 ([\d.]+) ([\d.]+) Tm \(P\d\) Tj ET/g), (match) => ({
      x: Number(match[1]),
      y: Number(match[2]),
    }));
    const lineXs = [19.2, 19.45];
    const ptPerCm = 72 / 2.54;
    const labelHalfExtentCm = 7 / ptPerCm / 2;
    const labelClearancePt = (labelHalfExtentCm + 0.05) * ptPerCm;
    const labelWidth = 7;

    expect(starts).toHaveLength(2);
    expect(starts[0].x).toBeGreaterThan(0);
    expect(starts[0].x).toBeLessThan(20 * 72 / 2.54);
    for (const start of starts) {
      const labelCenterXcm = start.x / ptPerCm - labelHalfExtentCm;
      const labelLeftXcm = start.x / ptPerCm - labelHalfExtentCm * 2;
      const labelRightXcm = start.x / ptPerCm;
      expect(labelLeftXcm).toBeGreaterThan(0);
      expect(labelRightXcm).toBeLessThan(20);
      expect(Math.min(...lineXs.map((lineX) => Math.abs(labelCenterXcm - lineX))) * ptPerCm)
        .toBeGreaterThanOrEqual(labelClearancePt);
    }
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
    const starts = Array.from(pdf.matchAll(/BT \/F1 7 Tf ([\d.]+) ([\d.]+) Td \(P\d\) Tj ET/g), (match) => ({
      x: Number(match[1]),
      y: Number(match[2]),
    }));
    const lineYs = [9.9, 10.1];
    const ptPerCm = 72 / 2.54;
    const labelHalfExtentCm = 7 / ptPerCm / 2;
    const labelClearanceCm = labelHalfExtentCm + 0.05;
    const labelWidth = 7;

    expect(starts).toHaveLength(2);
    const labelYsCm = starts.map((start) => 20 - start.y / ptPerCm - labelHalfExtentCm);
    expect(Math.abs(labelYsCm[0] - labelYsCm[1])).toBeGreaterThanOrEqual(labelClearanceCm * 2);
    for (const labelY of labelYsCm) {
      expect(labelY - labelHalfExtentCm).toBeGreaterThan(0);
      expect(labelY + labelHalfExtentCm).toBeLessThan(20);
      expect(Math.min(...lineYs.map((lineY) => Math.abs(labelY - lineY)))).toBeGreaterThanOrEqual(labelClearanceCm);
    }
    for (const start of starts) {
      expect(start.x).toBeGreaterThan(0);
      expect(start.x + labelWidth).toBeLessThan(20 * 72 / 2.54);
      expect(start.y).toBeGreaterThan(0);
      expect(start.y).toBeLessThan(20 * 72 / 2.54);
    }
  });
});
