// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { tutorialMarkup } from "../../journey";
import { applyTutorialFoundation } from "./tutorial-foundation";

function render(markup: string): HTMLDivElement {
  const host = document.createElement("div");
  host.innerHTML = markup;
  return host;
}

describe("UIQ-02 guided-tour foundation adapter", () => {
  it("leaves the legacy panel untouched when the flag is off", () => {
    const host = render(tutorialMarkup({ status: "unseen", step: "welcome" }));
    const before = host.innerHTML;

    expect(applyTutorialFoundation(host, false)).toBe(false);
    expect(host.innerHTML).toBe(before);
    expect(host.querySelector(".uiq-foundation")).toBeNull();
  });

  it("uses the accepted panel while retaining exact welcome copy, actions, and focus identity", () => {
    const host = render(tutorialMarkup({ status: "unseen", step: "welcome" }));
    const before = host.textContent;

    expect(applyTutorialFoundation(host, true)).toBe(true);
    const panel = host.querySelector<HTMLElement>("#tutorial-panel")!;
    expect(panel.classList.contains("uiq-foundation")).toBe(true);
    expect(panel.classList.contains("uiq-foundation-panel")).toBe(true);
    expect(panel.getAttribute("aria-labelledby")).toBe("tutorial-title");
    expect(host.querySelector<HTMLHeadingElement>("#tutorial-title")?.tabIndex).toBe(-1);
    expect(host.querySelector("#welcome-start")?.textContent).toBe("Start the tour");
    expect(host.querySelector("#welcome-skip")?.textContent).toBe("Skip for now");
    expect(host.textContent).toContain("Nothing has been sewn or fit-tested");
    expect(host.textContent).toContain("Create a digital sewing pattern that fits your design intent.");
    expect(host.textContent).toContain("Step 1 of 5");
    expect(host.textContent).toBe(before);
    expect(applyTutorialFoundation(host, true)).toBe(false);
  });

  it("preserves the active step's exact instructions and status semantics", () => {
    const host = render(tutorialMarkup({ status: "in_progress", step: "measure" }, true));

    expect(applyTutorialFoundation(host, true)).toBe(true);
    expect(host.querySelector("#tutorial-title")?.textContent).toBe("Review measurements.");
    expect(host.querySelector("#tutorial-panel")?.textContent).toContain(
      "Values that need review stay visible with guidance.",
    );
    const warning = host.querySelector<HTMLElement>(".tutorial-storage-notice")!;
    expect(warning.getAttribute("role")).toBe("status");
    expect(warning.querySelector(".uiq-foundation-status-label")?.textContent).toBe("Warning");
    expect(warning.textContent).toContain("Tour progress may not survive a reload");
  });

  it("leaves replay-only markup on its legacy path because it has no description contract", () => {
    const host = render(tutorialMarkup({ status: "completed", step: "export" }));
    const before = host.innerHTML;

    expect(applyTutorialFoundation(host, true)).toBe(false);
    expect(host.innerHTML).toBe(before);
  });

  it("uses empty native text safely and supplies the missing region label and role", () => {
    const host = render('<section id="tutorial-panel"><h2 id="tutorial-title">Title</h2><p>Body</p></section>');
    const title = host.querySelector("#tutorial-title")!;
    const description = host.querySelector("p")!;
    Object.defineProperty(title, "textContent", { configurable: true, get: () => null });
    Object.defineProperty(description, "textContent", { configurable: true, get: () => null });

    expect(applyTutorialFoundation(host, true)).toBe(true);
    expect(host.querySelector("#tutorial-title")?.textContent).toBe("");
    expect(host.querySelector(".uiq-foundation-panel-description")?.textContent).toBe("");
    expect(host.querySelector("#tutorial-panel")?.getAttribute("role")).toBe("region");
    expect(host.querySelector("#tutorial-panel")?.hasAttribute("aria-labelledby")).toBe(false);
  });

  it("preserves an explicitly polite warning announcement even with empty warning text", () => {
    const host = render('<section id="tutorial-panel"><h2 id="tutorial-title">Title</h2><p>Body</p>' +
      '<p class="tutorial-storage-notice" role="status" aria-live="polite"></p></section>');
    const notice = host.querySelector(".tutorial-storage-notice")!;
    Object.defineProperty(notice, "textContent", { configurable: true, get: () => null });

    expect(applyTutorialFoundation(host, true)).toBe(true);
    const warning = host.querySelector<HTMLElement>(".tutorial-storage-notice")!;
    expect(warning.getAttribute("aria-live")).toBe("polite");
    expect(warning.textContent).toBe("Warning");
  });

  it("returns safely for missing panels and missing titles or descriptions", () => {
    const empty = document.createElement("div");
    const noDescription = render('<section id="tutorial-panel"><h2 id="tutorial-title">Title</h2></section>');
    const noTitle = render('<section id="tutorial-panel"><p>Body</p></section>');

    expect(applyTutorialFoundation(empty, true)).toBe(false);
    expect(applyTutorialFoundation(noDescription, true)).toBe(false);
    expect(applyTutorialFoundation(noTitle, true)).toBe(false);
  });
});
