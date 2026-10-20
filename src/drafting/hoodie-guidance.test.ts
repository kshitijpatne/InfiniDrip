import { describe, expect, it } from "vitest";
import { point, type Point } from "../geometry";
import { gradeMeasurements } from "./grading";
import { STANDARD_M } from "./measurements";
import { draftHoodie } from "./hoodie";
import {
  HOODIE_DEFAULT_OPTIONS,
  HOODIE_OPTION_DEFINITIONS,
  resolveHoodieOptions,
  type HoodieOptions,
} from "./hoodie-contract";
import { hoodieGuidance } from "./hoodie-guidance";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "./tshirt-grade";
import type { Block } from "./block";
import type { Piece } from "./piece";

function draft(options: HoodieOptions = HOODIE_DEFAULT_OPTIONS, step = 0): { readonly block: Block; readonly measurements: typeof STANDARD_M } {
  const measurements = gradeMeasurements(STANDARD_M, TSHIRT_GRADE, step);
  return { block: draftHoodie(measurements, options), measurements };
}

function notesFor(options: Partial<HoodieOptions> = {}, step = 0) {
  const resolved = resolveHoodieOptions(options);
  const { block, measurements } = draft(resolved, step);
  return hoodieGuidance(block, measurements, options);
}

function shifted(piece: Piece, dy: number): Piece {
  return {
    ...piece,
    edges: piece.edges.map((edge) => edge.kind === "line"
      ? {
          ...edge,
          start: { x: edge.start.x, y: edge.start.y + dy },
          end: { x: edge.end.x, y: edge.end.y + dy },
        }
      : edge),
  };
}

function replaceSleeveHem(block: Block, start: Point, end: Point): Block {
  const sleeve = block.roles.sleeveLeft!;
  return {
    ...block,
    roles: {
      ...block.roles,
      sleeveLeft: {
        ...sleeve,
        edges: sleeve.edges.map((edge) => edge.name === "hem"
          ? { kind: "line", name: "hem", start, end }
          : edge),
      },
    },
  };
}

