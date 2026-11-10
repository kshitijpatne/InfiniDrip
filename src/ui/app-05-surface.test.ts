// @vitest-environment jsdom

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { mountApp, unmountApp, stageBlockerFromNote } from "./app";

import { GARMENTS, STANDARD_M } from "../drafting";

function mount(options: Parameters<typeof mountApp>[1] = {}): HTMLDivElement {
  const root = document.createElement("div");
  mountApp(root, options);
  mountedRoots.add(root);
  return root;
}

type TrackedWindowListener = {
  readonly type: string;
  readonly listener: EventListenerOrEventListenerObject;
  readonly options?: boolean | AddEventListenerOptions;
};

const mountedRoots = new Set<HTMLDivElement>();

const trackedWindowListeners: TrackedWindowListener[] = [];

const addNativeWindowListener = window.addEventListener.bind(window);

const removeNativeWindowListener = window.removeEventListener.bind(window);

const clickId = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLElement>(`#${id}`)!.click();
};

const clickIfPresent = (root: HTMLElement, id: string): void => {
    root.querySelector<HTMLElement>(`#${id}`)?.click();
};

/** Navigate the real reviewed path used by export-writer tests. */
const reachExportStage = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-start");
    clickId(root, "journey-step-fit");
    clickId(root, "journey-next"); // accept the current Style choices → Check
    clickId(root, "journey-next"); // reviewed Check → Export
};

beforeEach(() => {
  trackedWindowListeners.length = 0;
  vi.spyOn(window, "addEventListener").mockImplementation((type, listener, options) => {
    trackedWindowListeners.push({ type, listener, options });
    addNativeWindowListener(type, listener, options);
  });
});

afterEach(() => {
  unmountApp();
  for (const { type, listener, options } of trackedWindowListeners) {
    removeNativeWindowListener(type, listener, options);
  }
  trackedWindowListeners.length = 0;
  for (const root of mountedRoots) root.remove();
  mountedRoots.clear();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});



