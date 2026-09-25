// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountApp } from "./app";
import { openProjectWorkflow, type ProjectWorkflow } from "./project-workflow";
import * as persist from "./persist";
import type { ArtworkAssetStore } from "../surface/artwork-store";
import { currentFieldObservation, getFieldDefinition } from "./field-provenance";

const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const FIRST_STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const SECOND_STYLE_ID = "e8ff457f-982e-4b50-a12b-74bc5cc8fdd4";
const THIRD_STYLE_ID = "1f8eafbf-9f75-4d82-9a43-3557ae359de8";
let workflow: ProjectWorkflow | null = null;
let root: HTMLDivElement | null = null;

const assets: ArtworkAssetStore = {
  put: vi.fn(async () => undefined),
  get: vi.fn(async () => null),
  remove: vi.fn(async () => undefined),
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  workflow?.close();
  workflow = null;
  root?.remove();
  root = null;
});

describe("repository-backed app workflow", () => {
  it("flushes a pending input before opening its field history dialog", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-history-flush-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });

    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "104";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('button[data-open-field-history="body.chest-girth"]')!.click();

    const dialog = root.querySelector<HTMLDialogElement>("#field-history-dialog")!;
    await vi.waitFor(() => expect(dialog.textContent).toContain("raw “104” · canonical 104 cm"));
    expect(workflow.snapshot.fieldObservations.find((record) => record.styleId === FIRST_STYLE_ID)
      ?.observations.filter((observation) => observation.fieldId === "body.chest-girth")).toHaveLength(2);
  });

  it("keeps field history closed and reports when the pending write fails", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-history-flush-failure-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });

    const historyWrite = vi.spyOn(workflow, "recordFieldHistory")
      .mockRejectedValueOnce(new Error("simulated history storage failure"));
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "104";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('button[data-open-field-history="body.chest-girth"]')!.click();

    await vi.waitFor(() => expect(historyWrite).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("Field history save failed"));
    expect(root.querySelector<HTMLDialogElement>("#field-history-dialog")!.open).toBe(false);
    expect(chest.value).toBe("104");
  });

  it("shows a safe message when flushing history rejects a non-Error value", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-history-flush-non-error-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });

    vi.spyOn(window, "clearTimeout").mockImplementationOnce(() => { throw null; });
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "104";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('button[data-open-field-history="body.chest-girth"]')!.click();

    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("Pending field history could not be saved"));
    expect(root.querySelector<HTMLDialogElement>("#field-history-dialog")!.open).toBe(false);
    expect(chest.value).toBe("104");
  });

  it("preserves a recovery failure when the field-history write later succeeds", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-history-recovery-failure-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });

    vi.spyOn(workflow, "saveRecovery").mockRejectedValueOnce(new Error("simulated recovery failure"));
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "104";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("Recovery save failed"));
    await vi.waitFor(() => expect(workflow!.snapshot.fieldObservations.find((record) => record.styleId === FIRST_STYLE_ID)
      ?.observations.some((observation) => observation.fieldId === "body.chest-girth" && observation.rawValue === "104"))
      .toBe(true), { timeout: 10_000 });
    expect(root.querySelector<HTMLElement>("#project-persistence-state")?.textContent).toContain("Recovery save failed");
    expect(chest.value).toBe("104");
  });

  it("persists an edited style's recovery, switches, restores, saves, duplicates, archives, and reloads", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID, SECOND_STYLE_ID, THIRD_STYLE_ID];
        return () => ids.shift() ?? THIRD_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });

    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    vi.spyOn(workflow.repository, "saveRecovery")
      .mockRejectedValueOnce(Object.assign(new Error("stale recovery"), { code: "conflict" }))
      .mockRejectedValueOnce(new Error("disk full"));
    chest.value = "111";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent)
      .toContain("Stale project · reload before continuing to save."));
    expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("stale");
    chest.value = "111";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent)
      .toContain("Recovery save failed"));
    expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("failed");
    chest.value = "111";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(workflow!.snapshot.activeRecovery?.payload.rawMeasurements.chest).toBe("111"));
    expect(root.querySelector("#project-persistence-state")?.textContent).toContain("recovery saved");

    // A fresh app mount must present the project's active-style recovery before
    // the user can continue editing it.
    root.remove();
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });
    await vi.waitFor(() => expect(root!.querySelector("#recovery-host")?.textContent).toContain("Unfinished draft found"));

    const manager = root.querySelector<HTMLElement>("#project-manager-host")!;
    manager.querySelector<HTMLInputElement>("#project-style-name")!.value = "Fresh start";
    manager.querySelector<HTMLButtonElement>("[data-project-action='create']")!.click();
    await vi.waitFor(() => expect(workflow!.snapshot.activeStyle.id).toBe(SECOND_STYLE_ID));
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-manager-status")?.textContent).toContain("Created Fresh start"));
    expect(workflow!.snapshot.activeStyle.design.workspace.garment).toBe("tee");

    manager.querySelector<HTMLButtonElement>(`[data-project-action='switch'][data-style-id='${FIRST_STYLE_ID}']`)!.click();
    await vi.waitFor(() => expect(workflow!.snapshot.activeStyle.id).toBe(FIRST_STYLE_ID));
    await vi.waitFor(() => expect(root!.querySelector("#recovery-host")?.textContent).toContain("Unfinished draft found"));

    vi.spyOn(workflow!.repository, "clearRecovery").mockRejectedValueOnce(new Error("cannot clear"));
    root.querySelector<HTMLButtonElement>("#recovery-discard")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent)
      .toContain("Recovery clear failed: cannot clear"));
    expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("failed");
    manager.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-manager-status")?.textContent).toContain("Reloaded"));
    await vi.waitFor(() => expect(root!.querySelector("#recovery-host")?.textContent).toContain("Unfinished draft found"));

    vi.spyOn(workflow!.repository, "clearRecovery").mockRejectedValueOnce(null);
    root.querySelector<HTMLButtonElement>("#recovery-discard")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent)
      .toContain("Recovery clear failed: storage error"));
    manager.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-manager-status")?.textContent).toContain("Reloaded"));
    await vi.waitFor(() => expect(root!.querySelector("#recovery-host")?.textContent).toContain("Unfinished draft found"));

    // Choosing the saved design deliberately discards the recovery record;
    // successful clearing must report the style as saved and remove the prompt.
    root.querySelector<HTMLButtonElement>("#load-pattern")!.click();
    const loadConfirmation = root.querySelector<HTMLElement>("#workspace-confirm")!;
    if (!loadConfirmation.hidden) {
      root.querySelector<HTMLButtonElement>("#workspace-confirm-accept")!.click();
    }
    await vi.waitFor(() => expect(workflow!.snapshot.activeRecovery).toBeNull(), { timeout: 10_000 });
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent).toBe("Saved in this style"));
    expect(root.querySelector("#recovery-host")?.textContent).not.toContain("Unfinished draft found");

    const chestAfterReload = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chestAfterReload.value = "111";
    chestAfterReload.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(workflow!.snapshot.activeRecovery?.payload.rawMeasurements.chest).toBe("111"));
    manager.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-manager-status")?.textContent).toContain("Reloaded"));
    await vi.waitFor(() => expect(root!.querySelector("#recovery-host")?.textContent).toContain("Unfinished draft found"));
    root.querySelector<HTMLButtonElement>("#recovery-accept")!.click();
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("111");

    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    await vi.waitFor(() => expect(workflow!.snapshot.activeStyle.design.measurements.chest).toBe(111));
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent).toContain("Saved in this style"));
    expect(workflow!.snapshot.activeRecovery).toBeNull();
    expect(JSON.parse(localStorage.getItem("patternworks_save_v1")!).measurements.chest).toBe(111);

    const nestBuffer = root.querySelector<HTMLInputElement>("#nest-buffer")!;
    nestBuffer.value = "12";
    nestBuffer.dispatchEvent(new Event("input", { bubbles: true }));
    const availableLength = root.querySelector<HTMLInputElement>("#nest-available")!;
    availableLength.value = "200";
    availableLength.dispatchEvent(new Event("input", { bubbles: true }));
    manager.querySelector<HTMLButtonElement>("[data-project-action='duplicate']")!.click();
    await vi.waitFor(() => expect(workflow!.snapshot.activeStyle.id).toBe(THIRD_STYLE_ID));
    expect(workflow!.snapshot.activeStyle.name).toBe("Copy of Untitled tee");
    expect(workflow!.snapshot.activeStyle.design.measurements.chest).toBe(111);
    expect(workflow.snapshot.activeStyle.design.nestingIntelligence.availableLengthCm).toBe(200);

    root.querySelector<HTMLInputElement>("#nest-buffer")!.value = "";
    root.querySelector<HTMLInputElement>("#nest-buffer")!.dispatchEvent(new Event("input", { bubbles: true }));
    root.querySelector<HTMLInputElement>("#nest-available")!.value = "";
    root.querySelector<HTMLInputElement>("#nest-available")!.dispatchEvent(new Event("input", { bubbles: true }));
    manager.querySelector<HTMLButtonElement>("[data-project-action='duplicate']")!.click();
    expect(root.querySelector("#project-manager-status")?.textContent)
      .toContain("Correct invalid design values before duplicating this style.");
    root.querySelector<HTMLInputElement>("#nest-buffer")!.value = "10";
    root.querySelector<HTMLInputElement>("#nest-buffer")!.dispatchEvent(new Event("input", { bubbles: true }));

    manager.querySelector<HTMLButtonElement>(`[data-project-action='archive'][data-style-id='${SECOND_STYLE_ID}']`)!.click();
    await vi.waitFor(() => expect(workflow!.snapshot.styles.find((style) => style.id === SECOND_STYLE_ID)?.archivedAt).not.toBeNull());
    manager.querySelector<HTMLButtonElement>(`[data-project-action='restore'][data-style-id='${SECOND_STYLE_ID}']`)!.click();
    await vi.waitFor(() => expect(workflow!.snapshot.styles.find((style) => style.id === SECOND_STYLE_ID)?.archivedAt).toBeNull());

    manager.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-manager-status")?.textContent).toContain("Reloaded"));
    expect(root.querySelector<HTMLDetailsElement>(".project-manager-details")?.open).toBe(false);

    root.querySelector<HTMLButtonElement>("#load-pattern")!.click();
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("111");

    const loadedChest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    loadedChest.value = "";
    loadedChest.dispatchEvent(new Event("input", { bubbles: true }));
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#persist-status")?.textContent).toContain("Save failed:"));
    loadedChest.value = "111";
    loadedChest.dispatchEvent(new Event("input", { bubbles: true }));

    vi.spyOn(workflow!.repository, "saveProjectBundle").mockRejectedValueOnce(
      Object.assign(new Error("Simulated stale save"), { code: "conflict" }),
    );
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent)
      .toContain("Stale project · reload the project before saving these edits."));

    vi.spyOn(workflow!.repository, "saveProjectBundle").mockRejectedValueOnce(new Error("disk full"));
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent).toBe("Save failed: disk full"));
    expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("failed");

    vi.spyOn(workflow!.repository, "saveProjectBundle").mockRejectedValueOnce(null);
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent)
      .toBe("Save failed: project storage error"));

    vi.spyOn(persist, "saveToStorage").mockReturnValueOnce(false);
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent)
      .toBe("Saved in this style · older single-style copy unavailable"));
    expect(workflow!.snapshot.activeStyle.design.measurements.chest).toBe(111);
  }, 120_000);

  it("fails visibly and leaves the project unchanged when the default style template is invalid", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-invalid-default-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });

    vi.spyOn(persist, "deserialize").mockReturnValueOnce({ ok: false, error: "broken default" });
    const manager = root.querySelector<HTMLElement>("#project-manager-host")!;
    manager.querySelector<HTMLInputElement>("#project-style-name")!.value = "Should not exist";
    manager.querySelector<HTMLButtonElement>("[data-project-action='create']")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-manager-status")?.textContent)
      .toContain("Default style is invalid: broken default"));
    expect(workflow.snapshot.styles).toHaveLength(1);
    expect(workflow.snapshot.activeStyle.id).toBe(FIRST_STYLE_ID);
  });

  it("shows and reloads invalid raw field provenance through the mounted project workflow", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-field-history-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });

    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "9999";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => {
      const record = workflow!.snapshot.fieldObservations.find((candidate) => candidate.styleId === FIRST_STYLE_ID);
      expect(currentFieldObservation(record, getFieldDefinition("tee", "chest")!)).toMatchObject({
        rawValue: "9999", canonicalValue: 9999, provenance: "USER_CAPTURED", validationStatus: "INVALID",
      });
    });
    chest.dispatchEvent(new Event("focusout", { bubbles: true }));
    chest.dispatchEvent(new Event("change", { bubbles: true }));
    await workflow.recordFieldHistory(FIRST_STYLE_ID, workflow.snapshot.activeRecovery!.payload, {
      recipeId: "tee", inputKind: "measurement", inputKey: "chest",
    });
    expect(workflow.snapshot.fieldObservations.find((candidate) => candidate.styleId === FIRST_STYLE_ID)
      ?.observations.filter((observation) => observation.fieldId === "body.chest-girth")).toHaveLength(2);

    const openHistory = (): HTMLButtonElement => root!.querySelector<HTMLButtonElement>(
      'button[data-open-field-history="body.chest-girth"]',
    )!;
    expect(openHistory().parentElement?.textContent).toContain("User entered · UNCONFIRMED · INVALID");
    openHistory().click();
    const dialog = root.querySelector<HTMLDialogElement>("#field-history-dialog")!;
    await vi.waitFor(() => expect(dialog.textContent).toContain("raw “9999” · canonical 9999 cm"));
    expect(dialog.textContent).toContain("This record does not establish fit or production validity.");
    root.querySelector<HTMLButtonElement>("button[data-close-field-history]")!.click();
    expect(dialog.open).toBe(false);

    root.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-manager-status")?.textContent).toContain("Reloaded"));
    expect(workflow.snapshot.activeRecovery?.payload.rawMeasurements.chest).toBe("9999");
    expect(currentFieldObservation(
      workflow.snapshot.fieldObservations.find((candidate) => candidate.styleId === FIRST_STYLE_ID),
      getFieldDefinition("tee", "chest")!,
    )).toMatchObject({ rawValue: "9999", validationStatus: "INVALID" });
    openHistory().click();
    await vi.waitFor(() => expect(dialog.textContent).toContain("raw “9999” · canonical 9999 cm"));
    root.querySelector<HTMLButtonElement>("button[data-close-field-history]")!.click();

    let payload = workflow.snapshot.activeRecovery!.payload;
    for (let index = 0; index < 27; index += 1) {
      const value = 1000 + index;
      payload = {
        ...payload,
        measurements: { ...payload.measurements, chest: value },
        rawMeasurements: { ...payload.rawMeasurements, chest: String(value) },
      };
      await workflow.recordFieldHistory(FIRST_STYLE_ID, payload, {
        recipeId: "tee", inputKind: "measurement", inputKey: "chest",
      });
    }
    const showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute("open", ""); });
    Object.defineProperty(dialog, "showModal", { configurable: true, value: showModal });
    openHistory().click();
    await vi.waitFor(() => expect(showModal).toHaveBeenCalledOnce());
    expect(dialog.textContent).toContain("Page 1 of 2");
    root.querySelector<HTMLButtonElement>('button[data-field-history-page="1"]')!.click();
    expect(dialog.textContent).toContain("Page 2 of 2");
    root.querySelector<HTMLButtonElement>('button[data-field-history-page="0"]')!.click();
    expect(dialog.textContent).toContain("Page 1 of 2");
    const closeDialog = vi.fn(function (this: HTMLDialogElement) { this.removeAttribute("open"); });
    Object.defineProperty(dialog, "close", { configurable: true, value: closeDialog });
    root.querySelector<HTMLButtonElement>("button[data-close-field-history]")!.click();
    expect(closeDialog).toHaveBeenCalledOnce();
  }, 120_000);

  it("marks a same-value user capture in provenance without dirtying its saved design", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-same-value-history-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });

    root.querySelector<HTMLInputElement>('input[data-field="chest"]')!
      .dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("Saved in this style · field history recorded"));
    expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("saved");
    expect(currentFieldObservation(
      workflow.snapshot.fieldObservations.find((record) => record.styleId === FIRST_STYLE_ID),
      getFieldDefinition("tee", "chest")!,
    )).toMatchObject({ rawValue: "100", provenance: "USER_CAPTURED", validationStatus: "VALID" });
    expect(workflow.snapshot.activeStyle.design.measurements.chest).toBe(100);
  }, 120_000);

  it("ignores a delayed field-history write from a replaced app mount", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-detached-history-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    const firstRoot = document.createElement("div");
    root = firstRoot;
    document.body.append(firstRoot);
    mountApp(firstRoot, { projectWorkflow: workflow, artworkAssetStore: assets });
    const definition = getFieldDefinition("tee", "chest")!;
    const before = workflow.snapshot.fieldObservations.find((record) => record.styleId === FIRST_STYLE_ID)!;
    const priorHistoryLength = before.observations.filter((entry) => entry.fieldId === definition.id).length;

    const chest = firstRoot.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "109";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(workflow!.snapshot.activeRecovery?.payload.rawMeasurements.chest).toBe("109"));

    firstRoot.remove();
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });
    await new Promise((resolve) => window.setTimeout(resolve, 500));

    const after = workflow.snapshot.fieldObservations.find((record) => record.styleId === FIRST_STYLE_ID)!;
    expect(after.observations.filter((entry) => entry.fieldId === definition.id)).toHaveLength(priorHistoryLength);
    expect(currentFieldObservation(after, definition)).toEqual(currentFieldObservation(before, definition));
    expect(workflow.snapshot.activeRecovery?.payload.rawMeasurements.chest).toBe("109");
  }, 120_000);

  it("ignores delayed field-history success or failure after the active style changes", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-stale-field-history-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID, SECOND_STYLE_ID];
        return () => ids.shift() ?? THIRD_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    await workflow.createStyle("Second style", workflow.snapshot.activeStyle.design);
    await workflow.switchStyle(FIRST_STYLE_ID);
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });

    let resolveOldWrite!: () => void;
    let rejectOldWrite!: (error: unknown) => void;
    const delayedSuccess = new Promise<void>((resolve) => { resolveOldWrite = resolve; });
    const delayedFailure = new Promise<void>((_resolve, reject) => { rejectOldWrite = reject; });
    const historyWrite = vi.spyOn(workflow, "recordFieldHistory")
      .mockReturnValueOnce(delayedSuccess)
      .mockReturnValueOnce(delayedFailure);
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "109";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(historyWrite).toHaveBeenCalledTimes(1), { timeout: 2_000 });
    await workflow.switchStyle(SECOND_STYLE_ID);
    resolveOldWrite();
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .not.toContain("field history recorded");

    const secondEdit = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    secondEdit.value = "110";
    secondEdit.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(historyWrite).toHaveBeenCalledTimes(2), { timeout: 2_000 });
    await workflow.switchStyle(FIRST_STYLE_ID);
    rejectOldWrite(new Error("old style write failed"));
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .not.toContain("Field history save failed");
  }, 120_000);

  it("ignores a delayed recovery failure after the user has switched to another style", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-stale-recovery-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID, SECOND_STYLE_ID];
        return () => ids.shift() ?? THIRD_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });
    let rejectPending!: (error: unknown) => void;
    const pendingRecovery = new Promise<void>((_resolve, reject) => { rejectPending = reject; });
    vi.spyOn(workflow, "saveRecovery").mockReturnValueOnce(pendingRecovery);
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "109";
    chest.dispatchEvent(new Event("input", { bubbles: true }));

    const manager = root.querySelector<HTMLElement>("#project-manager-host")!;
    manager.querySelector<HTMLInputElement>("#project-style-name")!.value = "Second style";
    manager.querySelector<HTMLInputElement>("#project-style-name")!.dispatchEvent(new Event("input", { bubbles: true }));
    manager.querySelector<HTMLButtonElement>("[data-project-action='create']")!.click();
    await vi.waitFor(() => expect(workflow!.snapshot.activeStyle.id).toBe(SECOND_STYLE_ID));
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent).toBe("Saved in this style"));
    rejectPending(new Error("old style storage failed"));
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector("#project-persistence-state")?.textContent).toBe("Saved in this style");

    const chestOnSecondStyle = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chestOnSecondStyle.value = "112";
    chestOnSecondStyle.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(workflow!.snapshot.activeRecovery?.payload.rawMeasurements.chest).toBe("112"));
    const managerOnSecondStyle = root.querySelector<HTMLElement>("#project-manager-host")!;
    managerOnSecondStyle.querySelector<HTMLButtonElement>("[data-project-action='reload']")!.click();
    await vi.waitFor(() => expect(root!.querySelector("#project-manager-status")?.textContent).toContain("Reloaded"));
    await vi.waitFor(() => expect(root!.querySelector("#recovery-host")?.textContent).toContain("Unfinished draft found"));
    let rejectClear!: (error: unknown) => void;
    const pendingClear = new Promise<void>((_resolve, reject) => { rejectClear = reject; });
    vi.spyOn(workflow, "clearRecovery").mockReturnValueOnce(pendingClear);
    root.querySelector<HTMLButtonElement>("#recovery-discard")!.click();
    managerOnSecondStyle.querySelector<HTMLButtonElement>(`[data-project-action='switch'][data-style-id='${FIRST_STYLE_ID}']`)!.click();
    await vi.waitFor(() => expect(workflow!.snapshot.activeStyle.id).toBe(FIRST_STYLE_ID));
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent)
      .toBe("Style loaded · unfinished recovery is available below"));
    rejectClear(new Error("old style clear failed"));
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector("#project-persistence-state")?.textContent)
      .toBe("Style loaded · unfinished recovery is available below");
  }, 120_000);

  it("blocks garment changes, Save, and Load when exact field history could not be persisted", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-field-history-failure-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });
    const failNextHistoryWrite = (): void => {
      vi.spyOn(workflow!, "recordFieldHistory").mockRejectedValueOnce(new Error("simulated storage failure"));
    };

    let chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "109";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("style recovery saved"), { interval: 10, timeout: 10_000 });
    failNextHistoryWrite();
    root.querySelector<HTMLButtonElement>("#garment-trouser")!.click();
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("Field history save failed · exact input is unsaved in this window; retry before leaving."));
    expect(root.querySelector<HTMLButtonElement>("#garment-tee")!.getAttribute("aria-pressed")).toBe("true");
    expect(workflow.snapshot.activeRecovery?.payload.rawMeasurements.chest).toBe("109");
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("109");

    chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "110";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("style recovery saved"), { interval: 10, timeout: 10_000 });
    failNextHistoryWrite();
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("Field history save failed · exact input is unsaved in this window; retry before leaving."));
    expect(workflow.snapshot.activeStyle.design.measurements.chest).toBe(100);

    chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "111";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("style recovery saved"), { interval: 10, timeout: 10_000 });
    failNextHistoryWrite();
    root.querySelector<HTMLButtonElement>("#load-pattern")!.click();
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("Field history save failed · exact input is unsaved in this window; retry before leaving."));
    expect(root.querySelector<HTMLInputElement>('input[data-field="chest"]')!.value).toBe("111");
    expect(workflow.snapshot.activeStyle.design.measurements.chest).toBe(100);

    chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "112";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("style recovery saved"), { interval: 10, timeout: 10_000 });
    vi.spyOn(workflow, "recordFieldHistory").mockRejectedValueOnce(
      Object.assign(new Error("another tab saved"), { code: "conflict" }),
    );
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("Stale project · reload before recording field history."));
  }, 120_000);

  it("keeps the source summary usable if a loaded style has no field-history record", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-missing-field-history-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#project-persistence-state")?.textContent)
      .toContain("field history recorded"));

    chest.value = "101";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(workflow!.snapshot.activeRecovery?.payload.rawMeasurements.chest).toBe("101"));
    const activeWorkflow = workflow;
    vi.spyOn(activeWorkflow, "recordFieldHistory").mockImplementation(async () => {
      const state = activeWorkflow as unknown as { loaded: typeof activeWorkflow.snapshot };
      state.loaded = { ...activeWorkflow.snapshot, fieldObservations: [] };
    });
    chest.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(root!.querySelector(
      'button[data-open-field-history="body.chest-girth"]',
    )?.parentElement?.textContent).toContain("No value history recorded for this recipe field yet."));
  });

  it("reports a non-Error timer failure and blocks a pending recipe switch", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-timer-failure-switch-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });
    root.querySelector<HTMLButtonElement>("#garment-trouser")!.click();
    expect(root.querySelector<HTMLButtonElement>("#garment-trouser")!.getAttribute("aria-pressed")).toBe("true");
    root.querySelector<HTMLButtonElement>("#garment-tee")!.click();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "101";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout").mockImplementationOnce(() => { throw "timer failure"; });
    try {
      root.querySelector<HTMLButtonElement>("#garment-trouser")!.click();
      await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#persist-status")?.textContent)
        .toContain("Pending field history could not be saved."));
      expect(root.querySelector<HTMLButtonElement>("#garment-tee")!.getAttribute("aria-pressed")).toBe("true");
    } finally {
      clearTimeoutSpy.mockRestore();
    }
  });

  it("reports a non-Error timer failure on Save before committing an edited design", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-timer-failure-save-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "101";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout").mockImplementationOnce(() => { throw "timer failure"; });
    try {
      root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
      await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#persist-status")?.textContent)
        .toContain("Pending field history could not be saved."));
      expect(workflow.snapshot.activeStyle.design.measurements.chest).toBe(100);
      expect(chest.value).toBe("101");
    } finally {
      clearTimeoutSpy.mockRestore();
    }
  });

  it("reports a non-Error timer failure on Load and preserves the raw editor value", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-timer-failure-load-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "101";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    const clearTimeoutSpy = vi.spyOn(window, "clearTimeout").mockImplementationOnce(() => { throw "timer failure"; });
    try {
      root.querySelector<HTMLButtonElement>("#load-pattern")!.click();
      await vi.waitFor(() => expect(root!.querySelector<HTMLElement>("#persist-status")?.textContent)
        .toContain("Pending field history could not be saved."));
      expect(workflow.snapshot.activeStyle.design.measurements.chest).toBe(100);
      expect(chest.value).toBe("101");
    } finally {
      clearTimeoutSpy.mockRestore();
    }
  });

  it("does not write a detached recipe field after switching garments", async () => {
    workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `project-app-stale-recipe-field-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: (() => {
        const ids = [PROJECT_ID, FIRST_STYLE_ID];
        return () => ids.shift() ?? SECOND_STYLE_ID;
      })(),
      now: () => "2026-09-24T16:00:00.000Z",
    });
    root = document.createElement("div");
    document.body.append(root);
    mountApp(root, { projectWorkflow: workflow, artworkAssetStore: assets });
    const detachedChest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    const historyCount = workflow.snapshot.fieldObservations[0].observations.length;
    root.querySelector<HTMLButtonElement>("#garment-trouser")!.click();
    detachedChest.dispatchEvent(new Event("change", { bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();
    expect(workflow.snapshot.fieldObservations[0].observations).toHaveLength(historyCount);
    expect(root.querySelector<HTMLButtonElement>("#garment-trouser")!.getAttribute("aria-pressed")).toBe("true");
  });
});
