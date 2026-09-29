// @vitest-environment jsdom
// The projector file is validated the way the SVG-bug lesson demands: with a
// REAL parser (DOMParser), measuring geometry out of the parsed DOM — never by
// matching the writer's own strings.
import { describe, it, expect } from "vitest";
import {
  STANDARD_M,
  TEE,
  TANK,
  FITTED,
  GarmentRecipe,
  derive,
  draftAtSize,
  rolePiece,
  lineMark,
  pointMark,
} from "../drafting";
import { resolveNotch } from "../render/notch";
import { flattenPiece, polylineBounds } from "./layout";
import { unfoldFlat } from "./unfold";
import { exportProjectorSvg } from "./projector";
import { CALIBRATION_CM, CALIBRATION_LABEL } from "./calibration";

const svgText = exportProjectorSvg(TEE, STANDARD_M);
const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
const root = doc.documentElement;

const layers = [...doc.getElementsByTagName("g")].filter(
  (g) => g.getAttribute("inkscape:groupmode") === "layer"
);
const layerFor = (label: string): Element =>
  layers.find((g) => g.getAttribute("id") === `size-${label}`)!;

/** Parse an SVG polygon's points attribute back into numbers. */
function polygonPoints(poly: Element): { x: number; y: number }[] {
  return poly
    .getAttribute("points")!
    .split(" ")
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return { x, y };
    });
}

const width = (pts: { x: number }[]): number =>
  Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));

describe("exportProjectorSvg — real parse", () => {
  it("parses as valid XML with an svg root", () => {
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(root.tagName).toBe("svg");
  });

  it("is one continuous canvas: a single svg, no nested pages, no tile labels", () => {
    expect(doc.querySelectorAll("svg")).toHaveLength(1);
    expect(svgText).not.toContain("Tile");
  });

  it("is true-scale: width/height are cm and one viewBox unit is one cm", () => {
    const w = root.getAttribute("width")!;
    const h = root.getAttribute("height")!;
    expect(w).toMatch(/^[\d.]+cm$/);
    expect(h).toMatch(/^[\d.]+cm$/);
    const [, , vw, vh] = root.getAttribute("viewBox")!.split(" ").map(Number);
    expect(parseFloat(w)).toBe(vw);
    expect(parseFloat(h)).toBe(vh);
  });
});

describe("exportProjectorSvg — calibration square", () => {
  const rect = doc.querySelector('[id="calibration"] rect')!;

  it("embeds the square at exactly its stated size in real units", () => {
    // The scale anchor: in a 1-unit-=-1-cm document, the parsed rect must
    // measure exactly CALIBRATION_CM on both axes.
    expect(rect).not.toBeNull();
    expect(Number(rect.getAttribute("width"))).toBe(CALIBRATION_CM);
    expect(Number(rect.getAttribute("height"))).toBe(CALIBRATION_CM);
  });

  it("labels the square with its stated size", () => {
    const texts = [...doc.getElementsByTagName("text")].map((t) => t.textContent);
    expect(texts).toContain(CALIBRATION_LABEL);
  });
});

describe("exportProjectorSvg — size layers", () => {
  it("gives every graded size its own toggleable layer", () => {
    expect(layers).toHaveLength(TEE.sizes.length);
    for (const s of TEE.sizes) {
      const layer = layerFor(s.label);
      expect(layer).toBeDefined();
      expect(layer.getAttribute("inkscape:label")).toBe(`Size ${s.label}`);
    }
  });

  it("draws every piece of a size inside that size's layer, labelled", () => {
    const texts = [...layerFor("M").getElementsByTagName("text")].map((t) => t.textContent);
    expect(texts).toContain("M FRONT");
    expect(texts).toContain("M BACK");
    expect(texts).toContain("M SLEEVE");
  });

  it("grades for real: the XL front is wider than the S front", () => {
    const xl = width(polygonPoints(layerFor("XL").getElementsByTagName("polygon")[0]));
    const s = width(polygonPoints(layerFor("S").getElementsByTagName("polygon")[0]));
    expect(xl).toBeGreaterThan(s);
  });
});

