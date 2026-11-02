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
  poloButtonCountError,
  mapPoloBodyPom,
  poloGuidance,
  poloPomsForOptions,
  resolvePoloOptions,
} from "./polo";
import { rolePiece } from "./block";
import { interfaceLength, stitchChecks } from "./stitch";

describe("Polo shell (Slice 69)", () => {
  it("leaves a shared body POM unchanged when it has no Polo-specific view mapping", () => {
    const unmapped = { label: "Unmapped", measure: () => 1 };
    expect(mapPoloBodyPom(unmapped)).toBe(unmapped);
  });
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

  it("derives two diagonal base clips and a named reinforcement box from the attachment allowance", () => {
    const front = rolePiece(draftPoloShell(STANDARD_M), "front");
    const mark = (name: string) => front.marks?.find((candidate) => candidate.name === name);
    expect(mark("placketBaseClipLeft")).toMatchObject({
      kind: "cutLine", start: { x: 0, y: 22 }, end: { x: 1, y: 21 },
    });
    expect(mark("placketBaseClipRight")).toMatchObject({
      kind: "cutLine", start: { x: 0, y: 22 }, end: { x: 1, y: 23 },
    });
    expect(mark("placketBaseReinforcement")).toMatchObject({
      kind: "placementLine", start: { x: 1, y: 21 }, end: { x: 1, y: 23 },
    });
    expect(front.marks?.some((candidate) => candidate.name === "placketReinforcement")).toBe(false);
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

  it("drafts one centered zipper finish with two matched slit attachments and no button geometry", () => {
    const options = { zipperClosureProfile: 1, buttonCount: 4, placketLength: 14, placketWidth: 3 };
    const drafted = draftPolo(STANDARD_M, options);
    expect(Object.keys(drafted.roles)).toEqual([
      "front", "back", "sleeve", "zipperFinish", "outerStand", "innerStand", "upperCollar", "underCollar",
    ]);
    expect(drafted.roles.buttonPlacket).toBeUndefined();
    expect(drafted.roles.buttonholePlacket).toBeUndefined();
    const finish = rolePiece(drafted, "zipperFinish");
    expect(finish.name).toBe("zipper finish");
    expect(edgeLength(pieceEdge(finish, "top"))).toBeCloseTo(8);
    expect(edgeLength(pieceEdge(finish, "attachmentLeft"))).toBeCloseTo(14);
    expect(edgeLength(pieceEdge(finish, "attachmentRight"))).toBeCloseTo(14);
    expect(finish.marks?.map((mark) => mark.name)).toEqual(expect.arrayContaining([
      "zipperFinishAttachmentLeft", "zipperFinishAttachmentRight", "zipperFinishFold",
      "zipperCenterline", "zipperTapeLeft", "zipperTapeRight", "zipperTopAnchor", "zipperBottomAnchor",
    ]));
    expect(finish.marks?.some((mark) => mark.kind === "button" || mark.kind === "buttonhole")).toBe(false);
    expect(rolePiece(drafted, "front").marks?.map((mark) => mark.name)).toEqual(expect.arrayContaining([
      "zipperTopAnchor", "zipperBottomAnchor", "placketBaseReinforcement",
    ]));
    expect(drafted.stitches.map((stitch) => stitch.label)).toEqual(expect.arrayContaining([
      "Zipper finish left ↔ left front opening", "Zipper finish right ↔ right front opening",
    ]));
    expect(stitchChecks(drafted, drafted.stitches).every((result) => result.ok)).toBe(true);
    const notes = poloGuidance(drafted, STANDARD_M, options);
    expect(notes.some((note) => note.field === "option-buttonCount")).toBe(false);
    expect(notes.some((note) => note.text.includes("fixed button group"))).toBe(false);
    const poms = poloPomsForOptions(options);
    const zipperLength = poms.find((pom) => pom.label === "Modeled zipper opening length")!;
    const zipperWidth = poms.find((pom) => pom.label === "Finished zipper-placket width")!;
    expect(zipperLength.anchor!(drafted)).toEqual(edgeStart(pieceEdge(finish, "attachmentLeft")));
    expect(zipperWidth.measure(drafted)).toBeCloseTo(3);
    const missingFold = {
      ...drafted,
      roles: {
        ...drafted.roles,
        zipperFinish: {
          ...finish,
          marks: finish.marks?.filter((mark) => mark.name !== "zipperFinishFold"),
        },
      },
    };
    expect(() => zipperWidth.measure(missingFold)).toThrow("Polo zipper-finish attachment and fold marks are missing");
    expect(poloPomsForOptions({}).map((pom) => pom.label)).toContain("Button spacing");
  });

  it("routes the shell-level P07 draft through one zipper-finish piece", () => {
    const shell = draftPoloShell(STANDARD_M, { zipperClosureProfile: 1 });
    expect(rolePiece(shell, "zipperFinish").name).toBe("zipper finish");
    expect(shell.roles.buttonPlacket).toBeUndefined();
    expect(shell.roles.buttonholePlacket).toBeUndefined();
  });

  it("keeps P07 opening and width boundaries finite and preserves invalid raw values for guidance", () => {
    for (const placketLength of [14, 22, 30]) {
      for (const placketWidth of [2, 3, 4]) {
        const options = { zipperClosureProfile: 1, placketLength, placketWidth };
        const drafted = draftPolo(STANDARD_M, options);
        expect(stitchChecks(drafted, drafted.stitches).every((result) => result.ok)).toBe(true);
        expect(Number.isFinite(edgeLength(pieceEdge(rolePiece(drafted, "zipperFinish"), "top")))).toBe(true);
      }
    }
    for (const [field, value, label] of [
      ["placketLength", 13.5, "Modeled zipper opening length"],
      ["placketLength", 14.25, "Modeled zipper opening length"],
      ["placketWidth", 4.5, "Finished zipper-placket width"],
      ["placketWidth", 3.25, "Finished zipper-placket width"],
    ] as const) {
      const options = { zipperClosureProfile: 1, [field]: value };
      expect(resolvePoloOptions(options)[field]).toBe(value);
      const notes = poloGuidance(draftPolo(STANDARD_M, options), STANDARD_M, options);
      expect(notes.some((note) => note.field === `option-${field}` && note.text.includes(label))).toBe(true);
    }
    const nonFinite = { zipperClosureProfile: 1, placketLength: Number.NaN };
    expect(Number.isNaN(resolvePoloOptions(nonFinite).placketLength)).toBe(true);
    expect(poloGuidance(draftPolo(STANDARD_M, nonFinite), STANDARD_M, nonFinite))
      .toContainEqual(expect.objectContaining({ field: "option-placketLength", level: "warn", text: expect.stringContaining("finite number") }));
  });

  it("labels an opening that reaches the vent as a modeled zipper opening", () => {
    const options = { zipperClosureProfile: 1, placketLength: 100 };
    const notes = poloGuidance(draftPolo(STANDARD_M, options), STANDARD_M, options);
    expect(notes.some((note) => note.text.includes("Modeled zipper opening reaches the"))).toBe(true);
  });

  it("keeps the selected count matched across both plackets and preserves the spacing POM", () => {
    for (const [count, expected] of [[2, [3.5, 7]], [3, [3.5, 7, 10.5]]] as const) {
      const drafted = draftPolo(STANDARD_M, { buttonCount: count });
      const points = (role: "buttonPlacket" | "buttonholePlacket", kind: "button" | "buttonhole") =>
        rolePiece(drafted, role).marks
          ?.filter((mark): mark is Extract<typeof mark, { readonly at: unknown }> => mark.kind === kind)
          .map((mark) => mark.at) ?? [];
      expect(points("buttonPlacket", "button").map(({ y }) => y)).toEqual(expected);
      expect(points("buttonholePlacket", "buttonhole").map(({ y }) => y)).toEqual(expected);
      expect(points("buttonPlacket", "button")).toEqual(points("buttonholePlacket", "buttonhole"));
      expect(POLO_POMS.find((pom) => pom.label === "Button spacing")!.measure(drafted)).toBeCloseTo(3.5);
    }
  });

  it("retains invalid counts for guidance and shows a complete legacy preview without partial marks", () => {
    for (const buttonCount of [1, 4, 2.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const options = { buttonCount };
      const drafted = draftPolo(STANDARD_M, options);
      const marks = rolePiece(drafted, "buttonPlacket").marks?.filter((mark) => mark.kind === "button");
      const notes = poloGuidance(drafted, STANDARD_M, options);
      expect(marks).toHaveLength(3);
      expect(notes).toContainEqual(expect.objectContaining({ field: "option-buttonCount", level: "warn" }));
    }
    expect(resolvePoloOptions({ buttonCount: Number.NaN }).buttonCount).toBeNaN();
    expect(poloButtonCountError(Number.NaN)).toContain("finite number");
    expect(poloButtonCountError(1)).toContain("2 or 3 buttons");
    expect(poloButtonCountError(4)).toContain("2 or 3 buttons");
    expect(poloButtonCountError(2.5)).toContain("whole number");
    expect(poloButtonCountError(2)).toBeNull();
    expect(poloButtonCountError(3)).toBeNull();
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

  it("keeps zero vent topology uninterrupted and splits enabled vents at aligned tops", () => {
    const closed = draftPolo(STANDARD_M, { sideVentDepth: 0, backHemDrop: 0 });
    expect(rolePiece(closed, "front").edges.map((edge) => edge.name)).toEqual([
      "neckline", "shoulder", "armhole", "side", "hem", "centerFront",
    ]);
    expect(rolePiece(closed, "back").edges.map((edge) => edge.name)).toEqual([
      "neckline", "shoulder", "armhole", "side", "hem", "centerBack",
    ]);
    expect(rolePiece(closed, "front").marks?.some((mark) => mark.name === "ventTop")).toBe(false);

    const open = draftPolo(STANDARD_M);
    const front = rolePiece(open, "front");
    const back = rolePiece(open, "back");
    expect(front.edges.map((edge) => edge.name)).toEqual([
      "neckline", "shoulder", "armhole", "side", "vent", "hem", "centerFront",
    ]);
    expect(edgeEnd(pieceEdge(front, "side")).y).toBeCloseTo(64);
    expect(edgeStart(pieceEdge(front, "vent")).y).toBeCloseTo(64);
    expect(edgeEnd(pieceEdge(front, "vent")).y).toBeCloseTo(70);
    expect(edgeStart(pieceEdge(back, "vent")).y).toBeCloseTo(64);
    expect(edgeEnd(pieceEdge(back, "vent")).y).toBeCloseTo(71.5);
    expect(edgeStart(pieceEdge(back, "hem")).y).toBeCloseTo(71.5);
    expect(front.marks?.some((mark) => mark.name === "ventTop")).toBe(true);
    expect(back.marks?.some((mark) => mark.name === "ventTop")).toBe(true);
    expect(edgeLength(pieceEdge(front, "side"))).toBeCloseTo(edgeLength(pieceEdge(back, "side")));
    expect(stitchChecks(open, open.stitches).every((result) => result.ok)).toBe(true);
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
      expect.objectContaining({ id: "sideVentDepth", defaultValue: 6, min: 0, max: 15, step: 0.5 }),
      expect.objectContaining({ id: "backHemDrop", defaultValue: 1.5, min: 0, max: 5, step: 0.5 }),
    ]));
    expect(POLO_OPTION_DEFINITIONS.every((option) => (option.unit === "cm" || option.unit === "buttons") && option.group && option.help)).toBe(true);
    expect(POLO_OPTION_DEFINITIONS.find((option) => option.id === "buttonCount"))
      .toMatchObject({ unit: "buttons", defaultValue: 3, min: 2, max: 3, step: 1 });
    expect(resolvePoloOptions()).toMatchObject({
      buttonCount: 3,
      standFrontRise: 0.75, collarPointExtension: 1.5, sideVentDepth: 6, backHemDrop: 1.5,
    });

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
    expect(text).toContain("outside the declared 2–4 cm range");
    expect(text).toContain("increase it to at least 14 cm");
    expect(text).toContain("Stand is deeper than the collar leaf");
  });

  it("warns before a long placket runs into the hem allowance", () => {
    const m = { ...STANDARD_M, length: 30 };
    const options = { placketLength: 21, sideVentDepth: 0, backHemDrop: 0 };
    const text = poloGuidance(draftPolo(m, options), m, options)
      .map((note) => note.text).join("\n");
    expect(text).toContain("reaches the hem allowance");
  });

  it("keeps P04's 44 cm boundary correction actionable through the 30 cm placket maximum", () => {
    const measurements = { ...STANDARD_M, chest: 160, length: 44 };
    const minimum = { placketLength: 14, sideVentDepth: 15 };
    const minimumNotes = poloGuidance(draftPolo(measurements, minimum), measurements, minimum)
      .map((note) => note.text).join("\n");
    expect(minimumNotes).not.toContain("Placket reaches the front vent region");

    const maximum = { ...minimum, placketLength: 30 };
    const maximumNotes = poloGuidance(draftPolo(measurements, maximum), measurements, maximum)
      .map((note) => note.text).join("\n");
    expect(maximumNotes).toContain("Placket reaches the front vent region — shorten it to 16.0 cm or less.");
    expect(maximum.placketLength).toBe(30);
  });

  it("reports every crossed Polo collar, vent, drop, and seam risk with a correction", () => {
    const short = { ...STANDARD_M, length: 26 };
    const crossed = {
      placketLength: 30, placketWidth: 5, standHeight: 1, collarLeafDepth: 4,
      standFrontRise: 2, collarPointExtension: 3, sideVentDepth: 2, backHemDrop: 5,
    };
    const text = poloGuidance(draftPolo(short, crossed), short, crossed).map((note) => note.text).join("\n");
    expect(text).toContain("exceeds stand height");
    expect(text).toContain("overwhelms the leaf depth");
    expect(text).toContain("too shallow to finish");
    expect(text).toContain("reaches the upper body");
    expect(text).toContain("exceeds the side vent depth");
    expect(text).toContain("front vent region");

    const negativeCollar = { standHeight: -1 };
    const negativeText = poloGuidance(draftPolo(STANDARD_M, negativeCollar), STANDARD_M, negativeCollar)
      .map((note) => note.text).join("\n");
    expect(negativeText).toContain("must be non-negative");

    const noVent = { sideVentDepth: 0, backHemDrop: 1.5 };
    const noVentText = poloGuidance(draftPolo(STANDARD_M, noVent), STANDARD_M, noVent)
      .map((note) => note.text).join("\n");
    expect(noVentText).toContain("vent is disabled");
    expect(noVentText).toContain("Side seam (front ↔ back) measures");
    const noVentFields = poloGuidance(draftPolo(STANDARD_M, noVent), STANDARD_M, noVent)
      .filter((note) => note.level === "warn").map((note) => note.field);
    expect(noVentFields).toContain("option-backHemDrop");
    expect(noVentFields).not.toContain("polo-collar");
    expect(noVentFields).not.toContain("polo-seam");

    const renamedMismatch = { ...draftPolo(STANDARD_M, noVent), stitches: draftPolo(STANDARD_M, noVent).stitches.map((stitch) =>
      stitch.label === "Side seam (front ↔ back)" ? { ...stitch, label: "Other interface" } : stitch) };
    expect(poloGuidance(renamedMismatch, STANDARD_M, noVent).find((note) => note.text.startsWith("Other interface measures")))
      .toMatchObject({ field: "option-placketLength", level: "warn" });
    const noVentNoDrop = { sideVentDepth: 0, backHemDrop: 0 };
    const validZeroDrop = draftPolo(STANDARD_M, noVentNoDrop);
    const brokenInterface = { ...validZeroDrop, stitches: validZeroDrop.stitches.map((stitch) =>
      stitch.label === "Side seam (front ↔ back)" ? { ...stitch, a: { edges: [{ piece: "front", edge: "hem" }] } } : stitch) };
    expect(poloGuidance(brokenInterface, STANDARD_M, noVentNoDrop).find((note) => note.text.startsWith("Side seam (front ↔ back) measures")))
      .toMatchObject({ field: "option-sideVentDepth", level: "warn" });
  });

  it("reports live V2 POMs for rise, point, vent, separate lengths, and drop", () => {
    const block = draftPolo(STANDARD_M);
    const value = (label: string) => POLO_POMS.find((pom) => pom.label === label)!.measure(block);
    expect(value("Finished placket length")).toBeCloseTo(14, 3);
    expect(value("Finished placket width")).toBeCloseTo(3, 3);
    expect(value("Button spacing")).toBeCloseTo(3.5, 3);
    expect(value("Finished collar stand height")).toBeCloseTo(2, 3);
    expect(value("Finished pointed collar leaf")).toBeCloseTo(5, 3);
    expect(value("Stand front rise")).toBeCloseTo(0.75, 3);
    expect(value("Collar point extension")).toBeCloseTo(1.5, 3);
    expect(value("Front side-vent depth")).toBeCloseTo(6, 3);
    expect(value("Back side-vent depth")).toBeCloseTo(7.5, 3);
    expect(value("Front body length (HPS–hem)")).toBeCloseTo(70, 3);
    expect(value("Back body length (HPS–hem)")).toBeCloseTo(71.5, 3);
    expect(value("Back hem drop")).toBeCloseTo(1.5, 3);

    const closed = draftPolo(STANDARD_M, { sideVentDepth: 0, backHemDrop: 0 });
    expect(POLO_POMS.find((pom) => pom.label === "Front side-vent depth")!.measure(closed)).toBe(0);
    expect(POLO_POMS.find((pom) => pom.label === "Back side-vent depth")!.measure(closed)).toBe(0);
  });

  it("declares no allowance on folds and real allowance on stand, collar, and placket edges", () => {
    expect(POLO_ALLOWANCES.byEdge).toMatchObject({
      centerFront: 0, centerBack: 0, attachmentRaw: 1, neckline: 1, collar: 1,
      backNeckline: 1, frontNeckline: 1, backCollar: 1, frontCollar: 1,
      backCollarBase: 1, frontCollarBase: 1, vent: 1, frontTip: 1,
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
