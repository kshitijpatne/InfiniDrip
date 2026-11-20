// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Blob as NodeBlob, Buffer } from "node:buffer";
import { createHash, webcrypto } from "node:crypto";
import { mountApp, unmountApp } from "./app";
import { STARTER_REGISTRY, TROUSER_BARREL_LEG_ENTRY_ID, TROUSER_BOOTCUT_ENTRY_ID, TROUSER_CARGO_ENTRY_ID, TROUSER_CLASSIC_STRAIGHT_ENTRY_ID, TROUSER_PLEATED_FRONT_ENTRY_ID, TROUSER_ELASTIC_PULLON_ENTRY_ID, TROUSER_TAPERED_ENTRY_ID, TROUSER_WIDE_LEG_ENTRY_ID } from "./starter-registry";
import { TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY, TROUSER_BOOTCUT_PROFILE_ROUTE_KEY, TROUSER_CARGO_PROFILE_ROUTE_KEY, TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY, TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY, TROUSER_TAPERED_PROFILE_ROUTE_KEY } from "../drafting/trouser-contract";

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

function expectOutputHashes(files: Map<string, string>, expected: Record<string, string>): void {
  const actual = Object.fromEntries(Object.entries(expected).map(([filename]) => {
    const content = files.get(filename);
    expect(content, `Expected ${filename} to be exported`).toBeDefined();
    const bytes = Buffer.from(content!, filename.endsWith(".pdf") ? "latin1" : "utf8");
    return [filename, createHash("sha256").update(bytes).digest("hex").toUpperCase()];
  }));
  expect(actual).toEqual(expected);
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
      expectOutputHashes(files, {
        "classic-straight-trouser-M-A0.pdf": "C7516CAB9714E5175177FB994C1BC2F0B9DD8A44F1706D60458592F884C64D73",
        "classic-straight-trouser-M.dxf": "7CDCA871DDF217C7DABD00AE7546E66DEC73C6B3591FFC2726B989EC8F3F77A8",
        "classic-straight-trouser-M.pdf": "EDAD074D9DBD5AB43884DD5ED02F2B5430126AF77A72818DD08E881EB5CFC01C",
        "classic-straight-trouser-M.svg": "5D719B3709D02A0F2A34A5F1CC6789EB7ECDD5264A2C2BAAAB2ECC8FBD24DDC0",
        "classic-straight-trouser-projector.svg": "DD60A1F1A62FA9867C34581826981B35648CC6B4B438DF2A9507224F9766CCBF",
        "classic-straight-trouser-techpack.pdf": "C7313D3C7804545DCC78748F47DEB1ED634EA7EFA31E43A8496D19BEFE89DC30",
      });
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
      for (const id of ["export-pdf", "export-techpack", "export-projector"]) clickId(root, id);
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(3), { timeout: 20000 });

      expect([...files.keys()].sort()).toEqual(["trouser-M.pdf", "trouser-projector.svg", "trouser-techpack.pdf"]);
      expectOutputHashes(files, {
        "trouser-M.pdf": "DCCF16DF74F000D3D5A814636B234FFBFEA3AE458EEFC89941E21EBB2EC2BA30",
      });
      expect(files.get("trouser-techpack.pdf")).toMatch(/^%PDF/);
      expect(files.get("trouser-projector.svg")).toContain("<svg");
      expect(files.get("trouser-projector.svg")).not.toContain("Digital R02 Wide-leg trouser");
    } finally {
      unmountApp();
      root?.remove();
    }
  });

  it("keeps all six accepted R02 default output bytes unchanged", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const files = new Map<string, string>();
    const saveFile = vi.fn(async (filename: string, content: string) => {
      files.set(filename, content);
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    const restoreSvgTextMetrics = stubSvgTextMetrics();
    try {
      root = mount();
      clickId(root, "welcome-start");
      clickId(root, "garment-trouser");
      clickId(root, "starter-" + TROUSER_WIDE_LEG_ENTRY_ID);
      reachExportStage(root);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector"]) clickId(root, id);
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(6), { timeout: 20000 });
      expectOutputHashes(files, {
        "wide-leg-trouser-M-A0.pdf": "0868A2966063C78068DF228982E0D2297723254577553AF4BA85C3A59996BC24",
        "wide-leg-trouser-M.dxf": "9B62F790FEDB82D342DE09E38525F9509EAE03ED768B1943CEAAEE43884CEC81",
        "wide-leg-trouser-M.pdf": "ADE42AF19027853F25B3279371A6E980A364ADF4AA8BA6C777EAB93858A22A97",
        "wide-leg-trouser-M.svg": "5FCA93DB24CAEF05008FC4770E719651969A661C9FEED8867BCE2881FC736DE1",
        "wide-leg-trouser-projector.svg": "64EA2D3DB63A5D58D66FB705AEBABCCC5B876D818B5D1FDF2D92160826FFEAF3",
        "wide-leg-trouser-techpack.pdf": "9DD47810501DC14D39F2635C472337F390ED6C98AF9196C4DF862A359CD114E2",
      });
    } finally {
      restoreSvgTextMetrics();
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

describe("R03 Tapered trouser starter app", () => {
  it("selects, edits, recovers, saves, reopens and exports the identity-routed profile", async () => {
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
      clickId(root, "starter-" + TROUSER_TAPERED_ENTRY_ID);
      expect(root.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Tapered trouser");
      expect(root.querySelector<HTMLSelectElement>("#style-target")?.value).toBe("Tapered trouser");
      expect(root.querySelector<HTMLElement>("#style-host")?.textContent).toContain("You're making a Tapered trouser");
      expect(root.querySelector<HTMLInputElement>('input[data-option="legOpening"]')?.value).toBe("36");
      expect(root.querySelector<HTMLElement>("#controls-panel")?.textContent).toContain("finished leg-opening circumference");
      expect(root.querySelector<HTMLElement>("#controls-panel")?.textContent).not.toContain(TROUSER_TAPERED_PROFILE_ROUTE_KEY);

      clickId(root, "view-pattern");
      expect(root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML).toContain("TROUSER FRONT LEFT");
      reachExportStage(root);
      const invalidOpening = setOption(root, "legOpening", "66");
      expect(invalidOpening.value).toBe("66");
      expect(invalidOpening.getAttribute("aria-invalid")).toBe("true");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
      expect(root.querySelector<HTMLElement>("#journey-blocker")?.textContent).toMatch(/Leg opening|leg opening/u);
      expect(setOption(root, "legOpening", "36").value).toBe("36");
      expect(root.querySelector<HTMLInputElement>('input[data-option="legOpening"]')?.getAttribute("aria-invalid")).not.toBe("true");
      clickId(root, "journey-step-fit");
      clickId(root, "journey-next");
      clickId(root, "journey-next");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(false);

      const advanced = root.querySelector<HTMLDetailsElement>("#advanced-views");
      expect(advanced).not.toBeNull();
      advanced!.open = true;
      clickId(root, "view-flat");
      clickId(root, "technical-flat-front");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='FRONT_FLAT']")).not.toBeNull();
      clickId(root, "technical-flat-back");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='BACK_FLAT']")).not.toBeNull();

      expect(root.querySelector<HTMLButtonElement>("#export-dxf-source-package")?.disabled).toBe(false);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector", "export-dxf-source-package"]) {
        clickId(root, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(7), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "tapered-trouser-M-A0.pdf",
        "tapered-trouser-M-cad-exchange-source.json",
        "tapered-trouser-M.dxf",
        "tapered-trouser-M.pdf",
        "tapered-trouser-M.svg",
        "tapered-trouser-projector.svg",
        "tapered-trouser-techpack.pdf",
      ].sort());
      expect(files.get("tapered-trouser-M.svg")).toContain("<svg");
      expect(files.get("tapered-trouser-M.dxf")).toContain("SECTION");
      expect(files.get("tapered-trouser-M.pdf")).toMatch(/^%PDF/);
      expect(files.get("tapered-trouser-M-A0.pdf")).toMatch(/^%PDF/);
      const techPackText = visiblePdfText(files.get("tapered-trouser-techpack.pdf")!);
      expect(techPackText).toContain("Tapered trouser");
      expect(techPackText).toContain("Digital R03 Tapered trouser profile");
      expect(techPackText).toContain("No instep measurement or sewn sample is available");
      expect(files.get("tapered-trouser-projector.svg")).toContain("Digital R03 Tapered trouser");
      expect(files.get("tapered-trouser-projector.svg")).toContain("Foot clearance, physical fit and grading are not validated");
      const packageJson = JSON.parse(files.get("tapered-trouser-M-cad-exchange-source.json")!) as {
        manifest: { options: Record<string, number> };
      };
      expect(packageJson.manifest.options.legOpening).toBe(36);
      expect(packageJson.manifest.options).not.toHaveProperty(TROUSER_TAPERED_PROFILE_ROUTE_KEY);

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        measurements: { ease: number; inseam: number };
        garmentOptions: { trouser: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; entryRevision: string; recipeRevision: string } };
      };
      expect(saved.measurements).toMatchObject({ ease: 7, inseam: 78 });
      expect(saved.garmentOptions.trouser).toMatchObject({ thighEase: 8, kneeEase: 5, legOpening: 36 });
      expect(saved.garmentOptions.trouser).not.toHaveProperty(TROUSER_TAPERED_PROFILE_ROUTE_KEY);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TROUSER_TAPERED_ENTRY_ID,
        entryRevision: "2026-11-16.3",
        recipeRevision: "trouser-tapered-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Tapered trouser");
      expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="' + TROUSER_TAPERED_ENTRY_ID + '"]')?.getAttribute("aria-pressed")).toBe("true");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="legOpening"]')?.value).toBe("36");
      clickId(reopened, "garment-trouser");
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Trouser");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")?.hidden).toBe(true);
      expect(reopened.querySelector<HTMLButtonElement>('[data-starter-entry-id="' + TROUSER_TAPERED_ENTRY_ID + '"]')?.getAttribute("aria-pressed")).toBe("false");
    } finally {
      restoreSvgTextMetrics();
      root?.remove();
      reopened?.remove();
    }
  }, 60_000);
});