describe("surface artwork panel (Slice 126)", () => {
  const toFitStep = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
  };
  const addArtwork = (root: HTMLElement, id: string, role = "front"): void => {
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = id;
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = role;
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
  };
  const widthInput = (root: HTMLElement): HTMLInputElement =>
    root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="widthCm"]')!;

  it("renders the panel with an add form on the fit step", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    expect(root.querySelector("#style-host")!.textContent).toContain("Surface");
    expect(root.querySelector("#surface-add")).not.toBeNull();
    expect(root.querySelector("#style-host")!.textContent).toContain("No artwork placements on");
  });

  it("rejects empty and duplicate names without adding anything", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("Name the artwork");
    addArtwork(root, "chest-print");
    addArtwork(root, "chest-print");
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("already exists");
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "ok";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelector("#surface-form-error")!.textContent).toContain("piece role");
  });

  it("adds a placement with a true-scale preview polygon", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);
    const polygon = root.querySelector('#surface-preview polygon[data-placement="chest-print"]')!;
    expect(polygon.getAttribute("points")).toBe("2,2 22,2 22,27 2,27");
    expect(polygon.getAttribute("data-piece")).toBe("front");
    expect(polygon.getAttribute("stroke")).toBe("currentColor");
  });

  it("creates a placement with its entered size and optional provenance reference", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "hem-print";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    root.querySelector<HTMLInputElement>("#surface-new-width")!.value = "12";
    root.querySelector<HTMLInputElement>("#surface-new-height")!.value = "15";
    root.querySelector<HTMLInputElement>("#surface-new-source")!.value = "Studio archive · https://example.test/art";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();

    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="widthCm"]')!.value).toBe("12");
    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="heightCm"]')!.value).toBe("15");
    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="sourceName"]')!.value)
      .toBe("Studio archive · https://example.test/art");
    expect(root.querySelector('#surface-preview polygon[data-placement="hem-print"]')!.getAttribute("points"))
      .toBe("2,2 14,2 14,17 2,17");
  });

  it("suggests the current garment's exact piece roles, including lower-body roles", () => {
    localStorage.clear();
    const root = mount();
    clickId(root, "garment-trouser");
    toFitStep(root);
    const roles = [...root.querySelectorAll<HTMLOptionElement>("#surface-piece-role-options option")]
      .map((option) => option.value);
    expect(roles).toContain("frontLeft");
    expect(roles).toContain("backRight");

    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "front-panel-print";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "frontLeft";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="pieceRole"]')!.value)
      .toBe("frontLeft");
    expect(root.querySelector("#guidance-host")!.textContent).not.toContain("is not in the current block");
  });

  it("falls back to manual role entry when the current draft cannot supply roles", () => {
    localStorage.clear();
    const root = mount();
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "101";
    chest.dispatchEvent(new Event("input", { bubbles: true }));

    const trouser = GARMENTS.find((recipe) => recipe.name === "trouser")!;
    const draft = trouser.draft;
    const unavailable = vi.spyOn(trouser, "draft").mockImplementation((measurements, options) => {
      if (measurements === STANDARD_M) throw new Error("Role structure unavailable");
      return draft(measurements, options);
    });
    try {
      clickId(root, "garment-trouser");
      expect(root.querySelectorAll<HTMLOptionElement>("#surface-piece-role-options option")).toHaveLength(0);
      expect(root.querySelector("#surface-new-role-help")!.textContent)
        .toContain("Role suggestions are unavailable");
    } finally {
      unavailable.mockRestore();
    }
  });

  it("keeps an invalid creation dimension visible and gives field-specific feedback", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "invalid-size";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    const width = root.querySelector<HTMLInputElement>("#surface-new-width")!;
    width.value = "0";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    expect(width.value).toBe("0");
    expect(width.getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#surface-form-error")!.textContent).toBe("Enter a placement width above 0 cm.");
  });

  it("rejects a blank placement height without filling or hiding the input", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    toFitStep(root);
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = "blank-height";
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = "front";
    const height = root.querySelector<HTMLInputElement>("#surface-new-height")!;
    height.value = "";
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    expect(height.value).toBe("");
    expect(height.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(height);
    expect(root.querySelector("#surface-form-error")!.textContent).toBe("Enter a placement height above 0 cm.");
  });

  it("keeps invalid values visible with an actionable error while drafting continues", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const gateBefore = root.querySelector<HTMLButtonElement>("#export-svg")!.disabled;
    const width = widthInput(root);
    width.value = "0";
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(widthInput(root).getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#error-surface-0")!.textContent).toContain("widthCm");
    expect(widthInput(root).value).toBe("0");
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    expect(root.querySelector<HTMLButtonElement>("#export-svg")!.disabled).toBe(gateBefore);
    expect(root.querySelector("#surface-preview polygon")).toBeNull();
    expect(root.querySelector<HTMLElement>("[data-surface-preview-shell]")!.hidden).toBe(true);
    const retry = widthInput(root);
    retry.value = "abc";
    retry.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(widthInput(root).getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#error-surface-0")!.textContent).toContain("widthCm");
  });

  it("recovers through the stepper and the kind select", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const broken = widthInput(root);
    broken.value = "abc";
    broken.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(widthInput(root).getAttribute("aria-invalid")).toBe("true");
    const control = widthInput(root).closest<HTMLElement>("[data-range-control]")!;
    control.querySelector<HTMLButtonElement>('button[data-step-direction="1"]')!.click();
    expect(widthInput(root).getAttribute("aria-invalid")).toBe("false");
    expect(root.querySelector("#surface-preview polygon")).not.toBeNull();
    const kind = root.querySelector<HTMLSelectElement>('select[data-surface-index="0"]')!;
    kind.value = "patch";
    kind.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector('#surface-preview polygon[data-placement="chest-print"]')!.getAttribute("data-kind")).toBe("patch");
  });

  it("edits transform fields into the nested transform", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const dx = root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="dx"]')!;
    dx.value = "5";
    dx.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="dx"]')!.value).toBe("5");
    expect(root.querySelector("#error-surface-0")!.textContent).toBe("");
    const rotation = root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="rotationDeg"]')!;
    rotation.value = "90";
    rotation.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(root.querySelector('#surface-preview polygon[data-placement="chest-print"]')!.getAttribute("points"))
      .toBe("27,2 27,22 2,22 2,2");
    expect(root.querySelector("#error-surface-0")!.textContent).toBe("");
  });

  it("does not replace a manually edited numeric field while capturing raw input", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    toFitStep(root);
    addArtwork(root, "chest-print");
    const width = widthInput(root);
    width.focus();
    width.value = "3";
    width.dispatchEvent(new Event("input", { bubbles: true }));
    expect(widthInput(root)).toBe(width);
    widthInput(root).value = "37";
    widthInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    expect(widthInput(root).value).toBe("37");
    expect(widthInput(root)).toBe(width);
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(root.querySelector("#error-surface-0")!.textContent).toBe("");
    root.remove();
  });

  it("removes a placement explicitly", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    root.querySelector<HTMLButtonElement>('button[data-surface-remove-index="0"]')!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    expect(root.querySelector("#style-host")!.textContent).toContain("No artwork placements on");
  });

  it("round-trips artwork, including raw invalid values, through save and load", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const width = widthInput(root);
    width.value = "0";
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
    clickId(root, "save-pattern");
    expect(localStorage.getItem("patternworks_save_v1")).toContain("chest-print");
    widthInput(root).value = "10";
    widthInput(root).dispatchEvent(new Event("focusout", { bubbles: true }));
    root.querySelector<HTMLButtonElement>('button[data-surface-remove-index="0"]')!.click();
    clickId(root, "load-pattern");
    clickId(root, "workspace-confirm-accept");
    expect(widthInput(root).value).toBe("0");
    expect(root.querySelector("#error-surface-0")!.textContent).toContain("widthCm");
  });

  it("loads pre-surface saves with an empty set", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    clickId(root, "save-pattern");
    const raw = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    delete raw.surface;
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const reloaded = mount();
    toFitStep(reloaded);
    expect(reloaded.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    expect(reloaded.querySelector("#style-host")!.textContent).toContain("No artwork placements on");
  });

  it("isolates artwork sets per style and shares them across sizes", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    const styles = [...root.querySelectorAll<HTMLButtonElement>("[data-style-target]")]
      .map((card) => card.dataset.styleTarget!);
    expect(styles.length).toBeGreaterThan(1);
    addArtwork(root, "chest-print");
    const current = root.querySelector<HTMLSelectElement>("#style-target")!.value;
    const other = styles.find((name) => name !== current)!;
    root.querySelector<HTMLButtonElement>(`[data-style-target="${other}"]`)!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
    root.querySelector<HTMLButtonElement>(`[data-style-target="${current}"]`)!.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);
  });

  it("renders the panel for all seven garments with the assembled preview intact", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    for (const garment of ["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"]) {
      root.querySelector<HTMLButtonElement>(`#garment-${garment}`)!.dispatchEvent(new Event("click"));
      expect(root.querySelector("#surface-add")).not.toBeNull();
      expect(root.querySelector("#garment-host svg")).not.toBeNull();
    }
    root.querySelector<HTMLButtonElement>("#assembled-preview-toggle")!
      .dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.querySelector<HTMLElement>("#garment-host")!.hidden).toBe(false);
    expect(root.querySelector("#garment-host svg")).not.toBeNull();
  });

  it("renders at narrow and wide widths without errors", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    toFitStep(root);
    addArtwork(root, "chest-print");
    const viewport = root.querySelector<HTMLElement>("#inspection-viewport")!;
    for (const width of [1280, 900, 700, 560, 390]) {
      Object.defineProperty(viewport, "clientWidth", { configurable: true, value: width });
      window.dispatchEvent(new Event("resize"));
      expect(root.querySelector("#surface-add")).not.toBeNull();
      expect(root.querySelector('#surface-preview polygon[data-placement="chest-print"]')).not.toBeNull();
    }
    root.remove();
  });

  it("treats a cleared field as explicitly incomplete", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const width = root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="widthCm"]')!;
    width.value = "";
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(root.querySelector("#error-surface-0")!.textContent).toContain("widthCm");
    expect(root.querySelector("#surface-preview polygon")).toBeNull();
    expect(root.querySelector<HTMLElement>("[data-surface-preview-shell]")!.hidden).toBe(true);
  });

  it("ignores stray surface controls that name no row", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    const ghost = document.createElement("input");
    ghost.setAttribute("data-surface-index", "99");
    ghost.setAttribute("data-surface-field", "widthCm");
    root.querySelector("#style-host")!.appendChild(ghost);
    root.querySelector("#style-host")!.dispatchEvent(new Event("surface-step", { bubbles: true }));
    ghost.dispatchEvent(new Event("surface-step", { bubbles: true }));
    ghost.value = "5";
    ghost.dispatchEvent(new Event("input", { bubbles: true }));
    const ghostRemove = document.createElement("button");
    ghostRemove.setAttribute("data-surface-remove-index", "99");
    root.querySelector("#style-host")!.appendChild(ghostRemove);
    ghostRemove.click();
    const ghostNaN = document.createElement("button");
    ghostNaN.setAttribute("data-surface-remove-index", "abc");
    root.querySelector("#style-host")!.appendChild(ghostNaN);
    ghostNaN.click();
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(1);
    expect(root.querySelector('#surface-preview polygon[data-placement="chest-print"]')).not.toBeNull();
  });

  it("ignores typing in the add form until Add is pressed", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    const name = root.querySelector<HTMLInputElement>("#surface-new-id")!;
    name.value = "draft";
    name.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelectorAll("[data-surface-row]")).toHaveLength(0);
  });

  it("survives a hostile save and recovers through explicit edits", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    clickId(root, "save-pattern");
    const raw = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    const key = Object.keys(raw.surface)[0];
    raw.surface[key].placements.push({
      id: "hostile", kind: "print", pieceRole: "front", widthCm: 20, heightCm: 25,
      transform: null, zOrder: 1, sourceName: "",
    });
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const reloaded = mount();
    toFitStep(reloaded);
    expect(reloaded.querySelectorAll("[data-surface-row]")).toHaveLength(2);
    expect(reloaded.querySelector("#error-surface-1")!.textContent).toContain("Transform");
    const dx = reloaded.querySelector<HTMLInputElement>('input[data-surface-index="1"][data-surface-field="dx"]')!;
    dx.value = "2";
    dx.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(reloaded.querySelector("#error-surface-1")!.textContent).toBe("");
    expect(reloaded.querySelectorAll('#surface-preview polygon')).toHaveLength(2);
  });
});



