// @vitest-environment jsdom
import { webcrypto } from "node:crypto";
import { IDBFactory } from "fake-indexeddb";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountApp } from "./app";
import { openProjectWorkflow, type ProjectWorkflow } from "./project-workflow";
import * as persist from "./persist";
import type { ArtworkAssetStore } from "../surface/artwork-store";

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
    await vi.waitFor(() => expect(workflow!.snapshot.activeRecovery).toBeNull());
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
    expect(root.querySelector("#persist-status")?.textContent).toContain("Save failed:");
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
    await vi.waitFor(() => expect(root!.querySelector("#project-persistence-state")?.textContent).toBe("Saved in this style"));
    rejectClear(new Error("old style clear failed"));
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector("#project-persistence-state")?.textContent).toBe("Saved in this style");
  }, 120_000);
});
