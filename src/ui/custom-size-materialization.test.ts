import { GARMENTS, STANDARD_M, blockPieces, defaultGarmentOptions, draftAtSize } from "../drafting";
import { exportA0Pdf, exportDxf, exportPdf, exportSvg } from "../export";
import { wovenShirtAllowances } from "../drafting/shirt";
import { DEFAULT_APPEARANCE } from "./appearance";
import { getFieldDefinitions } from "./field-provenance";
import { addCaptureReadingForField, createMeasurementCaptureSession } from "./measurement-capture";
import { DEFAULT_WORKSPACE, deserialize, serialize, defaultStretchFabricForGarment } from "./persist";
import {
  customStyleCreationErrorMessage,
  gradedMarkerAvailabilityTitle,
  materializeCustomSizeDesign,
  requireMatchingCaptureSession,
  requireSavedCaptureCopy,
} from "./custom-size-materialization";
import type { SavedDesign } from "./project-records";
import * as measurementCapture from "./measurement-capture";
import { describe, expect, it, vi } from "vitest";

const FABRIC = "#3A4150";
const TIME = "2026-09-26T12:00:00.000Z";

function seedFor(recipeId: string): SavedDesign {
  const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
  const workspace = {
    ...DEFAULT_WORKSPACE,
    garment: recipe.name,
    targetStyle: recipe.styles[0]!.name,
    stretchFabric: defaultStretchFabricForGarment(recipe.name),
    exportStep: 0,
    nestScope: "single" as const,
  };
  const result = deserialize(serialize(STANDARD_M, FABRIC,
    { [recipe.name]: defaultGarmentOptions(recipe.options ?? []) }, workspace, DEFAULT_APPEARANCE));
  if (!result.ok) throw new Error(result.error);
  const { ok: _ok, ...design } = result;
  return design;
}

function readySession(recipeId: string, varyValues = false) {
  let session = createMeasurementCaptureSession("3f0c6a2e-8d1b-4c5e-9a7f-2b6d8e1c4a90", recipeId, TIME, null);
  getFieldDefinitions(recipeId).forEach((definition, index) => {
    const bodyMeasure = definition.semanticKind === "BODY_MEASURE";
    const higher = definition.defaultValue + definition.step;
    const lower = definition.defaultValue - definition.step;
    const value = !varyValues ? definition.defaultValue
      : higher <= definition.max ? higher
        : lower >= definition.min ? lower : definition.defaultValue;
    session = addCaptureReadingForField(session, definition.id, {
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      rawValue: String(value),
      enteredUnit: definition.unit,
      provenance: bodyMeasure ? "USER_CAPTURED" : "USER_SELECTED",
      evidenceStatus: "UNCONFIRMED",
      sourceLabel: bodyMeasure ? "Entered by the user; technique not qualified." : "Selected digital target or control.",
      captureMethod: bodyMeasure ? "Tape; technique unqualified" : null,
      capturedAt: bodyMeasure ? "2026-09-26T11:00:00.000Z" : null,
      measurer: bodyMeasure ? "SELF" : null,
    }, TIME);
  });
  return session;
}

