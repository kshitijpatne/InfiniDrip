// @vitest-environment jsdom
// EPIC-6 exit audit (Slice 129): one style's artwork end to end on every
// garment — panel, preview, print sheet, tech pack, save/load — through the
// real mounted app. Live-browser responsive/console proof stays Codex-side.
import { describe, it, expect, vi } from "vitest";
import { mountApp } from "./app";

const GARMENTS = ["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"];

const clickId = (root: HTMLElement, id: string): void => {
  root.querySelector<HTMLElement>(`#${id}`)!.click();
};

describe("EPIC-6 exit audit", () => {
  it("carries one style's artwork end to end on every garment", () => {
    const downloaded: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      downloaded.push(this.download);
    });
    for (const garment of GARMENTS) {
      localStorage.clear();
      downloaded.length = 0;
      const root = document.createElement("div");
      document.body.appendChild(root);
      try {
        mountApp(root);
        clickId(root, "welcome-skip");
        root.querySelector<HTMLButtonElement>(`#garment-${garment}`)!.click();
        clickId(root, "journey-step-fit");
        root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "exit-print";
        root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
        root.querySelector<HTMLButtonElement>("#surface-add")!.click();
        expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);
        expect(root.querySelector('#surface-preview polygon[data-placement="exit-print"]')).not.toBeNull();
        expect(root.querySelector("#guidance-host")!.textContent).not.toContain("exit-print");
        clickId(root, "journey-next");
        clickId(root, "journey-next");
        const sheet = root.querySelector<HTMLButtonElement>("#export-surface-sheet")!;
        expect(sheet.disabled).toBe(false);
        sheet.click();
        root.querySelector<HTMLButtonElement>("#export-techpack")!.click();
        expect(downloaded).toEqual([`${garment}-surface-sheet.svg`, `${garment}-techpack.pdf`]);
        clickId(root, "save-pattern");
        root.querySelector<HTMLButtonElement>("#export-svg")!.click();
        clickId(root, "load-pattern");
        clickId(root, "workspace-confirm-accept");
        expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);
        expect(root.querySelector('#surface-preview polygon[data-placement="exit-print"]')).not.toBeNull();
      } finally {
        root.remove();
      }
    }
  });
});
