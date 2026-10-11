// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { mountMaterialPanel, type MaterialSnapshot } from "./material-panel";
import { STRETCH_FABRICS, type StretchFabric } from "../../../drafting/ease";
import { APPEARANCE_TEXTURES, type Appearance } from "../../appearance";

afterEach(() => document.body.replaceChildren());

// Deep-freeze every fixture and the reused source tables so the module under
// test cannot silently mutate caller data or the shared preset/texture
// tables (no hidden default/clamp, no implicit mutation).
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.getOwnPropertyNames(value).forEach((key) => {
      deepFreeze((value as Record<string, unknown>)[key]);
    });
    Object.freeze(value);
  }
  return value;
}

deepFreeze(STRETCH_FABRICS);
deepFreeze(APPEARANCE_TEXTURES);

const HOSTILE_STRINGS = [
  "<script>window.__pwned_material = true;</script>",
  "<img src=x onerror=alert(1)>",
  "</p><b>bold</b>",
  "javascript:alert(1)",
  "url(javascript:alert(1))",
  "&lt;already-escaped&gt;",
  "",
  "   ",
  "a".repeat(2000),
  "ünïcödé — emoji 🎉 and RTL ‏تجربة",
];

const KNOWN_FABRIC: StretchFabric = STRETCH_FABRICS[2]; // Cotton jersey, knit, 25%
const CUSTOM_FABRIC: StretchFabric = deepFreeze({ name: "Mystery blend", family: "knit", stretchPercent: 33 });
const INVALID_STRETCH_FABRIC: StretchFabric = deepFreeze({ name: "Broken", family: "woven", stretchPercent: -5 });
const NAN_STRETCH_FABRIC: StretchFabric = deepFreeze({ name: "NaN fabric", family: "knit", stretchPercent: Number.NaN });
const INFINITE_STRETCH_FABRIC: StretchFabric = deepFreeze({ name: "Infinite", family: "knit", stretchPercent: Number.POSITIVE_INFINITY });

const VALID_APPEARANCE: Appearance = deepFreeze({ texture: "woven", shine: 40 });

function baseSnapshot(overrides: Partial<MaterialSnapshot> = {}): MaterialSnapshot {
  return deepFreeze({
    revisionLabel: "Revision 1",
    fabric: KNOWN_FABRIC,
    easeGuidance: "Cotton jersey stretches ~25% — consider negative ease.",
    compatibility: { state: "compatible", detail: "Fabric matches the selected recipe." },
    color: "#336699",
    appearance: VALID_APPEARANCE,
    ...overrides,
  });
}

function mount(snapshot: MaterialSnapshot, onReview = vi.fn()) {
  const host = document.createElement("div");
  document.body.append(host);
  const handle = mountMaterialPanel(host, { snapshot, onReview });
  return { host, handle, onReview };
}

describe("Codex absence and cleanup pressure checks", () => {
  it("treats runtime undefined appearance as unavailable rather than inventing the parser default", () => {
    const { host, handle } = mount(baseSnapshot({ appearance: undefined as unknown as Appearance }));
    expect(host.querySelector<HTMLElement>(".uiq-material-appearance-cue")!.hidden).toBe(true);
    expect(host.querySelector(".uiq-material-appearance-text")!.textContent).toBe("Appearance not supplied. Preview unavailable.");
    handle.dispose();
  });
  it("treats runtime undefined fabric as unknown without leaving a half-mounted, undisposable panel", () => {
    const { host, handle } = mount(baseSnapshot({ fabric: undefined as unknown as StretchFabric }));
    expect(host.querySelector(".uiq-material-fabric-name")!.textContent).toBe("Unknown fabric: none supplied.");
    expect(host.querySelector(".uiq-material-fabric-stretch")).toBeNull();
    expect(host.querySelectorAll("button")).toHaveLength(2);
    handle.dispose(); expect(host.querySelector(".uiq-material")).toBeNull();
  });
  it("removes both button listeners exactly once on disposal, then stale buttons stay inert", () => {
    const { host, handle, onReview } = mount(baseSnapshot());
    const buttons = [...host.querySelectorAll("button")];
    const removals = buttons.map(button => vi.spyOn(button, "removeEventListener"));
    handle.dispose(); handle.dispose(); buttons.forEach(button => button.click());
    removals.forEach(removal => { expect(removal).toHaveBeenCalledTimes(1); expect(removal).toHaveBeenCalledWith("click", expect.any(Function)); });
    expect(onReview).not.toHaveBeenCalled();
  });
  it("accepts a finite custom stretch above100 without clamping", () => {
    const { host, handle } = mount(baseSnapshot({ fabric: { name: "Custom", family: "knit", stretchPercent: 125 } }));
    expect(host.querySelector(".uiq-material-fabric-stretch")!.textContent).toBe("Stretch: 125%.");
    expect(host.querySelector(".uiq-material-fabric-name")!.textContent).toContain("Custom / unverified fabric");
    handle.dispose();
  });
});

