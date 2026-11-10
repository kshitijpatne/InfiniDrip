// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { webcrypto } from "node:crypto";

import { mountApp, unmountApp } from "./app";

import { STANDARD_M, POLO, notchesForRecipeOptions, rolePiece } from "../drafting";

import { blockPieces } from "../drafting/block";

import { pieceBounds, pieceToPath } from "../render/shape";

import { exportA0Pdf, exportDxf, exportPdf, exportSvg } from "../export";

import { POLO_BAND_COLLAR_ENTRY_ID, POLO_CLASSIC_LONG_SLEEVE_ENTRY_ID, POLO_CROPPED_ENTRY_ID, POLO_LOW_EASE_ENTRY_ID, POLO_LONGLINE_ENTRY_ID, POLO_RELAXED_ENTRY_ID, POLO_ZIP_PLACKET_ENTRY_ID, STARTER_REGISTRY } from "./starter-registry";

import { POLO_BAND_COLLAR_PROFILE_OPTION_ID, POLO_BAND_COLLAR_PROFILE_VALUE, POLO_ZIPPER_CLOSURE_PROFILE_OPTION_ID, POLO_ZIPPER_CLOSURE_PROFILE_VALUE } from "../drafting/polo";

function visiblePdfText(pdf: string): string {
  const streams = [...pdf.matchAll(/>>\nstream\n([\s\S]*?)\nendstream/g)].map((match) => match[1]!);
  return streams.flatMap((stream) =>
    [...stream.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map((match) => match[1]!.replace(/\\(.)/g, "$1")),
  ).join(" ");
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



describe("P01 Classic two-button Polo Starter Blank", () => {
  it("renders, saves, reopens, exports the selected count, and returns ordinary Polo to three buttons", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const entryId = "polo-classic-two-button-digital-v1";
      const card = root.querySelector<HTMLButtonElement>(`#starter-${entryId}`)!;
      expect(card.textContent).toContain("Polo Classic two-button · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      expect(root.querySelector<HTMLElement>(`[data-starter-entry="${entryId}"]`)!.textContent)
        .toContain("2–3 buttons");
      clickId(root, `starter-${entryId}`);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Polo Classic two-button · software defaults");

      const buttonCountInput = () => root!.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!;
      expect(buttonCountInput().value).toBe("2");
      expect([buttonCountInput().min, buttonCountInput().max, buttonCountInput().step]).toEqual(["2", "3", "1"]);
      clickId(root, "view-pattern");
      const pattern = root.querySelector<SVGSVGElement>("#canvas-host svg")!;
      expect(pattern.querySelectorAll('[data-pattern-mark-name^="button-"]')).toHaveLength(2);
      expect(pattern.querySelectorAll('[data-pattern-mark-name^="buttonhole-"]')).toHaveLength(2);

      reachExportStage(root);
      buttonCountInput().value = "2.5";
      buttonCountInput().dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="option-buttonCount"]')!.textContent)
        .toBe("Front button count: choose 2 or 3 whole buttons.");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
      expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).toContain("Draft paused");

      buttonCountInput().value = "2";
      buttonCountInput().dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="option-buttonCount"]')!.textContent).toBe("");
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1") ?? "null") as {
        measurements: typeof STANDARD_M;
        garmentOptions: { polo: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; recipeId: string; recipeRevision: string } };
      } | null;
      expect(saved).not.toBeNull();
      expect(saved!.garmentOptions.polo.buttonCount).toBe(2);
      reachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      root.querySelector<HTMLButtonElement>("#export-svg")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf-source-package")!.click();
      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(4), { timeout: 20000 });

      const svg = [...files.entries()].find(([name]) => name.endsWith(".svg"))![1];
      const dxf = [...files.entries()].find(([name]) => name.endsWith(".dxf"))![1];
      const packageText = [...files.entries()].find(([name]) => name.endsWith("-cad-exchange-source.json"))![1];
      const packageJson = JSON.parse(packageText) as {
        manifest: { options: Record<string, number>; patternMarks: readonly { name: string }[] };
      };
      expect(svg.match(/data-pattern-mark-name="button-\d+"/gu)).toHaveLength(2);
      expect(svg.match(/data-pattern-mark-name="buttonhole-\d+"/gu)).toHaveLength(2);
      expect(dxf).toBe(exportDxf(blockPieces(POLO.draft(saved!.measurements, saved!.garmentOptions.polo)), POLO.allowances!));
      expect(packageJson.manifest.options.buttonCount).toBe(2);
      expect(packageJson.manifest.patternMarks.filter((mark) => mark.name.startsWith("button-")).map((mark) => mark.name))
        .toEqual(["button-1", "button-2"]);
      const techPack = visiblePdfText([...files.entries()].find(([name]) => name.endsWith("-techpack.pdf"))![1]);
      expect(techPack).toContain("Make buttonholes and attach 2 buttons");
      expect(techPack).toContain("Front placket");

      expect(saved!.workspace.starterOrigin).toMatchObject({
        entryId, recipeId: "polo", recipeRevision: "polo-classic-two-button-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("2");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${entryId}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.querySelectorAll('[data-pattern-mark-name^="button-"]'))
        .toHaveLength(2);

      clickId(reopened, "garment-polo");
      expect(reopened.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("3");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${entryId}"]`)!.getAttribute("aria-pressed"))
        .toBe("false");
      expect(reopened.querySelector<SVGSVGElement>("#canvas-host svg")!.querySelectorAll('[data-pattern-mark-name^="button-"]'))
        .toHaveLength(3);
      expect(POLO.techPackForOptions!({ buttonCount: 3 })).toEqual(POLO.techPack);
      clickId(reopened, "garment-tee");
      clickId(reopened, "garment-polo");
      expect(reopened.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("3");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30000);
});



describe("P02 Classic long-sleeve Polo Starter Blank", () => {
  it("renders the longer sleeve, preserves the profile through save/reopen, and exports truthful outputs", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const entryId = POLO_CLASSIC_LONG_SLEEVE_ENTRY_ID;
      const entry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === entryId)!;
      const card = root.querySelector<HTMLButtonElement>(`#starter-${entryId}`)!;
      expect(card.textContent).toContain("Polo Classic long-sleeve · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      clickId(root, `starter-${entryId}`);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Polo Classic long-sleeve · software defaults");

      const sleeveInput = () => root!.querySelector<HTMLInputElement>('[data-field="sleeveLength"]')!;
      expect(sleeveInput().value).toBe("55");
      expect([sleeveInput().min, sleeveInput().max, sleeveInput().step]).toEqual(["45", "70", "1"]);
      expect(root.querySelector<HTMLElement>('[data-dim-row="sleeveLength"]')!.textContent)
        .toContain("Sleeve length below cap base");
      clickId(root, "view-pattern");
      const pattern = root.querySelector<SVGSVGElement>("#canvas-host svg")!;
      const measurements = { ...STANDARD_M, ...entry.configuration.measurements };
      const longSleeve = rolePiece(POLO.draft(measurements, entry.configuration.options), "sleeve");
      const shortSleeve = rolePiece(POLO.draft({ ...measurements, sleeveLength: 22 }, entry.configuration.options), "sleeve");
      expect(pieceBounds(longSleeve).height).toBeGreaterThan(pieceBounds(shortSleeve).height);
      expect(pattern.innerHTML).toContain(pieceToPath(longSleeve));

      reachExportStage(root);
      sleeveInput().value = "44";
      sleeveInput().dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="sleeveLength"]')!.textContent)
        .toContain("45–70 cm");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
      expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).toContain("Draft paused");

      sleeveInput().value = "55";
      sleeveInput().dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="sleeveLength"]')!.textContent).toBe("");
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1") ?? "null") as {
        measurements: typeof STANDARD_M;
        garmentOptions: { polo: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; recipeId: string; recipeRevision: string } };
      } | null;
      expect(saved).not.toBeNull();
      expect(saved!.measurements.sleeveLength).toBe(55);
      expect(saved!.garmentOptions.polo.buttonCount).toBe(2);
      expect(saved!.workspace.starterOrigin).toMatchObject({
        entryId, recipeId: "polo", recipeRevision: "polo-classic-long-sleeve-v1",
      });

      reachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      root.querySelector<HTMLButtonElement>("#export-svg")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf-source-package")!.click();
      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(4), { timeout: 20000 });
      expect([...files.keys()].every((name) => name.startsWith("polo-classic-long-sleeve"))).toBe(true);
      const svg = [...files.entries()].find(([name]) => name.endsWith(".svg"))![1];
      const dxf = [...files.entries()].find(([name]) => name.endsWith(".dxf"))![1];
      const packageText = [...files.entries()].find(([name]) => name.endsWith("-cad-exchange-source.json"))![1];
      const packageJson = JSON.parse(packageText) as {
        manifest: { options: Record<string, number>; patternMarks: readonly { name: string }[] };
      };
      expect(svg).toBe(exportSvg(
        blockPieces(POLO.draft(saved!.measurements, saved!.garmentOptions.polo)),
        POLO.allowances!,
        notchesForRecipeOptions(POLO, saved!.garmentOptions.polo),
      ));
      expect(svg.match(/data-pattern-mark-name="button-\d+"/gu)).toHaveLength(2);
      expect(dxf).toBe(exportDxf(blockPieces(POLO.draft(saved!.measurements, saved!.garmentOptions.polo)), POLO.allowances!));
      expect(packageJson.manifest.options.buttonCount).toBe(2);
      expect(packageJson.manifest.patternMarks.filter((mark) => mark.name.startsWith("button-")).map((mark) => mark.name))
        .toEqual(["button-1", "button-2"]);
      const techPack = visiblePdfText([...files.entries()].find(([name]) => name.endsWith("-techpack.pdf"))![1]);
      expect(techPack).toContain("Polo Classic long-sleeve");
      expect(techPack).toContain("turn under 2 cm and topstitch");
      expect(techPack).toContain("stylearc.com/magazine/sewing-tutorials/jess-knit-polo");
      expect(techPack).toContain("No consumption estimate");
      expect(techPack).toContain("not a validated P02 grade");
      expect(techPack).toContain("physical fit, comfort, wear");
      expect(techPack).toContain("Sleeve length");

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>('[data-field="sleeveLength"]')!.value).toBe("55");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${entryId}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "garment-polo");
      expect(reopened.querySelector<HTMLInputElement>('[data-field="sleeveLength"]')!.value).toBe("22");
      expect(reopened.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("3");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30000);
});



