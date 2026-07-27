// @vitest-environment jsdom
// The projector file is validated the way the SVG-bug lesson demands: with a
// REAL parser (DOMParser), measuring geometry out of the parsed DOM — never by
// matching the writer's own strings.
import { describe, it, expect } from "vitest";
import {
  STANDARD_M,
  TEE,
  FITTED,
  GarmentRecipe,
  derive,
  draftAtSize,
  rolePiece,
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
