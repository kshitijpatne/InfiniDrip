import { describe, it, expect } from "vitest";
import { FITTED, SKIRT, STANDARD_M, TEE, rolePiece, sampleSpec } from "../drafting";
import { PAGE_A4, PAGE_LETTER, pt } from "./pdf";
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

  it("is exactly four pages: sketch, spec, BOM/construction, fit record", () => {
    expect(pdf).toContain("/Count 4");
    const pages = [...pdf.matchAll(/\/Type \/Page[^s]/g)];
    expect(pages.length).toBe(4);
  });

  it("titles the sketch with the garment label", () => {
    expect(pdf).toContain("(Tee - Tech Pack)");
  });

  it("labels every drafted piece on the sketch", () => {
    const block = TEE.draft(STANDARD_M);
    for (const name of [rolePiece(block, "front").name, rolePiece(block, "back").name, rolePiece(block, "sleeve").name]) {
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

// ── callout leaders (23-b) ────────────────────────────────────────────────────

const count = (haystack: string, needle: string): number => haystack.split(needle).length - 1;

describe("tech-pack callout leaders", () => {
  const pdf = exportTechPack(TEE, STANDARD_M);

  it("draws an anchored POM label three times (sketch callout, spec table, fit record)", () => {
    // "Body chest (finished)" is anchored → callout + spec table row + slice-45
    // Fit Record row. Was 2 before slice 45 added a fourth page that also lists
    // every POM; the count changing is a deliberate signal the new page landed,
    // not a stale assertion.
    expect(count(pdf, `(${pdfString("Body chest (finished)")})`)).toBe(3);
  });

  it("draws an un-anchored POM label twice (spec table + fit record, no callout)", () => {
    // "Sleeve hem" has no anchor → spec table row + Fit Record row, never a callout.
    expect(count(pdf, "(Sleeve hem)")).toBe(2);
  });

  it("marks each callout with a dot at its anchor point", () => {
    expect(pdf).toContain(" re f"); // filled dot rectangles
  });

  it("the tee anchors five front-body POMs, each returning a finite front point", () => {
    const anchored = TEE.poms.filter((p) => p.anchor);
    expect(anchored.length).toBe(5);
    const block = TEE.draft(STANDARD_M);
    for (const p of anchored) {
      const pt2 = p.anchor!(block);
      expect(Number.isFinite(pt2.x) && Number.isFinite(pt2.y)).toBe(true);
    }
  });

  it("gives the fitted garment a lighter callout set than the tee", () => {
    const tee = TEE.poms.filter((p) => p.anchor).length;
    const fitted = FITTED.poms.filter((p) => p.anchor).length;
    expect(fitted).toBeGreaterThan(0);
    expect(fitted).toBeLessThan(tee);
  });
});

describe("tech-pack spec table — tolerances", () => {
  it("prints a Tol column with each POM's value, and a dash where none is set", () => {
    const pdf = exportTechPack(TEE, STANDARD_M);
    expect(pdf).toContain("(Tol +/-)");
    expect(pdf).toContain("(1.3)"); // chest tolerance
  });

  it("prints a dash for a POM with no tolerance", () => {
    // a one-POM recipe whose single measure has no tolerance -> the '-' branch
    const bare = { ...TEE, poms: [{ label: "Bare", measure: TEE.poms[0].measure }] };
    const pdf = exportTechPack(bare, STANDARD_M);
    expect(pdf).toContain("(Bare)");
    expect(pdf).toContain("(-)");
  });
});

// ── Fit Record page (slice 45) ────────────────────────────────────────────────
//
// The first render of this page had a real, visible bug that no string-content
// assertion would ever catch: the three-column blank-fill header used hardcoded
// cm offsets, so "Date"'s rule ran off the right edge of the page, and "Sewn
// by"'s rule struck through "Date"'s own label. Found by rendering the PDF to
// an image and looking at it — exactly the Slice 43 lesson repeated. The fix
// made every column width a fraction of `page.width`; the regression gate below
// parses the real rule-line coordinates out of the content stream and checks
// they stay inside the page, on BOTH page sizes the writer supports, so this
// class of bug can't silently return.

/** Every `X1 Y1 m X2 Y2 l S` rule drawn anywhere in the PDF, as points. */
function ruleEndpoints(pdfText: string): { x1: number; x2: number }[] {
  const re = /(-?[\d.]+) (-?[\d.]+) m (-?[\d.]+) (-?[\d.]+) l S/g;
  return [...pdfText.matchAll(re)].map((m) => ({ x1: Number(m[1]), x2: Number(m[3]) }));
}

describe("tech-pack Fit Record page", () => {
  const pdf = exportTechPack(TEE, STANDARD_M);

  it("titles the page with the garment label", () => {
    expect(pdf).toContain("(Tee - Fit Record)");
  });

  it("lists every POM with its predicted value at the sample size", () => {
    const spec = sampleSpec(TEE, STANDARD_M);
    for (const p of spec) {
      expect(pdf).toContain(`(${pdfString(p.label)})`);
      expect(pdf).toContain(`(${p.value.toFixed(1)} cm)`);
    }
  });

  it("formats the tolerance column exactly like the spec table (page 2), dash when unset", () => {
    expect(pdf).toContain("(1.3)"); // chest tolerance, same value as the spec table
    const bare = { ...TEE, poms: [{ label: "Bare", measure: TEE.poms[0].measure }] };
    expect(exportTechPack(bare, STANDARD_M)).toContain("(-)");
  });

  it("never prints an invented Actual value — the field stays blank, ruled for handwriting", () => {
    // The predicted value appears once per POM (checked above). If the writer
    // ever "helpfully" pre-filled Actual with the prediction, that count would
    // double. It must not.
    const spec = sampleSpec(TEE, STANDARD_M);
    for (const p of spec) {
      expect(count(pdf, `(${p.value.toFixed(1)} cm)`)).toBe(1);
    }
  });

  it("draws blank ruled space (ready to write on) for Actual and Pass, one pair per POM", () => {
    const rules = ruleEndpoints(pdf);
    // 3 header blanks (Fabric/Sewn by/Date) + 2 per POM (Actual, Pass).
    expect(rules.length).toBeGreaterThanOrEqual(3 + TEE.poms.length * 2);
  });

  it("keeps every drawn rule inside the printable page, on both supported page sizes — the regression gate for the layout bug", () => {
    for (const page of [PAGE_A4, PAGE_LETTER]) {
      const doc = exportTechPack(TEE, STANDARD_M, page);
      const rightEdge = pt(page.width - 1.5); // page.width - M, in points
      for (const { x1, x2 } of ruleEndpoints(doc)) {
        expect(x1).toBeLessThanOrEqual(rightEdge);
        expect(x2).toBeLessThanOrEqual(rightEdge);
        expect(x1).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("works for a structurally different garment (the skirt) with its own POM set", () => {
    const skirtPdf = exportTechPack(SKIRT, STANDARD_M);
    expect(skirtPdf).toContain("(Skirt - Fit Record)");
    for (const p of sampleSpec(SKIRT, STANDARD_M)) {
      expect(skirtPdf).toContain(`(${pdfString(p.label)})`);
    }
  });

  it("agrees with the spec table: the Fit Record's predicted value is the base-size column", () => {
    // The spec table (page 2) grades across sizes; the base/sample size is one
    // of those graded steps. The Fit Record must show the SAME number for that
    // size, not an independently-computed one — same block, one source of truth.
    const block = TEE.draft(STANDARD_M);
    for (const pom of TEE.poms) {
      const expected = Math.round(pom.measure(block) * 10) / 10;
      expect(pdf).toContain(`(${expected.toFixed(1)} cm)`);
    }
  });
});