describe("P03 Relaxed Polo Starter Blank", () => {
  it("renders the relaxed draft, preserves its profile, and exports truthful digital outputs", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const entryId = POLO_RELAXED_ENTRY_ID;
      const entry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === entryId)!;
      const card = root.querySelector<HTMLButtonElement>(`#starter-${entryId}`)!;
      expect(card.textContent).toContain("Polo Relaxed · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      expect(card.textContent).not.toContain("boxy");
      clickId(root, `starter-${entryId}`);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Polo Relaxed · software defaults");

      clickId(root, "journey-step-measure");
      root.querySelector<HTMLButtonElement>('[data-control-page-step="1"]')!.click();
      const lengthInput = root.querySelector<HTMLInputElement>('[data-field="length"]')!;
      expect([lengthInput.min, lengthInput.max]).toEqual(["59", "78"]);
      clickId(root, "journey-step-fit");

      const easeInput = () => root!.querySelector<HTMLInputElement>('[data-field="ease"]')!;
      expect(easeInput().value).toBe("15");
      expect([easeInput().min, easeInput().max, easeInput().step]).toEqual(["13", "18", "1"]);
      clickId(root, "view-pattern");
      const pattern = root.querySelector<SVGSVGElement>("#canvas-host svg")!;
      const measurements = { ...STANDARD_M, ...entry.configuration.measurements };
      const relaxedFront = rolePiece(POLO.draft(measurements, entry.configuration.options), "front");
      const classicFront = rolePiece(POLO.draft({ ...measurements, ease: 10 }, entry.configuration.options), "front");
      expect(pieceBounds(relaxedFront).width).toBeGreaterThan(pieceBounds(classicFront).width);
      expect(pattern.innerHTML).toContain(pieceToPath(relaxedFront));

      reachExportStage(root);
      easeInput().value = "12";
      easeInput().dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="ease"]')!.textContent).toContain("13–18 cm");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
      expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).toContain("Draft paused");

      easeInput().value = "15";
      easeInput().dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="ease"]')!.textContent).toBe("");
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1") ?? "null") as {
        measurements: typeof STANDARD_M;
        garmentOptions: { polo: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; recipeId: string; recipeRevision: string } };
      } | null;
      expect(saved).not.toBeNull();
      expect(saved!.measurements.ease).toBe(15);
      expect(saved!.garmentOptions.polo.buttonCount).toBe(2);
      expect(saved!.workspace.starterOrigin).toMatchObject({
        entryId, recipeId: "polo", recipeRevision: "polo-relaxed-v1",
      });

      reachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      root.querySelector<HTMLButtonElement>("#export-svg")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf-source-package")!.click();
      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(4), { timeout: 20000 });
      expect([...files.keys()].every((name) => name.startsWith("polo-relaxed"))).toBe(true);

      const svg = [...files.entries()].find(([name]) => name.endsWith(".svg"))![1];
      const dxf = [...files.entries()].find(([name]) => name.endsWith(".dxf"))![1];
      const packageText = [...files.entries()].find(([name]) => name.endsWith("-cad-exchange-source.json"))![1];
      const packageJson = JSON.parse(packageText) as {
        manifest: { options: Record<string, number>; patternMarks: readonly { name: string }[] };
      };
      expect(svg).toBe(exportSvg(
        blockPieces(POLO.draft(saved!.measurements, saved!.garmentOptions.polo)),
        POLO.allowances!,
        notchesForRecipeOptions(POLO, saved!.garmentOptions.polo),
      ));
      expect(svg.match(/data-pattern-mark-name="button-\d+"/gu)).toHaveLength(2);
      expect(dxf).toBe(exportDxf(blockPieces(POLO.draft(saved!.measurements, saved!.garmentOptions.polo)), POLO.allowances!));
      expect(packageJson.manifest.options.buttonCount).toBe(2);
      expect(packageJson.manifest.patternMarks.filter((mark) => mark.name.startsWith("button-")).map((mark) => mark.name))
        .toEqual(["button-1", "button-2"]);
      const techPack = visiblePdfText([...files.entries()].find(([name]) => name.endsWith("-techpack.pdf"))![1]);
      expect(techPack).toContain("Polo Relaxed");
      expect(techPack).toContain("15 cm ease default is an InfiniDrip software choice");
      expect(techPack).toContain("not a physical standard or validated fit target");
      expect(techPack).toContain("No consumption estimate");
      expect(techPack).toContain("not a validated P03 grade");
      expect(techPack).toContain("physical fit, comfort, wear");

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>('[data-field="ease"]')!.value).toBe("15");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${entryId}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "garment-polo");
      expect(reopened.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("3");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30000);
});



