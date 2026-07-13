import { describe, it, expect } from "vitest";
import { STANDARD_M, TEE, FITTED } from "../drafting";
import { PAGE_LETTER } from "./pdf";
import { exportTechPack, pdfString } from "./techpack";

// ── pdfString ─────────────────────────────────────────────────────────────────

describe("pdfString", () => {
  it("escapes the PDF string metacharacters \\ ( )", () => {
    expect(pdfString("a(b)c\\d")).toBe("a\\(b\\)c\\\\d");
  });

  it("folds typographic dashes and the times sign to ASCII", () => {
    expect(pdfString("HPS–hem")).toBe("HPS-hem");
    expect(pdfString("A—B")).toBe("A-B");
    expect(pdfString("2×3")).toBe("2x3");
  });

  it("replaces other non-ASCII (and control) characters with '?'", () => {
    expect(pdfString("café")).toBe("caf?"); // é → ?
    expect(pdfString("a\tb")).toBe("a?b"); // tab (control) → ?
  });

  it("passes plain printable ASCII through untouched", () => {
    expect(pdfString("Body chest 42.0")).toBe("Body chest 42.0");
  });
});

// ── exportTechPack ────────────────────────────────────────────────────────────

describe("exportTechPack", () => {
  const pdf = exportTechPack(TEE, STANDARD_M);

  it("is a valid PDF with header, xref, trailer and EOF", () => {
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("xref");
    expect(pdf).toContain("trailer");
    expect(pdf).toContain("/Root 1 0 R");
    expect(pdf).toContain("%%EOF");
  });

  it("is exactly three pages: sketch, spec, BOM/construction", () => {
    expect(pdf).toContain("/Count 3");
    const pages = [...pdf.matchAll(/\/Type \/Page[^s]/g)];
    expect(pages.length).toBe(3);
  });

  it("titles the sketch with the garment label", () => {
    expect(pdf).toContain("(Tee - Tech Pack)");
  });

  it("labels every drafted piece on the sketch", () => {
    const block = TEE.draft(STANDARD_M);
    for (const name of [block.front.name, block.back.name, block.sleeve.name]) {
      expect(pdf).toContain(`(${name.toUpperCase()})`);
    }
  });

  it("prints the spec table with every POM label and the size columns", () => {
    for (const pom of TEE.poms) {
      // labels may contain ( ) and dashes, so compare against the escaped form
      expect(pdf).toContain(`(${pdfString(pom.label)})`);
    }
    for (const sz of TEE.sizes) expect(pdf).toContain(`(${sz.label})`);
  });

  it("prints the BOM rows and numbered construction steps", () => {
    for (const row of TEE.techPack.bom) {
      expect(pdf).toContain(`(${pdfString(row.material)})`);
    }
    expect(pdf).toContain("Bill of Materials");
    expect(pdf).toContain("Construction");
    expect(pdf).toContain(`(1. ${pdfString(TEE.techPack.construction[0])})`);
  });

  it("draws the sketch outlines as stroked paths", () => {
    expect(pdf).toContain(" m ");
    expect(pdf).toContain(" l ");
    expect(pdf).toContain(" h S");
  });

  it("works for the fitted garment and includes its dart construction step", () => {
    const fit = exportTechPack(FITTED, STANDARD_M);
    expect(fit.startsWith("%PDF-1.4")).toBe(true);
    expect(fit).toContain("(Fitted - Tech Pack)");
    expect(fit).toContain("(2. Sew the bust darts; press them toward the hem.)");
  });

  it("honours a custom page size", () => {
    const letter = exportTechPack(TEE, STANDARD_M, PAGE_LETTER);
    expect(letter.startsWith("%PDF-1.4")).toBe(true);
    expect(letter).toContain("%%EOF");
  });
});
