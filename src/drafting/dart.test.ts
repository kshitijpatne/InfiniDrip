import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { draftFront } from "./tshirt";
import { draftFittedFront } from "./fitted";
import { dartOf, dartIntake } from "./dart";

describe("dartOf", () => {
  it("returns null for a piece with no dart", () => {
    expect(dartOf(draftFront(STANDARD_M))).toBeNull();
  });

  it("resolves the apex (leg join) and the two mouth points", () => {
    const f = draftFittedFront(STANDARD_M);
    const d = dartOf(f)!;
    // apex is interior (left of the side seam); mouth sits on the side seam
    const sideX = Math.max(...f.edges.flatMap((e) =>
      e.kind === "line" ? [e.start.x, e.end.x] : [e.curve.end.x]));
    expect(d.apex.x).toBeLessThan(sideX);
    expect(d.mouth[0].x).toBeCloseTo(sideX);
    expect(d.mouth[1].x).toBeCloseTo(sideX);
    // apex is the shared vertex of the two legs
    expect(d.apex).toEqual(point("bustDartUpper end", f));
  });
});

describe("dartIntake", () => {
  it("is zero without a dart and the mouth gap with one", () => {
    expect(dartIntake(draftFront(STANDARD_M))).toBe(0);
    expect(dartIntake(draftFittedFront(STANDARD_M))).toBeCloseTo(4);
  });
});

// tiny helper: the end point of a named leg edge, for the shared-apex assertion
function point(_label: string, f: ReturnType<typeof draftFittedFront>) {
  const e = f.edges.find((x) => x.name === "bustDartUpper")!;
  return e.kind === "line" ? e.end : e.curve.end;
}

import { dartAngle, transferDart, trueSeam, seamKink, edgesMeet } from "./dart";
import { edgeLength, edgeStart, edgeEnd, pieceEdge } from "./piece";
import { Piece } from "./piece";

const FRONT = draftFittedFront(STANDARD_M);
const len = (p: Piece, n: string): number => edgeLength(pieceEdge(p, n));

/** Largest gap between one edge's end and the next edge's start (0 = closed). */
function outlineGap(p: Piece): number {
  let worst = 0;
  for (let i = 0; i < p.edges.length; i++) {
    const a = edgeEnd(p.edges[i]);
    const b = edgeStart(p.edges[(i + 1) % p.edges.length]);
    worst = Math.max(worst, Math.hypot(a.x - b.x, a.y - b.y));
  }
  return worst;
}

describe("dartAngle", () => {
  it("is zero without a dart, and the wedge angle with one", () => {
    expect(dartAngle(draftFront(STANDARD_M))).toBe(0);
    expect((dartAngle(FRONT) * 180) / Math.PI).toBeCloseTo(18.361, 2);
  });
});

describe("transferDart", () => {
  it("leaves an undarted piece alone", () => {
    const tee = draftFront(STANDARD_M);
    expect(transferDart(tee, "hem", 0.5, "centerFront")).toBe(tee);
  });

  it("refuses a curved target — a dart mouth needs a straight seam", () => {
    expect(() => transferDart(FRONT, "armhole", 0.5, "centerFront")).toThrow(/straight/);
  });

  it("throws for an edge that doesn't exist", () => {
    expect(() => transferDart(FRONT, "collar", 0.5, "centerFront")).toThrow(/no edge/);
  });

  for (const target of ["shoulder", "hem"] as const) {
    describe(`to the ${target}`, () => {
      const moved = transferDart(FRONT, target, 0.5, "centerFront");

      it("keeps the outline closed", () => {
        expect(outlineGap(moved)).toBeLessThan(1e-9);
      });

      it("keeps the apex where it was and the wedge angle unchanged", () => {
        expect(dartOf(moved)!.apex).toEqual(dartOf(FRONT)!.apex);
        expect(dartAngle(moved)).toBeCloseTo(dartAngle(FRONT), 9);
      });

      it("keeps the dart's two legs equal, so it still shuts cleanly", () => {
        const [u, l] = moved.dart!.legs.map((n) => len(moved, n));
        expect(u).toBeCloseTo(l, 9);
      });

      it("never moves the centre fold", () => {
        const cf = pieceEdge(moved, "centerFront");
        expect(edgeStart(cf).x).toBeCloseTo(0, 9);
        expect(edgeEnd(cf).x).toBeCloseTo(0, 9);
      });

      it("closes the old dart: the side seam runs continuous again", () => {
        expect(edgesMeet(moved, "sideUpper", "sideLower")).toBe(true);
      });

      it("conserves seam lengths — moving a dart doesn't change the fit", () => {
        expect(len(moved, "sideUpper") + len(moved, "sideLower"))
          .toBeCloseTo(len(FRONT, "sideUpper") + len(FRONT, "sideLower"), 6);
        expect(len(moved, "armhole")).toBeCloseTo(len(FRONT, "armhole"), 6);
        expect(len(moved, "centerFront")).toBeCloseTo(len(FRONT, "centerFront"), 6);
      });
    });
  }

  it("splits the target seam in two, so its total length survives", () => {
    const moved = transferDart(FRONT, "shoulder", 0.5, "centerFront");
    expect(len(moved, "shoulder") + len(moved, "shoulderOuter"))
      .toBeCloseTo(len(FRONT, "shoulder"), 6);
  });

  it("widens the mouth when the dart moves farther from the apex (same angle)", () => {
    const moved = transferDart(FRONT, "shoulder", 0.5, "centerFront");
    expect(dartIntake(moved)).toBeGreaterThan(dartIntake(FRONT));
  });
});

describe("edgesMeet", () => {
  it("is false while the dart still splits the side seam", () => {
    expect(edgesMeet(FRONT, "sideUpper", "sideLower")).toBe(false);
  });
});

describe("seamKink and trueSeam", () => {
  const moved = transferDart(FRONT, "shoulder", 0.5, "centerFront");

  it("leaves a corner exactly the size of the dart it removed", () => {
    expect(seamKink(moved, "sideUpper", "sideLower"))
      .toBeCloseTo((dartAngle(FRONT) * 180) / Math.PI, 6);
  });

  it("blends the two edges into one straight seam, keeping the outline closed", () => {
    const trued = trueSeam(moved, "sideUpper", "sideLower");
    expect(trued.edges.map((e) => e.name)).not.toContain("sideLower");
    expect(seamKink(trued, "armhole", "sideUpper")).toBeDefined();
    expect(outlineGap(trued)).toBeLessThan(1e-9);
  });

  it("shortens the seam — a straight line beats a bent path (that's the cost)", () => {
    const bent = len(moved, "sideUpper") + len(moved, "sideLower");
    const trued = len(trueSeam(moved, "sideUpper", "sideLower"), "sideUpper");
    expect(trued).toBeLessThan(bent);
    expect(trued).toBeCloseTo(45.575, 2);
  });

  it("refuses to true a curve", () => {
    expect(() => trueSeam(FRONT, "neckline", "shoulder")).toThrow(/straight/);
  });
});
