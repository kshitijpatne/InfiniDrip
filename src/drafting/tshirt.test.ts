import { describe, it, expect } from "vitest";
import { distance } from "../geometry";
import { STANDARD_M } from "./measurements";
import { edgeStart, edgeEnd, edgeLength, pieceEdge, type Piece } from "./piece";
import {
  draftFront,
  draftBack,
  draftSleeve,
  draftTshirt,
  armholeLength,
  isTeeVNeckActive,
  isTeeScoopNeckActive,
  hasConflictingTeeNecklineOptions,
  teeFrontNecklineParams,
  teeNecklineNotes,
  teeScoopNeckNotes,
  teeVNeckNotes,
  fittedScoopNeckbandTemplateSvg,
  teeNeckbandTemplateSvg,
  teeVNeckbandTemplateSvg,
  TEE_SCOOP_NECK_DROP_OPTION_ID,
  TEE_V_NECK_DROP_OPTION_ID,
} from "./tshirt";
import { rolePiece } from "./block";
import { draftFitted, FITTED_SCOOP_ENTRY_ID, FITTED_VNECK_ENTRY_ID } from "./fitted";

describe("draftFront", () => {
  const front = draftFront(STANDARD_M);
  it("is a half-piece on the fold", () => {
    expect(front.onFold).toBe(true);
  });
  it("places the underarm at the chest-panel width and armhole depth", () => {
    const side = pieceEdge(front, "side"); // side seam starts at the underarm
    expect(edgeStart(side)).toEqual({ x: 27.5, y: 24 });
  });
  it("runs the hem across to the fold and up the centre front", () => {
    expect(edgeEnd(pieceEdge(front, "hem"))).toEqual({ x: 0, y: 70 });
    expect(edgeEnd(pieceEdge(front, "centerFront"))).toEqual({ x: 0, y: 8 });
  });
  it("has an armhole that curves (longer than the straight chord)", () => {
    const armhole = pieceEdge(front, "armhole");
    const chord = distance(edgeStart(armhole), edgeEnd(armhole));
    expect(edgeLength(armhole)).toBeGreaterThan(chord);
  });
});

describe("draftBack", () => {
  it("has a shallower neckline than the front", () => {
    const back = draftBack(STANDARD_M);
    expect(edgeStart(pieceEdge(back, "neckline"))).toEqual({ x: 0, y: 2.5 });
    expect(edgeEnd(pieceEdge(back, "centerBack"))).toEqual({ x: 0, y: 2.5 });
  });
});

describe("draftSleeve", () => {
  const sleeve = draftSleeve(STANDARD_M);
  it("is a full piece (not on a fold)", () => {
    expect(sleeve.onFold).toBe(false);
  });
  it("peaks at the cap top, centred on the sleeve width", () => {
    // width = bicep 38 + ease/2 (5) = 43, so the cap top sits at x = 21.5
    expect(edgeEnd(pieceEdge(sleeve, "capLeft"))).toEqual({ x: 21.5, y: 0 });
  });
  it("has a hem narrower than the bicep line", () => {
    expect(edgeLength(pieceEdge(sleeve, "hem"))).toBeCloseTo(37); // 43 - 2*3 taper
  });
});

describe("sleeve cap fitting", () => {
  it("fits the cap length to the armhole plus a small ease", () => {
    const block = draftTshirt(STANDARD_M);
    const cap = edgeLength(pieceEdge(rolePiece(block, "sleeve"), "capLeft")) +
                edgeLength(pieceEdge(rolePiece(block, "sleeve"), "capRight"));
    const diff = cap - armholeLength(STANDARD_M);
    expect(diff).toBeGreaterThan(0); // cap eased slightly longer
    expect(diff).toBeLessThan(3);    // but not by much
  });
});

describe("draftTshirt", () => {
  it("returns front, back, and sleeve", () => {
    const block = draftTshirt(STANDARD_M);
    expect([rolePiece(block, "front").name, rolePiece(block, "back").name, rolePiece(block, "sleeve").name])
      .toEqual(["front", "back", "sleeve"]);
  });
});