describe("R04 Barrel-leg trouser starter app", () => {
  it("renders the identity-routed curve, preserves editable values and exports digital-only output", async () => {
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
      clickId(root, "starter-" + TROUSER_BARREL_LEG_ENTRY_ID);
      expect(root.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Barrel-leg trouser");
      expect(root.querySelector<HTMLSelectElement>("#style-target")?.value).toBe("Barrel-leg trouser");
      expect(root.querySelector<HTMLElement>("#style-host")?.textContent).toContain("You're making a Barrel-leg trouser");
      expect(root.querySelector<HTMLInputElement>('input[data-option="legOpening"]')?.value).toBe("38");
      expect(root.querySelector<HTMLInputElement>('input[data-option="barrelBowCm"]')?.value).toBe("2");
      expect(root.querySelector<HTMLElement>("#controls-panel")?.textContent).toContain("control offset");
      expect(root.querySelector<HTMLElement>("#controls-panel")?.textContent).not.toContain(TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY);
      expect(root.querySelector<HTMLElement>("#controls-panel")?.querySelector('[data-option="barrelBowCm"]')).not.toBeNull();

      clickId(root, "view-pattern");
      const patternBefore = root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML ?? "";
      expect(patternBefore).toContain("TROUSER FRONT LEFT");
      expect(patternBefore).toContain(" C ");
      expect(setOption(root, "barrelBowCm", "3").value).toBe("3");
      const patternAfter = root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML ?? "";
      expect(patternAfter).not.toBe(patternBefore);

      reachExportStage(root);
      const invalidOpening = setOption(root, "legOpening", "45");
      expect(invalidOpening.value).toBe("45");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
      expect(root.querySelector<HTMLElement>("#guidance-host")?.textContent).toContain("must be smaller than the finished knee");
      expect(setOption(root, "legOpening", "38").value).toBe("38");
      expect(setOption(root, "barrelBowCm", "4.5").getAttribute("aria-invalid")).toBe("true");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
      expect(setOption(root, "barrelBowCm", "3").value).toBe("3");
      clickId(root, "journey-step-fit");
      clickId(root, "journey-next");
      clickId(root, "journey-next");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(false);

      const advanced = root.querySelector<HTMLDetailsElement>("#advanced-views");
      expect(advanced).not.toBeNull();
      advanced!.open = true;
      clickId(root, "view-flat");
      clickId(root, "technical-flat-front");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='FRONT_FLAT']")).not.toBeNull();
      clickId(root, "technical-flat-back");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='BACK_FLAT']")).not.toBeNull();

      expect(root.querySelector<HTMLButtonElement>("#export-dxf-source-package")?.disabled).toBe(false);
      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector", "export-dxf-source-package"]) {
        clickId(root, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(7), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "barrel-leg-trouser-M-A0.pdf",
        "barrel-leg-trouser-M-cad-exchange-source.json",
        "barrel-leg-trouser-M.dxf",
        "barrel-leg-trouser-M.pdf",
        "barrel-leg-trouser-M.svg",
        "barrel-leg-trouser-projector.svg",
        "barrel-leg-trouser-techpack.pdf",
      ].sort());
      const exportedPatternPolygons = files.get("barrel-leg-trouser-M.svg")!.match(/<polygon points="[^"]+"/gu) ?? [];
      expect(exportedPatternPolygons.length).toBeGreaterThan(3);
      expect(exportedPatternPolygons[0]!.split(" ").length).toBeGreaterThan(35);
      expect(files.get("barrel-leg-trouser-M.dxf")).toContain("SECTION");
      expect(files.get("barrel-leg-trouser-M.pdf")).toMatch(/^%PDF/);
      expect(files.get("barrel-leg-trouser-M-A0.pdf")).toMatch(/^%PDF/);
      const techPackText = visiblePdfText(files.get("barrel-leg-trouser-techpack.pdf")!);
      expect(techPackText).toContain("Digital R04 Barrel-leg trouser profile");
      expect(techPackText).toContain("3 cm outer-leg curve control");
      expect(techPackText).toContain("No sewn sample");
      expect(files.get("barrel-leg-trouser-projector.svg")).toContain("Digital R04 Barrel-leg trouser");
      expect(files.get("barrel-leg-trouser-projector.svg")).toContain("Physical fit, material behavior and grading are not validated");
      const packageJson = JSON.parse(files.get("barrel-leg-trouser-M-cad-exchange-source.json")!) as {
        manifest: { options: Record<string, number> };
      };
      expect(packageJson.manifest.options.legOpening).toBe(38);
      expect(packageJson.manifest.options.barrelBowCm).toBe(3);
      expect(packageJson.manifest.options).not.toHaveProperty(TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY);

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; entryRevision: string; recipeRevision: string } };
      };
      expect(saved.garmentOptions.trouser).toMatchObject({ legOpening: 38, barrelBowCm: 3 });
      expect(saved.garmentOptions.trouser).not.toHaveProperty(TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TROUSER_BARREL_LEG_ENTRY_ID,
        entryRevision: "2026-11-16.4",
        recipeRevision: "trouser-barrel-leg-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Barrel-leg trouser");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="barrelBowCm"]')?.value).toBe("3");
      clickId(reopened, "garment-trouser");
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Trouser");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="barrelBowCm"]')).toBeNull();
      expect(reopened.querySelector<HTMLSelectElement>("#style-target")?.value).not.toBe("Barrel-leg trouser");
      clickId(reopened, "save-pattern");
      const genericSaved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
      };
      expect(genericSaved.garmentOptions.trouser).not.toHaveProperty("barrelBowCm");
    } finally {
      restoreSvgTextMetrics();
      root?.remove();
      reopened?.remove();
    }
  }, 60_000);

  it("clears R04 routing when a reopened partial save has no Trouser option map", () => {
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    const restoreSvgTextMetrics = stubSvgTextMetrics();
    try {
      root = mount();
      clickId(root, "welcome-start");
      clickId(root, "garment-trouser");
      clickId(root, `starter-${TROUSER_BARREL_LEG_ENTRY_ID}`);
      expect(root.querySelector<HTMLInputElement>('input[data-option="barrelBowCm"]')?.value).toBe("2");
      clickId(root, "save-pattern");

      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: Record<string, Record<string, number>>;
      };
      delete saved.garmentOptions.trouser;
      localStorage.setItem("patternworks_save_v1", JSON.stringify(saved));

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Barrel-leg trouser");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="barrelBowCm"]')?.value).toBe("2");

      clickId(reopened, "garment-trouser");
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Trouser");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")?.hidden).toBe(true);
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="barrelBowCm"]')).toBeNull();

      clickId(reopened, "save-pattern");
      const genericSaved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: Record<string, Record<string, number>>;
      };
      expect(genericSaved.garmentOptions.trouser).toEqual({});
      expect(genericSaved.garmentOptions.trouser).not.toHaveProperty("barrelBowCm");
      expect(genericSaved.garmentOptions.trouser).not.toHaveProperty(TROUSER_BARREL_LEG_PROFILE_ROUTE_KEY);
    } finally {
      restoreSvgTextMetrics();
      root?.remove();
      reopened?.remove();
    }
  });
});

