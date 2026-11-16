// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
import { webcrypto } from "node:crypto";
import { mountApp, unmountApp } from "./app";
import { STARTER_REGISTRY, TROUSER_CLASSIC_STRAIGHT_ENTRY_ID, TROUSER_WIDE_LEG_ENTRY_ID } from "./starter-registry";

const mountedRoots = new Set<HTMLDivElement>();
type TrackedListener = { type: string; listener: EventListenerOrEventListenerObject; options?: boolean | AddEventListenerOptions };
const trackedListeners: TrackedListener[] = [];
const addNativeWindowListener = window.addEventListener.bind(window);
const removeNativeWindowListener = window.removeEventListener.bind(window);

const mount = (): HTMLDivElement => {
  const root = document.createElement("div");
  mountApp(root);
  mountedRoots.add(root);
  return root;
};

const clickId = (root: HTMLElement, id: string): void => {
  const target = root.querySelector<HTMLElement>(`#${id}`);
  if (!target) throw new Error(`Expected #${id} to render; blocker: ${root.querySelector("#journey-blocker")?.textContent}`);
  target.click();
};

const reachExportStage = (root: HTMLElement): void => {
  root.querySelector<HTMLElement>("#welcome-start")?.click();
  clickId(root, "journey-step-fit");
  clickId(root, "journey-next");
  clickId(root, "journey-next");
};

const setField = (root: HTMLElement, id: string, value: string): HTMLInputElement => {
  const input = root.querySelector<HTMLInputElement>(`input[data-field="${id}"]`);
  if (!input) throw new Error(`Expected measurement control ${id}`);
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return input;
};

const setOption = (root: HTMLElement, id: string, value: string): HTMLInputElement => {
  const input = root.querySelector<HTMLInputElement>('input[data-option="' + id + '"]');
  if (!input) throw new Error("Expected option control " + id);
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  return input;
};

function visiblePdfText(pdf: string): string {
  const streams = [...pdf.matchAll(/>>\nstream\n([\s\S]*?)\nendstream/g)].map((match) => match[1]!);
  return streams.flatMap((stream) =>
    [...stream.matchAll(/\(((?:[^()\\]|\\.)*)\) Tj/g)].map((match) => match[1]!.replace(/\\(.)/g, "$1")),
  ).join(" ");
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

beforeEach(() => {
  localStorage.clear();
  trackedListeners.length = 0;
  vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
    trackedListeners.push({ type, listener, options });
    addNativeWindowListener(type, listener, options);
  });
});