describe("mountMaterialPanel: mounting and structure", () => {
  it("appends exactly one owned root, preserving existing siblings", () => {
    const host = document.createElement("div");
    const sibling = document.createElement("div");
    sibling.className = "pre-existing-sibling";
    host.append(sibling);

    const { handle } = (() => {
      const h = mountMaterialPanel(host, { snapshot: baseSnapshot(), onReview: vi.fn() });
      return { handle: h };
    })();

    expect(host.children).toHaveLength(2);
    expect(host.children[0]).toBe(sibling);
    expect(host.children[1].classList.contains("uiq-foundation")).toBe(true);
    expect(host.children[1].classList.contains("uiq-material")).toBe(true);
    handle.dispose();
  });

  it("renders both fixed section headings and the revision label literally", () => {
    const { host, handle } = mount(baseSnapshot({ revisionLabel: "Revision 42" }));
    const root = host.querySelector(".uiq-material")!;
    const headings = Array.from(root.querySelectorAll("h2")).map((h) => h.textContent);
    expect(headings).toEqual(["Material behavior guidance", "Screen appearance only"]);
    expect(root.querySelector(".uiq-material-revision")?.textContent).toBe("Revision 42");
    handle.dispose();
  });

  it("renders all five existing presets read-only, exactly matching the source table", () => {
    const { host, handle } = mount(baseSnapshot());
    const items = Array.from(host.querySelectorAll(".uiq-material-preset-item"));
    expect(items).toHaveLength(STRETCH_FABRICS.length);
    STRETCH_FABRICS.forEach((preset, index) => {
      expect(items[index].textContent).toBe(
        `${preset.name} — ${preset.family}, ${preset.stretchPercent}% stretch`,
      );
    });
    handle.dispose();
  });

  it("shows the fixed heuristic/physical-sampling/screen-only caveats", () => {
    const { host, handle } = mount(baseSnapshot());
    const caveats = Array.from(host.querySelectorAll(".uiq-material-caveat")).map((c) => c.textContent);
    expect(caveats.some((c) => c?.includes("heuristic defaults"))).toBe(true);
    expect(caveats.some((c) => c?.includes("Physical sampling is still needed"))).toBe(true);
    expect(caveats.some((c) => c?.includes("do not change material behavior"))).toBe(true);
    handle.dispose();
  });

  it("multiple simultaneous mounts have independent DOM and state", () => {
    const { host: hostA, handle: handleA, onReview: reviewA } = mount(baseSnapshot({ revisionLabel: "A" }));
    const { host: hostB, handle: handleB, onReview: reviewB } = mount(baseSnapshot({ revisionLabel: "B" }));

    expect(hostA.querySelector(".uiq-material-revision")?.textContent).toBe("A");
    expect(hostB.querySelector(".uiq-material-revision")?.textContent).toBe("B");

    (hostA.querySelector(".uiq-material-review-fabric") as HTMLButtonElement).click();
    expect(reviewA).toHaveBeenCalledTimes(1);
    expect(reviewB).not.toHaveBeenCalled();

    handleA.dispose();
    expect(hostA.querySelector(".uiq-material")).toBeNull();
    expect(hostB.querySelector(".uiq-material")).not.toBeNull();
    handleB.dispose();
  });
});

