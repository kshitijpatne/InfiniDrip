import { describe, expect, it } from "vitest";
import { edgeLength, edgeStart, pieceEdge, rolePiece, stitchChecks, STANDARD_M } from "./index";
import { addWovenShirtPlackets, draftWovenShirtBody, draftWovenShirtCollar, draftWovenShirtPlackets, frontButtonPositions, WOVEN_SHIRT_BODY_STITCHES, WOVEN_SHIRT_COLLAR_STITCHES } from "./shirt";

describe("woven shirt body", () => {
  it("drafts separate front/back panels with the required named boundaries", () => {
    const block = draftWovenShirtBody(STANDARD_M);
    const front = rolePiece(block, "front");
    const back = rolePiece(block, "back");
    expect(front.onFold).toBe(false);
    expect(back.onFold).toBe(true);
    expect(front.edges.map((e) => e.name)).toEqual([
      "neckline", "shoulder", "armhole", "sideUpper", "sideMiddle", "sideLower", "hem", "centerFront",
    ]);
    expect(back.edges.map((e) => e.name)).toContain("centerBack");
    expect(stitchChecks(block, WOVEN_SHIRT_BODY_STITCHES).every((check) => check.ok)).toBe(true);
  });

  it("uses the independent neck measurement and neck ease", () => {
    const standard = rolePiece(draftWovenShirtBody(STANDARD_M), "front");
    const wider = rolePiece(draftWovenShirtBody({ ...STANDARD_M, neck: 48 }), "front");
    const eased = rolePiece(draftWovenShirtBody(STANDARD_M, { neckEase: 3 }), "front");
    expect(edgeStart(pieceEdge(wider, "neckline")).y).toBeGreaterThan(edgeStart(pieceEdge(standard, "neckline")).y);
    expect(edgeStart(pieceEdge(eased, "neckline")).x).toBe(edgeStart(pieceEdge(standard, "neckline")).x);
    expect(edgeLength(pieceEdge(eased, "neckline"))).toBeGreaterThan(edgeLength(pieceEdge(standard, "neckline")));
  });

  it("uses waist and hip inputs in the relaxed lower shape", () => {
    const base = rolePiece(draftWovenShirtBody(STANDARD_M), "front");
    const shaped = rolePiece(draftWovenShirtBody({ ...STANDARD_M, waist: 100, hip: 120 }), "front");
    expect(edgeStart(pieceEdge(shaped, "sideMiddle")).x).toBeGreaterThan(edgeStart(pieceEdge(base, "sideMiddle")).x);
    expect(edgeStart(pieceEdge(shaped, "sideLower")).x).toBeGreaterThan(edgeStart(pieceEdge(base, "sideLower")).x);
  });

  it("adds layered point collar and stand pieces that sew to the real neckline", () => {
    const block = draftWovenShirtCollar(STANDARD_M);
    expect(Object.keys(block.roles)).toEqual(["front", "back", "outerStand", "innerStand", "upperCollar", "underCollar"]);
    expect(block.roles.outerStand.onFold).toBe(true);
    expect(block.roles.upperCollar.edges.map((e) => e.name)).toEqual(["centerBack", "stand", "frontTip", "outer"]);
    expect(WOVEN_SHIRT_COLLAR_STITCHES).toHaveLength(4);
    expect(stitchChecks(block, block.stitches).every((check) => check.ok)).toBe(true);
  });

  it("keeps collar and stand dimensions live", () => {
    const base = draftWovenShirtCollar(STANDARD_M);
    const changed = draftWovenShirtCollar(STANDARD_M, { standHeight: 3, collarLeafDepth: 8 });
    expect(edgeLength(pieceEdge(changed.roles.outerStand, "frontEnd"))).toBeGreaterThan(edgeLength(pieceEdge(base.roles.outerStand, "frontEnd")));
    expect(edgeLength(pieceEdge(changed.roles.upperCollar, "frontTip"))).toBeGreaterThan(edgeLength(pieceEdge(base.roles.upperCollar, "frontTip")));
    expect(edgeStart(pieceEdge(changed.roles.upperCollar, "outer")).y).toBeGreaterThan(edgeStart(pieceEdge(base.roles.upperCollar, "outer")).y);
  });

  it("adds full plackets with six or seven evenly spaced front marks", () => {
    const block = draftWovenShirtPlackets(STANDARD_M, { buttonCount: 6, buttonSpacing: 7 });
    const buttons = block.roles.buttonPlacket.marks!.filter((mark) => mark.kind === "button");
    const holes = block.roles.buttonholePlacket.marks!.filter((mark) => mark.kind === "buttonhole");
    expect(buttons).toHaveLength(6);
    expect(holes).toHaveLength(6);
    expect(frontButtonPositions(6, 7)).toEqual([5, 12, 19, 26, 33, 40]);
    expect(frontButtonPositions(6.5, 7)).toEqual([]);
    expect(block.roles.outerStand.marks!.filter((mark) => mark.name === "stand-button")).toHaveLength(1);
    expect(block.roles.innerStand.marks!.filter((mark) => mark.name === "stand-buttonhole")).toHaveLength(1);
    expect(stitchChecks(block, block.stitches).every((check) => check.ok)).toBe(true);
  });

  it("keeps placket length and closure position tied to the live body/options", () => {
    const base = draftWovenShirtPlackets(STANDARD_M);
    const changed = draftWovenShirtPlackets(STANDARD_M, { frontOverlap: 2.5, placketWidth: 4 });
    expect(edgeLength(pieceEdge(base.roles.buttonPlacket, "attachmentRaw"))).toBe(edgeLength(pieceEdge(base.roles.front, "centerFront")));
    const baseButton = base.roles.buttonPlacket.marks!.find((mark) => mark.name === "button-1")!;
    const changedButton = changed.roles.buttonPlacket.marks!.find((mark) => mark.name === "button-1")!;
    if (!("at" in baseButton) || !("at" in changedButton)) throw new Error("button mark missing");
    expect(changedButton.at.x).toBeGreaterThan(baseButton.at.x);
    expect(edgeLength(pieceEdge(changed.roles.buttonPlacket, "top"))).toBeGreaterThan(edgeLength(pieceEdge(base.roles.buttonPlacket, "top")));
  });

  it("can add plackets to a collar block whose construction marks are absent", () => {
    const collar = draftWovenShirtCollar(STANDARD_M);
    const withoutMarks = {
      ...collar,
      roles: {
        ...collar.roles,
        outerStand: { ...collar.roles.outerStand, marks: undefined },
        innerStand: { ...collar.roles.innerStand, marks: undefined },
      },
    };
    const result = addWovenShirtPlackets(withoutMarks);
    expect(result.roles.outerStand.marks).toHaveLength(1);
    expect(result.roles.innerStand.marks).toHaveLength(1);
  });
});
