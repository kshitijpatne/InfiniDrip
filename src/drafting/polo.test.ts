import { describe, expect, it } from "vitest";
import { STANDARD_M } from "./measurements";
import { edgeEnd, edgeLength, edgeStart, pieceEdge } from "./piece";
import {
  draftPolo,
  draftPoloShell,
  POLO_ALLOWANCES,
  POLO_NOTCHES,
  POLO_OPTION_DEFINITIONS,
  POLO_POMS,
  poloGuidance,
  resolvePoloOptions,
} from "./polo";
import { rolePiece } from "./block";
import { interfaceLength, stitchChecks } from "./stitch";

describe("Polo shell (Slice 69)", () => {
  it("drafts tee body/sleeve plus two real folded placket pieces", () => {
    const block = draftPoloShell(STANDARD_M);
    expect(Object.keys(block.roles)).toEqual(["front", "back", "sleeve", "buttonPlacket", "buttonholePlacket"]);
    expect(rolePiece(block, "front").onFold).toBe(true);
    expect(rolePiece(block, "buttonPlacket").onFold).toBe(false);
  });

  it("keeps a true internal centre-front slit instead of inventing a centre-front seam", () => {
    const front = rolePiece(draftPoloShell(STANDARD_M), "front");
    expect(pieceEdge(front, "centerFront")).toBeDefined();
    const slit = front.marks?.find((mark) => mark.name === "placketOpening");
    expect(slit).toMatchObject({ kind: "cutLine", start: { x: 0, y: 8 }, end: { x: 0, y: 22 } });
  });

  it("uses 3 cm finished faces, 14 cm attachment lines, and fixed button centres", () => {
    const placket = rolePiece(draftPoloShell(STANDARD_M), "buttonPlacket");
    expect(edgeLength(pieceEdge(placket, "top"))).toBeCloseTo(8);
    const attachment = placket.marks?.find((mark) => mark.name === "attachmentLine");
    expect(attachment).toMatchObject({ kind: "placementLine", start: { x: 1, y: 0 }, end: { x: 1, y: 14 } });
    const buttons = placket.marks?.filter((mark): mark is Extract<typeof mark, { readonly at: unknown }> =>
      mark.kind === "button");
    expect(buttons?.map((mark) => mark.at.y)).toEqual([3.5, 7, 10.5]);
  });

  it("matches every declared shell seam, including each slit side", () => {
    const block = draftPoloShell(STANDARD_M);
    expect(stitchChecks(block, block.stitches).every((result) => result.ok)).toBe(true);
    const placketStitch = block.stitches.find((stitch) => stitch.label.startsWith("Button placket"))!;
    expect(interfaceLength(block, placketStitch.a)).toBeCloseTo(14);
    expect(interfaceLength(block, placketStitch.b)).toBeCloseTo(14);
  });

  it("uses live supplied dimensions without silently clamping them", () => {
    expect(resolvePoloOptions({ placketWidth: 4.5, placketLength: 12 })).toMatchObject({ placketWidth: 4.5, placketLength: 12 });
    expect(resolvePoloOptions({ placketLength: Number.NaN })).toMatchObject({ placketLength: 14, standHeight: 2 });
    expect(edgeLength(pieceEdge(rolePiece(draftPoloShell(STANDARD_M, { placketWidth: 4 }), "buttonPlacket"), "top"))).toBeCloseTo(10);
  });

  it("adds two collar layers and two stand layers, cut on fold, with every interface measured", () => {
    const block = draftPolo(STANDARD_M);
    expect(Object.keys(block.roles)).toEqual([
      "front", "back", "sleeve", "buttonPlacket", "buttonholePlacket",
      "outerStand", "innerStand", "upperCollar", "underCollar",
    ]);
    for (const role of ["outerStand", "innerStand", "upperCollar", "underCollar"]) {
      expect(rolePiece(block, role).onFold).toBe(true);
    }
    expect(edgeLength(pieceEdge(rolePiece(block, "outerStand"), "frontEnd"))).toBeCloseTo(2);
    expect(edgeLength(pieceEdge(rolePiece(block, "upperCollar"), "centerBack"))).toBeCloseTo(5);
    expect(stitchChecks(block, block.stitches).every((result) => result.ok)).toBe(true);
    const necklineStitch = block.stitches.find((stitch) => stitch.label === "Outer stand ↔ polo neckline")!;
    expect(interfaceLength(block, necklineStitch.a)).toBeCloseTo(interfaceLength(block, necklineStitch.b));
  });

  it("changes collar and stand geometry directly from supplied options", () => {
    const block = draftPolo(STANDARD_M, { standHeight: 3, collarLeafDepth: 7 });
    expect(edgeLength(pieceEdge(rolePiece(block, "innerStand"), "frontEnd"))).toBeCloseTo(3);
    expect(edgeLength(pieceEdge(rolePiece(block, "underCollar"), "centerBack"))).toBeCloseTo(7);
  });

  it("uses real front/back neckline seams for shaped stand and collar bases", () => {
    const block = draftPolo(STANDARD_M);
    const frontNeckline = pieceEdge(rolePiece(block, "front"), "neckline");
    const backNeckline = pieceEdge(rolePiece(block, "back"), "neckline");
    const outerStand = rolePiece(block, "outerStand");
    const upperCollar = rolePiece(block, "upperCollar");

    expect(edgeLength(pieceEdge(outerStand, "frontNeckline"))).toBeCloseTo(edgeLength(frontNeckline), 4);
    expect(edgeLength(pieceEdge(outerStand, "backNeckline"))).toBeCloseTo(edgeLength(backNeckline), 4);
    expect(edgeLength(pieceEdge(upperCollar, "backCollarBase")))
      .toBeCloseTo(edgeLength(pieceEdge(outerStand, "backCollar")), 8);
    expect(edgeLength(pieceEdge(upperCollar, "frontCollarBase")))
      .toBeCloseTo(edgeLength(pieceEdge(outerStand, "frontCollar")), 8);
    expect(edgeLength(pieceEdge(outerStand, "frontEnd"))).toBeCloseTo(2, 6);

    const centerBack = pieceEdge(outerStand, "centerBack");
    expect(edgeStart(centerBack).x).toBeCloseTo(edgeEnd(centerBack).x, 8);
    expect(outerStand.marks?.map((mark) => mark.name)).toEqual(expect.arrayContaining([
      "centerBack", "shoulder", "centerFront",
    ]));
    expect(upperCollar.marks?.map((mark) => mark.name)).toEqual(expect.arrayContaining([
      "centerBack", "shoulder", "centerFront",
    ]));
  });

  it("exposes both V2 collar controls and keeps boundary choices live", () => {
    expect(POLO_OPTION_DEFINITIONS).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "standFrontRise", defaultValue: 0.75, min: 0, max: 2, step: 0.25 }),
      expect.objectContaining({ id: "collarPointExtension", defaultValue: 1.5, min: 0.5, max: 3, step: 0.25 }),
    ]));
    expect(resolvePoloOptions()).toMatchObject({ standFrontRise: 0.75, collarPointExtension: 1.5 });

    const low = draftPolo(STANDARD_M, { standFrontRise: 0, collarPointExtension: 0.5 });
    const high = draftPolo(STANDARD_M, { standFrontRise: 2, collarPointExtension: 3 });
    expect(edgeLength(pieceEdge(rolePiece(low, "outerStand"), "frontNeckline")))
      .toBeCloseTo(edgeLength(pieceEdge(rolePiece(high, "outerStand"), "frontNeckline")), 4);
    expect(pieceEdge(rolePiece(low, "outerStand"), "frontNeckline")).toEqual(
      expect.not.objectContaining({ end: edgeEnd(pieceEdge(rolePiece(high, "outerStand"), "frontNeckline")) }),
    );
    expect(edgeLength(pieceEdge(rolePiece(low, "upperCollar"), "frontTip")))
      .not.toBeCloseTo(edgeLength(pieceEdge(rolePiece(high, "upperCollar"), "frontTip")), 4);
  });

  it("fails loudly rather than inventing a collar when source measurements are non-finite", () => {
    expect(() => draftPolo({ ...STANDARD_M, chest: Number.NaN })).toThrow("Polo collar geometry needs finite");
  });

  it("warns with corrections for invalid choices while still drafting those choices", () => {
    const invalid = { placketLength: 12, placketWidth: 5, standHeight: 4, collarLeafDepth: 3 };
    const block = draftPolo(STANDARD_M, invalid);
    expect(edgeLength(pieceEdge(rolePiece(block, "buttonPlacket"), "bottom"))).toBeCloseTo(12);
    const text = poloGuidance(block, STANDARD_M, invalid).map((note) => note.text).join("\n");
    expect(text).toContain("outside V1's 2–4 cm range");
    expect(text).toContain("increase it to at least 14 cm");
    expect(text).toContain("Stand is deeper than the collar leaf");
  });

  it("warns before a long placket runs into the hem allowance", () => {
    const m = { ...STANDARD_M, length: 30 };
    const text = poloGuidance(draftPolo(m, { placketLength: 21 }), m, { placketLength: 21 })
      .map((note) => note.text).join("\n");
    expect(text).toContain("reaches the hem allowance");
  });

  it("declares no allowance on folds and real allowance on stand, collar, and placket edges", () => {
    expect(POLO_ALLOWANCES.byEdge).toMatchObject({
      centerFront: 0, centerBack: 0, attachmentRaw: 1, neckline: 1, collar: 1,
      backNeckline: 1, frontNeckline: 1, backCollar: 1, frontCollar: 1,
      backCollarBase: 1, frontCollarBase: 1, frontTip: 1,
    });
    expect(POLO_NOTCHES.filter(({ pieceName }) => pieceName.includes("collar") || pieceName.includes("stand")))
      .toHaveLength(4);
  });

  it("refuses to invent finished placket width when required construction marks are absent", () => {
    const drafted = draftPolo(STANDARD_M);
    const malformed = {
      ...drafted,
      roles: { ...drafted.roles, buttonPlacket: { ...rolePiece(drafted, "buttonPlacket"), marks: [] } },
    };
    const width = POLO_POMS.find((pom) => pom.label === "Finished placket width")!;
    expect(() => width.measure(malformed)).toThrow("construction marks are missing");
  });

  it("refuses to invent button spacing when a button point is absent", () => {
    const drafted = draftPolo(STANDARD_M);
    const malformed = {
      ...drafted,
      roles: { ...drafted.roles, buttonPlacket: { ...rolePiece(drafted, "buttonPlacket"), marks: [] } },
    };
    const spacing = POLO_POMS.find((pom) => pom.label === "Button spacing")!;
    expect(() => spacing.measure(malformed)).toThrow('has no point mark "button-1"');
  });
});