describe("fabric classification and stretch validity", () => {
  it("shows the exact unknown label when fabric is null", () => {
    const { host, handle } = mount(baseSnapshot({ fabric: null }));
    expect(host.querySelector(".uiq-material-fabric-name")?.textContent).toBe("Unknown fabric: none supplied.");
    expect(host.querySelector(".uiq-material-fabric-stretch")).toBeNull();
    handle.dispose();
  });

  it.each(STRETCH_FABRICS)("classifies the exact-match preset %s as a known preset", (preset) => {
    const { host, handle } = mount(baseSnapshot({ fabric: preset }));
    expect(host.querySelector(".uiq-material-fabric-name")?.textContent).toBe(
      `${preset.name} (${preset.family}) — Known preset.`,
    );
    expect(host.querySelector(".uiq-material-fabric-stretch")?.textContent).toBe(
      `Stretch: ${preset.stretchPercent}%.`,
    );
    handle.dispose();
  });

  it("classifies a non-matching fabric as custom/unverified", () => {
    const { host, handle } = mount(baseSnapshot({ fabric: CUSTOM_FABRIC }));
    expect(host.querySelector(".uiq-material-fabric-name")?.textContent).toBe(
      "Mystery blend (knit) — Custom / unverified fabric.",
    );
    handle.dispose();
  });

  it("treats a fabric that only partially matches a preset (different stretch) as custom", () => {
    const partial: StretchFabric = deepFreeze({ ...KNOWN_FABRIC, stretchPercent: KNOWN_FABRIC.stretchPercent + 1 });
    const { host, handle } = mount(baseSnapshot({ fabric: partial }));
    expect(host.querySelector(".uiq-material-fabric-name")?.textContent).toContain("Custom / unverified fabric.");
    handle.dispose();
  });

  it("shows a negative stretch value literally with a correction, never clamped", () => {
    const { host, handle } = mount(baseSnapshot({ fabric: INVALID_STRETCH_FABRIC }));
    const stretchEl = host.querySelector(".uiq-material-fabric-stretch")!;
    expect(stretchEl.textContent).toBe(
      "Stretch value supplied is invalid: -5. Shown as supplied; not clamped. Review fabric: supply a finite stretch percentage of 0 or greater.",
    );
    expect(stretchEl.classList.contains("uiq-material-fabric-stretch--invalid")).toBe(true);
    handle.dispose();
  });

  it("shows a NaN stretch value literally", () => {
    const { host, handle } = mount(baseSnapshot({ fabric: NAN_STRETCH_FABRIC }));
    expect(host.querySelector(".uiq-material-fabric-stretch")?.textContent).toBe(
      "Stretch value supplied is invalid: NaN. Shown as supplied; not clamped. Review fabric: supply a finite stretch percentage of 0 or greater.",
    );
    handle.dispose();
  });

  it("shows a non-finite (Infinity) stretch value literally, with no invented upper cap", () => {
    const { host, handle } = mount(baseSnapshot({ fabric: INFINITE_STRETCH_FABRIC }));
    expect(host.querySelector(".uiq-material-fabric-stretch")?.textContent).toBe(
      "Stretch value supplied is invalid: Infinity. Shown as supplied; not clamped. Review fabric: supply a finite stretch percentage of 0 or greater.",
    );
    handle.dispose();
  });

  it("accepts stretch of exactly 0 as a usable value (boundary, not clamped-to-invalid)", () => {
    const zero: StretchFabric = deepFreeze({ name: "Zero", family: "woven", stretchPercent: 0 });
    const { host, handle } = mount(baseSnapshot({ fabric: zero }));
    expect(host.querySelector(".uiq-material-fabric-stretch")?.textContent).toBe("Stretch: 0%.");
    handle.dispose();
  });
});

describe("ease guidance", () => {
  it("shows the exact unavailable label when ease guidance is null", () => {
    const { host, handle } = mount(baseSnapshot({ easeGuidance: null }));
    expect(host.querySelector(".uiq-material-ease-guidance")?.textContent).toBe("Ease guidance unavailable.");
    handle.dispose();
  });

  it.each(HOSTILE_STRINGS)("renders hostile/empty ease guidance %j as literal text", (raw) => {
    const { host, handle } = mount(baseSnapshot({ easeGuidance: raw }));
    const el = host.querySelector(".uiq-material-ease-guidance")!;
    expect(el.textContent).toBe(raw);
    expect(el.querySelector("script")).toBeNull();
    expect(el.querySelector("b")).toBeNull();
    handle.dispose();
  });
});

