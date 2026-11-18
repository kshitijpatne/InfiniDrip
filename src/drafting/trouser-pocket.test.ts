import { describe, it, expect } from "vitest";
import { distance, point } from "../geometry";
import { exportSvg } from "../export/svg";
import { flattenPiece, layoutPieces, polylineBounds } from "../export/layout";
import { exportDxf } from "../export/dxf";
import { renderBlueprint } from "../render/canvas";
import { resolveGrainline, resolveNotch } from "../render/notch";
import { edgeEnd, edgeStart } from "./piece";
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
  resolveTrouserOptions,
  TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY,
  TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY,
  TrouserOptions,
} from "./trouser-contract";
import {
  draftTrouserWithPockets,
  trouserPocket,
  trouserPocketGuidance,
  trouserPocketOpening,
  trouserNotchesForOptions,
  TROUSER_ALLOWANCES,
  TROUSER_NOTCHES,
} from "./trouser";
import { trouserGuidance } from "./trouser-guidance";
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
      "trouser waistband", "trouser fly shield", "trouser fly underlap", "trouser pocket bag left", "trouser pocket bag right",
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
      "Center-back seam (left ↔ right)", "Fly underlap ↔ shield",
      "Waistband (four legs ↔ separate waistband)",
      "Left front fly ↔ shield", "Right front fly ↔ underlap",
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

    const barrelOptions = {
      ...DEFAULT_TROUSER_OPTIONS,
      barrelBowCm: 2,
      [TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY]: 1 as const,
    };
    const barrel = draftTrouserWithPockets(STANDARD_M, barrelOptions);
    const barrelFront = rolePiece(barrel, "frontLeft");
    const repositionAtY = (edge: typeof barrelFront.edges[number], startY: number, endY: number) => edge.kind === "line"
      ? { ...edge, start: { ...edge.start, y: startY }, end: { ...edge.end, y: endY } }
      : {
        ...edge,
        curve: {
          ...edge.curve,
          start: { ...edge.curve.start, y: startY },
          control1: { ...edge.curve.control1, y: startY },
          control2: { ...edge.curve.control2, y: endY },
          end: { ...edge.curve.end, y: endY },
        },
      };
    const flatBarrelSide = barrelFront.edges.map((edge) => edge.name === "sideUpper" || edge.name === "sideHipToThigh"
      ? repositionAtY(edge, 20, 30)
      : edge.name === "sideThighToKnee"
        ? repositionAtY(edge, 2, 2)
        : edge.name === "sideKneeToHem"
          ? repositionAtY(edge, 40, 50)
          : edge);
    const flatCurveBlock = {
      ...barrel,
      roles: { ...barrel.roles, frontLeft: { ...barrelFront, edges: flatBarrelSide } },
    };
    const flatCurveNotes = trouserPocketGuidance(flatCurveBlock, STANDARD_M, barrelOptions);
    expect(flatCurveNotes.some((note) => note.text.includes("leaves the front panel"))).toBe(true);

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
    expect(TROUSER_NOTCHES).toHaveLength(9);
    for (const piece of blockPieces(b)) {
      const recipe = TROUSER_NOTCHES.find((entry) => entry.pieceName === piece.name);
      expect(recipe).toBeDefined();
      if (!recipe) continue;
      if (piece.name === "trouser fly underlap") expect(recipe.notches).toEqual([{ edgeName: "shieldEdge", t: 0.5 }]);
      else expect(recipe.notches.length).toBeGreaterThan(0);
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
    expect(TROUSER_NOTCHES.find((entry) => entry.pieceName === "trouser fly underlap")?.grainline)
      .toEqual({ topEdge: "top", topT: 0.5, bottomEdge: "bottom", bottomT: 0.5 });
  });

  it("renders and exports the actual pocket marks and bag roles", () => {
    const b = draftTrouserWithPockets(STANDARD_M);
    const underlap = blockPieces(b).find((piece) => piece.name === "trouser fly underlap");
    const underlapNotchRule = TROUSER_NOTCHES.find((entry) => entry.pieceName === "trouser fly underlap")?.notches[0];
    if (!underlap || !underlapNotchRule) throw new Error("Expected the source-approved fly-underlap balance notch.");
    const underlapNotchPoint = resolveNotch(underlap, underlapNotchRule).point;
    const rounded = (value: number) => Math.round(value * 1000) / 1000;
    const notchOutputAnchor = `x1="${rounded(underlapNotchPoint.x)}" y1="${rounded(underlapNotchPoint.y)}"`;
    const blueprint = renderBlueprint([...blockPieces(b)], {
      notches: TROUSER_NOTCHES,
      allowances: TROUSER_ALLOWANCES,
    });
    expect(blueprint).toContain(notchOutputAnchor);
    expect(blueprint).toContain("TROUSER POCKET BAG LEFT");
    expect(blueprint).toContain("TROUSER FLY UNDERLAP");
    expect(blueprint).toContain('data-pattern-mark-name="pocketOpening"');
    expect(blueprint).toContain('data-pattern-mark-name="bagOpeningMatch"');

    const svg = exportSvg([...blockPieces(b)], TROUSER_ALLOWANCES, TROUSER_NOTCHES);
    const pieces = [...blockPieces(b)];
    const flats = pieces.map((piece) => flattenPiece(piece, TROUSER_ALLOWANCES));
    const layout = layoutPieces(flats);
    const index = pieces.findIndex((piece) => piece.name === underlap.name);
    const sourceBounds = polylineBounds(flats[index]!.cut);
    const placedBounds = polylineBounds(layout.pieces[index]!.cut);
    const translatedAnchor = `x1="${rounded(underlapNotchPoint.x + placedBounds.minX - sourceBounds.minX)}" `
      + `y1="${rounded(underlapNotchPoint.y + placedBounds.minY - sourceBounds.minY)}"`;
    expect(svg).toContain(translatedAnchor);
    expect(svg).toContain("TROUSER POCKET BAG RIGHT");
    expect(svg).toContain("TROUSER FLY UNDERLAP");
    expect(svg).toContain('data-pattern-mark-name="pocketOpening"');
    expect(svg).toContain('data-pattern-mark-name="bagOpeningMatch"');

    const dxf = exportDxf(blockPieces(b), TROUSER_ALLOWANCES);
    expect(dxf.match(/\nPOLYLINE\n/gu)).toHaveLength(blockPieces(b).length * 2);
  });

  it("adds one real mirrored R06 cut intake while preserving the post-fold sewn waist and back panels", () => {
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      [TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY]: 1 as const,
      frontPleatIntakeCm: 4,
      frontPleatOffsetCm: 6,
      frontPleatStitchDepthCm: 8,
    };
    const base = draftTrouserWithPockets(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    const pleated = draftTrouserWithPockets(STANDARD_M, options);
    const baseFront = rolePiece(base, "frontLeft");
    const front = rolePiece(pleated, "frontLeft");
    const right = rolePiece(pleated, "frontRight");
    const cutWaistNames = ["waist", "pleatCutFoldSide", "pleatCutTop", "pleatCutPlacementSide", "waistAfterPleat"];
    const cutWaistLength = cutWaistNames.reduce((sum, name) => sum + edgeLength(pieceEdge(front, name)), 0);
    const baseQuarterWaist = edgeLength(pieceEdge(baseFront, "waist"));
    const waistMark = lineMarkOf(front, "frontWaistAfterPleat");
    const rightWaistMark = lineMarkOf(right, "frontWaistAfterPleat");
    const waistStitch = pleated.stitches.find((stitch) => stitch.label === "Waistband (four legs ↔ separate waistband)")!;
    const frontRefs = waistStitch.a.edges.filter((ref) => ref.piece.startsWith("front"));

    expect(cutWaistLength).toBeCloseTo(baseQuarterWaist + options.frontPleatIntakeCm);
    expect(distance(waistMark.start, waistMark.end)).toBeCloseTo(baseQuarterWaist);
    expect(waistMark.start).toEqual(point(0, 0));
    expect(waistMark.end.x).toBeCloseTo(baseQuarterWaist);
    expect(rightWaistMark.end.x).toBeCloseTo(-baseQuarterWaist);
    expect(frontRefs).toEqual([
      { piece: "frontLeft", mark: "frontWaistAfterPleat", side: "left", reversed: true },
      { piece: "frontRight", mark: "frontWaistAfterPleat", side: "right" },
    ]);
    expect(stitchChecks(pleated, pleated.stitches).every((check) => check.ok)).toBe(true);
    expect(rolePiece(pleated, "backLeft").edges).toEqual(rolePiece(base, "backLeft").edges);
    expect(rolePiece(pleated, "backRight").edges).toEqual(rolePiece(base, "backRight").edges);

    const notches = trouserNotchesForOptions(options);
    const frontRule = notches.find((entry) => entry.pieceName === front.name)!;
    const grainline = resolveGrainline(front, frontRule.grainline);
    expect(grainline.top.x).toBeCloseTo(baseQuarterWaist / 2);
    expect(grainline.top.y).toBe(0);
    expect(notches.find((entry) => entry.pieceName === "trouser back left")?.grainline)
      .toEqual(TROUSER_NOTCHES.find((entry) => entry.pieceName === "trouser back left")?.grainline);
  });

  it("resolves R06 grainlines from safe waist and hem fallbacks when the post-fold mark is absent", () => {
    const routeOnly = { [TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY]: 1 as const };
    const generic = draftTrouserWithPockets(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    const front = rolePiece(generic, "frontLeft");
    const frontRule = trouserNotchesForOptions(routeOnly)
      .find((entry) => entry.pieceName === front.name)!;
    const waist = pieceEdge(front, "waist");
    const hem = pieceEdge(front, "hem");
    const edgeFallback = resolveGrainline(front, frontRule.grainline);

    expect(edgeFallback.top.x).toBeCloseTo((edgeStart(waist).x + edgeEnd(waist).x) / 2);
    expect(edgeFallback.top.y).toBeCloseTo((edgeStart(waist).y + edgeEnd(waist).y) / 2);
    expect(edgeFallback.bottom.x).toBeCloseTo((edgeStart(hem).x + edgeEnd(hem).x) / 2);
    expect(edgeFallback.bottom.y).toBeCloseTo((edgeStart(hem).y + edgeEnd(hem).y) / 2);

    const originFallbackPiece = {
      ...front,
      edges: front.edges.filter((edge) => edge.name !== "waist" && edge.name !== "hem"),
      marks: front.marks?.filter((mark) => mark.name !== "frontWaistAfterPleat"),
    };
    expect(resolveGrainline(originFallbackPiece, frontRule.grainline)).toEqual({
      top: { x: 0, y: 0 }, bottom: { x: 0, y: 0 },
    });
  });

  it("flags R06 pleat-to-pocket and pleat-to-side conflicts without clamping the option values", () => {
    const crossingOptions = {
      ...DEFAULT_TROUSER_OPTIONS,
      [TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY]: 1 as const,
      frontPleatIntakeCm: 8,
      frontPleatOffsetCm: 12,
      frontPleatStitchDepthCm: 16,
    };
    const crossingBlock = draftTrouserWithPockets(STANDARD_M, crossingOptions);
    const pocketNotes = trouserGuidance(crossingBlock, STANDARD_M, crossingOptions);
    expect(pocketNotes.some((note) => note.field === "option-frontPleatOffsetCm"
      && note.text.includes("crosses the pocket opening"))).toBe(true);
    expect(resolveTrouserOptions(crossingOptions).frontPleatOffsetCm).toBe(12);

    const narrow = { ...STANDARD_M, waist: 40 };
    const narrowBlock = draftTrouserWithPockets(narrow, crossingOptions);
    expect(trouserGuidance(narrowBlock, narrow, crossingOptions).some((note) =>
      note.field === "option-frontPleatOffsetCm" && note.text.includes("reaches the side waist"))).toBe(true);
  });
});
