// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountApp } from "./app";
import { GARMENTS } from "../drafting";

beforeEach(() => { localStorage.clear(); delete window.electronAPI; });
function mount(): HTMLElement {
  const root = document.createElement("div");
  document.body.replaceChildren(root);
  mountApp(root);
  return root;
}
function click(root: HTMLElement, id: string): void {
  root.querySelector<HTMLButtonElement>(`#${id}`)!.click();
}
function input(root: HTMLElement, selector: string, value: string): HTMLInputElement {
  const field = root.querySelector<HTMLInputElement>(selector)!;
  field.value = value;
  field.dispatchEvent(new Event("input"));
  return field;
}

describe("P1 input truth", () => {
  it("restores the active workspace, option controls, swatch and view on Load and restart", () => {
    const root = mount();
    click(root, "welcome-skip");
    click(root, "garment-woven-shirt");
    input(root, '[data-option="buttonCount"]', "6");
    const swatch = root.querySelector<HTMLButtonElement>("[data-fabric]")!;
    swatch.click();
    const select = (id: string, value: string) => {
      const el = root.querySelector<HTMLSelectElement>(id)!;
      el.value = value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    };
    select("#style-target", "Relaxed woven shirt");
    select("#stretch-select", "Linen");
    select("#export-size", "2");
    click(root, "view-body");
    click(root, "body-side");
    click(root, "view-fabric");
    input(root, "#fabric-width", "120");
    click(root, "nest-marker");
    click(root, "save-pattern");
    expect(root.querySelector("#persist-status")!.textContent).toContain("Saved");
    input(root, '[data-option="buttonCount"]', "7");
    click(root, "garment-tee");
    root.querySelectorAll<HTMLButtonElement>("[data-fabric]")[1].click();
    click(root, "load-pattern");
    const verify = (page: HTMLElement) => {
      expect(page.querySelector<HTMLInputElement>('[data-option="buttonCount"]')!.value).toBe("6");
      expect(page.querySelector<HTMLSelectElement>("#style-target")!.value).toBe("Relaxed woven shirt");
      expect(page.querySelector<HTMLSelectElement>("#stretch-select")!.value).toBe("Linen");
      expect(page.querySelector<HTMLSelectElement>("#export-size")!.value).toBe("2");
      expect(page.querySelector<HTMLInputElement>("#fabric-width")!.value).toBe("120");
      expect(page.querySelector("#body-side")!.getAttribute("aria-pressed")).toBe("true");
      expect(page.querySelector("#garment-woven-shirt")!.getAttribute("aria-pressed")).toBe("true");
      expect(page.querySelector(`[data-fabric="${swatch.dataset.fabric}"]`)!.getAttribute("aria-pressed")).toBe("true");
      expect(page.querySelector("#canvas-host")!.innerHTML).toContain("XS");
    };
    verify(root);
    verify(mount());
  });

  it("rejects an incomplete save visibly and preserves the previous saved workspace", () => {
    const root = mount();
    click(root, "save-pattern");
    const saved = localStorage.getItem("patternworks_save_v1");
    input(root, '[data-field="length"]', "110");
    click(root, "save-pattern");
    click(root, "load-pattern");
    expect(root.querySelector<HTMLInputElement>('[data-field="length"]')!.value).toBe("70");
    input(root, '[data-field="chest"]', "");
    click(root, "save-pattern");
    expect(root.querySelector("#persist-status")!.textContent).toContain("Chest: enter a finite number");
    expect(localStorage.getItem("patternworks_save_v1")).toBe(saved);
    expect(JSON.parse(localStorage.getItem("patternworks_save_v1")!).measurements.length).toBe(70);
  });
  it("updates chest/hip totals in place, including incomplete inputs", () => {
    const root = mount();
    const chest = input(root, '[data-field="chest"]', "120");
    expect(root.querySelector('[data-finished="chest"]')!.textContent).toBe("130 cm");
    expect(root.querySelector('[data-field="chest"]')).toBe(chest);
    input(root, '[data-field="ease"]', "");
    expect(root.querySelector('[data-finished="chest"]')!.textContent).toContain("complete");
    input(root, '[data-field="ease"]', "10");
    click(root, "garment-skirt");
    input(root, '[data-field="hip"]', "110");
    expect(root.querySelector('[data-finished="hip"]')!.textContent).toBe("120 cm");
  });

  it("gates every status and export on invalid woven option combinations", () => {
    const root = mount();
    click(root, "welcome-skip");
    click(root, "garment-woven-shirt");
    click(root, "view-check");
    input(root, '[data-option="buttonCount"]', "6.5");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("to review");
    expect(root.querySelector("#canvas-host")!.textContent).toContain("Review the flagged inputs");
    expect(root.querySelector("#style-host")!.textContent).not.toContain("✓ You're making");
    expect(root.querySelector("#journey-host")!.textContent).not.toContain("✓Digital checks pass");
    URL.createObjectURL = vi.fn();
    root.querySelector("#export-svg")!.dispatchEvent(new Event("click"));
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    input(root, '[data-option="buttonCount"]', "6");
    expect(root.querySelector("#canvas-host")!.textContent).toContain("physical validation pending");
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(false);
    expect(root.textContent).not.toMatch(/Ready to cut|production-ready/);
  });
  it("drafts negative ease verbatim and recovers from empty/range errors without losing focus", () => {
    const root = mount();
    const ease = input(root, '[data-field="ease"]', "-8");
    expect(ease.value).toBe("-8");
    expect(ease.getAttribute("aria-invalid")).toBe("false");
    expect(root.querySelector("#garment-host svg")!.innerHTML).toContain("23");
    const chest = root.querySelector<HTMLInputElement>('[data-field="chest"]')!;
    chest.focus();
    input(root, '[data-field="chest"]', "");
    expect(root.querySelector("#error-chest")!.textContent).toContain("finite number");
    expect(root.querySelector("#canvas-host svg")).toBeNull();
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(true);
    click(root, "view-edit");
    root.querySelector("#canvas-host")!.dispatchEvent(new MouseEvent("mousedown"));
    input(root, '[data-field="chest"]', "100");
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    expect(document.activeElement).toBe(chest);
  });

  it("diagnoses empty and out-of-range options and safely resumes Edit", () => {
    const root = mount();
    click(root, "garment-woven-shirt");
    click(root, "view-edit");
    input(root, '[data-option="buttonCount"]', "");
    expect(root.querySelector("#error-option-buttonCount")!.textContent).toContain("finite number");
    input(root, '[data-option="buttonCount"]', "8");
    expect(root.querySelector("#error-option-buttonCount")!.textContent).toContain("6–7");
    input(root, '[data-option="buttonCount"]', "6");
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    input(root, '[data-option="buttonCount"]', "8");
    click(root, "garment-polo");
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
  });

  it("does not download when an invalid control disables output", () => {
    const root = mount();
    URL.createObjectURL = vi.fn();
    input(root, '[data-field="chest"]', "20");
    click(root, "export-svg");
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it("keeps canceled and failed desktop exports incomplete with distinct feedback", async () => {
    const saveFile = vi.fn()
      .mockResolvedValueOnce({ saved: false })
      .mockRejectedValueOnce(new Error("disk error"));
    window.electronAPI = { saveFile };
    const root = mount();
    click(root, "welcome-skip");
    click(root, "export-svg");
    await Promise.resolve();
    expect(root.querySelector("#persist-status")!.textContent).toContain("canceled");
    expect(root.querySelector("#journey-host")!.textContent).not.toContain("✓Files exported");
    click(root, "export-svg");
    await Promise.resolve();
    expect(root.querySelector("#persist-status")!.textContent).toContain("failed");
    expect(root.querySelector("#journey-host")!.textContent).not.toContain("✓Files exported");
  });

  it("invalidates a confirmed export after a later design change", async () => {
    window.electronAPI = { saveFile: vi.fn().mockResolvedValue({ saved: true }) };
    const root = mount();
    click(root, "welcome-skip");
    click(root, "export-svg");
    await Promise.resolve();
    expect(root.querySelector("#journey-host")!.textContent).toContain("✓Files exported");
    input(root, '[data-field="chest"]', "120");
    expect(root.querySelector("#journey-host")!.textContent).not.toContain("✓Files exported");
  });

  it("allows the confirmed-export celebration to be dismissed", async () => {
    window.electronAPI = { saveFile: vi.fn().mockResolvedValue({ saved: true }) };
    const root = mount();
    click(root, "welcome-start");
    click(root, "journey-next");
    click(root, "journey-next");
    click(root, "journey-next");
    click(root, "export-svg");
    await Promise.resolve();
    expect(root.querySelector("#journey-celebration")).not.toBeNull();
    click(root, "celebrate-dismiss");
    expect(root.querySelector("#journey-celebration")).toBeNull();
  });

  it("reports a browser failure without claiming export completion", () => {
    URL.createObjectURL = vi.fn(() => { throw new Error("blob unavailable"); });
    const root = mount();
    click(root, "welcome-skip");
    click(root, "export-svg");
    expect(root.querySelector("#persist-status")!.textContent).toContain("browser could not start");
    expect(root.querySelector("#journey-host")!.textContent).not.toContain("✓Files exported");
  });

  it("falls back to the base export size if a recipe loses the selected step", () => {
    const tee = GARMENTS.find((garment) => garment.name === "tee")!;
    const mutableTee = tee as unknown as { sizes: readonly typeof tee.sizes[number][] };
    const originalSizes = tee.sizes;
    const root = mount();
    try {
      const size = root.querySelector<HTMLSelectElement>("#export-size")!;
      size.value = "1";
      size.dispatchEvent(new Event("change"));
      mutableTee.sizes = [originalSizes[0], originalSizes[2]];
      click(root, "garment-tee");
      expect(root.querySelector<HTMLSelectElement>("#export-size")!.value).toBe("0");
    } finally {
      mutableTee.sizes = originalSizes;
    }
  });
});
