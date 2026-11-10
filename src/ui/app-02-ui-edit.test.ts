// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { webcrypto } from "node:crypto";

import { IDBFactory } from "fake-indexeddb";

import { mountApp, unmountApp, renderSemanticEditorPiece, resolveSemanticEditorRole, selectedSizeLabel, semanticEditorPieceForRole, semanticSizeStepFor, withSemanticEditorPiece } from "./app";

import { openProjectWorkflow } from "./project-workflow";

import { isCustomOneSizeStyle } from "./project-records";

import { GARMENTS, STANDARD_M } from "../drafting";

import * as editEngine from "../edit";

import { pieceHandles, editorViewBox } from "../edit";

import { DEFAULT_WORKSPACE, saveToStorage } from "./persist";

import { getCaptureFieldDefinitions } from "./field-provenance";

function mount(options: Parameters<typeof mountApp>[1] = {}): HTMLDivElement {
  const root = document.createElement("div");
  mountApp(root, options);
  mountedRoots.add(root);
  return root;
}

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

/** Navigate the real reviewed path used by export-writer tests. */
const reachExportStage = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-start");
    clickId(root, "journey-step-fit");
    clickId(root, "journey-next"); // accept the current Style choices → Check
    clickId(root, "journey-next"); // reviewed Check → Export
};

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



describe("garment toggle", () => {
  const host = (root: HTMLElement): string => root.querySelector("#canvas-host")!.innerHTML;
  const pick = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLButtonElement>(id)!.dispatchEvent(new Event("click"));
  };

  it("swaps the Pattern view to the darted fitted front and back to the tee", () => {
    localStorage.clear();
    const root = mount();
    expect(host(root)).not.toContain('r="0.9"'); // tee front: no dart apex mark
    pick(root, "#garment-fitted");
    expect(host(root)).toContain('r="0.9"'); // fitted front: apex marked
    expect(host(root)).toContain("FITTED FRONT");
    pick(root, "#garment-tee");
    expect(host(root)).not.toContain('r="0.9"');
  });

  it("carries the garment through the Spec view (the fitted sheet reports its dart)", () => {
    localStorage.clear();
    const root = mount();
    pick(root, "#view-spec");
    expect(host(root)).not.toContain("Bust dart intake");
    pick(root, "#garment-fitted");
    expect(host(root)).toContain("Bust dart intake");
  });

  it("carries the garment through the Check view (the fitted report checks its dart)", () => {
    localStorage.clear();
    const root = mount();
    pick(root, "#view-check");
    expect(host(root)).not.toContain("Dart legs equal");
    pick(root, "#garment-fitted");
    expect(host(root)).toContain("Dart legs equal");
    expect(host(root)).toContain("Digital checks pass"); // the fitted block is sewable
  });

  it("re-snapshots the freeform editor when the garment changes", () => {
    localStorage.clear();
    const root = mount();
    pick(root, "#view-edit");
    const teeEditor = host(root);
    pick(root, "#garment-fitted");
    expect(host(root)).not.toBe(teeEditor); // now editing the fitted front
    expect(host(root)).toContain("editor-reset");
  });
});



