import { writeFileSync } from "node:fs";
import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it, vi } from "vitest";
import { edgeLength, pieceEdge } from "../../../../src/drafting/piece";
import * as allowance from "../../../../src/render/allowance";
import { STANDARD_M } from "../../../../src/drafting/measurements";
import { DEFAULT_WORKSPACE, serialize } from "../../../../src/ui/persist";
import { draftRecipeReviewAtSize, garmentForConstruction } from "../../../../src/drafting/recipe";
import { garmentOptionsForStyle } from "../../../../src/drafting/options";
import { getCaptureFieldDefinitions } from "../../../../src/ui/field-provenance";
import { createMeasurementCaptureSession, addCaptureReadingForField } from "../../../../src/ui/measurement-capture";
import { materializeCustomSizeDesign } from "../../../../src/ui/custom-size-materialization";
import { openProjectWorkflow } from "../../../../src/ui/project-workflow";
import { starterEntryById, starterOriginForEntry } from "../../../../src/ui/starter-registry";
import { assembleTee } from "./assembly-mesh";
import { createHistory } from "./preview-state";
import { initialClassicTeeInputs, reopenCandidateTee, saveCandidateTee, addTeeMove, asymmetricAnchor, defaultTeeInputs, editedTeeInputs, loadSavedClassicTee, loadGenericClassicTee, loadProjectClassicTee, parseTeeInputs, resolveTeeDraft } from "./tee-source";

const classicStarter = starterEntryById("tee-classic-digital-v1")!;

function savedTee({
  entry = classicStarter,
  construction = "set-in",
  options = { chestEase: 7 },
}: {
  entry?: typeof classicStarter;
  construction?: "set-in" | "raglan";
  options?: Record<string, number>;
} = {}) {
  return serialize(
    { ...STANDARD_M, ...classicStarter.configuration.measurements, chest: 104, ease: 9 },
    "#123456",
    { tee: options },
    { ...DEFAULT_WORKSPACE, teeConstruction: construction, starterOrigin: starterOriginForEntry(entry) },
  );
}

