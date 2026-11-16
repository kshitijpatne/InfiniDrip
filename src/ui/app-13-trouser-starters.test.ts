// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Blob as NodeBlob } from "node:buffer";
import { webcrypto } from "node:crypto";
import { mountApp, unmountApp } from "./app";
import { STARTER_REGISTRY, TROUSER_CLASSIC_STRAIGHT_ENTRY_ID } from "./starter-registry";

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