describe("P04 Cropped Polo Starter Blank", () => {
  it("renders the bounded crop profile, preserves it on reopen, and exports truthful digital outputs", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const entryId = POLO_CROPPED_ENTRY_ID;
      const entry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === entryId)!;
      const card = root.querySelector<HTMLButtonElement>(`#starter-${entryId}`)!;
      expect(card.textContent).toContain("Polo Cropped · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      clickId(root, `starter-${entryId}`);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Polo Cropped · software defaults");

      clickId(root, "journey-step-measure");
      root.querySelector<HTMLButtonElement>('[data-control-page-step="1"]')!.click();
      const lengthInput = root.querySelector<HTMLInputElement>('[data-field="length"]')!;
      expect([lengthInput.value, lengthInput.min, lengthInput.max]).toEqual(["53", "44", "57"]);
      clickId(root, "journey-step-fit");

      const measurements = { ...STANDARD_M, ...entry.configuration.measurements };
      const options = entry.configuration.options;
      const croppedFront = rolePiece(POLO.draft(measurements, options), "front");
      const classicFront = rolePiece(POLO.draft({ ...measurements, length: 70 }, options), "front");
      expect(pieceBounds(croppedFront).width).toBeCloseTo(pieceBounds(classicFront).width);
      expect(pieceBounds(croppedFront).height).toBeLessThan(pieceBounds(classicFront).height);
      for (const length of [44, 53, 57]) {
        const front = rolePiece(POLO.draft({ ...measurements, length }, options), "front");
        const bounds = pieceBounds(front);
        expect(Number.isFinite(bounds.width) && Number.isFinite(bounds.height)).toBe(true);
        expect(bounds.width).toBeGreaterThan(0);
        expect(bounds.height).toBeGreaterThan(0);
        expect(pieceToPath(front)).not.toBe("");
      }
      clickId(root, "view-pattern");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toContain(pieceToPath(croppedFront));

      reachExportStage(root);
      for (const invalidLength of [43, 58]) {
        lengthInput.value = String(invalidLength);
        lengthInput.dispatchEvent(new Event("input", { bubbles: true }));
        expect(lengthInput.value).toBe(String(invalidLength));
        expect(root.querySelector<HTMLElement>('[data-input-error="length"]')!.textContent).toContain("44–57 cm");
        expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
        expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).toContain("Draft paused");
      }
      lengthInput.value = "53";
      lengthInput.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="length"]')!.textContent).toBe("");
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1") ?? "null") as {
        measurements: typeof STANDARD_M;
        garmentOptions: { polo: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; recipeId: string; recipeRevision: string } };
      } | null;
      expect(saved).not.toBeNull();
      expect(saved!.measurements.length).toBe(53);
      expect(saved!.garmentOptions.polo.buttonCount).toBe(2);
      expect(saved!.workspace.starterOrigin).toMatchObject({
        entryId, recipeId: "polo", recipeRevision: "polo-cropped-v1",
      });

      reachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      root.querySelector<HTMLButtonElement>("#export-svg")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf-source-package")!.click();
      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(4), { timeout: 20000 });
      expect([...files.keys()].every((name) => name.startsWith("polo-cropped"))).toBe(true);

      const svg = [...files.entries()].find(([name]) => name.endsWith(".svg"))![1];
      const dxf = [...files.entries()].find(([name]) => name.endsWith(".dxf"))![1];
      const packageText = [...files.entries()].find(([name]) => name.endsWith("-cad-exchange-source.json"))![1];
      const packageJson = JSON.parse(packageText) as {
        manifest: { options: Record<string, number>; patternMarks: readonly { name: string }[] };
      };
      expect(svg).toBe(exportSvg(
        blockPieces(POLO.draft(saved!.measurements, saved!.garmentOptions.polo)),
        POLO.allowances!,
        notchesForRecipeOptions(POLO, saved!.garmentOptions.polo),
      ));
      expect(packageJson.manifest.options.buttonCount).toBe(2);
      expect(packageJson.manifest.patternMarks.filter((mark) => mark.name.startsWith("button-")).map((mark) => mark.name))
        .toEqual(["button-1", "button-2"]);
      expect(dxf).toBe(exportDxf(blockPieces(POLO.draft(saved!.measurements, saved!.garmentOptions.polo)), POLO.allowances!));
      const techPack = visiblePdfText([...files.entries()].find(([name]) => name.endsWith("-techpack.pdf"))![1]);
      expect(techPack).toContain("Polo Cropped");
      expect(techPack).toContain("53 cm body length and 44-57 cm range are editable software choices");
      expect(techPack).toContain("not a physical crop position or validated fit result");
      expect(techPack).toContain("No consumption estimate");
      expect(techPack).toContain("not a validated P04 grade");
      expect(techPack).toContain("physical fit, coverage, comfort, wear");

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>('[data-field="length"]')!.value).toBe("53");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${entryId}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "garment-polo");
      expect(reopened.querySelector<HTMLSelectElement>('[data-option="buttonCount"]')!.value).toBe("3");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30000);
});



