import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { renderBlueprint } from "../render/canvas";
import { blockPieces, rolePiece } from "./block";
import { edgeLength, pieceEdge, type Edge, type Piece } from "./piece";
import { interfaceLength, stitchChecks } from "./stitch";
import { DEFAULT_JEANS_OPTIONS, resolveJeansOptions, type JeansOptions } from "./jeans-contract";
import { draftJeansCore } from "./jeans";
import { gradeMeasurements } from "./grading";
import { STANDARD_M } from "./measurements";
import { TROUSER_GRADE } from "./trouser-tables";
import {
  buildJeansWaistband,
  JEANS_WAISTBAND_LOOP_CLEARANCE_CM,
  type JeansWaistbandInputs,
} from "./jeans-waistband";

const sizeCases = [
  { label: "XS", step: -2 },
  { label: "M", step: 0 },
  { label: "XL", step: 2 },
] as const;

function inputFromDraft(
  draft: ReturnType<typeof draftJeansCore>,
  options: JeansOptions = DEFAULT_JEANS_OPTIONS,
): JeansWaistbandInputs {
  return {
    frontLeft: rolePiece(draft, "frontLeft"),
    frontRight: rolePiece(draft, "frontRight"),
    pocketFacingLeft: rolePiece(draft, "pocketFacingLeft"),
    pocketFacingRight: rolePiece(draft, "pocketFacingRight"),
    backYokeLeft: rolePiece(draft, "backYokeLeft"),
    backYokeRight: rolePiece(draft, "backYokeRight"),
    coinPocket: rolePiece(draft, "coinPocket"),
    backPocketLeft: rolePiece(draft, "backPocketLeft"),
    backPocketRight: rolePiece(draft, "backPocketRight"),
    options,
  };
}

function replaceEdge(piece: Piece, name: string, replacement: Edge): Piece {
  return {
    ...piece,
    edges: piece.edges.map((edge) => edge.name === name ? replacement : edge),
  };
}

function withShortLeftBackSeam(input: JeansWaistbandInputs, length: number): JeansWaistbandInputs {
  const waist = pieceEdge(input.backYokeLeft, "waist");
  const centerBack = pieceEdge(input.backYokeLeft, "centerBackYoke");
  if (waist.kind !== "line" || centerBack.kind !== "line") throw new Error("Fixture waist edges must be lines.");
  const end = point(waist.start.x - length, waist.start.y);
  return {
    ...input,
    backYokeLeft: replaceEdge(
      replaceEdge(input.backYokeLeft, "waist", { ...waist, end }),
      "centerBackYoke",
      { ...centerBack, start: end },
    ),
  };
}

function baseInput(): JeansWaistbandInputs {
  return inputFromDraft(draftJeansCore(STANDARD_M));
}

