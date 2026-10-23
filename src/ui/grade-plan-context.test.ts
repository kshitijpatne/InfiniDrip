import { GARMENTS, STANDARD_M, TEE_RAGLAN, defaultGarmentOptions, optionAppliesToStarterEntry } from "../drafting";
import { DEFAULT_APPEARANCE } from "./appearance";
import { DEFAULT_WORKSPACE, defaultStretchFabricForGarment, deserialize, serialize } from "./persist";
import { createMeasurementCaptureSession } from "./measurement-capture";
import { FIELDS } from "./controls";
import { CUSTOM_STYLE_RECORD_VERSION, STYLE_RECORD_VERSION, type MeasurementCaptureRecord, type SavedDesign, type StyleRecord } from "./project-records";
import { createGradePlanContext } from "./grade-plan-context";
import { createEmptyTechPackRecord } from "./tech-pack-records";
import { STARTER_REGISTRY, starterOriginForEntry } from "./starter-registry";
import { describe, expect, it, vi } from "vitest";

const PROJECT_ID = "0f8b8e2a-7c1d-4a5e-9b3f-2d6c8a1e4f70";
const STYLE_ID = "5a1c3e7b-2f4d-4e6a-8c9b-1d3f5a7c9e0b";
const HEAD_ID = "c3d5e7f9-1a2b-4c3d-a4e5-f6a7b8c9d0e1";
const TIME = "2026-09-27T08:00:00.000Z";

function designFor(recipeId: string, options = defaultGarmentOptions(GARMENTS.find((recipe) => recipe.name === recipeId)!.options ?? [])): SavedDesign {
  const recipe = GARMENTS.find((candidate) => candidate.name === recipeId)!;
  const result = deserialize(serialize(STANDARD_M, "#3A4150", { [recipeId]: options }, {
    ...DEFAULT_WORKSPACE,
    garment: recipeId,
    targetStyle: recipe.styles[0]!.name,
    stretchFabric: defaultStretchFabricForGarment(recipeId),
    exportStep: 0,
    nestScope: "single",
  }, DEFAULT_APPEARANCE));
  if (!result.ok) throw new Error(result.error);
  const { ok: _ok, ...design } = result;
  return design;
}

function styleFor(recipeId = "tee", design = designFor(recipeId)): StyleRecord {
  return {
    schemaVersion: CUSTOM_STYLE_RECORD_VERSION,
    id: STYLE_ID,
    projectId: PROJECT_ID,
    name: "Custom base",
    recipeId,
    recipePresetId: design.workspace.targetStyle,
    createdAt: TIME,
    updatedAt: TIME,
    revision: 1,
    archivedAt: null,
    revisionHeadId: HEAD_ID,
    sizeMode: "custom-one-size",
    design,
    techPack: createEmptyTechPackRecord(STYLE_ID, recipeId, TIME, TIME),
  };
}

function captureFor(recipeId = "tee"): MeasurementCaptureRecord {
  return {
    schemaVersion: 1,
    styleId: STYLE_ID,
    projectId: PROJECT_ID,
    recipeId,
    revision: 4,
    updatedAt: TIME,
    session: createMeasurementCaptureSession(STYLE_ID, recipeId, TIME),
    drafts: [],
  };
}

function value<T>(result: { readonly ok: true; readonly value: T } | { readonly ok: false; readonly errors: readonly string[] }): T {
  if (!result.ok) throw new Error(result.errors.join("; "));
  return result.value;
}