afterEach(() => {
  unmountApp();
  for (const { type, listener, options } of trackedListeners) removeNativeWindowListener(type, listener, options);
  trackedListeners.length = 0;
  for (const root of mountedRoots) root.remove();
  mountedRoots.clear();
  delete window.electronAPI;
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("R01 Classic straight trouser starter app", () => {
  it("selects the profile, keeps controls editable, saves/reopens identity and returns to generic Trouser", () => {
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    const restoreSvgTextMetrics = stubSvgTextMetrics();
    try {
      root = mount();
      clickId(root, "welcome-start");
      clickId(root, "garment-trouser");
      expect(root.querySelector<HTMLInputElement>('input[data-field="ease"]')?.value).toBe("10");
      clickId(root, "view-pattern");
      const genericPattern = root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML;
      expect(genericPattern).toBeTruthy();

      clickId(root, `starter-${TROUSER_CLASSIC_STRAIGHT_ENTRY_ID}`);
      expect(root.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${TROUSER_CLASSIC_STRAIGHT_ENTRY_ID}"]`)?.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Classic straight trouser");
      expect(root.querySelector<HTMLElement>("#starter-trouser-classic-straight-digital-v1 .garment-card-title")?.textContent).toBe("Classic straight trouser");
      expect(root.querySelector<HTMLSelectElement>("#style-target")?.value).toBe("Classic straight trouser");
      expect([...root.querySelectorAll<HTMLInputElement>("#controls-panel input[data-field]")].map((input) => input.dataset.field))
        .toEqual(["waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease"]);
      expect(root.querySelectorAll<HTMLInputElement>("#controls-panel input[data-option]")).toHaveLength(11);
      expect(Object.fromEntries([...root.querySelectorAll<HTMLInputElement>("#controls-panel input[data-field]")].map((input) => [input.dataset.field, input.value])))
        .toEqual({ waist: "84", hip: "100", hipDepth: "20", crotchDepth: "27", thigh: "58", knee: "40", inseam: "78", ease: "7" });
      expect([...root.querySelectorAll<HTMLInputElement>("#controls-panel input[data-field], #controls-panel input[data-option]")].every((input) => !input.disabled)).toBe(true);
      expect(setField(root, "ease", "7").value).toBe("7");
      expect(root.querySelector<HTMLInputElement>('input[data-field="inseam"]')?.value).toBe("78");

      clickId(root, "view-pattern");
      const r01Pattern = root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML;
      expect(r01Pattern).toBeTruthy();
      expect(r01Pattern).not.toBe(genericPattern);

      reachExportStage(root);
      const details = root.querySelector<HTMLDetailsElement>("#advanced-views");
      expect(details).not.toBeNull();
      details!.open = true;
      clickId(root, "view-flat");
      clickId(root, "technical-flat-front");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='FRONT_FLAT']")).not.toBeNull();
      clickId(root, "technical-flat-back");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='BACK_FLAT']")).not.toBeNull();

      clickId(root, "journey-step-fit");
      const invalidEase = setField(root, "ease", "151");
      expect(invalidEase.value).toBe("151");
      expect(invalidEase.getAttribute("aria-invalid")).toBe("true");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
      expect(root.querySelector<HTMLElement>("#guidance-host")?.textContent).toContain("supports -30–30 cm");
      expect(setField(root, "ease", "7").value).toBe("7");
      expect(root.querySelector<HTMLInputElement>('input[data-field="ease"]')?.getAttribute("aria-invalid")).not.toBe("true");

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        measurements: { ease: number; inseam: number };
        workspace: { starterOrigin: { entryId: string; entryRevision: string; recipeRevision: string } };
      };
      expect(saved.measurements).toMatchObject({ ease: 7, inseam: 78 });
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TROUSER_CLASSIC_STRAIGHT_ENTRY_ID,
        entryRevision: "2026-11-16.1",
        recipeRevision: "trouser-classic-straight-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Classic straight trouser");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${TROUSER_CLASSIC_STRAIGHT_ENTRY_ID}"]`)?.getAttribute("aria-pressed")).toBe("true");
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')?.value).toBe("7");
      clickId(reopened, "garment-trouser");
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Trouser");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")?.hidden).toBe(true);
      expect(reopened.querySelector<HTMLInputElement>('input[data-field="ease"]')?.value).toBe("7");
      expect(reopened.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${TROUSER_CLASSIC_STRAIGHT_ENTRY_ID}"]`)?.getAttribute("aria-pressed")).toBe("false");
      expect(STARTER_REGISTRY.entries.find((entry) => entry.entryId === TROUSER_CLASSIC_STRAIGHT_ENTRY_ID)?.configuration.measurements.ease).toBe(7);
    } finally {
      restoreSvgTextMetrics();
      root?.remove();
      reopened?.remove();
    }
  });

  it("exports R01 profile-specific names and digital-only labels through all six existing outputs", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickId(root, "welcome-start");
      clickId(root, `starter-${TROUSER_CLASSIC_STRAIGHT_ENTRY_ID}`);
      reachExportStage(root);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) clickId(root, id);
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "classic-straight-trouser-M-A0.pdf",
        "classic-straight-trouser-M.dxf",
        "classic-straight-trouser-M.pdf",
        "classic-straight-trouser-M.svg",
        "classic-straight-trouser-projector.svg",
        "classic-straight-trouser-techpack.pdf",
      ].sort());
      expect(files.get("classic-straight-trouser-M.svg")).toContain("<svg");
      expect(files.get("classic-straight-trouser-M.dxf")).toContain("SECTION");
      expect(files.get("classic-straight-trouser-M.pdf")).toMatch(/^%PDF/);
      expect(files.get("classic-straight-trouser-M-A0.pdf")).toMatch(/^%PDF/);
      const techPack = files.get("classic-straight-trouser-techpack.pdf")!;
      expect(techPack).toMatch(/^%PDF/);
      const techPackText = visiblePdfText(techPack);
      expect(techPackText).toContain("Classic straight trouser");
      expect(techPackText).toContain("Waist (finished) 1.0 83.0 87.0 91.0 95.0 99.0");
      expect(techPackText).toContain("Seat / hip (finished) 1.3 99.0 103.0 107.0 111.0 115.0");
      expect(techPackText).toContain("The 7 cm ease and 78 cm inseam defaults are editable product software choices");
      expect(techPackText).toContain("not validated grading");
      const projector = files.get("classic-straight-trouser-projector.svg")!;
      expect(projector).toContain("<svg");
      expect(projector).toContain("Digital R01 Classic straight trouser");
      expect(projector).toContain("physical fit and grading are not validated");
    } finally {
      root?.remove();
    }
  });
});