describe("surface output (Slice 127)", () => {
  const toFitStep = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
  };
  const addArtwork = (root: HTMLElement, id: string, role = "front"): void => {
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = id;
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = role;
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
  };
  const captureDownloads = (): string[] => {
    const created: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      created.push(this.download);
    });
    return created;
  };

  it("disables the print sheet with an artwork reason when the style is empty", () => {
    localStorage.clear();
    const root = mount();
    captureDownloads();
    reachExportStage(root);
    const button = root.querySelector<HTMLButtonElement>("#export-surface-sheet")!;
    expect(button.disabled).toBe(true);
    expect(button.title).toBe("Add artwork on the Style panel first.");
  });

  it("downloads the print sheet for the current style, ignoring the size picker", () => {
    localStorage.clear();
    const root = mount();
    const created = captureDownloads();
    toFitStep(root);
    addArtwork(root, "chest-print");
    reachExportStage(root);
    const button = root.querySelector<HTMLButtonElement>("#export-surface-sheet")!;
    expect(button.disabled).toBe(false);
    const size = root.querySelector<HTMLSelectElement>("#export-size")!;
    const opts = [...root.querySelectorAll<HTMLOptionElement>("#export-size option")];
    size.value = opts[opts.length - 1].value;
    size.dispatchEvent(new Event("change"));
    button.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tee-surface-sheet.svg"]);
  });

  it("downloads the tech pack with the artwork section for the current style", () => {
    localStorage.clear();
    const root = mount();
    const created = captureDownloads();
    toFitStep(root);
    addArtwork(root, "chest-print");
    reachExportStage(root);
    root.querySelector<HTMLButtonElement>("#export-techpack")!.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tee-techpack.pdf"]);
  });

  it("leaves export filenames stable when the style is empty", () => {
    localStorage.clear();
    const root = mount();
    const created = captureDownloads();
    reachExportStage(root);
    root.querySelector<HTMLButtonElement>("#export-svg")!.dispatchEvent(new Event("click"));
    root.querySelector<HTMLButtonElement>("#export-techpack")!.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tee-M.svg", "tee-techpack.pdf"]);
  });
});



