import { describe, it, expect } from "vitest";
import { point } from "../geometry";
import { Piece, STANDARD_M, draftTshirt, rolePiece } from "../drafting";
import {
  Handle,
  pieceHandles,
  moveHandle,
  nearestHandle,
  editorViewBox,
  viewboxPointToCm,
} from "./edit";

const square: Piece = {
  name: "sq",
  onFold: false,
  edges: [
    { kind: "line", name: "top", start: point(0, 0), end: point(10, 0) },
    { kind: "line", name: "right", start: point(10, 0), end: point(10, 10) },
    { kind: "line", name: "bottom", start: point(10, 10), end: point(0, 10) },
    { kind: "line", name: "left", start: point(0, 10), end: point(0, 0) },
  ],
};
const front = rolePiece(draftTshirt(STANDARD_M), "front");

describe("pieceHandles", () => {
  it("gives one vertex per corner and no controls for an all-line piece", () => {
    const h = pieceHandles(square);
    expect(h).toHaveLength(4);
    expect(h.every((x) => x.kind === "vertex")).toBe(true);
  });

  it("adds two control handles for each curve edge", () => {
    const h = pieceHandles(front);
    const curves = front.edges.filter((e) => e.kind === "curve").length;
    expect(h.filter((x) => x.kind === "control")).toHaveLength(curves * 2);
    expect(h.filter((x) => x.kind === "vertex")).toHaveLength(front.edges.length);
  });
});

describe("moveHandle — vertex", () => {
  it("moves both edges sharing the corner (line ↔ line)", () => {
    const v1 = pieceHandles(square).find((h) => h.id === "v1")!;
    const moved = moveHandle(square, v1, point(12, -1));
    const e0 = moved.edges[0];
    const e1 = moved.edges[1];
    expect(e0.kind === "line" && e0.end).toEqual(point(12, -1));
    expect(e1.kind === "line" && e1.start).toEqual(point(12, -1));
    // original is untouched
    expect((square.edges[1] as { start: unknown }).start).toEqual(point(10, 0));
  });

  it("updates a curve start and the previous line end at the same corner", () => {
    // front v0 = neckline(curve).start, shared with centerFront(line).end
    const v0 = pieceHandles(front).find((h) => h.id === "v0")!;
    const moved = moveHandle(front, v0, point(1, 9));
    const neckline = moved.edges[0];
    const centerFront = moved.edges[moved.edges.length - 1];
    expect(neckline.kind === "curve" && neckline.curve.start).toEqual(point(1, 9));
    expect(centerFront.kind === "line" && centerFront.end).toEqual(point(1, 9));
  });

  it("updates a line start and the previous curve end at the same corner", () => {
    // front v1 = shoulder(line).start, shared with neckline(curve).end
    const v1 = pieceHandles(front).find((h) => h.id === "v1")!;
    const moved = moveHandle(front, v1, point(9, 1));
    const shoulder = moved.edges[1];
    const neckline = moved.edges[0];
    expect(shoulder.kind === "line" && shoulder.start).toEqual(point(9, 1));
    expect(neckline.kind === "curve" && neckline.curve.end).toEqual(point(9, 1));
  });
});

describe("moveHandle — control", () => {
  it("moves control1 and control2 of a curve independently", () => {
    const handles = pieceHandles(front);
    const c1 = handles.find((h) => h.kind === "control" && h.which === 1)!;
    const c2 = handles.find((h) => h.kind === "control" && h.which === 2)!;
    const m1 = moveHandle(front, c1, point(2, 2));
    const e1 = m1.edges[(c1 as Extract<Handle, { kind: "control" }>).edge];
    expect(e1.kind === "curve" && e1.curve.control1).toEqual(point(2, 2));
    const m2 = moveHandle(front, c2, point(3, 3));
    const e2 = m2.edges[(c2 as Extract<Handle, { kind: "control" }>).edge];
    expect(e2.kind === "curve" && e2.curve.control2).toEqual(point(3, 3));
  });

  it("leaves a line edge untouched if asked to move a control on it", () => {
    const bad: Handle = { id: "x", kind: "control", edge: 1, which: 1, pos: point(10, 0) };
    const moved = moveHandle(square, bad, point(5, 5));
    expect(moved.edges[1]).toEqual(square.edges[1]);
  });
});

describe("nearestHandle", () => {
  it("returns the closest handle within range", () => {
    const h = nearestHandle(pieceHandles(square), point(10.5, 0.2), 2);
    expect(h?.id).toBe("v1");
  });
  it("returns null when nothing is within range", () => {
    expect(nearestHandle(pieceHandles(square), point(5, 5), 1)).toBeNull();
  });
  it("returns null for an empty handle list", () => {
    expect(nearestHandle([], point(0, 0), 5)).toBeNull();
  });
});

describe("editorViewBox", () => {
  it("wraps all handles with a margin", () => {
    const vb = editorViewBox(square, 4);
    expect(vb.minX).toBe(-4);
    expect(vb.minY).toBe(-4);
    expect(vb.w).toBe(18); // 0..10 + 4 each side
    expect(vb.h).toBe(18);
  });
});

describe("viewboxPointToCm", () => {
  it("maps a screen pointer to a cm point in the viewBox", () => {
    const vb = { minX: 0, minY: 0, w: 100, h: 100 };
    const rect = { left: 0, top: 0, width: 200, height: 200 };
    expect(viewboxPointToCm(100, 50, rect, vb)).toEqual(point(50, 25));
  });
});
