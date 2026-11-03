import { describe, expect, it } from "vitest";
import { blockPieces, edgeEnd, edgeLength, edgeStart, pieceEdge, rolePiece, stitchChecks, STANDARD_M } from "./index";
import { point } from "../geometry";
import { seamAllowance } from "../render/allowance";
import { addWovenShirtCollar, addWovenShirtHemVent, addWovenShirtPlackets, addWovenShirtYoke, draftWovenShirt, draftWovenShirtBody, draftWovenShirtCollar, draftWovenShirtPlackets, draftWovenShirtPocket, draftWovenShirtSleeves, draftWovenShirtYoke, frontButtonPositions, wovenHipStationY, wovenShirtHipStationY, wovenShirtBodyHalfWidths, wovenShirtAllowances, wovenShirtGuidance, WOVEN_SHIRT_ALLOWANCES, WOVEN_SHIRT_BODY_STITCHES, WOVEN_SHIRT_COLLAR_STITCHES, WOVEN_SHIRT_POMS } from "./shirt";

describe("W04 cropped boxy Woven Shirt profile", () => {
  const measurements = { ...STANDARD_M, chest: 88, waist: 96, hip: 104, ease: 24, length: 54 };

  it("blends all body widths toward the largest girth without changing measurements", () => {
    const original = { ...measurements };
    expect(wovenShirtBodyHalfWidths(measurements, 0)).toEqual({ chestHalf: 28, waistHalf: 30, hipHalf: 32 });
    expect(wovenShirtBodyHalfWidths(measurements, 50)).toEqual({ chestHalf: 30, waistHalf: 31, hipHalf: 32 });
    expect(wovenShirtBodyHalfWidths(measurements, 100)).toEqual({ chestHalf: 32, waistHalf: 32, hipHalf: 32 });

    const body = draftWovenShirtBody(measurements, { boxySideProfile: 100 });
    const front = body.roles.front;
    expect(edgeEnd(pieceEdge(front, "armhole")).x).toBe(32);
    expect(edgeEnd(pieceEdge(front, "sideUpper")).x).toBe(32);
    expect(edgeEnd(pieceEdge(front, "sideMiddle")).x).toBe(32);
    expect(edgeEnd(pieceEdge(front, "sideLower")).x).toBe(32);
    expect(measurements).toEqual(original);
  });

  it("preserves invalid profile values and gives range, step and sleeve guidance", () => {
    const offStep = { boxySideProfile: 55 };
    expect(wovenShirtGuidance(draftWovenShirtBody(measurements, offStep), measurements, offStep)
      .find((note) => note.field === "option-boxySideProfile")?.text).toContain("10% increments");
    const outside = { boxySideProfile: 110 };
    expect(wovenShirtGuidance(draftWovenShirtBody(measurements, outside), measurements, outside)
      .find((note) => note.field === "option-boxySideProfile")?.text).toContain("outside the 0–100 % design range");
    const conflictMeasurements = { ...measurements, bicep: 100 };
    expect(wovenShirtGuidance(draftWovenShirtBody(conflictMeasurements, { boxySideProfile: 100 }),
      conflictMeasurements, { boxySideProfile: 100 }).find((note) => note.field === "bicep")?.text)
      .toContain("W04 armhole seam");
    expect(wovenShirtGuidance(draftWovenShirtBody(measurements, { boxySideProfile: 0 }),
      measurements, { boxySideProfile: 0 }).some((note) => note.field === "bicep")).toBe(false);
  });

  it("recomputes the W04 sleeve from the transformed armhole and keeps seam checks available", () => {
    const legacy = draftWovenShirt(measurements, { boxySideProfile: 0 });
    const boxy = draftWovenShirt(measurements, { boxySideProfile: 100 });
    const legacySleeve = edgeLength(pieceEdge(legacy.roles.sleeve, "capLeft"))
      + edgeLength(pieceEdge(legacy.roles.sleeve, "capRight"));
    const boxySleeve = edgeLength(pieceEdge(boxy.roles.sleeve, "capLeft"))
      + edgeLength(pieceEdge(boxy.roles.sleeve, "capRight"));
    expect(boxySleeve).not.toBe(legacySleeve);
    expect(stitchChecks(boxy, boxy.stitches).every((check) => check.ok)).toBe(true);
  });

  it("keeps the W04 hip-width station inside the crop without changing body measurements", () => {
    const cropped = { ...measurements };
    const original = { ...cropped };
    expect(wovenHipStationY(cropped.length, cropped.armholeDepth, cropped.hipDepth)).toBeGreaterThan(cropped.length);

    const block = draftWovenShirt(cropped, { boxySideProfile: 100 });
    expect(wovenShirtHipStationY(cropped, 3, true)).toBe(cropped.length - 4);
    expect(edgeEnd(pieceEdge(block.roles.front, "sideMiddle")).y).toBe(cropped.length - 4);
    expect(edgeLength(pieceEdge(block.roles.front, "sideLower"))).toBe(1);
    expect(stitchChecks(block, block.stitches).every((check) => check.ok)).toBe(true);
    const notes = wovenShirtGuidance(block, cropped, { boxySideProfile: 100 });
    expect(notes.some((note) => note.level === "warn" && note.field === "hipDepth")).toBe(false);
    expect(notes.find((note) => note.level === "info" && note.field === "hipDepth")?.text)
      .toContain("1 cm above the side-vent opening");
    expect(cropped).toEqual(original);
  });
});