describe("Classic set-in Tee source adapter", () => {
  it("loads a saved Classic starter and verifies the crew-neck variant and chest-only ease before geometry", async () => {
    const saved = loadSavedClassicTee(savedTee());
    expect(saved.starter).toMatchObject({
      entryId: "tee-classic-digital-v1",
      entryRevision: "2026-10-20.1",
      recipeId: "tee",
      recipeRevision: "052c1e4418428cc0ca831c92b2659d7104f113ec",
    });
    expect(saved.variant).toEqual({ recipeId: "tee", style: "Classic tee", construction: "set-in", neckline: "crew" });
    expect(saved.inputs).toMatchObject({ size: 0, chestEase: 7, measurements: { chest: 104, ease: 9 } });

    const draft = await resolveTeeDraft(saved.inputs);
    expect(draft.issue).toBeNull();
    const { front, back, sleeve } = draft.drawing.block.roles;
    expect(Object.keys(draft.drawing.block.roles)).toEqual(["front", "back", "sleeve"]);
    expect([front.onFold, back.onFold, sleeve.onFold]).toEqual([true, true, false]);
    expect(pieceEdge(front, "neckline").kind).toBe("curve");
    expect(pieceEdge(sleeve, "capLeft").kind).toBe("curve");
    expect(pieceEdge(sleeve, "capRight").kind).toBe("curve");
    expect(edgeLength(pieceEdge(front, "hem"))).toBeCloseTo((104 + 7) / 4, 8);
    const capLeft = pieceEdge(sleeve, "capLeft");
    expect(capLeft.kind === "curve" && capLeft.curve.end.x * 2).toBeCloseTo(38 + 9 / 2, 8);
  });

  it("keeps verified identity through editing, undo, redo and app-backed reopen", async () => {
    const history = createHistory(initialClassicTeeInputs());
    const initial = await resolveTeeDraft(history.current());
    expect(initial.identity.provenance?.starter?.entryId).toBe("tee-classic-digital-v1");
    expect(history.current().chestEase).toBeNull();
    history.commit(await editedTeeInputs({ ...history.current(), chestEase: 7 }));
    const edited = await resolveTeeDraft(history.current());
    expect(edited.identity.provenance).toEqual(initial.identity.provenance);
    expect(edited.revision).not.toBe(initial.revision);
    expect(assembleTee(edited.source).revision).toBe(edited.revision);
    history.undo();
    expect(await resolveTeeDraft(history.current())).toEqual(initial);
    history.redo();
    const reopened = await reopenCandidateTee(await saveCandidateTee(history.current()));
    expect(await resolveTeeDraft(reopened)).toEqual(edited);
    const saved = JSON.parse(await saveCandidateTee(history.current()));
    const stale = JSON.parse(saved.appSave);
    stale.workspace.starterOrigin.entryRevision = "old";
    await expect(reopenCandidateTee(JSON.stringify({ ...saved, appSave: JSON.stringify(stale) })))
      .rejects.toThrow(/saved starter revision is unavailable/i);
  });

  it("replays an app-created active project one-size style through assembly and reopen", async () => {
    let sequence = 0;
    const nextId = () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`;
    const workflow = await openProjectWorkflow({
      repositoryOptions: { factory: new IDBFactory(), crypto: globalThis.crypto, name: "s1342-one-size" },
      storage: { getItem: () => null },
      idFactory: nextId, revisionIdFactory: nextId,
      now: () => "2026-11-26T00:00:00.000Z",
    });
    try {
      const base = workflow.snapshot.activeStyle;
      const captured: Record<string, number> = { chest: 108, shoulderWidth: 47, bicep: 40, length: 72,
        armholeDepth: 25, sleeveLength: 24, ease: 9 };
      const time = "2026-11-26T00:00:00.000Z";
      let session = createMeasurementCaptureSession(nextId(), "tee", time, base.id);
      for (const field of getCaptureFieldDefinitions("tee")) {
        const body = field.semanticKind === "BODY_MEASURE";
        session = addCaptureReadingForField(session, field.id, {
          id: nextId(), rawValue: String(captured[field.inputKey] ?? field.defaultValue), enteredUnit: field.unit,
          provenance: body ? "USER_CAPTURED" : "USER_SELECTED", evidenceStatus: "UNCONFIRMED",
          sourceLabel: body ? "Synthetic tape reading" : "Digital draft setting",
          captureMethod: body ? "Tape" : null, capturedAt: body ? time : null, measurer: body ? "HELPER" : null,
        }, time);
      }
      await workflow.saveMeasurementCapture(session, []);
      const design = materializeCustomSizeDesign(base.design, session);
      const { project, activeStyle } = await workflow.createCustomSizeStyle("S1342 captured Classic", design);
      const snapshot = { project, activeStyle };
      const input = await loadProjectClassicTee(snapshot);
      await expect(loadProjectClassicTee({ ...snapshot, project: {} })).rejects.toThrow(/project/i);
      await expect(loadProjectClassicTee({ ...snapshot, activeStyle: {} })).rejects.toThrow(/style/i);
      await expect(loadProjectClassicTee({
        ...snapshot,
        activeStyle: { ...activeStyle, design: { ...activeStyle.design,
          workspace: { ...activeStyle.design.workspace, starterOrigin: starterOriginForEntry(classicStarter) },
        } },
      })).rejects.toThrow(/step 0 and no catalog starter/);
      await expect(saveCandidateTee({ ...input, size: 0 })).rejects.toThrow(/must stay on custom one-size/);
      expect(input).toMatchObject({ size: "custom", measurements: { chest: 108, length: 72, bicep: 40, ease: 9 } });
      expect(activeStyle.design.workspace).toMatchObject({ exportStep: 0, starterOrigin: null });
      expect(input.provenance?.projectStyle).toEqual({
        projectId: project.id, styleId: activeStyle.id, styleRevision: activeStyle.revision, revisionHeadId: activeStyle.revisionHeadId,
        parentDesignDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
      });
      const tee = garmentForConstruction("tee", "set-in");
      const activeOptions = garmentOptionsForStyle(tee.options ?? [], activeStyle.design.garmentOptions.tee,
        activeStyle.design.workspace.targetStyle);
      const expected = draftRecipeReviewAtSize(tee, activeStyle.design.measurements, 0, activeOptions);
      const draft = await resolveTeeDraft(input);
      expect(draft.drawing.block).toEqual(expected.block);
      const assembly = assembleTee(draft.source);
      expect(assembly.revision).toBe(draft.revision);
      expect(assembly.diagnostics.frontVerticalSpanCm).toBeCloseTo(72, 8);
      expect(assembly.seams.find(seam => seam.id === "cap-front:right")?.sides.map(
        side => [side.instance, side.edge, side.parameters[0], side.parameters.at(-1)],
      )).toEqual([["sleeve:right", "capLeft", 0, 1], ["front:right", "armhole", 1, 0]]);
      const saved = await saveCandidateTee(input);
      expect(await resolveTeeDraft(await reopenCandidateTee(saved))).toEqual(draft);
      await expect(loadProjectClassicTee({ project, activeStyle: base })).rejects.toThrow(/active custom one-size style/);
      const edited = await addTeeMove({ ...input, measurements: { ...input.measurements, chest: 108.5 } },
        asymmetricAnchor, -1, 0, "project-edit");
      const editedDraft = await resolveTeeDraft(edited);
      expect(editedDraft.issue).toBeNull();
      expect(editedDraft.identity.provenance).toEqual(draft.identity.provenance);
      expect(editedDraft.workingRevision).not.toBe(draft.workingRevision);
      const working = JSON.parse(await saveCandidateTee(edited));
      expect(await resolveTeeDraft(await reopenCandidateTee(JSON.stringify(working)))).toEqual(editedDraft);
      const differentParentId = nextId();
      const otherInput = await loadProjectClassicTee({
        project: { ...project, id: differentParentId },
        activeStyle: { ...activeStyle, projectId: differentParentId },
      });
      const other = JSON.parse(await saveCandidateTee(otherInput));
      await expect(reopenCandidateTee(JSON.stringify({
        ...working, workingCopy: other.workingCopy, workingRevision: other.workingRevision,
      }))).rejects.toThrow(/does not match its saved project/);
      await expect(reopenCandidateTee(JSON.stringify({ ...working, appSave: savedTee() })))
        .rejects.toThrow(/bound custom one-size working copy/);
      if (process.env.UIQ12_PROJECT_SNAPSHOT) writeFileSync(process.env.UIQ12_PROJECT_SNAPSHOT, saved);
    } finally {
      workflow.close();
    }
  });

  it("retains validated export-only neckband options without changing shell geometry", async () => {
    const plain = loadSavedClassicTee(savedTee()).inputs;
    const neckband = { teeNeckbandLengthPercent: 86, teeNeckbandFinishedWidthCm: 2.4 };
    const configured = loadSavedClassicTee(savedTee({ options: { chestEase: 7, ...neckband } })).inputs;
    expect(configured.neckband).toEqual(neckband);
    const reopened = await reopenCandidateTee(await saveCandidateTee(configured));
    expect(reopened.neckband).toEqual(neckband);
    const [base, withBand] = await Promise.all([resolveTeeDraft(plain), resolveTeeDraft(reopened)]);
    expect(withBand.revision).toBe(base.revision);
    expect(withBand.workingRevision).not.toBe(base.workingRevision);
    expect(assembleTee(withBand.source)).toEqual(assembleTee(base.source));
  });

  it.each([
    [{ teeNeckbandLengthPercent: 99 }, /Neckband length: enter 75–90/],
    [{ teeNeckbandFinishedWidthCm: 3.1 }, /Finished neckband width: enter 1.5–3/],
    [{ teeNeckbandLengthPercent: 86.5 }, /Neckband length: use increments/],
    [{ teeNeckbandFinishedWidthCm: 2.45 }, /Finished neckband width: use increments/],
  ] as const)("rejects invalid neckband template settings before assembly", async (options, error) => {
    expect(() => loadSavedClassicTee(savedTee({ options }))).toThrow(error);
    await expect(resolveTeeDraft({ ...initialClassicTeeInputs(), neckband: options })).rejects.toThrow(error);
  });

  it("does not bind anonymous geometry or copied provenance to the verified revision", async () => {
    const verified = initialClassicTeeInputs();
    const anonymous = { ...verified, provenance: undefined };
    const [a, b] = await Promise.all([resolveTeeDraft(verified), resolveTeeDraft(anonymous)]);
    expect(a.drawing).toEqual(b.drawing);
    expect(a.revision).not.toBe(b.revision);
    expect(b.identity.provenance).toBeNull();
    await expect(saveCandidateTee(anonymous)).rejects.toThrow(/verified saved Classic Tee/);
    await expect(resolveTeeDraft(JSON.parse(JSON.stringify(verified)))).rejects.toThrow(/was not verified/);
  });

  it("validates starter increments consistently and round-trips generic Classic fractions and independent ease", async () => {
    const starter = initialClassicTeeInputs();
    const edited = { ...starter, measurements: { ...starter.measurements, chest: 100.5 } };
    await expect(resolveTeeDraft(edited)).rejects.toThrow(/increments/);
    await expect(saveCandidateTee(edited)).rejects.toThrow(/increments/);
    const generic = loadGenericClassicTee(serialize({ ...STANDARD_M, chest: 100.5, ease: 6.5 },
      "#123456", { tee: { chestEase: 8 } }, DEFAULT_WORKSPACE));
    const draft = await resolveTeeDraft(generic);
    expect(draft.issue).toBeNull();
    expect(await resolveTeeDraft(await reopenCandidateTee(await saveCandidateTee(generic)))).toEqual(draft);
    expect(edgeLength(pieceEdge(draft.drawing.block.roles.front, "hem"))).toBeCloseTo(108.5 / 4, 8);
  });

  it("snapshots mutable inputs and refuses copied source receipts", async () => {
    const input = await editedTeeInputs();
    const pending = resolveTeeDraft(input);
    const expected = await resolveTeeDraft(input);
    const resolving = resolveTeeDraft(input);
    Object.assign(input.measurements, { chest: 109 });
    Object.assign(input.edits!.operations[0].moves[0].deltaCm, { x: -100 });
    expect(await resolving).toEqual(expected);
    const good = await pending;
    expect(Object.isFrozen(good.source?.block.roles.front.edges)).toBe(true);
    const stale = await resolveTeeDraft(input);
    expect(stale.source).toBeNull();
    // @ts-expect-error The fallback drawing cannot issue a verified assembly source.
    expect(() => assembleTee({ ...stale.drawing, revision: good.revision })).toThrow(/validated source revision/);
    const anonymous = await resolveTeeDraft(defaultTeeInputs());
    expect(() => assembleTee({ ...anonymous.source!, revision: good.revision })).toThrow(/validated source revision/);
  });

  it("rejects a different resolved starter even when the topology is the same", () => {
    expect(() => loadSavedClassicTee(savedTee({ entry: starterEntryById("tee-classic-custom-v1")! })))
      .toThrow("Choose a saved Tee Classic software-default starter.");
  });

  it.each([
    savedTee({ construction: "raglan" }),
    savedTee({ options: { chestEase: 7, teeVNeckDropCm: 0 } }),
    savedTee({ options: { chestEase: 7, teeScoopNeckDropCm: 0 } }),
    savedTee({ options: { chestEase: 7, teeVNeckDropCm: 0, teeScoopNeckDropCm: 0 } }),
  ])("rejects a non-crew or non-set-in saved variant before assembly", json => {
    expect(() => loadSavedClassicTee(json)).toThrow("The saved variant must be a Classic crew-neck set-in Tee.");
  });

  it.each([-2, -1, 0, 1, 2, "custom"] as const)("resolves source size %s and retains true cut lines", async size => {
    const draft = await resolveTeeDraft({ ...defaultTeeInputs(), size });
    expect(draft.issue).toBeNull();
    expect(draft.identity.sizeStep).toBe(size);
    expect(Object.keys(draft.drawing.block.roles)).toEqual(["front", "back", "sleeve"]);
    expect(Object.isFrozen(draft.drawing.block.roles.front.edges)).toBe(true);
    expect(draft.drawing.cuts.front.length).toBeGreaterThan(draft.drawing.block.roles.front.edges.length);
    expect(edgeLength(pieceEdge(draft.drawing.block.roles.front, "side"))).toBeCloseTo(46 + (size === "custom" ? 0 : size * 1.4), 8);
  });

  it("matches the independent edited arc receipt and persists exact identity on reopen", async () => {
    const input = await editedTeeInputs();
    const first = await resolveTeeDraft(input);
    const revived = await resolveTeeDraft(parseTeeInputs(JSON.parse(JSON.stringify(input))));
    expect(first.issue).toBeNull();
    expect(revived).toEqual(first);
    expect(first.identity.baseSourceFingerprint).toMatch(/df1e992da557b99b95873f4f4924e2f64c135c74f9ec77cdc10b1e359a57d5bb$/);
    expect(first.identity.effectiveBlockDigest).toMatch(/7db7523c001bdc32adc33b3d7fcfc12ba78fb005f36613ceb69503deda600527$/);
    expect(edgeLength(pieceEdge(first.drawing.block.roles.front, "armhole"))).toBeCloseTo(21.7308569964, 8);
    expect(edgeLength(pieceEdge(first.drawing.block.roles.back, "armhole"))).toBeCloseTo(21.1443010428, 8);
  });

  it("preserves separate sleeve ease, graded precision, and fit guidance", async () => {
    const base = defaultTeeInputs();
    const draft = await resolveTeeDraft({ ...base, size: 2, chestEase: 11.5,
      measurements: { ...base.measurements, length: 74, ease: 6, shoulderWidth: 45.1 } });
    expect(draft.issue).toBeNull();
    expect(edgeLength(pieceEdge(draft.drawing.block.roles.front, "hem"))).toBeCloseTo((110 + 11.5) / 4, 8);
    expect(edgeLength(pieceEdge(draft.drawing.block.roles.front, "side"))).toBeCloseTo(78 - 25.2, 8);
    const capLeft = pieceEdge(draft.drawing.block.roles.sleeve, "capLeft");
    expect(capLeft.kind === "curve" && capLeft.curve.end.x * 2).toBeCloseTo(38 + 3 + 3, 8);
  });

  it("preserves a stale or invalid edit as a blocking reason, with a usable draft", async () => {
    const edited = await editedTeeInputs();
    const stale = await resolveTeeDraft({ ...edited, measurements: { ...edited.measurements, chest: 105 } });
    expect(stale.issue).toMatch(/source pattern or its reviewed inputs changed/i);
    expect(stale.anchors).toEqual([]);
    expect(stale.source).toBeNull();
    expect(() => assembleTee(stale.source)).toThrow(/validated source revision/);
    expect(stale.drawing).toEqual((await resolveTeeDraft({
      ...edited, measurements: { ...edited.measurements, chest: 105 }, edits: null,
    })).drawing);

    const edits = edited.edits!;
    const operation = edits.operations[0];
    const move = operation.moves[0];
    const staleTarget = await resolveTeeDraft({ ...edited, edits: {
      ...edits, operations: [{ ...operation, moves: [{ ...move, signature: move.signature + "-old" }] }],
    } });
    expect(staleTarget.issue).toMatch(/changed meaning/);
    expect(staleTarget.source).toBeNull();
    expect(() => assembleTee(staleTarget.source)).toThrow(/validated source revision/);
    const invalid = await resolveTeeDraft(await addTeeMove(defaultTeeInputs(), asymmetricAnchor, -200, 0, "invalid"));
    expect(invalid.issue).toMatch(/fold|stitch|crossing/i);
    expect(invalid.source).toBeNull();
    expect(invalid.drawing.cuts.front.length).toBeGreaterThan(3);
  });

  it.each([
    [{ size: 3 }, /XS–XL/],
    [{ chestEase: 13 }, /7–12/],
    [{ measurements: { ...defaultTeeInputs().measurements, chest: NaN } }, /finite/],
    [{ measurements: { ...defaultTeeInputs().measurements, length: 75 } }, /Classic base body length/],
    [{ measurements: { ...defaultTeeInputs().measurements, ease: 13 } }, /Classic torso ease/],
  ] as const)("rejects an invalid input", async (override, reason) => {
    await expect(resolveTeeDraft({ ...defaultTeeInputs(), ...override })).rejects.toThrow(reason);
  });

  it("separates corrupt app saves, catalog saves, and unsupported saved options", async () => {
    expect(() => loadSavedClassicTee("{}")).toThrow();
    expect(() => loadGenericClassicTee("{}")).toThrow();
    expect(() => loadGenericClassicTee(savedTee())).toThrow(/without a catalog starter/);
    expect(() => loadSavedClassicTee(savedTee({ options: { formerTeeOption: 2 } })))
      .toThrow(/Unsupported saved Tee option: formerTeeOption/);
    const generic = loadGenericClassicTee(serialize(STANDARD_M, "#123456"));
    expect(generic).toMatchObject({ chestEase: null, neckband: {} });

    const custom = { ...generic, size: "custom" as const };
    const reopened = await reopenCandidateTee(await saveCandidateTee(custom));
    expect(reopened.size).toBe("custom");
    expect(reopened.provenance).toEqual(custom.provenance);
    const graded = JSON.parse(await saveCandidateTee({ ...generic, size: 1 }));
    await expect(reopenCandidateTee(JSON.stringify({ ...graded, customSize: true })))
      .rejects.toThrow(/inconsistent size choices/);
  });

  it("rejects corrupt saved input and invalid operation data", async () => {
    const baseline = defaultTeeInputs();
    expect(() => parseTeeInputs(null)).toThrow("invalid");
    expect(() => parseTeeInputs([])).toThrow("invalid");
    expect(() => parseTeeInputs({})).toThrow("missing");
    expect(() => parseTeeInputs({ ...baseline, measurements: [] })).toThrow("missing");
    expect(() => parseTeeInputs({ ...baseline, measurements: 5 })).toThrow("missing");
    expect(() => parseTeeInputs({ ...baseline, measurements: {} })).toThrow("missing");
    expect(() => parseTeeInputs({ ...baseline, size: undefined })).toThrow("missing");
    expect(() => parseTeeInputs({ ...baseline, chestEase: undefined })).toThrow("missing");
    expect(() => parseTeeInputs({ ...baseline, teeVNeckDropCm: 10 })).toThrow("unsupported");
    expect(() => parseTeeInputs({ ...baseline, options: { teeScoopNeckDropCm: 15 } })).toThrow("unsupported");
    expect(() => parseTeeInputs({ ...baseline, measurements: { ...baseline.measurements, angle: 1 } })).toThrow("unsupported");
    expect(() => parseTeeInputs({ ...baseline, edits: {} })).toThrow("edits");
    await expect(reopenCandidateTee("null")).rejects.toThrow(/lacks a verified Classic Tee draft/);
    await expect(reopenCandidateTee(JSON.stringify({ appSave: savedTee(), customSize: "yes" })))
      .rejects.toThrow(/lacks a verified Classic Tee draft/);
    expect(() => parseTeeInputs({ ...baseline, neckband: [] })).toThrow(/neckband settings are invalid/);
    expect(() => parseTeeInputs({ ...baseline, neckband: { unknownWidth: 2 } })).toThrow(/Unsupported neckband/);
    expect(parseTeeInputs(baseline)).toEqual(baseline);
    await expect(addTeeMove(baseline, "missing", 1, 0, "operation")).rejects.toThrow("not present");
  });

  it("leaves a source-rejected wide sleeve visible and rejects nonfinite cutting contours", async () => {
    const baseline = defaultTeeInputs();
    const impossible = { ...baseline, measurements: { ...baseline.measurements, bicep: 60, armholeDepth: 12 } };
    const sourceRejected = await resolveTeeDraft(impossible);
    expect(sourceRejected.issue).toMatch(/sleeve.cap/i);
    const cut = vi.spyOn(allowance, "seamAllowance");
    try {
      cut.mockReturnValueOnce([{ x: NaN, y: 0 }]);
      await expect(resolveTeeDraft(baseline)).rejects.toThrow(/invalid cutting contour/i);
      cut.mockReturnValueOnce([{ x: NaN, y: 0 }]);
      await expect(resolveTeeDraft(impossible)).rejects.toThrow(/sleeve.cap/i);
    } finally {
      cut.mockRestore();
    }
  });
});
