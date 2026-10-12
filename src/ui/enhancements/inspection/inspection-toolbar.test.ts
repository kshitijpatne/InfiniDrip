// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { applyInspectionToolbarCandidate, INSPECTION_TOOLBAR_CANDIDATE_CLASS } from "./inspection-toolbar";

const roots: HTMLElement[] = [];

function render(markup: string): HTMLElement {
  const host = document.createElement("div");
  host.innerHTML = markup;
  document.body.append(host);
  roots.push(host);
  return host;
}

afterEach(() => {
  roots.splice(0).forEach((root) => root.remove());
});

describe("UIQ-08 inspection toolbar candidate adapter", () => {
  it("fails closed when the expected toolbar is absent", () => {
    const host = render("<main><section id='other'></section></main>");
    expect(applyInspectionToolbarCandidate(host)).toBe(false);
    expect(host.innerHTML).toBe("<main><section id=\"other\"></section></main>");
  });

  it("applies safely when optional zoom controls are absent", () => {
    const host = render("<div id='inspection-toolbar' role='group' aria-label='Canvas controls'><h2 id='inspection-title'>Canvas inspection</h2></div>");
    expect(applyInspectionToolbarCandidate(host)).toBe(true);
    expect(host.querySelector("#inspection-toolbar")?.classList.contains(INSPECTION_TOOLBAR_CANDIDATE_CLASS)).toBe(true);
    expect(host.querySelector("#inspection-zoom")).toBeNull();
  });

  it("adds scoped presentation hooks and removes only replaced inline visual styles", () => {
    const host = render("<section id='canvas-inspection'><div id='inspection-toolbar' role='group' aria-label='Pattern controls'>" +
      "<h2 id='inspection-title'>Pattern inspection</h2>" +
      "<button type='button' data-inspection-zoom='out' aria-label='Zoom out' style='padding:3px 8px;cursor:pointer;background:#112237;color:#edf5fa;border:1px solid #7ca4bd;border-radius:5px'>−</button>" +
      "<button type='button' data-inspection-zoom='fit' aria-label='Fit inspection' style='padding:3px 8px;cursor:pointer;background:#112237;color:#edf5fa;border:1px solid #7ca4bd;border-radius:5px'>Fit</button>" +
      "<button type='button' data-inspection-zoom='in' aria-label='Zoom in' style='padding:3px 8px;cursor:pointer;background:#112237;color:#edf5fa;border:1px solid #7ca4bd;border-radius:5px'>+</button>" +
      "<output id='inspection-zoom' aria-live='polite' style='min-width:38px;text-align:right;font-size:11px;color:#bdd1df'>100%</output>" +
      "</div><div id='inspection-viewport' role='region' aria-label='Scrollable Pattern inspection' tabindex='0'><div id='inspection-content'>pattern</div></div></section>");
    const toolbar = host.querySelector<HTMLElement>("#inspection-toolbar")!;
    const before = toolbar.innerHTML;
    const buttonNodes = [...toolbar.querySelectorAll("button")];
    const firstButtonStyle = buttonNodes[0]!.getAttribute("style");
    expect(applyInspectionToolbarCandidate(host)).toBe(true);
    expect(toolbar.classList.contains(INSPECTION_TOOLBAR_CANDIDATE_CLASS)).toBe(true);
    expect(toolbar.getAttribute("role")).toBe("group");
    expect(toolbar.getAttribute("aria-label")).toBe("Pattern controls");
    expect([...toolbar.querySelectorAll("button")]).toEqual(buttonNodes);
    expect(buttonNodes.map((button) => button.dataset.inspectionZoom)).toEqual(["out", "fit", "in"]);
    expect(buttonNodes.map((button) => button.getAttribute("aria-label"))).toEqual(["Zoom out", "Fit inspection", "Zoom in"]);
    expect(buttonNodes.every((button) => button.classList.contains("uiq-inspection-toolbar__button"))).toBe(true);
    expect(buttonNodes[0]!.style.cursor).toBe("pointer");
    expect(buttonNodes[0]!.style.backgroundColor).toBe("rgb(17, 34, 55)");
    expect(buttonNodes[0]!.style.padding).toBe("3px 8px");
    expect(buttonNodes[0]!.getAttribute("style")).toBe(firstButtonStyle);
    expect(host.querySelector("#inspection-zoom")?.textContent).toBe("100%");
    expect(host.querySelector("#inspection-zoom")?.getAttribute("aria-live")).toBe("polite");
    expect(host.querySelector("#inspection-viewport")?.getAttribute("tabindex")).toBe("0");
    expect(toolbar.innerHTML).not.toBe(before);
    expect(applyInspectionToolbarCandidate(host)).toBe(true);
    expect(toolbar.querySelectorAll("button")).toHaveLength(3);
    expect(toolbar.querySelectorAll(".uiq-inspection-toolbar__button")).toHaveLength(3);
  });
});