describe("R05 Bootcut trouser starter app", () => {
  it("routes the selected identity through editing, invalid recovery, outputs, save/reopen and generic Trouser", async () => {
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
      clickId(root, "starter-" + TROUSER_BOOTCUT_ENTRY_ID);
      expect(root.querySelector<HTMLButtonElement>('[data-starter-entry-id="' + TROUSER_BOOTCUT_ENTRY_ID + '"]')?.getAttribute("aria-pressed")).toBe("true");
      expect(root.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Bootcut trouser");
      expect(root.querySelector<HTMLSelectElement>("#style-target")?.value).toBe("Bootcut trouser");
      expect(root.querySelector<HTMLElement>("#style-host")?.textContent).toContain("You're making a Bootcut trouser");
      expect(root.querySelector<HTMLElement>("#starter-origin-status")?.textContent)
        .toContain("Starting design: Bootcut trouser · software defaults");
      expect(Object.fromEntries([...root.querySelectorAll<HTMLInputElement>("#controls-panel input[data-field]")]
        .map((input) => [input.dataset.field, input.value]))).toMatchObject({
        waist: "84", hip: "100", thigh: "58", knee: "40", inseam: "78", ease: "7",
      });
      expect(root.querySelector<HTMLInputElement>('input[data-option="thighEase"]')?.value).toBe("8");
      expect(root.querySelector<HTMLInputElement>('input[data-option="kneeEase"]')?.value).toBe("5");
      expect(root.querySelector<HTMLInputElement>('input[data-option="legOpening"]')?.value).toBe("52");
      expect(root.querySelector<HTMLElement>("#controls-panel")?.textContent).not.toContain(TROUSER_BOOTCUT_PROFILE_ROUTE_KEY);

      clickId(root, "view-pattern");
      const defaultPattern = root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML ?? "";
      expect(defaultPattern).toContain("TROUSER FRONT LEFT");
      expect(defaultPattern).not.toBe("");
      expect(setOption(root, "legOpening", "54").value).toBe("54");
      const editedPattern = root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML ?? "";
      expect(editedPattern).not.toBe(defaultPattern);
      expect(editedPattern).toContain("TROUSER FRONT LEFT");

      reachExportStage(root);
      for (const opening of ["45", "44"]) {
        const invalidOpening = setOption(root, "legOpening", opening);
        expect(invalidOpening.value).toBe(opening);
        expect(root.querySelector<HTMLElement>("#guidance-host")?.textContent)
          .toContain("Bootcut opening (" + opening + " cm) must be wider than the finished knee (45.0 cm)");
        expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
      }
      const recovered = setOption(root, "legOpening", "54");
      expect(recovered.value).toBe("54");
      expect(recovered.getAttribute("aria-invalid")).not.toBe("true");
      clickId(root, "journey-step-fit");
      clickId(root, "journey-next");
      clickId(root, "journey-next");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(false);

      const advanced = root.querySelector<HTMLDetailsElement>("#advanced-views");
      expect(advanced).not.toBeNull();
      advanced!.open = true;
      clickId(root, "view-flat");
      clickId(root, "technical-flat-front");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='FRONT_FLAT']")).not.toBeNull();
      clickId(root, "technical-flat-back");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='BACK_FLAT']")).not.toBeNull();
      expect(root.querySelector<HTMLButtonElement>("#export-dxf-source-package")?.disabled).toBe(false);

      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector", "export-dxf-source-package"]) {
        clickId(root, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(7), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "bootcut-trouser-M-A0.pdf",
        "bootcut-trouser-M-cad-exchange-source.json",
        "bootcut-trouser-M.dxf",
        "bootcut-trouser-M.pdf",
        "bootcut-trouser-M.svg",
        "bootcut-trouser-projector.svg",
        "bootcut-trouser-techpack.pdf",
      ].sort());
      expect(files.get("bootcut-trouser-M.svg")).toContain("<svg");
      expect(files.get("bootcut-trouser-M.dxf")).toContain("SECTION");
      expect(files.get("bootcut-trouser-M.pdf")).toMatch(/^%PDF/);
      expect(files.get("bootcut-trouser-M-A0.pdf")).toMatch(/^%PDF/);
      const techPackText = visiblePdfText(files.get("bootcut-trouser-techpack.pdf")!);
      expect(techPackText).toContain("Digital R05 Bootcut trouser profile");
      expect(techPackText).toContain("54 cm opening and knee-starting flare");
      expect(techPackText).toContain("not footwear measurements or fit targets");
      expect(techPackText).toContain("No sewn sample");
      expect(files.get("bootcut-trouser-projector.svg")).toContain("Digital R05 Bootcut trouser");
      expect(files.get("bootcut-trouser-projector.svg")).toContain("not footwear measurements or fit claims");
      const packageJson = JSON.parse(files.get("bootcut-trouser-M-cad-exchange-source.json")!) as {
        manifest: { options: Record<string, number>; recipe: { id: string; label: string } };
      };
      expect(packageJson.manifest.options.legOpening).toBe(54);
      expect(packageJson.manifest.options).not.toHaveProperty(TROUSER_BOOTCUT_PROFILE_ROUTE_KEY);
      expect(packageJson.manifest.recipe).toEqual({ id: "trouser", label: "Bootcut trouser" });

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; entryRevision: string; recipeRevision: string } };
      };
      expect(saved.garmentOptions.trouser).toMatchObject({ thighEase: 8, kneeEase: 5, legOpening: 54 });
      expect(saved.garmentOptions.trouser).not.toHaveProperty(TROUSER_BOOTCUT_PROFILE_ROUTE_KEY);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TROUSER_BOOTCUT_ENTRY_ID,
        entryRevision: "2026-11-17.1",
        recipeRevision: "trouser-bootcut-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Bootcut trouser");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="legOpening"]')?.value).toBe("54");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="thighEase"]')?.value).toBe("8");
      clickId(reopened, "garment-trouser");
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Trouser");
      expect(reopened.querySelector<HTMLElement>("#starter-origin-status")?.hidden).toBe(true);
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="legOpening"]')?.value).toBe("54");
      expect(reopened.querySelector<HTMLSelectElement>("#style-target")?.value).not.toBe("Bootcut trouser");
      clickId(reopened, "save-pattern");
      const genericSaved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
      };
      expect(genericSaved.garmentOptions.trouser).toMatchObject({ legOpening: 54, thighEase: 8, kneeEase: 5 });
      expect(genericSaved.garmentOptions.trouser).not.toHaveProperty(TROUSER_BOOTCUT_PROFILE_ROUTE_KEY);
    } finally {
      restoreSvgTextMetrics();
      root?.remove();
      reopened?.remove();
    }
  }, 60_000);
});