describe("Jeans waistband and six belt loops", () => {
  it("walks the live front/back waist, closure extension, outer/inner top, and CB joins across XS–XL", () => {
    for (const { label, step } of sizeCases) {
      const measurements = gradeMeasurements(STANDARD_M, TROUSER_GRADE, step);
      const draft = draftJeansCore(measurements);
      const input = inputFromDraft(draft);
      const outerLeft = rolePiece(draft, "waistbandOuterLeft");
      const outerRight = rolePiece(draft, "waistbandOuterRight");
      const innerLeft = rolePiece(draft, "waistbandInnerLeft");
      const innerRight = rolePiece(draft, "waistbandInnerRight");

      expect(stitchChecks(draft, draft.stitches).filter(({ ok }) => !ok), `${label} seam walks`).toEqual([]);
      for (const [band, front, facing, back, yoke] of [
        [outerLeft, input.frontLeft, input.pocketFacingLeft, input.backYokeLeft, "left"],
        [outerRight, input.frontRight, input.pocketFacingRight, input.backYokeRight, "right"],
      ] as const) {
        expect(edgeLength(pieceEdge(band, "frontWaistSeam")), `${label} ${yoke} front walk`)
          .toBeCloseTo(edgeLength(pieceEdge(front, "waist")) + edgeLength(pieceEdge(facing, "waistFacing")), 9);
        expect(edgeLength(pieceEdge(band, "backWaistSeam")), `${label} ${yoke} back walk`)
          .toBeCloseTo(edgeLength(pieceEdge(back, "waist")), 9);
        expect(edgeLength(pieceEdge(band, "closureExtensionBottom")), `${label} ${yoke} CF extension`)
          .toBeCloseTo(input.options.waistbandExtension, 9);
      }
      expect(edgeLength(pieceEdge(outerLeft, "centerBackJoin"))).toBe(input.options.waistbandDepth);
      expect(edgeLength(pieceEdge(outerRight, "centerBackJoin"))).toBe(input.options.waistbandDepth);
      for (const [outer, inner] of [[outerLeft, innerLeft], [outerRight, innerRight]]) {
        for (const edgeName of ["frontTop", "backTop", "closureExtensionTop", "closureEnd"]) {
          expect(edgeLength(pieceEdge(outer, edgeName))).toBeCloseTo(edgeLength(pieceEdge(inner, edgeName)), 9);
        }
      }
      const topStitch = draft.stitches.find(({ label: name }) => name === "Left outer ↔ inner waistband top")!;
      expect(interfaceLength(draft, topStitch.a)).toBeCloseTo(interfaceLength(draft, topStitch.b), 9);
      expect(topStitch.a.edges.map((ref) => "edge" in ref ? ref.edge : ref.mark))
        .toEqual(["backTop", "frontTop", "closureExtensionTop"]);
      expect(topStitch.b.edges.map((ref) => "edge" in ref ? [ref.edge, ref.reversed] : [ref.mark, undefined])).toEqual([
        ["closureExtensionTop", true], ["frontTop", true], ["backTop", true],
      ]);
      expect(draft.stitches.find(({ label: name }) => name === "Center-back outer waistband join")!.b.edges[0])
        .toMatchObject({ reversed: true });

      const button = outerRight.marks?.find(({ name }) => name === "waistbandButton");
      const buttonhole = outerLeft.marks?.find(({ name }) => name === "waistbandButtonholeCenter");
      const buttonholeAxis = outerLeft.marks?.find(({ name }) => name === "waistbandButtonholeOrientationOnly");
      expect(button?.kind).toBe("button");
      expect(buttonhole?.kind).toBe("buttonhole");
      expect(buttonholeAxis?.kind).toBe("placementLine");
      if (!buttonholeAxis || !("start" in buttonholeAxis)) throw new Error("Buttonhole orientation cue must be a line.");
      expect(edgeLength({ kind: "line", name: "axis", start: buttonholeAxis.start, end: buttonholeAxis.end }))
        .toBe(1);
      expect(buttonholeAxis.label).toBe("axis only");
      expect(outerLeft.edges.some(({ name }) => name.toLowerCase().includes("buttonhole"))).toBe(false);

      for (const [side, band, front, facing, backYoke] of [
        ["left", outerLeft, input.frontLeft, input.pocketFacingLeft, input.backYokeLeft],
        ["right", outerRight, input.frontRight, input.pocketFacingRight, input.backYokeRight],
      ] as const) {
        const coreLength = edgeLength(pieceEdge(front, "waist"));
        const frontMark = band.marks?.find(({ name }) => name === "beltLoop-front-upper");
        const sideMark = band.marks?.find(({ name }) => name === "beltLoop-side-upper");
        const rearMark = band.marks?.find(({ name }) => name === "beltLoop-rear-upper");
        if (!frontMark || !("start" in frontMark) || !sideMark || !("start" in sideMark) || !rearMark || !("start" in rearMark)) {
          throw new Error(`${side} waistband loop anchor pairs are missing.`);
        }
        expect(frontMark.start.x - coreLength, `${label} ${side} pocket-waist clearance`)
          .toBeCloseTo(JEANS_WAISTBAND_LOOP_CLEARANCE_CM, 9);
        const frontLength = coreLength + edgeLength(pieceEdge(facing, "waistFacing"));
        expect(sideMark.start.x + DEFAULT_JEANS_OPTIONS.beltLoopWidth / 2 - frontLength)
          .toBeCloseTo(3.8, 9);
        const rearCenter = rearMark.start.x + DEFAULT_JEANS_OPTIONS.beltLoopWidth / 2;
        const totalLength = frontLength + edgeLength(pieceEdge(backYoke, "waist"));
        expect(totalLength - rearCenter).toBeCloseTo(2, 9);
        expect(rearMark.start.y).toBe(-DEFAULT_JEANS_OPTIONS.waistbandDepth);
        const frontLower = band.marks?.find(({ name }) => name === "beltLoop-front-lower");
        expect(frontLower && "start" in frontLower ? frontLower.start.y : undefined).toBe(0);
      }
      expect([outerLeft, outerRight].reduce((sum, band) => sum +
        (band.marks?.filter(({ name }) => name.startsWith("beltLoop-") && name.endsWith("-upper")).length ?? 0), 0))
        .toBe(6);
      for (const band of [outerLeft, outerRight]) {
        for (const loop of ["front", "side", "rear"]) {
          const upper = band.marks?.find(({ name }) => name === `beltLoop-${loop}-upper`);
          const lower = band.marks?.find(({ name }) => name === `beltLoop-${loop}-lower`);
          if (!upper || !("start" in upper) || !lower || !("start" in lower)) {
            throw new Error(`${loop} loop must have upper and lower placement anchors.`);
          }
          expect(upper.start.x).toBe(lower.start.x);
          expect(upper.end.x).toBe(lower.end.x);
          expect(upper.start.y).toBe(-input.options.waistbandDepth);
          expect(lower.start.y).toBe(0);
        }
      }
      expect(input.coinPocket.edges.some(({ name }) => name === "pocketTop")).toBe(true);
      expect(renderBlueprint(blockPieces(draft), { allowances: { default: 0 } })).toContain("JEANS BELT-LOOP STRIP");
    }
  });

  it("keeps the adjustable controls live at their supported endpoints", () => {
    const input = baseInput();
    for (const patch of [
      { waistbandDepth: 2, waistbandExtension: 1, beltLoopWidth: 0.5 },
      { waistbandDepth: 8, waistbandExtension: 3, beltLoopWidth: 1.5 },
    ]) {
      const options = resolveJeansOptions(patch);
      const pieces = buildJeansWaistband({ ...input, options });
      expect(edgeLength(pieceEdge(pieces.outerLeft, "centerBackJoin"))).toBe(options.waistbandDepth);
      expect(edgeLength(pieceEdge(pieces.outerRight, "closureExtensionBottom"))).toBe(options.waistbandExtension);
      expect(edgeLength(pieceEdge(pieces.beltLoopStrip, "stripStart"))).toBeCloseTo(options.beltLoopWidth * 3, 9);
      expect(edgeLength(pieceEdge(pieces.beltLoopStrip, "stripOuter")))
        .toBeCloseTo((options.waistbandDepth + 2) * 6, 9);
      expect(pieces.beltLoopStrip.marks?.filter(({ kind }) => kind === "cutLine")).toHaveLength(5);
      expect(pieces.beltLoopStrip.marks?.filter(({ kind }) => kind === "foldLine")).toHaveLength(2);
    }
  });

  it("rejects every invalid raw waistband control without replacing it", () => {
    const input = baseInput();
    const invalidCases = [
      ["waistbandDepth", 1.5, /waistbandDepth must be a finite value from 2 to 8 cm/],
      ["waistbandDepth", 8.5, /waistbandDepth must be a finite value from 2 to 8 cm/],
      ["waistbandDepth", Number.NaN, /waistbandDepth must be a finite value from 2 to 8 cm; received NaN/],
      ["waistbandExtension", 0.5, /waistbandExtension must be a finite value from 1 to 3 cm/],
      ["waistbandExtension", 3.5, /waistbandExtension must be a finite value from 1 to 3 cm/],
      ["waistbandExtension", Number.POSITIVE_INFINITY, /waistbandExtension must be a finite value from 1 to 3 cm/],
      ["beltLoopWidth", 0.25, /beltLoopWidth must be a finite value from 0.5 to 1.5 cm/],
      ["beltLoopWidth", 1.75, /beltLoopWidth must be a finite value from 0.5 to 1.5 cm/],
      ["beltLoopWidth", Number.NEGATIVE_INFINITY, /beltLoopWidth must be a finite value from 0.5 to 1.5 cm/],
    ] as const;
    for (const [field, value, message] of invalidCases) {
      const options = { ...input.options, [field]: value } as JeansOptions;
      expect(() => buildJeansWaistband({ ...input, options })).toThrow(message);
    }
    expect(resolveJeansOptions({ beltLoopWidth: 1.75 }).beltLoopWidth).toBe(1.75);
  });

  it("rejects invalid live waist topology and non-finite coordinates with field-specific corrections", () => {
    const input = baseInput();
    const frontWaist = pieceEdge(input.frontLeft, "waist");
    const opening = pieceEdge(input.frontLeft, "pocketOpening");
    if (frontWaist.kind !== "line" || opening.kind !== "curve") throw new Error("Expected the standard Jeans waist fixture.");

    expect(() => buildJeansWaistband({
      ...input,
      frontLeft: replaceEdge(input.frontLeft, "waist", { ...opening, name: "waist" }),
    })).toThrow(/requires jeans front left "waist" to be a straight edge/);
    expect(() => buildJeansWaistband({
      ...input,
      frontLeft: replaceEdge(input.frontLeft, "pocketOpening", { ...frontWaist, name: "pocketOpening" }),
    })).toThrow(/requires jeans front left "pocketOpening" to be a curved pocket edge/);
    expect(() => buildJeansWaistband({
      ...input,
      frontLeft: replaceEdge(input.frontLeft, "waist", { ...frontWaist, end: point(Number.NaN, 0) }),
    })).toThrow(/cannot resolve a finite wearer-left front waist and pocket opening/);
    expect(() => buildJeansWaistband({
      ...input,
      frontLeft: replaceEdge(input.frontLeft, "waist", { ...frontWaist, end: point(frontWaist.end.x + 0.25, 0) }),
    })).toThrow(/wearer-left front waist and pocket opening do not meet/);

    const nonFiniteCurve = {
      ...opening,
      curve: { ...opening.curve, control2: point(opening.curve.control2.x, Number.NaN) },
    };
    expect(() => buildJeansWaistband({
      ...input,
      frontLeft: replaceEdge(input.frontLeft, "pocketOpening", nonFiniteCurve),
    })).toThrow(/cannot place the wearer-left front loop from a non-finite pocket curve/);

    expect(() => buildJeansWaistband({
      ...input,
      frontLeft: replaceEdge(input.frontLeft, "waist", { ...frontWaist, start: point(Number.POSITIVE_INFINITY, 0) }),
    })).toThrow(/requires finite wearer-left front waist edge/);
    expect(() => buildJeansWaistband({
      ...input,
      frontLeft: replaceEdge(input.frontLeft, "waist", { ...frontWaist, start: frontWaist.end }),
    })).toThrow(/requires a positive wearer-left front waist edge/);

    const facingWaist = pieceEdge(input.pocketFacingLeft, "waistFacing");
    if (facingWaist.kind !== "line") throw new Error("Expected a straight facing waist.");
    expect(() => buildJeansWaistband({
      ...input,
      pocketFacingLeft: replaceEdge(input.pocketFacingLeft, "waistFacing", {
        ...facingWaist,
        end: point(Number.NaN, facingWaist.end.y),
      }),
    })).toThrow(/cannot resolve a finite wearer-left facing waist and side seam/);
    expect(() => buildJeansWaistband({
      ...input,
      pocketFacingLeft: replaceEdge(input.pocketFacingLeft, "waistFacing", {
        ...facingWaist,
        end: point(facingWaist.end.x + 0.25, facingWaist.end.y),
      }),
    })).toThrow(/wearer-left facing waist and side seam do not meet/);
  });

  it("enforces pocket and neighboring-loop clearances without silently moving placements", () => {
    const input = baseInput();
    const coinTop = pieceEdge(input.coinPocket, "pocketTop");
    if (coinTop.kind !== "line") throw new Error("Expected a straight coin-pocket top.");
    expect(() => buildJeansWaistband({
      ...input,
      coinPocket: replaceEdge(input.coinPocket, "pocketTop", {
        ...coinTop,
        start: point(coinTop.start.x, 0.5),
        end: point(coinTop.end.x, 0.5),
      }),
    })).toThrow(/must remain at least 1 cm below the live waist/);
    const backPocketTop = pieceEdge(input.backPocketRight, "pocketTop");
    if (backPocketTop.kind !== "line") throw new Error("Expected a straight back-pocket top.");
    const nonFiniteBackPocket = {
      ...input,
      backPocketRight: replaceEdge(input.backPocketRight, "pocketTop", {
        ...backPocketTop,
        start: point(Number.NaN, 20),
      }),
    };
    expect(() => buildJeansWaistband(nonFiniteBackPocket)).not.toThrow();
    expect((pieceEdge(nonFiniteBackPocket.backPocketRight, "pocketTop") as Extract<Edge, { kind: "line" }>).start.x)
      .toBeNaN();

    const facingWaist = pieceEdge(input.pocketFacingLeft, "waistFacing");
    const backWaist = pieceEdge(input.backYokeLeft, "waist");
    if (facingWaist.kind !== "line" || backWaist.kind !== "line") throw new Error("Expected straight fixture waists.");
    const shortSide = point(facingWaist.start.x + 0.5, facingWaist.start.y);
    const shortInput: JeansWaistbandInputs = {
      ...input,
      pocketFacingLeft: replaceEdge(input.pocketFacingLeft, "waistFacing", { ...facingWaist, end: shortSide }),
      backYokeLeft: replaceEdge(input.backYokeLeft, "waist", { ...backWaist, start: shortSide }),
    };
    expect(() => buildJeansWaistband(shortInput)).toThrow(/leaves less than 1 cm from the left front pocket-waist intersection/);

    expect(() => buildJeansWaistband(withShortLeftBackSeam(input, 4)))
      .toThrow(/puts the left side loop outside the live waistband/);
    expect(() => buildJeansWaistband(withShortLeftBackSeam(input, 5)))
      .toThrow(/side and rear loops leave less than 1 cm between their full footprints/);
  });
});