describe("exportProjectorSvg — unfolded geometry", () => {
  it("shows the front at full width: parsed sew outline spans the whole chest", () => {
    // Independently derived truth: the unfolded front sew width must equal
    // 2 × chestWidthHalf = (chest + ease) / 2 — measured from the parsed DOM.
    const d = derive(STANDARD_M);
    const sewPolygon = layerFor("M").getElementsByTagName("polygon")[1];
    expect(width(polygonPoints(sewPolygon))).toBeCloseTo(2 * d.chestWidthHalf, 2);
  });

  it("mirrors each notch onto the unfolded half", () => {
    // The M front's shoulder notch must appear at BOTH ± offsets from the
    // slot centre (read off the piece label, not from writer internals).
    const layer = layerFor("M");
    const label = [...layer.getElementsByTagName("text")].find(
      (t) => t.textContent === "M FRONT"
    )!;
    const center = Number(label.getAttribute("x"));
    const front = rolePiece(draftAtSize(STANDARD_M, TEE.grade, 0, TEE.draft), "front");
    const notch = resolveNotch(front, { edgeName: "shoulder", t: 0.5 });
    const xs = [...layer.getElementsByTagName("line")].map((l) =>
      Number(l.getAttribute("x1"))
    );
    expect(xs.some((x) => Math.abs(x - (center + notch.point.x)) < 0.05)).toBe(true);
    expect(xs.some((x) => Math.abs(x - (center - notch.point.x)) < 0.05)).toBe(true);
  });

  it("keeps generous margins: no geometry crosses the outer 3 cm", () => {
    for (const poly of doc.getElementsByTagName("polygon")) {
      expect(Math.min(...polygonPoints(poly).map((p) => p.x))).toBeGreaterThan(3);
    }
  });
});

describe("exportProjectorSvg — projector-legible styling", () => {
  it("draws bold cut lines and lighter sew lines on every piece", () => {
    const polys = [...doc.getElementsByTagName("polygon")];
    expect(polys.length).toBeGreaterThan(0);
    for (const p of polys) {
      expect(Number(p.getAttribute("stroke-width"))).toBeGreaterThanOrEqual(0.12);
    }
    const cutWidths = polys.map((p) => Number(p.getAttribute("stroke-width")));
    expect(Math.max(...cutWidths)).toBeGreaterThanOrEqual(0.2);
  });
});

describe("exportProjectorSvg — other garments and sparse recipes", () => {
  it("exports Tank as two labelled pieces with no sleeve", () => {
    const tank = new DOMParser().parseFromString(exportProjectorSvg(TANK, STANDARD_M), "image/svg+xml");
    expect(tank.querySelector("parsererror")).toBeNull();
    const labels = [...tank.getElementsByTagName("text")].map((t) => t.textContent);
    expect(labels).toEqual(expect.arrayContaining(["M FRONT", "M BACK"]));
    expect(labels).not.toContain("M SLEEVE");
  });

  it("exports the fitted garment as clean XML too", () => {
    const fitted = new DOMParser().parseFromString(
      exportProjectorSvg(FITTED, STANDARD_M),
      "image/svg+xml"
    );
    expect(fitted.querySelector("parsererror")).toBeNull();
    expect(fitted.documentElement.tagName).toBe("svg");
  });

  it("copes with a recipe that declares no notches", () => {
    const bare: GarmentRecipe = { ...TEE, notches: [] };
    const parsed = new DOMParser().parseFromString(
      exportProjectorSvg(bare, STANDARD_M),
      "image/svg+xml"
    );
    expect(parsed.querySelector("parsererror")).toBeNull();
    expect(parsed.getElementsByTagName("line")).toHaveLength(0);
  });

  it("does not double-draw a notch that sits ON the fold", () => {
    const foldNotched: GarmentRecipe = {
      ...TEE,
      notches: [
        {
          pieceName: "front",
          notches: [{ edgeName: "centerFront", t: 0.5 }],
          grainline: { topEdge: "neckline", topT: 0.5, bottomEdge: "hem", bottomT: 0.5 },
        },
      ],
    };
    const parsed = new DOMParser().parseFromString(
      exportProjectorSvg(foldNotched, STANDARD_M),
      "image/svg+xml"
    );
    // One notch line per size (5 sizes) plus one grainline line per front per
    // size — but no mirrored duplicate of the on-fold notch.
    const lines = [...parsed.getElementsByTagName("line")];
    expect(lines).toHaveLength(TEE.sizes.length * 2);
  });

  it("anchors every size of a piece on a shared slot centre (tree-ring nesting)", () => {
    // The label x co-ordinate IS the slot centre; every size must agree on it.
    const centers = TEE.sizes.map((s) => {
      const label = [...layerFor(s.label).getElementsByTagName("text")].find(
        (t) => t.textContent === `${s.label} FRONT`
      )!;
      return Number(label.getAttribute("x"));
    });
    for (const c of centers) expect(c).toBeCloseTo(centers[0], 6);
  });
});

describe("exportProjectorSvg — slot sizing sanity", () => {
  it("reserves slots wide enough for the largest size's unfolded cut line", () => {
    const xlFront = rolePiece(draftAtSize(STANDARD_M, TEE.grade, 2, TEE.draft), "front");
    const widest = polylineBounds(
      unfoldFlat(flattenPiece(xlFront, TEE.allowances), xlFront.onFold).cut
    ).width;
    const [, , vw] = doc.documentElement.getAttribute("viewBox")!.split(" ").map(Number);
    expect(vw).toBeGreaterThan(widest);
  });
});