describe("R06 Pleated-front trouser starter app", () => {
  it("keeps the post-fold waist, correction guidance, outputs, save/reopen and generic switch on the R06 identity", async () => {
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
      clickId(root, "starter-" + TROUSER_PLEATED_FRONT_ENTRY_ID);
      expect(root.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Pleated-front trouser");
      expect(root.querySelector<HTMLSelectElement>("#style-target")?.value).toBe("Pleated-front trouser");
      expect(root.querySelector<HTMLInputElement>('input[data-option="frontPleatIntakeCm"]')?.value).toBe("4");
      expect(root.querySelector<HTMLInputElement>('input[data-option="frontPleatOffsetCm"]')?.value).toBe("6");
      expect(root.querySelector<HTMLInputElement>('input[data-option="frontPleatStitchDepthCm"]')?.value).toBe("8");
      expect(root.querySelector<HTMLElement>("#controls-panel")?.textContent).not.toContain(TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY);

      clickId(root, "view-pattern");
      const pattern = root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML ?? "";
      expect(pattern).toContain('data-pattern-mark-name="frontWaistAfterPleat"');
      expect(pattern).toContain('data-pattern-mark-name="frontPleatFold"');
      expect(pattern).toContain('data-pattern-mark-name="frontPleatRoll"');

      reachExportStage(root);
      setOption(root, "frontPleatIntakeCm", "8");
      setOption(root, "frontPleatOffsetCm", "12");
      setOption(root, "frontPleatStitchDepthCm", "16");
      expect(root.querySelector<HTMLElement>("#guidance-host")?.textContent).toContain("crosses the pocket opening");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
      setOption(root, "frontPleatIntakeCm", "4");
      setOption(root, "frontPleatOffsetCm", "6");
      setOption(root, "frontPleatStitchDepthCm", "8");
      clickId(root, "journey-step-fit");
      clickId(root, "journey-next");
      clickId(root, "journey-next");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(false);

      const advanced = root.querySelector<HTMLDetailsElement>("#advanced-views");
      expect(advanced).not.toBeNull();
      advanced!.open = true;
      clickId(root, "view-flat");
      clickId(root, "technical-flat-front");
      const frontFlat = root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='FRONT_FLAT']");
      expect(frontFlat, [...root.querySelectorAll<HTMLElement>("#analysis-host, #garment-host")]
        .map((host) => host.textContent).join(" ").slice(0, 1000)).not.toBeNull();
      clickId(root, "technical-flat-back");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='BACK_FLAT']")).not.toBeNull();
      expect(root.querySelector<HTMLButtonElement>("#export-dxf-source-package")?.disabled).toBe(false);

      for (const id of ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack", "export-projector", "export-dxf-source-package"]) {
        clickId(root, id);
      }
      await vi.waitFor(() => expect(saveFile).toHaveBeenCalledTimes(7), { timeout: 20000 });
      expect([...files.keys()].sort()).toEqual([
        "pleated-front-trouser-M-A0.pdf",
        "pleated-front-trouser-M-cad-exchange-source.json",
        "pleated-front-trouser-M.dxf",
        "pleated-front-trouser-M.pdf",
        "pleated-front-trouser-M.svg",
        "pleated-front-trouser-projector.svg",
        "pleated-front-trouser-techpack.pdf",
      ].sort());
      expect(files.get("pleated-front-trouser-M.svg")).toContain("frontWaistAfterPleat");
      expect(files.get("pleated-front-trouser-M.dxf")).toContain("SECTION");
      expect(files.get("pleated-front-trouser-M.pdf")).toMatch(/^%PDF/);
      expect(files.get("pleated-front-trouser-M.pdf")).toContain("(fold toward pocket) Tj ET");
      expect(files.get("pleated-front-trouser-M.pdf")).toContain("(pleat roll) Tj ET");
      expect(files.get("pleated-front-trouser-M.pdf")).toContain("(place on fold) Tj ET");
      expect(files.get("pleated-front-trouser-M.pdf")).toContain("0 1 -1 0");
      expect(files.get("pleated-front-trouser-M-A0.pdf")).toMatch(/^%PDF/);
      expect(visiblePdfText(files.get("pleated-front-trouser-techpack.pdf")!)).toContain("Digital R06 pleated-front trouser profile");
      expect(visiblePdfText(files.get("pleated-front-trouser-techpack.pdf")!)).toContain("4 cm digital cut intake at 6 cm from centre front");
      expect(visiblePdfText(files.get("pleated-front-trouser-techpack.pdf")!)).toContain("physical fit");
      expect(files.get("pleated-front-trouser-projector.svg")).toContain("Digital R06 pleated-front trouser");
      const packageJson = JSON.parse(files.get("pleated-front-trouser-M-cad-exchange-source.json")!) as {
        manifest: { options: Record<string, number>; recipe: { id: string; label: string } };
      };
      expect(packageJson.manifest.options).toMatchObject({ frontPleatIntakeCm: 4, frontPleatOffsetCm: 6, frontPleatStitchDepthCm: 8 });
      expect(packageJson.manifest.options).not.toHaveProperty(TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY);
      expect(packageJson.manifest.recipe).toEqual({ id: "trouser", label: "Pleated-front trouser" });

      clickId(root, "save-pattern");
      const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; entryRevision: string; recipeRevision: string } };
      };
      expect(saved.garmentOptions.trouser).toMatchObject({ frontPleatIntakeCm: 4, frontPleatOffsetCm: 6, frontPleatStitchDepthCm: 8 });
      expect(saved.garmentOptions.trouser).not.toHaveProperty(TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY);
      expect(saved.workspace.starterOrigin).toMatchObject({
        entryId: TROUSER_PLEATED_FRONT_ENTRY_ID,
        entryRevision: "2026-11-17.2",
        recipeRevision: "trouser-pleated-front-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Pleated-front trouser");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="frontPleatIntakeCm"]')?.value).toBe("4");
      clickId(reopened, "garment-trouser");
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Trouser");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="frontPleatIntakeCm"]')).toBeNull();
      clickId(reopened, "save-pattern");
      const genericSaved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
      };
      expect(genericSaved.garmentOptions.trouser).not.toHaveProperty("frontPleatIntakeCm");
      expect(genericSaved.garmentOptions.trouser).not.toHaveProperty(TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY);
    } finally {
      restoreSvgTextMetrics();
      root?.remove();
      reopened?.remove();
    }
  }, 60_000);
});

