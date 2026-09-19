// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import axe from "axe-core";
import { mountApp } from "./app";

const mount = (): HTMLDivElement => {
  const root = document.createElement("div");
  mountApp(root);
  document.body.append(root);
  return root;
};

const click = (root: HTMLElement, id: string): void => {
  root.querySelector<HTMLElement>(`#${id}`)!.click();
};

const audit = async (label: string): Promise<void> => {
  // jsdom has no layout engine, so color contrast is reviewed in the live
  // browser matrix; axe still covers structural and ARIA rules here.
  const result = await axe.run(document.body, {
    rules: { "color-contrast": { enabled: false } },
  });
  expect(result.violations, label).toEqual([]);
};

describe("Slice 121 accessibility audit", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("keeps the welcome and Measure stages free of axe violations", async () => {
    const root = mount();
    await audit("welcome");
    click(root, "welcome-start");
    await audit("measure");
  }, 20_000);

  it("covers Style, Check, Export, assembled, view-menu, and load-dialog states", async () => {
    const root = mount();
    click(root, "welcome-start");
    click(root, "journey-step-fit");
    await audit("style");
    click(root, "assembled-preview-toggle");
    await audit("assembled");
    click(root, "assembled-preview-toggle");
    click(root, "journey-next");
    await audit("check");
    click(root, "journey-next");
    await audit("export");
    root.querySelector<HTMLDetailsElement>("#advanced-views")!.open = true;
    await audit("more views");
    click(root, "journey-step-measure");
    click(root, "save-pattern");
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "101";
    chest.dispatchEvent(new Event("input", { bubbles: true }));
    click(root, "load-pattern");
    await audit("load confirmation dialog");
  }, 20_000);
});
