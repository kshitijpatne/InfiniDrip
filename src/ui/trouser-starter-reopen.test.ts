// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountApp, unmountApp } from "./app";
import { TROUSER_BOOTCUT_ENTRY_ID, TROUSER_CARGO_ENTRY_ID, TROUSER_ELASTIC_PULLON_ENTRY_ID } from "./starter-registry";
import { TROUSER_CARGO_PROFILE_ROUTE_KEY, TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY } from "../drafting/trouser-contract";

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

describe("switching Trouser starters after reopening a saved pattern", () => {
  for (const [entryId, label, option, route] of [
    [TROUSER_ELASTIC_PULLON_ENTRY_ID, "Elastic-waist pull-on trouser", "waistGatherRatio", TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY],
    [TROUSER_CARGO_ENTRY_ID, "Cargo trouser", "cargoPocketWidthCm", TROUSER_CARGO_PROFILE_ROUTE_KEY],
  ] as const) {
    it.each(["complete save", "partial save"])("switches from %s for " + label, (kind) => {
      const restoreSvgTextMetrics = stubSvgTextMetrics();
      try {
        const root = mount();
        clickId(root, "welcome-start");
        clickId(root, "garment-trouser");
        clickId(root, `starter-${entryId}`);
        clickId(root, "save-pattern");

        const saved = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
        expect(saved.workspace.starterOrigin.entryId).toBe(entryId);
        const savedValue = saved.garmentOptions.trouser[option];
        expect(typeof savedValue).toBe("number");
        if (kind === "partial save") {
          delete saved.garmentOptions.trouser;
          localStorage.setItem("patternworks_save_v1", JSON.stringify(saved));
        }

        unmountApp();
        const reopened = mount();
        expect(reopened.querySelector("#current-garment")?.textContent).toBe(label);
        expect(reopened.querySelector<HTMLInputElement>(`input[data-option="${option}"]`)?.value).toBe(String(savedValue));

        clickId(reopened, `starter-${TROUSER_BOOTCUT_ENTRY_ID}`);
        expect(reopened.querySelector("#current-garment")?.textContent).toBe("Bootcut trouser");
        expect(reopened.querySelector(`input[data-option="${option}"]`)).toBeNull();
        clickId(reopened, "save-pattern");
        const switched = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
        expect(switched.workspace.starterOrigin.entryId).toBe(TROUSER_BOOTCUT_ENTRY_ID);
        expect(switched.garmentOptions.trouser).not.toHaveProperty(option);
        expect(switched.garmentOptions.trouser).not.toHaveProperty(route);
      } finally {
        restoreSvgTextMetrics();
      }
    }, 60_000);
  }
});