describe("R07 Elastic-waist pull-on trouser starter app", () => {
  it("keeps identity, controls, digital guidance, flats and all eight outputs on the R07 route", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const downloads: { filename: string; content: string }[] = [];
    const saveFile = vi.fn(async (filename: string, content: string) => {
      downloads.push({ filename, content });
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    const restoreSvgTextMetrics = stubSvgTextMetrics();
    const exportIds = ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack",
      "export-projector", "export-cad-dxf", "export-dxf-source-package"];
    const exportAll = async (target: HTMLElement) => {
      const start = downloads.length;
      for (const id of exportIds) clickId(target, id);
      await vi.waitFor(() => expect(downloads).toHaveLength(start + exportIds.length), { timeout: 30_000 });
      return downloads.slice(start);
    };
    const byName = (batch: readonly { filename: string; content: string }[], filename: string) => {
      const output = batch.find((item) => item.filename === filename);
      expect(output, `Expected ${filename}`).toBeDefined();
      return output!.content;
    };
    try {
      root = mount();
      clickId(root, "welcome-start");
      clickId(root, "garment-trouser");
      clickId(root, `starter-${TROUSER_ELASTIC_PULLON_ENTRY_ID}`);
      expect(root.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Elastic-waist pull-on trouser");
      expect(root.querySelector<HTMLSelectElement>("#style-target")?.value).toBe("Classic straight trouser");
      expect(root.querySelector<HTMLInputElement>('input[data-option="waistGatherRatio"]')?.value).toBe("1.25");
      expect(root.querySelector<HTMLInputElement>('input[data-option="casingDepthCm"]')?.value).toBe("4");
      expect(root.querySelector<HTMLInputElement>('input[data-option="waistbandDepth"]')).toBeNull();
      expect(root.querySelector<HTMLInputElement>('input[data-option="flyLength"]')).toBeNull();
      expect(root.querySelector<HTMLElement>("#controls-panel")?.textContent).not.toContain(TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY);

      clickId(root, "view-pattern");
      const pattern = root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML ?? "";
      expect(pattern).toContain('data-pattern-mark-name="casingFold"');
      expect(pattern).toContain('data-pattern-mark-name="casingStitchGuide"');
      expect(pattern).not.toContain("waistband");
      expect(pattern).not.toContain("fly shield");

      const advanced = root.querySelector<HTMLDetailsElement>("#advanced-views");
      expect(advanced).not.toBeNull();
      advanced!.open = true;
      clickId(root, "view-flat");
      clickId(root, "technical-flat-front");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='FRONT_FLAT']"),
        [...root.querySelectorAll<HTMLElement>("#analysis-host, #garment-host")].map((host) => host.textContent).join(" ").slice(0, 1400))
        .not.toBeNull();
      clickId(root, "technical-flat-back");
      expect(root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='BACK_FLAT']"))
        .not.toBeNull();

      reachExportStage(root);
      for (const id of exportIds) expect(root.querySelector<HTMLButtonElement>(`#${id}`)?.disabled).toBe(false);
      const defaultBatch = await exportAll(root);
      const expectedNames = [
        "elastic-pullon-trouser-M.svg", "elastic-pullon-trouser-M.dxf", "elastic-pullon-trouser-M.pdf",
        "elastic-pullon-trouser-M-A0.pdf", "elastic-pullon-trouser-techpack.pdf",
        "elastic-pullon-trouser-projector.svg", "elastic-pullon-trouser-M-cad-exchange.dxf",
        "elastic-pullon-trouser-M-cad-exchange-source.json",
      ];
      expect(defaultBatch.map((item) => item.filename).sort()).toEqual(expectedNames.sort());
      expect(byName(defaultBatch, "elastic-pullon-trouser-M.svg")).toContain("casingFold");
      expect(byName(defaultBatch, "elastic-pullon-trouser-M.dxf")).toContain("SECTION");
      expect(byName(defaultBatch, "elastic-pullon-trouser-M-cad-exchange.dxf")).toContain("SECTION");
      expect(byName(defaultBatch, "elastic-pullon-trouser-M.pdf")).toMatch(/^%PDF/);
      expect(byName(defaultBatch, "elastic-pullon-trouser-M-A0.pdf")).toMatch(/^%PDF/);
      expect(visiblePdfText(byName(defaultBatch, "elastic-pullon-trouser-techpack.pdf")))
        .toContain("Elastic width, length, material, channel compatibility and quantity remain unspecified");
      expect(byName(defaultBatch, "elastic-pullon-trouser-projector.svg"))
        .toContain("Digital R07 elastic-waist pull-on Trouser");
      const defaultPackage = JSON.parse(byName(defaultBatch, "elastic-pullon-trouser-M-cad-exchange-source.json")) as {
        manifest: { options: Record<string, number>; recipe: { id: string; label: string }; pieces: readonly { role: string }[] };
      };
      expect(defaultPackage.manifest.options).toMatchObject({ waistGatherRatio: 1.25, casingDepthCm: 4 });
      expect(defaultPackage.manifest.options).not.toHaveProperty(TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY);
      expect(defaultPackage.manifest.options).not.toHaveProperty("waistbandDepth");
      expect(defaultPackage.manifest.options).not.toHaveProperty("flyLength");
      expect(defaultPackage.manifest.recipe).toEqual({ id: "trouser", label: "Elastic-waist pull-on trouser" });
      expect(defaultPackage.manifest.pieces.map((piece) => piece.role).sort()).toEqual([
        "backLeft", "backRight", "frontLeft", "frontRight", "pocketBagLeft", "pocketBagRight",
      ]);

      setOption(root, "waistGatherRatio", "1");
      setOption(root, "casingDepthCm", "2");
      expect(root.querySelector<HTMLElement>("#guidance-host")?.textContent).toContain("below the hip + existing ease reference");
      expect(root.querySelector<HTMLInputElement>('input[data-option="waistGatherRatio"]')?.value).toBe("1");
      setOption(root, "waistGatherRatio", "1.8");
      setOption(root, "casingDepthCm", "8");
      expect(root.querySelector<HTMLInputElement>('input[data-option="waistGatherRatio"]')?.value).toBe("1.8");
      expect(root.querySelector<HTMLInputElement>('input[data-option="casingDepthCm"]')?.value).toBe("8");
      setOption(root, "waistGatherRatio", "1.23");
      setOption(root, "casingDepthCm", "4.25");
      expect(root.querySelector<HTMLElement>("#guidance-host")?.textContent).toContain("0.05");
      expect(root.querySelector<HTMLElement>("#guidance-host")?.textContent).toContain("0.5");
      clickId(root, "save-pattern");
      const invalidSaved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; recipeRevision: string } };
      };
      expect(invalidSaved.garmentOptions.trouser).toMatchObject({ waistGatherRatio: 1.23, casingDepthCm: 4.25 });
      expect(invalidSaved.garmentOptions.trouser).not.toHaveProperty(TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY);
      expect(invalidSaved.workspace.starterOrigin).toMatchObject({
        entryId: TROUSER_ELASTIC_PULLON_ENTRY_ID, recipeRevision: "trouser-elastic-pullon-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Elastic-waist pull-on trouser");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="waistGatherRatio"]')?.value).toBe("1.23");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="casingDepthCm"]')?.value).toBe("4.25");
      expect(reopened.querySelector<HTMLElement>("#guidance-host")?.textContent).toContain("0.05");

      setOption(reopened, "waistGatherRatio", "1.4");
      setOption(reopened, "casingDepthCm", "5.5");
      clickId(reopened, "save-pattern");
      reachExportStage(reopened);
      for (const id of exportIds) expect(reopened.querySelector<HTMLButtonElement>(`#${id}`)?.disabled).toBe(false);
      const editedBatch = await exportAll(reopened);
      for (const filename of expectedNames) {
        expect(byName(editedBatch, filename)).not.toBe(byName(defaultBatch, filename));
      }
      const editedPackage = JSON.parse(byName(editedBatch, "elastic-pullon-trouser-M-cad-exchange-source.json")) as {
        manifest: { options: Record<string, number> };
      };
      expect(editedPackage.manifest.options).toMatchObject({ waistGatherRatio: 1.4, casingDepthCm: 5.5 });

      clickId(reopened, `starter-${TROUSER_ELASTIC_PULLON_ENTRY_ID}`);
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="waistGatherRatio"]')).not.toBeNull();

      clickId(reopened, "garment-trouser");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="waistGatherRatio"]')).toBeNull();
      clickId(reopened, "save-pattern");
      const genericSaved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
      };
      expect(genericSaved.garmentOptions.trouser).not.toHaveProperty("waistGatherRatio");
      expect(genericSaved.garmentOptions.trouser).not.toHaveProperty("casingDepthCm");
      expect(genericSaved.garmentOptions.trouser).not.toHaveProperty(TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY);

      for (const entryId of [TROUSER_CLASSIC_STRAIGHT_ENTRY_ID, TROUSER_WIDE_LEG_ENTRY_ID, TROUSER_TAPERED_ENTRY_ID,
        TROUSER_BARREL_LEG_ENTRY_ID, TROUSER_BOOTCUT_ENTRY_ID, TROUSER_PLEATED_FRONT_ENTRY_ID]) {
        clickId(reopened, `starter-${TROUSER_ELASTIC_PULLON_ENTRY_ID}`);
        expect(reopened.querySelector<HTMLInputElement>('input[data-option="waistGatherRatio"]')).not.toBeNull();
        clickId(reopened, `starter-${entryId}`);
        expect(reopened.querySelector<HTMLInputElement>('input[data-option="waistGatherRatio"]')).toBeNull();
        expect(reopened.querySelector<HTMLInputElement>('input[data-option="casingDepthCm"]')).toBeNull();
        clickId(reopened, "save-pattern");
        const switched = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
          garmentOptions: { trouser: Record<string, number> };
          workspace: { starterOrigin: { entryId: string } };
        };
        expect(switched.workspace.starterOrigin.entryId).toBe(entryId);
        expect(switched.garmentOptions.trouser).not.toHaveProperty("waistGatherRatio");
        expect(switched.garmentOptions.trouser).not.toHaveProperty("casingDepthCm");
        expect(switched.garmentOptions.trouser).not.toHaveProperty(TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY);
      }
    } finally {
      restoreSvgTextMetrics();
      root?.remove();
      reopened?.remove();
    }
  }, 90_000);
});

