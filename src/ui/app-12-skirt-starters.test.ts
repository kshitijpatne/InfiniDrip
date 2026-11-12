// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { Blob as NodeBlob } from "node:buffer";

import { createHash, webcrypto } from "node:crypto";

import { IDBFactory } from "fake-indexeddb";

import { mountApp, unmountApp } from "./app";

import { openProjectWorkflow } from "./project-workflow";

import { migrateLegacySaveFile } from "./project-records";

import { GARMENTS, STANDARD_M, notchesForRecipeOptions, type GarmentOptions } from "../drafting";

import { blockPieces } from "../drafting/block";

import { SKIRT_A_LINE_ENTRY_ID, SKIRT_A_LINE_HEM_SWEEP_OPTION_ID, SKIRT_PENCIL_ENTRY_ID, SKIRT_PENCIL_HEM_TAPER_OPTION_ID, SKIRT_GATHERED_ENTRY_ID, SKIRT_GATHER_RATIO_OPTION_ID, SKIRT_CASING_DEPTH_OPTION_ID,
  SKIRT_BOX_PLEAT_ENTRY_ID, SKIRT_BOX_PLEAT_COUNT_OPTION_ID, SKIRT_BOX_PLEAT_SPACING_OPTION_ID,
  SKIRT_TIERED_ENTRY_ID, SKIRT_TIER_COUNT_OPTION_ID, SKIRT_TIER_GATHER_RATIO_OPTION_ID,
  SKIRT_WRAP_ENTRY_ID, SKIRT_WRAP_OVERLAP_OPTION_ID, SKIRT_WRAP_FACING_WIDTH_OPTION_ID } from "../drafting/skirt";

import { exportA0Pdf, exportPdf } from "../export";

import { serialize } from "./persist";

import { createFieldObservationRecord } from "./field-provenance";

