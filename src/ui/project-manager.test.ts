// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { STANDARD_M } from "../drafting";
import { migrateLegacySaveFile, type SavedDesign } from "./project-records";
import { serialize } from "./persist";
import { ProjectManager } from "./project-manager";
import type { LoadedProject } from "./project-repository";
import type { ProjectWorkflow } from "./project-workflow";

const TIME = "2026-09-24T16:00:00.000Z";
const PROJECT_ID = "a02b8322-8f57-46bb-9d16-16ac1fcf6811";
const STYLE_ID = "b53a1a03-ea2e-4c4f-82dc-14ac86a29895";
const STYLE_TWO_ID = "e8ff457f-982e-4b50-a12b-74bc5cc8fdd4";

function loadedProject(): LoadedProject {
  const result = migrateLegacySaveFile({
    json: serialize(STANDARD_M, "#3A4150"), projectId: PROJECT_ID, styleId: STYLE_ID, migratedAt: TIME,
  });
  if (!result.ok) throw new Error(result.error);
  const second = { ...result.value.style, id: STYLE_TWO_ID, name: "Second style" };
  const project = { ...result.value.project, styleIds: [STYLE_ID, STYLE_TWO_ID] };
  return { project, styles: [result.value.style, second], activeStyle: result.value.style, activeRecovery: null };
}

function harness() {
  const initial = loadedProject();
  let snapshot = initial;
  const second = { ...initial.styles[1], archivedAt: null };
  const loadedSecond: LoadedProject = {
    project: { ...initial.project, activeStyleId: STYLE_TWO_ID },
    styles: [initial.styles[0], second], activeStyle: second,
    activeRecovery: { schemaVersion: 1, styleId: STYLE_TWO_ID, payload: {} } as LoadedProject["activeRecovery"],
  };
  const workflow = {
    get snapshot() { return snapshot; },
    createStyle: vi.fn(async (name: string) => {
      const created = { ...second, name };
      snapshot = { ...loadedSecond, styles: [initial.styles[0], created], activeStyle: created };
      return snapshot;
    }),
    renameActiveStyle: vi.fn(async (name: string) => {
      const renamed = { ...snapshot.activeStyle, name };
      snapshot = { ...snapshot, styles: snapshot.styles.map((style) => style.id === renamed.id ? renamed : style), activeStyle: renamed };
      return snapshot;
    }),
    reload: vi.fn(async () => { snapshot = loadedSecond; return snapshot; }),
    switchStyle: vi.fn(async (id: string) => { snapshot = id === STYLE_ID ? initial : loadedSecond; return snapshot; }),
    archiveStyle: vi.fn(async () => {
      const archived = { ...initial.styles[1], archivedAt: TIME };
      snapshot = { ...initial, styles: [initial.styles[0], archived] };
      return { ...snapshot, styles: [initial.styles[0]] };
    }),
    restoreStyle: vi.fn(async () => {
      snapshot = { ...loadedSecond, styles: [initial.styles[0]] };
      return snapshot;
    }),
  } as unknown as ProjectWorkflow;
  const host = document.createElement("div");
  document.body.append(host);
  const setBusy = vi.fn();
  const onStyleLoaded = vi.fn();
  let currentDesign: SavedDesign | null = initial.activeStyle.design;
  let unsavedChanges = true;
  const manager = new ProjectManager({
    host,
    workflow,
    getCurrentDesign: () => currentDesign,
    getBlankDesign: () => initial.activeStyle.design,
    hasUnsavedChanges: () => unsavedChanges,
    onStyleLoaded,
    setBusy,
  });
  return {
    host, manager, workflow, setBusy, onStyleLoaded,
    setCurrentDesign: (value: SavedDesign | null) => { currentDesign = value; },
    setUnsavedChanges: (value: boolean) => { unsavedChanges = value; },
    setSnapshot: (value: LoadedProject) => { snapshot = value; },
  };
}

async function clickAndSettle(host: HTMLElement, selector: string): Promise<void> {
  host.querySelector<HTMLButtonElement>(selector)!.click();
  await vi.waitFor(() => expect(host.querySelector<HTMLElement>("#project-manager-status")?.textContent).not.toBe("Saving the style change…"));
}

