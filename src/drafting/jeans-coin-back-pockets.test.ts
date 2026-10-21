import { describe, expect, it } from "vitest";
import { cubicPoint, point } from "../geometry";
import { blockPieces, rolePiece } from "./block";
import { DEFAULT_JEANS_OPTIONS, type JeansOptions } from "./jeans-contract";
import { buildJeansCoinBackPockets, JEANS_POCKET_KEEP_OUT_CM } from "./jeans-coin-back-pockets";
import { draftJeansCore } from "./jeans";
import { gradeMeasurements } from "./grading";
import { STANDARD_M } from "./measurements";
import { edgeEnd, edgeLength, edgeStart, pieceEdge, type Edge, type Piece } from "./piece";
import { stitchChecks } from "./stitch";
import { TROUSER_GRADE } from "./trouser-tables";

const base = draftJeansCore(STANDARD_M);

function withOptionPatch(options: Partial<JeansOptions>): JeansOptions {
  return { ...DEFAULT_JEANS_OPTIONS, ...options };
}

function build(
  options: Partial<JeansOptions> = {},
  facing: Piece = rolePiece(base, "pocketFacingRight"),
  backLower: Piece = rolePiece(base, "backLowerLeft"),
  backLowerRight: Piece = rolePiece(base, "backLowerRight"),
) {
  return buildJeansCoinBackPockets(facing, backLower, backLowerRight, withOptionPatch(options));
}

function replaceEdge(piece: Piece, name: string, replacement: Edge): Piece {
  return {
    ...piece,
    edges: piece.edges.map((edge) => edge.name === name ? replacement : edge),
  };
}

function widerBackHost(piece: Piece, amount: number): Piece {
  return {
    ...piece,
    edges: piece.edges.map((edge): Edge => {
      if (edge.kind === "curve" && edge.name === "yokeJoin") {
        return { ...edge, curve: {
          ...edge.curve,
          control1: point(edge.curve.control1.x + amount, edge.curve.control1.y),
          control2: point(edge.curve.control2.x + amount, edge.curve.control2.y),
          end: point(edge.curve.end.x + amount, edge.curve.end.y),
        } };
      }
      if (edge.kind === "line" && edge.name.startsWith("side")) {
        return {
          ...edge,
          start: point(edge.start.x + amount, edge.start.y),
          end: point(edge.end.x + amount, edge.end.y),
        };
      }
      return edge;
    }),
  };
}

function bowedBackHost(piece: Piece, scaleX: number, control1Y: number, control2Y: number): Piece {
  return {
    ...piece,
    edges: piece.edges.map((edge): Edge => edge.kind === "curve" && edge.name === "yokeJoin"
      ? { ...edge, curve: {
        start: point(edge.curve.start.x * scaleX, edge.curve.start.y),
        control1: point(edge.curve.control1.x * scaleX, control1Y),
        control2: point(edge.curve.control2.x * scaleX, control2Y),
        end: point(edge.curve.end.x * scaleX, edge.curve.end.y),
      } }
      : edge.kind === "line" && edge.name.startsWith("side")
        ? { ...edge,
          start: point(edge.start.x * scaleX, edge.start.y),
          end: point(edge.end.x * scaleX, edge.end.y),
        }
        : edge),
  };
}

function finitePoints(piece: Piece): boolean {
  return piece.edges.every((edge) => edge.kind === "line"
    ? [edge.start, edge.end].every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))
    : [edge.curve.start, edge.curve.control1, edge.curve.control2, edge.curve.end]
      .every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)));
}

function requireLine(edge: Edge): Extract<Edge, { kind: "line" }> {
  if (edge.kind !== "line") throw new Error(`Expected a line edge, received ${edge.kind}.`);
  return edge;
}

function maximumYInXSpan(
  curve: Extract<Edge, { kind: "curve" }>["curve"],
  minX: number,
  maxX: number,
): number {
  return Math.max(...Array.from({ length: 10_001 }, (_, index) => {
    const value = cubicPoint(curve, index / 10_000);
    return value.x >= minX && value.x <= maxX ? value.y : Number.NEGATIVE_INFINITY;
  }));
}

