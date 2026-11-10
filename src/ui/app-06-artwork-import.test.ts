// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { mountApp, unmountApp } from "./app";

import type { ArtworkAssetStore, StoredArtworkAsset } from "../surface/artwork-store";

import type { InspectedArtworkFile } from "../surface/artwork-file";

type TrackedWindowListener = {
  readonly type: string;
  readonly listener: EventListenerOrEventListenerObject;
  readonly options?: boolean | AddEventListenerOptions;
};

const mountedRoots = new Set<HTMLDivElement>();

const trackedWindowListeners: TrackedWindowListener[] = [];

const addNativeWindowListener = window.addEventListener.bind(window);

const removeNativeWindowListener = window.removeEventListener.bind(window);

const clickId = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLElement>(`#${id}`)!.click();
};

const clickIfPresent = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLElement>(`#${id}`)?.click();
};

function memoryArtworkStore(): {
  readonly store: ArtworkAssetStore;
  readonly records: Map<string, StoredArtworkAsset>;
  setFailWrites(value: boolean): void;
} {
  const records = new Map<string, StoredArtworkAsset>();
  let failWrites = false;
  return {
    records,
    setFailWrites: (value) => { failWrites = value; },
    store: {
      put: vi.fn(async (asset) => {
        if (failWrites) throw new Error("profile is read-only");
        records.set(asset.assetId, asset);
      }),
      get: vi.fn(async (assetId) => records.get(assetId) ?? null),
      remove: vi.fn(async (assetId) => { records.delete(assetId); }),
    },
  };
}

function makeFileList(files: readonly (File | undefined)[], length = files.length): FileList {
  return { 0: files[0], length, item: (index: number) => files[index] ?? null } as unknown as FileList;
}

function setFileList(input: HTMLInputElement, files: readonly (File | undefined)[], length = files.length): void {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: makeFileList(files, length),
  });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function setFileInput(input: HTMLInputElement, selected: File): void {
  setFileList(input, [selected]);
}

function dispatchArtworkDrop(
  target: HTMLElement,
  files?: readonly (File | undefined)[],
  length = files?.length ?? 0,
): Event {
  const event = new Event("drop", { bubbles: true, cancelable: true });
  if (files) Object.defineProperty(event, "dataTransfer", { value: { files: makeFileList(files, length) } });
  target.dispatchEvent(event);
  return event;
}

function dispatchArtworkDrag(target: Node, type: "dragover" | "dragleave", relatedTarget?: EventTarget | null): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  if (type === "dragleave" && relatedTarget !== undefined) {
    Object.defineProperty(event, "relatedTarget", { value: relatedTarget });
  }
  target.dispatchEvent(event);
  return event;
}

function deferred<T>(): { promise: Promise<T>; resolve(value: T): void; reject(error: unknown): void } {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function inspectedArtwork(file: File, includeDimensions = true): InspectedArtworkFile {
  return {
    name: file.name,
    mimeType: "image/png",
    blob: new Blob(["already validated test artwork"], { type: "image/png" }),
    ...(includeDimensions ? { widthPx: 800, heightPx: 600 } : {}),
  };
}

beforeEach(() => {
  trackedWindowListeners.length = 0;
  vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
    trackedWindowListeners.push({ type, listener, options });
    addNativeWindowListener(type, listener, options);
  });
});

afterEach(() => {
  unmountApp();
  for (const { type, listener, options } of trackedWindowListeners) {
    removeNativeWindowListener(type, listener, options);
  }
  trackedWindowListeners.length = 0;
  for (const root of mountedRoots) root.remove();
  mountedRoots.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});