function visiblePdfText(pdf: string): string {
  const streams = [...pdf.matchAll(/>>\nstream\n([\s\S]*?)\nendstream/g)].map((match) => match[1]!);
  return streams.flatMap((stream) =>
    [...stream.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map((match) => match[1]!.replace(/\\(.)/g, "$1")),
  ).join(" ");
}

function expectK04PdfGuideKey(text: string): void {
  expect(text).toContain("BOX-PLEAT GUIDE KEY");
  expect(text).toContain("F1-F12  Fold guide lines");
  expect(text).toContain("R1-R12  Roll guide lines");
  expect(text).toContain("P1-P12  Placement guide lines");
  expect(text).toContain("The number identifies the box-pleat group.");
}

function stubSvgTextMetrics(): () => void {
  const getBBoxDescriptor = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getBBox");
  const getTextLengthDescriptor = Object.getOwnPropertyDescriptor(SVGElement.prototype, "getComputedTextLength");
  const metrics = function (element: SVGElement) {
    const fontSize = Number(element.getAttribute("font-size")) || 0;
    const width = (element.textContent?.length ?? 0) * fontSize * 0.52;
    return { x: 0, y: -fontSize * 0.75, width, height: fontSize };
  };
  Object.defineProperty(SVGElement.prototype, "getBBox", {
    configurable: true,
    value(this: SVGElement) { return metrics(this); },
  });
  Object.defineProperty(SVGElement.prototype, "getComputedTextLength", {
    configurable: true,
    value(this: SVGElement) { return metrics(this).width; },
  });
  return () => {
    if (getBBoxDescriptor) Object.defineProperty(SVGElement.prototype, "getBBox", getBBoxDescriptor);
    else Reflect.deleteProperty(SVGElement.prototype, "getBBox");
    if (getTextLengthDescriptor) Object.defineProperty(SVGElement.prototype, "getComputedTextLength", getTextLengthDescriptor);
    else Reflect.deleteProperty(SVGElement.prototype, "getComputedTextLength");
  };
}

function expectedSkirtTiledPdf(
  localCoordinates: boolean,
  options: GarmentOptions = {},
  markLabelLayout: "inline" | "staggered-box-pleat-guides" | "line-aligned-box-pleat-guides" = "inline",
): string {
  const skirtRecipe = GARMENTS.find((candidate) => candidate.name === "skirt")!;
  return exportPdf(
    blockPieces(skirtRecipe.draft(STANDARD_M, options)),
    skirtRecipe.allowances!,
    undefined,
    1,
    localCoordinates,
    markLabelLayout,
  );
}

function expectedSkirtA0Pdf(
  allowOverflow: boolean,
  options: GarmentOptions,
  markLabelLayout: "inline" | "staggered-box-pleat-guides" | "line-aligned-box-pleat-guides" = "inline",
): string {
  const skirtRecipe = GARMENTS.find((candidate) => candidate.name === "skirt")!;
  return exportA0Pdf(
    blockPieces(skirtRecipe.draft(STANDARD_M, options)),
    skirtRecipe.allowances!,
    notchesForRecipeOptions(skirtRecipe, options),
    undefined,
    allowOverflow,
    markLabelLayout,
  );
}

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
    const target = root.querySelector<HTMLElement>(`#${id}`);
    if (!target) {
      const blocker = root.querySelector<HTMLElement>("#journey-blocker")?.textContent?.trim() ?? "none";
      const guidance = root.querySelector<HTMLElement>("#guidance-host")?.textContent?.trim().slice(0, 240) ?? "none";
      throw new Error(`Expected #${id} to be rendered; blocker: ${blocker}; guidance: ${guidance}`);
    }
    target.click();
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

const reReviewAndReachExportStage = (root: HTMLElement): void => {
    clickId(root, "journey-step-fit");
    clickId(root, "journey-next");
    clickId(root, "view-check");
    clickId(root, "journey-next");
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


describe("K02 Pencil-like skirt and starter tiled-PDF workflows", () => {
  it("keeps taper controls entry-scoped, retains invalid values, and saves/reopens K02", () => {
    localStorage.clear();
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-" + SKIRT_PENCIL_ENTRY_ID);

      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Pencil-like skirt · software defaults");
      const taper = root.querySelector<HTMLInputElement>(
        'input[data-option="' + SKIRT_PENCIL_HEM_TAPER_OPTION_ID + '"]',
      )!;
      expect(taper.value).toBe("8");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Pencil-like skirt");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("software defaults");
      reachExportStage(root);

      taper.value = "13";
      taper.dispatchEvent(new Event("input", { bubbles: true }));
      expect(taper.value).toBe("13");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("supports 4–12 cm");
      expect(root.querySelector<HTMLElement>(
        '[data-input-error="option-' + SKIRT_PENCIL_HEM_TAPER_OPTION_ID + '"]',
      )!.textContent).toContain("supports 4–12 cm");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      taper.value = "8.5";
      taper.dispatchEvent(new Event("input", { bubbles: true }));
      expect(taper.value).toBe("8.5");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("use 1 cm increments");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      taper.value = "4";
      taper.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).not.toContain("supports 4–12 cm");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).not.toContain("use 1 cm increments");
      expect(root.querySelector<HTMLElement>(
        '[data-input-error="option-' + SKIRT_PENCIL_HEM_TAPER_OPTION_ID + '"]',
      )?.textContent).toBe("");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")).not.toBeNull();

      const hipDepth = root.querySelector<HTMLInputElement>('input[data-field="hipDepth"]')!;
      hipDepth.value = "40";
      hipDepth.dispatchEvent(new Event("input", { bubbles: true }));
      const length = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
      length.value = "40";
      length.dispatchEvent(new Event("input", { bubbles: true }));
      expect(length.value).toBe("40");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .toContain("the K02 preview and exports stay paused");
      expect(root.querySelector<HTMLElement>('[data-input-error="length"]')!.textContent)
        .toContain("Lengthen the skirt or reduce the hip depth");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      length.value = "70";
      length.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="length"]')?.textContent).toBe("");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")).not.toBeNull();
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        measurements: typeof STANDARD_M;
        garmentOptions: Record<string, Record<string, number>>;
        workspace: { starterOrigin: { entryId: string; recipeRevision: string } };
      };
      expect(saved.garmentOptions.skirt).toMatchObject({ [SKIRT_PENCIL_HEM_TAPER_OPTION_ID]: 4 });
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: SKIRT_PENCIL_ENTRY_ID,
        recipeRevision: "skirt-pencil-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>(
        'input[data-option="' + SKIRT_PENCIL_HEM_TAPER_OPTION_ID + '"]',
      )!.value).toBe("4");
      expect(reopened.querySelector<HTMLButtonElement>(
        '[data-starter-entry-id="' + SKIRT_PENCIL_ENTRY_ID + '"]',
      )!.getAttribute("aria-pressed")).toBe("true");

      clickId(reopened, "garment-skirt");
      expect(reopened.querySelector<HTMLInputElement>(
        'input[data-option="' + SKIRT_PENCIL_HEM_TAPER_OPTION_ID + '"]',
      )).toBeNull();
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);

      clickId(reopened, "starter-" + SKIRT_A_LINE_ENTRY_ID);
      expect(reopened.querySelector<HTMLInputElement>(
        'input[data-option="' + SKIRT_A_LINE_HEM_SWEEP_OPTION_ID + '"]',
      )!.value).toBe("12");
      expect(reopened.querySelector<HTMLInputElement>(
        'input[data-option="' + SKIRT_PENCIL_HEM_TAPER_OPTION_ID + '"]',
      )).toBeNull();
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  it("exports six consistent K02 outputs and removes the K02 identity on generic Skirt", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-" + SKIRT_PENCIL_ENTRY_ID);
      reachExportStage(root);

      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) {
        clickId(root, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6));
      expect([...files.keys()].sort()).toEqual([
        "pencil-like-skirt-M-A0.pdf",
        "pencil-like-skirt-M.dxf",
        "pencil-like-skirt-M.pdf",
        "pencil-like-skirt-M.svg",
        "pencil-like-skirt-projector.svg",
        "pencil-like-skirt-techpack.pdf",
      ].sort());

      const pattern = new DOMParser().parseFromString(files.get("pencil-like-skirt-M.svg")!, "image/svg+xml");
      expect(pattern.querySelector("parsererror")).toBeNull();
      expect(pattern.querySelectorAll("path").length).toBeGreaterThan(0);
      expect(files.get("pencil-like-skirt-M.dxf")).toContain("SECTION");
      const techPackText = visiblePdfText(files.get("pencil-like-skirt-techpack.pdf")!);
      expect(techPackText).toContain("Hem circumference (modeled)");
      expect(techPackText).toContain("Digital pattern guidance only");
      expect(techPackText).toContain("Digital Pencil-like skirt using a 8 cm whole-garment hem-taper software setting");
      expect(techPackText).toContain("does not model conventional darts or a center-back vent");
      expect(techPackText).toContain("material selection, consumption");
      expect(files.get("pencil-like-skirt-M.pdf")).toBe(expectedSkirtTiledPdf(true, {
        [SKIRT_PENCIL_HEM_TAPER_OPTION_ID]: 8,
      }));
      const projectorText = [...new DOMParser().parseFromString(
        files.get("pencil-like-skirt-projector.svg")!, "image/svg+xml",
      ).getElementsByTagName("text")].map((element) => element.textContent).join(" ");
      expect(projectorText).toContain("Pencil-like skirt");
      expect(projectorText).toContain("Digital Pencil-like hem taper; grading is not validated.");

      clickId(root, "garment-skirt");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
      reachExportStage(root);
      clickId(root, "export-svg");
      clickId(root, "export-projector");
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(8));
      expect(files.has("skirt-M.svg")).toBe(true);
      expect(files.get("skirt-M.svg")).not.toBe(files.get("pencil-like-skirt-M.svg"));
      expect(files.has("skirt-projector.svg")).toBe(true);
      const genericProjectorText = [...new DOMParser().parseFromString(
        files.get("skirt-projector.svg")!, "image/svg+xml",
      ).getElementsByTagName("text")].map((element) => element.textContent).join(" ");
      expect(genericProjectorText).not.toContain("Digital Pencil-like hem taper");
    } finally {
      unmountApp();
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  });

  const tiledPdfProfiles: ReadonlyArray<{
    label: string;
    entryId: string | null;
    localCoordinates: boolean;
    options: GarmentOptions;
  }> = [
    {
      label: "K01",
      entryId: SKIRT_A_LINE_ENTRY_ID,
      localCoordinates: true,
      options: { [SKIRT_A_LINE_HEM_SWEEP_OPTION_ID]: 12 },
    },
    {
      label: "K02",
      entryId: SKIRT_PENCIL_ENTRY_ID,
      localCoordinates: true,
      options: { [SKIRT_PENCIL_HEM_TAPER_OPTION_ID]: 8 },
    },
    { label: "generic Skirt", entryId: null, localCoordinates: false, options: {} },
  ];
  for (const profile of tiledPdfProfiles) {
    it(`freezes ${profile.label} tiled PDF with the expected coordinate mode`, async () => {
      localStorage.clear();
      vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
      vi.stubGlobal("Blob", NodeBlob);
      const workflow = await openProjectWorkflow({
        repositoryOptions: {
          name: `app-${profile.label}-pdf-freeze-${Date.now()}`,
          factory: new IDBFactory(),
          crypto: webcrypto as unknown as Crypto,
        },
        storage: localStorage,
        idFactory: () => webcrypto.randomUUID(),
        now: () => "2026-11-09T10:45:00.000Z",
      });
      const root = document.createElement("div");
      document.body.append(root);
      try {
        mountApp(root, { projectWorkflow: workflow });
        clickIfPresent(root, "welcome-start");
        if (profile.entryId) clickId(root, "starter-" + profile.entryId);
        else clickId(root, "garment-skirt");
        clickId(root, "save-pattern");
        await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state)
          .toBe("saved"), { timeout: 10_000 });
        reachExportStage(root);
        const manager = root.querySelector<HTMLDetailsElement>(".project-manager-details")!;
        manager.open = true;
        const freeze = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
        await vi.waitFor(() => expect(freeze.disabled).toBe(false), { timeout: 10_000 });
        freeze.click();
        await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toContain("Frozen"),
          { timeout: 20_000 });
        const manifest = workflow.snapshot.exportManifests[0]!;
        const frozenPdf = await workflow.readFrozenArtifact(manifest.manifestId, "selected-size-tiled-pdf");
        expect(await frozenPdf.artifact.bytes.text()).toBe(
          expectedSkirtTiledPdf(profile.localCoordinates, profile.options),
        );
      } finally {
        workflow.close();
        root.remove();
        vi.unstubAllGlobals();
        localStorage.clear();
      }
    }, 30_000);
  }
  it("restores K02 identity, measurements, and taper after switching between local projects", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const now = "2026-11-09T07:00:00.000Z";
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-k02-project-switch-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => now,
    });
    let root: HTMLDivElement | null = mount({ projectWorkflow: workflow });
    const originalProjectId = workflow.snapshot.project.id;
    const otherProjectId = webcrypto.randomUUID();
    const otherStyleId = webcrypto.randomUUID();
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, "starter-" + SKIRT_PENCIL_ENTRY_ID);
      const hip = root.querySelector<HTMLInputElement>('input[data-field="hip"]')!;
      hip.value = "108";
      hip.dispatchEvent(new Event("input", { bubbles: true }));
      const taper = root.querySelector<HTMLInputElement>(
        'input[data-option="' + SKIRT_PENCIL_HEM_TAPER_OPTION_ID + '"]',
      )!;
      taper.value = "12";
      taper.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "save-pattern");
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.design.workspace.starterOrigin?.entryId)
        .toBe(SKIRT_PENCIL_ENTRY_ID));
      expect(workflow.snapshot.activeStyle.design.measurements.hip).toBe(108);
      expect(workflow.snapshot.activeStyle.design.garmentOptions.skirt)
        .toMatchObject({ [SKIRT_PENCIL_HEM_TAPER_OPTION_ID]: 12 });

      const migrated = migrateLegacySaveFile({
        json: serialize(STANDARD_M, "#204060"),
        projectId: otherProjectId,
        styleId: otherStyleId,
        migratedAt: now,
        projectName: "Separate local K02 test project",
      });
      if (!migrated.ok) throw new Error(migrated.error);
      await workflow.repository.saveProjectBundle({
        project: migrated.value.project,
        styles: [migrated.value.style],
        fieldObservations: [createFieldObservationRecord(migrated.value.style, now, "existing-local-style")],
        expectedProjectRevision: null,
      });

      await workflow.switchProject(otherProjectId);
      expect(workflow.snapshot.project.id).toBe(otherProjectId);
      await workflow.switchProject(originalProjectId);
      expect(workflow.snapshot.project.id).toBe(originalProjectId);
      expect(workflow.snapshot.activeStyle.design.measurements.hip).toBe(108);
      expect(workflow.snapshot.activeStyle.design.garmentOptions.skirt)
        .toMatchObject({ [SKIRT_PENCIL_HEM_TAPER_OPTION_ID]: 12 });
      expect(workflow.snapshot.activeStyle.design.workspace.starterOrigin?.entryId)
        .toBe(SKIRT_PENCIL_ENTRY_ID);

      unmountApp();
      root.remove();
      root = mount({ projectWorkflow: workflow });
      expect(root.querySelector<HTMLInputElement>('input[data-field="hip"]')!.value).toBe("108");
      expect(root.querySelector<HTMLInputElement>(
        'input[data-option="' + SKIRT_PENCIL_HEM_TAPER_OPTION_ID + '"]',
      )!.value).toBe("12");
      expect(root.querySelector<HTMLButtonElement>(
        '[data-starter-entry-id="' + SKIRT_PENCIL_ENTRY_ID + '"]',
      )!.getAttribute("aria-pressed")).toBe("true");
    } finally {
      unmountApp();
      root?.remove();
      workflow.close();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 30_000);


});



