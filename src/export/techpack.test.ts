import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { FITTED, SKIRT, STANDARD_M, TANK, TEE, POLO, TROUSER, WOVEN_SHIRT, STRETCH_FABRICS, blockPieces, rolePiece, sampleSpec, type Block } from "../drafting";
import { PAGE_A4, PAGE_LETTER, pt } from "./pdf";
import { exportTechPack, exportTechPackV2, exportTechPackV2ForGradePlan, pdfString } from "./techpack";

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

  it("writes all Polo POMs, pieces, stabilizer, and construction into its tech pack", () => {
    const poloPdf = exportTechPack(POLO, STANDARD_M);
    for (const pom of POLO.poms) expect(poloPdf).toContain(`(${pdfString(pom.label)})`);
    expect(poloPdf).toContain("Lightweight knit fusible stabilizer");
    expect(poloPdf).toContain("BUTTON PLACKET");
    expect(poloPdf).toContain("OUTER COLLAR STAND");
  });

  it("uses a fabric-aware Tank BOM when a woven fabric is selected", () => {
    const woven = STRETCH_FABRICS.find((f) => f.name === "Cotton woven")!;
    const tankPdf = exportTechPack(TANK, STANDARD_M, undefined, woven);
    expect(tankPdf).toContain("Cotton woven, main");
    expect(tankPdf).toContain("Self-fabric binding");
  });

  it("keeps the knit Tank BOM when a knit fabric is selected", () => {
    const knit = STRETCH_FABRICS.find((f) => f.name === "Cotton jersey")!;
    expect(exportTechPack(TANK, STANDARD_M, undefined, knit)).toContain("Cotton jersey");
  });

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
    expect(fit).toContain("(Darted tee - Tech Pack)");
    expect(fit).toContain("(2. Sew the bust darts; press them toward the hem.)");
  });

  it("honours a custom page size", () => {
    const letter = exportTechPack(TEE, STANDARD_M, PAGE_LETTER);
    expect(letter.startsWith("%PDF-1.4")).toBe(true);
    expect(letter).toContain("%%EOF");
  });

  it("uses live woven-shirt options for the BOM while preserving the drafted sample", () => {
    const pdf = exportTechPack(WOVEN_SHIRT, STANDARD_M, undefined, undefined, { buttonCount: 6 });
    expect(pdf).toContain("(6 front + 1 stand)");
    expect(pdf).toContain("(Woven shirt - Tech Pack)");
    expect(pdf).toContain("(WOVEN BUTTON PLACKET)");
  });
});

// ── grade-plan PDF inspection helpers ─────────────────────────────────────────

/** Each page's content stream in page order; this writer never compresses them. */
function pageStreams(pdf: string): string[] {
  return [...pdf.matchAll(/>>\nstream\n([\s\S]*?)\nendstream/g)].map((match) => match[1]!);
}