describe("compatibility", () => {
  it.each([
    ["compatible", "Compatible"],
    ["mismatch", "Mismatch"],
    ["unknown", "Unknown"],
  ] as const)("shows the caller-supplied %s state and detail verbatim", (state, label) => {
    const { host, handle } = mount(
      baseSnapshot({ compatibility: { state, detail: "Exact detail text." } }),
    );
    const block = host.querySelector(".uiq-material-compatibility")!;
    expect(block.getAttribute("role")).toBe("status");
    expect(block.querySelector(".uiq-material-compatibility-label")?.textContent).toBe(label);
    expect(block.querySelector(".uiq-material-compatibility-detail")?.textContent).toBe("Exact detail text.");
    handle.dispose();
  });

  it.each(HOSTILE_STRINGS)("renders hostile compatibility detail %j literally", (raw) => {
    const { host, handle } = mount(
      baseSnapshot({ compatibility: { state: "mismatch", detail: raw } }),
    );
    const detail = host.querySelector(".uiq-material-compatibility-detail")!;
    expect(detail.textContent).toBe(raw);
    expect(detail.querySelector("script")).toBeNull();
    handle.dispose();
  });

  it("never infers compatibility from appearance, color, or fabric name", () => {
    const { host, handle } = mount(
      baseSnapshot({
        fabric: KNOWN_FABRIC,
        color: "#000000",
        appearance: { texture: "smooth", shine: 0 },
        compatibility: { state: "mismatch", detail: "Caller says mismatch regardless of inputs." },
      }),
    );
    expect(host.querySelector(".uiq-material-compatibility-label")?.textContent).toBe("Mismatch");
    handle.dispose();
  });
});

describe("color swatch", () => {
  it("applies a valid six-digit hex to the swatch background and shows it normalized", () => {
    const { host, handle } = mount(baseSnapshot({ color: "#abcdef" }));
    const swatch = host.querySelector(".uiq-material-color-swatch") as HTMLElement;
    expect(swatch.hidden).toBe(false);
    expect(swatch.style.backgroundColor).not.toBe("");
    expect(host.querySelector(".uiq-material-color-text")?.textContent).toBe("Supplied color: #ABCDEF.");
    handle.dispose();
  });

  it.each(["red", "#fff", "#gggggg", "", "   ", "javascript:alert(1)", "url(x)"])(
    "shows %j literally with 'Preview unavailable' and never writes it into the swatch style",
    (raw) => {
      const { host, handle } = mount(baseSnapshot({ color: raw }));
      const swatch = host.querySelector(".uiq-material-color-swatch") as HTMLElement;
      expect(swatch.hidden).toBe(true);
      if (raw !== "") expect(swatch.getAttribute("style") ?? "").not.toContain(raw);
      expect(host.querySelector(".uiq-material-color-text")?.textContent).toBe(
        `Preview unavailable (supplied color: ${raw}).`,
      );
      handle.dispose();
    },
  );

  it.each(HOSTILE_STRINGS)("never injects hostile color string %j as markup or a loadable style value", (raw) => {
    const { host, handle } = mount(baseSnapshot({ color: raw }));
    const colorText = host.querySelector(".uiq-material-color-text")!;
    expect(colorText.textContent).toBe(`Preview unavailable (supplied color: ${raw}).`);
    expect(colorText.querySelector("script")).toBeNull();
    expect(colorText.querySelector("img")).toBeNull();
    handle.dispose();
  });
});