describe("K03 gathered pull-on skirt starter workflows", () => {
  it("keeps its controls entry-scoped, preserves invalid values, and saves/reopens the selected profile", () => {
    localStorage.clear();
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_GATHERED_ENTRY_ID}`);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Gathered pull-on skirt · software defaults");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Gathered pull-on skirt");
      expect(root.querySelector<HTMLElement>('[data-dim-row="waist"]')!.textContent)
        .toContain("Waist (gathered-to reference)");
      expect(root.querySelector<HTMLInputElement>('input[data-field="waist"]')!.getAttribute("aria-label"))
        .toBe("Waist (gathered-to reference)");
      const ratio = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_GATHER_RATIO_OPTION_ID}"]`)!;
      const casing = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_CASING_DEPTH_OPTION_ID}"]`)!;
      expect(ratio.value).toBe("1.5");
      expect(casing.value).toBe("4");
      expect(root.querySelectorAll('#garment-host [data-part="gathered-skirt"]')).toHaveLength(2);
      expect(root.querySelectorAll('#garment-host [data-part="casing-stitch-guide"]')).toHaveLength(2);
      reachExportStage(root);

      ratio.value = "1.4";
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      expect(ratio.value).toBe("1.4");
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${SKIRT_GATHER_RATIO_OPTION_ID}"]`)!.textContent)
        .toContain("use 0.25 ratio increments");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      ratio.value = "1.25";
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${SKIRT_GATHER_RATIO_OPTION_ID}"]`)!.textContent).toBe("");
      casing.value = "5.5";
      casing.dispatchEvent(new Event("input", { bubbles: true }));
      expect(casing.value).toBe("5.5");
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${SKIRT_CASING_DEPTH_OPTION_ID}"]`)!.textContent)
        .toContain("supports 2–5 cm");

      casing.value = "4";
      casing.dispatchEvent(new Event("input", { bubbles: true }));
      const waist = root.querySelector<HTMLInputElement>('input[data-field="waist"]')!;
      const ease = root.querySelector<HTMLInputElement>('input[data-field="ease"]')!;
      waist.value = "50";
      waist.dispatchEvent(new Event("input", { bubbles: true }));
      ease.value = "30";
      ease.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${SKIRT_GATHER_RATIO_OPTION_ID}"]`)!.textContent)
        .toBe("");
      reReviewAndReachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);

      waist.value = "84";
      waist.dispatchEvent(new Event("input", { bubbles: true }));
      ease.value = "10";
      ease.dispatchEvent(new Event("input", { bubbles: true }));
      ratio.value = "1.5";
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      reReviewAndReachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: Record<string, Record<string, number>>;
        workspace: { starterOrigin: { entryId: string; recipeRevision: string } };
      };
      expect(saved.garmentOptions.skirt).toMatchObject({
        [SKIRT_GATHER_RATIO_OPTION_ID]: 1.5,
        [SKIRT_CASING_DEPTH_OPTION_ID]: 4,
      });
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: SKIRT_GATHERED_ENTRY_ID,
        recipeRevision: "skirt-gathered-pull-on-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_GATHER_RATIO_OPTION_ID}"]`)!.value).toBe("1.5");
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_CASING_DEPTH_OPTION_ID}"]`)!.value).toBe("4");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${SKIRT_GATHERED_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");

      clickId(reopened, "garment-skirt");
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_GATHER_RATIO_OPTION_ID}"]`)).toBeNull();
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30_000);

  it("exports six K03 outputs with the gathered casing, pre-gather POM and no zipper claim", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_GATHERED_ENTRY_ID}`);
      reachExportStage(root);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) {
        clickId(root, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6));
      expect([...files.keys()].sort()).toEqual([
        "gathered-pull-on-skirt-M-A0.pdf",
        "gathered-pull-on-skirt-M.dxf",
        "gathered-pull-on-skirt-M.pdf",
        "gathered-pull-on-skirt-M.svg",
        "gathered-pull-on-skirt-projector.svg",
        "gathered-pull-on-skirt-techpack.pdf",
      ].sort());
      expect(files.get("gathered-pull-on-skirt-M.pdf")).toBe(expectedSkirtTiledPdf(true, {
        [SKIRT_GATHER_RATIO_OPTION_ID]: 1.5,
        [SKIRT_CASING_DEPTH_OPTION_ID]: 4,
      }));
      const defaultK03Options = {
        [SKIRT_GATHER_RATIO_OPTION_ID]: 1.5,
        [SKIRT_CASING_DEPTH_OPTION_ID]: 4,
      };
      const defaultA0 = files.get("gathered-pull-on-skirt-M-A0.pdf")!;
      expect(defaultA0).toBe(expectedSkirtA0Pdf(true, defaultK03Options));
      expect(defaultA0).toBe(expectedSkirtA0Pdf(false, defaultK03Options));
      expect(defaultA0.match(/\/Type \/Page\b/g)).toHaveLength(1);
      expect(createHash("sha256").update(defaultA0).digest("hex"))
        .toBe("3d0a64e64642f062b715950cbe240b35cfa1292936276a62302ab4a116602ef1");

      const patternText = files.get("gathered-pull-on-skirt-M.svg")!;
      expect(patternText).toContain("Finished waist fold line");
      expect(patternText).toContain("Casing stitch guide (software depth)");
      const techPackText = visiblePdfText(files.get("gathered-pull-on-skirt-techpack.pdf")!);
      expect(techPackText).toContain("Cut waist edge (before gathering)");
      expect(techPackText).toContain("Measured waist (digital gathered-to reference)");
      expect(techPackText).toContain("Length (finished top fold-hem)");
      expect(techPackText).toContain("Digital pattern guidance only");
      expect(techPackText).toContain("elastic specification");
      expect(techPackText).toContain("No separate waistband, zipper");
      expect(techPackText).not.toContain("Install one invisible zipper");
      const projectorText = [...new DOMParser().parseFromString(
        files.get("gathered-pull-on-skirt-projector.svg")!, "image/svg+xml",
      ).getElementsByTagName("text")].map((element) => element.textContent).join(" ");
      expect(projectorText).toContain("Gathered pull-on skirt");
      expect(projectorText).toContain("Digital K03 gathered pull-on skirt");
    } finally {
      unmountApp();
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30_000);
  it("exports overflowing K03 settings as complete A0 pages from the visible download path", async () => {
    localStorage.clear();
    const savedPdfs: string[] = [];
    const saveFile = vi.fn(async (filename: string, content: string) => {
      savedPdfs.push(content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_GATHERED_ENTRY_ID}`);
      reachExportStage(root);

      for (const [index, ratio] of [1.75, 2].entries()) {
        const ratioInput = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_GATHER_RATIO_OPTION_ID}"]`)!;
        ratioInput.value = String(ratio);
        ratioInput.dispatchEvent(new Event("input", { bubbles: true }));
        const casingInput = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_CASING_DEPTH_OPTION_ID}"]`)!;
        const casingDepth = ratio === 1.75 ? 4.5 : 5;
        casingInput.value = String(casingDepth);
        casingInput.dispatchEvent(new Event("input", { bubbles: true }));
        reReviewAndReachExportStage(root);
        clickId(root, "export-a0");
        await vi.waitFor(() => expect(savedPdfs).toHaveLength(index + 1));
        expect(savedPdfs[index]!.match(/\/Type \/Page\b/g)).toHaveLength(2);
        expect(savedPdfs[index]).toBe(expectedSkirtA0Pdf(true, {
          [SKIRT_GATHER_RATIO_OPTION_ID]: ratio,
          [SKIRT_CASING_DEPTH_OPTION_ID]: casingDepth,
        }));
      }
    } finally {
      unmountApp();
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30_000);

  it("freezes the K03 selected-size A0 artifact with the gathered overflow decision", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-k03-a0-freeze-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-11-10T01:00:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_GATHERED_ENTRY_ID}`);
      const ratio = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_GATHER_RATIO_OPTION_ID}"]`)!;
      ratio.value = "1.75";
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      const casing = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_CASING_DEPTH_OPTION_ID}"]`)!;
      casing.value = "4.5";
      casing.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "save-pattern");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("saved"),
        { timeout: 10_000 });
      reReviewAndReachExportStage(root);
      root.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;
      const freeze = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      await vi.waitFor(() => expect(freeze.disabled).toBe(false), { timeout: 10_000 });
      freeze.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toContain("Frozen"),
        { timeout: 20_000 });

      const manifest = workflow.snapshot.exportManifests[0]!;
      expect(manifest.artifacts.map((artifact) => artifact.artifactId)).toContain("selected-size-a0-pdf");
      const frozenA0 = await workflow.readFrozenArtifact(manifest.manifestId, "selected-size-a0-pdf");
      const frozenPdf = await frozenA0.artifact.bytes.text();
      const expected = expectedSkirtA0Pdf(true, {
        [SKIRT_GATHER_RATIO_OPTION_ID]: 1.75,
        [SKIRT_CASING_DEPTH_OPTION_ID]: 4.5,
      });
      expect(frozenPdf).toBe(expected);
      expect(frozenPdf.match(/\/Type \/Page\b/g)).toHaveLength(2);
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 30_000);
});

