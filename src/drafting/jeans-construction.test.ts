import { describe, expect, it } from "vitest";
import { cubicPoint } from "../geometry";
import { blockPieces, rolePiece } from "./block";
import { renderBlueprint } from "../render/canvas";
import { draftJeansCore } from "./jeans";
import { addJeansConstructionMarks } from "./jeans-construction";
import { JEANS_ALLOWANCES } from "./jeans-tables";
import { DEFAULT_JEANS_OPTIONS } from "./jeans-contract";
import { STANDARD_M } from "./measurements";
import { gradeMeasurements } from "./grading";
import { TROUSER_GRADE } from "./trouser-tables";
import type { Edge, Piece } from "./piece";

function lineMarks(piece: Piece, prefix: string) {
  return (piece.marks ?? []).filter((mark) => mark.kind === "placementLine" && mark.name.startsWith(prefix));
}

function outlinePoints(piece: Piece): { readonly x: number; readonly y: number }[] {
  return piece.edges.flatMap((edge) => edge.kind === "line"
    ? [edge.start]
    : Array.from({ length: 64 }, (_, index) => cubicPoint(edge.curve, index / 64)));
}

function pointInsidePiece(piece: Piece, query: { readonly x: number; readonly y: number }): boolean {
  const outline = outlinePoints(piece);
  return outline.reduce((inside, current, index) => {
    const previous = outline[(index + outline.length - 1) % outline.length]!;
    const crosses = (current.y > query.y) !== (previous.y > query.y)
      && query.x < (previous.x - current.x) * (query.y - current.y) / (previous.y - current.y) + current.x;
    return crosses ? !inside : inside;
  }, false);
}