describe("P05 Low-ease Polo Starter Blank", () => {
  it("renders the bounded ease profile, preserves its identity, and exports truthful digital outputs", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const entryId = POLO_LOW_EASE_ENTRY_ID;
      const entry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === entryId)!;
      const card = root.querySelector<HTMLButtonElement>(`#starter-${entryId}`)!;
      expect(card.textContent).toContain("Polo Low-ease · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      clickId(root, `starter-${entryId}`);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Polo Low-ease · software defaults");

      clickId(root, "journey-step-measure");
      clickId(root, "journey-step-fit");
      const easeInput = () => root!.querySelector<HTMLInputElement>('[data-field="ease"]')!;
      expect(easeInput().value).toBe("5");
      expect([easeInput().min, easeInput().max, easeInput().step]).toEqual(["3", "6", "1"]);

      const measurements = { ...STANDARD_M, ...entry.configuration.measurements };
      const classicFront = rolePiece(POLO.draft({ ...measurements, ease: 10 }, entry.configuration.options), "front");
      for (const ease of [3, 5, 6]) {
        const block = POLO.draft({ ...measurements, ease }, entry.configuration.options);
        const front = rolePiece(block, "front");
        const bounds = pieceBounds(front);
        expect(Number.isFinite(bounds.width) && Number.isFinite(bounds.height)).toBe(true);
        expect(bounds.width).toBeGreaterThan(0);
        expect(bounds.height).toBeGreaterThan(0);
        expect(bounds.width).toBeLessThan(pieceBounds(classicFront).width);
        expect(pieceToPath(front)).not.toBe("");
        expect(POLO.poms.every((pom) => Number.isFinite(pom.measure(block)))).toBe(true);
      }
      clickId(root, "view-pattern");
      const lowEaseFront = rolePiece(POLO.draft(measurements, entry.configuration.options), "front");
      expect(root.querySelector<SVGSVGElement>("#canvas-host svg")!.innerHTML).toContain(pieceToPath(lowEaseFront));

      for (const supportedEase of [3, 4, 5, 6]) {
        easeInput().value = String(supportedEase);
        easeInput().dispatchEvent(new Event("input", { bubbles: true }));
        clickId(root, "journey-step-fit");
        clickId(root, "journey-next"); // P05 Style → Check remains available across the declared range.
        const guidanceText = root.querySelector<HTMLElement>("#guidance-host")!.textContent ?? "";
        expect(guidanceText).toContain(`P05 Low-ease: ${supportedEase} cm is within the declared 3–6 cm software range.`);
        expect(guidanceText).not.toContain("tee check");
        expect(root.querySelector<HTMLButtonElement>("#journey-next")!.disabled).toBe(false);
        clickId(root, "journey-next"); // reviewed Check → Export
        expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      }
      for (const invalidEase of [2, 7]) {
        easeInput().value = String(invalidEase);
        easeInput().dispatchEvent(new Event("input", { bubbles: true }));
        expect(easeInput().value).toBe(String(invalidEase));
        expect(root.querySelector<HTMLElement>('[data-input-error="ease"]')!.textContent).toContain("3–6 cm");
        expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
        expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).toContain("Draft paused");
      }
      easeInput().value = "5";
      easeInput().dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLElement>('[data-input-error="ease"]')!.textContent).toBe("");
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1") ?? "null") as {
        measurements: typeof STANDARD_M;
        garmentOptions: { polo: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; recipeId: string; recipeRevision: string } };
      } | null;
      expect(saved).not.toBeNull();
      expect(saved!.measurements.ease).toBe(5);
      expect(saved!.garmentOptions.polo.buttonCount).toBe(2);
      expect(saved!.workspace.starterOrigin).toMatchObject({
        entryId, recipeId: "polo", recipeRevision: "polo-low-ease-v1",
      });

      reachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
      root.querySelector<HTMLButtonElement>("#export-svg")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf-source-package")!.click();
      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(4), { timeout: 20000 });
      expect([...files.keys()].every((name) => name.startsWith("polo-low-ease"))).toBe(true);

      const svg = [...files.entries()].find(([name]) => name.endsWith(".svg"))![1];
      const dxf = [...files.entries()].find(([name]) => name.endsWith(".dxf"))![1];
      const packageText = [...files.entries()].find(([name]) => name.endsWith("-cad-exchange-source.json"))![1];
      const packageJson = JSON.parse(packageText) as {
        manifest: { options: Record<string, number>; patternMarks: readonly { name: string }[] };
      };
      expect(svg).toBe(exportSvg(
        blockPieces(POLO.draft(saved!.measurements, saved!.garmentOptions.polo)),
        POLO.allowances!,
        notchesForRecipeOptions(POLO, saved!.garmentOptions.polo),
      ));
      expect(packageJson.manifest.options.buttonCount).toBe(2);
      expect(packageJson.manifest.patternMarks.filter((mark) => mark.name.startsWith("button-")).map((mark) => mark.name))
        .toEqual(["button-1", "button-2"]);
      expect(dxf).toBe(exportDxf(blockPieces(POLO.draft(saved!.measurements, saved!.garmentOptions.polo)), POLO.allowances!));
      const techPack = visiblePdfText([...files.entries()].find(([name]) => name.endsWith("-techpack.pdf"))![1]);
      expect(techPack).toContain("Polo Low-ease");
      expect(techPack).toContain("5 cm ease default and editable 3-6 cm range are InfiniDrip software choices");
      expect(techPack).toContain("No darted or independently shaped waist construction is added");
      expect(techPack).toContain("No consumption estimate");
      expect(techPack).toContain("not a validated P05 grade");
      expect(techPack).toContain("physical fit, comfort, wear");

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>('[data-field="ease"]')!.value).toBe("5");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${entryId}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "garment-polo");
      expect(reopened.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("3");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30000);
});