describe("fitted graded dart clearance", () => {
  it("gates the selected invalid size and whole run while keeping a valid selected size available", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "garment-fitted");
    clickId(root, "view-fabric");
    const preReviewMarker = root.querySelector<HTMLButtonElement>("#nest-marker")!;
    expect(preReviewMarker.disabled).toBe(false);
    preReviewMarker.click();
    expect(preReviewMarker.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("#canvas-host svg")?.innerHTML).toContain("XL FITTED FRONT");
    expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(true);
    reachExportStage(root);
    clickId(root, "view-fabric");
    const marker = root.querySelector<HTMLButtonElement>("#nest-marker")!;
    expect(marker.disabled).toBe(false);
    marker.click();
    expect(marker.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("#canvas-host svg")?.innerHTML).toContain("XL FITTED FRONT");

    for (const [field, value] of [["length", "53"], ["armholeDepth", "32"]] as const) {
      const input = root.querySelector<HTMLInputElement>(`input[data-field="${field}"]`)!;
      input.value = value;
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const intake = root.querySelector<HTMLInputElement>('input[data-option="dartIntake"]')!;
    intake.value = "8";
    intake.dispatchEvent(new Event("input", { bubbles: true }));
    const apex = root.querySelector<HTMLInputElement>('input[data-option="bustApexVertical"]')!;
    apex.value = "20";
    apex.dispatchEvent(new Event("input", { bubbles: true }));
    expect(marker.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("#analysis-host [role='status']")?.textContent).toContain("XS:");
    expect(root.querySelector("#analysis-host svg")).toBeNull();
    reachExportStage(root);

    const size = root.querySelector<HTMLSelectElement>("#export-size")!;
    const xs = [...size.options].find((option) => option.textContent === "XS")!;
    size.value = xs.value;
    size.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector("#guidance-host")?.textContent).toContain("XS:");
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>("#export-projector")!.disabled).toBe(true);
    expect(marker.disabled).toBe(true);
    expect(marker.title).toContain("XS:");
    marker.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(marker.getAttribute("aria-pressed")).toBe("true");

    const base = [...size.options].find((option) => option.textContent === "M")!;
    size.value = base.value;
    size.dispatchEvent(new Event("change", { bubbles: true }));
    expect(size.value).toBe(base.value);
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
    expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(true);
    expect(root.querySelector<HTMLButtonElement>("#export-projector")!.disabled).toBe(true);
    expect(marker.disabled).toBe(true);

    clickId(root, "garment-tee");
    expect(root.querySelector<HTMLButtonElement>("#nest-marker")!.disabled).toBe(false);
    root.remove();
    localStorage.clear();
    const fitted = GARMENTS.find((candidate) => candidate.name === "fitted")!;
    expect(saveToStorage(
      { ...STANDARD_M, length: 53, armholeDepth: 32 },
      "#4C5A6A",
      { fitted: { dartIntake: 8, bustApexVertical: 20 } },
      {
        ...DEFAULT_WORKSPACE,
        garment: "fitted",
        targetStyle: fitted.styles[0]!.name,
        stretchFabric: "Cotton jersey",
        view: "fabric",
        nestScope: "marker",
      },
    )).toBe(true);
    const restored = mount();
    const restoredMarker = restored.querySelector<HTMLButtonElement>("#nest-marker")!;
    expect(restoredMarker.disabled).toBe(true);
    expect(restored.querySelector("#analysis-host [role='status']")?.textContent).toContain("XS:");
    expect(restored.querySelector("#analysis-host svg")).toBeNull();
    reachExportStage(restored);
    clickId(restored, "garment-tee");
    expect(restored.querySelector<HTMLButtonElement>("#nest-marker")!.disabled).toBe(false);
  });
});



describe("FITTED custom one-size guidance", () => {
  it("keeps actionable dart-clearance guidance on an invalid custom one-size draft", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: "app-custom-fitted-clearance-" + Date.now(),
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-10-18T00:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickId(root, "welcome-start");
      clickId(root, "garment-fitted");
      await vi.waitFor(() => expect(root.querySelector("#current-garment")?.textContent).toBe("Darted tee"));
      clickId(root, "journey-guided");
      await vi.waitFor(() => expect(root.querySelector(".measurement-capture-panel__field")).not.toBeNull());
      for (const definition of getCaptureFieldDefinitions("fitted")) {
        const preset = [...root.querySelectorAll<HTMLButtonElement>('[data-action="capture-accept-preset"]')]
          .find((button) => button.dataset.fieldId === definition.id);
        if (!preset) throw new Error("No digital preset button for " + definition.id);
        preset.click();
      }
      clickId(root, "journey-next");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#infini-shell")?.dataset.stage).toBe("fit"),
        { timeout: 60_000 });
      expect(workflow.snapshot.activeStyle.recipeId).toBe("fitted");
      expect(isCustomOneSizeStyle(workflow.snapshot.activeStyle)).toBe(true);

      for (const [field, value] of [["length", "52"], ["armholeDepth", "32"]] as const) {
        const input = root.querySelector<HTMLInputElement>('input[data-field="' + field + '"]')!;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      for (const [option, value] of [["dartIntake", "8"], ["bustApexVertical", "20"]] as const) {
        const input = root.querySelector<HTMLInputElement>('input[data-option="' + option + '"]')!;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }

      expect(root.querySelector("#guidance-host")?.textContent)
        .toContain("The upper bust-dart mouth reaches the underarm line.");
      expect(root.querySelector("#guidance-details summary")?.textContent).toContain("to review");
      expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(true);
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 60_000);
});


describe("fabric width visibility", () => {
  it("shows the bolt-width box only in the Nesting view, where it does something", () => {
    localStorage.clear();
    const root = mount();
    const box = root.querySelector<HTMLDivElement>("#fabric-width-host")!;
    expect(box.style.display).toBe("none"); // Pattern view
    root.querySelector<HTMLButtonElement>("#view-fabric")!.dispatchEvent(new Event("click"));
    expect(box.style.display).toBe("flex");
    root.querySelector<HTMLButtonElement>("#view-spec")!.dispatchEvent(new Event("click"));
    expect(box.style.display).toBe("none");
  });
});