describe("explicit grade-plan base context", () => {
  it("lists every recipe measurement, saved control, and raw current POM without inventing target deltas", async () => {
    for (const recipe of GARMENTS) {
      const style = styleFor(recipe.name);
      const context = value(await createGradePlanContext(PROJECT_ID, style, captureFor(recipe.name)));
      expect(context.binding).toMatchObject({
        projectId: PROJECT_ID,
        styleId: STYLE_ID,
        recipeId: recipe.name,
        revisionHeadId: HEAD_ID,
        captureRevision: 4,
      });
      expect(context.binding.fingerprint).toMatch(/^[0-9a-f]{64}$/);
      const savedOptions = style.design.garmentOptions[recipe.name] ?? {};
      const savedOptionIds = (recipe.options ?? [])
        .filter((option) =>
          (option.appliesToStyle === undefined || option.appliesToStyle === style.design.workspace.targetStyle)
          && optionAppliesToStarterEntry(option, style.design.workspace.starterOrigin?.entryId)
          && typeof savedOptions[option.id] === "number")
        .map((option) => `option.${recipe.name}.${option.id}`);
      expect(context.targets).toHaveLength(recipe.fields.length + savedOptionIds.length + recipe.poms.length);
      expect(context.targets.filter((target) => target.kind === "measurement").map((target) => target.targetId))
        .toEqual(recipe.fields.map((field) => `measurement.${String(field)}`));
      expect(context.targets.filter((target) => target.kind === "option").map((target) => target.targetId))
        .toEqual(savedOptionIds);
      expect(context.targets.filter((target) => target.kind === "pom").map((target) => target.baseValue))
        .toEqual(expect.arrayContaining(recipe.poms.map((pom) => pom.measure(recipe.draft(style.design.measurements, style.design.garmentOptions[recipe.name])))));
      expect(new Set(context.targets.map((target) => target.targetId)).size).toBe(context.targets.length);
    }
  });

  it("uses current custom style inputs in the stable fingerprint", async () => {
    const style = styleFor("tee");
    const base = value(await createGradePlanContext(PROJECT_ID, style, captureFor()));
    const changed = styleFor("tee", {
      ...style.design,
      measurements: { ...style.design.measurements, chest: style.design.measurements.chest + 1 },
    });
    const next = value(await createGradePlanContext(PROJECT_ID, changed, captureFor()));
    expect(value(await createGradePlanContext(PROJECT_ID, style, captureFor())).binding.fingerprint).toBe(base.binding.fingerprint);
    expect(next.binding.fingerprint).not.toBe(base.binding.fingerprint);
  });

  it("inherits an unset optional Tee chest ease, but targets an explicit finite value and rejects invalid values", async () => {
    const initial = designFor("tee");
    const base = styleFor("tee", {
      ...initial,
      workspace: { ...initial.workspace, targetStyle: "Classic tee" },
    });
    const inheritedOptions = { ...base.design.garmentOptions.tee };
    delete inheritedOptions.chestEase;
    const inherited = value(await createGradePlanContext(PROJECT_ID, styleFor("tee", {
      ...base.design,
      garmentOptions: { ...base.design.garmentOptions, tee: inheritedOptions },
    }), captureFor()));
    expect(inherited.targets.some((target) => target.targetId === "option.tee.chestEase")).toBe(false);
    expect(inherited.targets.find((target) => target.targetId === "measurement.ease")?.baseValue)
      .toBe(STANDARD_M.ease);

    const explicit = value(await createGradePlanContext(PROJECT_ID, styleFor("tee", {
      ...base.design,
      garmentOptions: { ...base.design.garmentOptions, tee: { ...inheritedOptions, chestEase: 8 } },
    }), captureFor()));
    expect(explicit.targets.find((target) => target.targetId === "option.tee.chestEase"))
      .toMatchObject({ kind: "option", baseValue: 8 });

    expect(await createGradePlanContext(PROJECT_ID, styleFor("tee", {
      ...base.design,
      garmentOptions: { ...base.design.garmentOptions, tee: { ...inheritedOptions, chestEase: Number.POSITIVE_INFINITY } },
    }), captureFor())).toMatchObject({
      ok: false,
      errors: ["Save an explicit value for every recipe control before creating a grade plan."],
    });
  });

  it("keeps a stored Classic-only override dormant in a different Tee style's grade-plan context", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const nonClassic = recipe.styles.find((candidate) => candidate.name !== "Classic tee")!;
    const base = styleFor("tee");
    const dormant = styleFor("tee", {
      ...base.design,
      workspace: { ...base.design.workspace, targetStyle: nonClassic.name },
      garmentOptions: { ...base.design.garmentOptions, tee: { ...base.design.garmentOptions.tee, chestEase: 8 } },
    });
    const context = value(await createGradePlanContext(PROJECT_ID, dormant, captureFor()));
    const inheritedBlock = recipe.draft(dormant.design.measurements, {});
    expect(context.targets.some((target) => target.targetId === "option.tee.chestEase")).toBe(false);
    expect(context.targets.filter((target) => target.kind === "pom").map((target) => target.baseValue))
      .toEqual(recipe.poms.map((pom) => pom.measure(inheritedBlock)));
  });

  it("uses the saved Tee construction variant for grade-plan POM targets", async () => {
    const setInDesign = designFor("tee");
    const raglanDesign: SavedDesign = {
      ...setInDesign,
      workspace: { ...setInDesign.workspace, teeConstruction: "raglan" },
    };
    const style = styleFor("tee", raglanDesign);
    const context = value(await createGradePlanContext(PROJECT_ID, style, captureFor("tee")));
    const raglanBlock = TEE_RAGLAN.draft(raglanDesign.measurements, raglanDesign.garmentOptions.tee);
    const pomTargets = context.targets.filter((target) => target.kind === "pom");
    expect(pomTargets.map((target) => target.baseValue)).toEqual(TEE_RAGLAN.poms.map((pom) => pom.measure(raglanBlock)));
    expect(pomTargets.map((target) => target.targetId))
      .toEqual(TEE_RAGLAN.poms.map((pom) => `pom.tee.${encodeURIComponent(pom.label)}`));

    const legacyWorkspace = { ...setInDesign.workspace };
    delete legacyWorkspace.teeConstruction;
    const legacyContext = value(await createGradePlanContext(
      PROJECT_ID,
      styleFor("tee", { ...setInDesign, workspace: legacyWorkspace }),
      captureFor("tee"),
    ));
    const setInBlock = GARMENTS.find((recipe) => recipe.name === "tee")!.draft(setInDesign.measurements);
    expect(legacyContext.targets.filter((target) => target.kind === "pom").map((target) => target.baseValue))
      .toEqual(GARMENTS.find((recipe) => recipe.name === "tee")!.poms.map((pom) => pom.measure(setInBlock)));
  });

  it("includes F02-only waist-dart controls in grade-plan context only for the matching starter origin", async () => {
    const initial = designFor("fitted");
    const entry = STARTER_REGISTRY.entries.find((candidate) =>
      candidate.entryId === "fitted-waist-dart-tee-digital-v1")!;
    const f02Design: SavedDesign = {
      ...initial,
      measurements: { ...initial.measurements, ...entry.configuration.measurements },
      garmentOptions: {
        ...initial.garmentOptions,
        fitted: defaultGarmentOptions(GARMENTS.find((recipe) => recipe.name === "fitted")!.options ?? [], entry.entryId),
      },
      workspace: {
        ...initial.workspace,
        targetStyle: entry.configuration.targetStyle,
        starterOrigin: starterOriginForEntry(entry),
      },
    };
    const context = value(await createGradePlanContext(PROJECT_ID, styleFor("fitted", f02Design), captureFor("fitted")));
    expect(context.targets.filter((target) => target.kind === "option").map((target) => target.targetId))
      .toEqual(expect.arrayContaining([
        "option.fitted.waistDartWaistlineFromHps",
        "option.fitted.waistDartIntake",
        "option.fitted.waistDartLength",
        "option.fitted.waistDartPosition",
      ]));

    const { starterOrigin: _f02Origin, ...f01Workspace } = f02Design.workspace;
    const f01Design: SavedDesign = { ...f02Design, workspace: f01Workspace };
    const f01Context = value(await createGradePlanContext(PROJECT_ID, styleFor("fitted", f01Design), captureFor("fitted")));
    expect(f01Context.targets.some((target) => target.targetId.startsWith("option.fitted.waistDart"))).toBe(false);
  });

  it("fails closed for legacy styles, mismatched captures, missing revision heads, and missing explicit recipe controls", async () => {
    const custom = styleFor("polo");
    expect(await createGradePlanContext(PROJECT_ID, { ...custom, schemaVersion: STYLE_RECORD_VERSION } as StyleRecord, captureFor("polo")))
      .toMatchObject({ ok: false, errors: ["Grade plans are available only for a custom one-size style."] });
    expect(await createGradePlanContext(PROJECT_ID, custom, { ...captureFor("polo"), styleId: HEAD_ID }))
      .toMatchObject({ ok: false, errors: ["The grade plan needs the matching saved capture for this project, style and recipe."] });
    expect(await createGradePlanContext(PROJECT_ID, { ...custom, revisionHeadId: null }, captureFor("polo")))
      .toMatchObject({ ok: false, errors: ["Save the style revision before creating a grade plan."] });
    expect(await createGradePlanContext(PROJECT_ID, styleFor("polo", {
      ...custom.design,
      garmentOptions: { polo: {} },
    }), captureFor("polo"))).toMatchObject({
      ok: false,
      errors: ["Save an explicit value for every recipe control before creating a grade plan."],
    });
    expect(await createGradePlanContext(PROJECT_ID, styleFor("polo", {
      ...custom.design,
      garmentOptions: {},
    }), captureFor("polo"))).toMatchObject({
      ok: false,
      errors: ["Save an explicit value for every recipe control before creating a grade plan."],
    });
  });

  it("keeps recipe and field labels honest when catalogs lack a current entry", async () => {
    const unsupportedStyle = { ...styleFor(), recipeId: "future-recipe" } as unknown as StyleRecord;
    const unsupportedCapture = { ...captureFor(), recipeId: "future-recipe" };
    expect(await createGradePlanContext(PROJECT_ID, unsupportedStyle, unsupportedCapture)).toMatchObject({
      ok: false,
      errors: ["The style recipe is not supported by this application version."],
    });

    const index = FIELDS.findIndex((field) => field.id === "chest");
    const mutableFields = FIELDS as unknown as (typeof FIELDS[number])[];
    const [chest] = mutableFields.splice(index, 1);
    try {
      const context = value(await createGradePlanContext(PROJECT_ID, styleFor(), captureFor()));
      expect(context.targets.find((target) => target.targetId === "measurement.chest")?.label).toBe("chest");
    } finally {
      if (chest) mutableFields.splice(index, 0, chest);
    }
  });

  it("uses the explicit unitless label when a recipe control has no physical unit", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "polo")!;
    const option = recipe.options![0]!;
    const original = option.unit;
    Object.defineProperty(option, "unit", { value: undefined, configurable: true, writable: true });
    try {
      const context = value(await createGradePlanContext(PROJECT_ID, styleFor("polo"), captureFor("polo")));
      expect(context.targets.find((target) => target.targetId === `option.polo.${option.id}`)?.unit).toBe("unitless");
    } finally {
      Object.defineProperty(option, "unit", { value: original, configurable: true, writable: true, enumerable: true });
    }
  });

  it("rejects a saved base whose drafted POMs are not finite", async () => {
    const style = styleFor("tee", {
      ...designFor("tee"),
      measurements: { ...STANDARD_M, chest: Number.NaN },
    });
    expect(await createGradePlanContext(PROJECT_ID, style, captureFor())).toMatchObject({
      ok: false,
      errors: ["The saved base measurements are incomplete. Correct and save the style before creating a grade plan."],
    });
  });

  it("reports recipe draft failures and non-finite POM measurements instead of minting a plan catalog", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const draft = vi.spyOn(recipe, "draft").mockImplementation(() => { throw new Error("test draft failure"); });
    expect(await createGradePlanContext(PROJECT_ID, styleFor(), captureFor())).toMatchObject({
      ok: false,
      errors: ["The saved base cannot produce its current Tee POM targets: test draft failure"],
    });
    draft.mockRestore();
    const unknownDraftFailure = vi.spyOn(recipe, "draft").mockImplementation(() => { throw "draft failure"; });
    expect(await createGradePlanContext(PROJECT_ID, styleFor(), captureFor())).toMatchObject({
      ok: false,
      errors: ["The saved base cannot produce its current Tee POM targets."],
    });
    unknownDraftFailure.mockRestore();

    const pom = recipe.poms[0]!;
    const measure = vi.spyOn(pom, "measure").mockReturnValue(Number.POSITIVE_INFINITY);
    expect(await createGradePlanContext(PROJECT_ID, styleFor(), captureFor())).toMatchObject({
      ok: false,
      errors: ["The saved base contains a non-finite measurement, control or POM value."],
    });
    measure.mockRestore();
  });

  it("fails safely if the canonical base digest cannot be encoded or hashed", async () => {
    const invalidDesign = { ...designFor("tee"), unsupported: undefined } as unknown as SavedDesign;
    expect(await createGradePlanContext(PROJECT_ID, styleFor("tee", invalidDesign), captureFor())).toMatchObject({
      ok: false,
      errors: ["JCS input contains a value that JSON cannot represent."],
    });
    const failingCrypto = { subtle: { digest: () => Promise.reject(new Error("digest unavailable")) } } as unknown as Crypto;
    expect(await createGradePlanContext(PROJECT_ID, styleFor(), captureFor(), failingCrypto)).toMatchObject({
      ok: false,
      errors: ["digest unavailable"],
    });
    const unknownCryptoFailure = { subtle: { digest: () => Promise.reject("digest unavailable") } } as unknown as Crypto;
    expect(await createGradePlanContext(PROJECT_ID, styleFor(), captureFor(), unknownCryptoFailure)).toMatchObject({
      ok: false,
      errors: ["The grade-plan base digest could not be calculated."],
    });
  });
});
