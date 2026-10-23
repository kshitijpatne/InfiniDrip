import { describe, expect, it } from "vitest";
import { edgeLength, pieceEdge } from "./piece";
import { blockPieces, rolePiece } from "./block";
import { STANDARD_M } from "./measurements";
import { interfaceLength, stitchChecks } from "./stitch";
import {
  JOGGER_DEFAULT_OPTIONS,
  JOGGER_FIELDS,
  JOGGER_OPTION_DEFINITIONS,
  resolveJoggerOptions,
  type JoggerOptions,
} from "./jogger-contract";
import { draftJogger } from "./jogger";
import { draftTrouserLegs } from "./trouser";

describe("Jogger draft core", () => {
  it("declares the existing lower-body field contract and packeted digital seeds", () => {
    expect(JOGGER_FIELDS).toEqual([
      "waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease",
    ]);
    expect(JOGGER_OPTION_DEFINITIONS.map(({ id, defaultValue }) => [id, defaultValue])).toEqual([
      ["frontRiseEase", 1], ["backRiseEase", 9], ["waistbandDepth", 5.5], ["thighEase", 8],
      ["kneeEase", 5], ["legOpening", 40], ["elasticWidth", 3.8], ["pocketOpening", 16],
      ["pocketAngle", 58], ["pocketBagDepth", 23], ["pocketDrop", 2], ["drawcordLength", 120],
      ["drawcordCutWidth", 3], ["drawcordExitSpacing", 4], ["drawcordExit", 1],
    ]);
    expect(resolveJoggerOptions()).toEqual(JOGGER_DEFAULT_OPTIONS);
  });

  it("drafts the full-length panels, separate casing, paired pockets, and matching seam paths", () => {
    const drafted = draftJogger(STANDARD_M);
    expect(Object.keys(drafted.roles)).toEqual([
      "frontLeft", "frontRight", "backLeft", "backRight", "waistband", "pocketBagLeft", "pocketBagRight",
    ]);
    expect(blockPieces(drafted).some((piece) => /fly/i.test(piece.name))).toBe(false);
    for (const role of ["frontLeft", "frontRight", "backLeft", "backRight"]) {
      const leg = rolePiece(drafted, role);
      expect(leg.onFold).toBe(false);
      expect(pieceEdge(leg, "hem").kind).toBe("line");
      expect(edgeLength(pieceEdge(leg, "hem"))).toBeCloseTo(10);
      expect(leg.edges.some((edge) => edge.name === "centerFront" || edge.name === "centerBack")).toBe(true);
    }
    expect(rolePiece(drafted, "waistband").onFold).toBe(false);
    expect(edgeLength(pieceEdge(rolePiece(drafted, "waistband"), "bottom"))).toBeCloseTo(STANDARD_M.waist + STANDARD_M.ease);
    expect(rolePiece(drafted, "frontLeft").marks?.filter((mark) => mark.name === "pocketOpening")).toHaveLength(1);
    expect(rolePiece(drafted, "frontRight").marks?.filter((mark) => mark.name === "pocketOpening")).toHaveLength(1);
    const exits = rolePiece(drafted, "waistband").marks?.filter((mark) => mark.kind === "buttonhole") ?? [];
    expect(exits).toHaveLength(2);
    expect(exits[0] && "at" in exits[0] ? exits[0].at.x : NaN).toBeCloseTo((STANDARD_M.waist + STANDARD_M.ease) / 2 - 2);
    expect(exits[1] && "at" in exits[1] ? exits[1].at.x : NaN).toBeCloseTo((STANDARD_M.waist + STANDARD_M.ease) / 2 + 2);
    expect(rolePiece(drafted, "waistband").marks?.some((mark) => mark.name === "drawcordRetention")).toBe(true);

    expect(drafted.stitches).toHaveLength(8);
    expect(stitchChecks(drafted, drafted.stitches).every((result) => result.ok)).toBe(true);
    for (const seam of drafted.stitches) {
      expect(interfaceLength(drafted, seam.a)).toBeCloseTo(interfaceLength(drafted, seam.b), 6);
    }
  });

  it("keeps the shipped full-length lower-body station geometry for default jogger legs", () => {
    const trouserOptions = { ...JOGGER_DEFAULT_OPTIONS, flyLength: 0 };
    const trouserLegs = draftTrouserLegs(STANDARD_M, trouserOptions);
    const jogger = draftJogger(STANDARD_M);
    for (const role of ["frontLeft", "frontRight", "backLeft", "backRight"]) {
      const joggerLeg = rolePiece(jogger, role);
      const trouserLeg = rolePiece(trouserLegs, role);
      expect(joggerLeg.edges).toEqual(trouserLeg.edges);
      const joggerMarks = (joggerLeg.marks ?? []).filter((mark) => mark.name !== "pocketOpening" && mark.name !== "pocketOpeningStart");
      expect(joggerMarks.map((mark) => mark.name)).toEqual(trouserLeg.marks?.map((mark) => mark.name));
      expect(joggerMarks.map(({ label: _label, ...mark }) => mark))
        .toEqual(trouserLeg.marks?.map(({ label: _label, ...mark }) => mark));
    }
  });

  it("uses custom dimensions and positions the optional exits", () => {
    const custom: JoggerOptions = {
      frontRiseEase: 2,
      backRiseEase: 11,
      waistbandDepth: 6,
      thighEase: 10,
      kneeEase: 6,
      legOpening: 44,
      elasticWidth: 4,
      pocketOpening: 18,
      pocketAngle: 50,
      pocketBagDepth: 24,
      pocketDrop: 3,
      drawcordLength: 132,
      drawcordCutWidth: 4,
      drawcordExitSpacing: 6,
      drawcordExit: 1,
    };
    expect(resolveJoggerOptions(custom)).toEqual(custom);
    const drafted = draftJogger(STANDARD_M, custom);
    expect(edgeLength(pieceEdge(rolePiece(drafted, "frontLeft"), "hem"))).toBeCloseTo(11);
    const endRight = pieceEdge(rolePiece(drafted, "waistband"), "endRight");
    expect(endRight.kind).toBe("line");
    expect(endRight.kind === "line" ? endRight.end.y : NaN).toBe(6);
    const casingMarks = rolePiece(drafted, "waistband").marks ?? [];
    const customExits = casingMarks.filter((mark) => mark.kind === "buttonhole");
    expect(customExits).toHaveLength(2);
    expect(customExits[0] && "at" in customExits[0] ? customExits[1] && "at" in customExits[1] ? customExits[1].at.x - customExits[0].at.x : NaN : NaN).toBe(6);
    const elasticTop = casingMarks.find((mark) => mark.name === "elasticChannelTop");
    const elasticBottom = casingMarks.find((mark) => mark.name === "elasticChannelBottom");
    const cordTop = casingMarks.find((mark) => mark.name === "drawcordChannelTop");
    const cordBottom = casingMarks.find((mark) => mark.name === "drawcordChannelBottom");
    expect(elasticTop && "start" in elasticTop ? elasticTop.start.y : NaN).toBeCloseTo(0.2);
    expect(elasticBottom && "start" in elasticBottom ? elasticBottom.start.y : NaN).toBeCloseTo(4.2);
    expect(cordTop && "start" in cordTop ? cordTop.start.y : NaN).toBeCloseTo(4.8);
    expect(cordBottom && "start" in cordBottom ? cordBottom.start.y : NaN).toBeCloseTo(5.8);
    const pocketMark = rolePiece(drafted, "frontLeft").marks?.find((mark) => mark.name === "pocketOpening");
    expect(pocketMark && "start" in pocketMark ? pocketMark.start.y : NaN).toBe(3);
    expect(edgeLength(pieceEdge(rolePiece(drafted, "pocketBagLeft"), "bagLower"))).toBeCloseTo(24);
    const frontRise = pieceEdge(rolePiece(drafted, "frontLeft"), "centerFront");
    const backRise = pieceEdge(rolePiece(drafted, "backLeft"), "centerBack");
    expect(frontRise.kind === "line" ? frontRise.start.y : NaN).toBeCloseTo(STANDARD_M.crotchDepth + 2 - 6);
    expect(backRise.kind === "line" ? backRise.start.y : NaN).toBeCloseTo(STANDARD_M.crotchDepth + 11 - 6);
    expect(stitchChecks(drafted, drafted.stitches).every((result) => result.ok)).toBe(true);
  });

  it("omits the drawcord marks when the user disables the exits", () => {
    const drafted = draftJogger(STANDARD_M, { drawcordExit: 0 });
    const marks = rolePiece(drafted, "waistband").marks ?? [];
    expect(marks.some((mark) => mark.kind === "buttonhole")).toBe(false);
    expect(marks.some((mark) => mark.name === "drawcordRetention")).toBe(false);
    expect(marks.some((mark) => mark.name === "elasticChannelTop")).toBe(true);
    expect(stitchChecks(drafted, drafted.stitches).every((result) => result.ok)).toBe(true);
  });

  it("preserves raw invalid option values instead of clamping them", () => {
    const invalid = resolveJoggerOptions({
      waistbandDepth: -1,
      elasticWidth: Number.NaN,
      drawcordCutWidth: -4,
      drawcordExitSpacing: Number.POSITIVE_INFINITY,
      drawcordExit: 2,
      legOpening: 0,
    });
    expect(invalid.waistbandDepth).toBe(-1);
    expect(Number.isNaN(invalid.elasticWidth)).toBe(true);
    expect(invalid.drawcordCutWidth).toBe(-4);
    expect(invalid.drawcordExitSpacing).toBe(Number.POSITIVE_INFINITY);
    expect(invalid.drawcordExit).toBe(2);
    expect(invalid.legOpening).toBe(0);
    const drafted = draftJogger(STANDARD_M, { waistbandDepth: -1 });
    const waistband = rolePiece(drafted, "waistband");
    const bottom = pieceEdge(waistband, "bottom");
    expect(bottom.kind === "line" ? bottom.start.y : NaN).toBe(-1);
  });
});