describe("woven hem-turn propagation", () => {
  it("rebuilds all cut-line exports without changing finished POM values", () => {
    localStorage.clear();
    const files = new Map<string, string>();
    window.electronAPI = {
      saveFile: vi.fn(async (filename, content) => {
        files.set(filename, content);
        return { saved: true, filePath: `C:/test/${filename}` };
      }),
    };
    try {
      const root = mount();
      clickId(root, "garment-woven-shirt");
      const input = root.querySelector<HTMLInputElement>('input[data-option="hemTurn"]')!;
      const exportIds = [
        "#export-svg", "#export-dxf", "#export-pdf", "#export-techpack",
        "#export-projector", "#export-a0",
      ];
      const exportAtTurn = (turn: number): string => {
        input.value = String(turn);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        reachExportStage(root);
        for (const id of exportIds) root.querySelector<HTMLButtonElement>(id)!.click();
        clickId(root, "view-spec");
        return root.querySelector<HTMLElement>("#canvas-host")!.textContent ?? "";
      };

      const defaultSpec = exportAtTurn(1);
      const defaultFiles = new Map(files);
      files.clear();
      const changedSpec = exportAtTurn(1.2);

      expect(changedSpec).toBe(defaultSpec);
      for (const filename of [
        "woven-shirt-M.svg", "woven-shirt-M.dxf", "woven-shirt-M.pdf",
        "woven-shirt-techpack.pdf", "woven-shirt-projector.svg", "woven-shirt-M-A0.pdf",
      ]) {
        expect(files.get(filename), filename).toBeDefined();
        expect(files.get(filename), filename).not.toBe(defaultFiles.get(filename));
      }
    } finally {
      delete window.electronAPI;
    }
  });
});



