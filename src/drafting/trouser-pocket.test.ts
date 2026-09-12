import { describe, it, expect } from "vitest";
import { distance, point } from "../geometry";
import { exportSvg } from "../export/svg";
import { renderBlueprint } from "../render/canvas";
import { resolveGrainline, resolveNotch } from "../render/notch";
import {
  blockPieces,
  edgeLength,
  pieceEdge,
  rolePiece,
  stitchChecks,
} from "./index";
import { STANDARD_M } from "./measurements";
import {
  DEFAULT_TROUSER_OPTIONS,
  TrouserOptions,
} from "./trouser-contract";
import {
  draftTrouserWithPockets,
  trouserPocket,
  trouserPocketGuidance,
  trouserPocketOpening,
  TROUSER_ALLOWANCES,
  TROUSER_NOTCHES,
} from "./trouser";
import { allowanceFor } from "./allowance";

function lineMarkOf(piece: ReturnType<typeof rolePiece>, name: string) {
  const mark = piece.marks?.find((candidate) => candidate.name === name);
  if (!mark || !("start" in mark)) throw new Error(`Missing line mark ${name}`);
  return mark;
}

describe("trouser pocket component", () => {
  it("drafts paired bags whose opening edges match the live front marks", () => {
    const b = draftTrouserWithPockets(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    const opening = trouserPocketOpening(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    const leftMark = lineMarkOf(rolePiece(b, "frontLeft"), "pocketOpening");
    const rightMark = lineMarkOf(rolePiece(b, "frontRight"), "pocketOpening");
    const leftBag = rolePiece(b, "pocketBagLeft");
    const rightBag = rolePiece(b, "pocketBagRight");

    expect(blockPieces(b).map((piece) => piece.name)).toEqual([
      "trouser front left", "trouser front right", "trouser back left", "trouser back right",
      "trouser waistband", "trouser fly shield", "trouser pocket bag left", "trouser pocket bag right",
    ]);
    expect(leftMark.start).toEqual(opening.start);
    expect(leftMark.end).toEqual(opening.end);
    expect(edgeLength(pieceEdge(leftBag, "opening"))).toBeCloseTo(distance(opening.start, opening.end));
    expect(edgeLength(pieceEdge(rightBag, "opening"))).toBeCloseTo(edgeLength(pieceEdge(leftBag, "opening")));
    expect(leftBag.marks?.map((mark) => mark.name)).toEqual(["bagOpeningMatch", "bagBottom"]);
    expect(rightMark.start.x).toBeCloseTo(-leftMark.start.x);
    expect(rightMark.end.x).toBeCloseTo(-leftMark.end.x);
  });

  it("connects both bags to actual marked openings and keeps every seam passing", () => {
    const b = draftTrouserWithPockets(STANDARD_M);
    expect(b.stitches.map((stitch) => stitch.label)).toEqual([
      "Left side seam (front ↔ back)", "Right side seam (front ↔ back)",
      "Left inseam (front ↔ back)", "Right inseam (front ↔ back)",
      "Center-back seam (left ↔ right)", "Waistband (four legs ↔ separate waistband)",
      "Left front fly ↔ shield", "Right front fly ↔ shield",
      "Left pocket opening ↔ bag", "Right pocket opening ↔ bag",
    ]);
    expect(stitchChecks(b, b.stitches).every((check) => check.ok)).toBe(true);
    expect(rolePiece(b, "frontLeft").marks?.some((mark) => mark.name === "pocketOpening")).toBe(true);
    expect(rolePiece(b, "frontRight").marks?.some((mark) => mark.name === "pocketOpening")).toBe(true);
  });

  it("moves both the opening and bag with live pocket dimensions", () => {
    const changedOptions: TrouserOptions = {
      ...DEFAULT_TROUSER_OPTIONS,
      pocketOpening: 20,
      pocketAngle: 45,
      pocketBagDepth: 29,
      pocketDrop: 7,
    };
    const base = trouserPocket(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    const changed = trouserPocket(STANDARD_M, changedOptions);
    const baseBag = base.pieces.pocketBagLeft;
    const changedBag = changed.pieces.pocketBagLeft;
    expect(edgeLength(pieceEdge(changedBag, "opening")))
      .toBeGreaterThan(edgeLength(pieceEdge(baseBag, "opening")));
    expect(edgeLength(pieceEdge(changedBag, "bagLower")))
      .toBeGreaterThan(edgeLength(pieceEdge(baseBag, "bagLower")));
    expect(pieceEdge(changedBag, "opening").kind).toBe("line");
    expect(pieceEdge(baseBag, "opening").kind).toBe("line");
    if (pieceEdge(changedBag, "opening").kind !== "line" || pieceEdge(baseBag, "opening").kind !== "line") return;
    expect(changedBag.edges[0].kind).toBe("line");
    expect(changedBag.edges[0].kind === "line" ? changedBag.edges[0].start.y : 0)
      .toBeGreaterThan(baseBag.edges[0].kind === "line" ? baseBag.edges[0].start.y : 0);
    expect(edgeLength(pieceEdge(changedBag, "bagOuter")))
      .not.toBeCloseTo(edgeLength(pieceEdge(baseBag, "bagOuter")));
  });

  it("reports range and geometry failures with option-linked corrections", () => {
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      pocketOpening: 30,
      pocketAngle: 80,
      pocketDrop: 15,
      pocketBagDepth: 35,
    };
    const b = draftTrouserWithPockets(STANDARD_M, options);
    const notes = trouserPocketGuidance(b, STANDARD_M, options);
    const fields = notes.map((note) => note.field);
    expect(notes.every((note) => note.level === "warn")).toBe(true);
    expect(fields).toContain("option-pocketOpening");
    expect(fields).toContain("option-pocketAngle");
    expect(fields).toContain("option-pocketDrop");
    expect(fields).toContain("option-pocketBagDepth");
    expect(notes.some((note) => note.text.includes("front rise"))).toBe(true);
    expect(notes.some((note) => note.text.includes("side seam"))).toBe(true);

    const leavesPanel = {
      ...DEFAULT_TROUSER_OPTIONS,
      pocketOpening: 30,
      pocketAngle: 35,
      pocketDrop: 0,
      pocketBagDepth: 12,
    };
    const leavesNotes = trouserPocketGuidance(
      draftTrouserWithPockets(STANDARD_M, leavesPanel), STANDARD_M, leavesPanel
    );
    expect(leavesNotes.some((note) => note.text.includes("leaves the front panel"))).toBe(true);

    const belowPanel = { ...DEFAULT_TROUSER_OPTIONS, pocketDrop: 200 };
    const belowPanelNotes = trouserPocketGuidance(
      draftTrouserWithPockets(STANDARD_M, belowPanel), STANDARD_M, belowPanel
    );
    expect(belowPanelNotes.some((note) => note.text.includes("leaves the front panel"))).toBe(true);

    const base = draftTrouserWithPockets(STANDARD_M);
    const front = rolePiece(base, "frontLeft");
    const horizontalSide = front.edges.map((edge) => edge.name === "sideUpper"
      ? { kind: "line" as const, name: edge.name, start: point(23.5, 2), end: point(27.5, 2) }
      : edge);
    const degenerateSideBlock = {
      ...base,
      roles: { ...base.roles, frontLeft: { ...front, edges: horizontalSide } },
    };
    const degenerateNotes = trouserPocketGuidance(degenerateSideBlock, STANDARD_M);
    expect(degenerateNotes.some((note) => note.text.includes("leaves the front panel"))).toBe(true);

    const reachesHemMeasurements = { ...STANDARD_M, inseam: 40 };
    const reachesHemOptions = {
      ...DEFAULT_TROUSER_OPTIONS,
      pocketOpening: 25,
      pocketAngle: 70,
      pocketDrop: 15,
      pocketBagDepth: 35,
    };
    const reachesHemNotes = trouserPocketGuidance(
      draftTrouserWithPockets(reachesHemMeasurements, reachesHemOptions),
      reachesHemMeasurements,
      reachesHemOptions,
    );
    expect(reachesHemNotes.some((note) => note.text.includes("reaches the hem"))).toBe(true);
  });

  it("declares notch, grainline, and allowance data for every emitted piece", () => {
    const b = draftTrouserWithPockets(STANDARD_M);
    expect(TROUSER_NOTCHES).toHaveLength(8);
    for (const piece of blockPieces(b)) {
      const recipe = TROUSER_NOTCHES.find((entry) => entry.pieceName === piece.name);
      expect(recipe).toBeDefined();
      if (!recipe) continue;
      expect(recipe.notches.length).toBeGreaterThan(0);
      for (const rule of recipe.notches) {
        const notch = resolveNotch(piece, rule);
        expect(Number.isFinite(notch.point.x) && Number.isFinite(notch.point.y)).toBe(true);
      }
      const grain = resolveGrainline(piece, recipe.grainline);
      expect(Number.isFinite(grain.top.x) && Number.isFinite(grain.bottom.y)).toBe(true);
    }
    expect(allowanceFor(TROUSER_ALLOWANCES, "hem")).toBe(2);
    expect(allowanceFor(TROUSER_ALLOWANCES, "opening")).toBe(1);
    expect(allowanceFor(TROUSER_ALLOWANCES, "unknown-edge")).toBe(1);
  });

  it("renders and exports the actual pocket marks and bag roles", () => {
    const b = draftTrouserWithPockets(STANDARD_M);
    const blueprint = renderBlueprint([...blockPieces(b)], {
      notches: TROUSER_NOTCHES,
      allowances: TROUSER_ALLOWANCES,
    });
    expect(blueprint).toContain("TROUSER POCKET BAG LEFT");
    expect(blueprint).toContain('data-pattern-mark-name="pocketOpening"');
    expect(blueprint).toContain('data-pattern-mark-name="bagOpeningMatch"');

    const svg = exportSvg([...blockPieces(b)], TROUSER_ALLOWANCES, TROUSER_NOTCHES);
    expect(svg).toContain("TROUSER POCKET BAG RIGHT");
    expect(svg).toContain('data-pattern-mark-name="pocketOpening"');
    expect(svg).toContain('data-pattern-mark-name="bagOpeningMatch"');
  });
});
