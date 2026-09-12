// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { mountApp } from "./app";

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
});