describe("semantic Edit view", () => {
  beforeEach(() => vi.stubGlobal("crypto", webcrypto as unknown as Crypto));

  const enterFittedEditor = async (): Promise<HTMLElement> => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#garment-fitted")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#view-edit")!.dispatchEvent(new Event("click"));
    await vi.waitFor(
      () => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull(),
      { timeout: 10_000 },
    );
    return root;
  };
  const firstCurveXCoordinate = (root: HTMLElement): HTMLInputElement =>
    [...root.querySelectorAll<HTMLInputElement>('input[data-editor-coordinate][data-editor-axis="x"]')]
      .find((input) => input.dataset.editorHandleId?.includes("/control/"))!;

  it("does not expose topology-changing dart shortcuts", async () => {
    localStorage.clear();
    const root = mount();
    root.querySelector<HTMLButtonElement>("#view-edit")!.dispatchEvent(new Event("click"));
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    expect(root.querySelector("#dart-shoulder")).toBeNull();
    expect(root.querySelector('[data-editor-contract="semantic"]')?.textContent)
      .toContain("Dart transfer and seam truing are unavailable");
  });

  it("resolves only pieces present in the current semantic draft", () => {
    const tee = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const source = tee.draft(STANDARD_M, {});
    expect(semanticEditorPieceForRole(source, "front")).toBe(source.roles.front);
    expect(semanticEditorPieceForRole(source, "stale-role")).toBeNull();
    expect(semanticEditorPieceForRole(null, "front")).toBeNull();
  });

  it("renders an explicit empty state when the editable role has no piece", () => {
    const tee = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const piece = tee.draft(STANDARD_M, {}).roles.front;
    expect(renderSemanticEditorPiece(null, () => "unexpected piece")).toContain("no editable pattern pieces");
    expect(renderSemanticEditorPiece(piece, (resolved) => resolved.name)).toBe(piece.name);
  });

  it("keeps size routing exact and labels a single-size draft without a chart", () => {
    const sizes = [{ step: 0, label: "Base" }];
    expect(semanticSizeStepFor(sizes, (candidate) => candidate.step === 0)).toBe(0);
    expect(Number.isNaN(semanticSizeStepFor(sizes, () => false))).toBe(true);
    expect(selectedSizeLabel(sizes, 0)).toBe("Base");
    expect(selectedSizeLabel([], 0)).toBe("Selected size");
  });

  it("runs editor actions only while the target role exists", () => {
    const tee = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const piece = tee.draft(STANDARD_M, {}).roles.front;
    const action = vi.fn((current: typeof piece) => current.name);
    expect(withSemanticEditorPiece(null, action)).toBeUndefined();
    expect(action).not.toHaveBeenCalled();
    expect(withSemanticEditorPiece(piece, action)).toBe(piece.name);
    expect(action).toHaveBeenCalledWith(piece);
  });

  it("retains or safely selects an available semantic editor role", () => {
    expect(resolveSemanticEditorRole("back", ["front", "back"])).toBe("back");
    expect(resolveSemanticEditorRole("stale-role", ["front", "back"])).toBe("front");
    expect(resolveSemanticEditorRole(undefined, [])).toBe("");
  });

  it("labels an edit candidate when a recipe has no registered sizes", async () => {
    const tee = GARMENTS.find((candidate) => candidate.name === "tee")!;
    const descriptor = Object.getOwnPropertyDescriptor(tee, "sizes")!;
    Object.defineProperty(tee, "sizes", { ...descriptor, value: [] });
    try {
      const root = mount();
      clickId(root, "view-edit");
      await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
      expect(root.querySelector("#nest-selected-size")?.textContent).toBe("Selected size");
    } finally {
      Object.defineProperty(tee, "sizes", descriptor);
    }
  });

  it("uses the local operation ID fallback when randomUUID is unavailable", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", { subtle: webcrypto.subtle } as unknown as Crypto);
    try {
      const root = mount();
      clickId(root, "view-edit");
      await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
      const coordinate = firstCurveXCoordinate(root);
      coordinate.value = String(Number(coordinate.value) + 0.05);
      coordinate.dispatchEvent(new Event("change", { bubbles: true }));
      await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        semanticEdits?: { operations?: readonly { id: string }[] };
      };
      expect(saved.semanticEdits?.operations?.[0]?.id).toMatch(/^semantic-edit-\d+-\d+$/);
    } finally {
      vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    }
  });

  it("keeps Edit usable and outputs paused when source hashing fails", async () => {
    const checkFailure = async (failure: unknown, expected: string): Promise<void> => {
      localStorage.clear();
      vi.stubGlobal("crypto", {
        subtle: { digest: async () => { throw failure; } },
      } as unknown as Crypto);
      const root = mount();
      clickId(root, "view-edit");
      await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="failed"]')).not.toBeNull());
      expect(root.querySelector('[data-editor-validation="failed"]')?.textContent).toContain(expected);
      expect(root.querySelector("#canvas-host")?.textContent).toContain("Source unavailable");
      expect(root.querySelector<HTMLButtonElement>("#editor-undo")?.disabled).toBe(true);
    };
    try {
      await checkFailure(new Error("hash provider unavailable"), "hash provider unavailable");
      await checkFailure("hash provider unavailable", "SHA-256 source verification is unavailable.");
    } finally {
      vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    }
  }, 15_000);

  it("ignores a failed hash result after its source snapshot has been replaced", async () => {
    localStorage.clear();
    const requests: Array<{
      readonly algorithm: AlgorithmIdentifier;
      readonly data: BufferSource;
      readonly resolve: (digest: ArrayBuffer) => void;
      readonly reject: (error: unknown) => void;
    }> = [];
    vi.stubGlobal("crypto", {
      subtle: {
        digest: (algorithm: AlgorithmIdentifier, data: BufferSource) => new Promise<ArrayBuffer>((resolve, reject) => {
          requests.push({ algorithm, data, resolve, reject });
        }),
      },
    } as unknown as Crypto);
    try {
      const root = mount();
      clickId(root, "view-edit");
      await vi.waitFor(() => expect(requests).toHaveLength(1));
      const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      chest.value = String(Number(chest.value) + 1);
      chest.dispatchEvent(new Event("input", { bubbles: true }));
      await vi.waitFor(() => expect(requests).toHaveLength(2));

      requests[0]!.reject(new Error("obsolete hash failure"));
      await Promise.resolve();
      expect(root.querySelector("#canvas-host")?.textContent).not.toContain("obsolete hash failure");
      expect(root.querySelector('[data-editor-validation="checking"]')).not.toBeNull();

      const payload = requests[1]!.data;
      const digestBytes = ArrayBuffer.isView(payload)
        ? Buffer.from(payload.buffer as ArrayBuffer, payload.byteOffset, payload.byteLength)
        : Buffer.from(payload as ArrayBuffer);
      requests[1]!.resolve(await webcrypto.subtle.digest(requests[1]!.algorithm, digestBytes));
      await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    } finally {
      vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    }
  });

  it("keeps the rebase action harmless when source verification fails", async () => {
    const root = await enterFittedEditor();
    const coordinate = firstCurveXCoordinate(root);
    coordinate.value = String(Number(coordinate.value) + 0.05);
    coordinate.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    vi.stubGlobal("crypto", {
      subtle: { digest: async () => { throw new Error("rebase hash unavailable"); } },
    } as unknown as Crypto);
    try {
      const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      chest.value = String(Number(chest.value) + 1);
      chest.dispatchEvent(new Event("input", { bubbles: true }));
      await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="failed"]')).not.toBeNull());
      const rebase = root.querySelector<HTMLButtonElement>("#editor-rebase")!;
      expect(rebase.hidden).toBe(true);
      rebase.click(); // stale or scripted activation must not clear the conflict
      expect(root.querySelector("[data-editor-feedback]")?.textContent).toContain("rebase hash unavailable");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
    } finally {
      vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    }
  }, 15_000);

  it("asks the user to wait when rebase is activated during source verification", async () => {
    const root = await enterFittedEditor();
    const coordinate = firstCurveXCoordinate(root);
    coordinate.value = String(Number(coordinate.value) + 0.05);
    coordinate.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    let resolveDigest!: (digest: ArrayBuffer) => void;
    vi.stubGlobal("crypto", {
      subtle: { digest: () => new Promise<ArrayBuffer>((resolve) => { resolveDigest = resolve; }) },
    } as unknown as Crypto);
    try {
      const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      chest.value = String(Number(chest.value) + 1);
      chest.dispatchEvent(new Event("input", { bubbles: true }));
      await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="checking"]')).not.toBeNull());
      root.querySelector<HTMLButtonElement>("#editor-rebase")!.click();
      expect(root.querySelector("[data-editor-feedback]")?.textContent)
        .toContain("Rebase is waiting for source verification.");
    } finally {
      resolveDigest(new ArrayBuffer(32));
      vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    }
  });

  it("shows a guarded source failure if a recipe draft cannot be generated", async () => {
    const recipe = GARMENTS.find((candidate) => candidate.name === "tee")!;
    for (const [failure, expected] of [
      [new Error("test recipe source failure"), "test recipe source failure"],
      ["non-Error recipe source failure", "could not be generated"],
    ] as const) {
      localStorage.clear();
      const root = mount();
      const draftSpy = vi.spyOn(recipe, "draft").mockImplementation(() => { throw failure; });
      try {
        clickId(root, "view-edit");
        await vi.waitFor(() => expect(root.querySelector("[data-semantic-source-unavailable]")).not.toBeNull());
        expect(root.querySelector("#canvas-host")?.textContent).toContain("could not be generated");
        expect(root.querySelector("#canvas-host")?.textContent).toContain(expected);
      } finally {
        draftSpy.mockRestore();
      }
    }
  });

  it("lists the fitted garment's recipe-authored roles for direct editing", async () => {
    const root = await enterFittedEditor();
    const select = root.querySelector<HTMLSelectElement>("#editor-role")!;
    const roles = [...select.options].map((option) => option.value);
    expect(roles).toContain("front");
    expect(roles).toContain("back");
    select.value = "back";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector<HTMLSelectElement>("#editor-role")?.value).toBe("back");
    expect(root.querySelector("[data-editor-handle-controls]")).not.toBeNull();
  });

  it("preserves edits when reselecting their recipe and clears them on a different recipe", async () => {
    const root = await enterFittedEditor();
    const coordinate = firstCurveXCoordinate(root);
    coordinate.value = String(Number(coordinate.value) + 0.05);
    coordinate.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(false);

    clickId(root, "garment-fitted");
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(false);

    clickId(root, "garment-tee");
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    expect(root.querySelector<HTMLButtonElement>("#editor-reset")!.disabled).toBe(true);
  }, 15_000);

  it("supports durable undo and redo as separate semantic history operations", async () => {
    const root = await enterFittedEditor();
    const coordinate = root.querySelector<HTMLInputElement>('input[data-editor-coordinate][data-editor-axis="x"]')!;
    const initial = Number(coordinate.value);
    coordinate.value = String(initial + 0.1);
    coordinate.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(false);
    root.querySelector<HTMLButtonElement>("#editor-undo")!.click();
    expect(root.querySelector<HTMLButtonElement>("#editor-redo")!.disabled).toBe(false);
    root.querySelector<HTMLButtonElement>("#editor-redo")!.click();
    expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(false);
  });

  it("keeps coordinate no-ops empty and commits an exact y-only movement", async () => {
    const root = await enterFittedEditor();
    const x = firstCurveXCoordinate(root);
    const anchorId = x.dataset.editorHandleId!;
    x.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(true);
    const y = [...root.querySelectorAll<HTMLInputElement>('input[data-editor-coordinate][data-editor-axis="y"]')]
      .find((input) => input.dataset.editorHandleId === anchorId)!;
    const initialY = Number(y.value);
    y.value = String(initialY + 0.05);
    y.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    expect(Number(y.value)).toBeCloseTo(initialY + 0.05, 5);
    expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(false);
  });

  it("does not persist a non-finite pointer movement", async () => {
    const root = await enterFittedEditor();
    const originalMoveHandle = editEngine.moveHandle;
    const moveSpy = vi.spyOn(editEngine, "moveHandle").mockImplementation((current, handle, to) =>
      originalMoveHandle(current, handle, { x: Number.POSITIVE_INFINITY, y: to.y }));
    const recipe = GARMENTS.find((candidate) => candidate.name === "fitted")!;
    const piece = recipe.draft(STANDARD_M, {}).roles.front;
    const vb = editorViewBox(piece);
    const rect = { left: 0, top: 0, width: vb.w, height: vb.h, right: vb.w, bottom: vb.h, x: 0, y: 0, toJSON() {} };
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => rect as DOMRect;
    try {
      const vertex = pieceHandles(piece).find((handle) => handle.kind === "vertex")!;
      const sx = vertex.pos.x - vb.minX;
      const sy = vertex.pos.y - vb.minY;
      const host = root.querySelector<HTMLDivElement>("#canvas-host")!;
      host.dispatchEvent(new MouseEvent("mousedown", { clientX: sx, clientY: sy, bubbles: true }));
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: sx + 1, clientY: sy + 1 }));
      window.dispatchEvent(new MouseEvent("mouseup"));
      expect(root.querySelector("[data-editor-feedback]")?.textContent).toContain("movement was not finite");
      expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(true);
    } finally {
      Element.prototype.getBoundingClientRect = original;
      moveSpy.mockRestore();
    }
  });

  it("does not create a semantic edit when a drag returns to its start", async () => {
    const root = await enterFittedEditor();
    const recipe = GARMENTS.find((candidate) => candidate.name === "fitted")!;
    const piece = recipe.draft(STANDARD_M, {}).roles.front;
    const vb = editorViewBox(piece);
    const rect = { left: 0, top: 0, width: vb.w, height: vb.h, right: vb.w, bottom: vb.h, x: 0, y: 0, toJSON() {} };
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => rect as DOMRect;
    try {
      const vertex = pieceHandles(piece).find((handle) => handle.kind === "vertex")!;
      const sx = vertex.pos.x - vb.minX;
      const sy = vertex.pos.y - vb.minY;
      root.querySelector<HTMLDivElement>("#canvas-host")!.dispatchEvent(
        new MouseEvent("mousedown", { clientX: sx, clientY: sy, bubbles: true }),
      );
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: sx, clientY: sy }));
      window.dispatchEvent(new MouseEvent("mouseup"));
      expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(true);
      expect(root.querySelector("[data-editor-feedback]")).toBeNull();
    } finally {
      Element.prototype.getBoundingClientRect = original;
    }
  });

  it("reports thrown operation-ID failures without losing the style draft", async () => {
    for (const [failure, message] of [
      ["operation ID unavailable", "The edit could not be saved."],
      [new Error("operation ID provider failed"), "operation ID provider failed"],
    ] as const) {
      const root = await enterFittedEditor();
      vi.stubGlobal("crypto", {
        subtle: webcrypto.subtle,
        randomUUID: () => { throw failure; },
      } as unknown as Crypto);
      const recipe = GARMENTS.find((candidate) => candidate.name === "fitted")!;
      const piece = recipe.draft(STANDARD_M, {}).roles.front;
      const vb = editorViewBox(piece);
      const rect = { left: 0, top: 0, width: vb.w, height: vb.h, right: vb.w, bottom: vb.h, x: 0, y: 0, toJSON() {} };
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = () => rect as DOMRect;
      try {
        const vertex = pieceHandles(piece).find((handle) => handle.kind === "vertex")!;
        const sx = vertex.pos.x - vb.minX;
        const sy = vertex.pos.y - vb.minY;
        const host = root.querySelector<HTMLDivElement>("#canvas-host")!;
        host.dispatchEvent(new MouseEvent("mousedown", { clientX: sx, clientY: sy, bubbles: true }));
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: sx + 1, clientY: sy + 1 }));
        window.dispatchEvent(new MouseEvent("mouseup"));
        expect(root.querySelector("[data-editor-feedback]")?.textContent).toContain(message);
        expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(true);
      } finally {
        Element.prototype.getBoundingClientRect = original;
        vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
      }
    }
  }, 15_000);

  it("blocks a drag whose source changes before release", async () => {
    const root = await enterFittedEditor();
    const recipe = GARMENTS.find((candidate) => candidate.name === "fitted")!;
    const piece = recipe.draft(STANDARD_M, {}).roles.front;
    const vb = editorViewBox(piece);
    const rect = { left: 0, top: 0, width: vb.w, height: vb.h, right: vb.w, bottom: vb.h, x: 0, y: 0, toJSON() {} };
    const original = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => rect as DOMRect;
    try {
      const vertex = pieceHandles(piece).find((handle) => handle.kind === "vertex")!;
      const sx = vertex.pos.x - vb.minX;
      const sy = vertex.pos.y - vb.minY;
      const host = root.querySelector<HTMLDivElement>("#canvas-host")!;
      host.dispatchEvent(new MouseEvent("mousedown", { clientX: sx, clientY: sy, bubbles: true }));
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: sx + 1, clientY: sy + 1 }));
      const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      chest.value = String(Number(chest.value) + 1);
      chest.dispatchEvent(new Event("input", { bubbles: true }));
      window.dispatchEvent(new MouseEvent("mouseup"));
      expect(root.querySelector("[data-editor-feedback]")?.textContent).toContain("Editing is paused");
      expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(true);
    } finally {
      Element.prototype.getBoundingClientRect = original;
    }
  });

  it("does not commit if a dragged pattern anchor no longer resolves", async () => {
    const root = await enterFittedEditor();
    const recipe = GARMENTS.find((candidate) => candidate.name === "fitted")!;
    const piece = recipe.draft(STANDARD_M, {}).roles.front;
    const vb = editorViewBox(piece);
    const rect = { left: 0, top: 0, width: vb.w, height: vb.h, right: vb.w, bottom: vb.h, x: 0, y: 0, toJSON() {} };
    const originalRect = Element.prototype.getBoundingClientRect;
    const moveSpy = vi.spyOn(editEngine, "moveHandle").mockImplementation((current) => ({
      ...current,
      edges: current.edges.map((edge, index) => ({ ...edge, name: `unresolved-${index}` })),
    }));
    Element.prototype.getBoundingClientRect = () => rect as DOMRect;
    try {
      const vertex = pieceHandles(piece).find((handle) => handle.kind === "vertex")!;
      const sx = vertex.pos.x - vb.minX;
      const sy = vertex.pos.y - vb.minY;
      const host = root.querySelector<HTMLDivElement>("#canvas-host")!;
      host.dispatchEvent(new MouseEvent("mousedown", { clientX: sx, clientY: sy, bubbles: true }));
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: sx + 1, clientY: sy + 1 }));
      window.dispatchEvent(new MouseEvent("mouseup"));
      expect(moveSpy).toHaveBeenCalledOnce();
      expect(root.querySelector("[data-editor-feedback]")?.textContent).toContain("anchor could not be resolved");
      expect(root.querySelector<HTMLButtonElement>("#editor-undo")!.disabled).toBe(true);
    } finally {
      moveSpy.mockRestore();
      Element.prototype.getBoundingClientRect = originalRect;
    }
  });

  it("saves semantic edits across reload and requires an explicit rebase after source changes", async () => {
    localStorage.clear();
    const first = mount();
    clickId(first, "view-edit");
    await vi.waitFor(() => expect(first.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    const coordinate = firstCurveXCoordinate(first);
    const anchorId = coordinate.dataset.editorHandleId!;
    coordinate.value = String(Number(coordinate.value) + 0.05);
    coordinate.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(first.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    const changedCoordinate = [...first.querySelectorAll<HTMLInputElement>("input[data-editor-coordinate]")]
      .find((input) => input.dataset.editorHandleId === anchorId && input.dataset.editorAxis === "x")!;
    const savedX = Number(changedCoordinate.value);
    clickId(first, "save-pattern");
    const persisted = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
      semanticEdits?: { operations?: readonly unknown[] } | null;
    };
    expect(persisted.semanticEdits?.operations).toHaveLength(1);

    const reloaded = mount();
    expect(reloaded.querySelector<HTMLButtonElement>("#editor-reset")?.disabled).toBe(false);
    await vi.waitFor(() => expect(reloaded.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    const restoredCoordinate = [...reloaded.querySelectorAll<HTMLInputElement>("input[data-editor-coordinate]")]
      .find((input) => input.dataset.editorHandleId === anchorId && input.dataset.editorAxis === "x")!;
    expect(Number(restoredCoordinate.value)).toBeCloseTo(savedX, 5);

    const chest = reloaded.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = String(Number(chest.value) + 2);
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(reloaded.querySelector('[data-editor-validation="rebase-required"]')).not.toBeNull());
    expect(reloaded.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
    const pausedCoordinate = firstCurveXCoordinate(reloaded);
    pausedCoordinate.value = String(Number(pausedCoordinate.value) + 0.05);
    pausedCoordinate.dispatchEvent(new Event("change", { bubbles: true }));
    expect(reloaded.querySelector('[data-editor-validation="rebase-required"]')).not.toBeNull();
    expect(reloaded.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
    reloaded.querySelector<HTMLButtonElement>("#editor-rebase")!.click();
    expect(reloaded.querySelector('[data-editor-validation="valid"]')).not.toBeNull();
    expect(reloaded.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
  }, 120_000);

  it("keeps an unresolvable edit blocked when explicit rebase fails", async () => {
    localStorage.clear();
    const root = await enterFittedEditor();
    const coordinate = firstCurveXCoordinate(root);
    coordinate.value = String(Number(coordinate.value) + 0.05);
    coordinate.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());

    const recipe = GARMENTS.find((candidate) => candidate.name === "fitted")!;
    const originalDraft = recipe.draft;
    const draftSpy = vi.spyOn(recipe, "draft").mockImplementation((measurements, options) => {
      const source = originalDraft(measurements, options);
      const roles = Object.fromEntries(Object.entries(source.roles).map(([role, piece]) => [role, {
        ...piece,
        name: `changed-${piece.name}`,
      }]));
      return { ...source, roles };
    });
    try {
      const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
      chest.value = String(Number(chest.value) + 2);
      chest.dispatchEvent(new Event("input", { bubbles: true }));
      await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="rebase-required"]')).not.toBeNull());
      root.querySelector<HTMLButtonElement>("#editor-rebase")!.click();
      expect(root.querySelector('[data-editor-validation="rebase-required"]')).not.toBeNull();
      expect(root.querySelector("[data-editor-feedback]")?.textContent).toContain("changed meaning");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
    } finally {
      draftSpy.mockRestore();
    }
  }, 120_000);

  it("requires explicit edit review when tank shoulder width changes and directs users to strap width", async () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "garment-tank");
    clickId(root, "view-edit");
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());

    const coordinate = firstCurveXCoordinate(root);
    coordinate.value = String(Number(coordinate.value) + 0.05);
    coordinate.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());

    const shoulderWidth = root.querySelector<HTMLInputElement>('input[data-field="shoulderWidth"]')!;
    shoulderWidth.value = String(Number(shoulderWidth.value) + 1);
    shoulderWidth.dispatchEvent(new Event("input", { bubbles: true }));
    await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="rebase-required"]')).not.toBeNull());
    expect(root.querySelector('[data-editor-validation="rebase-required"]')?.textContent)
      .toContain("measurements.shoulderWidth");
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

    root.querySelector<HTMLButtonElement>("#editor-rebase")!.click();
    expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull();
  });

  it("restores unsaved semantic operations from the versioned recovery record", async () => {
    localStorage.clear();
    const first = mount();
    clickId(first, "view-edit");
    await vi.waitFor(() => expect(first.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    const coordinate = firstCurveXCoordinate(first);
    const anchorId = coordinate.dataset.editorHandleId!;
    coordinate.value = String(Number(coordinate.value) + 0.05);
    coordinate.dispatchEvent(new Event("change", { bubbles: true }));
    await vi.waitFor(() => expect(first.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    const changedCoordinate = [...first.querySelectorAll<HTMLInputElement>("input[data-editor-coordinate]")]
      .find((input) => input.dataset.editorHandleId === anchorId && input.dataset.editorAxis === "x")!;
    const recoveredX = Number(changedCoordinate.value);
    const recovery = JSON.parse(localStorage.getItem("patternworks_recovery_v1")!) as {
      v: number;
      semanticEdits?: { operations?: readonly unknown[] } | null;
    };
    expect(recovery.v).toBe(3);
    expect(recovery.semanticEdits?.operations).toHaveLength(1);

    const recovered = mount();
    expect(recovered.querySelector("#recovery-accept")).not.toBeNull();
    recovered.querySelector<HTMLButtonElement>("#recovery-accept")!.click();
    await vi.waitFor(() => expect(recovered.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
    const restoredCoordinate = [...recovered.querySelectorAll<HTMLInputElement>("input[data-editor-coordinate]")]
      .find((input) => input.dataset.editorHandleId === anchorId && input.dataset.editorAxis === "x")!;
    expect(Number(restoredCoordinate.value)).toBeCloseTo(recoveredX, 5);
  }, 20_000);

  it("feeds saved semantic geometry into single-size and whole-run garment exports", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    window.electronAPI = {
      saveFile: vi.fn(async (filename, content) => {
        files.set(filename, content);
        return { saved: true, filePath: `C:/test/${filename}` };
      }),
    };
    try {
      const root = mount();
      reachExportStage(root);
      for (const id of ["#export-svg", "#export-techpack", "#export-projector"]) {
        root.querySelector<HTMLButtonElement>(id)!.click();
      }
      const baseline = new Map(files);

      clickId(root, "view-edit");
      await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());
      const coordinate = firstCurveXCoordinate(root);
      coordinate.value = String(Number(coordinate.value) + 0.05);
      coordinate.dispatchEvent(new Event("change", { bubbles: true }));
      await vi.waitFor(() => expect(root.querySelector('[data-editor-validation="valid"]')).not.toBeNull());

      reachExportStage(root);
      for (const id of ["#export-svg", "#export-techpack", "#export-projector"]) {
        expect(root.querySelector<HTMLButtonElement>(id)!.disabled).toBe(false);
        root.querySelector<HTMLButtonElement>(id)!.click();
      }
      expect(files.get("tee-M.svg")).not.toBe(baseline.get("tee-M.svg"));
      expect(files.get("tee-techpack.pdf")).not.toBe(baseline.get("tee-techpack.pdf"));
      expect(files.get("tee-projector.svg")).not.toBe(baseline.get("tee-projector.svg"));
    } finally {
      delete window.electronAPI;
    }
  });

  it("ignores clicks that are not semantic edit actions", async () => {
    const root = await enterFittedEditor();
    const before = root.querySelector("#canvas-host")!.innerHTML;
    root.querySelector("#canvas-host")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(root.querySelector("#canvas-host")!.innerHTML).toBe(before);
  });
});