describe("exportProjectorSvg — plan exceptions", () => {
  it("escapes user-authored size labels and assigns safe deterministic layer IDs", () => {
    const block = TEE.draft(STANDARD_M, {});
    const source = exportProjectorSvg(TEE, STANDARD_M, {}, [
      { label: 'S & <"M">', step: 0, block },
    ]);
    const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
    expect(parsed.querySelector("parsererror")).toBeNull();
    expect(parsed.querySelector("g[inkscape\\:label]")?.getAttribute("id")).toBe("size-1");
    expect(parsed.querySelector("g[inkscape\\:label]")?.getAttribute("inkscape:label")).toBe('Size S & <"M">');
    expect([...parsed.getElementsByTagName("text")].some((label) => label.textContent?.includes('S & <"M"> FRONT'))).toBe(true);
  });

  it("sizes planned roles against sizes where a piece is absent and omits empty exception metadata", () => {
    const block = TEE.draft(STANDARD_M, {});
    const noSleeve = { ...block, roles: Object.fromEntries(Object.entries(block.roles).filter(([role]) => role !== "sleeve")) };
    const svg = exportProjectorSvg(TEE, STANDARD_M, {}, [
      { label: "M", step: 0, block },
      { label: "XS", step: -1, block: noSleeve },
    ]);
    expect(svg).toContain('id="size-XS"');
    expect(svg).not.toContain("<desc>");
  });

  it("includes approved not-applicable POM reasons in SVG metadata", () => {
    const block = TEE.draft(STANDARD_M, {});
    const svg = exportProjectorSvg(TEE, STANDARD_M, {}, [
      { label: "M", step: 0, block },
      { label: "L", step: 1, block },
    ], [{ sizeLabel: "L", pomLabel: "Body chest", reason: "Not included in this product size." }]);
    expect(svg).toContain("<desc>L - Body chest: not applicable - Not included in this product size.</desc>");
  });
});

describe("exportProjectorSvg — visible exception legend", () => {
  it("renders each N/A reason as legible escaped text below the geometry", () => {
    const block = TEE.draft(STANDARD_M, {});
    const source = exportProjectorSvg(TEE, STANDARD_M, {}, [
      { label: "M", step: 0, block },
      { label: "L", step: 1, block },
    ], [
      { sizeLabel: "L", pomLabel: "Body <chest>", reason: "Not in this size & intentionally <omitted>" },
      { sizeLabel: "M", pomLabel: "Sleeve", reason: "Excluded." },
    ]);
    const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
    expect(parsed.querySelector("parsererror")).toBeNull();
    // Machine metadata is retained alongside the visible legend.
    expect(source).toContain("<desc>L - Body &lt;chest&gt;: not applicable - Not in this size &amp; intentionally &lt;omitted&gt;; M - Sleeve: not applicable - Excluded.</desc>");
    const legend = parsed.querySelector('[id="pom-exceptions"]');
    expect(legend).not.toBeNull();
    const texts = [...legend!.getElementsByTagName("text")];
    expect(texts).toHaveLength(3);
    expect(texts[0].textContent).toBe("Excluded measurements (not applicable):");
    expect(texts[1].textContent).toBe("L — Body <chest>: not applicable — Not in this size & intentionally <omitted>");
    expect(texts[2].textContent).toBe("M — Sleeve: not applicable — Excluded.");
    // Adversarial characters arrive escaped in the raw source.
    expect(source).toContain("Body &lt;chest&gt;");
    expect(source).toContain("Not in this size &amp; intentionally &lt;omitted&gt;");
    // Every legend baseline sits below all projected geometry, rows never
    // share a baseline, and the legend stays inside the canvas.
    const maxPolyY = Math.max(
      ...[...parsed.getElementsByTagName("polygon")].flatMap((poly) => polygonPoints(poly).map((pt) => pt.y))
    );
    const ys = texts.map((t) => Number(t.getAttribute("y")));
    for (const y of ys) expect(y).toBeGreaterThan(maxPolyY);
    expect(new Set(ys).size).toBe(ys.length);
    const [, , , vh] = parsed.documentElement.getAttribute("viewBox")!.split(" ").map(Number);
    expect(Math.max(...ys)).toBeLessThan(vh);
  });

  it("omits the legend and metadata when there are no exceptions", () => {
    const plain = exportProjectorSvg(TEE, STANDARD_M);
    expect(plain).not.toContain("pom-exceptions");
    expect(plain).not.toContain("<desc>");
  });

  it("wraps long exception reasons into visible lines inside the expanded canvas", () => {
    const block = TEE.draft(STANDARD_M, {});
    const reason = `${"This documented construction exception explains the alternate inspection point. ".repeat(4).trim()} ${"X".repeat(600)}`;
    const source = exportProjectorSvg(TEE, STANDARD_M, {}, [
      { label: "M", step: 0, block },
    ], [{ sizeLabel: "M", pomLabel: "Body chest", reason }]);
    const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
    expect(parsed.querySelector("parsererror")).toBeNull();
    const legendLines = [...parsed.querySelector("#pom-exceptions")!.getElementsByTagName("text")];
    const visibleLines = legendLines.map((line) => line.textContent ?? "");
    expect(visibleLines.length).toBeGreaterThan(2);
    const [, , viewWidth, viewHeight] = parsed.documentElement.getAttribute("viewBox")!.split(" ").map(Number);
    const maxChars = Math.floor((viewWidth - 10) / (1.5 * 0.62));
    for (const [index, line] of legendLines.entries()) {
      expect(visibleLines[index]!.length).toBeLessThanOrEqual(maxChars);
      expect(Number(line.getAttribute("x"))).toBeGreaterThanOrEqual(5);
      expect(Number(line.getAttribute("x"))).toBeLessThan(viewWidth - 5);
      expect(Number(line.getAttribute("y"))).toBeLessThan(viewHeight);
    }
    const joinedLegend = visibleLines.join(" ").replace(/\s+/g, " ");
    expect(joinedLegend).toContain(`M — Body chest: not applicable — ${reason.slice(0, -601)}`);
    expect(visibleLines.filter((line) => /^X+$/u.test(line)).join("")).toBe("X".repeat(600));
  });
});