describe("appearance", () => {
  it("shows the explicit unavailable label when appearance is null", () => {
    const { host, handle } = mount(baseSnapshot({ appearance: null }));
    expect(host.querySelector(".uiq-material-appearance-text")?.textContent).toBe("Appearance not supplied. Preview unavailable.");
    expect((host.querySelector(".uiq-material-appearance-cue") as HTMLElement).hidden).toBe(true);
    handle.dispose();
  });

  it.each(APPEARANCE_TEXTURES.map((t) => t.id))("renders the known texture %s cue at shine 0", (texture) => {
    const { host, handle } = mount(baseSnapshot({ appearance: { texture, shine: 0 } }));
    const cue = host.querySelector(".uiq-material-appearance-cue") as HTMLElement;
    expect(cue.hidden).toBe(false);
    expect(cue.classList.contains(`uiq-material-appearance-cue--${texture}`)).toBe(true);
    expect(cue.style.getPropertyValue("--uiq-material-shine")).toBe("0");
    const label = APPEARANCE_TEXTURES.find((t) => t.id === texture)!.label;
    expect(host.querySelector(".uiq-material-appearance-text")?.textContent).toBe(`Texture: ${label}. Shine: 0.`);
    handle.dispose();
  });

  it("renders shine at the upper boundary of 100", () => {
    const { host, handle } = mount(baseSnapshot({ appearance: { texture: "rib", shine: 100 } }));
    const cue = host.querySelector(".uiq-material-appearance-cue") as HTMLElement;
    expect(cue.hidden).toBe(false);
    expect(cue.style.getPropertyValue("--uiq-material-shine")).toBe("1");
    handle.dispose();
  });

  it("withholds the appearance preview cue when the texture is unknown, but keeps the raw value visible", () => {
    const { host, handle } = mount(
      baseSnapshot({ appearance: { texture: "plaid" as Appearance["texture"], shine: 10 } }),
    );
    const cue = host.querySelector(".uiq-material-appearance-cue") as HTMLElement;
    expect(cue.hidden).toBe(true);
    expect(host.querySelector(".uiq-material-appearance-text")?.textContent).toBe(
      "Appearance values supplied are invalid. Supplied texture: plaid, supplied shine: 10. Shown as supplied; not clamped. Review appearance: choose a listed texture and finite shine between 0 and 100.",
    );
    handle.dispose();
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY, 101])(
    "withholds the preview cue for invalid shine %s while showing the raw value",
    (shine) => {
      const { host, handle } = mount(baseSnapshot({ appearance: { texture: "woven", shine } }));
      const cue = host.querySelector(".uiq-material-appearance-cue") as HTMLElement;
      expect(cue.hidden).toBe(true);
      expect(host.querySelector(".uiq-material-appearance-text")?.textContent).toBe(
        `Appearance values supplied are invalid. Supplied texture: Fine weave, supplied shine: ${String(shine)}. Shown as supplied; not clamped. Review appearance: choose a listed texture and finite shine between 0 and 100.`,
      );
      handle.dispose();
    },
  );

  it("withholds the preview cue when a malformed appearance object is missing both fields", () => {
    const { host, handle } = mount(
      baseSnapshot({ appearance: {} as Appearance }),
    );
    const cue = host.querySelector(".uiq-material-appearance-cue") as HTMLElement;
    expect(cue.hidden).toBe(true);
    expect(host.querySelector(".uiq-material-appearance-text")?.textContent).toBe(
      "Appearance values supplied are invalid. Supplied texture: undefined, supplied shine: undefined. Shown as supplied; not clamped. Review appearance: choose a listed texture and finite shine between 0 and 100.",
    );
    handle.dispose();
  });

  it("withholds the preview cue when appearance is otherwise valid but color is invalid", () => {
    const { host, handle } = mount(baseSnapshot({ color: "not-a-color", appearance: VALID_APPEARANCE }));
    const cue = host.querySelector(".uiq-material-appearance-cue") as HTMLElement;
    expect(cue.hidden).toBe(true);
    expect(host.querySelector(".uiq-material-appearance-text")?.textContent).toBe("Texture: Fine weave. Shine: 40.");
    handle.dispose();
  });

  it.each(HOSTILE_STRINGS)("renders a hostile texture string %j literally, never as a class or style value", (raw) => {
    const { host, handle } = mount(
      baseSnapshot({ appearance: { texture: raw as Appearance["texture"], shine: 5 } }),
    );
    const cue = host.querySelector(".uiq-material-appearance-cue") as HTMLElement;
    expect(cue.hidden).toBe(true);
    expect(cue.className.split(" ")).toEqual(["uiq-material-appearance-cue"]);
    const text = host.querySelector(".uiq-material-appearance-text")!;
    expect(text.textContent).toContain(raw);
    expect(text.querySelector("script")).toBeNull();
    handle.dispose();
  });
});