function minimumSideXInYSpan(piece: Piece, top: number, bottom: number): number {
  const values = piece.edges.flatMap((edge) => {
    if (edge.kind !== "line" || !edge.name.startsWith("side")) return [];
    const low = Math.max(top, Math.min(edge.start.y, edge.end.y));
    const high = Math.min(bottom, Math.max(edge.start.y, edge.end.y));
    if (low > high) return [];
    if (edge.start.y === edge.end.y) return [Math.min(edge.start.x, edge.end.x)];
    return [low, high].map((y) => {
      const t = (y - edge.start.y) / (edge.end.y - edge.start.y);
      return edge.start.x + (edge.end.x - edge.start.x) * t;
    });
  });
  return Math.min(...values);
}

function placementLines(piece: Piece, prefix: string) {
  return (piece.marks ?? [])
    .filter((mark) => mark.kind === "placementLine" && mark.name.startsWith(prefix))
    .map((mark) => {
      if (mark.kind !== "placementLine") throw new Error("Expected a placement line mark.");
      return { name: mark.name, start: mark.start, end: mark.end };
    });
}

function normalizeEndpoints(start: { x: number; y: number }, end: { x: number; y: number }) {
  return [start, end].sort((a, b) => a.x - b.x || a.y - b.y);
}

describe("Jeans coin and back-pocket geometry", () => {
  it("adds one wearer-right coin pocket on a seam-matched facing extension", () => {
    const draft = base;
    const pieces = blockPieces(draft);
    expect(pieces.filter(({ name }) => name === "jeans coin pocket")).toHaveLength(1);
    expect(pieces.filter(({ name }) => name.startsWith("jeans back patch pocket"))).toHaveLength(2);

    const facing = rolePiece(draft, "pocketFacingRight");
    const extension = rolePiece(draft, "pocketFacingExtensionRight");
    const facingSide = pieceEdge(facing, "sideFacing");
    const extensionJoin = pieceEdge(extension, "facingJoin");
    expect(extensionJoin).toEqual({
      kind: "line",
      name: "facingJoin",
      start: edgeEnd(facingSide),
      end: edgeStart(facingSide),
    });

    const coin = rolePiece(draft, "coinPocket");
    const coinTop = pieceEdge(coin, "pocketTop");
    expect(coinTop.kind).toBe("line");
    if (coinTop.kind !== "line" || facingSide.kind !== "line") throw new Error("Expected straight pocket edges.");
    expect(coinTop.start.y).toBe(facingSide.end.y + JEANS_POCKET_KEEP_OUT_CM);
    expect(pieceEdge(coin, "pocketBottom").kind).toBe("line");
    expect(coin.marks).toHaveLength(2);
    expect(coin.edges.every((edge) => edge.kind === "line")).toBe(true);

    const extensionPoints = extension.edges.flatMap((edge) => edge.kind === "line"
      ? [edge.start, edge.end]
      : [edge.curve.start, edge.curve.control1, edge.curve.control2, edge.curve.end]);
    const coinPoints = coin.edges.flatMap((edge) => edge.kind === "line" ? [edge.start, edge.end] : []);
    expect(Math.min(...coinPoints.map(({ x }) => x)) - Math.min(...extensionPoints.map(({ x }) => x)))
      .toBeGreaterThanOrEqual(JEANS_POCKET_KEEP_OUT_CM);
    expect(Math.max(...extensionPoints.map(({ x }) => x)) - Math.max(...coinPoints.map(({ x }) => x)))
      .toBe(JEANS_POCKET_KEEP_OUT_CM);
    expect(Math.max(...extensionPoints.map(({ y }) => y)) - Math.max(...coinPoints.map(({ y }) => y)))
      .toBe(JEANS_POCKET_KEEP_OUT_CM);
    const coinMarks = placementLines(extension, "coin-pocket-placement");
    expect(coinMarks).toHaveLength(4);
    expect(coinMarks.map(({ start, end }) => ({ start, end }))).toEqual([
      { start: requireLine(pieceEdge(coin, "pocketTop")).start, end: requireLine(pieceEdge(coin, "pocketTop")).end },
      { start: requireLine(pieceEdge(coin, "pocketOuter")).start, end: requireLine(pieceEdge(coin, "pocketOuter")).end },
      { start: requireLine(pieceEdge(coin, "pocketBottom")).start, end: requireLine(pieceEdge(coin, "pocketBottom")).end },
      { start: requireLine(pieceEdge(coin, "pocketInner")).start, end: requireLine(pieceEdge(coin, "pocketInner")).end },
    ]);
    expect(stitchChecks(draft, draft.stitches).filter(({ ok }) => !ok)).toEqual([]);
  });

  it("keeps paired back pockets below the live yoke and inside each panel from XS through XL", () => {
    for (const step of [-2, 0, 2]) {
      const draft = draftJeansCore(gradeMeasurements(STANDARD_M, TROUSER_GRADE, step));
      const lower = rolePiece(draft, "backLowerLeft");
      const lowerRight = rolePiece(draft, "backLowerRight");
      const yoke = pieceEdge(lower, "yokeJoin");
      const pocket = rolePiece(draft, "backPocketLeft");
      const rightPocket = rolePiece(draft, "backPocketRight");
      expect(yoke.kind).toBe("curve");
      if (yoke.kind !== "curve") throw new Error("Expected a curved lower-yoke seam.");
      const left = requireLine(pieceEdge(pocket, "pocketInner"));
      const right = requireLine(pieceEdge(pocket, "pocketOuter"));
      const top = requireLine(pieceEdge(pocket, "pocketTop"));
      const bottom = requireLine(pieceEdge(pocket, "pocketBottom"));

      const envelopeMaximum = maximumYInXSpan(yoke.curve, left.start.x - 1, right.start.x + 1);
      expect(top.start.y - envelopeMaximum).toBeGreaterThanOrEqual(DEFAULT_JEANS_OPTIONS.backPocketDrop - 1e-7);
      expect(top.start.y - envelopeMaximum).toBeLessThan(DEFAULT_JEANS_OPTIONS.backPocketDrop + 0.01);

      const center = edgeStart(pieceEdge(lower, "centerBackLower"));
      const knee = edgeEnd(pieceEdge(lower, "sideThighToKnee"));
      const hem = edgeStart(pieceEdge(lower, "hem"));
      expect(left.start.x - JEANS_POCKET_KEEP_OUT_CM).toBeGreaterThanOrEqual(center.x);
      const minimumSideX = minimumSideXInYSpan(
        lower,
        top.start.y - JEANS_POCKET_KEEP_OUT_CM,
        bottom.start.y + JEANS_POCKET_KEEP_OUT_CM,
      );
      expect(minimumSideX - right.start.x).toBeCloseTo(DEFAULT_JEANS_OPTIONS.backPocketOffset, 6);
      expect(right.start.x + JEANS_POCKET_KEEP_OUT_CM).toBeLessThanOrEqual(minimumSideX);
      expect(bottom.start.y + JEANS_POCKET_KEEP_OUT_CM).toBeLessThan(knee.y);
      expect(bottom.start.y + JEANS_POCKET_KEEP_OUT_CM).toBeLessThan(hem.y);
      expect(rightPocket.edges.map((edge) => edge.kind)).toEqual(pocket.edges.map((edge) => edge.kind));
      const rightEdges = rightPocket.edges.map(requireLine);
      expect(rightEdges[0]!.start.x).toBe(-requireLine(pieceEdge(pocket, "pocketTop")).start.x);
      expect(rightPocket.marks?.map(({ name }) => name)).toEqual([
        "jeans back patch pocket right-top-outer",
        "jeans back patch pocket right-top-inner",
      ]);
      const leftMarks = placementLines(lower, "left-back-pocket-placement");
      const rightMarks = placementLines(lowerRight, "right-back-pocket-placement");
      expect(leftMarks).toHaveLength(4);
      expect(rightMarks.map(({ name, start, end }) => ({ name, points: normalizeEndpoints(start, end) })))
        .toEqual(leftMarks.map(({ name, start, end }) => ({
          name: name.replace("left", "right"),
          points: normalizeEndpoints({ x: -start.x, y: start.y }, { x: -end.x, y: end.y }),
        })));
      expect(finitePoints(pocket)).toBe(true);
      expect(finitePoints(rightPocket)).toBe(true);
    }
  });

  it("keeps live dimensions at usable boundaries and names invalid option values", () => {
    for (const options of [
      { coinPocketWidth: 5, coinPocketHeight: 5 },
      { coinPocketWidth: 10, coinPocketHeight: 10 },
      { backPocketWidth: 10, backPocketHeight: 10, backPocketDrop: 2 },
      { backPocketHeight: 22, backPocketDrop: 15 },
    ]) {
      const features = build(options);
      const actual = withOptionPatch(options);
      expect(edgeLength(pieceEdge(features.coinPocket, "pocketTop"))).toBe(actual.coinPocketWidth);
      expect(edgeLength(pieceEdge(features.coinPocket, "pocketOuter"))).toBe(actual.coinPocketHeight);
      expect(edgeLength(pieceEdge(features.backPocketLeft, "pocketTop"))).toBe(actual.backPocketWidth);
      expect(edgeLength(pieceEdge(features.backPocketLeft, "pocketOuter"))).toBeCloseTo(actual.backPocketHeight, 9);
    }
    const wider = build(
      { backPocketWidth: 20, backPocketOffset: 2 },
      rolePiece(base, "pocketFacingRight"),
      widerBackHost(rolePiece(base, "backLowerLeft"), 6),
    );
    expect(edgeLength(pieceEdge(wider.backPocketLeft, "pocketTop"))).toBe(20);
    const offset = build(
      { backPocketWidth: 10, backPocketOffset: 15 },
      rolePiece(base, "pocketFacingRight"),
      widerBackHost(rolePiece(base, "backLowerLeft"), 6),
    );
    expect(edgeLength(pieceEdge(offset.backPocketLeft, "pocketTop"))).toBe(10);
    expect(() => build({ backPocketWidth: 20 })).toThrow(/reach the center-back seam/);

    const ranges: readonly [keyof JeansOptions, number, number][] = [
      ["coinPocketWidth", 5, 10],
      ["coinPocketHeight", 5, 10],
      ["backPocketWidth", 10, 20],
      ["backPocketHeight", 10, 22],
      ["backPocketDrop", 2, 15],
      ["backPocketOffset", 2, 15],
    ];
    for (const [field, minimum, maximum] of ranges) {
      expect(() => build({ [field]: minimum - 0.5 }))
        .toThrow(new RegExp(`${field} must be from ${minimum} to ${maximum} cm`));
      expect(() => build({ [field]: maximum + 0.5 }))
        .toThrow(new RegExp(`${field} must be from ${minimum} to ${maximum} cm`));
    }
    expect(() => build({ coinPocketHeight: Number.NaN })).toThrow(/coinPocketHeight must be from 5 to 10 cm; received NaN/);
  });

  it("finds the lower-yoke maximum for flat, linear, and curved seam profiles", () => {
    const lower = rolePiece(base, "backLowerLeft");
    const yoke = requireLineOrCurve(pieceEdge(lower, "yokeJoin"));
    const profiles = [
      [10, 10, 10, 10],
      [10, 11, 11, 10],
      [10, 11, 10, 10],
      [10, 11, 10, 12],
    ] as const;
    for (const [startY, control1Y, control2Y, endY] of profiles) {
      const curve = yoke.curve;
      const profile = replaceEdge(lower, "yokeJoin", {
        ...yoke,
        curve: {
          start: point(curve.start.x, startY),
          control1: point(curve.control1.x, control1Y),
          control2: point(curve.control2.x, control2Y),
          end: point(curve.end.x, endY),
        },
      });
      const features = build({}, rolePiece(base, "pocketFacingRight"), profile);
      expect(finitePoints(features.backPocketLeft)).toBe(true);
    }
  });

  it("fails clearly when a pathological side/yoke relationship cannot settle", () => {
    const lower = rolePiece(base, "backLowerLeft");
    const unstable = bowedBackHost(lower, 1.2, 35, -35);
    expect(() => build({}, rolePiece(base, "pocketFacingRight"), unstable))
      .toThrow(/placement did not resolve against the live side and yoke seams/);
  });

  it("reports malformed hosts and impossible containment without silently shifting pockets", () => {
    const facing = rolePiece(base, "pocketFacingRight");
    const facingSide = pieceEdge(facing, "sideFacing");
    if (facingSide.kind !== "line") throw new Error("Expected a facing side line.");
    const curvedSide = replaceEdge(facing, "sideFacing", {
      kind: "curve",
      name: "sideFacing",
      curve: { start: facingSide.start, control1: facingSide.start, control2: facingSide.end, end: facingSide.end },
    });
    expect(() => build({}, curvedSide)).toThrow(/requires straight edge "sideFacing"/);

    const lower = rolePiece(base, "backLowerLeft");
    const yoke = pieceEdge(lower, "yokeJoin");
    if (yoke.kind !== "curve") throw new Error("Expected a yoke curve.");
    const straightYoke = replaceEdge(lower, "yokeJoin", {
      kind: "line", name: "yokeJoin", start: yoke.curve.start, end: yoke.curve.end,
    });
    expect(() => build({}, facing, straightYoke)).toThrow(/requires curved edge "yokeJoin"/);

    const noSide = {
      ...lower,
      edges: lower.edges.map((edge) => edge.name.startsWith("side") && edge.name !== "sideThighToKnee"
        ? { ...edge, name: `renamed-${edge.name}` }
        : edge),
    };
    expect(() => build({}, facing, noSide)).toThrow(/no finite side seam across its containment envelope/);
    const horizontalSide = {
      ...lower,
      edges: [...lower.edges, {
        kind: "line" as const,
        name: "side horizontal probe",
        start: point(100, 20),
        end: point(101, 20),
      }],
    };
    expect(() => build({}, facing, horizontalSide)).not.toThrow();
    const nonFiniteSide = replaceEdge(lower, "sideHipToThigh", {
      kind: "line",
      name: "sideHipToThigh",
      start: point(Number.NaN, 20),
      end: point(Number.NaN, 45),
    });
    expect(() => build({}, facing, nonFiniteSide)).toThrow(/no finite side seam across its containment envelope/);
    expect(() => build({ backPocketWidth: 20, backPocketOffset: 15 })).toThrow(/reach the center-back seam/);

    const outboardLower = {
      ...lower,
      edges: lower.edges.map((edge) => edge.kind === "line" && edge.name.startsWith("side")
        ? { ...edge, start: point(edge.start.x + 50, edge.start.y), end: point(edge.end.x + 50, edge.end.y) }
        : edge),
    };
    expect(() => build({}, facing, outboardLower)).toThrow(/does not overlap the lower-yoke seam/);

    const kneeLine = pieceEdge(lower, "sideThighToKnee");
    if (kneeLine.kind !== "line") throw new Error("Expected a side knee line.");
    const highPocketLower = replaceEdge(lower, "sideThighToKnee", {
      ...kneeLine,
      end: point(kneeLine.end.x, 25),
    });
    expect(() => build({}, facing, widerBackHost(highPocketLower, 6))).toThrow(/reach the lower-leg station/);

    const hemLine = pieceEdge(lower, "hem");
    if (hemLine.kind !== "line") throw new Error("Expected a hem line.");
    const shortHemLower = replaceEdge(lower, "hem", {
      ...hemLine,
      start: point(hemLine.start.x, 25),
    });
    expect(() => build({}, facing, shortHemLower)).toThrow(/reach the hem/);
  });

  it("preserves invalid unrelated yoke input for downstream guidance", () => {
    const lower = rolePiece(base, "backLowerLeft");
    const yoke = pieceEdge(lower, "yokeJoin");
    if (yoke.kind !== "curve") throw new Error("Expected a yoke curve.");
    const invalidYoke = replaceEdge(lower, "yokeJoin", {
      ...yoke,
      curve: { ...yoke.curve, control1: point(Number.NaN, Number.NaN) },
    });
    const features = build({}, rolePiece(base, "pocketFacingRight"), invalidYoke);
    expect(finitePoints(features.backPocketLeft)).toBe(false);
    expect(finitePoints(features.backPocketRight)).toBe(false);
    const resultYoke = pieceEdge(features.backLowerLeft, "yokeJoin");
    expect(resultYoke.kind).toBe("curve");
    if (resultYoke.kind === "curve") expect(Number.isNaN(resultYoke.curve.control1.x)).toBe(true);
  });
});

function requireLineOrCurve(edge: Edge): Extract<Edge, { kind: "curve" }> {
  if (edge.kind !== "curve") throw new Error("Expected a cubic seam.");
  return edge;
}
