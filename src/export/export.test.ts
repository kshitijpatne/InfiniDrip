// @vitest-environment jsdom
// jsdom gives us a real DOMParser so we can prove the exported SVG is valid,
// browser-openable XML — not just a string that looks right. The rest of this
// file is plain string/number checks that don't care about the environment.
import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { Piece, STANDARD_M, draftTshirt, rolePiece, AllowanceSpec } from "../drafting";
import {
  flattenPiece,
  polylineBounds,
  layoutPieces,
  exportSvg,
  exportDxf,
} from "./index";

const UNIFORM: AllowanceSpec = { default: 1 };

// A tiny square piece (10 x 10) made of four named line edges, cut on no fold.
const square: Piece = {
  name: "square",
  onFold: false,
  edges: [
    { kind: "line", name: "top", start: point(0, 0), end: point(10, 0) },
    { kind: "line", name: "right", start: point(10, 0), end: point(10, 10) },
    { kind: "line", name: "bottom", start: point(10, 10), end: point(0, 10) },
    { kind: "line", name: "left", start: point(0, 10), end: point(0, 0) },
  ],
};

const block = draftTshirt(STANDARD_M);
const pieces = [rolePiece(block, "front"), rolePiece(block, "back"), rolePiece(block, "sleeve")];

describe("flattenPiece", () => {
  it("returns a sew outline and a larger cut outline", () => {
    const flat = flattenPiece(square, UNIFORM);
    expect(flat.name).toBe("square");
    expect(flat.sew.length).toBeGreaterThan(0);
    // the cut line sits outside the sew line, so it spans wider than 10 cm
    const cutB = polylineBounds(flat.cut);
    expect(cutB.width).toBeGreaterThan(10);
  });
});

describe("polylineBounds", () => {
  it("measures the box a polyline occupies", () => {
    const b = polylineBounds([point(2, 3), point(7, 3), point(7, 9)]);
    expect(b).toEqual({ minX: 2, minY: 3, width: 5, height: 6 });
  });
});

describe("layoutPieces", () => {
  it("packs pieces left to right without overlap", () => {
    const flats = pieces.map((p) => flattenPiece(p, UNIFORM));
    const layout = layoutPieces(flats);
    expect(layout.pieces.length).toBe(3);
    // each piece's left edge starts further right than the previous one's
    const lefts = layout.pieces.map((p) => polylineBounds(p.cut).minX);
    expect(lefts[0]).toBeLessThan(lefts[1]);
    expect(lefts[1]).toBeLessThan(lefts[2]);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it("handles an empty piece list", () => {
    const layout = layoutPieces([]);
    expect(layout.pieces).toEqual([]);
    expect(layout.width).toBe(2); // just the two margins
  });
});

describe("exportSvg", () => {
  const svg = exportSvg(pieces, UNIFORM);

  it("is a true-scale SVG sized in centimetres", () => {
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('width="');
    expect(svg).toContain('cm"');
    expect(svg).toContain('viewBox="0 0 ');
  });

  it("draws a white sheet, cut and sew lines, and a label per piece", () => {
    expect(svg).toContain('fill="#ffffff"'); // the sheet
    expect(svg).toContain("<polygon"); // outlines
    expect(svg).toContain("stroke-dasharray"); // the sew line
    expect(svg).toContain(">FRONT<");
    expect(svg).toContain(">SLEEVE<");
  });

  it("is real, browser-openable SVG markup — not entity-escaped", () => {
    // The regression this guards: tags were once authored as &lt;/&gt;, so the
    // file opened as plain text ("Start tag expected") instead of a drawing.
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).not.toContain("&lt;");
    expect(svg).not.toContain("&gt;");

    // The real proof: parse it as XML the way a browser would.
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.documentElement.tagName).toBe("svg");
    // three pieces → three cut + three sew polygons, one label each
    expect(doc.querySelectorAll("polygon").length).toBe(6);
    expect(doc.querySelectorAll("text").length).toBe(3);
  });
});

describe("exportSvg with non-tshirt pieces", () => {
  it("exports a piece with no notch recipe without crashing", () => {
    const unknown = { ...rolePiece(block, "front"), name: "unknown-piece" };
    const svg = exportSvg([unknown], UNIFORM);
    expect(svg).toContain("UNKNOWN-PIECE");
    expect(svg).toContain("viewBox");
  });
});

describe("exportDxf", () => {
  const dxf = exportDxf(pieces, UNIFORM);

  it("is a well-formed minimal DXF", () => {
    expect(dxf.startsWith("0\nSECTION")).toBe(true);
    expect(dxf).toContain("2\nENTITIES");
    expect(dxf.trimEnd().endsWith("0\nEOF")).toBe(true);
  });

  it("puts cut and sew lines on their own layers as closed polylines", () => {
    expect(dxf).toContain("POLYLINE");
    expect(dxf).toContain("8\nCUT");
    expect(dxf).toContain("8\nSEW");
    expect(dxf).toContain("SEQEND");
    // group code 70 = 1 marks the polyline closed
    expect(dxf).toContain("70\n1");
  });
});
