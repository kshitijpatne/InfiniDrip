// @vitest-environment jsdom
// EPIC-7 exit audit (Slice 134): the planning surface end to end on every
// garment — empty, valid, invalid, too-short, and too-narrow states — through
// the real mounted app. Live-browser responsive/console proof stays Codex-side.
import { describe, it, expect } from "vitest";
import { mountApp } from "./app";

const GARMENTS = ["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"];

function mount(): HTMLDivElement {
  const root = document.createElement("div");
  mountApp(root);
  return root;
}
const clickId = (root: HTMLElement, id: string): void => {
  root.querySelector<HTMLElement>(`#${id}`)!.click();
};
const clickIfPresent = (root: HTMLElement, id: string): void => {
  root.querySelector<HTMLElement>(`#${id}`)?.click();
};
const toFabricView = (root: HTMLElement): void => {
  clickIfPresent(root, "welcome-skip");
  clickId(root, "journey-step-fit");
  clickId(root, "journey-next");
  clickId(root, "journey-next");
  root.querySelector<HTMLButtonElement>("#view-fabric")!.dispatchEvent(new Event("click"));
};
const setBuffer = (root: HTMLElement, value: string): void => {
  const input = root.querySelector<HTMLInputElement>("#nest-buffer")!;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const setAvailable = (root: HTMLElement, value: string): void => {
  const input = root.querySelector<HTMLInputElement>("#nest-available")!;
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const readout = (root: HTMLElement, id: string): string =>
  root.querySelector(`#${id}`)!.textContent ?? "";

describe("EPIC-7 exit audit", () => {
  it("shows empty-state planning readouts on every garment", () => {
    for (const garment of GARMENTS) {
      localStorage.clear();
      const root = mount();
      try {
        toFabricView(root);
        root.querySelector<HTMLButtonElement>(`#garment-${garment}`)!.dispatchEvent(new Event("click"));
        expect(root.querySelector("#nest-intel-host")).not.toBeNull();
        expect(readout(root, "nest-required")).toContain("Requires");
        expect(readout(root, "nest-required")).toContain("cm of cloth");
        expect(readout(root, "nest-planned")).toContain("Planned with buffer:");
        expect(readout(root, "nest-waste")).toContain("Waste:");
        expect(readout(root, "nest-waste")).toContain("% of cloth");
        expect(readout(root, "nest-verdict")).toContain("unknown");
        expect(readout(root, "nest-nap-notice")).toContain("never rotate");
        expect(root.querySelector("#canvas-host svg")).not.toBeNull();
        expect(root.querySelector("#garment-host svg")).not.toBeNull();
      } finally {
        root.remove();
      }
    }
  });

  it("judges valid, invalid, too-short, and too-narrow states per garment", () => {
    for (const garment of GARMENTS) {
      localStorage.clear();
      const root = mount();
      try {
        toFabricView(root);
        root.querySelector<HTMLButtonElement>(`#garment-${garment}`)!.dispatchEvent(new Event("click"));
        setAvailable(root, "100000");
        expect(readout(root, "nest-verdict")).toBe("Fit: fits the fabric on hand.");
        setBuffer(root, "60");
        expect(readout(root, "error-nest-buffer")).toContain("0–50");
        expect(root.querySelector("#guidance-host")!.textContent).toContain("Cutting buffer");
        expect(root.querySelector("#canvas-host svg")).not.toBeNull();
        setBuffer(root, "10");
        setAvailable(root, "1");
        expect(readout(root, "nest-verdict")).toContain("short by");
        const width = root.querySelector<HTMLInputElement>("#fabric-width")!;
        width.value = "30";
        width.dispatchEvent(new Event("input"));
        expect(root.querySelector("#canvas-host")!.textContent).toContain("wider than this fabric");
        expect(readout(root, "nest-required")).toContain("Requires");
        expect(readout(root, "nest-planned")).toContain("Planned with buffer:");
      } finally {
        root.remove();
      }
    }
  });

  it("keeps metrics deterministic across scope round-trips", () => {
    for (const garment of GARMENTS) {
      localStorage.clear();
      const root = mount();
      try {
        toFabricView(root);
        root.querySelector<HTMLButtonElement>(`#garment-${garment}`)!.dispatchEvent(new Event("click"));
        const before = readout(root, "nest-required") + readout(root, "nest-planned") +
          readout(root, "nest-waste");
        root.querySelector<HTMLButtonElement>("#nest-marker")!.click();
        root.querySelector<HTMLButtonElement>("#nest-single")!.click();
        expect(readout(root, "nest-required") + readout(root, "nest-planned") +
          readout(root, "nest-waste")).toBe(before);
      } finally {
        root.remove();
      }
    }
  });

  it("saves and reloads planning values on every garment", () => {
    for (const garment of GARMENTS) {
      localStorage.clear();
      const root = mount();
      try {
        toFabricView(root);
        root.querySelector<HTMLButtonElement>(`#garment-${garment}`)!.dispatchEvent(new Event("click"));
        setBuffer(root, "25");
        setAvailable(root, "400");
        clickId(root, "save-pattern");
        setBuffer(root, "10");
        clickId(root, "load-pattern");
        clickId(root, "workspace-confirm-accept");
        expect(root.querySelector<HTMLInputElement>("#nest-buffer")!.value).toBe("25");
        expect(root.querySelector<HTMLInputElement>("#nest-available")!.value).toBe("400");
      } finally {
        root.remove();
      }
    }
  });

  it("renders planning readouts at narrow and wide widths without errors", () => {
    for (const garment of ["tee", "trouser"]) {
      localStorage.clear();
      const root = mount();
      document.body.appendChild(root);
      try {
        toFabricView(root);
        root.querySelector<HTMLButtonElement>(`#garment-${garment}`)!.dispatchEvent(new Event("click"));
        const viewport = root.querySelector<HTMLElement>("#inspection-viewport")!;
        for (const width of [1280, 900, 700, 560, 390]) {
          Object.defineProperty(viewport, "clientWidth", { configurable: true, value: width });
          window.dispatchEvent(new Event("resize"));
          expect(root.querySelector("#nest-intel-host")).not.toBeNull();
          expect(readout(root, "nest-required")).toContain("Requires");
        }
      } finally {
        root.remove();
      }
    }
  });
});