describe("K04 box-pleat guide skirt starter workflows", () => {
  it("shows the editable guide, blocks invalid spacing, and preserves K04 through save/reopen", () => {
    localStorage.clear();
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_BOX_PLEAT_ENTRY_ID}`);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Pleated skirt · box-pleat guide");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent)
        .toBe("Pleated skirt · box-pleat guide");
      const count = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_COUNT_OPTION_ID}"]`)!;
      const spacing = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_SPACING_OPTION_ID}"]`)!;
      expect(count.value).toBe("4");
      expect(spacing.value).toBe("3");
      expect(root.querySelectorAll('#garment-host [data-part^="box-pleat-guides-"] line')).toHaveLength(20);
      expect(root.querySelector<HTMLElement>('#garment-host [data-part="box-pleat-summary"]')!.textContent)
        .toContain("4 groups · 3 cm spacing");

      reachExportStage(root);
      clickId(root, "view-spec");
      expect(root.querySelector("#canvas-host [data-box-pleat-output-paused]")).toBeNull();
      expect(root.querySelector("#canvas-host table")).not.toBeNull();
      count.value = "12";
      count.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .toContain("overlap or cross the on-fold panel edge");
      expect(root.querySelector<HTMLElement>('#garment-host [data-part="box-pleat-preview-paused"]')!.textContent)
        .toContain("preview paused");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
      for (const view of ["pattern", "edit", "flat", "nest", "spec", "fabric"]) {
        clickId(root, `view-${view}`);
        expect(root.querySelector<HTMLButtonElement>(`#view-${view}`)!.getAttribute("aria-pressed")).toBe("true");
        expect(root.querySelector<HTMLElement>("#canvas-host [data-box-pleat-output-paused]")?.textContent)
          .toContain("overlap or cross the on-fold panel edge");
      }

      count.value = "4";
      count.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .not.toContain("overlap or cross the on-fold panel edge");
      reReviewAndReachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: Record<string, Record<string, number>>;
        workspace: { starterOrigin: { entryId: string; recipeRevision: string } };
      };
      expect(saved.garmentOptions.skirt).toMatchObject({
        [SKIRT_BOX_PLEAT_COUNT_OPTION_ID]: 4,
        [SKIRT_BOX_PLEAT_SPACING_OPTION_ID]: 3,
      });
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: SKIRT_BOX_PLEAT_ENTRY_ID,
        recipeRevision: "skirt-box-pleat-guide-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_COUNT_OPTION_ID}"]`)!.value).toBe("4");
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_SPACING_OPTION_ID}"]`)!.value).toBe("3");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${SKIRT_BOX_PLEAT_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");

      clickId(reopened, "garment-skirt");
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_COUNT_OPTION_ID}"]`)).toBeNull();
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
      expect(reopened.querySelectorAll('#garment-host [data-part^="box-pleat-guides-"] line')).toHaveLength(0);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30_000);

  it("keeps a valid selected size available while pausing outputs for an invalid XS guide", () => {
    localStorage.clear();
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_BOX_PLEAT_ENTRY_ID}`);
      reachExportStage(root);
      const waist = root.querySelector<HTMLInputElement>('input[data-field="waist"]')!;
      waist.value = "75";
      waist.dispatchEvent(new Event("input", { bubbles: true }));
      const count = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_COUNT_OPTION_ID}"]`)!;
      const spacing = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_SPACING_OPTION_ID}"]`)!;
      count.value = "12";
      count.dispatchEvent(new Event("input", { bubbles: true }));
      spacing.value = "2.5";
      spacing.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent).toContain("XS:");

      clickId(root, "view-pattern");
      expect(root.querySelector<HTMLButtonElement>("#view-pattern")!.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector("#canvas-host [data-box-pleat-output-paused]")).toBeNull();
      expect(root.querySelector("#canvas-host svg")).not.toBeNull();
      clickId(root, "view-edit");
      expect(root.querySelector<HTMLButtonElement>("#view-edit")!.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector("#canvas-host [data-box-pleat-output-paused]")).toBeNull();
      clickId(root, "view-flat");
      expect(root.querySelector<HTMLButtonElement>("#view-flat")!.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector("#canvas-host [data-box-pleat-output-paused]")).toBeNull();

      clickId(root, "view-nest");
      expect(root.querySelector<HTMLButtonElement>("#view-nest")!.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector<HTMLElement>("#canvas-host [data-box-pleat-output-paused]")?.textContent).toContain("XS:");
      clickId(root, "view-spec");
      expect(root.querySelector<HTMLButtonElement>("#view-spec")!.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector<HTMLElement>("#canvas-host [data-box-pleat-output-paused]")?.textContent).toContain("XS:");
      clickId(root, "view-fabric");
      expect(root.querySelector<HTMLButtonElement>("#view-fabric")!.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector("#canvas-host [data-box-pleat-output-paused]")).toBeNull();
      clickId(root, "nest-marker");
      expect(root.querySelector<HTMLElement>("#canvas-host [data-box-pleat-output-paused]")?.textContent).toContain("XS:");

      clickId(root, "garment-skirt");
      expect(root.querySelector(`input[data-option="${SKIRT_BOX_PLEAT_COUNT_OPTION_ID}"]`)).toBeNull();
      expect(root.querySelector("#canvas-host [data-box-pleat-output-paused]")).toBeNull();
    } finally {
      unmountApp();
      root?.remove();
      localStorage.clear();
    }
  }, 30_000);

  it("keeps generic Skirt outputs and unavailable-draft fallbacks independent of K04", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_BOX_PLEAT_ENTRY_ID}`);
      reachExportStage(root);
      clickId(root, "garment-skirt");
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_COUNT_OPTION_ID}"]`)).toBeNull();
      reachExportStage(root);
      clickId(root, "export-pdf");
      clickId(root, "export-techpack");
      clickId(root, "export-projector");
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(3));
      expect(files.get("skirt-M.pdf")).toBe(expectedSkirtTiledPdf(false));
      expect(files.has("skirt-techpack.pdf")).toBe(true);
      expect(files.get("skirt-techpack.pdf")).not.toContain("box-pleat");
      expect(visiblePdfText(files.get("skirt-techpack.pdf")!)).toContain("Skirt");
      expect(files.get("skirt-techpack.pdf")).not.toContain("Tiered skirt - gathered panels");
      expect(files.get("skirt-projector.svg")).not.toContain("box-pleat");

      const skirt = GARMENTS.find((candidate) => candidate.name === "skirt")!;
      const draftSpy = vi.spyOn(skirt, "draft").mockImplementation(() => { throw new Error("generic skirt draft failure"); });
      try {
        clickId(root, "view-edit");
        await vi.waitFor(() => expect(root?.querySelector("[data-semantic-source-unavailable]")).not.toBeNull());
      } finally {
        draftSpy.mockRestore();
      }
    } finally {
      unmountApp();
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 60_000);

  it("exports the same digital guides in SVG, DXF, PDFs, Tech Pack and Projector output", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_BOX_PLEAT_ENTRY_ID}`);
      reachExportStage(root);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) clickId(root, id);
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6));
      expect([...files.keys()].sort()).toEqual([
        "pleated-skirt-box-pleat-guide-M-A0.pdf",
        "pleated-skirt-box-pleat-guide-M.dxf",
        "pleated-skirt-box-pleat-guide-M.pdf",
        "pleated-skirt-box-pleat-guide-M.svg",
        "pleated-skirt-box-pleat-guide-projector.svg",
        "pleated-skirt-box-pleat-guide-techpack.pdf",
      ].sort());
      const options = { [SKIRT_BOX_PLEAT_COUNT_OPTION_ID]: 4, [SKIRT_BOX_PLEAT_SPACING_OPTION_ID]: 3 };
      const tiled = files.get("pleated-skirt-box-pleat-guide-M.pdf")!;
      expect(tiled).toBe(expectedSkirtTiledPdf(true, options, "line-aligned-box-pleat-guides"));
      expect(tiled.match(/\/Type \/Page\b/g)).toHaveLength(22);
      const a0 = files.get("pleated-skirt-box-pleat-guide-M-A0.pdf")!;
      expect(a0).toBe(expectedSkirtA0Pdf(false, options, "line-aligned-box-pleat-guides"));
      expect(a0.match(/\/Type \/Page\b/g)).toHaveLength(1);

      const svg = files.get("pleated-skirt-box-pleat-guide-M.svg")!;
      expect(svg).toContain("Box pleat 1 fold");
      expect(svg).toContain("Box pleat 1 roll");
      expect(svg).toContain("Box pleat 1 placement");
      const tiledText = visiblePdfText(tiled);
      const a0Text = visiblePdfText(a0);
      for (const text of [tiledText, a0Text]) {
        expect(text).toContain("F1");
        expect(text).toContain("R1");
        expect(text).toContain("P1");
        expectK04PdfGuideKey(text);
      }
      const dxf = files.get("pleated-skirt-box-pleat-guide-M.dxf")!;
      expect(dxf).toContain("MARK_FOLDLINE");
      expect(dxf).toContain("MARK_PLACEMENTLINE");
      expect(dxf.match(/\n0\nLINE\n/g)).toHaveLength(10);
      const techPack = visiblePdfText(files.get("pleated-skirt-box-pleat-guide-techpack.pdf")!);
      expect(techPack).toContain("Digital box-pleat layout guide only");
      expect(techPack).toContain("illustrative guide groups at 3 cm spacing");
      expect(techPack).toContain("no added cut fullness");
      expect(techPack).toContain("not a sewing-ready pleat pattern");
      expect(techPack).not.toContain("Install one invisible zipper");
      const projector = new DOMParser().parseFromString(files.get("pleated-skirt-box-pleat-guide-projector.svg")!, "image/svg+xml");
      const projectorText = [...projector.getElementsByTagName("text")].map((element) => element.textContent).join(" ");
      expect(projectorText).toContain("Digital box-pleat guide only");
      expect(projectorText).toContain("K04 size run and physical fit are not validated");
    } finally {
      unmountApp();
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30_000);

  it("keeps compact K04 PDF guide IDs distinct at 12 groups and 1 cm spacing", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_BOX_PLEAT_ENTRY_ID}`);
      const count = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_COUNT_OPTION_ID}"]`)!;
      const spacing = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_SPACING_OPTION_ID}"]`)!;
      count.value = "12";
      count.dispatchEvent(new Event("input", { bubbles: true }));
      spacing.value = "1";
      spacing.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .not.toContain("overlap or cross the on-fold panel edge");

      reachExportStage(root);
      clickId(root, "export-pdf");
      clickId(root, "export-a0");
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2));

      const options = {
        [SKIRT_BOX_PLEAT_COUNT_OPTION_ID]: 12,
        [SKIRT_BOX_PLEAT_SPACING_OPTION_ID]: 1,
      };
      const tiled = files.get("pleated-skirt-box-pleat-guide-M.pdf")!;
      const a0 = files.get("pleated-skirt-box-pleat-guide-M-A0.pdf")!;
      expect(tiled).toBe(expectedSkirtTiledPdf(true, options, "line-aligned-box-pleat-guides"));
      expect(tiled.match(/\/Type \/Page\b/g)).toHaveLength(22);
      expect(a0).toBe(expectedSkirtA0Pdf(false, options, "line-aligned-box-pleat-guides"));
      expect(a0.match(/\/Type \/Page\b/g)).toHaveLength(1);
      for (const pdf of [tiled, a0]) {
        const text = visiblePdfText(pdf);
        expect(text).toContain("F3");
        expect(text).toContain("R3");
        expect(text).toContain("P3");
        expectK04PdfGuideKey(text);
      }
    } finally {
      unmountApp();
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30_000);

  it("freezes the maximum K04 tiled and A0 PDFs with the repaired labels", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-k04-pdf-freeze-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-11-11T05:12:00.000Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_BOX_PLEAT_ENTRY_ID}`);
      const count = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_COUNT_OPTION_ID}"]`)!;
      const spacing = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_BOX_PLEAT_SPACING_OPTION_ID}"]`)!;
      count.value = "12";
      count.dispatchEvent(new Event("input", { bubbles: true }));
      spacing.value = "1";
      spacing.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "save-pattern");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("saved"),
        { timeout: 10_000 });
      reachExportStage(root);
      root.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;
      const freeze = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      await vi.waitFor(() => expect(freeze.disabled).toBe(false), { timeout: 10_000 });
      freeze.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toContain("Frozen"),
        { timeout: 20_000 });

      const manifest = workflow.snapshot.exportManifests[0]!;
      expect(manifest.artifacts.map((artifact) => artifact.artifactId)).toContain("selected-size-tiled-pdf");
      expect(manifest.artifacts.map((artifact) => artifact.artifactId)).toContain("selected-size-a0-pdf");
      const options = {
        [SKIRT_BOX_PLEAT_COUNT_OPTION_ID]: 12,
        [SKIRT_BOX_PLEAT_SPACING_OPTION_ID]: 1,
      };
      const tiled = await workflow.readFrozenArtifact(manifest.manifestId, "selected-size-tiled-pdf");
      const a0 = await workflow.readFrozenArtifact(manifest.manifestId, "selected-size-a0-pdf");
      expect(await tiled.artifact.bytes.text()).toBe(
        expectedSkirtTiledPdf(true, options, "line-aligned-box-pleat-guides"),
      );
      expect(await a0.artifact.bytes.text()).toBe(
        expectedSkirtA0Pdf(false, options, "line-aligned-box-pleat-guides"),
      );
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 30_000);
});

