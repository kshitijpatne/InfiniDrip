import { describe, expect, it } from "vitest";
import { edgeLength, edgeStart, pieceEdge, rolePiece, stitchChecks, STANDARD_M } from "./index";
import { point } from "../geometry";
import { addWovenShirtCollar, addWovenShirtHemVent, addWovenShirtPlackets, addWovenShirtYoke, draftWovenShirtBody, draftWovenShirtCollar, draftWovenShirtPlackets, draftWovenShirtPocket, draftWovenShirtSleeves, draftWovenShirtYoke, frontButtonPositions, WOVEN_SHIRT_BODY_STITCHES, WOVEN_SHIRT_COLLAR_STITCHES } from "./shirt";

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

  it("splits the real back armhole into a lower back and two-layer yoke", () => {
    const block = draftWovenShirtYoke(STANDARD_M);
    const back = block.roles.back;
    const yoke = block.roles.yoke;
    expect(back.edges.map((e) => e.name)).toEqual(["centerBack", "yokeSeam", "armholeLower", "sideUpper", "sideMiddle", "sideLower", "hem"]);
    expect(yoke.edges.map((e) => e.name)).toEqual(["centerBack", "neckline", "shoulder", "armholeUpper", "yokeSeam"]);
    expect(back.onFold).toBe(true);
    expect(stitchChecks(block, block.stitches).every((check) => check.ok)).toBe(true);
    expect(edgeLength(pieceEdge(back, "yokeSeam"))).toBe(edgeLength(pieceEdge(yoke, "yokeSeam")));
  });

  it("keeps yoke depth live and places one patch pocket on the front", () => {
    const base = draftWovenShirtPocket(STANDARD_M);
    const changed = draftWovenShirtPocket(STANDARD_M, { yokeDepth: 13, pocketWidth: 14, pocketHeight: 15 });
    expect(edgeStart(pieceEdge(changed.roles.back, "yokeSeam")).y).toBe(13);
    expect(edgeLength(pieceEdge(changed.roles.pocket, "sideRight"))).toBe(15);
    expect(edgeLength(pieceEdge(changed.roles.pocket, "top"))).toBe(14);
    expect(changed.roles.front.marks!.some((mark) => mark.name === "pocketPlacement")).toBe(true);
    expect(stitchChecks(changed, changed.stitches).every((check) => check.ok)).toBe(true);
    expect(edgeLength(pieceEdge(base.roles.pocket, "top"))).not.toBe(edgeLength(pieceEdge(changed.roles.pocket, "top")));
  });

  it("routes collar measurement through the yoke neckline and rejects a non-curve armhole", () => {
    const collaredYoke = addWovenShirtCollar(draftWovenShirtYoke(STANDARD_M));
    expect(collaredYoke.stitches.some((stitch) => stitch.label === "Outer stand ↔ woven neckline" && stitch.b.edges.some((ref) => ref.piece === "yoke"))).toBe(true);
    const body = draftWovenShirtBody(STANDARD_M);
    const back = body.roles.back;
    const nonCurve = {
      ...body,
      roles: {
        ...body.roles,
        back: { ...back, edges: back.edges.map((edge) => edge.name === "armhole"
          ? { kind: "line" as const, name: "armhole", start: point(1, 1), end: point(2, 2) }
          : edge) },
      },
    };
    expect(() => addWovenShirtYoke(nonCurve)).toThrow("must be a curve");
  });

  it("adds a woven sleeve and folded band fitted to the assembled armscye", () => {
    const block = draftWovenShirtSleeves(STANDARD_M);
    expect(block.roles.sleeve.name).toBe("woven short sleeve");
    expect(block.roles.sleeveBand.name).toBe("woven folded sleeve band");
    expect(stitchChecks(block, block.stitches).every((check) => check.ok)).toBe(true);
    const capChecks = block.stitches.filter((stitch) => stitch.label === "Woven sleeve-cap ease");
    expect(capChecks).toHaveLength(1);
    const band = draftWovenShirtSleeves(STANDARD_M, { sleeveBandDepth: 4 }).roles.sleeveBand;
    expect(edgeLength(pieceEdge(band, "sideRight"))).toBe(4);
  });

  it("turns body hems into curved edges and keeps the vent open segment explicit", () => {
    const base = draftWovenShirtPocket(STANDARD_M);
    const block = addWovenShirtHemVent(base, { sideVentDepth: 4 });
    for (const role of ["front", "back"]) {
      expect(pieceEdge(block.roles[role], "hem").kind).toBe("curve");
      expect(edgeLength(pieceEdge(block.roles[role], "vent"))).toBe(4);
      expect(block.roles[role].marks!.some((mark) => mark.name === "ventTop")).toBe(true);
    }
    expect(stitchChecks(block, block.stitches).every((check) => check.ok)).toBe(true);
  });
});
