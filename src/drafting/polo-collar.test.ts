import { describe, expect, it } from "vitest";
import { edgeLength, pieceEdge } from "./piece";
import { bodice } from "./bodice";
import { STANDARD_M } from "./measurements";
import { buildPoloCollarGeometry, PoloCollarOptions } from "./polo-collar";
import { point } from "../geometry";

const OPTIONS: PoloCollarOptions = {
  standHeight: 2,
  standFrontRise: 0.75,
  collarLeafDepth: 5,
  collarPointExtension: 1.5,
};

function necklines() {
  return {
    front: pieceEdge(bodice(STANDARD_M, { position: "front" }).pieces.front, "neckline"),
    back: pieceEdge(bodice(STANDARD_M, { position: "back" }).pieces.back, "neckline"),
  };
}

function lineNecklines(
  frontStart = point(0, 1),
  frontEnd = point(4, 0),
  backStart = point(0, 0),
  backEnd = point(4, 0),
) {
  return {
    front: { kind: "line" as const, name: "front", start: frontStart, end: frontEnd },
    back: { kind: "line" as const, name: "back", start: backStart, end: backEnd },
  };
}

function finitePoint(value: { readonly x: number; readonly y: number }): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y);
}

function finiteEdge(edge: { readonly kind: "line" | "curve"; readonly start?: { readonly x: number; readonly y: number }; readonly end?: { readonly x: number; readonly y: number }; readonly curve?: { readonly start: { readonly x: number; readonly y: number }; readonly control1: { readonly x: number; readonly y: number }; readonly control2: { readonly x: number; readonly y: number }; readonly end: { readonly x: number; readonly y: number } } }): boolean {
  if (edge.kind === "line") return finitePoint(edge.start!) && finitePoint(edge.end!);
  return finitePoint(edge.curve!.start) && finitePoint(edge.curve!.control1) &&
    finitePoint(edge.curve!.control2) && finitePoint(edge.curve!.end);
}

