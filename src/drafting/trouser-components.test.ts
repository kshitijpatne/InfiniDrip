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

    const fly = trouserFly(STANDARD_M, { ...DEFAULT_TROUSER_OPTIONS, flyLength: 19 }).pieces.flyShield;
    expect(edgeLength(pieceEdge(fly, "left"))).toBe(19);
    expect(fly.marks?.some((mark) => mark.name === "flyFold")).toBe(true);
    expect(fly.marks?.some((mark) => mark.name === "waistbandButtonhole" && mark.kind === "buttonhole")).toBe(true);
    expect(trouserFly(STANDARD_M, DEFAULT_TROUSER_OPTIONS).interfaces.right.edges)
      .toEqual([{ piece: "flyShield", edge: "right" }]);
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
      "trouser waistband", "trouser fly shield",
    ]);
    expect(b.stitches.map((stitch) => stitch.label)).toEqual([
      "Left side seam (front ↔ back)", "Right side seam (front ↔ back)",
      "Left inseam (front ↔ back)", "Right inseam (front ↔ back)",
      "Center-back seam (left ↔ right)", "Waistband (four legs ↔ separate waistband)",
      "Left front fly ↔ shield", "Right front fly ↔ shield",
    ]);
    expect(stitchChecks(b, b.stitches).every((check) => check.ok)).toBe(true);
    expect(rolePiece(b, "frontLeft").marks?.some((mark) => mark.name === "flyEdge")).toBe(true);
    expect(rolePiece(b, "frontRight").marks?.some((mark) => mark.name === "flyEdge")).toBe(true);
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
    const baseMark = rolePiece(base, "frontLeft").marks!.find((mark) => mark.name === "flyEdge")!;
    const changedMark = rolePiece(changed, "frontLeft").marks!.find((mark) => mark.name === "flyEdge")!;
    if (!("start" in baseMark) || !("start" in changedMark)) throw new Error("fly line mark missing");
    expect(edgeLength({ kind: "line", name: "fly", start: changedMark.start, end: changedMark.end }))
      .toBeGreaterThan(edgeLength({ kind: "line", name: "fly", start: baseMark.start, end: baseMark.end }));
  });
});
