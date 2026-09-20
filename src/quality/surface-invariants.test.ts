// EPIC 10 — surface-placement invariants (Slice 143), plus an independent
// test-only geometry oracle over already-flattened cut loops.
//
// `@flatten-js/core` is a dev dependency used ONLY here, as an independent
// check on geometry InfiniDrip has already flattened (`flattenPiece`'s `cut`
// polyline). It never becomes a second drafting source of truth: production
// modules (drafting/, export/, surface/) do not import it, and no export
// baseline is touched. The justification for reaching for an external oracle
// here specifically: nothing in the current codebase checks a drafted cut
// loop for self-intersection (confirmed by inspection — `polygonArea`'s
// shoelace formula happily returns a number for a self-crossing loop without
// flagging it), so an independent "is this actually a simple polygon"
// assertion is new coverage, not a duplicate of an existing check.
import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { Polygon } from "@flatten-js/core";
import { GARMENTS, STANDARD_M, draftAtSize, blockPieces, type Measurements } from "../drafting";
import { flattenPiece } from "../export/layout";
import { polygonArea } from "../export/nesting";
import { FIELDS } from "../ui/controls";
import {
  transformError,
  placementError,
  addPlacement,
  removePlacement,
  normalizeRotation,
  EMPTY_TRANSFORM,
  type StyleSurface,
  type ArtworkPlacement,
  type PlacementTransform,
} from "../surface/placement";
import { artworkCorners, boundingBox, boxContains, boxesOverlap, effectiveResolution } from "../surface/transform";
import { surfaceAdd, surfaceRemove, EMPTY_BOOK, surfaceKey } from "../surface/store";

const placement = (overrides: Partial<ArtworkPlacement> = {}): ArtworkPlacement => ({
  id: "art-1",
  kind: "print",
  pieceRole: "front",
  widthCm: 20,
  heightCm: 10,
  transform: EMPTY_TRANSFORM,
  zOrder: 0,
  sourceName: "art.svg",
  ...overrides,
});

const finiteTransformArb: fc.Arbitrary<PlacementTransform> = fc.record({
  dx: fc.double({ min: -200, max: 200, noNaN: true, noDefaultInfinity: true }),
  dy: fc.double({ min: -200, max: 200, noNaN: true, noDefaultInfinity: true }),
  scale: fc.double({ min: 0.01, max: 10, noNaN: true, noDefaultInfinity: true }),
  rotationDeg: fc.double({ min: -1080, max: 1080, noNaN: true, noDefaultInfinity: true }),
});