describe("surface guidance (Slice 128)", () => {
  const toFitStep = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
  };
  const addArtwork = (root: HTMLElement, id: string, role = "front"): void => {
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = id;
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = role;
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
  };
  const breakWidth = (root: HTMLElement): void => {
    const width = root.querySelector<HTMLInputElement>(
      'input[data-surface-index="0"][data-surface-field="widthCm"]')!;
    width.value = "0";
    width.dispatchEvent(new Event("focusout", { bubbles: true }));
  };

  it("routes surface fields to the fit step for correction", () => {
    expect(stageBlockerFromNote({ level: "warn", text: "x", field: "surface-0-widthCm" })).toEqual({
      message: "x", step: "fit", field: "surface-0-widthCm",
    });
  });

  it("shows artwork warnings in guidance with a Review action", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    breakWidth(root);
    const host = root.querySelector("#guidance-host")!;
    expect(host.textContent).toContain("Artwork 'chest-print'");
    expect(host.textContent).toContain("widthCm");
    const review = host.querySelector<HTMLButtonElement>('button[data-guidance-focus="surface-0-widthCm"]')!;
    expect(review).not.toBeNull();
  });

  it("focuses the failing control from the Review action", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    try {
      toFitStep(root);
      addArtwork(root, "chest-print");
      breakWidth(root);
      const focused: Element[] = [];
      const spy = vi.spyOn(HTMLInputElement.prototype, "focus").mockImplementation(
        function (this: HTMLInputElement) { focused.push(this); });
      try {
        root.querySelector<HTMLButtonElement>('button[data-guidance-focus="surface-0-widthCm"]')!.click();
        // Review navigates (setView redraws), so resolve the control post-click.
        const fresh = root.querySelector('input[data-guidance-control="surface-0-widthCm"]')!;
        expect(focused).toContain(fresh);
      } finally {
        spy.mockRestore();
      }
    } finally {
      root.remove();
    }
  });

  it("dismisses the warning until a pattern change brings it back", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    breakWidth(root);
    const host = (): string => root.querySelector("#guidance-host")!.textContent ?? "";
    const ignoredRow = (): string | null =>
      root.querySelector('[data-guidance-field="surface-0-widthCm"][data-guidance-ignored]')?.textContent ?? null;
    root.querySelector<HTMLButtonElement>('button[data-ignore-guidance="surface-0-widthCm"]')!.click();
    expect(ignoredRow()).toContain("Set aside for this draft");
    root.querySelector<HTMLButtonElement>('button[data-restore-guidance="surface-0-widthCm"]')!.click();
    expect(host()).toContain("Artwork 'chest-print'");
    expect(ignoredRow()).toBeNull();
    root.querySelector<HTMLButtonElement>('button[data-ignore-guidance="surface-0-widthCm"]')!.click();
    const ghost = document.createElement("button");
    ghost.setAttribute("data-ignore-guidance", "");
    root.querySelector("#guidance-host")!.append(ghost);
    ghost.click();
    const dx = root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="dx"]')!;
    dx.value = "3";
    dx.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(ignoredRow()).toContain("Set aside for this draft");
    const chest = root.querySelector<HTMLInputElement>('input[data-field="chest"]')!;
    chest.value = "101";
    chest.dispatchEvent(new Event("input"));
    expect(ignoredRow()).toBeNull();
    expect(host()).toContain("Artwork 'chest-print'");
  });

  it("keeps artwork warnings visible on the Check view without gating exports", () => {
    localStorage.clear();
    const root = mount();
    const created: string[] = [];
    URL.createObjectURL = vi.fn(() => "blob:test");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn(function (this: HTMLAnchorElement) {
      created.push(this.download);
    });
    toFitStep(root);
    addArtwork(root, "chest-print");
    breakWidth(root);
    root.querySelector<HTMLButtonElement>("#view-check")!.dispatchEvent(new Event("click"));
    expect(root.querySelector<HTMLButtonElement>("#view-check")!.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("Artwork 'chest-print'");
    reachExportStage(root);
    root.querySelector<HTMLButtonElement>("#export-svg")!.dispatchEvent(new Event("click"));
    expect(created).toEqual(["tee-M.svg"]);
  });
});