describe("safe local artwork import and persistence (Slice 200)", () => {
  const toFitStep = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
  };
  const newFile = (name = "floral.png"): File => new File(["image"], name, { type: "image/png" });

  it("imports with the picker, saves only a stable asset reference, and reloads local artwork", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const inspector = vi.fn(async (file: File) => inspectedArtwork(file));
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: inspector });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "chest-print";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready: floral.png"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.dataset.assetId).toMatch(/^local-/));
    expect(assets.store.put).toHaveBeenCalledOnce();
    const assetId = root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId!;
    expect(root.querySelector<HTMLInputElement>('input[data-surface-field="sourceName"]')!.value).toBe("floral.png");
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
    const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    expect(saved.surface["tee/Classic tee"].placements[0].assetId).toBe(assetId);
    expect(JSON.stringify(saved)).not.toContain("already validated test artwork");

    const reloaded = document.createElement("div");
    mountApp(reloaded, { artworkAssetStore: assets.store, inspectArtworkFile: inspector });
    await vi.waitFor(() => expect(reloaded.querySelector("[data-surface-asset-status]")!.textContent).toContain("Stored locally: floral.png"));
    expect(reloaded.querySelector("[data-surface-asset-status]")!.textContent).not.toContain("missing");
    expect(inspector).toHaveBeenCalledOnce();
  }, 30_000);

  it("uses the desktop bridge by default instead of browser storage", async () => {
    localStorage.clear();
    const records = new Map<string, { assetId: string; name: string; mimeType: "image/png"; bytes: Uint8Array }>();
    const putArtworkAsset = vi.fn(async (asset: { assetId: string; name: string; mimeType: "image/png"; bytes: Uint8Array }) => {
      records.set(asset.assetId, asset);
    });
    const getArtworkAsset = vi.fn(async (assetId: string) => records.get(assetId) ?? null);
    const removeArtworkAsset = vi.fn(async (assetId: string) => { records.delete(assetId); });
    window.electronAPI = {
      saveFile: vi.fn(async () => ({ saved: false })),
      putArtworkAsset,
      getArtworkAsset,
      removeArtworkAsset,
    };
    try {
      const root = document.createElement("div");
      mountApp(root, { inspectArtworkFile: async (file) => inspectedArtwork(file) });
      toFitStep(root);
      root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "desktop-logo";
      root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
      setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
      await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
      root.querySelector<HTMLButtonElement>("#surface-add")!.click();
      await vi.waitFor(() => expect(putArtworkAsset).toHaveBeenCalledOnce());
      expect([...records.values()][0]!.assetId).toMatch(/^local-/);
      root.querySelector<HTMLButtonElement>("#save-pattern")!.click();
      const reloaded = document.createElement("div");
      mountApp(reloaded);
      await vi.waitFor(() => expect(getArtworkAsset).toHaveBeenCalledOnce());
      await vi.waitFor(() => expect(reloaded.querySelector("[data-surface-asset-status]")!.textContent).toContain("Stored locally"));
    } finally {
      delete window.electronAPI;
    }
  }, 20_000);

  it("keeps desktop imports disabled when the local bridge is incomplete", async () => {
    localStorage.clear();
    window.electronAPI = { saveFile: vi.fn(async () => ({ saved: false })) };
    try {
      const root = document.createElement("div");
      mountApp(root, { inspectArtworkFile: async (file) => inspectedArtwork(file) });
      toFitStep(root);
      root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "desktop-unavailable";
      root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
      setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
      await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
      root.querySelector<HTMLButtonElement>("#surface-add")!.click();
      await vi.waitFor(() => expect(root.querySelector("#surface-form-error")!.textContent).toContain("Desktop artwork storage is unavailable"));
      expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    } finally {
      delete window.electronAPI;
    }
  });

  it("creates and revokes object-URL previews for local images", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const previousCreate = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
    const previousRevoke = Object.getOwnPropertyDescriptor(URL, "revokeObjectURL");
    const createObjectUrl = vi.fn(() => "blob:local-artwork-preview");
    const revokeObjectUrl = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectUrl });
    try {
      const root = document.createElement("div");
      mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
      toFitStep(root);
      root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "logo";
      root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
      setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
      await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
      root.querySelector<HTMLButtonElement>("#surface-add")!.click();
      await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.getAttribute("src")).toBe("blob:local-artwork-preview"));
      const image = root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!;
      expect(image.hidden).toBe(false);
      expect(createObjectUrl).toHaveBeenCalledOnce();
      root.querySelector<HTMLButtonElement>('button[data-surface-remove-index="0"]')!.click();
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:local-artwork-preview");
    } finally {
      if (previousCreate) Object.defineProperty(URL, "createObjectURL", previousCreate);
      else Reflect.deleteProperty(URL, "createObjectURL");
      if (previousRevoke) Object.defineProperty(URL, "revokeObjectURL", previousRevoke);
      else Reflect.deleteProperty(URL, "revokeObjectURL");
    }
  });

  it("creates a placement from a dropped file on the new-placement drop target", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "dropped-flower";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", {
      value: { files: { 0: newFile("flower.png"), length: 1 } as unknown as FileList },
    });
    root.querySelector<HTMLElement>("[data-surface-new-dropzone]")!.dispatchEvent(drop);
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready: flower.png"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.dataset.assetId).toMatch(/^local-/));
    expect(assets.store.put).toHaveBeenCalledOnce();
    expect(root.querySelector<HTMLInputElement>('input[data-surface-field="sourceName"]')!.value).toBe("flower.png");
  });

  it("accepts a dropped file on an existing placement and preserves it if replacement storage fails", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "patch";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    const row = root.querySelector<HTMLElement>('[data-surface-row="0"]')!;
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", {
      value: { files: { 0: newFile("badge.png"), length: 1 } as unknown as FileList },
    });
    row.dispatchEvent(drop);
    await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")?.dataset.assetId).toMatch(/^local-/));
    const previousAssetId = root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId!;
    const previousStoredAsset = assets.records.get(previousAssetId);
    expect(previousStoredAsset?.name).toBe("badge.png");
    assets.setFailWrites(true);
    const refreshedRow = root.querySelector<HTMLElement>('[data-surface-row="0"]')!;
    dispatchArtworkDrop(refreshedRow, [newFile("replacement.png")]);
    await vi.waitFor(() => expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("previous placement is unchanged"));
    expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId).toBe(previousAssetId);
    const preservedAsset = await assets.store.get(previousAssetId);
    expect(preservedAsset).toBe(previousStoredAsset);
  });

  it("shows a missing asset distinctly and restores it with the file picker", async () => {
    localStorage.clear();
    const originalAssets = memoryArtworkStore();
    const first = document.createElement("div");
    mountApp(first, { artworkAssetStore: originalAssets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    toFitStep(first);
    first.querySelector<HTMLInputElement>("#surface-new-id")!.value = "mark";
    first.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    setFileInput(first.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
    await vi.waitFor(() => expect(first.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
    first.querySelector<HTMLButtonElement>("#surface-add")!.click();
    await vi.waitFor(() => expect(first.querySelector("[data-surface-asset-preview]")?.getAttribute("data-asset-id")).toMatch(/^local-/));
    first.querySelector<HTMLButtonElement>("#save-pattern")!.click();

    const emptyAssets = memoryArtworkStore();
    const second = document.createElement("div");
    mountApp(second, { artworkAssetStore: emptyAssets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    await vi.waitFor(() => expect(second.querySelector("[data-surface-asset-status]")!.textContent).toContain("image is missing"));
    const restoreInput = second.querySelector<HTMLInputElement>('[data-surface-asset-file="0"]')!;
    const chooseRestore = vi.fn();
    Object.defineProperty(restoreInput, "click", { configurable: true, value: chooseRestore });
    second.querySelector<HTMLButtonElement>('button[data-surface-asset-choose="0"]')!.click();
    expect(chooseRestore).toHaveBeenCalledOnce();
    setFileInput(restoreInput, newFile("restored.png"));
    await vi.waitFor(() => expect(second.querySelector("[data-surface-asset-status]")!.textContent).toContain("Stored locally: restored.png"));
  }, 15_000);

  it("rejects a file clearly and blocks creation without changing design or storage", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, {
      artworkAssetStore: assets.store,
      inspectArtworkFile: async () => { throw new Error("SVG scripts are not allowed."); },
    });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "unsafe";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile("unsafe.svg"));
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("File rejected: SVG scripts"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    expect(assets.store.put).not.toHaveBeenCalled();
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("selected image was rejected");
  });

  it("keeps the new-file picker usable while checking and handles empty, multiple, and unknown-size selections", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const pending = deferred<InspectedArtworkFile>();
    const staleRejected = deferred<InspectedArtworkFile>();
    const inspector = vi.fn((selected: File): Promise<InspectedArtworkFile> => {
      if (selected.name === "slow.png") return pending.promise;
      if (selected.name === "stale-broken.png") return staleRejected.promise;
      if (selected.name === "broken.png") return Promise.reject("decoder rejected the file");
      if (selected.name === "error.png") return Promise.reject(new Error("image decoder failed"));
      return Promise.resolve(inspectedArtwork(selected, false));
    });
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: inspector });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "local-art";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";

    const choose = root.querySelector<HTMLButtonElement>("#surface-new-choose-file")!;
    const input = root.querySelector<HTMLInputElement>("#surface-new-file")!;
    const pickerClick = vi.fn();
    Object.defineProperty(input, "click", { configurable: true, value: pickerClick });
    choose.click();
    expect(pickerClick).toHaveBeenCalledOnce();

    setFileInput(input, newFile("slow.png"));
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Checking slow.png");
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("Wait for the selected image");
    root.querySelector<HTMLButtonElement>("#surface-new-clear-file")!.click();
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Image optional");
    pending.resolve(inspectedArtwork(newFile("slow.png")));
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Image optional");
    expect(assets.store.put).not.toHaveBeenCalled();

    setFileInput(input, newFile("stale-broken.png"));
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Checking stale-broken.png");
    root.querySelector<HTMLButtonElement>("#surface-new-clear-file")!.click();
    staleRejected.reject(new Error("late inspection failure"));
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Image optional");

    setFileList(input, []);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("No file found");
    setFileList(input, [newFile("one.png"), newFile("two.png")]);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Choose one artwork file");
    setFileList(input, [], 1);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("could not be read");

    setFileInput(input, newFile("unknown-size.png"));
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("pixel size unknown"));
    setFileInput(input, newFile("broken.png"));
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Artwork could not be checked"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("selected image was rejected");
    root.querySelector<HTMLButtonElement>("#surface-new-clear-file")!.click();
    expect(root.querySelector("#surface-form-error")!.textContent).toBe("");

    setFileInput(input, newFile("error.png"));
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("File rejected: image decoder failed"));
    vi.mocked(assets.store.put).mockRejectedValue("storage is read-only");
    setFileInput(input, newFile("storage-fail.png"));
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    await vi.waitFor(() => expect(root.querySelector("#surface-form-error")!.textContent).toContain("save failed"));
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
  });

  it("handles drag feedback and reports when a placement changes during replacement inspection", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const pending = deferred<InspectedArtworkFile>();
    const inspector = vi.fn((selected: File) => selected.name === "stale.png"
      ? pending.promise
      : Promise.resolve(inspectedArtwork(selected)));
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: inspector });
    toFitStep(root);
    const styleHost = root.querySelector<HTMLElement>("#style-host")!;

    const unrelatedDrag = dispatchArtworkDrag(styleHost, "dragover");
    expect(unrelatedDrag.defaultPrevented).toBe(false);
    const textTarget = document.createTextNode("not a drop target");
    styleHost.append(textTarget);
    expect(dispatchArtworkDrag(textTarget, "dragover").defaultPrevented).toBe(false);
    dispatchArtworkDrop(styleHost);

    const dropzone = root.querySelector<HTMLElement>("[data-surface-new-dropzone]")!;
    expect(dispatchArtworkDrag(dropzone, "dragover").defaultPrevented).toBe(true);
    expect(dropzone.classList.contains("is-dragging")).toBe(true);
    const inside = document.createElement("span");
    dropzone.append(inside);
    dispatchArtworkDrag(dropzone, "dragleave", inside);
    expect(dropzone.classList.contains("is-dragging")).toBe(true);
    dispatchArtworkDrag(dropzone, "dragleave", document.body);
    expect(dropzone.classList.contains("is-dragging")).toBe(false);
    dispatchArtworkDrop(dropzone);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("No file found");
    dispatchArtworkDrop(dropzone, [newFile("one.png"), newFile("two.png")]);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Choose one artwork file");
    dispatchArtworkDrop(dropzone, [], 1);
    expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("could not be read");
    root.querySelector<HTMLButtonElement>("#surface-new-clear-file")!.click();

    const orphanInput = document.createElement("input");
    orphanInput.dataset.surfaceAssetFile = "99";
    styleHost.append(orphanInput);
    setFileInput(orphanInput, newFile("orphan.png"));
    expect(inspector).not.toHaveBeenCalled();

    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "patch";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    const row = root.querySelector<HTMLElement>('[data-surface-row="0"]')!;
    const replacementInput = row.querySelector<HTMLInputElement>('[data-surface-asset-file="0"]')!;
    setFileList(replacementInput, []);
    expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("No file found");
    expect(dispatchArtworkDrag(row, "dragover").defaultPrevented).toBe(true);
    const rowChild = row.querySelector<HTMLElement>("[data-surface-asset-status]")!;
    dispatchArtworkDrag(row, "dragleave", rowChild);
    expect(row.classList.contains("is-dragging")).toBe(true);
    dispatchArtworkDrag(row, "dragleave", document.body);
    expect(row.classList.contains("is-dragging")).toBe(false);
    dispatchArtworkDrop(row, [newFile("stale.png")]);
    await vi.waitFor(() => expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("Checking stale.png"));
    const width = root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="widthCm"]')!;
    width.value = "11";
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
    pending.resolve(inspectedArtwork(newFile("stale.png")));
    await vi.waitFor(() => expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("placement changed while the file was being checked"));
    expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId).toBe("");

    vi.mocked(assets.store.put).mockRejectedValue("local profile is read-only");
    const currentRow = root.querySelector<HTMLElement>('[data-surface-row="0"]')!;
    dispatchArtworkDrop(currentRow, [newFile("failed-replacement.png")]);
    await vi.waitFor(() => expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("local save failed"));
    dispatchArtworkDrop(currentRow);
    expect(currentRow.querySelector("[data-surface-asset-status]")!.textContent).toContain("No file found");
    currentRow.querySelector<HTMLElement>("[data-surface-asset-status]")!.remove();
    dispatchArtworkDrop(currentRow);
  });

  it("ignores an older replacement selection after a newer file is chosen", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const older = deferred<InspectedArtworkFile>();
    const inspector = vi.fn((selected: File) => selected.name === "older.png"
      ? older.promise
      : Promise.resolve(inspectedArtwork(selected)));
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: inspector });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "badge";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    const input = root.querySelector<HTMLInputElement>('[data-surface-asset-file="0"]')!;
    setFileInput(input, newFile("older.png"));
    expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("Checking older.png");
    setFileInput(input, newFile("newer.png"));
    await vi.waitFor(() => expect(root.querySelector("[data-surface-asset-status]")!.textContent).toContain("Stored locally: newer.png"));
    older.resolve(inspectedArtwork(newFile("older.png")));
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId).toMatch(/^local-/);
    expect(assets.records.size).toBe(1);
  });

  it("shows storage-unavailable preview feedback without a browser object-URL provider", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "logo";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    setFileInput(root.querySelector<HTMLInputElement>("#surface-new-file")!, newFile());
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    await vi.waitFor(() => expect(root.querySelector<HTMLImageElement>("[data-surface-asset-preview]")!.dataset.assetId).toMatch(/^local-/));
    root.querySelector<HTMLButtonElement>("#save-pattern")!.click();

    const previous = Object.getOwnPropertyDescriptor(URL, "createObjectURL");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: undefined });
    try {
      const noPreview = document.createElement("div");
      mountApp(noPreview, { artworkAssetStore: assets.store });
      await vi.waitFor(() => expect(noPreview.querySelector("[data-surface-asset-status]")!.textContent).toContain("preview is unavailable"));
    } finally {
      if (previous) Object.defineProperty(URL, "createObjectURL", previous);
      else Reflect.deleteProperty(URL, "createObjectURL");
    }

    vi.spyOn(assets.store, "get").mockRejectedValue("storage permission denied");
    const storageError = document.createElement("div");
    mountApp(storageError, { artworkAssetStore: assets.store });
    await vi.waitFor(() => expect(storageError.querySelector("[data-surface-asset-status]")!.textContent).toContain("unknown error"));

    vi.mocked(assets.store.get).mockRejectedValue(new Error("local profile permission denied"));
    const detailedStorageError = document.createElement("div");
    mountApp(detailedStorageError, { artworkAssetStore: assets.store });
    await vi.waitFor(() => expect(detailedStorageError.querySelector("[data-surface-asset-status]")!.textContent).toContain("local profile permission denied"));
  }, 60_000);

  it("blocks duplicate placement saves while a validated image is still being written", async () => {
    localStorage.clear();
    const assets = memoryArtworkStore();
    const write = deferred<void>();
    vi.spyOn(assets.store, "put").mockImplementation(async (asset) => {
      await write.promise;
      assets.records.set(asset.assetId, asset);
    });
    const root = document.createElement("div");
    mountApp(root, { artworkAssetStore: assets.store, inspectArtworkFile: async (file) => inspectedArtwork(file) });
    toFitStep(root);
    const library = root.querySelector<HTMLDetailsElement>("details.artwork-library")!;
    library.open = true;
    library.dispatchEvent(new Event("toggle", { bubbles: true }));
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "graphic";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    const input = root.querySelector<HTMLInputElement>("#surface-new-file")!;
    const pickerClick = vi.fn();
    Object.defineProperty(input, "click", { configurable: true, value: pickerClick });
    setFileInput(input, newFile());
    await vi.waitFor(() => expect(root.querySelector("#surface-new-file-status")!.textContent).toContain("Ready:"));
    const add = root.querySelector<HTMLButtonElement>("#surface-add")!;
    add.click();
    expect(add.disabled).toBe(true);
    add.dispatchEvent(new Event("click", { bubbles: true }));
    root.querySelector<HTMLButtonElement>("#surface-new-choose-file")!.click();
    expect(pickerClick).not.toHaveBeenCalled();
    expect(assets.store.put).toHaveBeenCalledOnce();
    root.querySelector<HTMLButtonElement>("[data-artwork-stage-id]")!.click();
    expect(root.querySelector<HTMLInputElement>("#surface-new-id")!.value).toBe("graphic");
    write.resolve();
    await vi.waitFor(() => expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1));
  });
});
