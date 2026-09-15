// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { GARMENTS } from "../drafting";
import { mountApp } from "./app";

let root: HTMLDivElement;
const click = (selector: string): void => {
  root.querySelector<HTMLButtonElement>(selector)!.click();
};
const changeGroup = (index: number): void => {
  const select = root.querySelector<HTMLSelectElement>("#control-page-select")!;
  select.value = String(index);
  select.dispatchEvent(new Event("change", { bubbles: true }));
};

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = "<div id='app'></div>";
  root = document.querySelector<HTMLDivElement>("#app")!;
  mountApp(root);
  click("#welcome-skip");
});

describe("bounded measurement groups", () => {
  it.each(GARMENTS)("keeps every $label field reachable exactly once through groups", (recipe) => {
    click(`#garment-${recipe.name}`);
    const pages = [...root.querySelectorAll<HTMLFieldSetElement>("[data-control-page]")];
    const inputs = [...root.querySelectorAll<HTMLInputElement>("#controls-panel input")];
    expect(inputs).toHaveLength(recipe.fields.length + (recipe.options?.length ?? 0));
    expect(new Set(inputs.map((input) => input.id)).size).toBe(inputs.length);
    const checkStagePages = (stage: "measure" | "fit"): HTMLFieldSetElement[] => {
      click(`#journey-step-${stage === "measure" ? "measure" : "fit"}`);
      const stagePages = pages.filter((page) => page.dataset.controlStage === stage);
      expect(stagePages.length).toBeGreaterThan(0);
      stagePages.forEach((page) => {
        changeGroup(Number(page.dataset.controlPage));
        expect(stagePages.filter((candidate) => !candidate.hidden)).toEqual([page]);
        expect(page.querySelector("input")).not.toBeNull();
      });
      changeGroup(Number(stagePages[0].dataset.controlPage));
      expect(root.querySelector<HTMLButtonElement>('[data-control-page-step="-1"]')!.disabled).toBe(true);
      if (stagePages.length > 1) {
        click('[data-control-page-step="1"]');
        expect(stagePages[1].hidden).toBe(false);
        changeGroup(Number(stagePages[stagePages.length - 1].dataset.controlPage));
        expect(root.querySelector<HTMLButtonElement>('[data-control-page-step="1"]')!.disabled).toBe(true);
        click('[data-control-page-step="-1"]');
        expect(stagePages[stagePages.length - 2].hidden).toBe(false);
      } else {
        expect(root.querySelector<HTMLButtonElement>('[data-control-page-step="1"]')!.disabled).toBe(true);
      }
      return stagePages;
    };
    checkStagePages("measure");
    checkStagePages("fit");
  });

  it("reveals a guidance target in its group before focusing the named input", () => {
    click('#guidance-details summary');
    click('[data-guidance-focus="ease"]');
    const input = root.querySelector<HTMLInputElement>("#input-ease")!;
    expect(document.activeElement).toBe(input);
    expect(input.closest<HTMLFieldSetElement>("[data-control-page]")!.hidden).toBe(false);
    expect(input.getAttribute("aria-label")).toBe("Ease");
    expect(root.querySelector("#canvas-inspection")).not.toBeNull();
  });

  it("keeps local workspace actions outside stage-specific export controls", () => {
    click("#journey-step-measure");
    expect(root.querySelector<HTMLElement>("#export-host")!.style.display).toBe("none");
    expect(root.querySelector("#workspace-actions #save-pattern")).not.toBeNull();
    expect(root.querySelector("#workspace-actions #load-pattern")).not.toBeNull();
  });

  it("never dims a complete figure when the active view has no truthful field target", () => {
    click("#garment-woven-shirt");
    click("#view-body");
    const row = root.querySelector<HTMLElement>('[data-dim-row="option-pocketHeight"]')!;
    row.dispatchEvent(new Event("mouseenter"));
    const bodyEdges = [...root.querySelectorAll<SVGElement>("#analysis-host [data-edge]")];
    expect(bodyEdges.length).toBeGreaterThan(0);
    expect(bodyEdges.every((edge) => edge.style.opacity === "1")).toBe(true);
    click("#assembled-preview-toggle");
    expect(root.querySelector<SVGElement>('#garment-host [data-edge="option-pocketHeight"]')!.style.opacity).toBe("1");
    expect(root.querySelector<SVGElement>('#garment-host [data-edge="option-pocketWidth"]')!.style.opacity).toBe("0.15");
  });
});

describe("reversible assembled lens", () => {
  it.each(["pattern", "body", "nest", "spec", "fabric", "check", "edit"])("returns to %s without losing the analysis or zoom context", (view) => {
    click(`#view-${view}`);
    click('[data-inspection-zoom="in"]');
    const analysis = root.querySelector("#analysis-host")!.innerHTML;
    const viewport = root.querySelector<HTMLElement>("#inspection-viewport")!;
    viewport.scrollTop = 48;
    viewport.scrollLeft = 17;
    click("#assembled-preview-toggle");
    expect(root.querySelector<HTMLElement>("#canvas-inspection")!.dataset.inspectionView).toBe("assembled");
    expect(root.querySelector<HTMLElement>("#analysis-host")!.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>("#garment-host")!.hidden).toBe(false);
    expect(root.querySelectorAll("#canvas-inspection")).toHaveLength(1);
    click("#assembled-preview-toggle");
    expect(root.querySelector<HTMLElement>("#canvas-inspection")!.dataset.inspectionView).toBe(view);
    expect(root.querySelector("#analysis-host")!.innerHTML).toBe(analysis);
    expect(root.querySelector<HTMLElement>("#inspection-viewport")!.scrollTop).toBe(48);
    expect(root.querySelector<HTMLElement>("#inspection-viewport")!.scrollLeft).toBe(17);
  });

  it("preserves transient Edit coordinates and blocks dragging the assembled picture", () => {
    click("#view-edit");
    const coordinate = root.querySelector<HTMLInputElement>("[data-editor-coordinate]")!;
    coordinate.value = "7";
    coordinate.dispatchEvent(new Event("change", { bubbles: true }));
    const edited = root.querySelector("#analysis-host")!.innerHTML;
    click("#assembled-preview-toggle");
    root.querySelector("#garment-host svg")!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    click("#assembled-preview-toggle");
    expect(root.querySelector("#analysis-host")!.innerHTML).toBe(edited);
    click("#assembled-preview-toggle");
    click("#view-body");
    expect(root.querySelector<HTMLElement>("#garment-host")!.hidden).toBe(true);
    expect(root.querySelector("#assembled-preview-toggle")!.getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps the paused frame honest when incomplete input is toggled", () => {
    const input = root.querySelector<HTMLInputElement>("#input-chest")!;
    input.value = "";
    input.dispatchEvent(new Event("input"));
    click("#assembled-preview-toggle");
    expect(root.querySelector("#canvas-host svg")).toBeNull();
    expect(root.querySelector("#canvas-inspection")!.textContent).toContain("Draft paused");
    click("#assembled-preview-toggle");
    expect(root.querySelector("#canvas-host svg")).toBeNull();
  });
});