describe("Epic 11 Slice 155 Polo collar geometry", () => {
  it("keeps separate front/back arc lengths and reproducible CB/shoulder/CF landmarks", () => {
    const source = necklines();
    const result = buildPoloCollarGeometry(source, OPTIONS);
    expect(result.geometry).not.toBeNull();
    const geometry = result.geometry!;
    const expected = edgeLength(source.front) + edgeLength(source.back);
    expect(geometry.valid).toBe(true);
    expect(geometry.lowerStand.length).toBeCloseTo(expected, 4);
    expect(geometry.lowerStand.landmarks.map((landmark) => landmark.name)).toEqual([
      "centerBack", "shoulder", "centerFront",
    ]);
    expect(geometry.lowerStand.landmarks[1].arcLengthFromCenterBack)
      .toBeCloseTo(edgeLength(source.back), 4);
    expect(geometry.lowerStand.landmarks[2].arcLengthFromCenterBack)
      .toBeCloseTo(expected, 4);
    expect(geometry.lowerStand.landmarks[0].point.x).toBe(0);
    expect(geometry.lowerStand.landmarks[0].point.y).toBe(0);
    expect(finitePoint(geometry.lowerStand.landmarks[2].point)).toBe(true);
    expect(geometry.lowerStand.landmarks[2].point.x)
      .toBeGreaterThan(geometry.lowerStand.landmarks[1].point.x);
  });

  it("uses the measured upper stand seam as the collar-base source", () => {
    const geometry = buildPoloCollarGeometry(necklines(), OPTIONS).geometry!;
    expect(geometry.upperStand.length).toBeGreaterThan(0);
    expect(geometry.collarBase.length).toBeCloseTo(geometry.upperStand.length, 8);
    expect(geometry.collarBase.segments).toEqual([
      { ...geometry.upperStand.segments[0], name: "backCollarBase" },
      { ...geometry.upperStand.segments[1], name: "frontCollarBase" },
    ]);
    expect(geometry.upperStand.length).not.toBeCloseTo(geometry.lowerStand.length, 8);
  });

  it("keeps a zero rise finite and uses the documented straight-rise fallback", () => {
    const geometry = buildPoloCollarGeometry(necklines(), { ...OPTIONS, standFrontRise: 0 }).geometry!;
    expect(geometry.valid).toBe(true);
    expect(geometry.upperStand.length).toBeCloseTo(geometry.lowerStand.length, 8);
    expect(geometry.collar.centerBack.kind).toBe("line");
    expect(geometry.collar.frontTip.kind).toBe("line");
    expect(geometry.collar.outer.kind).toBe("curve");
  });

  it("returns explicit issues for crossed stand and collar choices without clamping", () => {
    const result = buildPoloCollarGeometry(necklines(), {
      ...OPTIONS,
      standHeight: 1,
      standFrontRise: 2,
      collarLeafDepth: 4,
      collarPointExtension: 3,
    });
    expect(result.geometry).not.toBeNull();
    expect(result.geometry!.valid).toBe(false);
    expect(result.issues.map((entry) => entry.code)).toEqual(expect.arrayContaining([
      "stand-rise-exceeds-height", "collar-point-dominates",
    ]));
    expect(result.geometry!.lowerStand.landmarks[2].point.y).not.toBe(
      result.geometry!.lowerStand.landmarks[1].point.y,
    );
  });

  it("keeps boundary geometry finite and deterministic", () => {
    const first = buildPoloCollarGeometry(necklines(), {
      standHeight: 3,
      standFrontRise: 2,
      collarLeafDepth: 7,
      collarPointExtension: 3,
    });
    const second = buildPoloCollarGeometry(necklines(), {
      standHeight: 3,
      standFrontRise: 2,
      collarLeafDepth: 7,
      collarPointExtension: 3,
    });
    expect(first).toEqual(second);
    expect(first.geometry).not.toBeNull();
    for (const edge of [
      ...first.geometry!.lowerStand.segments,
      ...first.geometry!.upperStand.segments,
      ...first.geometry!.collarBase.segments,
      first.geometry!.collar.centerBack,
      first.geometry!.collar.frontTip,
      first.geometry!.collar.outer,
    ]) expect(finiteEdge(edge)).toBe(true);
  });

  it("rejects non-finite input instead of manufacturing a fallback shape", () => {
    const result = buildPoloCollarGeometry(necklines(), { ...OPTIONS, standHeight: Number.NaN });
    expect(result.geometry).toBeNull();
    expect(result.issues[0]).toMatchObject({ code: "non-finite-input", field: "polo-collar" });
  });

  it("handles straight neckline interfaces and the zero-rise fallback", () => {
    const result = buildPoloCollarGeometry(lineNecklines(), { ...OPTIONS, standFrontRise: 0 });
    expect(result.geometry).not.toBeNull();
    expect(result.geometry!.valid).toBe(true);
    expect(result.geometry!.lowerStand.segments.every((edge) => edge.kind === "line")).toBe(true);
    expect(result.geometry!.upperStand.segments.every((edge) => edge.kind === "line")).toBe(true);
    expect(result.geometry!.lowerStand.length).toBeCloseTo(
      edgeLength(lineNecklines().front) + edgeLength(lineNecklines().back),
      8,
    );
  });

  it("reports an unsolved rise when the vertical lift already exceeds the target seam", () => {
    const result = buildPoloCollarGeometry(
      lineNecklines(point(0, -5), point(0, 0)),
      OPTIONS,
    );
    expect(result.geometry).not.toBeNull();
    expect(result.issues.map((entry) => entry.code)).toContain("front-rise-unsolved");
    expect(result.geometry!.valid).toBe(false);
  });

  it("expands the horizontal solver bracket when the shaped seam is initially short", () => {
    const result = buildPoloCollarGeometry(
      lineNecklines(point(-1, 5), point(0, 0)),
      OPTIONS,
    );
    expect(result.geometry).not.toBeNull();
    expect(result.issues.map((entry) => entry.code)).not.toContain("front-rise-unsolved");
    expect(result.geometry!.lowerStand.length).toBeCloseTo(
      edgeLength(lineNecklines(point(-1, 5), point(0, 0)).front) +
      edgeLength(lineNecklines(point(-1, 5), point(0, 0)).back),
      4,
    );

    const unbracketed = buildPoloCollarGeometry(
      lineNecklines(point(0, 5), point(0, 0)),
      OPTIONS,
    );
    expect(unbracketed.geometry).not.toBeNull();
    expect(unbracketed.issues.map((entry) => entry.code)).toContain("front-rise-unsolved");
  });

  it("reports empty, negative and reversing finite choices without clamping", () => {
    const empty = buildPoloCollarGeometry(
      lineNecklines(point(0, 0), point(0, 0)),
      OPTIONS,
    );
    expect(empty.geometry).toBeNull();
    expect(empty.issues[0].code).toBe("empty-neckline");

    const negative = buildPoloCollarGeometry(lineNecklines(), {
      ...OPTIONS,
      collarLeafDepth: -1,
    });
    expect(negative.geometry).not.toBeNull();
    expect(negative.issues.map((entry) => entry.code)).toContain("negative-dimension");

    const reversing = buildPoloCollarGeometry(lineNecklines(
      point(0, 1), point(-4, 0), point(0, 0), point(-4, 0),
    ), { ...OPTIONS, standFrontRise: 0 });
    expect(reversing.geometry).not.toBeNull();
    expect(reversing.issues.map((entry) => entry.code)).toContain("seam-reverses");
  });

  it("rejects non-finite source edges and overflowing finite source geometry", () => {
    const nonFinite = buildPoloCollarGeometry({
      back: { kind: "line", name: "back", start: point(Number.NaN, 0), end: point(1, 0) },
      front: lineNecklines().front,
    }, OPTIONS);
    expect(nonFinite.geometry).toBeNull();
    expect(nonFinite.issues[0].code).toBe("non-finite-input");

    const overflowing = buildPoloCollarGeometry(lineNecklines(
      point(-Number.MAX_VALUE, 0), point(Number.MAX_VALUE, 0),
      point(-Number.MAX_VALUE, 0), point(Number.MAX_VALUE, 0),
    ), { ...OPTIONS, standFrontRise: 0 });
    expect(overflowing.geometry).toBeNull();
    expect(overflowing.issues.map((entry) => entry.code)).toContain("non-finite-output");
  });
});