describe("woven shirt body", () => {
  it("closes a zero-depth vent without a degenerate edge, marker, or non-finite cut coordinates", () => {
    const block = draftWovenShirt(STANDARD_M, { sideVentDepth: 0 });
    expect(WOVEN_SHIRT_POMS.find((pom) => pom.label === "Side vent depth")?.anchorAvailable?.(block)).toBe(false);
    const pieces = blockPieces(block);
    for (const role of ["front", "back"]) {
      const piece = block.roles[role];
      expect(piece.edges.some((edge) => edge.name === "vent")).toBe(false);
      expect(piece.marks?.some((mark) => mark.name === "ventTop") ?? false).toBe(false);
      const side = pieceEdge(piece, "sideLower");
      const hem = pieceEdge(piece, "hem");
      expect(edgeEnd(side)).toEqual(edgeStart(hem));
      const cut = seamAllowance(piece, WOVEN_SHIRT_ALLOWANCES);
      expect(cut.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
    }
    expect(pieces.flatMap((piece) => seamAllowance(piece, WOVEN_SHIRT_ALLOWANCES))
      .every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
    expect(stitchChecks(block, block.stitches).every((check) => check.ok)).toBe(true);
  });

  it("preserves a nonzero vent edge and exact vent-top mark geometry", () => {
    const block = draftWovenShirt(STANDARD_M, { sideVentDepth: 0.5 });
    expect(WOVEN_SHIRT_POMS.find((pom) => pom.label === "Side vent depth")?.anchorAvailable?.(block)).toBe(true);
    const front = block.roles.front;
    const back = block.roles.back;
    for (const piece of [front, back]) {
      const vent = pieceEdge(piece, "vent");
      expect(edgeLength(vent)).toBe(0.5);
      expect(piece.marks?.find((mark) => mark.name === "ventTop")).toMatchObject({ at: edgeStart(vent) });
    }
  });

  it("applies the selected hem-turn allowance only to the two body hems", () => {
    expect(wovenShirtAllowances(1.25).byPieceEdge).toMatchObject({
      "woven front": { hem: 1.25 }, "woven back lower": { hem: 1.25 },
    });
    expect(() => wovenShirtAllowances(Number.NaN)).toThrow("Hem turn is outside its supported range.");
    expect(() => wovenShirtAllowances(-0.1)).toThrow("Hem turn is outside its supported range.");
    expect(() => wovenShirtAllowances(9)).toThrow("Hem turn is outside its supported range.");
  });

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

  it("reports actionable warnings for invalid combinations instead of hiding them", () => {
    const notes = wovenShirtGuidance(draftWovenShirtBody(STANDARD_M),
      { ...STANDARD_M, neck: 50, shoulderWidth: 20, armholeDepth: 8 }, {
        neckEase: 3, buttonCount: 5, buttonSpacing: 9, frontOverlap: 4,
        placketWidth: 2, standHeight: 8, collarLeafDepth: 4, yokeDepth: 2,
        pocketWidth: 8, pocketHeight: 9, sleeveBandDepth: 1, sideVentDepth: -1, hemTurn: 0,
      });
    expect(notes.filter((note) => note.level === "warn").length).toBeGreaterThanOrEqual(13);
    expect(notes.some((note) => note.text.includes("Front placket buttons") && note.text.includes("buttons"))).toBe(true);
    expect(notes.some((note) => note.text.includes("shoulder seam"))).toBe(true);
    expect(notes.some((note) => note.text.includes("below the underarm"))).toBe(true);
    const shortBlock = draftWovenShirtBody({ ...STANDARD_M, length: 55 });
    const shortNotes = wovenShirtGuidance(shortBlock, { ...STANDARD_M, length: 55 }, { buttonCount: 7, buttonSpacing: 9 });
    expect(shortNotes.some((note) => note.text.includes("last front button"))).toBe(true);
  });

  it("moves both W03 shoulder endpoints and recalculates the armhole curves", () => {
    const options = { shoulderExtension: 4, shoulderDrop: 3 };
    const base = draftWovenShirtBody(STANDARD_M);
    const w03 = draftWovenShirtBody(STANDARD_M, options);
    for (const role of ["front", "back"] as const) {
      const baseShoulder = pieceEdge(base.roles[role], "shoulder");
      const shoulder = pieceEdge(w03.roles[role], "shoulder");
      const armhole = pieceEdge(w03.roles[role], "armhole");
      expect(edgeStart(shoulder)).toEqual(edgeStart(baseShoulder));
      expect(edgeEnd(shoulder)).toEqual(point(STANDARD_M.shoulderWidth / 2 + 4, 5.5));
      expect(armhole.kind).toBe("curve");
      if (armhole.kind !== "curve") throw new Error("W03 armhole must remain a curve");
      expect(armhole.curve.start).toEqual(edgeEnd(shoulder));
      expect(armhole.curve.control1).toEqual(point(STANDARD_M.shoulderWidth / 2 + 4, 5.5 + (STANDARD_M.armholeDepth - 5.5) * 0.45));
      expect(armhole).not.toEqual(pieceEdge(base.roles[role], "armhole"));
    }
    expect(stitchChecks(w03, w03.stitches).every((check) => check.ok)).toBe(true);
  });

  it("matches the sleeve cap to the changed W03 armhole and keeps body chest POM derived", () => {
    const measurements = { ...STANDARD_M, ease: 28 };
    const options = { shoulderExtension: 4, shoulderDrop: 3 };
    const base = draftWovenShirt(STANDARD_M);
    const w03 = draftWovenShirt(measurements, options);
    const armholeLength = edgeLength(pieceEdge(w03.roles.front, "armhole"))
      + edgeLength(pieceEdge(w03.roles.yoke, "armholeUpper"))
      + edgeLength(pieceEdge(w03.roles.back, "armholeLower"));
    const capLength = edgeLength(pieceEdge(w03.roles.sleeve, "capLeft"))
      + edgeLength(pieceEdge(w03.roles.sleeve, "capRight"));
    expect(capLength - armholeLength).toBeCloseTo(1.5, 1);
    expect(stitchChecks(w03, w03.stitches).every((check) => check.ok)).toBe(true);
    const bodyChest = WOVEN_SHIRT_POMS.find((pom) => pom.label === "Body chest (finished)")!;
    expect(bodyChest.measure(base)).toBe(STANDARD_M.chest + STANDARD_M.ease);
    expect(bodyChest.measure(w03)).toBe(measurements.chest + measurements.ease);
    expect(bodyChest.measure(w03)).toBeGreaterThan(bodyChest.measure(base));
    expect(wovenShirtGuidance(w03, measurements, options).some((note) => note.field === "bicep")).toBe(false);
  });

  it("adds sleeve caps for legacy and partial or complete W03 shoulder options", () => {
    for (const options of [{}, { shoulderExtension: 4 }, { shoulderDrop: 3 }, { shoulderExtension: 4, shoulderDrop: 3 }]) {
      const block = draftWovenShirtSleeves(STANDARD_M, options);
      const backEdge = block.roles.back.edges.some((edge) => edge.name === "armholeLower") ? "armholeLower" : "armhole";
      const yokeUpper = block.roles.yoke.edges.some((edge) => edge.name === "armholeUpper")
        ? edgeLength(pieceEdge(block.roles.yoke, "armholeUpper"))
        : 0;
      const armholeLength = edgeLength(pieceEdge(block.roles.front, "armhole"))
        + yokeUpper + edgeLength(pieceEdge(block.roles.back, backEdge));
      const capLength = edgeLength(pieceEdge(block.roles.sleeve, "capLeft"))
        + edgeLength(pieceEdge(block.roles.sleeve, "capRight"));
      expect(capLength - armholeLength).toBeCloseTo(1.5, 1);
      expect(stitchChecks(block, block.stitches).every((check) => check.ok)).toBe(true);
    }
  });

  it("warns on W03 shoulder/underarm and yoke conflicts while preserving authored values", () => {
    const measurements = { ...STANDARD_M, chest: 60, shoulderWidth: 60, ease: 0, armholeDepth: 6 };
    const options = { shoulderExtension: 8, shoulderDrop: 4, yokeDepth: 7 };
    const notes = wovenShirtGuidance(draftWovenShirtBody(measurements, options), measurements, options);
    expect(notes.find((note) => note.field === "option-shoulderExtension")?.text)
      .toContain("reduce shoulder extension or increase body ease");
    expect(notes.find((note) => note.field === "option-shoulderDrop")?.text)
      .toContain("reduce shoulder drop or increase armhole depth");
    expect(notes.find((note) => note.field === "option-yokeDepth")?.text)
      .toContain("must sit below the shoulder at 6.5 cm and above the underarm at 6 cm");
    expect(options).toEqual({ shoulderExtension: 8, shoulderDrop: 4, yokeDepth: 7 });

    const shallowOptions = { yokeDepth: 7, shoulderExtension: 4, shoulderDrop: 4.5 };
    const shallowYoke = wovenShirtGuidance(draftWovenShirtBody(STANDARD_M, shallowOptions), STANDARD_M, shallowOptions);
    expect(shallowYoke.find((note) => note.field === "option-yokeDepth")?.text)
      .toContain("must sit below the shoulder at 7 cm");

    const bicepConflict = { ...STANDARD_M, bicep: 100 };
    const bicepNotes = wovenShirtGuidance(draftWovenShirtBody(bicepConflict, { shoulderExtension: 4, shoulderDrop: 3 }), bicepConflict, { shoulderExtension: 4, shoulderDrop: 3 });
    expect(bicepNotes.find((note) => note.field === "bicep")?.text)
      .toContain("reduce the bicep value or increase armhole depth");
    expect(bicepConflict.bicep).toBe(100);
  });

  it("flags a woven hip station below the hem and keeps all three inputs unchanged", () => {
    const invalid = { ...STANDARD_M, length: 45, armholeDepth: 24, hipDepth: 20 };
    expect(wovenHipStationY(invalid.length, invalid.armholeDepth, invalid.hipDepth)).toBeCloseTo(51.35, 8);
    const note = wovenShirtGuidance(draftWovenShirtBody(invalid), invalid)
      .find((candidate) => candidate.field === "hipDepth");
    expect(note).toMatchObject({ level: "warn" });
    expect(note!.text).toContain("below the hem at y=45 cm");
    expect(note!.text).toContain("increase top length");
    expect(note!.text).toContain("reduce the underarm drop or hip depth");
    expect(note!.text).toContain("Values stay unchanged");
    expect(invalid).toMatchObject({ length: 45, armholeDepth: 24, hipDepth: 20 });

    const ordinary = { ...STANDARD_M };
    expect(wovenHipStationY(ordinary.length, ordinary.armholeDepth, ordinary.hipDepth))
      .toBeLessThan(ordinary.length);
    expect(wovenShirtGuidance(draftWovenShirtBody(ordinary), ordinary)
      .some((candidate) => candidate.field === "hipDepth")).toBe(false);
  });

  it("uses button units without duplicating the whole-number warning", () => {
    const block = draftWovenShirtBody(STANDARD_M);
    const outOfRange = wovenShirtGuidance(block, STANDARD_M, { buttonCount: 8 });
    expect(outOfRange.filter((note) => note.text.includes("Front placket buttons"))).toHaveLength(1);
    expect(outOfRange.find((note) => note.text.includes("Front placket buttons"))!.text).toContain("buttons");
    const fractional = wovenShirtGuidance(block, STANDARD_M, { buttonCount: 6.5 });
    expect(fractional).toHaveLength(1);
    expect(fractional[0].text).toContain("whole number");
  });

  it("fails loudly when a button POM loses its point mark", () => {
    const block = draftWovenShirtPlackets(STANDARD_M);
    const broken = {
      ...block,
      roles: { ...block.roles, buttonPlacket: { ...block.roles.buttonPlacket, marks: [] } },
    };
    expect(() => WOVEN_SHIRT_POMS[5].measure(broken)).toThrow("has no point mark");
  });
});