describe("Tee V-neck option", () => {
  it("uses option presence to select the front V while retaining crew defaults", () => {
    expect(isTeeVNeckActive({})).toBe(false);
    expect(isTeeVNeckActive({ [TEE_V_NECK_DROP_OPTION_ID]: 0 })).toBe(true);
    expect(teeFrontNecklineParams()).toEqual({ shape: "crew", widthEase: 0, frontDrop: 0 });
    expect(teeFrontNecklineParams({ [TEE_V_NECK_DROP_OPTION_ID]: 6.5 }))
      .toEqual({ shape: "v", widthEase: 0, frontDrop: 6.5 });
  });

  it("maps V-neck underarm and shoulder warnings to actionable controls without changing the value", () => {
    const active = { [TEE_V_NECK_DROP_OPTION_ID]: 15 };
    expect(teeVNeckNotes(STANDARD_M, {})).toEqual([]);
    expect(teeVNeckNotes(STANDARD_M, { [TEE_V_NECK_DROP_OPTION_ID]: 5 })).toEqual([]);

    const notes = teeVNeckNotes({ ...STANDARD_M, armholeDepth: 12, shoulderWidth: 14 }, active);
    expect(notes).toHaveLength(2);
    expect(notes[0]).toMatchObject({
      field: "option-teeVNeckDropCm",
      level: "warn",
      text: "The front V drops below the underarm; reduce the V drop or increase armhole depth.",
    });
    expect(notes[1]).toMatchObject({
      field: "shoulderWidth",
      level: "warn",
      text: "The front V reaches the shoulder seam; review the shoulder width or neckline placement.",
    });
    expect(active[TEE_V_NECK_DROP_OPTION_ID]).toBe(15);
  });
});

describe("Tee Scoop-neck option", () => {
  it("selects the rounded front scoop by option presence and preserves the crew default", () => {
    expect(isTeeScoopNeckActive({})).toBe(false);
    expect(isTeeScoopNeckActive({ [TEE_SCOOP_NECK_DROP_OPTION_ID]: 0 })).toBe(true);
    expect(teeFrontNecklineParams()).toEqual({ shape: "crew", widthEase: 0, frontDrop: 0 });
    expect(teeFrontNecklineParams({ [TEE_SCOOP_NECK_DROP_OPTION_ID]: 5 }))
      .toEqual({ shape: "scoop", widthEase: 0, frontDrop: 5 });
  });

  it("maps Scoop underarm and shoulder warnings to the active depth control without changing its value", () => {
    const active = { [TEE_SCOOP_NECK_DROP_OPTION_ID]: 15 };
    expect(teeScoopNeckNotes(STANDARD_M, {})).toEqual([]);
    expect(teeScoopNeckNotes(STANDARD_M, { [TEE_SCOOP_NECK_DROP_OPTION_ID]: 5 })).toEqual([]);
    const notes = teeScoopNeckNotes({ ...STANDARD_M, armholeDepth: 12, shoulderWidth: 14 }, active);
    expect(notes).toHaveLength(2);
    expect(notes[0]).toMatchObject({
      field: "option-teeScoopNeckDropCm",
      level: "warn",
      text: "The front Scoop drops below the underarm; reduce its extra depth or increase armhole depth.",
    });
    expect(notes[1]).toMatchObject({
      field: "shoulderWidth",
      level: "warn",
      text: "The front Scoop reaches the shoulder seam; review shoulder width or neckline placement.",
    });
    expect(active[TEE_SCOOP_NECK_DROP_OPTION_ID]).toBe(15);
  });

  it("marks simultaneous V and Scoop options as a conflict and explicitly uses crew until one is reset", () => {
    const conflicting = {
      [TEE_V_NECK_DROP_OPTION_ID]: 7,
      [TEE_SCOOP_NECK_DROP_OPTION_ID]: 5,
    };
    expect(hasConflictingTeeNecklineOptions(conflicting)).toBe(true);
    expect(teeFrontNecklineParams(conflicting)).toEqual({ shape: "crew", widthEase: 0, frontDrop: 0 });
    expect(teeNecklineNotes(STANDARD_M, conflicting)).toEqual([
      {
        field: "option-teeVNeckDropCm",
        level: "warn",
        text: "Both V and Scoop neckline options are active. Reset one option; while they conflict, the preview uses crew. Both entered values are preserved.",
      },
      {
        field: "option-teeScoopNeckDropCm",
        level: "warn",
        text: "Both V and Scoop neckline options are active. Reset one option; while they conflict, the preview uses crew. Both entered values are preserved.",
      },
    ]);
    expect(conflicting).toEqual({ teeVNeckDropCm: 7, teeScoopNeckDropCm: 5 });
    expect(teeNecklineNotes(STANDARD_M, { [TEE_SCOOP_NECK_DROP_OPTION_ID]: 5 })).toHaveLength(0);
  });
});