describe("surface frame guidance (Slice 130)", () => {
  const toFitStep = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
  };
  const addArtwork = (root: HTMLElement, id: string, role = "front"): void => {
    root.querySelector<HTMLInputElement>("#surface-new-id")!.value = id;
    root.querySelector<HTMLInputElement>("#surface-new-role")!.value = role;
    root.querySelector<HTMLButtonElement>("#surface-add")!.click();
  };
  const setNumeric = (root: HTMLElement, index: number, field: string, value: string): void => {
    const input = root.querySelector<HTMLInputElement>(
      `input[data-surface-index="${index}"][data-surface-field="${field}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event("focusout", { bubbles: true }));
  };

  it("repairs an empty name through Review focus on the Name input", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    clickId(root, "save-pattern");
    const raw = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    const key = Object.keys(raw.surface)[0];
    raw.surface[key].placements[0].id = "";
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const reloaded = mount();
    toFitStep(reloaded);
    expect(reloaded.querySelector("#guidance-host")!.textContent).toContain("Placement id");
    const focused: Element[] = [];
    const spy = vi.spyOn(HTMLInputElement.prototype, "focus").mockImplementation(
      function (this: HTMLInputElement) { focused.push(this); });
    try {
      reloaded.querySelector<HTMLButtonElement>('button[data-guidance-focus="surface-0-id"]')!.click();
      const fresh = reloaded.querySelector('input[data-guidance-control="surface-0-id"]')!;
      expect(focused).toContain(fresh);
    } finally {
      spy.mockRestore();
    }
    const name = reloaded.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="id"]')!;
    name.value = "chest-print";
    name.dispatchEvent(new Event("focusout", { bubbles: true }));
    expect(reloaded.querySelector("#error-surface-0")!.textContent).toBe("");
    expect(reloaded.querySelector("#guidance-host")!.textContent).not.toContain("Placement id");
  });

  it("warns when artwork leaves its piece and when it covers the whole piece", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    setNumeric(root, 0, "scale", "10");
    const host = root.querySelector("#guidance-host")!.textContent ?? "";
    expect(host).toContain("extends beyond the front piece");
    expect(host).toContain("covers about");
    expect(host).toContain("full-coverage print intent");
  });

  it("names unknown piece roles with the available choices", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print", "hood");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("not in the current block");
  });

  it("warns below the print floor for rated sources and stays silent otherwise", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    expect(root.querySelector("#guidance-host")!.textContent).not.toContain("px/cm");
    setNumeric(root, 0, "sourcePxWidth", "200");
    setNumeric(root, 0, "sourcePxHeight", "200");
    const host = root.querySelector("#guidance-host")!.textContent ?? "";
    expect(host).toContain("about 8 px/cm");
    expect(host).toContain("59 px/cm floor");
  });

  it("treats cleared optional source dimensions as unknown, not invalid", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    setNumeric(root, 0, "sourcePxWidth", "2400");
    setNumeric(root, 0, "sourcePxWidth", "");
    expect(root.querySelector("#error-surface-0")!.textContent).toBe("");
    expect(root.querySelector("#guidance-host")!.textContent).not.toContain("px/cm");
  });

  it("round-trips source dimensions through save and load", () => {
    localStorage.clear();
    const root = mount();
    toFitStep(root);
    addArtwork(root, "chest-print");
    setNumeric(root, 0, "sourcePxWidth", "2400");
    clickId(root, "save-pattern");
    expect(localStorage.getItem("patternworks_save_v1")).toContain("2400");
    setNumeric(root, 0, "sourcePxWidth", "100");
    clickId(root, "load-pattern");
    clickId(root, "workspace-confirm-accept");
    expect(root.querySelector<HTMLInputElement>('input[data-surface-index="0"][data-surface-field="sourcePxWidth"]')!.value).toBe("2400");
  });
});



describe("nesting intelligence (Slice 133)", () => {
  const toFabricView = (root: HTMLElement): void => {
    clickIfPresent(root, "welcome-skip");
    clickId(root, "journey-step-fit");
    clickId(root, "journey-next");
    clickId(root, "journey-next");
    root.querySelector<HTMLButtonElement>("#view-fabric")!.dispatchEvent(new Event("click"));
  };
  const bufferInput = (root: HTMLElement): HTMLInputElement =>
    root.querySelector<HTMLInputElement>("#nest-buffer")!;
  const availableInput = (root: HTMLElement): HTMLInputElement =>
    root.querySelector<HTMLInputElement>("#nest-available")!;

  it("routes nesting fields to the output step for correction", () => {
    expect(stageBlockerFromNote({ level: "warn", text: "x", field: "nesting-buffer" })).toEqual({
      message: "x", step: "output", field: "nesting-buffer",
    });
  });

  it("renders planning controls and estimate readouts on the fabric view", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    expect(root.querySelector("#nest-intel-host")).not.toBeNull();
    expect(bufferInput(root).value).toBe("10");
    expect(availableInput(root).value).toBe("");
    expect(root.querySelector("#nest-required")!.textContent).toContain("Requires");
    expect(root.querySelector("#nest-required")!.textContent).toContain("cm of cloth");
    expect(root.querySelector("#nest-planned")!.textContent).toContain("Planned with buffer:");
    expect(root.querySelector("#nest-waste")!.textContent).toContain("Waste:");
    expect(root.querySelector("#nest-waste")!.textContent).toContain("% of cloth");
    expect(root.querySelector("#nest-verdict")!.textContent).toContain("unknown");
    expect(root.querySelector("#nest-nap-notice")!.textContent).toContain("never rotate");
    expect(root.querySelector("#nest-readout")!.classList.contains("nest-readout--clarity")).toBe(true);
    expect(root.querySelector("#nest-planned")!.textContent).not.toMatch(/ · $/);
  });

  it("retains the exact legacy Nesting readout when UIQ-06 is disabled", () => {
    localStorage.clear();
    const root = mount({ uiqOperationalClarityEnabled: false });
    toFabricView(root);
    expect(root.querySelector("#nest-readout")!.tagName).toBe("DIV");
    expect(root.querySelector("#nest-readout")!.classList.contains("nest-readout--clarity")).toBe(false);
    expect(root.querySelector("#nest-required")!.textContent).toMatch(/ · $/);
    expect(root.querySelector("#nest-verdict")!.textContent).toContain("Fit:");
  });

  it("renders the estimate for all seven garments without leaking values", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    const buffer = bufferInput(root);
    buffer.value = "25";
    buffer.dispatchEvent(new Event("input", { bubbles: true }));
    for (const garment of ["tee", "fitted", "tank", "polo", "woven-shirt", "skirt", "trouser"]) {
      root.querySelector<HTMLButtonElement>(`#garment-${garment}`)!.dispatchEvent(new Event("click"));
      expect(root.querySelector("#nest-required")!.textContent).toContain("Requires");
      expect(root.querySelector("#nest-planned")!.textContent).toContain("Planned with buffer:");
      expect(root.querySelector("#nest-waste")!.textContent).toContain("% of cloth");
      expect(bufferInput(root).value).toBe("25");
    }
    expect(root.querySelector("#garment-host svg")).not.toBeNull();
  });

  it("recomputes truthfully across single-size and marker scopes", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    const singleRequired = root.querySelector("#nest-required")!.textContent;
    const singleScope = root.querySelector("#nest-intel-scope")!.textContent;
    expect(singleScope).toContain("Single size");
    root.querySelector<HTMLButtonElement>("#nest-marker")!.click();
    expect(root.querySelector("#nest-intel-scope")!.textContent).toContain("Graded marker");
    expect(root.querySelector("#nest-required")!.textContent).not.toBe(singleRequired);
    root.querySelector<HTMLButtonElement>("#nest-single")!.click();
    expect(root.querySelector("#nest-required")!.textContent).toBe(singleRequired);
  });

  it("keeps invalid buffer visible with guidance while drafting continues", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    const buffer = bufferInput(root);
    buffer.value = "60";
    buffer.dispatchEvent(new Event("input", { bubbles: true }));
    expect(bufferInput(root).getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#error-nest-buffer")!.textContent).toContain("0–50");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("Cutting buffer");
    expect(root.querySelector("#canvas-host svg")).not.toBeNull();
    expect(root.querySelector("#nest-planned")!.textContent).toContain("unavailable");
    buffer.value = "";
    buffer.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector("#error-nest-buffer")!.textContent).toContain("finite");
  });

  it("judges fits and shortage against fabric on hand", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    const available = availableInput(root);
    available.value = "10000";
    available.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector("#nest-verdict")!.textContent).toBe("Fit: fits the fabric on hand.");
    available.value = "1";
    available.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector("#nest-verdict")!.textContent).toContain("short by");
    expect(root.querySelector("#nest-verdict")!.textContent).toContain("cm.");
    available.value = "0";
    available.dispatchEvent(new Event("input", { bubbles: true }));
    expect(availableInput(root).getAttribute("aria-invalid")).toBe("true");
    expect(root.querySelector("#guidance-host")!.textContent).toContain("Fabric on hand");
  });

  it("toggles the directional notice without changing placements", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    const before = root.querySelector("#canvas-host")!.innerHTML;
    const nap = root.querySelector<HTMLInputElement>("#nest-nap")!;
    expect(nap.checked).toBe(true);
    nap.checked = false;
    nap.dispatchEvent(new Event("change", { bubbles: true }));
    expect(root.querySelector("#nest-nap-notice")!.textContent).toContain("no rotation");
    expect(root.querySelector("#canvas-host")!.innerHTML).toBe(before);
  });

  it("focuses the failing control from the Review action", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    try {
      toFabricView(root);
      bufferInput(root).value = "60";
      bufferInput(root).dispatchEvent(new Event("input", { bubbles: true }));
      const focused: Element[] = [];
      const spy = vi.spyOn(HTMLInputElement.prototype, "focus").mockImplementation(
        function (this: HTMLInputElement) { focused.push(this); });
      try {
        root.querySelector<HTMLButtonElement>('button[data-guidance-focus="nesting-buffer"]')!.click();
        const fresh = root.querySelector('input[data-guidance-control="nesting-buffer"]')!;
        expect(focused).toContain(fresh);
      } finally {
        spy.mockRestore();
      }
    } finally {
      root.remove();
    }
  });

  it("round-trips planning values through save and load", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    bufferInput(root).value = "25";
    bufferInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    availableInput(root).value = "300";
    availableInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    const napBox = root.querySelector<HTMLInputElement>("#nest-nap")!;
    napBox.checked = false;
    napBox.dispatchEvent(new Event("change", { bubbles: true }));
    clickId(root, "save-pattern");
    bufferInput(root).value = "10";
    bufferInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, "load-pattern");
    clickId(root, "workspace-confirm-accept");
    expect(bufferInput(root).value).toBe("25");
    expect(availableInput(root).value).toBe("300");
    expect(root.querySelector<HTMLInputElement>("#nest-nap")!.checked).toBe(false);
    expect(root.querySelector("#nest-verdict")!.textContent).toContain("Fit:");
  });

  it("rejects an invalid buffer visibly at save time", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    bufferInput(root).value = "60";
    bufferInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, "save-pattern");
    expect(root.querySelector("#persist-status")!.textContent).toContain("Save failed");
    expect(root.querySelector("#persist-status")!.textContent).toContain("nesting intelligence");
    bufferInput(root).value = "";
    bufferInput(root).dispatchEvent(new Event("input", { bubbles: true }));
    clickId(root, "save-pattern");
    expect(root.querySelector("#persist-status")!.textContent).toContain("Save failed");
  });

  it("loads a null on-hand value as a blank input", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    clickId(root, "save-pattern");
    const raw = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    raw.nestingIntelligence.availableLengthCm = null;
    raw.nestingIntelligence.bufferPct = 25;
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const reloaded = mount();
    toFabricView(reloaded);
    expect(bufferInput(reloaded).value).toBe("25");
    expect(availableInput(reloaded).value).toBe("");
    expect(reloaded.querySelector("#nest-verdict")!.textContent).toContain("unknown");
    raw.nestingIntelligence.availableLengthCm = 300;
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const valued = mount();
    toFabricView(valued);
    expect(availableInput(valued).value).toBe("300");
    expect(valued.querySelector("#nest-verdict")!.textContent).toContain("Fit:");
  });

  it("loads pre-intelligence saves with planning defaults", () => {
    localStorage.clear();
    const root = mount();
    toFabricView(root);
    clickId(root, "save-pattern");
    const raw = JSON.parse(localStorage.getItem("patternworks_save_v1")!);
    delete raw.nestingIntelligence;
    localStorage.setItem("patternworks_save_v1", JSON.stringify(raw));
    const reloaded = mount();
    toFabricView(reloaded);
    expect(bufferInput(reloaded).value).toBe("10");
    expect(availableInput(reloaded).value).toBe("");
    expect(reloaded.querySelector<HTMLInputElement>("#nest-nap")!.checked).toBe(true);
  });

  it("restores raw invalid planning values through recovery", () => {
    localStorage.clear();
    const first = mount();
    toFabricView(first);
    bufferInput(first).value = "60";
    bufferInput(first).dispatchEvent(new Event("input", { bubbles: true }));
    const recovered = mount();
    expect(recovered.querySelector("#recovery-host")!.textContent).toContain("Unfinished draft found");
    recovered.querySelector<HTMLButtonElement>("#recovery-accept")!.click();
    expect(recovered.querySelector<HTMLInputElement>("#nest-buffer")!.value).toBe("60");
    expect(recovered.querySelector("#error-nest-buffer")!.textContent).toContain("0–50");
  });

  it("renders planning readouts at narrow and wide widths without errors", () => {
    localStorage.clear();
    const root = mount();
    document.body.appendChild(root);
    try {
      toFabricView(root);
      const viewport = root.querySelector<HTMLElement>("#inspection-viewport")!;
      for (const width of [1280, 900, 700, 560, 390]) {
        Object.defineProperty(viewport, "clientWidth", { configurable: true, value: width });
        window.dispatchEvent(new Event("resize"));
        expect(root.querySelector("#nest-intel-host")).not.toBeNull();
        expect(root.querySelector("#nest-required")!.textContent).toContain("Requires");
      }
    } finally {
      root.remove();
    }
  });
});
