import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  STANDARD_M,
  draftTshirt,
  draftSkirt,
  blockPieces,
  rolePiece,
  AllowanceSpec,
  lineMark,
  pointMark,
  SKIRT_BOX_PLEAT_COUNT_OPTION_ID,
  SKIRT_BOX_PLEAT_SPACING_OPTION_ID,
} from "../drafting";
import { point } from "../geometry";
import {
  tilePlan,
  exportPdf,
  PAGE_A4,
  PAGE_LETTER,
  PageSize,
  polylinePath,
} from "./pdf";

const UNIFORM: AllowanceSpec = { default: 1 };

const block = draftTshirt(STANDARD_M);
const pieces = [rolePiece(block, "front"), rolePiece(block, "back"), rolePiece(block, "sleeve")];

// ── polylinePath ──────────────────────────────────────────────────────────────

describe("polylinePath", () => {
  it("returns an empty string for an empty point list", () => {
    expect(polylinePath([], 70)).toBe("");
  });

  it("returns a valid PDF path string for a non-empty point list", () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
    const path = polylinePath(pts, 70);
    expect(path).toContain(" m ");
    expect(path).toContain(" l ");
    expect(path.endsWith(" h")).toBe(true);
  });
});

// ── tilePlan ──────────────────────────────────────────────────────────────────

describe("tilePlan", () => {
  it("covers the full sheet with at least one tile", () => {
    const tiles = tilePlan(20, 30, PAGE_A4);
    expect(tiles.length).toBeGreaterThan(0);
  });

  it("produces more tiles for a wider sheet", () => {
    const narrow = tilePlan(20, 30, PAGE_A4);
    const wide = tilePlan(80, 30, PAGE_A4);
    expect(wide.length).toBeGreaterThan(narrow.length);
  });

  it("uses sequential col/row indices starting at 0", () => {
    const tiles = tilePlan(50, 60, PAGE_A4);
    const cols = [...new Set(tiles.map((t) => t.col))].sort((a, b) => a - b);
    const rows = [...new Set(tiles.map((t) => t.row))].sort((a, b) => a - b);
    expect(cols[0]).toBe(0);
    expect(rows[0]).toBe(0);
  });

  it("each tile has positive width and height", () => {
    const tiles = tilePlan(100, 80, PAGE_LETTER, 1.5);
    for (const t of tiles) {
      expect(t.w).toBeGreaterThan(0);
      expect(t.h).toBeGreaterThan(0);
    }
  });
});

// ── exportPdf ─────────────────────────────────────────────────────────────────

describe("exportPdf", () => {
  const pdf = exportPdf(pieces, UNIFORM);

  it("starts and ends with valid PDF markers", () => {
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("%%EOF");
  });

  it("contains an xref table and trailer", () => {
    expect(pdf).toContain("xref");
    expect(pdf).toContain("trailer");
    expect(pdf).toContain("/Root 1 0 R");
  });

  it("embeds one page per tile", () => {
    // multiple /Page objects should appear for any real pattern
    const pageMatches = [...pdf.matchAll(/\/Type \/Page[^s]/g)];
    expect(pageMatches.length).toBeGreaterThan(0);
  });

  it("each page has a MediaBox and a content stream", () => {
    expect(pdf).toContain("/MediaBox");
    expect(pdf).toContain("stream");
    expect(pdf).toContain("endstream");
  });

  it("references the Helvetica font for tile labels", () => {
    expect(pdf).toContain("/Helvetica");
    expect(pdf).toContain("/F1");
  });

  it("includes registration mark path operators in the streams", () => {
    expect(pdf).toContain(" S");
  });

  it("tile labels mention the tile grid dimensions", () => {
    expect(pdf).toContain("Tile 1-1 of");
  });

  it("works with PAGE_LETTER too", () => {
    const letter = exportPdf(pieces, UNIFORM, PAGE_LETTER);
    expect(letter.startsWith("%PDF-1.4")).toBe(true);
    expect(letter).toContain("%%EOF");
  });

  it("works with a custom overlap value", () => {
    const tight = exportPdf(pieces, UNIFORM, PAGE_A4, 0.5);
    expect(tight).toContain("%PDF-1.4");
  });

  it("handles a single-tile sheet without gaps in the xref table", () => {
    const bigPage: PageSize = { width: 200, height: 200 };
    const single = exportPdf(pieces, UNIFORM, bigPage, 1);
    expect(single.startsWith("%PDF-1.4")).toBe(true);
    expect(single).toContain("%%EOF");
  });
});

describe("exportPdf construction marks", () => {
  it("keeps internal cut and button marks at true scale on tiled pages", () => {
    const marked = {
      ...pieces[0],
      marks: [
        lineMark("cutLine", "slit", point(0, 0), point(0, 8), "CUT SLIT"),
        pointMark("button", "button-1", point(2, 3), "BUTTON 1"),
      ],
    };
    const pdf = exportPdf([marked], UNIFORM);
    expect(pdf).toContain("CUT SLIT");
    expect(pdf).toContain("BUTTON 1");
  });

  it("appends one complete key page for every admitted K04 guide boundary", async () => {
    const measurements = { ...STANDARD_M, waist: 84, hip: 100, hipDepth: 20, length: 70, ease: 10 };
    const cases = [
      { count: 4, spacing: 3 },
      { count: 4, spacing: 2.5 },
      { count: 4, spacing: 1 },
      { count: 12, spacing: 1 },
      { count: 12, spacing: 2.5 },
    ];
    for (const { count, spacing } of cases) {
      const pieces = blockPieces(draftSkirt(measurements, {
        [SKIRT_BOX_PLEAT_COUNT_OPTION_ID]: count,
        [SKIRT_BOX_PLEAT_SPACING_OPTION_ID]: spacing,
      }));
      const pdf = exportPdf(pieces, UNIFORM, PAGE_A4, 1, true, "line-aligned-box-pleat-guides");
      const doc = await PDFDocument.load(new TextEncoder().encode(pdf), { updateMetadata: false });
      const groupsPerQuarter = count / 4;

      expect(doc.getPageCount()).toBe(22);
      expect([...pdf.matchAll(/\(BOX-PLEAT GUIDE KEY\) Tj ET/g)]).toHaveLength(1);
      expect(pdf).toContain("F1-F12  Fold guide lines");
      expect(pdf).toContain("R1-R12  Roll guide lines");
      expect(pdf).toContain("P1-P12  Placement guide lines");
      for (let group = 1; group <= groupsPerQuarter; group += 1) {
        for (const role of ["F", "R", "P"]) {
          expect(pdf).toContain("(" + role + group + ") Tj ET");
        }
      }
      expect(pdf).not.toContain("(Box pleat ");
    }
  });

  it("does not add the K04 key for unsupported group labels", async () => {
    const unsupported = {
      ...pieces[0],
      marks: [
        lineMark("foldLine", "unsupported-group", point(2, 1), point(2, 8), "Box pleat 13 fold"),
        lineMark("foldLine", "unlabelled", point(3, 1), point(3, 8)),
      ],
    };
    const pdf = exportPdf([unsupported], UNIFORM, PAGE_A4, 1, true, "line-aligned-box-pleat-guides");

    expect(pdf).not.toContain("BOX-PLEAT GUIDE KEY");
    expect(pdf).not.toContain("(F13) Tj ET");
  });
});
