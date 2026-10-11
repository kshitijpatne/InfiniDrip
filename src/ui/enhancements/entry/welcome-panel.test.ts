// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { mountWelcomePanel, WELCOME_SCOPE_CLASS } from "./welcome-panel";

afterEach(() => {
  document.body.replaceChildren();
});

describe("mountWelcomePanel", () => {
  it("mounts one labelled region with a readable native wordmark and welcome copy", () => {
    const host = document.createElement("div");
    const controller = mountWelcomePanel(host);

    expect(controller.root.tagName).toBe("SECTION");
    expect(controller.root.classList.contains("uiq-foundation")).toBe(true);
    expect(controller.root.classList.contains(WELCOME_SCOPE_CLASS)).toBe(true);
    expect(controller.root.getAttribute("aria-label")).toBe("InfiniDrip welcome");
    expect(controller.root.querySelector("h1")?.textContent).toBe("InfiniDrip");
    expect(controller.root.querySelector(".uiq-entry__welcome")?.textContent).toBe("Bring your garment ideas to life.");
    expect(controller.root.querySelector(".uiq-entry__description")?.textContent).toBe(
      "Explore thoughtful patternmaking, one considered detail at a time.",
    );
    expect(controller.root.querySelector(".uiq-entry__ornament")?.getAttribute("aria-hidden")).toBe("true");
    expect(controller.root.querySelectorAll("a,button,input,select,form")).toHaveLength(0);
  });

  it("preserves host siblings and independent mounts when disposed repeatedly", () => {
    const host = document.createElement("div");
    const sibling = document.createElement("p");
    sibling.textContent = "Host content";
    host.append(sibling);
    const first = mountWelcomePanel(host);
    const second = mountWelcomePanel(host);

    expect(host.children).toHaveLength(3);
    expect(first.root).not.toBe(second.root);
    first.dispose();
    first.dispose();
    expect(host.contains(first.root)).toBe(false);
    expect(host.contains(second.root)).toBe(true);
    expect(host.firstElementChild).toBe(sibling);
    second.dispose();
    expect(host.children).toHaveLength(1);
  });

  it("keeps every component selector scoped and avoids remote CSS resources", () => {
    const css = readFileSync("src/ui/enhancements/entry/welcome-panel.css", "utf8");

    expect(css).toContain(".uiq-entry__wordmark");
    expect(css).toContain("@media (forced-colors: active)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).not.toMatch(/url\s*\(|@import|(?:^|\n)\s*(?:html|body|:root|\*)\s*[{,]/i);
    const rules = css.replace(/\/\*[\s\S]*?\*\//g, "").split("{").slice(1);
    for (const rule of rules) {
      const selectorParts = rule.split("}");
      const selector = selectorParts[selectorParts.length - 1].trim();
      if (selector === "" || selector.startsWith("@")) continue;
      for (const part of selector.split(",")) {
        expect(part.trim().startsWith(".uiq-entry")).toBe(true);
      }
    }
  });
});