describe("R02 Wide-leg trouser starter app", () => {
  it("preserves generic Trouser output names and status after adding the profile starter", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    try {
      root = mount();
      clickId(root, "welcome-start");
      clickId(root, "garment-trouser");
      reachExportStage(root);
      for (const id of ["export-techpack", "export-projector"]) clickId(root, id);
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(2), { timeout: 20000 });

      expect([...files.keys()].sort()).toEqual(["trouser-projector.svg", "trouser-techpack.pdf"]);
      expect(files.get("trouser-techpack.pdf")).toMatch(/^%PDF/);
      expect(files.get("trouser-projector.svg")).toContain("<svg");
      expect(files.get("trouser-projector.svg")).not.toContain("Digital R02 Wide-leg trouser");
    } finally {
      unmountApp();
      root?.remove();
    }
  });

  it("selects, edits, recovers, saves, reopens and exports the existing Trouser profile", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    const restoreSvgTextMetrics = stubSvgTextMetrics();
    try {
      root = mount();
      clickId(root, "welcome-start");
      clickId(root, "garment-trouser");
      expect(root.querySelector<HTMLElement>("#style-host")?.textContent).toContain("You're making a Relaxed straight trouser");
      expect(root.querySelectorAll<HTMLInputElement>("#controls-panel input[data-option]")).toHaveLength(11);

      clickId(root, "starter-" + TROUSER_CLASSIC_STRAIGHT_ENTRY_ID);
      expect(root.querySelector<HTMLSelectElement>("#style-target")?.value).toBe("Classic straight trouser");
      expect(root.querySelector<HTMLElement>("#style-host")?.textContent).toContain("You're making a Classic straight trouser");

      clickId(root, "starter-" + TROUSER_WIDE_LEG_ENTRY_ID);
      expect(root.querySelector<HTMLButtonElement>('[data-starter-entry-id="' + TROUSER_WIDE_LEG_ENTRY_ID + '"]')?.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Wide-leg trouser");
      expect(root.querySelector<HTMLSelectElement>("#style-target")?.value).toBe("Wide-leg trouser");
      expect(root.querySelector<HTMLElement>("#style-host")?.textContent).toContain("You're making a Wide-leg trouser");
      expect(root.querySelector<HTMLElement>("#style-host")?.textContent).toContain("Wider digital leg at thigh, knee and hem");
      expect([...root.querySelectorAll<HTMLInputElement>("#controls-panel input[data-field]")].map((input) => input.dataset.field))
        .toEqual(["waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam", "ease"]);
      expect(Object.fromEntries([...root.querySelectorAll<HTMLInputElement>("#controls-panel input[data-field]")].map((input) => [input.dataset.field, input.value])))
        .toEqual({ waist: "84", hip: "100", hipDepth: "20", crotchDepth: "27", thigh: "58", knee: "40", inseam: "78", ease: "10" });
      const r02Options = root.querySelectorAll<HTMLInputElement>("#controls-panel input[data-option]");
      expect(r02Options).toHaveLength(11);
      expect([...r02Options].every((input) => !input.disabled)).toBe(true);
      expect(Object.fromEntries([...r02Options].map((input) => [input.dataset.option, input.value]))).toMatchObject({
        thighEase: "12", kneeEase: "12", legOpening: "52",
      });

      root.querySelector<HTMLButtonElement>('[data-style-target="Relaxed straight trouser"]')?.click();
      expect(root.querySelector<HTMLElement>("#style-host")?.textContent).toContain("Thigh ease -0.5 cm");
      expect(root.querySelector<HTMLElement>("#style-host")?.textContent).toContain("Knee ease -0.5 cm");
      expect(root.querySelector<HTMLElement>("#style-host")?.textContent).toContain("Leg opening -0.5 cm");
      root.querySelector<HTMLButtonElement>('[data-style-target="Wide-leg trouser"]')?.click();
      expect(root.querySelector<HTMLElement>("#style-host")?.textContent).toContain("You're making a Wide-leg trouser");

      clickId(root, "view-pattern");
      const defaultPattern = root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML;
      expect(defaultPattern).toBeTruthy();
      expect(setOption(root, "thighEase", "13").value).toBe("13");
      const editedPattern = root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML;
      expect(editedPattern).toBeTruthy();
      expect(editedPattern).not.toBe(defaultPattern);

      reachExportStage(root);
      const invalidOpening = setOption(root, "legOpening", "66");
      expect(invalidOpening.value).toBe("66");
      expect(invalidOpening.getAttribute("aria-invalid")).toBe("true");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
      expect(setOption(root, "legOpening", "52").value).toBe("52");
      expect(root.querySelector<HTMLInputElement>('input[data-option="legOpening"]')?.getAttribute("aria-invalid")).not.toBe("true");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
      clickId(root, "journey-step-fit");
      clickId(root, "journey-next");
      clickId(root, "journey-next");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(false);

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        measurements: { ease: number; inseam: number };
        garmentOptions: { trouser: { thighEase: number; kneeEase: number; legOpening: number } };
        workspace: { starterOrigin: { entryId: string; entryRevision: string; recipeRevision: string } };
      };
      expect(saved.measurements).toMatchObject({ ease: 10, inseam: 78 });
      expect(saved.garmentOptions.trouser).toMatchObject({ thighEase: 13, kneeEase: 12, legOpening: 52 });
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TROUSER_WIDE_LEG_ENTRY_ID,
        entryRevision: "2026-11-16.2",
        recipeRevision: "trouser-wide-leg-v1",
      });

      const advanced = root.querySelector<HTMLDetailsElement>("#advanced-views");
      expect(advanced).not.toBeNull();
      advanced!.open = true;
      clickId(root, "view-flat");
      clickId(root, "technical-flat-front");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='FRONT_FLAT']")).not.toBeNull();
      clickId(root, "technical-flat-back");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='BACK_FLAT']")).not.toBeNull();

      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) clickId(root, id);
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "wide-leg-trouser-M-A0.pdf",
        "wide-leg-trouser-M.dxf",
        "wide-leg-trouser-M.pdf",
        "wide-leg-trouser-M.svg",
        "wide-leg-trouser-projector.svg",
        "wide-leg-trouser-techpack.pdf",
      ].sort());
      expect(files.get("wide-leg-trouser-M.svg")).toContain("<svg");
      expect(files.get("wide-leg-trouser-M.dxf")).toContain("SECTION");
      expect(files.get("wide-leg-trouser-M.pdf")).toMatch(/^%PDF/);
      expect(files.get("wide-leg-trouser-M-A0.pdf")).toMatch(/^%PDF/);
      const r02TechPackText = visiblePdfText(files.get("wide-leg-trouser-techpack.pdf")!);
      expect(r02TechPackText).toContain("Wide-leg trouser");
      expect(r02TechPackText).toContain("Digital R02 Wide-leg trouser profile");
      expect(r02TechPackText).toContain("not sourced standards");
      expect(files.get("wide-leg-trouser-projector.svg")).toContain("Digital R02 Wide-leg trouser");
      expect(files.get("wide-leg-trouser-projector.svg")).toContain("physical fit and grading are not validated");

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Wide-leg trouser");
      expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="' + TROUSER_WIDE_LEG_ENTRY_ID + '"]')?.getAttribute("aria-pressed")).toBe("true");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="thighEase"]')?.value).toBe("13");
      clickId(reopened, "garment-trouser");
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Trouser");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")?.hidden).toBe(true);
      expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="' + TROUSER_WIDE_LEG_ENTRY_ID + '"]')?.getAttribute("aria-pressed")).toBe("false");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="thighEase"]')?.value).toBe("13");
    } finally {
      restoreSvgTextMetrics();
      root?.remove();
      reopened?.remove();
    }
  });
});