describe("review actions", () => {
  it("exposes exactly two stable native buttons with the exact fixed labels and no preset chooser or Apply button", () => {
    const { host, handle } = mount(baseSnapshot());
    const buttons = Array.from(host.querySelectorAll("button"));
    expect(buttons).toHaveLength(2);
    expect(buttons.map((b) => b.textContent)).toEqual(["Review fabric", "Review appearance"]);
    expect(host.querySelector("select")).toBeNull();
    handle.dispose();
  });

  it("emits 'fabric' exactly once per click, with no payload mutation risk (primitive target)", () => {
    const { host, handle, onReview } = mount(baseSnapshot());
    const button = host.querySelector(".uiq-material-review-fabric") as HTMLButtonElement;
    button.click();
    expect(onReview).toHaveBeenCalledTimes(1);
    expect(onReview).toHaveBeenCalledWith("fabric");
    handle.dispose();
  });

  it("emits 'appearance' exactly once per click", () => {
    const { host, handle, onReview } = mount(baseSnapshot());
    const button = host.querySelector(".uiq-material-review-appearance") as HTMLButtonElement;
    button.click();
    expect(onReview).toHaveBeenCalledTimes(1);
    expect(onReview).toHaveBeenCalledWith("appearance");
    handle.dispose();
  });

  it("does not disable either review button for unknown/mismatch/invalid states", () => {
    const { host, handle } = mount(
      baseSnapshot({
        fabric: null,
        easeGuidance: null,
        compatibility: { state: "mismatch", detail: "x" },
        color: "invalid",
        appearance: null,
      }),
    );
    const fabricButton = host.querySelector(".uiq-material-review-fabric") as HTMLButtonElement;
    const appearanceButton = host.querySelector(".uiq-material-review-appearance") as HTMLButtonElement;
    expect(fabricButton.disabled).toBe(false);
    expect(appearanceButton.disabled).toBe(false);
    handle.dispose();
  });

  it("never calls onReview on mount or update", () => {
    const onReview = vi.fn();
    const { handle } = mount(baseSnapshot(), onReview);
    handle.update(baseSnapshot({ revisionLabel: "next" }));
    expect(onReview).not.toHaveBeenCalled();
    handle.dispose();
  });

  it("supports a synchronous controlled update triggered from inside the onReview callback, preserving the clicked button node and focus", () => {
    const host = document.createElement("div");
    document.body.append(host);
    let handle: { update(s: MaterialSnapshot): void; dispose(): void };
    const onReview = vi.fn(() => {
      handle.update(baseSnapshot({ revisionLabel: "updated-from-callback" }));
    });
    handle = mountMaterialPanel(host, { snapshot: baseSnapshot(), onReview });

    const button = host.querySelector(".uiq-material-review-fabric") as HTMLButtonElement;
    button.focus();
    expect(document.activeElement).toBe(button);

    button.click();

    expect(onReview).toHaveBeenCalledTimes(1);
    expect(host.querySelector(".uiq-material-review-fabric")).toBe(button);
    expect(document.activeElement).toBe(button);
    expect(host.querySelector(".uiq-material-revision")?.textContent).toBe("updated-from-callback");
    handle.dispose();
  });
});

