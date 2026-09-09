import { describe, it, expect } from "vitest";
import { Point } from "../geometry";
import { Piece, edgeEnd } from "./piece";
import { Stitch, edgeRef, iface } from "./stitch";
import { Component, ComponentResult, assembleComponents } from "./component";
import { STANDARD_M } from "./measurements";
import { blockPieces, rolePiece } from "./block";

const p = (x: number, y: number): Point => ({ x, y });

/** A minimal piece: every edge a straight line, named exactly as given. */
function linePiece(name: string, edges: Readonly<Record<string, readonly [Point, Point]>>): Piece {
  return {
    name,
    onFold: false,
    edges: Object.entries(edges).map(([edgeName, [start, end]]) => ({
      kind: "line" as const,
      name: edgeName,
      start,
      end,
    })),
  };
}

/** A fake two-piece component: "front"/"back", one internal stitch, one
 *  exposed interface — enough to exercise the real Component<P> shape. */
const fakeBodice: Component<{ readonly width: number }> = (_m, params) => {
  const front = linePiece("front", { hem: [p(0, 0), p(params.width, 0)], armhole: [p(params.width, 0), p(params.width, 5)] });
  const back = linePiece("back", { hem: [p(0, 0), p(params.width, 0)], armhole: [p(params.width, 0), p(params.width, 5)] });
  return {
    pieces: { front, back },
    stitches: [{ label: "Shoulder", a: iface(edgeRef("front", "hem")), b: iface(edgeRef("back", "hem")) }],
    interfaces: { armhole: iface(edgeRef("front", "armhole"), edgeRef("back", "armhole")) },
  };
};

describe("Component / ComponentResult shape", () => {
  it("a component is a pure fn: measurements + params in, ComponentResult out", () => {
    const result: ComponentResult = fakeBodice(STANDARD_M, { width: 10 });
    expect(Object.keys(result.pieces)).toEqual(["front", "back"]);
    expect(result.stitches).toHaveLength(1);
    expect(Object.keys(result.interfaces)).toEqual(["armhole"]);
  });

  it("params are genuinely threaded through, not ignored", () => {
    const a = fakeBodice(STANDARD_M, { width: 10 });
    const b = fakeBodice(STANDARD_M, { width: 20 });
    expect(edgeEnd(a.pieces.front.edges[0])).not.toEqual(edgeEnd(b.pieces.front.edges[0]));
  });
});

describe("assembleComponents", () => {
  it("merges one component's pieces and stitches straight into a Block", () => {
    const result = fakeBodice(STANDARD_M, { width: 10 });
    const b = assembleComponents([result]);
    expect(blockPieces(b)).toHaveLength(2);
    expect(rolePiece(b, "front").name).toBe("front");
    expect(b.stitches).toHaveLength(1);
    expect(b.stitches[0].label).toBe("Shoulder");
  });

  it("merges roles from MULTIPLE components, in the order they were passed", () => {
    const bodice: ComponentResult = {
      pieces: { front: linePiece("front", { hem: [p(0, 0), p(10, 0)] }) },
      stitches: [],
      interfaces: {},
    };
    const sleeve: ComponentResult = {
      pieces: { sleeve: linePiece("sleeve", { cap: [p(0, 0), p(5, 0)] }) },
      stitches: [],
      interfaces: {},
    };
    const b = assembleComponents([bodice, sleeve]);
    expect(Object.keys(b.roles)).toEqual(["front", "sleeve"]);
  });

  it("concatenates every component's internal stitches, in order", () => {
    const withStitch = (label: string): ComponentResult => ({
      pieces: {},
      stitches: [{ label, a: iface(edgeRef("x", "e")), b: iface(edgeRef("y", "e")) }],
      interfaces: {},
    });
    const b = assembleComponents([withStitch("First"), withStitch("Second")]);
    expect(b.stitches.map((s) => s.label)).toEqual(["First", "Second"]);
  });

  it("appends the caller's connecting stitches AFTER every component's own", () => {
    const bodice = fakeBodice(STANDARD_M, { width: 10 });
    const connecting: Stitch = { label: "Sleeve to armhole", a: bodice.interfaces.armhole, b: iface(edgeRef("sleeve", "cap")) };
    const b = assembleComponents([bodice], [connecting]);
    expect(b.stitches.map((s) => s.label)).toEqual(["Shoulder", "Sleeve to armhole"]);
  });

  it("defaults connectingStitches to none when omitted", () => {
    const b = assembleComponents([fakeBodice(STANDARD_M, { width: 10 })]);
    expect(b.stitches).toHaveLength(1); // just the bodice's own shoulder stitch
  });

  it("throws — loudly, at assembly time — when two components claim the same role", () => {
    const one: ComponentResult = { pieces: { front: linePiece("front", { hem: [p(0, 0), p(1, 0)] }) }, stitches: [], interfaces: {} };
    const two: ComponentResult = { pieces: { front: linePiece("front", { hem: [p(0, 0), p(2, 0)] }) }, stitches: [], interfaces: {} };
    expect(() => assembleComponents([one, two])).toThrow('role "front" claimed by more than one component');
  });

  it("an empty component list assembles an empty (but valid) Block", () => {
    const b = assembleComponents([]);
    expect(blockPieces(b)).toHaveLength(0);
    expect(b.stitches).toHaveLength(0);
  });
});