/** The strings a content stream shows, in drawing order, with PDF escapes removed. */
function shownText(stream: string): string[] {
  return [...stream.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map((match) => match[1]!.replace(/\\(.)/g, "$1"));
}

function positionedText(stream: string): { fontSize: number; x: number; y: number; text: string }[] {
  return [...stream.matchAll(/BT \/F1 ([\d.]+) Tf ([\d.]+) ([\d.]+) Td \(((?:[^()\\]|\\.)*)\) Tj ET/g)]
    .map((match) => ({
      fontSize: Number(match[1]), x: Number(match[2]), y: Number(match[3]),
      text: match[4]!.replace(/\\(.)/g, "$1"),
    }));
}

/** A label as the ASCII-only writer shows it (dashes folded, escapes removed). */
const shown = (value: string): string => pdfString(value).replace(/\\(.)/g, "$1");

async function parsedPageCount(pdf: string): Promise<number> {
  return (await PDFDocument.load(new TextEncoder().encode(pdf), { updateMetadata: false })).getPageCount();
}

describe("exportTechPackV2ForGradePlan", () => {
  it("requires a non-empty run containing its declared base and supports each recipe BOM path", () => {
    const block = TEE.draft(STANDARD_M, {});
    const size = { label: "M", measurements: STANDARD_M, options: {}, block };
    expect(() => exportTechPackV2ForGradePlan(TEE, [])).toThrow("non-empty grade-plan run");
    expect(() => exportTechPackV2ForGradePlan(TEE, [size], undefined, undefined, [], "", "L"))
      .toThrow("approved base size is missing");
    const wovenBlock = WOVEN_SHIRT.draft(STANDARD_M, { buttonCount: 6 });
    const woven = exportTechPackV2ForGradePlan(WOVEN_SHIRT, [
      { label: "M", measurements: STANDARD_M, options: { buttonCount: 6 }, block: wovenBlock },
    ], undefined, STRETCH_FABRICS[0], [], "", "M");
    expect(woven).toContain("(6 front + 1)");
    const tankBlock = TANK.draft(STANDARD_M, {});
    const wovenTank = exportTechPackV2ForGradePlan(TANK, [
      { label: "M", measurements: STANDARD_M, options: {}, block: tankBlock },
    ], undefined, STRETCH_FABRICS.find((fabric) => fabric.family === "woven"), [], "", "M");
    expect(wovenTank).toContain("Self-fabric binding");
  });

  it("prints each approved not-applicable POM reason in the whole-run document", () => {
    const block = TEE.draft(STANDARD_M, {});
    const output = exportTechPackV2ForGradePlan(TEE, [
      { label: "M", measurements: STANDARD_M, options: {}, block },
      { label: "L", measurements: STANDARD_M, options: {}, block },
    ], undefined, undefined, [], "Test style", "M", [
      { sizeLabel: "L", pomLabel: "Body chest (finished)", reason: "Not included in this product size." },
    ]);
    const visibleText = shownText(pageStreams(output).join("\n")).join("\n");
    expect(output).toContain("Point-of-measure exceptions");
    expect(visibleText).toContain("L - Body chest (finished)");
    expect(visibleText).toContain("Reason: Not included in this product size.");
  });

  it("paginates large plan size ranges and wraps long custom labels and exception reasons", () => {
    const run = Array.from({ length: 12 }, (_, index) => {
      const label = `Custom size ${String(index + 1).padStart(2, "0")} Long label`;
      const measurements = { ...STANDARD_M, chest: 100 + index * 0.125 };
      return { label, measurements, options: {}, block: TEE.draft(measurements, {}) };
    });
    const longReason = "This POM is intentionally not applicable under the documented construction and body-size relationship. ".repeat(3);
    const output = exportTechPackV2ForGradePlan(TEE, run, undefined, undefined, [], "Test style", run[0]!.label, [
      { sizeLabel: run[11]!.label, pomLabel: "Body chest (finished)", reason: longReason },
    ]);
    expect(output).toContain(pdfString("Measurement Spec (cm)"));
    expect(output).toContain("Custom size 01");
    expect(output).toContain("Custom size 12");
    expect(output).toContain(pdfString("not applicable under the documented construction"));
    // Size 11's finished chest is authored as 100 + 10 x 0.125 + 10 ease; size
    // 12's chest is approved not-applicable, so it prints N/A instead of 111.375.
    expect(output).toContain("(111.25)");
    expect(output).not.toContain("(111.375)");
    expect(output).toContain("(N/A)");
    expect(Number(output.match(/\/Count (\d+)/)?.[1])).toBeGreaterThan(12);
  });

  it("covers empty POM tables, row pagination, and optional tolerances in the grade-plan spec", () => {
    const block = TEE.draft(STANDARD_M, {});
    const size = { label: "S", measurements: STANDARD_M, options: {}, block };
    const withoutPoms = { ...TEE, poms: [] };
    const emptyTable = exportTechPackV2ForGradePlan(withoutPoms, [size], undefined, undefined, [], "", "S");
    expect(emptyTable).toContain("/Count");

    const denseRecipe = {
      ...TEE,
      poms: Array.from({ length: 1_400 }, (_, index) => ({
        label: `Measurement ${index + 1}`,
        measure: TEE.poms[0]!.measure,
        ...(index === 0 ? {} : { tolerance: 1.25 }),
      })),
    };
    const paginatedTable = exportTechPackV2ForGradePlan(denseRecipe, [size], undefined, undefined, [], "", "S");
    const specHeaders = [...paginatedTable.matchAll(/Measurement Spec[^\n]+/g)]
      .map(([header]) => header!).filter((header) => header.includes("size columns"));
    expect(specHeaders.some((header) => /1\/\d+/.test(header))).toBe(true);
    expect(specHeaders.some((header) => /2\/\d+/.test(header))).toBe(true);
    expect(paginatedTable).toContain("(-)");
    expect(paginatedTable).toContain("(1.3)");
  });

  const chestPom = TEE.poms.find((pom) => pom.label === "Body chest (finished)")!;
  // Stand-in for an approved semantic edit: the supplied base block is NOT what
  // recipe.draft(measurements, options) produces for the size it is paired with.
  const editedBlock = TEE.draft({ ...STANDARD_M, chest: 100.123, shoulderWidth: 45.678 }, {});
  const editedSize = { label: "M", measurements: STANDARD_M, options: {}, block: editedBlock };

  it("prints an approved not-applicable POM as N/A, never measures it, and keeps its full reason", async () => {
    const run = ["S", "M", "L"].map((label, index) => {
      const measurements = { ...STANDARD_M, chest: 96 + index * 4 };
      return { label, measurements, options: {}, block: TEE.draft(measurements, {}) };
    });
    const notApplicableBlock = run[0]!.block;
    const measured: Block[] = [];
    const guarded = {
      ...TEE,
      poms: TEE.poms.map((pom) => pom === chestPom ? {
        ...pom,
        measure: (block: Block): number => {
          measured.push(block);
          if (block === notApplicableBlock) throw new Error("measured an approved not-applicable POM");
          return pom.measure(block);
        },
      } : pom),
    };
    const reason = "At this size the chest point sits on a separate yoke (construction note 4), " +
      "so the body-panel POM does not exist; measure the yoke seam instead and record it on the yoke spec.";
    const pdf = exportTechPackV2ForGradePlan(guarded, run, undefined, undefined, [], "Test style", "S", [
      { sizeLabel: "S", pomLabel: chestPom.label, reason },
    ]);
    // Measured once per applicable size; the Fit Record reuses the base column.
    expect(measured).toHaveLength(2);
    expect(measured[0]).toBe(run[1]!.block);
    expect(measured[1]).toBe(run[2]!.block);

    const streams = pageStreams(pdf);
    expect(await parsedPageCount(pdf)).toBe(streams.length);
    const note = "N/A = approved not-applicable POM; its full reason is on the Point-of-measure exceptions page.";

    const spec = shownText(streams.find((stream) => stream.includes("size columns 1-3"))!);
    expect(spec).toContain(note);
    const specRow = spec.indexOf(chestPom.label);
    expect(spec.slice(specRow, specRow + 5)).toEqual([
      chestPom.label, "1.3", "N/A", String(chestPom.measure(run[1]!.block)), String(chestPom.measure(run[2]!.block)),
    ]);

    const fitStream = streams.find((stream) => stream.includes("(Tee - S - Fit Record)"))!;
    const fit = shownText(fitStream);
    expect(fit).toContain(note);
    const fitRow = fit.indexOf(chestPom.label);
    expect(fit.slice(fitRow, fitRow + 4)).toEqual([chestPom.label, "1.3", "N/A", "Not applicable"]);
    // Rules: 3 header blanks + 2 separators + an Actual/Pass pair for each APPLICABLE POM only.
    expect(ruleEndpoints(fitStream)).toHaveLength(3 + 2 + 2 * (TEE.poms.length - 1));

    const exceptions = shownText(streams.find((stream) => stream.includes("(Point-of-measure exceptions)"))!);
    expect(exceptions).toContain(`S - ${chestPom.label} - NOT APPLICABLE`);
    const reasonStart = exceptions.findIndex((line) => line.startsWith("Reason: "));
    expect(exceptions.length - reasonStart).toBeGreaterThan(1); // wrapped, not truncated
    expect(exceptions.slice(reasonStart).join(" ")).toBe(`Reason: ${reason}`);
  });

  it("prints the Fit Record raw from the supplied edited base block instead of a rounded fresh redraft", async () => {
    const pdf = exportTechPackV2ForGradePlan(TEE, [editedSize], undefined, undefined, [], "", "M");
    const streams = pageStreams(pdf);
    expect(await parsedPageCount(pdf)).toBe(streams.length);
    const fit = shownText(streams.find((stream) => stream.includes("(Tee - M - Fit Record)"))!);
    const spec = shownText(streams.find((stream) => stream.includes("size columns 1-1"))!);
    for (const pom of TEE.poms) {
      const raw = String(pom.measure(editedBlock));
      expect(fit[fit.indexOf(shown(pom.label)) + 2]).toBe(`${raw} cm`);
      expect(spec[spec.indexOf(shown(pom.label)) + 2]).toBe(raw);
    }
    const printed = (label: string): number => Number(fit[fit.indexOf(label) + 2]!.replace(/ cm$/, ""));
    // Independent oracle from the authored edit inputs: derive() drafts the
    // chest half as (chest + ease) / 4 and the shoulder half as width / 2
    // (asserted for the tee in src/drafting/pom.test.ts).
    expect(printed("Body chest (finished)")).toBeCloseTo(100.123 + 10, 4);
    expect(printed("Across shoulder")).toBeCloseTo(45.678, 4);
    // The previous path, sampleSpec() on a fresh redraft, printed these unedited 0.1 cm values.
    for (const predicted of sampleSpec(TEE, STANDARD_M)) {
      if (predicted.label === "Body chest (finished)" || predicted.label === "Across shoulder") {
        expect(fit).not.toContain(`${predicted.value.toFixed(1)} cm`);
      }
    }
  });

  it("keeps the wider exact-value Fit Record inside both supported page sizes", () => {
    for (const page of [PAGE_A4, PAGE_LETTER]) {
      const pdf = exportTechPackV2ForGradePlan(TEE, [editedSize], page, undefined, [], "", "M");
      const fitStream = pageStreams(pdf).find((stream) => stream.includes("(Tee - M - Fit Record)"))!;
      const rightEdge = pt(page.width - 1.5);
      for (const { x1, x2 } of ruleEndpoints(fitStream)) {
        expect(x1).toBeGreaterThanOrEqual(0);
        expect(x2).toBeLessThanOrEqual(rightEdge);
      }
      // Helvetica digits advance 0.556 em: every raw 9 pt value clears the 4.2 cm Predicted column.
      for (const pom of TEE.poms) {
        expect(`${String(pom.measure(editedBlock))} cm`.length * 9 * 0.556).toBeLessThan(pt(4.2));
      }
    }
  });

  it("prints spec values that match an independently authored nonlinear digital fixture", () => {
    // Synthetic digital fixture only: no population chart, sample, or physical
    // fit claim. Inputs step nonlinearly (chest +6.125 then +8.375 cm; shoulder
    // +1.5 then +2.25 cm). Expected POMs are authored by hand from those inputs
    // via derive() (finished chest = chest + ease; across shoulder = shoulder
    // width, both asserted in src/drafting/pom.test.ts) — never read back from
    // the drafted geometry.
    const authored = [
      { label: "S", chest: 94, shoulderWidth: 43.5, finishedChest: 104, acrossShoulder: 43.5 },
      { label: "M", chest: 100.125, shoulderWidth: 45, finishedChest: 110.125, acrossShoulder: 45 },
      { label: "L", chest: 108.5, shoulderWidth: 47.25, finishedChest: 118.5, acrossShoulder: 47.25 },
    ];
    expect(STANDARD_M.ease).toBe(10);
    const run = authored.map(({ label, chest, shoulderWidth }) => {
      const measurements = { ...STANDARD_M, chest, shoulderWidth };
      return { label, measurements, options: {}, block: TEE.draft(measurements, {}) };
    });
    const pdf = exportTechPackV2ForGradePlan(TEE, run, undefined, undefined, [], "Synthetic digital fixture", "M");
    const specStream = pageStreams(pdf).find((stream) => stream.includes("size columns 1-3"))!;
    const spec = shownText(specStream);
    const positioned = positionedText(specStream);
    const printedRow = (label: string): number[] => {
      const row = spec.indexOf(label);
      return spec.slice(row + 2, row + 5).map(Number);
    };
    const chest = printedRow("Body chest (finished)");
    const across = printedRow("Across shoulder");
    expect(chest).toHaveLength(3);
    expect(across).toHaveLength(3);
    authored.forEach((size, index) => {
      expect(chest[index]).toBeCloseTo(size.finishedChest, 4);
      expect(across[index]).toBeCloseTo(size.acrossShoulder, 4);
    });
    const colW = (PAGE_A4.width - 3 - 7.5 - 2) / 3;
    const colStarts = [0, 1, 2].map((index) => pt(1.5 + 7.5 + 2 + index * colW));
    for (const [sizeIndex, size] of run.entries()) {
      for (const pom of TEE.poms) {
        const rawValue = String(pom.measure(size.block));
        const cell = positioned.find((entry) => entry.text === rawValue
          && Math.abs(entry.x - colStarts[sizeIndex]!) < 0.002);
        expect(cell, `${pom.label} / ${size.label} must be placed in its own column`).toBeDefined();
        // Includes a safety margin and a conservative Helvetica glyph-width
        // upper bound, so exact text cannot intrude into the next size column.
        expect(rawValue.length * cell!.fontSize * 0.6).toBeLessThanOrEqual(pt(colW - 0.15));
      }
    }
  });

  it("rejects a not-applicable exception that names no declared size or recipe POM", () => {
    const exportWith = (sizeLabel: string, pomLabel: string): string => exportTechPackV2ForGradePlan(TEE, [editedSize],
      undefined, undefined, [], "", "M", [{ sizeLabel, pomLabel, reason: "Not part of this style." }]);
    expect(() => exportWith("XL", chestPom.label)).toThrow("does not match a declared size and POM");
    expect(() => exportWith("M", "Not a recipe POM")).toThrow("does not match a declared size and POM");
  });
});

describe("readable draft tech pack", () => {
  const recipes = [TEE, FITTED, TANK, POLO, WOVEN_SHIRT, SKIRT, TROUSER];

  it("paginates every recipe's named pattern pieces into readable, explicitly non-scale overview cells", () => {
    for (const recipe of recipes) {
      const pieces = blockPieces(recipe.draft(STANDARD_M));
      const pdf = exportTechPackV2(recipe, STANDARD_M);
      const expectedPages = Math.ceil(pieces.length / 4) + 3;
      expect(pdf).toContain(`/Count ${expectedPages}`);
      expect(pdf).toContain(`(${pdfString("Each piece is fitted independently. NOT TO SCALE - never cut from this overview.")})`);
      expect(pdf).toContain("(POM names and size values are listed on the Measurement Spec page.)");
      pieces.forEach((piece, index) => {
        expect(pdf).toContain(`(${String(index + 1).padStart(2, "0")} - ${pdfString(piece.name.toUpperCase())})`);
      });
    }
  });

  it("keeps the original four-page writer available as an unchanged compatibility export", () => {
    expect(exportTechPack(TEE, STANDARD_M)).toContain("/Count 4");
    expect(exportTechPackV2(TEE, STANDARD_M)).toContain("/Count 4");
  });

  it("wraps and paginates dense BOM and construction content without dropping its tail", () => {
    const denseRecipe = {
      ...TEE,
      techPack: {
        bom: Array.from({ length: 44 }, (_, index) => ({
          material: `Material ${index + 1}`,
          placement: "Body, collar, sleeves, and all component panels",
          qty: `${index + 1} units per finished garment`,
        })),
        construction: Array.from({ length: 34 }, (_, index) =>
          `Operation ${index + 1}: ${"needleandthread".repeat(12)} end-step-${index + 1}`
        ),
      },
    };
    const pdf = exportTechPackV2(denseRecipe, STANDARD_M);
    expect(pdf).toContain("Bill of Materials \\(continued\\)");
    expect(pdf).toContain("Tee - Construction \\(continued\\)");
    expect(pdf).toContain("end-step-34");
    expect(Number(pdf.match(/\/Count (\d+)/)?.[1])).toBeGreaterThan(6);
  });

  it("keeps blank BOM cells safe and starts construction on a continuation page when the BOM fills the page", () => {
    const boundaryRecipe = {
      ...TEE,
      techPack: {
        bom: [{ material: "X".repeat(35 * 48), placement: "", qty: "" }],
        construction: [],
      },
    };
    const pdf = exportTechPackV2(boundaryRecipe, STANDARD_M);
    expect(pdf).toContain("Tee - Construction \\(continued\\)");
    expect(Number(pdf.match(/\/Count (\d+)/)?.[1])).toBeGreaterThan(4);
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