describe("lifecycle: disposal and update", () => {
  it("disposal is idempotent and removes the owned root", () => {
    const { host, handle } = mount(baseSnapshot());
    expect(host.querySelector(".uiq-material")).not.toBeNull();
    handle.dispose();
    expect(host.querySelector(".uiq-material")).toBeNull();
    expect(() => handle.dispose()).not.toThrow();
  });

  it("update after disposal is inert and does not re-add the root or throw", () => {
    const { host, handle } = mount(baseSnapshot());
    handle.dispose();
    expect(() => handle.update(baseSnapshot({ revisionLabel: "ignored" }))).not.toThrow();
    expect(host.querySelector(".uiq-material")).toBeNull();
  });

  it("a detached, obsolete button reference cannot emit a callback after disposal", () => {
    const { host, handle, onReview } = mount(baseSnapshot());
    const button = host.querySelector(".uiq-material-review-fabric") as HTMLButtonElement;
    handle.dispose();
    button.click();
    expect(onReview).not.toHaveBeenCalled();
  });

  it("a controlled update keeps the same button nodes (keyed identity across re-render)", () => {
    const { host, handle } = mount(baseSnapshot());
    const fabricButtonBefore = host.querySelector(".uiq-material-review-fabric");
    const appearanceButtonBefore = host.querySelector(".uiq-material-review-appearance");

    handle.update(
      baseSnapshot({
        revisionLabel: "Revision 2",
        fabric: CUSTOM_FABRIC,
        compatibility: { state: "unknown", detail: "re-evaluated" },
        color: "#112233",
        appearance: { texture: "heather", shine: 60 },
      }),
    );

    expect(host.querySelector(".uiq-material-review-fabric")).toBe(fabricButtonBefore);
    expect(host.querySelector(".uiq-material-review-appearance")).toBe(appearanceButtonBefore);
    expect(host.querySelector(".uiq-material-revision")?.textContent).toBe("Revision 2");
    expect(host.querySelector(".uiq-material-fabric-name")?.textContent).toContain("Mystery blend");
    handle.dispose();
  });

  it("does not attach duplicate listeners across repeated updates (no accumulated obsolete handlers)", () => {
    const { host, handle, onReview } = mount(baseSnapshot());
    handle.update(baseSnapshot({ revisionLabel: "2" }));
    handle.update(baseSnapshot({ revisionLabel: "3" }));
    (host.querySelector(".uiq-material-review-fabric") as HTMLButtonElement).click();
    expect(onReview).toHaveBeenCalledTimes(1);
    handle.dispose();
  });
});

describe("isolation", () => {
  it("requires the combined root for every component selector (no bare .uiq-material-* rule)", () => {
    const css = readFileSync("src/ui/enhancements/material/material-panel.css", "utf8");
    expect(css).not.toMatch(/(?:^|\n)\s*\.uiq-material-[a-z-]+\s*[,{]/);
    expect(css).not.toMatch(/(?:^|\n)\s*\.uiq-material\s*[,{]/);
    expect(css).toContain(".uiq-foundation.uiq-material {");
    expect(css).toContain(".uiq-foundation.uiq-material .uiq-material-fabric-heading");
  });

  it("does not touch the document head or any unrelated sibling", () => {
    const headCountBefore = document.head.children.length;
    const sibling = document.createElement("div");
    sibling.className = "unrelated-sibling";
    document.body.append(sibling);
    const bodyCountBefore = document.body.children.length;

    const { handle } = mount(baseSnapshot());

    expect(document.head.children.length).toBe(headCountBefore);
    expect(sibling.className).toBe("unrelated-sibling");
    expect(sibling.children).toHaveLength(0);
    expect(document.body.children.length).toBe(bodyCountBefore + 1);

    sibling.remove();
    handle.dispose();
  });

  it("every supplied string renders through textContent only, never through innerHTML parsing, across a combined hostile snapshot", () => {
    const hostile = baseSnapshot({
      revisionLabel: HOSTILE_STRINGS[0],
      easeGuidance: HOSTILE_STRINGS[1],
      compatibility: { state: "mismatch", detail: HOSTILE_STRINGS[2] },
      color: HOSTILE_STRINGS[3],
      fabric: deepFreeze({ name: HOSTILE_STRINGS[4], family: "woven", stretchPercent: 0 }),
      appearance: { texture: HOSTILE_STRINGS[5] as Appearance["texture"], shine: 1 },
    });
    const { host, handle } = mount(hostile);
    expect(host.querySelector("script")).toBeNull();
    expect((globalThis as { __pwned_material?: boolean }).__pwned_material).toBeUndefined();
    handle.dispose();
  });
});
