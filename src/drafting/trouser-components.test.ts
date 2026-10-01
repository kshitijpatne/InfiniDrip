import { describe, it, expect } from "vitest";
import {
  blockPieces,
  edgeLength,
  pieceEdge,
  rolePiece,
  stitchChecks,
} from "./index";
import {
  draftTrouserWithClosure,
  trouserFly,
  trouserLegsComponent,
  trouserWaistband,
} from "./trouser";
import { DEFAULT_TROUSER_OPTIONS } from "./trouser-contract";
import { STANDARD_M } from "./measurements";

describe("trouser waistband and closure components", () => {
  it("drafts a separate full waistband with placement and fastening marks", () => {
    const result = trouserWaistband(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    const band = result.pieces.waistband;
    expect(band.name).toBe("trouser waistband");
    expect(band.onFold).toBe(false);
    expect(band.edges.map((edge) => edge.name)).toEqual(["top", "endRight", "bottom", "endLeft"]);
    expect(edgeLength(pieceEdge(band, "bottom"))).toBeCloseTo(STANDARD_M.waist + STANDARD_M.ease);
    expect(result.interfaces.bottom.edges).toEqual([{ piece: "waistband", edge: "bottom" }]);
    expect(band.marks?.map((mark) => mark.name)).toEqual([
      "centerBack", "centerFront", "waistbandButton",
    ]);
    expect(band.marks?.find((mark) => mark.name === "waistbandButton")?.kind).toBe("button");
  });

  it("keeps waistband depth and the fly length live", () => {
    const base = trouserWaistband(STANDARD_M, DEFAULT_TROUSER_OPTIONS).pieces.waistband;
    const changed = trouserWaistband(STANDARD_M, { ...DEFAULT_TROUSER_OPTIONS, waistbandDepth: 6 }).pieces.waistband;
    expect(edgeLength(pieceEdge(changed, "endRight"))).toBe(6);
    expect(edgeLength(pieceEdge(changed, "bottom"))).toBe(edgeLength(pieceEdge(base, "bottom")));

    const flyComponent = trouserFly(STANDARD_M, { ...DEFAULT_TROUSER_OPTIONS, flyLength: 19 });
    const fly = flyComponent.pieces.flyShield;
    const underlap = flyComponent.pieces.flyUnderlap;
    expect(edgeLength(pieceEdge(fly, "left"))).toBe(19);
    expect(edgeLength(pieceEdge(underlap, "frontEdge"))).toBe(19);
    expect(edgeLength(pieceEdge(underlap, "shieldEdge"))).toBe(19);
    expect(edgeLength(pieceEdge(underlap, "top"))).toBe(3.5);
    expect(edgeLength(pieceEdge(underlap, "bottom"))).toBe(3.5);
    expect(fly.marks?.some((mark) => mark.name === "flyFold")).toBe(true);
    expect(fly.marks?.some((mark) => mark.name === "waistbandButtonhole" && mark.kind === "buttonhole")).toBe(true);
    expect(flyComponent.stitches).toEqual([expect.objectContaining({
      label: "Fly underlap ↔ shield",
      a: { edges: [{ piece: "flyUnderlap", edge: "shieldEdge" }] },
      b: { edges: [{ piece: "flyShield", edge: "right" }] },
    })]);
    expect(flyComponent.interfaces.right.edges)
      .toEqual([{ piece: "flyShield", edge: "right" }]);
    expect(flyComponent.interfaces.underlapFront.edges)
      .toEqual([{ piece: "flyUnderlap", edge: "frontEdge" }]);
  });

  it("packages the leg block as a component without changing its roles", () => {
    const result = trouserLegsComponent(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    expect(Object.keys(result.pieces)).toEqual(["frontLeft", "frontRight", "backLeft", "backRight"]);
    expect(result.stitches).toHaveLength(5);
    expect(result.interfaces).toEqual({});
  });

  it("assembles the legs, full waistband, and fly with explicit passing seams", () => {
    const b = draftTrouserWithClosure(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    expect(blockPieces(b).map((piece) => piece.name)).toEqual([
      "trouser front left", "trouser front right", "trouser back left", "trouser back right",
      "trouser waistband", "trouser fly shield", "trouser fly underlap",
    ]);
    expect(b.stitches.map((stitch) => stitch.label)).toEqual([
      "Left side seam (front ↔ back)", "Right side seam (front ↔ back)",
      "Left inseam (front ↔ back)", "Right inseam (front ↔ back)",
      "Center-back seam (left ↔ right)", "Fly underlap ↔ shield",
      "Waistband (four legs ↔ separate waistband)",
      "Left front fly ↔ shield", "Right front fly ↔ underlap",
    ]);
    expect(stitchChecks(b, b.stitches).every((check) => check.ok)).toBe(true);
    expect(rolePiece(b, "frontLeft").marks?.some((mark) => mark.name === "flyEdge")).toBe(true);
    expect(rolePiece(b, "frontRight").marks?.some((mark) => mark.name === "flyEdge")).toBe(true);
    const waist = b.stitches.find((stitch) => stitch.label === "Waistband (four legs ↔ separate waistband)")!;
    expect(waist.a.edges).toEqual([
      { piece: "backLeft", edge: "waist" }, { piece: "frontLeft", edge: "waist", reversed: true },
      { piece: "frontRight", edge: "waist" }, { piece: "backRight", edge: "waist", reversed: true },
    ]);
  });

  it("changes the actual band, fly, and front marks when options change", () => {
    const base = draftTrouserWithClosure(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    const changed = draftTrouserWithClosure(STANDARD_M, {
      ...DEFAULT_TROUSER_OPTIONS, waistbandDepth: 6, flyLength: 20,
    });
    expect(edgeLength(pieceEdge(rolePiece(changed, "waistband"), "endRight")))
      .toBeGreaterThan(edgeLength(pieceEdge(rolePiece(base, "waistband"), "endRight")));
    expect(edgeLength(pieceEdge(rolePiece(changed, "flyShield"), "right")))
      .toBeGreaterThan(edgeLength(pieceEdge(rolePiece(base, "flyShield"), "right")));
    expect(edgeLength(pieceEdge(rolePiece(changed, "flyUnderlap"), "frontEdge")))
      .toBeGreaterThan(edgeLength(pieceEdge(rolePiece(base, "flyUnderlap"), "frontEdge")));
    const baseMark = rolePiece(base, "frontLeft").marks!.find((mark) => mark.name === "flyEdge")!;
    const changedMark = rolePiece(changed, "frontLeft").marks!.find((mark) => mark.name === "flyEdge")!;
    if (!("start" in baseMark) || !("start" in changedMark)) throw new Error("fly line mark missing");
    expect(edgeLength({ kind: "line", name: "fly", start: changedMark.start, end: changedMark.end }))
      .toBeGreaterThan(edgeLength({ kind: "line", name: "fly", start: baseMark.start, end: baseMark.end }));
  });
});