describe("custom one-size design materialization", () => {
  it("maps every selected measurement and option into a fresh seed for all seven recipes", () => {
    expect(GARMENTS).toHaveLength(7);
    for (const recipe of GARMENTS) {
      const seed = seedFor(recipe.name);
      const session = readySession(recipe.name);
      const result = materializeCustomSizeDesign(seed, session);
      const definitions = getFieldDefinitions(recipe.name);
      for (const definition of definitions) {
        const expected = definition.defaultValue;
        if (definition.inputKind === "measurement") {
          expect(result.measurements[definition.inputKey as keyof typeof result.measurements]).toBe(expected);
        } else {
          expect(result.garmentOptions[recipe.name]?.[definition.inputKey]).toBe(expected);
        }
      }
      expect(Object.keys(result.garmentOptions)).toEqual([recipe.name]);
      expect(result.workspace).toMatchObject({ garment: recipe.name, exportStep: 0, nestScope: "single" });
      expect(result.semanticEdits).toBeNull();
    }
  });

  it("matches the ordinary step-zero block, POMs, and selected-size file contents for every recipe", () => {
    for (const recipe of GARMENTS) {
      const design = materializeCustomSizeDesign(seedFor(recipe.name), readySession(recipe.name, true));
      const options = design.garmentOptions[recipe.name] ?? {};
      expect(design.workspace.exportStep, recipe.name).toBe(0);
      expect(Object.keys(options), recipe.name).toEqual((recipe.options ?? []).map((option) => option.id));

      const customBlock = draftAtSize(
        design.measurements, recipe.grade, 0, recipe.draft, options,
      );
      const ordinaryBlock = recipe.draft(design.measurements, options);
      expect(customBlock, recipe.name).toEqual(ordinaryBlock);
      expect(recipe.poms.map((pom) => pom.measure(customBlock)), recipe.name)
        .toEqual(recipe.poms.map((pom) => pom.measure(ordinaryBlock)));

      const pieces = blockPieces(customBlock);
      const allowances = recipe.name === "woven-shirt"
        ? wovenShirtAllowances(options.hemTurn!)
        : recipe.allowances;
      const oneSizeOutputs = {
        svg: exportSvg(pieces, allowances, recipe.notches),
        dxf: exportDxf(pieces, allowances),
        pdf: exportPdf(pieces, allowances, undefined, 1.0, recipe.tiledPdfLocalCoordinates === true),
        a0: exportA0Pdf(pieces, allowances, recipe.notches, undefined, recipe.a0Overflow === true),
      };
      const ordinaryOutputs = {
        svg: exportSvg(blockPieces(ordinaryBlock), allowances, recipe.notches),
        dxf: exportDxf(blockPieces(ordinaryBlock), allowances),
        pdf: exportPdf(blockPieces(ordinaryBlock), allowances, undefined, 1.0, recipe.tiledPdfLocalCoordinates === true),
        a0: exportA0Pdf(blockPieces(ordinaryBlock), allowances, recipe.notches, undefined, recipe.a0Overflow === true),
      };
      expect(oneSizeOutputs, recipe.name).toEqual(ordinaryOutputs);
    }
  });

  it("does not carry unrelated measurements or recipe options from the previous style", () => {
    const seed = seedFor("woven-shirt");
    const contaminated: SavedDesign = {
      ...seed,
      measurements: { ...seed.measurements, hip: 177, inseam: 92 },
      garmentOptions: { ...seed.garmentOptions, trouser: { waistbandStyle: 2 } },
    };
    const result = materializeCustomSizeDesign(contaminated, readySession("woven-shirt"));
    expect(result.measurements.hip).toBe(STANDARD_M.hip);
    expect(result.measurements.inseam).toBe(STANDARD_M.inseam);
    expect(result.garmentOptions).toEqual({ "woven-shirt": seed.garmentOptions["woven-shirt"] });
  });

  it("rejects unresolved, mismatched, malformed, or wrong-recipe captures", () => {
    const empty = createMeasurementCaptureSession("3f0c6a2e-8d1b-4c5e-9a7f-2b6d8e1c4a90", "tee", TIME, null);
    expect(() => materializeCustomSizeDesign(seedFor("tee"), empty)).toThrow("Resolve every measurement field");
    expect(() => materializeCustomSizeDesign(seedFor("woven-shirt"), readySession("tee")))
      .toThrow("captured garment's fresh design seed");
    expect(() => materializeCustomSizeDesign(seedFor("tee"), { ...readySession("tee"), fields: [] }))
      .toThrow("saved capture session is malformed");
    expect(() => materializeCustomSizeDesign(seedFor("tee"), {
      ...readySession("tee"),
      fields: readySession("tee").fields.map((field, index) => index === 0 ? { ...field, fieldId: "body.unknown" } : field),
    })).toThrow("saved capture session is malformed");
  });

  it("rejects a ready capture if its selected values cannot be materialized", () => {
    const selectedValues = vi.spyOn(measurementCapture, "selectedCaptureValues").mockReturnValue(null);
    try {
      expect(() => materializeCustomSizeDesign(seedFor("tee"), readySession("tee")))
        .toThrow("selected measurement readings are not ready");
      selectedValues.mockReturnValue({});
      expect(() => materializeCustomSizeDesign(seedFor("tee"), readySession("tee")))
        .toThrow("missing or invalid");
      selectedValues.mockReturnValue(Object.fromEntries(
        getFieldDefinitions("tee").map((definition) => [definition.inputKey,
          definition.inputKey === "chest" ? Number.NaN : definition.defaultValue]),
      ));
      expect(() => materializeCustomSizeDesign(seedFor("tee"), readySession("tee")))
        .toThrow("missing or invalid");
    } finally {
      selectedValues.mockRestore();
    }
  });

  it("guards the capture identity and copy reload boundaries with visible error messages", () => {
    const session = readySession("tee");
    expect(requireMatchingCaptureSession(session, "tee")).toBe(session);
    expect(() => requireMatchingCaptureSession(null, "tee"))
      .toThrow("Reload the active garment's guided capture");
    expect(() => requireMatchingCaptureSession(session, "skirt"))
      .toThrow("Reload the active garment's guided capture");
    expect(() => requireSavedCaptureCopy(null)).toThrow("capture copy could not be reloaded");
    const copy = { session, drafts: [] };
    expect(requireSavedCaptureCopy(copy)).toBe(copy);
    expect(customStyleCreationErrorMessage(new Error("database unavailable"))).toBe("database unavailable");
    expect(customStyleCreationErrorMessage("non-Error failure"))
      .toBe("The custom one-size style could not be saved.");
    expect(gradedMarkerAvailabilityTitle(true))
      .toBe("Graded Marker is unavailable until you review and approve a grade plan.");
    expect(gradedMarkerAvailabilityTitle(false)).toBe("Nest every graded size");
  });
});