describe("exportProjectorSvg — adversarial layer ids", () => {
  it("keeps every layer id unique when safe labels repeat and fallbacks collide", () => {
    const block = TEE.draft(STANDARD_M, {});
    const source = exportProjectorSvg(TEE, STANDARD_M, {}, [
      { label: "A/B", step: 0, block },
      { label: "1", step: 1, block },
      { label: "M", step: 2, block },
      { label: "M", step: 3, block },
    ]);
    const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
    expect(parsed.querySelector("parsererror")).toBeNull();
    const layers = [...parsed.getElementsByTagName("g")].filter(
      (g) => g.getAttribute("inkscape:groupmode") === "layer"
    );
    expect(layers).toHaveLength(4);
    const ids = layers.map((g) => g.getAttribute("id")!);
    expect(new Set(ids).size).toBe(4);
    // The unsafe "A/B" falls back to its stable 1-based run position; the
    // safe "1" collides with that fallback and gains a suffix.
    const byLabel = new Map(layers.map((g) => [g.getAttribute("id")!, g.getAttribute("inkscape:label")!]));
    expect(byLabel.get("size-1")).toBe("Size A/B");
    expect(byLabel.get("size-1-2")).toBe("Size 1");
    // The first safe "M" keeps its legacy id; the repeat gains a suffix.
    expect(byLabel.get("size-M")).toBe("Size M");
    expect(byLabel.get("size-M-2")).toBe("Size M");
    expect(ids).toContain("size-M");
  });

  it("increments the suffix across three identical safe labels", () => {
    const block = TEE.draft(STANDARD_M, {});
    const source = exportProjectorSvg(TEE, STANDARD_M, {}, [
      { label: "M", step: 0, block },
      { label: "M", step: 1, block },
      { label: "M", step: 2, block },
    ]);
    const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
    expect(parsed.querySelector("parsererror")).toBeNull();
    const ids = [...parsed.getElementsByTagName("g")]
      .filter((g) => g.getAttribute("inkscape:groupmode") === "layer")
      .map((g) => g.getAttribute("id")!);
    expect(ids.sort()).toEqual(["size-M", "size-M-2", "size-M-3"]);
  });
});

describe("exportProjectorSvg construction marks", () => {
  it("keeps an on-fold cut line singular and mirrors off-fold button placement", () => {
    const marked: GarmentRecipe = {
      ...TEE,
      draft: (m) => {
        const block = TEE.draft(m);
        const front = rolePiece(block, "front");
        return {
          ...block,
          roles: {
            ...block.roles,
            front: {
              ...front,
              marks: [
                lineMark("cutLine", "slit", { x: 0, y: 0 }, { x: 0, y: 14 }, "CUT SLIT"),
                pointMark("button", "button-1", { x: 2, y: 4 }, "BUTTON 1"),
              ],
            },
          },
        };
      },
    };
    const parsed = new DOMParser().parseFromString(exportProjectorSvg(marked, STANDARD_M), "image/svg+xml");
    expect(parsed.querySelectorAll('[data-pattern-mark-name="slit"]')).toHaveLength(TEE.sizes.length);
    expect(parsed.querySelectorAll('[data-pattern-mark-name="button-1"]')).toHaveLength(TEE.sizes.length);
    expect(parsed.querySelectorAll('[data-pattern-mark-name="button-1-mirror"]')).toHaveLength(TEE.sizes.length);
  });
});
