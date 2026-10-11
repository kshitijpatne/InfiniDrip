// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  createFoundationPanel,
  createFoundationStatus,
  FOUNDATION_SCOPE_CLASS,
  type FoundationStatusKind,
} from "./foundation";

const HOSTILE_STRINGS = [
  "<script>window.__pwned = true;</script>",
  "<img src=x onerror=alert(1)>",
  "</h2><b>bold</b>",
  "javascript:alert(1)",
  "&lt;already-escaped&gt;",
  "",
  "   ",
  "a".repeat(2000),
  "ünïcödé — emoji 🎉 and RTL ‏تجربة",
];

describe("createFoundationPanel", () => {
  it("builds a scoped section with an h2 title and a paragraph description", () => {
    const panel = createFoundationPanel("Panel title", "Panel description");

    expect(panel.tagName).toBe("SECTION");
    expect(panel.classList.contains(FOUNDATION_SCOPE_CLASS)).toBe(true);
    expect(panel.classList.contains("uiq-foundation-panel")).toBe(true);

    const heading = panel.querySelector("h2");
    const description = panel.querySelector("p");
    expect(heading?.textContent).toBe("Panel title");
    expect(description?.textContent).toBe("Panel description");
    expect(panel.children).toHaveLength(2);
    expect(panel.children[0]).toBe(heading);
    expect(panel.children[1]).toBe(description);
  });

  it.each(HOSTILE_STRINGS)("renders %j as literal text, never markup", (raw) => {
    const panel = createFoundationPanel(raw, raw);
    const heading = panel.querySelector("h2")!;
    const description = panel.querySelector("p")!;

    expect(heading.textContent).toBe(raw);
    expect(description.textContent).toBe(raw);
    expect(panel.querySelector("script")).toBeNull();
    expect(panel.querySelector("img")).toBeNull();
    expect(panel.querySelector("b")).toBeNull();
    expect((globalThis as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it("returns an independent element on every call", () => {
    const first = createFoundationPanel("A", "a");
    const second = createFoundationPanel("B", "b");
    expect(first).not.toBe(second);
    expect(first.querySelector("h2")!.textContent).toBe("A");
    expect(second.querySelector("h2")!.textContent).toBe("B");
  });
});

describe("createFoundationStatus", () => {
  const CASES: Array<{ kind: FoundationStatusKind; label: string; role: string }> = [
    { kind: "info", label: "Info", role: "status" },
    { kind: "warning", label: "Warning", role: "status" },
    { kind: "error", label: "Error", role: "alert" },
  ];

  it.each(CASES)("renders the $kind status with a visible $label label and role=$role", ({ kind, label, role }) => {
    const status = createFoundationStatus("Something happened", kind);

    expect(status.classList.contains(FOUNDATION_SCOPE_CLASS)).toBe(true);
    expect(status.classList.contains("uiq-foundation-status")).toBe(true);
    expect(status.dataset.kind).toBe(kind);
    expect(status.getAttribute("role")).toBe(role);

    const labelEl = status.querySelector(".uiq-foundation-status-label");
    const messageEl = status.querySelector(".uiq-foundation-status-message");
    expect(labelEl?.textContent).toBe(label);
    expect(messageEl?.textContent).toBe("Something happened");
  });

  it.each(HOSTILE_STRINGS)("renders %j as literal text, never markup", (raw) => {
    const status = createFoundationStatus(raw, "warning");
    const messageEl = status.querySelector(".uiq-foundation-status-message")!;

    expect(messageEl.textContent).toBe(raw);
    expect(status.querySelector("script")).toBeNull();
    expect(status.querySelector("img")).toBeNull();
  });

  it("never conveys state through color alone: the label text differs per kind", () => {
    const labels = CASES.map(
      ({ kind }) => createFoundationStatus("msg", kind).querySelector(".uiq-foundation-status-label")!.textContent,
    );
    expect(new Set(labels).size).toBe(3);
  });
});

describe("isolation", () => {
  it("requires the root scope even for component modifier and child selectors", () => {
    const css = readFileSync("src/ui/enhancements/foundation/foundation.css", "utf8");
    expect(css).not.toMatch(/(?:^|\n)\s*\.uiq-foundation-(?:panel|status)/);
    expect(css).toContain(".uiq-foundation.uiq-foundation-panel--glass");
    expect(css).toContain(".uiq-foundation .uiq-foundation-panel-title");
  });

  it("keeps the optional glass palette readable on the worst white backdrop", () => {
    const css = readFileSync("src/ui/enhancements/foundation/foundation.css", "utf8");
    expect(css).toContain("var(--uiq-panel) 88%, transparent");
    const luminance = (rgb: number[]) => rgb.map((channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
    const background = [17, 39, 59].map((channel) => channel * 0.88 + 255 * 0.12);
    const muted = [189, 209, 223];
    expect((luminance(muted) + 0.05) / (luminance(background) + 0.05)).toBeGreaterThanOrEqual(4.5);
  });

  it("does not touch the document head, body, or any unrelated sibling", () => {
    const headCountBefore = document.head.children.length;
    const sibling = document.createElement("div");
    sibling.className = "unrelated-sibling";
    sibling.setAttribute("data-marker", "untouched");
    document.body.append(sibling);
    const bodyCountBefore = document.body.children.length;

    const container = document.createElement("div");
    container.append(createFoundationPanel("Title", "Description"));
    container.append(createFoundationStatus("Message", "error"));
    document.body.append(container);

    expect(document.head.children.length).toBe(headCountBefore);
    expect(sibling.className).toBe("unrelated-sibling");
    expect(sibling.getAttribute("data-marker")).toBe("untouched");
    expect(sibling.children).toHaveLength(0);
    expect(document.body.children.length).toBe(bodyCountBefore + 1);
    expect(document.documentElement.classList.length).toBe(0);

    sibling.remove();
    container.remove();
  });

  it("builds elements with no global listeners attached outside their own subtree", () => {
    const panel = createFoundationPanel("Title", "Description");
    const status = createFoundationStatus("Message", "info");
    expect(panel.isConnected).toBe(false);
    expect(status.isConnected).toBe(false);
  });
});
