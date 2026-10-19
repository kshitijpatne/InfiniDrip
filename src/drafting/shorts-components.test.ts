import { describe, expect, it } from "vitest";
import { cubicPoint, point } from "../geometry";
import { STANDARD_M } from "./measurements";
import { gradeMeasurements } from "./grading";
import { block, blockPieces, rolePiece } from "./block";
import { edgeLength, pieceEdge } from "./piece";
import { stitchChecks } from "./stitch";
import { TROUSER_GRADE } from "./trouser-tables";
import {
  DEFAULT_SHORTS_OPTIONS,
  SHORTS_COMPONENT_OPTION_DEFINITIONS,
  SHORTS_OPTION_DEFINITIONS,
  SHORTS_ROLE_IDS,
} from "./shorts-contract";
import {
  draftShortsWithComponents,
  resolveShortsOptions,
  shortsComponentGuidance,
  shortsPocketOpening,
} from "./shorts-components";

const SHORTS_M = {
  ...STANDARD_M,
  waist: 84,
  hip: 100,
  hipDepth: 18,
  crotchDepth: 27,
  thigh: 66,
  ease: 10,
};

const lineMarkOf = (piece: ReturnType<typeof rolePiece>, name: string) => {
  const mark = piece.marks?.find((candidate) => candidate.name === name);
  if (!mark || !("start" in mark)) throw new Error(`Missing line mark ${name}`);
  return mark;
};

function outlinePoints(piece: ReturnType<typeof rolePiece>) {
  const points = [];
  for (const edge of piece.edges) {
    const start = edge.kind === "line" ? edge.start : edge.curve.start;
    const end = edge.kind === "line" ? edge.end : edge.curve.end;
    if (points.length === 0) points.push(start);
    else expect(points[points.length - 1]).toEqual(start);
    if (edge.kind === "line") points.push(end);
    else {
      for (let index = 1; index <= 64; index += 1) {
        points.push(cubicPoint(edge.curve, index / 64));
      }
    }
  }
  expect(points[points.length - 1]).toEqual(points[0]);
  return points;
}

function hasProperCrossing(points: ReturnType<typeof outlinePoints>): boolean {
  const segmentCount = points.length - 1;
  const cross = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x * b.y - a.y * b.x;
  for (let first = 0; first < segmentCount; first += 1) {
    const a = points[first]!;
    const b = points[first + 1]!;
    for (let second = first + 2; second < segmentCount; second += 1) {
      if (first === 0 && second === segmentCount - 1) continue;
      const c = points[second]!;
      const d = points[second + 1]!;
      const ab = { x: b.x - a.x, y: b.y - a.y };
      const ac = { x: c.x - a.x, y: c.y - a.y };
      const ad = { x: d.x - a.x, y: d.y - a.y };
      const cd = { x: d.x - c.x, y: d.y - c.y };
      const ca = { x: a.x - c.x, y: a.y - c.y };
      const cb = { x: b.x - c.x, y: b.y - c.y };
      if (cross(ab, ac) * cross(ab, ad) < -1e-12 && cross(cd, ca) * cross(cd, cb) < -1e-12) return true;
    }
  }
  return false;
}