describe("P06 Longline Polo Starter Blank", () => {
  it("renders editable Longline Polo defaults, blocks invalid values, and preserves P06 output identity", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const entryId = POLO_LONGLINE_ENTRY_ID;
      const entry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === entryId)!;
      const card = root.querySelector<HTMLButtonElement>("#starter-" + entryId)!;
      expect(card.textContent).toContain("Polo Longline · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      clickId(root, "starter-" + entryId);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Polo Longline · software defaults");
      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Longline polo");

      clickId(root, "journey-step-measure");
      root.querySelector<HTMLButtonElement>('[data-control-page-step="1"]')!.click();
      const easeInput = () => root!.querySelector<HTMLInputElement>('[data-field="ease"]')!;
      const lengthInput = () => root!.querySelector<HTMLInputElement>('[data-field="length"]')!;
      expect([easeInput().value, easeInput().min, easeInput().max, easeInput().step]).toEqual(["10", "7", "18", "1"]);
      expect([lengthInput().value, lengthInput().min, lengthInput().max, lengthInput().step]).toEqual(["89", "78", "100", "1"]);

      const measurements = { ...STANDARD_M, ...entry.configuration.measurements };
      for (const ease of [7, 10, 18]) {
        easeInput().value = String(ease);
        easeInput().dispatchEvent(new Event("input", { bubbles: true }));
        expect(easeInput().value).toBe(String(ease));
        expect(root.querySelector<HTMLElement>('[data-input-error="ease"]')!.textContent).toBe("");
      }
      for (const length of [78, 89, 100]) {
        lengthInput().value = String(length);
        lengthInput().dispatchEvent(new Event("input", { bubbles: true }));
        expect(lengthInput().value).toBe(String(length));
        expect(root.querySelector<HTMLElement>('[data-input-error="length"]')!.textContent).toBe("");
      }
      for (const ease of [7, 10, 18]) {
        for (const length of [78, 89, 100]) {
          const drafted = POLO.draft({ ...measurements, ease, length }, entry.configuration.options);
          const front = rolePiece(drafted, "front");
          const bounds = pieceBounds(front);
          expect(Number.isFinite(bounds.width) && Number.isFinite(bounds.height)).toBe(true);
          expect(bounds.width).toBeGreaterThan(0);
          expect(bounds.height).toBeGreaterThan(0);
          expect(pieceToPath(front)).not.toBe("");
          expect(POLO.poms.every((pom) => Number.isFinite(pom.measure(drafted)))).toBe(true);
        }
      }

      const setValue = (selector: string, value: number) => {
        const input = root!.querySelector<HTMLInputElement>(selector)!;
        input.value = String(value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return input;
      };
      setValue('[data-field="chest"]', 160);
      setValue('[data-field="length"]', 78);
      setValue('[data-option="placketLength"]', 30);
      setValue('[data-option="sideVentDepth"]', 15);
      clickId(root, "journey-step-fit");
      clickId(root, "journey-next");
      const boundaryGuidance = root.querySelector<HTMLElement>("#guidance-host")!.textContent ?? "";
      expect(boundaryGuidance).not.toContain("Placket reaches the front vent region");
      expect(boundaryGuidance).not.toContain("Placket reaches the hem allowance");
      setValue('[data-field="ease"]', 6);
      expect(easeInput().value).toBe("6");
      expect(root.querySelector<HTMLElement>('[data-input-error="ease"]')!.textContent).toContain("7–18 cm");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
      expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).toContain("Draft paused");
      setValue('[data-field="ease"]', 19);
      expect(easeInput().value).toBe("19");
      expect(root.querySelector<HTMLElement>('[data-input-error="ease"]')!.textContent).toContain("7–18 cm");
      setValue('[data-field="length"]', 77);
      expect(lengthInput().value).toBe("77");
      expect(root.querySelector<HTMLElement>('[data-input-error="length"]')!.textContent).toContain("78–100 cm");
      setValue('[data-field="length"]', 101);
      expect(lengthInput().value).toBe("101");
      expect(root.querySelector<HTMLElement>('[data-input-error="length"]')!.textContent).toContain("78–100 cm");

      setValue('[data-field="ease"]', 10);
      setValue('[data-field="length"]', 89);
      setValue('[data-field="chest"]', 100);
      setValue('[data-option="placketLength"]', 14);
      setValue('[data-option="sideVentDepth"]', 6);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1") ?? "null") as {
        measurements: typeof STANDARD_M;
        garmentOptions: { polo: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; recipeId: string; recipeRevision: string } };
      } | null;
      expect(saved).not.toBeNull();
      expect(saved!.measurements.ease).toBe(10);
      expect(saved!.measurements.length).toBe(89);
      expect(saved!.garmentOptions.polo.buttonCount).toBe(2);
      expect(saved!.workspace.starterOrigin).toMatchObject({
        entryId, recipeId: "polo", recipeRevision: "polo-longline-v1",
      });

      reachExportStage(root);
      root.querySelector<HTMLButtonElement>("#export-svg")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf-source-package")!.click();
      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(4), { timeout: 20000 });
      expect([...files.keys()].every((name) => name.startsWith("polo-longline"))).toBe(true);
      const svg = [...files.entries()].find(([name]) => name.endsWith(".svg"))![1];
      const dxf = [...files.entries()].find(([name]) => name.endsWith(".dxf"))![1];
      const packageText = [...files.entries()].find(([name]) => name.endsWith("-cad-exchange-source.json"))![1];
      const packageJson = JSON.parse(packageText) as {
        manifest: { options: Record<string, number>; patternMarks: readonly { name: string }[] };
      };
      expect(svg).toBe(exportSvg(
        blockPieces(POLO.draft(saved!.measurements, saved!.garmentOptions.polo)),
        POLO.allowances!,
        notchesForRecipeOptions(POLO, saved!.garmentOptions.polo),
      ));
      expect(packageJson.manifest.options.buttonCount).toBe(2);
      expect(packageJson.manifest.patternMarks.filter((mark) => mark.name.startsWith("button-")).map((mark) => mark.name))
        .toEqual(["button-1", "button-2"]);
      expect(dxf).toBe(exportDxf(blockPieces(POLO.draft(saved!.measurements, saved!.garmentOptions.polo)), POLO.allowances!));
      const techPack = visiblePdfText([...files.entries()].find(([name]) => name.endsWith("-techpack.pdf"))![1]);
      expect(techPack).toContain("Polo Longline");
      expect(techPack).toContain("10 cm ease and 89 cm modeled HPS-to-hem length");
      expect(techPack).toContain("No consumption estimate");
      expect(techPack).toContain("not a validated P06 grade");
      expect(techPack).toContain("physical fit, hem placement, comfort, wear");

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>('[data-field="ease"]')!.value).toBe("10");
      expect(reopened.querySelector<HTMLInputElement>('[data-field="length"]')!.value).toBe("89");
      expect(reopened.querySelector<HTMLButtonElement>("[data-starter-entry-id=" + entryId + "]")!.getAttribute("aria-pressed")).toBe("true");
      clickId(reopened, "garment-polo");
      expect(reopened.querySelector<HTMLSelectElement>('[data-option="buttonCount"]')!.value).toBe("3");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30000);
});