describe("K05 tiered gathered skirt starter workflows", () => {
  it("selects K05, retains invalid values, restores the draft, and saves/reopens its identity", () => {
    localStorage.clear();
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_TIERED_ENTRY_ID}`);
      expect(root.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${SKIRT_TIERED_ENTRY_ID}"]`)?.getAttribute("aria-pressed"))
        .toBe("true");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Tiered skirt · gathered panels");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent)
        .toBe("Tiered skirt · gathered panels");

      const tierCount = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_TIER_COUNT_OPTION_ID}"]`)!;
      const ratio = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_TIER_GATHER_RATIO_OPTION_ID}"]`)!;
      expect(tierCount).toMatchObject({ value: "3", min: "2", max: "4", step: "1" });
      expect(ratio).toMatchObject({ value: "1.25", min: "1.25", max: "1.5", step: "0.25" });
      expect(root.querySelectorAll('#garment-host [data-part="tiered-skirt"]')).toHaveLength(2);
      expect(root.querySelector<HTMLElement>('#garment-host [data-part="tiered-skirt-summary"]')!.textContent)
        .toContain("3 tiers · gather ratio 1.25");

      reachExportStage(root);
      ratio.value = "1.4";
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_TIER_GATHER_RATIO_OPTION_ID}"]`)!.value)
        .toBe("1.4");
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${SKIRT_TIER_GATHER_RATIO_OPTION_ID}"]`)!.textContent)
        .toContain("use 0.25 ratio increments from 1.25 ratio");
      expect(root.querySelector<HTMLElement>("#inspection-content [role=status]")?.textContent)
        .toContain("Draft paused");
      expect(root.querySelector("#inspection-content svg")).toBeNull();
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      const correctedRatio = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_TIER_GATHER_RATIO_OPTION_ID}"]`)!;
      correctedRatio.value = "1.5";
      correctedRatio.dispatchEvent(new Event("input", { bubbles: true }));
      const invalidLength = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
      invalidLength.value = "40";
      invalidLength.dispatchEvent(new Event("input", { bubbles: true }));
      const hipDepth = root.querySelector<HTMLInputElement>('input[data-field="hipDepth"]')!;
      hipDepth.value = "40";
      hipDepth.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLInputElement>('input[data-field="hipDepth"]')!.value).toBe("40");
      expect(root.querySelector<HTMLElement>("#guidance-host")!.textContent)
        .toContain("total skirt length must exceed hip depth");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      const correctedHipDepth = root.querySelector<HTMLInputElement>('input[data-field="hipDepth"]')!;
      correctedHipDepth.value = "20";
      correctedHipDepth.dispatchEvent(new Event("input", { bubbles: true }));
      const correctedLength = root.querySelector<HTMLInputElement>('input[data-field="length"]')!;
      correctedLength.value = "70";
      correctedLength.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="hipDepth"]')!.textContent).toBe("");
      reReviewAndReachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: Record<string, Record<string, number>>;
        workspace: { starterOrigin: { entryId: string; recipeRevision: string } };
      };
      expect(saved.garmentOptions.skirt).toMatchObject({
        [SKIRT_TIER_COUNT_OPTION_ID]: 3,
        [SKIRT_TIER_GATHER_RATIO_OPTION_ID]: 1.5,
      });
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: SKIRT_TIERED_ENTRY_ID,
        recipeRevision: "skirt-tiered-gathered-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_TIER_COUNT_OPTION_ID}"]`)!.value).toBe("3");
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_TIER_GATHER_RATIO_OPTION_ID}"]`)!.value).toBe("1.5");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${SKIRT_TIERED_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");

      clickId(reopened, "garment-skirt");
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_TIER_COUNT_OPTION_ID}"]`)).toBeNull();
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
      expect(reopened.querySelectorAll('#garment-host [data-part="tiered-skirt"]')).toHaveLength(0);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30_000);

  it("exports consistent maximum-range K05 geometry and digital limits in all six formats", async () => {
    localStorage.clear();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_TIERED_ENTRY_ID}`);
      for (const [optionId, value] of [[SKIRT_TIER_COUNT_OPTION_ID, "4"], [SKIRT_TIER_GATHER_RATIO_OPTION_ID, "1.5"]] as const) {
        const input = root.querySelector<HTMLInputElement>(`input[data-option="${optionId}"]`)!;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      reReviewAndReachExportStage(root);
      clickId(root, "view-flat");
      expect(root.querySelector<HTMLButtonElement>("#technical-flat-front")?.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")).not.toBeNull();
      expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).not.toContain("could not be assembled");
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) {
        clickId(root, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6));
      expect([...files.keys()].sort()).toEqual([
        "tiered-gathered-skirt-M-A0.pdf",
        "tiered-gathered-skirt-M.dxf",
        "tiered-gathered-skirt-M.pdf",
        "tiered-gathered-skirt-M.svg",
        "tiered-gathered-skirt-projector.svg",
        "tiered-gathered-skirt-techpack.pdf",
      ].sort());

      const options = { [SKIRT_TIER_COUNT_OPTION_ID]: 4, [SKIRT_TIER_GATHER_RATIO_OPTION_ID]: 1.5 };
      const tiled = files.get("tiered-gathered-skirt-M.pdf")!;
      expect(tiled).toBe(expectedSkirtTiledPdf(true, options));
      expect(tiled.match(/\/Type \/Page\b/g)).toHaveLength(30);
      const a0 = files.get("tiered-gathered-skirt-M-A0.pdf")!;
      expect(a0).toBe(expectedSkirtA0Pdf(true, options));
      expect(a0.match(/\/Type \/Page\b/g)).toHaveLength(10);
      expect(files.get("tiered-gathered-skirt-M.svg")).toContain("TIER1FRONT");
      expect(files.get("tiered-gathered-skirt-M.svg")).toContain("TIER3BACK");
      expect(files.get("tiered-gathered-skirt-M.dxf")!.match(/\n0\nPOLYLINE\n/g)).toHaveLength(20);
      const techPack = visiblePdfText(files.get("tiered-gathered-skirt-techpack.pdf")!);
      expect(techPack).toContain("Tiered skirt - gathered panels");
      expect(techPack).not.toContain("Tiered skirt ? gathered panels");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Tiered skirt · gathered panels");
      expect(techPack).toContain("4 total tiers");
      expect(techPack).toMatch(/1\.50 software\s+ratio/);
      expect(techPack).toContain("Tier 3 cut width before gathering");
      expect(techPack).toContain("not marker efficiency, fabric consumption or material quantities");
      expect(techPack).toContain("physical fit");
      const projector = new DOMParser().parseFromString(files.get("tiered-gathered-skirt-projector.svg")!, "image/svg+xml");
      const projectorText = [...projector.getElementsByTagName("text")].map((element) => element.textContent).join(" ");
      expect(projectorText).toContain("Digital K05 tiered skirt");
      expect(projectorText).toContain("physical fit are not validated");
    } finally {
      unmountApp();
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 60_000);

  it("freezes the K05 Tech Pack with its PDF-safe title", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-k05-techpack-freeze-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => "2026-11-12T00:53:55.243Z",
    });
    const root = document.createElement("div");
    document.body.append(root);
    try {
      mountApp(root, { projectWorkflow: workflow });
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_TIERED_ENTRY_ID}`);
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Tiered skirt · gathered panels");
      clickId(root, "save-pattern");
      await vi.waitFor(() => expect(root.querySelector<HTMLElement>("#project-persistence-state")?.dataset.state).toBe("saved"),
        { timeout: 10_000 });
      reachExportStage(root);
      root.querySelector<HTMLDetailsElement>(".project-manager-details")!.open = true;
      const freeze = root.querySelector<HTMLButtonElement>("[data-project-action='freeze-outputs']")!;
      await vi.waitFor(() => expect(freeze.disabled).toBe(false), { timeout: 10_000 });
      freeze.click();
      await vi.waitFor(() => expect(root.querySelector("#project-manager-status")?.textContent).toContain("Frozen"),
        { timeout: 20_000 });

      const manifest = workflow.snapshot.exportManifests[0]!;
      const artifact = await workflow.readFrozenArtifact(manifest.manifestId, "whole-run-tech-pack-pdf");
      const pdf = await artifact.artifact.bytes.text();
      expect(pdf).toContain("Tiered skirt - gathered panels");
      expect(pdf).not.toContain("Tiered skirt ? gathered panels");
    } finally {
      workflow.close();
      root.remove();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 30_000);
  it("restores K05 identity, measurements and tier settings after local-project switching", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const now = "2026-11-11T13:00:00.000Z";
    const workflow = await openProjectWorkflow({
      repositoryOptions: {
        name: `app-k05-project-switch-${Date.now()}`,
        factory: new IDBFactory(),
        crypto: webcrypto as unknown as Crypto,
      },
      storage: localStorage,
      idFactory: () => webcrypto.randomUUID(),
      now: () => now,
    });
    let root: HTMLDivElement | null = mount({ projectWorkflow: workflow });
    const originalProjectId = workflow.snapshot.project.id;
    const otherProjectId = webcrypto.randomUUID();
    const otherStyleId = webcrypto.randomUUID();
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_TIERED_ENTRY_ID}`);
      const hip = root.querySelector<HTMLInputElement>('input[data-field="hip"]')!;
      hip.value = "108";
      hip.dispatchEvent(new Event("input", { bubbles: true }));
      const count = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_TIER_COUNT_OPTION_ID}"]`)!;
      count.value = "4";
      count.dispatchEvent(new Event("input", { bubbles: true }));
      const ratio = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_TIER_GATHER_RATIO_OPTION_ID}"]`)!;
      ratio.value = "1.5";
      ratio.dispatchEvent(new Event("input", { bubbles: true }));
      clickId(root, "save-pattern");
      await vi.waitFor(() => expect(workflow.snapshot.activeStyle.design.workspace.starterOrigin?.entryId)
        .toBe(SKIRT_TIERED_ENTRY_ID));
      expect(workflow.snapshot.activeStyle.design.measurements.hip).toBe(108);
      expect(workflow.snapshot.activeStyle.design.garmentOptions.skirt).toMatchObject({
        [SKIRT_TIER_COUNT_OPTION_ID]: 4,
        [SKIRT_TIER_GATHER_RATIO_OPTION_ID]: 1.5,
      });

      const migrated = migrateLegacySaveFile({
        json: serialize(STANDARD_M, "#204060"),
        projectId: otherProjectId,
        styleId: otherStyleId,
        migratedAt: now,
        projectName: "Separate local K05 project",
      });
      if (!migrated.ok) throw new Error(migrated.error);
      await workflow.repository.saveProjectBundle({
        project: migrated.value.project,
        styles: [migrated.value.style],
        fieldObservations: [createFieldObservationRecord(migrated.value.style, now, "existing-local-style")],
        expectedProjectRevision: null,
      });
      await workflow.switchProject(otherProjectId);
      expect(workflow.snapshot.project.id).toBe(otherProjectId);
      await workflow.switchProject(originalProjectId);
      expect(workflow.snapshot.project.id).toBe(originalProjectId);
      expect(workflow.snapshot.activeStyle.design.measurements.hip).toBe(108);
      expect(workflow.snapshot.activeStyle.design.garmentOptions.skirt).toMatchObject({
        [SKIRT_TIER_COUNT_OPTION_ID]: 4,
        [SKIRT_TIER_GATHER_RATIO_OPTION_ID]: 1.5,
      });
      expect(workflow.snapshot.activeStyle.design.workspace.starterOrigin?.entryId).toBe(SKIRT_TIERED_ENTRY_ID);

      unmountApp();
      root.remove();
      root = mount({ projectWorkflow: workflow });
      expect(root.querySelector<HTMLInputElement>('input[data-field="hip"]')!.value).toBe("108");
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_TIER_COUNT_OPTION_ID}"]`)!.value).toBe("4");
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_TIER_GATHER_RATIO_OPTION_ID}"]`)!.value).toBe("1.5");
      expect(root.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${SKIRT_TIERED_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
    } finally {
      unmountApp();
      root?.remove();
      workflow.close();
      vi.unstubAllGlobals();
      localStorage.clear();
    }
  }, 30_000);
});