describe("hoodieGuidance", () => {
  it("keeps the live default pouch inside every XS–XL front panel", () => {
    for (const size of TSHIRT_SIZES) {
      const { block, measurements } = draft(HOODIE_DEFAULT_OPTIONS, size.step);
      expect(hoodieGuidance(block, measurements, HOODIE_DEFAULT_OPTIONS)).toEqual([]);
    }
  });

  it("warns on non-finite, out-of-range, and off-step raw values for every Hoodie option", () => {
    const { block, measurements } = draft();
    for (const definition of HOODIE_OPTION_DEFINITIONS) {
      const field = definition.id as keyof HoodieOptions;
      for (const [value, expected, blocksGeometry] of [
        [Number.NaN, "must be finite", true],
        [definition.min - definition.step, "outside", true],
        [definition.min + definition.step / 2, "step", false],
      ] as const) {
        const raw = { [field]: value } as Partial<HoodieOptions>;
        const notes = hoodieGuidance(block, measurements, raw);
        const fieldNotes = notes.filter(({ field: noteField }) => noteField === definition.id);
        if (blocksGeometry) expect(notes).toHaveLength(1);
        expect(fieldNotes.some(({ level, text }) => level === "warn" && text.includes(expected))).toBe(true);
        expect(fieldNotes.filter(({ text }) => text.includes("does not follow the") && text.includes("step")))
          .toHaveLength(expected === "step" ? 1 : 0);
        expect(raw[field]).toBe(value);
      }
    }

    const multipleInvalid = notesFor({ hoodHeight: 19, pocketWidth: 55 });
    expect(multipleInvalid.map(({ field }) => field)).toEqual(["hoodHeight", "pocketWidth"]);

    const offStepAlongsideRepresentability = notesFor({ cuffDepth: 6.25, hoodCasingWidth: 5.5 });
    expect(offStepAlongsideRepresentability).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "cuffDepth", text: expect.stringContaining("step") }),
      expect.objectContaining({ field: "hoodCasingWidth", text: expect.stringContaining("cannot be represented") }),
    ]));
  });

  it("composes existing neckline and casing representability warnings", () => {
    const options = { ...HOODIE_DEFAULT_OPTIONS, hoodCasingWidth: 5.5 };
    const { block, measurements } = draft(options);
    const notes = hoodieGuidance(block, measurements, options);
    expect(notes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "hoodCasingWidth",
        level: "warn",
        text: expect.stringContaining("cannot be represented"),
      }),
    ]));

    const necklineBoundary = notesFor({ hoodNecklineFrontDrop: 22 });
    expect(necklineBoundary).toEqual(expect.arrayContaining([
      expect.objectContaining({
        field: "hoodNecklineFrontDrop",
        level: "warn",
        text: expect.stringContaining("drops below the underarm"),
      }),
    ]));
  });

  it("reports controls made unused by a zero pouch dimension", () => {
    const widthDisabled = notesFor({ pocketWidth: 0 });
    expect(widthDisabled.filter(({ level }) => level === "info").map(({ field }) => field)).toEqual([
      "pocketHeight",
      "pocketOpeningLength",
      "pocketOpeningAngle",
      "pocketHemClearance",
    ]);

    const heightDisabled = notesFor({ pocketHeight: 0 });
    expect(heightDisabled.filter(({ level }) => level === "info").map(({ field }) => field)).toEqual([
      "pocketWidth",
      "pocketOpeningLength",
      "pocketOpeningAngle",
      "pocketHemClearance",
    ]);

    const bothDisabled = notesFor({ pocketWidth: 0, pocketHeight: 0 });
    expect(bothDisabled.filter(({ level }) => level === "info").map(({ field }) => field)).toEqual([
      "pocketOpeningLength",
      "pocketOpeningAngle",
      "pocketHemClearance",
    ]);
  });

  it("reports casing exit spacing as unused while retaining the drawcord note", () => {
    const notes = notesFor({ hoodCasingWidth: 0 });
    expect(notes).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "hoodDrawcordLength", level: "warn", text: expect.stringContaining("is unused") }),
      expect.objectContaining({ field: "hoodExitSpacing", level: "info", text: expect.stringContaining("is unused") }),
    ]));
  });

  it("detects diagonal openings that cross the fold or pouch bottom", () => {
    const foldCrossing = notesFor({ pocketWidth: 20, pocketOpeningLength: 18, pocketOpeningAngle: 30 });
    expect(foldCrossing.filter(({ field }) => field === "pocketOpeningLength" || field === "pocketOpeningAngle"))
      .toHaveLength(2);
    expect(foldCrossing.some(({ text }) => text.includes("on-fold edge"))).toBe(true);

    const bottomCrossing = notesFor({ pocketHeight: 10, pocketOpeningLength: 18, pocketOpeningAngle: 60 });
    expect(bottomCrossing.filter(({ text }) => text.includes("lower edge"))).toHaveLength(2);
  });

  it("checks the pouch against live front side and upper-body edges at XS–XL", () => {
    for (const size of TSHIRT_SIZES) {
      const widthNotes = notesFor({ pocketWidth: 54 }, size.step);
      if (size.step < 0) {
        expect(widthNotes.some(({ field, text }) => field === "pocketWidth" && text.includes("side"))).toBe(true);
      } else {
        expect(widthNotes.some(({ field }) => field === "pocketWidth")).toBe(false);
      }

      const tallNotes = notesFor({ pocketHeight: 38, pocketHemClearance: 25 }, size.step);
      expect(tallNotes.some(({ field, text }) =>
        field === "pocketHeight" && text.includes("leaves the front panel at"))).toBe(true);
    }
  });

  it("treats the front hem-band seam as the pouch boundary", () => {
    const { block, measurements } = draft();
    const pouch = block.roles.pocket!;
    const movedBlock: Block = {
      ...block,
      roles: { ...block.roles, pocket: shifted(pouch, 20) },
    };
    const notes = hoodieGuidance(movedBlock, measurements, HOODIE_DEFAULT_OPTIONS);
    expect(notes.some(({ field, text }) => field === "pocketHemClearance" && text.includes("hem-band attachment seam")))
      .toBe(true);
  });

  it("reports missing pouch and front geometry without throwing", () => {
    const { block, measurements } = draft();
    const { pocket: _pocket, ...withoutPouchRoles } = block.roles;
    const noPouch: Block = { ...block, roles: withoutPouchRoles };
    expect(hoodieGuidance(noPouch, measurements, HOODIE_DEFAULT_OPTIONS))
      .toEqual(expect.arrayContaining([expect.objectContaining({ field: "pocketWidth", level: "warn" })]));

    const { front: _front, ...withoutFrontRoles } = block.roles;
    const noFront: Block = { ...block, roles: withoutFrontRoles };
    expect(hoodieGuidance(noFront, measurements, HOODIE_DEFAULT_OPTIONS))
      .toEqual(expect.arrayContaining([expect.objectContaining({ field: "pocketHeight", level: "warn" })]));

    const emptyFront: Block = {
      ...block,
      roles: { ...block.roles, front: { ...block.roles.front!, edges: [] } },
    };
    expect(hoodieGuidance(emptyFront, measurements, HOODIE_DEFAULT_OPTIONS))
      .toEqual(expect.arrayContaining([expect.objectContaining({ field: "pocketHeight", text: expect.stringContaining("panel") })]));
  });

  it("reports malformed pouch topology with an actionable correction", () => {
    const { block, measurements } = draft();
    const pouch = block.roles.pocket!;
    const malformed: Piece = { ...pouch, edges: pouch.edges.filter(({ name }) => name !== "fold") };
    const malformedBlock: Block = { ...block, roles: { ...block.roles, pocket: malformed } };
    expect(hoodieGuidance(malformedBlock, measurements, HOODIE_DEFAULT_OPTIONS))
      .toEqual(expect.arrayContaining([expect.objectContaining({
        field: "pocketOpeningLength",
        text: expect.stringContaining("missing its opening, fold, or bottom edge"),
      })]));
  });

  it("reports mathematical failures in walked band lengths without material judgments", () => {
    const { block, measurements } = draft();
    const zeroOpening = replaceSleeveHem(block, point(1, 1), point(1, 1));
    const zeroNotes = hoodieGuidance(zeroOpening, measurements, HOODIE_DEFAULT_OPTIONS);
    expect(zeroNotes.some(({ level, text }) => level === "warn" && text.includes("cuffLeft") && text.includes("greater than zero")))
      .toBe(true);
    expect(zeroNotes.some(({ text }) => /material|fit|recovery|sewability/i.test(text))).toBe(false);

    const unrepresentable = replaceSleeveHem(block, point(0, 0), point(1e308, 0));
    const overflowNotes = hoodieGuidance(unrepresentable, measurements, HOODIE_DEFAULT_OPTIONS);
    expect(overflowNotes.some(({ level, text }) => level === "warn" && text.includes("cuffLeft") && text.includes("representable")))
      .toBe(true);
  });
});