describe("shorts component contract", () => {
  it("declares shorts-owned fly and pocket defaults and preserves raw values", () => {
    expect(SHORTS_COMPONENT_OPTION_DEFINITIONS.map(({ id, defaultValue, min, max, step }) =>
      ({ id, defaultValue, min, max, step }))).toEqual([
      { id: "flyLength", defaultValue: 11, min: 6, max: 18, step: 0.5 },
      { id: "pocketOpening", defaultValue: 12, min: 8, max: 20, step: 0.5 },
      { id: "pocketAngle", defaultValue: 58, min: 35, max: 70, step: 1 },
      { id: "pocketBagDepth", defaultValue: 13, min: 8, max: 25, step: 0.5 },
      { id: "pocketDrop", defaultValue: 2, min: 0, max: 10, step: 0.5 },
    ]);
    const optionIds = SHORTS_OPTION_DEFINITIONS.map(({ id }) => id);
    expect(optionIds).toHaveLength(10);
    expect(new Set(optionIds).size).toBe(optionIds.length);
    expect(resolveShortsOptions()).toEqual(DEFAULT_SHORTS_OPTIONS);
    const raw = resolveShortsOptions({ flyLength: -1, pocketAngle: Number.NaN, pocketDrop: 12 });
    expect(raw.flyLength).toBe(-1);
    expect(Number.isNaN(raw.pocketAngle)).toBe(true);
    expect(raw.pocketDrop).toBe(12);
  });

  it("composes the nine accepted roles with matched waist, fly, and pocket seams", () => {
    const drafted = draftShortsWithComponents(SHORTS_M);
    expect(Object.keys(drafted.roles)).toEqual(SHORTS_ROLE_IDS);
    expect(blockPieces(drafted).map((piece) => piece.name)).toEqual([
      "shorts front left", "shorts front right", "shorts back left", "shorts back right",
      "shorts waistband", "shorts fly shield", "shorts fly underlap",
      "shorts pocket bag left", "shorts pocket bag right",
    ]);
    expect(drafted.stitches).toHaveLength(11);
    expect(stitchChecks(drafted, drafted.stitches).every((check) => check.ok)).toBe(true);
    expect(edgeLength(pieceEdge(rolePiece(drafted, "waistband"), "bottom"))).toBeCloseTo(
      SHORTS_M.waist + SHORTS_M.ease,
      10,
    );

    const opening = shortsPocketOpening(SHORTS_M);
    const frontLeft = rolePiece(drafted, "frontLeft");
    const frontRight = rolePiece(drafted, "frontRight");
    const leftBag = rolePiece(drafted, "pocketBagLeft");
    const rightBag = rolePiece(drafted, "pocketBagRight");
    expect(lineMarkOf(frontLeft, "pocketOpening").start).toEqual(opening.start);
    expect(lineMarkOf(frontLeft, "pocketOpening").end).toEqual(opening.end);
    expect(edgeLength(pieceEdge(leftBag, "opening"))).toBeCloseTo(
      edgeLength(pieceEdge(rightBag, "opening")),
      10,
    );
    expect(lineMarkOf(frontRight, "pocketOpening").start.x).toBe(-opening.start.x);
    expect(lineMarkOf(frontRight, "pocketOpening").end.x).toBe(-opening.end.x);
    expect(leftBag.marks?.map((mark) => mark.name)).toEqual(["bagOpeningMatch", "bagBottom"]);
    expect(rightBag.marks?.map((mark) => mark.name)).toEqual(["bagOpeningMatch", "bagBottom"]);
  });

  it("keeps valid XS, M, and knee-crossing XL component outlines finite, closed, and simple", () => {
    const samples = [
      { size: -2, shortsInseam: 5.5, hemOpening: 40 },
      { size: 0, shortsInseam: 20, hemOpening: 60 },
      { size: 2, shortsInseam: 45, hemOpening: 90 },
    ];
    for (const sample of samples) {
      const measurements = gradeMeasurements(STANDARD_M, TROUSER_GRADE, sample.size);
      const options = { shortsInseam: sample.shortsInseam, hemOpening: sample.hemOpening };
      const drafted = draftShortsWithComponents(measurements, options);
      expect(shortsComponentGuidance(drafted, measurements, options)).toEqual([]);
      for (const piece of blockPieces(drafted)) {
        const points = outlinePoints(piece);
        expect(points.flatMap(({ x, y }) => [x, y]).every(Number.isFinite)).toBe(true);
        expect(hasProperCrossing(points)).toBe(false);
      }
    }
  });

  it("moves the fly and pocket construction with their recipe-owned options", () => {
    const options = { flyLength: 14, pocketOpening: 16, pocketAngle: 50, pocketDrop: 6, pocketBagDepth: 18 };
    const drafted = draftShortsWithComponents(SHORTS_M, options);
    expect(edgeLength(pieceEdge(rolePiece(drafted, "flyShield"), "left"))).toBe(14);
    expect(edgeLength(pieceEdge(rolePiece(drafted, "flyUnderlap"), "frontEdge"))).toBe(14);
    expect(edgeLength(pieceEdge(rolePiece(drafted, "pocketBagLeft"), "opening"))).toBeCloseTo(16, 10);
    expect(shortsPocketOpening(SHORTS_M, options).start.y).toBe(6);
    expect(lineMarkOf(rolePiece(drafted, "flyShield"), "flyFold").end.y).toBe(14);
  });

  it("accepts the component defaults without a warning", () => {
    const drafted = draftShortsWithComponents(SHORTS_M);
    expect(shortsComponentGuidance(drafted, SHORTS_M)).toEqual([]);
  });

  it("reports computed field-specific corrections for the short-length pressure case", () => {
    const options = {
      shortsInseam: 5.5,
      hemOpening: 40,
      waistbandDepth: 6,
      flyLength: 36,
      pocketOpening: 20,
      pocketAngle: 70,
      pocketBagDepth: 25,
      pocketDrop: 10,
    };
    const drafted = draftShortsWithComponents(SHORTS_M, options);
    const notes = shortsComponentGuidance(drafted, SHORTS_M, options);
    expect(notes.map((note) => note.field)).toContain("option-pocketBagDepth");
    expect(notes.find((note) => note.field === "option-pocketBagDepth")?.text).toMatch(/computed maximum is \d+(\.\d+)? cm/);
    expect(notes.every((note) => note.level === "warn")).toBe(true);
    expect(resolveShortsOptions(options).pocketBagDepth).toBe(25);
  });

  it("reports when even a zero-depth bag cannot clear the hem turn", () => {
    const options = {
      shortsInseam: -0.5,
      pocketOpening: 20,
      pocketAngle: 70,
      pocketBagDepth: 8,
      pocketDrop: 10,
    };
    const notes = shortsComponentGuidance(draftShortsWithComponents(SHORTS_M, options), SHORTS_M, options);
    expect(notes.some((note) => note.field === "option-pocketBagDepth")).toBe(true);
  });

  it("checks bag depth against the curved rise and inner-thigh boundary at the longest length", () => {
    const options = {
      shortsInseam: 45,
      pocketOpening: 20,
      pocketAngle: 35,
      pocketBagDepth: 25,
    };
    const drafted = draftShortsWithComponents(SHORTS_M, options);
    const notes = shortsComponentGuidance(drafted, SHORTS_M, options);
    expect(notes.some((note) => note.field === "option-pocketBagDepth" && /front panel/.test(note.text))).toBe(true);
    expect(resolveShortsOptions(options).pocketBagDepth).toBe(25);
  });

  it("accepts the longest length with the maximum opening when the bag clears the rise", () => {
    const options = {
      shortsInseam: 45,
      pocketOpening: 20,
      pocketAngle: 70,
      pocketBagDepth: 8,
      pocketDrop: 0,
    };
    const drafted = draftShortsWithComponents(SHORTS_M, options);
    expect(stitchChecks(drafted, drafted.stitches).every((check) => check.ok)).toBe(true);
    expect(shortsComponentGuidance(drafted, SHORTS_M, options)).toEqual([]);
  });

  it("handles a horizontal run in the front rise edge while checking containment", () => {
    const drafted = draftShortsWithComponents(SHORTS_M);
    const front = rolePiece(drafted, "frontLeft");
    const edges = front.edges.map((edge) => edge.name === "crotch" && edge.kind === "curve"
      ? { ...edge, curve: {
          ...edge.curve,
          start: point(edge.curve.start.x, 20),
          control1: point(edge.curve.control1.x, 20),
          control2: point(edge.curve.control2.x, 20),
          end: point(edge.curve.end.x, 20),
        } }
      : edge);
    const changed = { ...drafted, roles: { ...drafted.roles, frontLeft: { ...front, edges } } };
    expect(shortsComponentGuidance(changed, SHORTS_M).some((note) => note.level === "warn")).toBe(true);
  });

  it("keeps zero and negative component inputs visible with range guidance", () => {
    const options = { shortsInseam: 0, flyLength: 0, pocketBagDepth: -1, pocketDrop: -0.5 };
    const resolved = resolveShortsOptions(options);
    expect(resolved.shortsInseam).toBe(0);
    expect(resolved.flyLength).toBe(0);
    expect(resolved.pocketBagDepth).toBe(-1);
    expect(resolved.pocketDrop).toBe(-0.5);
    const notes = shortsComponentGuidance(draftShortsWithComponents(SHORTS_M, options), SHORTS_M, options);
    expect(notes.map((note) => note.field)).toEqual(expect.arrayContaining([
      "option-shortsInseam", "option-flyLength", "option-pocketBagDepth", "option-pocketDrop",
    ]));
  });

  it("reports option-range, waist-rise, fly-rise, pocket-rise, and hem collisions", () => {
    const options = {
      waistbandDepth: 40,
      flyLength: 100,
      pocketOpening: 30,
      pocketAngle: 80,
      pocketBagDepth: 35,
      pocketDrop: 35,
    };
    const drafted = draftShortsWithComponents(SHORTS_M, options);
    const notes = shortsComponentGuidance(drafted, SHORTS_M, options);
    const fields = notes.map((note) => note.field);
    expect(fields).toContain("option-waistbandDepth");
    expect(fields).toContain("option-flyLength");
    expect(fields).toContain("option-pocketOpening");
    expect(fields).toContain("option-pocketAngle");
    expect(fields).toContain("option-pocketDrop");
    expect(fields).toContain("option-pocketBagDepth");
    expect(notes.some((note) => note.text.includes("front rise"))).toBe(true);
    expect(notes.some((note) => note.text.includes("hem turn"))).toBe(true);
  });

  it("keeps non-finite raw inputs and skips arithmetic guidance that cannot be computed", () => {
    const options = {
      flyLength: Number.NaN,
      pocketOpening: Number.POSITIVE_INFINITY,
      pocketAngle: Number.NaN,
      pocketBagDepth: Number.NaN,
    };
    const resolved = resolveShortsOptions(options);
    expect(Number.isNaN(resolved.flyLength)).toBe(true);
    expect(resolved.pocketOpening).toBe(Number.POSITIVE_INFINITY);
    expect(Number.isNaN(resolved.pocketBagDepth)).toBe(true);
    const notes = shortsComponentGuidance(draftShortsWithComponents(SHORTS_M, options), SHORTS_M, options);
    expect(notes.map((note) => note.field)).toEqual(expect.arrayContaining([
      "option-flyLength", "option-pocketOpening", "option-pocketAngle", "option-pocketBagDepth",
    ]));
  });

  it("reports an opening start outside the panel and computes no larger valid opening", () => {
    const options = { pocketDrop: 200, pocketOpening: 8 };
    const notes = shortsComponentGuidance(
      draftShortsWithComponents(SHORTS_M, options),
      SHORTS_M,
      options,
    );
    expect(notes.some((note) => note.field === "option-pocketOpening")).toBe(true);
  });

  it("computes a shorter opening when its start is valid but the end crosses center front", () => {
    const options = { pocketOpening: 30, pocketAngle: 35 };
    const notes = shortsComponentGuidance(
      draftShortsWithComponents(SHORTS_M, options),
      SHORTS_M,
      options,
    );
    expect(notes.some((note) => note.field === "option-pocketOpening" && /reduce it to at most|computed maximum/.test(note.text))).toBe(true);
  });

  it("handles a horizontal side segment and a missing front role without repairing either block", () => {
    const drafted = draftShortsWithComponents(SHORTS_M);
    const front = rolePiece(drafted, "frontLeft");
    const horizontalSide = front.edges.map((edge) => edge.name === "sideUpper"
      ? { kind: "line" as const, name: edge.name, start: point(8, 2), end: point(25, 2) }
      : edge);
    const changed = {
      ...drafted,
      roles: { ...drafted.roles, frontLeft: { ...front, edges: horizontalSide } },
    };
    const horizontalNotes = shortsComponentGuidance(changed, SHORTS_M);
    expect(horizontalNotes.some((note) => note.field === "option-pocketOpening")).toBe(true);

    const missingFront = block({}, []);
    expect(shortsComponentGuidance(missingFront, SHORTS_M).map((note) => note.field)).toContain("recipe-shorts");
  });
});