describe("K06 front-overlap wrap-skirt starter workflows", () => {
  it("selects K06, retains and corrects invalid settings, and saves/reopens its identity", () => {
    localStorage.clear();
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_WRAP_ENTRY_ID}`);
      expect(root.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${SKIRT_WRAP_ENTRY_ID}"]`)?.getAttribute("aria-pressed"))
        .toBe("true");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent).toContain("Wrap skirt · front overlap");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Wrap skirt · front overlap");
      expect(root.querySelector<SVGElement>('#garment-host [data-part="wrap-skirt-facing"]')).not.toBeNull();

      const overlap = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_WRAP_OVERLAP_OPTION_ID}"]`)!;
      const facing = root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_WRAP_FACING_WIDTH_OPTION_ID}"]`)!;
      expect(overlap).toMatchObject({ value: "20", min: "10", max: "40", step: "5" });
      expect(facing).toMatchObject({ value: "5", min: "3", max: "8", step: "0.5" });
      reachExportStage(root);

      overlap.value = "12";
      overlap.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_WRAP_OVERLAP_OPTION_ID}"]`)!.value).toBe("12");
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${SKIRT_WRAP_OVERLAP_OPTION_ID}"]`)!.textContent)
        .toContain("use 5 cm increments from 10 cm");
      expect(root.querySelector<HTMLElement>("#inspection-content [role=status]")?.textContent).toContain("Draft paused");
      expect(root.querySelector<SVGElement>("#inspection-content svg")).toBeNull();
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      overlap.value = "25";
      overlap.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>(`[data-input-error="option-${SKIRT_WRAP_OVERLAP_OPTION_ID}"]`)!.textContent).toBe("");
      reReviewAndReachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: Record<string, Record<string, number>>;
        workspace: { starterOrigin: { entryId: string; recipeRevision: string } };
      };
      expect(saved.garmentOptions.skirt).toMatchObject({
        [SKIRT_WRAP_OVERLAP_OPTION_ID]: 25,
        [SKIRT_WRAP_FACING_WIDTH_OPTION_ID]: 5,
      });
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: SKIRT_WRAP_ENTRY_ID,
        recipeRevision: "skirt-wrap-front-overlap-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_WRAP_OVERLAP_OPTION_ID}"]`)!.value).toBe("25");
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_WRAP_FACING_WIDTH_OPTION_ID}"]`)!.value).toBe("5");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${SKIRT_WRAP_ENTRY_ID}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "garment-skirt");
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_WRAP_OVERLAP_OPTION_ID}"]`)).toBeNull();
      expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${SKIRT_WRAP_FACING_WIDTH_OPTION_ID}"]`)).toBeNull();
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30_000);

  it("exports maximum K06 geometry and digital limits in SVG, DXF, PDFs, Tech Pack and Projector", async () => {
    localStorage.clear();
    const restoreSvgTextMetrics = stubSvgTextMetrics();
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${SKIRT_WRAP_ENTRY_ID}`);
      for (const [optionId, value] of [[SKIRT_WRAP_OVERLAP_OPTION_ID, "40"], [SKIRT_WRAP_FACING_WIDTH_OPTION_ID, "8"]] as const) {
        const input = root.querySelector<HTMLInputElement>(`input[data-option="${optionId}"]`)!;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
      reReviewAndReachExportStage(root);
      clickId(root, "view-flat");
      expect(root.querySelector<HTMLButtonElement>("#technical-flat-front")?.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")).not.toBeNull();
      expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).not.toContain("could not be assembled");
      expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).not.toContain("Technical flat withheld");
      const frontFlat = root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='FRONT_FLAT']");
      expect(frontFlat).not.toBeNull();
      expect(frontFlat!.outerHTML).toContain("overlapFacing");
      root.querySelector<HTMLButtonElement>('[data-technical-flat-face="BACK_FLAT"]')!.click();
      const backFlat = root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='BACK_FLAT']");
      expect(backFlat).not.toBeNull();
      expect(backFlat!.outerHTML).toContain("waistbandBack");
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) {
        clickId(root, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6));
      expect([...files.keys()].sort()).toEqual([
        "wrap-skirt-front-overlap-M-A0.pdf",
        "wrap-skirt-front-overlap-M.dxf",
        "wrap-skirt-front-overlap-M.pdf",
        "wrap-skirt-front-overlap-M.svg",
        "wrap-skirt-front-overlap-projector.svg",
        "wrap-skirt-front-overlap-techpack.pdf",
      ].sort());

      const options = { [SKIRT_WRAP_OVERLAP_OPTION_ID]: 40, [SKIRT_WRAP_FACING_WIDTH_OPTION_ID]: 8 };
      const tiled = files.get("wrap-skirt-front-overlap-M.pdf")!;
      expect(tiled).toBe(expectedSkirtTiledPdf(true, options));
      const a0 = files.get("wrap-skirt-front-overlap-M-A0.pdf")!;
      expect(a0).toBe(expectedSkirtA0Pdf(true, options));
      for (const roleLabel of ["Wrap overlap front", "Wrap underlap front", "Wrap overlap facing"]) {
        expect(files.get("wrap-skirt-front-overlap-M.svg")).toContain(roleLabel.toUpperCase());
      }
      expect(files.get("wrap-skirt-front-overlap-M.dxf")!.match(/\n0\nPOLYLINE\n/g)).toHaveLength(12);
      const techPack = visiblePdfText(files.get("wrap-skirt-front-overlap-techpack.pdf")!);
      expect(techPack).toContain("Wrap skirt - front overlap");
      expect(techPack).toContain("Digital K06 front-overlap skirt");
      expect(techPack).toContain("40 cm overlap");
      expect(techPack).toContain("8 cm facing");
      expect(techPack).toContain("Physical coverage, fit, materials");
      expect(root.querySelector<HTMLElement>("#current-garment")!.textContent).toBe("Wrap skirt · front overlap");
      const projector = new DOMParser().parseFromString(files.get("wrap-skirt-front-overlap-projector.svg")!, "image/svg+xml");
      const projectorText = [...projector.getElementsByTagName("text")].map((element) => element.textContent).join(" ");
      expect(projectorText).toContain("Digital K06 front-overlap skirt");
      expect(projectorText).toContain("physical coverage, fit");
    } finally {
      restoreSvgTextMetrics();
      unmountApp();
      root?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 60_000);
});