describe("EPIC 10 — surface placement invariants (Slice 143)", () => {
  it("a fully-finite, positive-scale transform is always accepted (transformError is null)", () => {
    fc.assert(
      fc.property(finiteTransformArb, (t) => { expect(transformError(t)).toBeNull(); }),
      { seed: 1431610, numRuns: 40 },
    );
  });

  it("a non-finite or non-positive-scale transform is always rejected with an actionable message", () => {
    const badArb = fc.oneof(
      finiteTransformArb.map((t) => ({ ...t, dx: NaN })),
      finiteTransformArb.map((t) => ({ ...t, dy: Infinity })),
      finiteTransformArb.map((t) => ({ ...t, scale: 0 })),
      finiteTransformArb.map((t) => ({ ...t, scale: -1 })),
      finiteTransformArb.map((t) => ({ ...t, rotationDeg: NaN })),
    );
    fc.assert(
      fc.property(badArb, (t) => {
        const error = transformError(t);
        expect(error).not.toBeNull();
        expect(typeof error).toBe("string");
      }),
      { seed: 1431611, numRuns: 40 },
    );
  });

  it("normalizeRotation is always in [0, 360) and is 360-periodic", () => {
    fc.assert(
      fc.property(fc.double({ min: -10000, max: 10000, noNaN: true, noDefaultInfinity: true }), (deg) => {
        const n = normalizeRotation(deg);
        expect(n).toBeGreaterThanOrEqual(0);
        expect(n).toBeLessThan(360);
        expect(normalizeRotation(deg + 360)).toBeCloseTo(n, 6);
      }),
      { seed: 1431612, numRuns: 50 },
    );
  });

  it("artworkCorners at rotation 0 forms an axis-aligned box of exactly widthCm*scale by heightCm*scale, centred at (dx, dy)", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true, noDefaultInfinity: true }),
        finiteTransformArb,
        (widthCm, heightCm, t) => {
          const upright = { ...t, rotationDeg: 0 };
          const corners = artworkCorners(widthCm, heightCm, upright);
          const box = boundingBox(corners)!;
          expect(box.maxX - box.minX).toBeCloseTo(widthCm * upright.scale, 6);
          expect(box.maxY - box.minY).toBeCloseTo(heightCm * upright.scale, 6);
          expect((box.minX + box.maxX) / 2).toBeCloseTo(upright.dx, 6);
          expect((box.minY + box.maxY) / 2).toBeCloseTo(upright.dy, 6);
        },
      ),
      { seed: 1431613, numRuns: 30 },
    );
  });

  it("a full 360-degree rotation returns every corner to its starting position", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.1, max: 100, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 0.1, max: 100, noNaN: true, noDefaultInfinity: true }),
        finiteTransformArb,
        (widthCm, heightCm, t) => {
          const start = artworkCorners(widthCm, heightCm, t);
          const spun = artworkCorners(widthCm, heightCm, { ...t, rotationDeg: t.rotationDeg + 360 });
          start.forEach((p, i) => {
            expect(spun[i].x).toBeCloseTo(p.x, 6);
            expect(spun[i].y).toBeCloseTo(p.y, 6);
          });
        },
      ),
      { seed: 1431614, numRuns: 30 },
    );
  });

  it("boxContains treats an exactly edge-touching inner box as contained (the documented convention)", () => {
    const outer = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const touchingAllEdges = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const touchingOneEdge = { minX: 5, minY: 0, maxX: 15, maxY: 5 };
    expect(boxContains(outer, touchingAllEdges)).toBe(true);
    expect(boxesOverlap(outer, touchingOneEdge)).toBe(true); // edge-touching counts as overlap too
    expect(boxContains(outer, { minX: 5, minY: 0, maxX: 15, maxY: 5 })).toBe(false); // extends past maxX
  });

  it("effectiveResolution is null exactly when an input is non-finite or non-positive, and exact otherwise", () => {
    const positiveArb = fc.double({ min: 0.01, max: 1000, noNaN: true, noDefaultInfinity: true });
    fc.assert(
      fc.property(positiveArb, positiveArb, positiveArb, positiveArb, positiveArb,
        (pxW, pxH, wCm, hCm, scale) => {
          const r = effectiveResolution(pxW, pxH, wCm, hCm, scale);
          expect(r).not.toBeNull();
          expect(r!.xPxPerCm).toBeCloseTo(pxW / (wCm * scale), 9);
          expect(r!.yPxPerCm).toBeCloseTo(pxH / (hCm * scale), 9);
        }),
      { seed: 1431615, numRuns: 30 },
    );
    for (const bad of [NaN, Infinity, -Infinity, 0, -5]) {
      expect(effectiveResolution(bad, 100, 10, 10, 1)).toBeNull();
      expect(effectiveResolution(100, bad, 10, 10, 1)).toBeNull();
      expect(effectiveResolution(100, 100, bad, 10, 1)).toBeNull();
      expect(effectiveResolution(100, 100, 10, bad, 1)).toBeNull();
      expect(effectiveResolution(100, 100, 10, 10, bad)).toBeNull();
    }
  });

  it("addPlacement/removePlacement never mutate the source-of-truth object passed in (source-geometry immutability)", () => {
    fc.assert(
      fc.property(fc.array(fc.string({ minLength: 1, maxLength: 4 }), { minLength: 0, maxLength: 5 }), (ids) => {
        const original: StyleSurface = { styleName: "Style", placements: ids.map((id) => placement({ id })) };
        const snapshot = JSON.stringify(original);
        addPlacement(original, placement({ id: "new-one" }));
        if (ids.length > 0) removePlacement(original, ids[0]);
        expect(JSON.stringify(original)).toBe(snapshot);
      }),
      { seed: 1431616, numRuns: 20 },
    );
  });

  it("surfaceAdd/surfaceRemove never mutate the source book (store-level immutability)", () => {
    const key = surfaceKey("tee", "Classic tee");
    const original = surfaceAdd(EMPTY_BOOK, key, "Classic tee", placement({ id: "a" }));
    const snapshot = JSON.stringify(original);
    surfaceAdd(original, key, "Classic tee", placement({ id: "b" }));
    surfaceRemove(original, key, "a");
    expect(JSON.stringify(original)).toBe(snapshot);
  });

  it("regression fixture: a non-positive scale is always an invalid placement, never silently treated as scale 1", () => {
    expect(placementError(placement({ transform: { ...EMPTY_TRANSFORM, scale: 0 } }))).not.toBeNull();
    expect(placementError(placement({ transform: { ...EMPTY_TRANSFORM, scale: -2 } }))).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Independent oracle (@flatten-js/core) — Slice 143.
// ---------------------------------------------------------------------------
describe("EPIC 10 — independent geometry oracle on flattened loops (Slice 143)", () => {
  describe("fixed boundary fixtures", () => {
    it("concave: a simple concave hexagon is valid and its area matches our shoelace implementation", () => {
      const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 5, y: 5 }, { x: 5, y: 10 }, { x: 0, y: 10 }];
      const oracle = new Polygon(pts.map((p) => [p.x, p.y]));
      expect(oracle.isValid()).toBe(true);
      expect(polygonArea(pts)).toBeCloseTo(oracle.area(), 9);
      expect(oracle.area()).toBe(75);
    });

    it("collinear: a redundant collinear vertex on an edge does not change validity or area", () => {
      const pts = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
      const oracle = new Polygon(pts.map((p) => [p.x, p.y]));
      expect(oracle.isValid()).toBe(true);
      expect(polygonArea(pts)).toBeCloseTo(oracle.area(), 9);
      expect(oracle.area()).toBe(100);
    });

    it("tiny-edge: a sub-nanometre edge stays valid and the area cross-check still agrees within tolerance", () => {
      const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 10 + 1e-9, y: 10 }, { x: 0, y: 10 }];
      const oracle = new Polygon(pts.map((p) => [p.x, p.y]));
      expect(oracle.isValid()).toBe(true);
      expect(Math.abs(polygonArea(pts) - oracle.area())).toBeLessThan(1e-6);
    });

    it("self-crossing: a bowtie is invalid under the oracle, even though the shoelace sum cancels to zero", () => {
      const pts = [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 0 }, { x: 0, y: 10 }];
      const oracle = new Polygon(pts.map((p) => [p.x, p.y]));
      expect(oracle.isValid()).toBe(false);
      // Recorded disagreement, investigated (not hidden): our shoelace formula
      // is a pure numeric sum with no topology awareness, so a symmetric
      // self-crossing loop can cancel to a "valid-looking" zero instead of
      // failing loudly. This is exactly why the independent oracle exists —
      // shoelace alone would not have caught this loop being degenerate.
      expect(polygonArea(pts)).toBe(0);
    });

    it("touching (vertex-tangent, not crossing): a figure-eight sharing one vertex is flagged invalid by the oracle", () => {
      // Two triangles meeting at exactly one shared point (5,5) — no edges
      // cross, but the loop is not a simple polygon. Investigated disagreement:
      // shoelace reports a plausible nonzero area (it sums two real triangles),
      // while the oracle's stricter simple-polygon topology check correctly
      // rejects self-tangency. No real InfiniDrip piece outline is
      // self-tangent (necklines/armholes/hems never touch themselves), so this
      // fixture documents the oracle's boundary rather than a live defect.
      const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 5 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 5, y: 5 }];
      const oracle = new Polygon(pts.map((p) => [p.x, p.y]));
      expect(oracle.isValid()).toBe(false);
      expect(polygonArea(pts)).toBe(50);
    });

    it("tolerance-boundary: two pieces sharing exactly one edge are each independently valid (a real paired-panel layout)", () => {
      const left = [{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 5, y: 10 }, { x: 0, y: 10 }];
      const right = [{ x: 5, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 5, y: 10 }];
      expect(new Polygon(left.map((p) => [p.x, p.y])).isValid()).toBe(true);
      expect(new Polygon(right.map((p) => [p.x, p.y])).isValid()).toBe(true);
      expect(boxesOverlap(boundingBox(left)!, boundingBox(right)!)).toBe(true); // shared edge counts as overlap
    });
  });

  // Bounded property: every real recipe's flattened CUT loop, across many
  // valid measurement sets, is a simple (non-self-intersecting) polygon whose
  // independently-computed area agrees with our own shoelace implementation.
  // This is the genuinely new assertion this oracle buys: nothing else in the
  // suite checks drafted cut loops for self-intersection.
  const measurementsArb = (recipe: (typeof GARMENTS)[number]) => {
    const bound = new Map(FIELDS.map((f) => [f.id, f]));
    const entries = recipe.fields.map((id) => {
      const b = bound.get(id)!;
      return [id, fc.double({ min: b.min, max: b.max, noNaN: true, noDefaultInfinity: true })] as const;
    });
    return fc.record(Object.fromEntries(entries)).map((partial) => ({ ...STANDARD_M, ...(partial as Partial<Measurements>) }));
  };

  const simplePolygonProperty = (recipe: (typeof GARMENTS)[number]) =>
    fc.property(measurementsArb(recipe), (measurements) => {
      const block = draftAtSize(measurements, recipe.grade, 0, recipe.draft, {});
      for (const piece of blockPieces(block)) {
        const flat = flattenPiece(piece, recipe.allowances);
        if (flat.cut.length < 3) continue; // degenerate open construction lines are not polygons
        const oracle = new Polygon(flat.cut.map((p) => [p.x, p.y]));
        if (!oracle.isValid()) return false;
        const ours = polygonArea(flat.cut);
        const theirs = oracle.area();
        const tolerance = Math.max(1e-6, theirs * 1e-6);
        if (Math.abs(ours - theirs) > tolerance) return false;
      }
      return true;
    });

  for (const recipe of GARMENTS) {
    it(`${recipe.name}: every drafted piece's flattened cut loop is a simple polygon agreeing with the oracle's area`, () => {
      fc.assert(simplePolygonProperty(recipe), { seed: 1431620, numRuns: 15 });
    });
  }

  describe("permanent regression fixtures for discovered concave-offset defects", () => {
    it(
      "trouser back-left/back-right seam-allowance CUT outlines remain simple at the shipped default STANDARD_M size (step 0)",
      () => {
        // This is the app's own default state. The production offset pass
        // trims the small inward loop created at the back crotch rather than
        // allowing the exported CUT line to self-cross.
        const recipe = GARMENTS.find((r) => r.name === "trouser")!;
        const block = draftAtSize(STANDARD_M, recipe.grade, 0, recipe.draft, {});
        for (const role of ["backLeft", "backRight"] as const) {
          const piece = block.roles[role];
          const flat = flattenPiece(piece, recipe.allowances);
          const oracle = new Polygon(flat.cut.map((p) => [p.x, p.y]));
          expect(oracle.isValid()).toBe(true);
        }
      },
    );

    it(
      "woven-shirt back-lower CUT outline remains simple for the previously failing extreme body fixture",
      () => {
        // This stays as a permanent adversarial fixture because it is an
        // extreme, unusual-proportion corner of the declared input domain and
        // the UI must keep its guidance truthful while still producing finite,
        // simple digital geometry.
        const recipe = GARMENTS.find((r) => r.name === "woven-shirt")!;
        const measurements: Measurements = {
          ...STANDARD_M,
          neck: 25, chest: 60, shoulderWidth: 30, bicep: 20, length: 40,
          armholeDepth: 12, sleeveLength: 8, waist: 101.4143637685686,
          hip: 60, hipDepth: 10, ease: 0,
        };
        const block = draftAtSize(measurements, recipe.grade, 0, recipe.draft, {});
        const piece = block.roles["back"]; // role key for the "woven back lower" piece
        const flat = flattenPiece(piece, recipe.allowances);
        const oracle = new Polygon(flat.cut.map((p) => [p.x, p.y]));
        expect(oracle.isValid()).toBe(true);
      },
    );
  });
});