describe("Jeans construction marks", () => {
  it("adds marks when a source role has no prior annotation list", () => {
    const draft = draftJeansCore(STANDARD_M);
    const backLowerLeft = rolePiece(draft, "backLowerLeft");
    const result = addJeansConstructionMarks({
      ...draft,
      roles: { ...draft.roles, backLowerLeft: { ...backLowerLeft, marks: undefined } },
    });
    expect(lineMarks(rolePiece(result, "backLowerLeft"), "back-lower-left-yokeJoin-row-1").length).toBeGreaterThan(0);
  });

  it("adds named topstitch, bartack, loop, and optional rivet marks without altering cut topology", () => {
    const base = draftJeansCore(STANDARD_M);
    const marked = base;
    expect(marked.stitches).toBe(base.stitches);
    expect(Object.keys(marked.roles)).toEqual(Object.keys(base.roles));
    for (const role of Object.keys(base.roles)) {
      expect(rolePiece(marked, role).edges).toEqual(rolePiece(base, role).edges);
    }

    const frontLeft = rolePiece(marked, "frontLeft");
    const frontRight = rolePiece(marked, "frontRight");
    expect(lineMarks(frontLeft, "front-left-pocketOpening-row-1").length).toBeGreaterThan(0);
    expect(lineMarks(frontRight, "front-right-pocketOpening-row-2").length).toBeGreaterThan(0);
    expect(lineMarks(frontLeft, "fly-cover-topstitch-row-")).toHaveLength(2);
    expect(frontLeft.marks?.filter(({ name }) => name.startsWith("optional-rivet-front-left-")).length).toBe(2);
    expect(frontRight.marks?.filter(({ name }) => name.startsWith("optional-rivet-front-right-")).length).toBe(2);
    expect(rolePiece(marked, "coinPocket").marks?.filter(({ name }) => name.startsWith("optional-rivet-coin-")).length).toBe(2);
    expect(lineMarks(rolePiece(marked, "backPocketLeft"), "back-pocket-left-bartack-")).toHaveLength(2);
    expect(lineMarks(rolePiece(marked, "backPocketRight"), "back-pocket-right-bartack-")).toHaveLength(2);
    expect(lineMarks(rolePiece(marked, "beltLoopStrip"), "belt-loop-strip-topstitch-")).toHaveLength(2);
    expect(rolePiece(marked, "flyShield").marks?.filter(({ name }) => name.startsWith("flyBartack")).length).toBe(2);

    const svg = renderBlueprint(blockPieces(marked), { allowances: JEANS_ALLOWANCES });
    expect(svg).toContain("waistband topstitch");
    expect(svg).toContain("optional rivet");
    expect(svg).toContain("bartack");
    expect(svg).toContain("belt-loop-strip-topstitch-left");
  });

  it("keeps construction stitch rows inside their source pieces and the full size run finite", () => {
    for (const step of [-2, 0, 2]) {
      const measurements = gradeMeasurements(STANDARD_M, TROUSER_GRADE, step);
      const draft = draftJeansCore(measurements, DEFAULT_JEANS_OPTIONS);
      for (const piece of blockPieces(draft)) {
        expect(piece.edges.length).toBeGreaterThan(0);
        expect((piece.marks ?? []).every((mark) => "at" in mark
          ? Number.isFinite(mark.at.x) && Number.isFinite(mark.at.y)
          : Number.isFinite(mark.start.x) && Number.isFinite(mark.start.y) &&
            Number.isFinite(mark.end.x) && Number.isFinite(mark.end.y))).toBe(true);
      }

      const markGroups: readonly { readonly role: string; readonly prefixes: readonly string[] }[] = [
        { role: "frontLeft", prefixes: ["front-left-pocketOpening", "fly-cover-topstitch-"] },
        { role: "frontRight", prefixes: ["front-right-pocketOpening"] },
        { role: "backLowerLeft", prefixes: ["back-lower-left-"] },
        { role: "backLowerRight", prefixes: ["back-lower-right-"] },
        { role: "backPocketLeft", prefixes: ["back-pocket-left-topstitch", "back-pocket-left-bartack-"] },
        { role: "backPocketRight", prefixes: ["back-pocket-right-topstitch", "back-pocket-right-bartack-"] },
        { role: "coinPocket", prefixes: ["coin-pocket-topstitch"] },
        { role: "waistbandOuterLeft", prefixes: ["waistband-outer-left-"] },
        { role: "waistbandOuterRight", prefixes: ["waistband-outer-right-"] },
        { role: "beltLoopStrip", prefixes: ["belt-loop-strip-topstitch-"] },
      ];
      for (const { role, prefixes } of markGroups) {
        const piece = rolePiece(draft, role);
        for (const mark of piece.marks ?? []) {
          if (!("start" in mark) || !prefixes.some((prefix) => mark.name.startsWith(prefix))) continue;
          for (const fraction of [0.1, 0.5, 0.9]) {
            const sample = {
              x: mark.start.x + (mark.end.x - mark.start.x) * fraction,
              y: mark.start.y + (mark.end.y - mark.start.y) * fraction,
            };
            expect(pointInsidePiece(piece, sample), `${piece.name}/${mark.name} at ${fraction}: ${JSON.stringify(sample)}`).toBe(true);
          }
        }
      }
    }
  });

  it("rejects a malformed pocket-opening edge or a missing named fly guide with field-specific messages", () => {
    const draft = draftJeansCore(STANDARD_M);
    const frontLeft = rolePiece(draft, "frontLeft");
    const lineOpening: Edge[] = frontLeft.edges.map((edge) => edge.name === "pocketOpening"
      ? { kind: "line", name: edge.name, start: { x: 1, y: 1 }, end: { x: 2, y: 2 } }
      : edge);
    expect(() => addJeansConstructionMarks({
      ...draft,
      roles: { ...draft.roles, frontLeft: { ...frontLeft, edges: lineOpening } },
    })).toThrow(/front pocket rivets require the named curved pocket opening/);

    const missingGuide: Piece = {
      ...frontLeft,
      marks: frontLeft.marks?.filter(({ name }) => name !== "flyCoverStitch"),
    };
    expect(() => addJeansConstructionMarks({
      ...draft,
      roles: { ...draft.roles, frontLeft: missingGuide },
    })).toThrow(/fly cover requires its named live placement line/);
  });
});