describe("P07 Zip-placket Polo Starter Blank", () => {
  it("uses the P07 zipper wording in its spatial option cue", () => {
    const root = mount();
    try {
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${POLO_ZIP_PLACKET_ENTRY_ID}`);
      clickId(root, "view-body");
      const row = root.querySelector<HTMLElement>('[data-dim-row="option-placketLength"]')!;
      row.dispatchEvent(new Event("mouseenter"));
      const cue = root.querySelector<HTMLElement>("#spatial-cue-text")!.textContent!;
      expect(cue).toContain("Modeled zipper opening length");
      expect(cue).not.toContain("Finished placket length");
    } finally {
      root.remove();
      localStorage.clear();
    }
  });

  it("preserves invalid opening and width values with correction guidance after save and reopen", () => {
    localStorage.clear();
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      clickId(root, `starter-${POLO_ZIP_PLACKET_ENTRY_ID}`);
      clickId(root, "journey-step-measure");
      root.querySelector<HTMLButtonElement>('[data-control-page-step="1"]')!.click();
      const setOption = (field: string, value: number) => {
        const input = root!.querySelector<HTMLInputElement>(`[data-option="${field}"]`)!;
        input.value = String(value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return input;
      };
      setOption("placketLength", 14.25);
      setOption("placketWidth", 3.25);
      expect(root.querySelector<HTMLElement>('[data-input-error="option-placketLength"]')?.textContent)
        .toContain("0.5 cm increments");
      expect(root.querySelector<HTMLElement>('[data-input-error="option-placketWidth"]')?.textContent)
        .toContain("0.5 cm increments");

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1") ?? "null") as {
        garmentOptions: { polo: Record<string, number> };
      } | null;
      expect(saved?.garmentOptions.polo).toMatchObject({ placketLength: 14.25, placketWidth: 3.25 });
      unmountApp();
      root.remove();
      root = null;

      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>('[data-option="placketLength"]')?.value).toBe("14.25");
      expect(reopened.querySelector<HTMLInputElement>('[data-option="placketWidth"]')?.value).toBe("3.25");
      expect(reopened.querySelector<HTMLElement>('[data-input-error="option-placketLength"]')?.textContent)
        .toContain("0.5 cm increments");
      expect(reopened.querySelector<HTMLElement>('[data-input-error="option-placketWidth"]')?.textContent)
        .toContain("0.5 cm increments");
      expect(reopened.querySelector<HTMLElement>("#canvas-host")?.textContent).toContain("Draft paused");
      expect(reopened.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      localStorage.clear();
    }
  });

  it("keeps the zipper profile through edits, save/reopen, and zipper-only exports", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const entryId = POLO_ZIP_PLACKET_ENTRY_ID;
      const entry = STARTER_REGISTRY.entries.find((candidate) => candidate.entryId === entryId)!;
      const card = root.querySelector<HTMLButtonElement>("#starter-" + entryId)!;
      expect(card.textContent).toContain("Polo Zip-placket · software defaults");
      expect(card.textContent).toContain("B1 technical review pending · physical validation not-validated");
      clickId(root, "starter-" + entryId);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Polo Zip-placket · software defaults");
      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Classic polo");

      clickId(root, "journey-step-measure");
      root.querySelector<HTMLButtonElement>('[data-control-page-step="1"]')!.click();
      const openingInput = () => root!.querySelector<HTMLInputElement>('[data-option="placketLength"]')!;
      const widthInput = () => root!.querySelector<HTMLInputElement>('[data-option="placketWidth"]')!;
      expect([openingInput().value, openingInput().min, openingInput().max, openingInput().step])
        .toEqual(["14", "14", "30", "0.5"]);
      expect(openingInput().closest("label")?.textContent).toContain("Modeled zipper opening length");
      expect([widthInput().value, widthInput().min, widthInput().max, widthInput().step])
        .toEqual(["3", "2", "4", "0.5"]);
      expect(widthInput().closest("label")?.textContent).toContain("Finished zipper-placket width");
      expect(root.querySelector('[data-option="buttonCount"]')).toBeNull();

      const setOption = (id: string, value: number) => {
        const input = root!.querySelector<HTMLInputElement>(`[data-option="${id}"]`)!;
        input.value = String(value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return input;
      };
      setOption("placketLength", 13.5);
      expect(openingInput().value).toBe("13.5");
      expect(root.querySelector<HTMLElement>('[data-input-error="option-placketLength"]')?.textContent ?? "")
        .toContain("14–30 cm");
      setOption("placketLength", 14.25);
      expect(openingInput().value).toBe("14.25");
      setOption("placketWidth", 4.5);
      expect(widthInput().value).toBe("4.5");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
      expect(root.querySelector<HTMLElement>("#canvas-host")!.textContent).toContain("Draft paused");

      setOption("placketLength", 20);
      setOption("placketWidth", 3.5);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1") ?? "null") as {
        measurements: typeof STANDARD_M;
        garmentOptions: { polo: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; recipeId: string; recipeRevision: string } };
      } | null;
      expect(saved).not.toBeNull();
      expect(saved!.garmentOptions.polo.placketLength).toBe(20);
      expect(saved!.garmentOptions.polo.placketWidth).toBe(3.5);
      expect(saved!.workspace.starterOrigin).toMatchObject({
        entryId, recipeId: "polo", recipeRevision: "polo-zip-placket-v1",
      });
      expect(entry.configuration.options).not.toHaveProperty("buttonCount");

      reachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(false);
      root.querySelector<HTMLButtonElement>("#export-svg")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf")!.click();
      root.querySelector<HTMLButtonElement>("#export-pdf")!.click();
      root.querySelector<HTMLButtonElement>("#export-dxf-source-package")!.click();
      root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(5), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "polo-zip-placket-M-cad-exchange-source.json",
        "polo-zip-placket-M.dxf",
        "polo-zip-placket-M.pdf",
        "polo-zip-placket-M.svg",
        "polo-zip-placket-techpack.pdf",
      ].sort());
      expect([...files.keys()].every((name) => name.startsWith("polo-zip-placket"))).toBe(true);
      const profileOptions = {
        ...saved!.garmentOptions.polo,
        [POLO_ZIPPER_CLOSURE_PROFILE_OPTION_ID]: POLO_ZIPPER_CLOSURE_PROFILE_VALUE,
      };
      const drafted = POLO.draft(saved!.measurements, profileOptions);
      const pieces = blockPieces(drafted);
      const svg = [...files.entries()].find(([name]) => name.endsWith(".svg"))![1];
      const dxf = [...files.entries()].find(([name]) => name.endsWith(".dxf"))![1];
      const tiledPdf = files.get("polo-zip-placket-M.pdf")!;
      const packageText = [...files.entries()].find(([name]) => name.endsWith("-cad-exchange-source.json"))![1];
      const packageJson = JSON.parse(packageText) as {
        manifest: { options: Record<string, number>; patternMarks: readonly { name: string }[]; pieces: readonly { role: string }[] };
      };
      expect(svg).toBe(exportSvg(pieces, POLO.allowances!, notchesForRecipeOptions(POLO, profileOptions)));
      expect(dxf).toBe(exportDxf(pieces, POLO.allowances!));
      expect(tiledPdf).toBe(exportPdf(pieces, POLO.allowances!, undefined, 1.0, true));
      expect(packageJson.manifest.options.placketLength).toBe(20);
      expect(packageJson.manifest.options.placketWidth).toBe(3.5);
      expect(packageJson.manifest.options).not.toHaveProperty(POLO_ZIPPER_CLOSURE_PROFILE_OPTION_ID);
      expect(packageJson.manifest.options).not.toHaveProperty("buttonCount");
      expect(packageJson.manifest.pieces.filter((piece) => piece.role === "zipperFinish")).toHaveLength(1);
      expect(packageJson.manifest.patternMarks.map((mark) => mark.name)).toEqual(expect.arrayContaining([
        "zipperTopAnchor", "zipperBottomAnchor", "zipperFinishFold", "zipperTapeLeft", "zipperTapeRight",
      ]));
      expect(packageJson.manifest.patternMarks.some((mark) => mark.name.startsWith("button"))).toBe(false);
      const techPack = visiblePdfText([...files.entries()].find(([name]) => name.endsWith("-techpack.pdf"))![1]);
      expect(techPack).toContain("Polo Zip-placket");
      expect(techPack).toContain("20 cm modeled zipper opening");
      expect(techPack).toContain("physical product unspecified");
      expect(techPack).toContain("No buttons or buttonholes");
      expect(techPack).toContain("not a validated P07 grade");
      expect(techPack).toContain("physical fit, comfort, wear");
      expect(techPack).toContain("The 20 cm modeled opening and 3.5 cm finished zipper-placket width");

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>('[data-option="placketLength"]')!.value).toBe("20");
      expect(reopened.querySelector<HTMLInputElement>('[data-option="placketWidth"]')!.value).toBe("3.5");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${entryId}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "garment-polo");
      expect(reopened.querySelector<HTMLSelectElement>('[data-option="buttonCount"]')!.value).toBe("3");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30000);
});



describe("P08 band-collar half-placket Polo Starter Blank", () => {
  it("keeps identity, editable choices, saved draft and all digital outputs on the band-only profile", async () => {
    localStorage.clear();
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    try {
      root = mount();
      clickIfPresent(root, "welcome-start");
      const entryId = POLO_BAND_COLLAR_ENTRY_ID;
      const card = root.querySelector<HTMLButtonElement>(`#starter-${entryId}`)!;
      expect(card.textContent).toContain("Polo Band-collar half-placket · software defaults");
      clickId(root, `starter-${entryId}`);
      expect(root.querySelector<HTMLElement>("#starter-origin-status")!.textContent)
        .toContain("Starting design: Polo Band-collar half-placket · software defaults");
      expect(root.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Classic polo");

      clickId(root, "journey-step-measure");
      const bandHeight = root.querySelector<HTMLInputElement>('[data-option="standHeight"]')!;
      const opening = root.querySelector<HTMLInputElement>('[data-option="placketLength"]')!;
      const width = root.querySelector<HTMLInputElement>('[data-option="placketWidth"]')!;
      const buttons = root.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!;
      expect([bandHeight.value, bandHeight.min, bandHeight.max, bandHeight.step]).toEqual(["2", "1", "3", "0.5"]);
      expect(bandHeight.closest("label")?.textContent).toContain("Finished band height");
      expect([opening.value, opening.min, opening.max, opening.step]).toEqual(["14", "14", "30", "0.5"]);
      expect([width.value, width.min, width.max, width.step]).toEqual(["3", "2", "4", "0.5"]);
      expect(buttons.value).toBe("2");
      expect(root.querySelector('[data-option="collarLeafDepth"]')).toBeNull();
      expect(root.querySelector('[data-option="collarPointExtension"]')).toBeNull();

      root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!.click();
      const assembledSvg = root.querySelector<SVGSVGElement>("#garment-host svg")!;
      expect(assembledSvg.querySelectorAll('[data-garment-detail="polo"]')).toHaveLength(2);
      expect(assembledSvg.querySelectorAll('[data-edge="option-standHeight"] path').length).toBeGreaterThan(0);
      expect(assembledSvg.querySelector('[data-edge="option-collarLeafDepth"]')).toBeNull();
      expect(assembledSvg.querySelector('[data-edge="option-collarPointExtension"]')).toBeNull();
      expect(assembledSvg.querySelectorAll('[data-edge="option-placketLength"] circle')).toHaveLength(2);
      const invalidButtonCount = root.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!;
      invalidButtonCount.value = "1000000000";
      invalidButtonCount.dispatchEvent(new Event("input", { bubbles: true }));
      expect(root.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("1000000000");
      expect(root.querySelector<HTMLElement>('[data-input-error="option-buttonCount"]')?.textContent)
        .toContain("supports 2–3 buttons");
      const correctedButtonCount = root.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!;
      correctedButtonCount.value = "2";
      correctedButtonCount.dispatchEvent(new Event("input", { bubbles: true }));
      root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!.click();

      const setOption = (id: string, value: number) => {
        const input = root!.querySelector<HTMLInputElement>(`[data-option="${id}"]`)!;
        input.value = String(value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        return input;
      };
      setOption("standHeight", 3.5);
      setOption("placketWidth", 4.5);
      expect(root.querySelector<HTMLElement>('[data-input-error="option-standHeight"]')?.textContent).toContain("1–3 cm");
      expect(root.querySelector<HTMLElement>('[data-input-error="option-placketWidth"]')?.textContent).toContain("2–4 cm");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);

      setOption("standHeight", 2.5);
      setOption("placketLength", 20);
      setOption("placketWidth", 3.5);
      setOption("buttonCount", 3);
      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1") ?? "null") as {
        measurements: typeof STANDARD_M;
        garmentOptions: { polo: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; recipeId: string; recipeRevision: string } };
      } | null;
      expect(saved).not.toBeNull();
      expect(saved!.garmentOptions.polo).toMatchObject({ standHeight: 2.5, placketLength: 20, placketWidth: 3.5, buttonCount: 3 });
      expect(saved!.workspace.starterOrigin).toMatchObject({ entryId, recipeId: "polo", recipeRevision: "polo-band-collar-v1" });

      reachExportStage(root);
      expect(root.querySelector<HTMLButtonElement>("#export-techpack")!.disabled).toBe(false);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-dxf-source-package", "export-techpack"]) clickId(root, id);
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "polo-band-collar-M-cad-exchange-source.json",
        "polo-band-collar-M.dxf",
        "polo-band-collar-M.pdf",
        "polo-band-collar-M-A0.pdf",
        "polo-band-collar-M.svg",
        "polo-band-collar-techpack.pdf",
      ].sort());
      const profileOptions = {
        ...saved!.garmentOptions.polo,
        [POLO_BAND_COLLAR_PROFILE_OPTION_ID]: POLO_BAND_COLLAR_PROFILE_VALUE,
      };
      const drafted = POLO.draft(saved!.measurements, profileOptions);
      const pieces = blockPieces(drafted);
      const svg = files.get("polo-band-collar-M.svg")!;
      const dxf = files.get("polo-band-collar-M.dxf")!;
      const a0 = files.get("polo-band-collar-M-A0.pdf")!;
      const packageJson = JSON.parse(files.get("polo-band-collar-M-cad-exchange-source.json")!) as {
        manifest: { options: Record<string, number>; pieces: readonly { role: string }[] };
      };
      expect(svg).toBe(exportSvg(pieces, POLO.allowances!, notchesForRecipeOptions(POLO, profileOptions)));
      expect(dxf).toBe(exportDxf(pieces, POLO.allowances!));
      expect(a0).toBe(exportA0Pdf(
        pieces, POLO.allowances!, notchesForRecipeOptions(POLO, profileOptions), undefined, POLO.a0Overflow === true,
      ));
      const a0Text = visiblePdfText(a0);
      for (const pieceName of ["FRONT", "BACK", "SLEEVE", "BUTTON PLACKET", "BUTTONHOLE PLACKET", "OUTER COLLAR BAND", "INNER COLLAR BAND"]) {
        expect(a0Text).toContain(pieceName);
      }
      expect(packageJson.manifest.options).not.toHaveProperty(POLO_BAND_COLLAR_PROFILE_OPTION_ID);
      expect(packageJson.manifest.pieces.map((piece) => piece.role)).toEqual(expect.arrayContaining(["outerStand", "innerStand"]));
      expect(packageJson.manifest.pieces.map((piece) => piece.role)).not.toContain("upperCollar");
      const techPack = visiblePdfText(files.get("polo-band-collar-techpack.pdf")!);
      expect(techPack).toContain("Polo Band-collar half-placket");
      expect(techPack).toContain("two band layers with no pointed collar leaf");
      expect(techPack).toContain("not a validated P08 grade");

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLInputElement>('[data-option="standHeight"]')!.value).toBe("2.5");
      expect(reopened.querySelector<HTMLInputElement>('[data-option="placketLength"]')!.value).toBe("20");
      expect(reopened.querySelector<HTMLInputElement>('[data-option="placketWidth"]')!.value).toBe("3.5");
      expect(reopened.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("3");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${entryId}"]`)!.getAttribute("aria-pressed"))
        .toBe("true");
      clickId(reopened, "garment-polo");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")!.hidden).toBe(true);
      expect(reopened.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("3");
      expect(reopened.querySelector('[data-option="collarLeafDepth"]')).not.toBeNull();
    } finally {
      unmountApp();
      root?.remove();
      reopened?.remove();
      delete window.electronAPI;
      localStorage.clear();
    }
  }, 30000);
});
