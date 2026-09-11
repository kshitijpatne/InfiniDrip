import { describe, expect, it } from "vitest";
import { STANDARD_M } from "./measurements";
import { edgeLength, pieceEdge } from "./piece";
import { draftPoloShell, resolvePoloOptions } from "./polo";
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
    expect(edgeLength(pieceEdge(rolePiece(draftPoloShell(STANDARD_M, { placketWidth: 4 }), "buttonPlacket"), "top"))).toBeCloseTo(10);
  });
});