describe("Tee V-neck band template", () => {
  const vBlock = draftTshirt(STANDARD_M, { [TEE_V_NECK_DROP_OPTION_ID]: 5 });
  const front = rolePiece(vBlock, "front");
  const back = rolePiece(vBlock, "back");
  const pieces = [front, back];
  const template = (sourcePieces: readonly Piece[] = pieces, lengthPercent = 75, finishedWidthCm = 2) =>
    teeVNeckbandTemplateSvg(sourcePieces, lengthPercent, finishedWidthCm);
  const linePiece = (name: string, start: { x: number; y: number }, end: { x: number; y: number }): Piece => ({
    name,
    onFold: name === "front",
    edges: [{ kind: "line", name: "neckline", start, end }],
  });

  it("derives a selected-size band, V join, and registration marks from the active front V and crew back", () => {
    const svg = template();
    const measured = 2 * (edgeLength(pieceEdge(front, "neckline")) + edgeLength(pieceEdge(back, "neckline")));
    const circumference = Number(svg.match(/data-neckline-circumference-cm="([^"]+)"/)?.[1]);
    const target = Number(svg.match(/data-loop-seamline-cm="([^"]+)"/)?.[1]);
    const registrations = [...svg.matchAll(/data-registration="([^"]+)"/g)].map((match) => match[1]);

    expect(circumference).toBeCloseTo(measured, 3);
    expect(target).toBeCloseTo(measured * 0.75, 3);
    expect(svg).toContain('data-finished-width-cm="2"');
    expect(svg).toContain('data-front-v-drop-cm="');
    expect(svg).toContain('data-v-forming-join="start" data-center-front="true"');
    expect(svg).toContain('data-v-forming-join="end" data-center-front="true"');
    expect(svg).toContain('data-registration-type="center-front"');
    expect(svg).toContain('data-registration-type="shoulder"');
    expect(svg).toContain('data-registration-type="center-back"');
    expect(registrations).toEqual([
      "center-front-start", "shoulder-front", "center-back", "shoulder-back", "center-front-end",
    ]);
    expect(svg).toContain('data-fold-line="true"');
    expect(svg).toContain('data-neckline-seamline="true"');
    expect(svg).toContain('data-calibration-length-cm="10"');
    expect(svg).toContain("1 cm end allowance");
    expect(svg).toContain("digital software choices");
    expect(svg).toContain("physical fit/material behavior unvalidated");
    expect(svg).toContain('data-garment-v-neckline="true"');
    expect(svg).toContain('data-v-join-diagram="true"');
    expect(svg).not.toMatch(/rib|maximum stretch|recovery recommendation/i);
  });

  it("labels the selected-size Fitted V-band and uses the Fitted front piece role", () => {
    const fittedBlock = draftFitted(STANDARD_M, {
      [TEE_V_NECK_DROP_OPTION_ID]: 5,
      dartIntake: 4,
      bustApexHorizontal: 55,
      bustApexVertical: 28,
    });
    const fittedPieces = [rolePiece(fittedBlock, "front"), rolePiece(fittedBlock, "back")];
    const svg = teeVNeckbandTemplateSvg(fittedPieces, 75, 2, "Fitted Tee");

    expect(FITTED_VNECK_ENTRY_ID).toBe("fitted-vneck-tee-digital-v1");
    expect(fittedPieces[0]!.name).toBe("fitted front");
    expect(svg).toContain("Fitted Tee V-neck band provisional cutting template");
    expect(svg).toContain("Fitted Tee V-NECK BAND — PROVISIONAL TEMPLATE · SELECTED SIZE");
    expect(svg).toContain("FITTED TEE FRONT V REFERENCE · SCHEMATIC");
  });

  it("builds a Fitted Scoop rectangle from the renamed front and preserves Tee output", () => {
    const fittedBlock = draftFitted(STANDARD_M, {
      [TEE_SCOOP_NECK_DROP_OPTION_ID]: 5,
      dartIntake: 4,
      bustApexHorizontal: 55,
      bustApexVertical: 28,
    });
    const fittedPieces = [rolePiece(fittedBlock, "front"), rolePiece(fittedBlock, "back")];
    const teeNamedPieces = fittedPieces.map((piece) => piece.name === "fitted front"
      ? { ...piece, name: "front" }
      : piece);
    const teeOutput = teeNeckbandTemplateSvg(teeNamedPieces, 75, 2);
    const fittedOutput = fittedScoopNeckbandTemplateSvg(fittedPieces, 75, 2);

    expect(FITTED_SCOOP_ENTRY_ID).toBe("fitted-scoop-tee-digital-v1");
    expect(fittedPieces[0]!.name).toBe("fitted front");
    expect(fittedOutput).toContain('data-pattern-family="fitted-scoop-tee"');
    expect(fittedOutput).toContain("Fitted Scoop-neck Tee neckband provisional cutting template");
    expect(fittedOutput).toContain("FITTED SCOOP-NECK TEE NECKBAND — PROVISIONAL TEMPLATE · SELECTED SIZE");
    expect(fittedOutput).toContain('data-calibration-length-cm="10"');
    expect(fittedOutput).toContain("fit/recovery not validated");
    expect(fittedOutput.match(/data-neckline-circumference-cm="([^"]+)"/)?.[1])
      .toBe(teeOutput.match(/data-neckline-circumference-cm="([^"]+)"/)?.[1]);
    expect(teeOutput).toContain("<title>Tee neckband provisional cutting template</title>");
    expect(teeOutput).not.toContain("fitted-scoop-tee");
    expect(() => fittedScoopNeckbandTemplateSvg([fittedPieces[1]!], 75, 2))
      .toThrow("must include a fitted front piece");
  });

  it("accepts both range boundaries and uses the same center-front point when the edge direction is reversed", () => {
    expect(template(pieces, 75, 1.5)).toContain('data-finished-width-cm="1.5"');
    expect(template(pieces, 90, 3)).toContain('data-finished-width-cm="3"');

    const reversedFront: Piece = {
      ...front,
      edges: front.edges.map((edge) => edge.name === "neckline" && edge.kind === "line"
        ? { ...edge, start: edge.end, end: edge.start }
        : edge),
    };
    expect(template([reversedFront, back])).toBe(template());
  });

  it("rejects band settings outside the declared bounds without clamping", () => {
    for (const length of [74, 91, 75.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => template(pieces, length, 2)).toThrow("Neckband length must be");
    }
    for (const width of [1.4, 3.1, 2.05, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => template(pieces, 75, width)).toThrow("Finished neckband width must be");
    }
  });

  it("requires front and back pieces and a straight active V front", () => {
    expect(() => template([])).toThrow("front and back pieces");
    expect(() => template([front])).toThrow("front and back pieces");
    const crewFront = rolePiece(draftTshirt(STANDARD_M), "front");
    expect(() => template([crewFront, back])).toThrow("not a straight V");
  });

  it("rejects non-finite or zero-length front and back neckline geometry", () => {
    const nonFiniteFront = linePiece("front", { x: 0, y: 0 }, { x: Number.NaN, y: 5 });
    const zeroFront = linePiece("front", { x: 0, y: 0 }, { x: 0, y: 0 });
    const nonFiniteBack = linePiece("back", { x: 0, y: Number.NaN }, { x: 0, y: 3 });
    const zeroBack = linePiece("back", { x: 0, y: 0 }, { x: 0, y: 0 });

    expect(() => template([nonFiniteFront, back])).toThrow("geometry is not usable");
    expect(() => template([front, nonFiniteBack])).toThrow("geometry is not usable");
    expect(() => template([zeroFront, back])).toThrow("geometry is not usable");
    expect(() => template([front, zeroBack])).toThrow("geometry is not usable");
  });

  it("requires positive front V width and drop and a finite neckline circumference", () => {
    expect(() => template([
      linePiece("front", { x: 0, y: 0 }, { x: 0, y: 4 }), back,
    ])).toThrow("cannot define a center-front band join");
    expect(() => template([
      linePiece("front", { x: 0, y: 0 }, { x: 4, y: 0 }), back,
    ])).toThrow("cannot define a center-front band join");
    expect(() => template([
      linePiece("front", { x: 0, y: 0 }, { x: 8e307, y: 6e307 }),
      linePiece("back", { x: 0, y: 0 }, { x: 1e308, y: 0 }),
    ])).toThrow("geometry is not usable");
  });

  it("rejects a V join that overlaps itself or cannot be represented at finite scale", () => {
    expect(() => template([
      linePiece("front", { x: 0, y: 100 }, { x: 1, y: 0 }), back,
    ])).toThrow("too sharp for this band length");
    expect(() => template([
      linePiece("front", { x: 0, y: 1e15 }, { x: 1e-308, y: 0 }), back,
    ])).toThrow("too sharp for this band length");
  });
});