describe("accessible project and style manager", () => {
  it("creates, duplicates, renames, switches, archives, and restores styles", async () => {
    const { host, workflow, setBusy, onStyleLoaded, setUnsavedChanges, setSnapshot, manager } = harness();
    expect(host.textContent).toContain("Current style: Untitled tee");
    expect(host.querySelectorAll("[data-project-action='switch']")).toHaveLength(2);
    expect(host.textContent).toContain("No archived styles.");
    host.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;

    host.querySelector<HTMLInputElement>("#project-style-name")!.value = "A <bright> & \"bold\" 'look'";
    await clickAndSettle(host, "[data-project-action='create']");
    expect(workflow.createStyle).toHaveBeenCalledWith("A <bright> & \"bold\" 'look'", expect.any(Object));
    const escapedArchiveButtons = [...host.querySelectorAll<HTMLButtonElement>("button[aria-label^='Archive A']")];
    expect(escapedArchiveButtons[escapedArchiveButtons.length - 1]?.getAttribute("aria-label"))
      .toBe(`Archive A <bright> & "bold" 'look'`);
    expect(host.querySelector<HTMLDetailsElement>(".project-manager-details")!.open).toBe(true);
    expect(onStyleLoaded).toHaveBeenCalledOnce();
    expect(setBusy).toHaveBeenNthCalledWith(1, true);
    expect(setBusy).toHaveBeenNthCalledWith(2, false);

    await clickAndSettle(host, "[data-project-action='duplicate']");
    expect(workflow.createStyle).toHaveBeenLastCalledWith("Copy of A <bright> & \"bold\" 'look'", expect.any(Object));
    host.querySelector<HTMLInputElement>("#project-style-name")!.value = "Renamed";
    await clickAndSettle(host, "[data-project-action='rename']");
    expect(workflow.renameActiveStyle).toHaveBeenCalledWith("Renamed");
    await clickAndSettle(host, "[data-project-action='reload']");
    expect(workflow.reload).toHaveBeenCalledOnce();
    expect(host.textContent).toContain("latest stored project version is now loaded");
    await clickAndSettle(host, `[data-project-action='switch'][data-style-id='${STYLE_ID}']`);
    expect(workflow.switchStyle).toHaveBeenCalledWith(STYLE_ID);
    expect(host.textContent).toContain("latest stored version remains available");
    const second = workflow.snapshot.styles.find((style) => style.id === STYLE_TWO_ID)!;
    const noRecoveryReload = {
      ...workflow.snapshot,
      project: { ...workflow.snapshot.project, activeStyleId: STYLE_TWO_ID },
      activeStyle: second,
      activeRecovery: null,
    } as LoadedProject;
    setUnsavedChanges(false);
    setSnapshot(noRecoveryReload);
    vi.mocked(workflow.reload).mockResolvedValueOnce(noRecoveryReload);
    await clickAndSettle(host, "[data-project-action='reload']");
    expect(onStyleLoaded).toHaveBeenLastCalledWith(noRecoveryReload, null);
    await clickAndSettle(host, `[data-project-action='switch'][data-style-id='${STYLE_ID}']`);
    expect(workflow.switchStyle).toHaveBeenCalledTimes(2);
    expect(host.textContent).toContain("Switched to Untitled tee.");
    await clickAndSettle(host, `[data-project-action='switch'][data-style-id='${STYLE_TWO_ID}']`);
    expect(onStyleLoaded).toHaveBeenLastCalledWith(
      expect.objectContaining({ activeStyle: expect.objectContaining({ id: STYLE_TWO_ID }) }), {},
    );
    await clickAndSettle(host, `[data-project-action='switch'][data-style-id='${STYLE_ID}']`);
    await clickAndSettle(host, `[data-project-action='archive'][data-style-id='${STYLE_TWO_ID}']`);
    expect(workflow.archiveStyle).toHaveBeenCalledWith(STYLE_TWO_ID);
    expect(host.textContent).toContain("Archived style.");
    expect(host.textContent).toContain("Archived styles");
    await clickAndSettle(host, `[data-project-action='restore'][data-style-id='${STYLE_TWO_ID}']`);
    expect(workflow.restoreStyle).toHaveBeenCalledWith(STYLE_TWO_ID);
    expect(host.textContent).toContain("Restored style.");

    const archivedSnapshot = loadedProject();
    const archivedStyle = { ...archivedSnapshot.styles[1], archivedAt: TIME };
    setSnapshot({ ...archivedSnapshot, styles: [archivedSnapshot.styles[0], archivedStyle] });
    manager.refresh();
    const namedRestore = loadedProject();
    vi.mocked(workflow.restoreStyle).mockResolvedValueOnce(namedRestore);
    await clickAndSettle(host, `[data-project-action='restore'][data-style-id='${STYLE_TWO_ID}']`);
    expect(host.textContent).toContain("Restored Second style.");

    setSnapshot(loadedProject());
    manager.refresh();
    vi.mocked(workflow.archiveStyle).mockResolvedValueOnce(loadedProject());
    await clickAndSettle(host, `[data-project-action='archive'][data-style-id='${STYLE_TWO_ID}']`);
    expect(host.textContent).toContain("Archived Second style.");
    expect(onStyleLoaded).toHaveBeenCalledTimes(8);
  });

  it("keeps invalid duplicates visible and reports conflicts, generic failures, and missing style IDs", async () => {
    const { host, workflow, setCurrentDesign } = harness();
    setCurrentDesign(null);
    host.querySelector<HTMLButtonElement>("[data-project-action='duplicate']")!.click();
    expect(host.textContent).toContain("Correct invalid design values before duplicating");

    vi.mocked(workflow.renameActiveStyle).mockRejectedValueOnce(Object.assign(new Error("stale"), { code: "conflict" }));
    host.querySelector<HTMLInputElement>("#project-style-name")!.value = "Conflict";
    await clickAndSettle(host, "[data-project-action='rename']");
    expect(host.textContent).toContain("changed in another tab");

    vi.mocked(workflow.renameActiveStyle).mockRejectedValueOnce(new Error("Storage is unavailable."));
    await clickAndSettle(host, "[data-project-action='rename']");
    expect(host.textContent).toContain("Storage is unavailable.");

    vi.mocked(workflow.renameActiveStyle).mockRejectedValueOnce(null);
    await clickAndSettle(host, "[data-project-action='rename']");
    expect(host.textContent).toContain("The style change failed.");

    const missing = document.createElement("button");
    missing.dataset.projectAction = "archive";
    missing.textContent = "Missing ID";
    host.append(missing);
    missing.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.waitFor(() => expect(host.textContent).toContain("missing its style ID"));

    const unsupported = document.createElement("button");
    unsupported.dataset.projectAction = "future";
    host.append(unsupported);
    unsupported.click();
    expect(host.textContent).toContain("not supported");
    const text = document.createTextNode("non-element click target");
    host.append(text);
    text.dispatchEvent(new Event("click", { bubbles: true }));
    host.click();
  });

  it("rejects overlapping actions while the repository operation is pending and bounds copied names", async () => {
    const { host, workflow, setBusy } = harness();
    let finish!: (value: LoadedProject) => void;
    vi.mocked(workflow.createStyle).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    host.querySelector<HTMLInputElement>("#project-style-name")!.value = "Slow style";
    host.querySelector<HTMLButtonElement>("[data-project-action='create']")!.click();
    host.querySelector<HTMLButtonElement>("[data-project-action='create']")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(setBusy).toHaveBeenCalledTimes(1);
    finish(loadedProject());
    await vi.waitFor(() => expect(setBusy).toHaveBeenCalledTimes(2));

    const longLoaded = loadedProject();
    const longStyle = { ...longLoaded.activeStyle, name: "L".repeat(80) };
    const longWorkflow = {
      ...workflow,
      snapshot: { ...longLoaded, activeStyle: longStyle },
      createStyle: vi.fn(async () => longLoaded),
    } as unknown as ProjectWorkflow;
    const host2 = document.createElement("div");
    const manager2 = new ProjectManager({
      host: host2,
      workflow: longWorkflow,
      getCurrentDesign: () => longStyle.design,
      getBlankDesign: () => longStyle.design,
      hasUnsavedChanges: () => false,
      onStyleLoaded: vi.fn(),
      setBusy: vi.fn(),
    });
    host2.querySelector<HTMLButtonElement>("[data-project-action='duplicate']")!.click();
    await vi.waitFor(() => expect(vi.mocked(longWorkflow.createStyle)).toHaveBeenCalled());
    const copiedName = vi.mocked(longWorkflow.createStyle).mock.calls[0][0];
    expect(copiedName.length).toBeLessThanOrEqual(80);
    expect(copiedName.endsWith("…")).toBe(true);
    manager2.refresh("Done");
  });
});