describe("R08 Cargo trouser starter app", () => {
  it("keeps the cargo identity, invalid-value gate, save/reopen, flats and all eight outputs on its route", async () => {
    vi.stubGlobal("crypto", webcrypto as unknown as Crypto);
    vi.stubGlobal("Blob", NodeBlob);
    const downloads: { filename: string; content: string }[] = [];
    const saveFile = vi.fn(async (filename: string, content: string) => {
      downloads.push({ filename, content });
      return { saved: true, filePath: filename };
    });
    window.electronAPI = { saveFile };
    let root: HTMLDivElement | null = null;
    let reopened: HTMLDivElement | null = null;
    const restoreSvgTextMetrics = stubSvgTextMetrics();
    const exportIds = ["export-svg", "export-dxf", "export-pdf", "export-a0", "export-techpack",
      "export-projector", "export-cad-dxf", "export-dxf-source-package"];
    const exportAll = async (target: HTMLElement) => {
      const start = downloads.length;
      for (const id of exportIds) clickId(target, id);
      await vi.waitFor(() => expect(downloads).toHaveLength(start + exportIds.length), { timeout: 30_000 });
      return downloads.slice(start);
    };
    const byName = (batch: readonly { filename: string; content: string }[], filename: string) => {
      const output = batch.find((item) => item.filename === filename);
      expect(output, `Expected ${filename}`).toBeDefined();
      return output!.content;
    };
    try {
      root = mount();
      clickId(root, "welcome-start");
      clickId(root, "garment-trouser");
      clickId(root, `starter-${TROUSER_CARGO_ENTRY_ID}`);
      expect(root.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Cargo trouser");
      expect(root.querySelector<HTMLSelectElement>("#style-target")?.value).toBe("Classic straight trouser");
      expect(root.querySelector<HTMLButtonElement>(`[data-starter-entry-id="${TROUSER_CARGO_ENTRY_ID}"]`)
        ?.getAttribute("aria-pressed")).toBe("true");
      expect(Object.fromEntries(["cargoPocketWidthCm", "cargoPocketHeightCm", "cargoPleatIntakeCm",
        "cargoFlapDepthCm", "cargoPocketVerticalOffsetCm"].map((id) => [
        id, root!.querySelector<HTMLInputElement>(`input[data-option="${id}"]`)?.value,
      ]))).toEqual({ cargoPocketWidthCm: "18", cargoPocketHeightCm: "20", cargoPleatIntakeCm: "4",
        cargoFlapDepthCm: "5", cargoPocketVerticalOffsetCm: "0" });
      expect(root.querySelector<HTMLElement>("#controls-panel")?.textContent).not.toContain(TROUSER_CARGO_PROFILE_ROUTE_KEY);

      clickId(root, "view-pattern");
      const pattern = root.querySelector<SVGSVGElement>("#inspection-content svg")?.outerHTML ?? "";
      expect(pattern).toContain('data-pattern-mark-name="cargoBodyPlacementTop"');
      expect(pattern).toContain('data-pattern-mark-name="cargoPleatCenter"');
      expect(pattern).toContain('data-pattern-mark-name="cargoHookLoopPlacement"');
      const advanced = root.querySelector<HTMLDetailsElement>("#advanced-views");
      expect(advanced).not.toBeNull();
      advanced!.open = true;
      clickId(root, "view-flat");
      clickId(root, "technical-flat-front");
      const frontFlat = root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='FRONT_FLAT']");
      expect(frontFlat).not.toBeNull();
      expect(frontFlat!.outerHTML).not.toContain("cargoPocketBodyLeft");
      expect(frontFlat!.outerHTML).toContain("cargoBodyPlacementTop");
      expect(frontFlat!.outerHTML).toContain("cargoFlapPlacementTop");
      clickId(root, "technical-flat-back");
      const backFlat = root.querySelector<SVGSVGElement>("#canvas-inspection svg.inspection-svg[data-view-kind='BACK_FLAT']");
      expect(backFlat).not.toBeNull();
      expect(backFlat!.outerHTML).not.toContain("cargoPocketBodyLeft");
      expect(backFlat!.outerHTML).toContain("cargoBodyPlacementTop");
      expect(backFlat!.outerHTML).toContain("cargoFlapPlacementTop");

      reachExportStage(root);
      const expectedNames = [
        "cargo-trouser-M.svg", "cargo-trouser-M.dxf", "cargo-trouser-M.pdf", "cargo-trouser-M-A0.pdf",
        "cargo-trouser-techpack.pdf", "cargo-trouser-projector.svg", "cargo-trouser-M-cad-exchange.dxf",
        "cargo-trouser-M-cad-exchange-source.json",
      ];
      for (const id of exportIds) expect(root.querySelector<HTMLButtonElement>(`#${id}`)?.disabled).toBe(false);
      const defaultBatch = await exportAll(root);
      expect(defaultBatch.map((item) => item.filename).sort()).toEqual(expectedNames.sort());
      expect(byName(defaultBatch, "cargo-trouser-M.svg")).toContain("cargoPleatCenter");
      expect(byName(defaultBatch, "cargo-trouser-M.dxf")).toContain("SECTION");
      expect(byName(defaultBatch, "cargo-trouser-M-cad-exchange.dxf")).toContain("SECTION");
      expect(byName(defaultBatch, "cargo-trouser-M.pdf")).toMatch(/^%PDF/);
      expect(byName(defaultBatch, "cargo-trouser-M-A0.pdf")).toMatch(/^%PDF/);
      const techPackText = visiblePdfText(byName(defaultBatch, "cargo-trouser-techpack.pdf"));
      expect(techPackText).toContain("Cargo trouser");
      expect(techPackText).toContain("Cargo pocket body width (digital finished)");
      expect(techPackText).toContain("Digital R08 cargo-pocket construction guide");
      expect(techPackText).toContain("pocket capacity");
      expect(byName(defaultBatch, "cargo-trouser-projector.svg"))
        .toContain("Digital R08 cargo Trouser; pocket dimensions");
      const defaultPackage = JSON.parse(byName(defaultBatch, "cargo-trouser-M-cad-exchange-source.json")) as {
        manifest: { options: Record<string, number>; recipe: { id: string; label: string }; pieces: readonly { role: string }[] };
      };
      expect(defaultPackage.manifest.options).toMatchObject({ cargoPocketWidthCm: 18, cargoPocketHeightCm: 20,
        cargoPleatIntakeCm: 4, cargoFlapDepthCm: 5, cargoPocketVerticalOffsetCm: 0 });
      expect(defaultPackage.manifest.options).not.toHaveProperty(TROUSER_CARGO_PROFILE_ROUTE_KEY);
      expect(defaultPackage.manifest.recipe).toEqual({ id: "trouser", label: "Cargo trouser" });
      expect(defaultPackage.manifest.pieces.map((piece) => piece.role)).toEqual(expect.arrayContaining([
        "cargoPocketBodyLeft", "cargoPocketBodyRight", "cargoPocketFlapLeft", "cargoPocketFlapRight",
      ]));

      setOption(root, "cargoPocketWidthCm", "100");
      expect(root.querySelector<HTMLInputElement>('input[data-option="cargoPocketWidthCm"]')?.value).toBe("100");
      expect(root.querySelector<HTMLInputElement>('input[data-option="cargoPocketWidthCm"]')?.getAttribute("aria-invalid")).toBe("true");
      expect(root.querySelector<HTMLElement>("#guidance-host")?.textContent).toContain("supports 12–24 cm");
      expect(root.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);
      clickId(root, "save-pattern");
      const invalidSaved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
        workspace: { starterOrigin: { entryId: string; recipeRevision: string } };
      };
      expect(invalidSaved.garmentOptions.trouser.cargoPocketWidthCm).toBe(100);
      expect(invalidSaved.garmentOptions.trouser).not.toHaveProperty(TROUSER_CARGO_PROFILE_ROUTE_KEY);
      expect(invalidSaved.workspace.starterOrigin).toMatchObject({
        entryId: TROUSER_CARGO_ENTRY_ID, recipeRevision: "trouser-cargo-digital-v1",
      });

      unmountApp();
      root.remove();
      root = null;
      reopened = mount();
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Cargo trouser");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="cargoPocketWidthCm"]')?.value).toBe("100");
      expect(reopened.querySelector<HTMLElement>("#guidance-host")?.textContent).toContain("supports 12–24 cm");
      expect(reopened.querySelector<HTMLButtonElement>("#export-svg")?.disabled).toBe(true);

      setOption(reopened, "cargoPocketWidthCm", "19");
      clickId(reopened, "save-pattern");
      reachExportStage(reopened);
      for (const id of exportIds) expect(reopened.querySelector<HTMLButtonElement>(`#${id}`)?.disabled).toBe(false);
      const editedBatch = await exportAll(reopened);
      for (const filename of expectedNames) expect(byName(editedBatch, filename)).not.toBe(byName(defaultBatch, filename));
      const editedPackage = JSON.parse(byName(editedBatch, "cargo-trouser-M-cad-exchange-source.json")) as {
        manifest: { options: Record<string, number> };
      };
      expect(editedPackage.manifest.options.cargoPocketWidthCm).toBe(19);

      const cargoBeforeGeneric = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
      };
      const sharedTrouserOptions = Object.fromEntries(["thighEase", "kneeEase", "legOpening"].map((key) => [
        key, cargoBeforeGeneric.garmentOptions.trouser[key],
      ]));
      const cargoOnlyOptions = ["cargoPocketWidthCm", "cargoPocketHeightCm", "cargoPleatIntakeCm",
        "cargoFlapDepthCm", "cargoPocketVerticalOffsetCm", TROUSER_CARGO_PROFILE_ROUTE_KEY];
      clickId(reopened, "garment-trouser");
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Trouser");
      for (const key of cargoOnlyOptions) {
        expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${key}"]`)).toBeNull();
      }
      clickId(reopened, "save-pattern");
      const genericAfterCargo = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
        workspace: { starterOrigin: { entryId: string } | null };
      };
      for (const key of cargoOnlyOptions) expect(genericAfterCargo.garmentOptions.trouser).not.toHaveProperty(key);
      expect(genericAfterCargo.garmentOptions.trouser).toMatchObject(sharedTrouserOptions);
      expect(genericAfterCargo.workspace.starterOrigin).toBeNull();

      clickId(reopened, `starter-${TROUSER_CARGO_ENTRY_ID}`);
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="cargoPocketWidthCm"]')).not.toBeNull();
      clickId(reopened, `starter-${TROUSER_CARGO_ENTRY_ID}`);
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="cargoPocketWidthCm"]')).not.toBeNull();

      clickId(reopened, `starter-${TROUSER_BOOTCUT_ENTRY_ID}`);
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Bootcut trouser");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="cargoPocketWidthCm"]')).toBeNull();
      clickId(reopened, "save-pattern");
      const bootcutSaved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
        workspace: { starterOrigin: { entryId: string } };
      };
      expect(bootcutSaved.garmentOptions.trouser).not.toHaveProperty("cargoPocketWidthCm");
      expect(bootcutSaved.garmentOptions.trouser).not.toHaveProperty(TROUSER_CARGO_PROFILE_ROUTE_KEY);
      expect(bootcutSaved.workspace.starterOrigin.entryId).toBe(TROUSER_BOOTCUT_ENTRY_ID);
      reachExportStage(reopened);
      const bootcutDownloadStart = downloads.length;
      clickId(reopened, "export-projector");
      await vi.waitFor(() => expect(downloads).toHaveLength(bootcutDownloadStart + 1), { timeout: 20_000 });
      expect(downloads[bootcutDownloadStart]?.filename).toBe("bootcut-trouser-projector.svg");
      expect(downloads[bootcutDownloadStart]?.content).toContain("Digital R05 Bootcut trouser");

      clickId(reopened, "garment-trouser");
      expect(reopened.querySelector<HTMLElement>("#current-garment")?.textContent).toBe("Trouser");
      expect(reopened.querySelector<HTMLInputElement>('input[data-option="cargoPocketWidthCm"]')).toBeNull();
      clickId(reopened, "save-pattern");
      const genericSaved = JSON.parse(localStorage.getItem("patternworks_save_v1")!) as {
        garmentOptions: { trouser: Record<string, number> };
      };
      expect(genericSaved.garmentOptions.trouser).not.toHaveProperty("cargoPocketWidthCm");
      expect(genericSaved.garmentOptions.trouser).not.toHaveProperty(TROUSER_CARGO_PROFILE_ROUTE_KEY);
    } finally {
      restoreSvgTextMetrics();
      root?.remove();
      reopened?.remove();
    }
  }, 90_000);
});
