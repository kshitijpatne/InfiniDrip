// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ARTWORK_CATALOG,
  ARTWORK_CATEGORIES,
  GARMENT_FAMILIES,
  PIECE_ROLE_GROUPS,
  PRINT_USES,
  type ArtworkCatalogRecord,
  type ArtworkPrintUse,
} from "../../../surface/artwork-library/catalog";
import { mountArtworkCatalog } from "./artwork-panel";

const hosts: HTMLElement[] = [];
function makeHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  hosts.push(host);
  return host;
}

afterEach(() => {
  while (hosts.length > 0) {
    const host = hosts.pop()!;
    host.remove();
  }
  document.body.innerHTML = "";
});

function baseRecord(): ArtworkCatalogRecord {
  return ARTWORK_CATALOG[0]!;
}

function cloneRecord(overrides: Record<string, unknown> = {}): ArtworkCatalogRecord {
  const base = baseRecord();
  const sourceOverrides = (overrides.source ?? {}) as Record<string, unknown>;
  const imageOverrides = (overrides.image ?? {}) as Record<string, unknown>;
  const technicalOverrides = (overrides.technical ?? {}) as Record<string, unknown>;
  const useOverrides = (overrides.use ?? {}) as Record<string, unknown>;
  const rangeOverrides = (useOverrides.suggestedPlacementWidthCm ?? {}) as Record<string, unknown>;
  return {
    ...base,
    ...overrides,
    assetId: (overrides.assetId as ArtworkCatalogRecord["assetId"]) ?? base.assetId,
    source: { ...base.source, ...sourceOverrides },
    image: { ...base.image, ...imageOverrides },
    technical: { ...base.technical, ...technicalOverrides },
    use: {
      ...base.use,
      ...useOverrides,
      suggestedPlacementWidthCm: {
        ...base.use.suggestedPlacementWidthCm,
        ...rangeOverrides,
      },
    },
  } as unknown as ArtworkCatalogRecord;
}

function cleanRecord(overrides: Record<string, unknown> = {}): ArtworkCatalogRecord {
  const imageOverrides = (overrides.image ?? {}) as Record<string, unknown>;
  const technicalOverrides = (overrides.technical ?? {}) as Record<string, unknown>;
  const useOverrides = (overrides.use ?? {}) as Record<string, unknown>;
  const rangeOverrides = (useOverrides.suggestedPlacementWidthCm ?? {}) as Record<string, unknown>;
  return cloneRecord({
    ...overrides,
    technical: {
      presentation: "clean-artwork",
      imageIsSeamlessTile: true,
      repeatMotif: "visible",
      directionality: "upright",
      ...technicalOverrides,
    },
    use: {
      printUses: [...PRINT_USES],
      garmentFamilies: [...baseRecord().use.garmentFamilies],
      pieceRoleGroups: [...baseRecord().use.pieceRoleGroups],
      ...useOverrides,
      suggestedPlacementWidthCm: {
        minimum: 4,
        maximum: 10,
        basis: "Test range.",
        ...rangeOverrides,
      },
    },
    image: { widthPx: 1200, heightPx: 1200, ...imageOverrides },
  });
}

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value as Record<string, unknown>)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
  }
  return value;
}

function safeLocalUrl(): string {
  return ARTWORK_CATALOG[0]!.image.localImageUrl;
}

function credentialedUrl(): string {
  return `http://user@${window.location.host}/assets/cred.jpg`;
}

function passwordOnlyUrl(): string {
  return `http://:secret@${window.location.host}/assets/cred2.jpg`;
}

function getSearchInput(host: HTMLElement): HTMLInputElement {
  return host.querySelector(".uiq-artwork-input") as HTMLInputElement;
}

function getSelects(host: HTMLElement): HTMLSelectElement[] {
  return Array.from(host.querySelectorAll(".uiq-artwork-select"));
}

function getSelectByLabel(host: HTMLElement, labelText: string): HTMLSelectElement {
  const labels = Array.from(host.querySelectorAll(".uiq-artwork-label"));
  const label = labels.find((item) => item.textContent === labelText)!;
  const id = label.getAttribute("for")!;
  return host.querySelector(`#${id}`) as HTMLSelectElement;
}

function getCount(host: HTMLElement): string {
  return (host.querySelector(".uiq-artwork-count") as HTMLElement).textContent ?? "";
}

function getSelectionNote(host: HTMLElement): string {
  return (host.querySelector(".uiq-artwork-selection") as HTMLElement).textContent ?? "";
}

function getCards(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll(".uiq-artwork-card"));
}

function setSearch(host: HTMLElement, value: string): void {
  const input = getSearchInput(host);
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function setSelect(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

function clickClear(host: HTMLElement): void {
  (host.querySelector(".uiq-artwork-clear") as HTMLButtonElement).click();
}

describe("defaults and options", () => {
  it("shows all twelve records by default with placement guidance", () => {
    const host = makeHost();
    const onSelect = vi.fn();
    const handle = mountArtworkCatalog(host, { onSelect });
    expect(getCards(host)).toHaveLength(12);
    expect(getCount(host)).toContain("12 of 12");
    expect(host.querySelector(".uiq-artwork")!.textContent).toContain("Placement guidance");
    expect(getSelectionNote(host)).toContain("No reference selected");
    handle.dispose();
  });

  it("uses supplied catalog, selection, and print use", () => {
    const host = makeHost();
    const catalog = deepFreeze(ARTWORK_CATALOG.slice(0, 2)) as readonly ArtworkCatalogRecord[];
    const onSelect = vi.fn();
    const handle = mountArtworkCatalog(host, {
      catalog,
      selectedAssetId: catalog[1]!.assetId,
      printUse: "all-over",
      onSelect,
    });
    expect(getCards(host)).toHaveLength(2);
    expect(getCount(host)).toContain("2 of 2");
    expect(host.querySelector(".uiq-artwork")!.textContent).toContain("All-over guidance");
    expect(getSelectionNote(host)).toContain(catalog[1]!.assetId);
    expect(onSelect).not.toHaveBeenCalled();
    handle.dispose();
  });

  it("accepts explicit null selection and default placement when options are omitted", () => {
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { selectedAssetId: null, onSelect: vi.fn() });
    expect(getSelectionNote(host)).toContain("No reference selected");
    expect(host.querySelector(".uiq-artwork")!.textContent).toContain("Placement guidance");
    handle.dispose();
  });

  it("supports each print-use label in the filter select", () => {
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { onSelect: vi.fn() });
    const printSelect = getSelectByLabel(host, "Print use (filters and guidance)");
    const labels = Array.from(printSelect.querySelectorAll("option")).map((item) => item.textContent);
    expect(labels).toContain("Any print use");
    expect(labels).toContain("All-over");
    expect(labels).toContain("Border / trim");
    expect(labels).toContain("Focal graphic");
    expect(labels).toContain("Panel");
    expect(labels).toContain("Placement");
    handle.dispose();
  });

  it("does not mutate supplied catalog records", () => {
    const catalog = deepFreeze([cloneRecord({ assetId: "builtin-met-90001" }), cloneRecord({ assetId: "builtin-met-90002" })]);
    const before = JSON.stringify(catalog);
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog, onSelect: vi.fn() });
    setSearch(host, "textile");
    setSelect(getSelectByLabel(host, "Category"), "geometric");
    expect(JSON.stringify(catalog)).toBe(before);
    handle.dispose();
  });
});

describe("search and filters", () => {
  it("matches literal and unicode queries", () => {
    const candidate = cloneRecord({ assetId: "builtin-met-91001", title: "ＡＲＴ   Deco — needle & thread" });
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog: [candidate, baseRecord()], onSelect: vi.fn() });
    setSearch(host, "  art\t deco  ");
    expect(getCards(host)).toHaveLength(1);
    setSearch(host, "needle & THREAD");
    expect(getCards(host)).toHaveLength(1);
    setSearch(host, "needle thread");
    expect(getCards(host)).toHaveLength(0);
    expect(getCount(host)).toContain("No references match");
    handle.dispose();
  });

  it("filters by each dimension and their intersection", () => {
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { onSelect: vi.fn() });
    const category = getSelectByLabel(host, "Category");
    const family = getSelectByLabel(host, "Garment family");
    const role = getSelectByLabel(host, "Piece role");
    const print = getSelectByLabel(host, "Print use (filters and guidance)");

    setSelect(category, "dot/spot");
    expect(getCards(host).map((card) => card.getAttribute("data-asset-id"))).toEqual(["builtin-cma-111658"]);

    clickClear(host);
    setSelect(family, "tee");
    expect(getCards(host).length).toBeGreaterThan(0);

    clickClear(host);
    setSelect(role, "pocket");
    expect(getCards(host)).toHaveLength(0);

    clickClear(host);
    setSelect(print, "border/trim");
    const borderCount = getCards(host).length;
    expect(borderCount).toBeGreaterThan(0);
    expect(borderCount).toBeLessThan(12);

    clickClear(host);
    setSelect(category, "geometric");
    setSelect(print, "border/trim");
    const both = getCards(host).length;
    expect(both).toBeGreaterThan(0);
    expect(both).toBeLessThanOrEqual(borderCount);
    handle.dispose();
  });

  it("uses every taxonomy value without mutating order", () => {
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { onSelect: vi.fn() });
    const category = getSelectByLabel(host, "Category");
    for (const value of ARTWORK_CATEGORIES) {
      setSelect(category, value);
      for (const card of getCards(host)) {
        expect(card.textContent).toContain("Categories:");
      }
    }
    for (const value of GARMENT_FAMILIES) {
      setSelect(getSelectByLabel(host, "Garment family"), value);
      expect(getCount(host)).toMatch(/references shown|No references match/);
    }
    for (const value of PIECE_ROLE_GROUPS) {
      setSelect(getSelectByLabel(host, "Piece role"), value);
      expect(getCount(host)).toMatch(/references shown|No references match/);
    }
    for (const value of PRINT_USES) {
      setSelect(getSelectByLabel(host, "Print use (filters and guidance)"), value);
      expect(host.querySelector(".uiq-artwork")!.textContent).toContain("guidance");
    }
    handle.dispose();
  });

  it("distinguishes empty catalog from no matches and clears to all", () => {
    const emptyHost = makeHost();
    const emptyHandle = mountArtworkCatalog(emptyHost, { catalog: [], onSelect: vi.fn() });
    expect(getCount(emptyHost)).toContain("No references in this catalog");
    expect(emptyHost.querySelector(".uiq-artwork-empty")!.textContent).toContain("empty");
    emptyHandle.dispose();

    const host = makeHost();
    const handle = mountArtworkCatalog(host, { onSelect: vi.fn() });
    setSearch(host, "no-such-reference-zzz");
    expect(getCount(host)).toContain("No references match");
    expect(host.querySelector(".uiq-artwork-empty")!.textContent).toContain("Clear or broaden");
    clickClear(host);
    expect(getCards(host)).toHaveLength(12);
    expect(getSearchInput(host).value).toBe("");
    handle.dispose();
  });

  it("retains focus and control nodes while typing", () => {
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { onSelect: vi.fn() });
    const input = getSearchInput(host);
    const selectsBefore = getSelects(host).map((item) => item);
    input.focus();
    expect(document.activeElement).toBe(input);
    setSearch(host, "floral");
    expect(document.activeElement).toBe(input);
    expect(getSearchInput(host)).toBe(input);
    expect(getSelects(host).map((item) => item.outerHTML)).toEqual(selectsBefore.map((item) => item.outerHTML));
    handle.dispose();
  });

  it("print-use selection filters and reassesses; clearing restores default assessment and selection", () => {
    const host = makeHost();
    const onSelect = vi.fn();
    const target = ARTWORK_CATALOG[0]!.assetId;
    const handle = mountArtworkCatalog(host, { printUse: "placement", onSelect });
    handle.setSelection(target);
    expect(getSelectionNote(host)).toContain(target);
    const print = getSelectByLabel(host, "Print use (filters and guidance)");
    setSelect(print, "all-over");
    expect(host.querySelector(".uiq-artwork")!.textContent).toContain("All-over guidance");
    expect(getSelectionNote(host)).toMatch(/Selected|not in the current filtered results/);
    clickClear(host);
    expect(getCards(host)).toHaveLength(12);
    expect(host.querySelector(".uiq-artwork")!.textContent).toContain("Placement guidance");
    expect(getSelectionNote(host)).toContain(target);
    expect(onSelect).not.toHaveBeenCalled();
    handle.dispose();
  });

  it("selecting Any print use returns assessment to the supplied default", () => {
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { printUse: "panel", onSelect: vi.fn() });
    const print = getSelectByLabel(host, "Print use (filters and guidance)");
    setSelect(print, "all-over");
    expect(host.querySelector(".uiq-artwork")!.textContent).toContain("All-over guidance");
    setSelect(print, "");
    expect(host.querySelector(".uiq-artwork")!.textContent).toContain("Panel guidance");
    handle.dispose();
  });
});

describe("selection contract", () => {
  it("preserves focused controls, expanded provenance and preview nodes during controlled selection", () => {
    const host = makeHost();
    const onSelect = vi.fn((id: string) => handle.setSelection(id));
    const handle = mountArtworkCatalog(host, { onSelect });
    const button = host.querySelector<HTMLButtonElement>(".uiq-artwork-choose")!;
    const details = host.querySelector<HTMLDetailsElement>("details")!;
    const preview = host.querySelector(".uiq-artwork-preview")!;
    details.open = true;
    button.focus();
    button.click();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(ARTWORK_CATALOG[0]!.assetId);
    expect(document.activeElement).toBe(button);
    expect(host.querySelector(".uiq-artwork-choose")).toBe(button);
    expect(host.querySelector(".uiq-artwork-preview")).toBe(preview);
    expect(details.open).toBe(true);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    handle.setSelection(null);
    expect(document.activeElement).toBe(button);
    expect(details.open).toBe(true);
    expect(onSelect).toHaveBeenCalledTimes(1);
    handle.dispose();
  });

  it("calls back with the exact asset ID only on explicit activation", () => {
    const host = makeHost();
    const onSelect = vi.fn();
    const handle = mountArtworkCatalog(host, { onSelect });
    const firstId = ARTWORK_CATALOG[0]!.assetId;
    const button = host.querySelector(`button[data-asset-id="${firstId}"]`) as HTMLButtonElement;
    expect(button.getAttribute("aria-pressed")).toBe("false");
    expect(button.title).toContain(firstId);
    expect(button.getAttribute("aria-label")).toContain(firstId);
    expect(button.type).toBe("button");
    expect(button.disabled).toBe(false);
    button.click();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(firstId);
    setSearch(host, "floral");
    expect(onSelect).toHaveBeenCalledTimes(1);
    setSelect(getSelectByLabel(host, "Category"), "geometric");
    expect(onSelect).toHaveBeenCalledTimes(1);
    handle.dispose();
  });

  it("setSelection updates pressed state without calling back", () => {
    const host = makeHost();
    const onSelect = vi.fn();
    const handle = mountArtworkCatalog(host, { onSelect });
    const target = ARTWORK_CATALOG[1]!.assetId;
    handle.setSelection(target);
    expect(onSelect).not.toHaveBeenCalled();
    expect(host.querySelector(`button[data-asset-id="${target}"]`)!.getAttribute("aria-pressed")).toBe("true");
    expect(getSelectionNote(host)).toContain(target);
    handle.setSelection(null);
    expect(onSelect).not.toHaveBeenCalled();
    expect(host.querySelector(`button[data-asset-id="${target}"]`)!.getAttribute("aria-pressed")).toBe("false");
    expect(getSelectionNote(host)).toContain("No reference selected");
    handle.dispose();
  });

  it("explains unknown and filtered-out selections instead of reassigning", () => {
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { onSelect: vi.fn() });
    handle.setSelection("builtin-met-000000");
    expect(getSelectionNote(host)).toContain("not in this catalog");
    const visible = ARTWORK_CATALOG[0]!;
    handle.setSelection(visible.assetId);
    setSearch(host, "no-such-reference-zzz");
    expect(getSelectionNote(host)).toContain("not in the current filtered results");
    expect(getSelectionNote(host)).toContain("Selection is preserved");
    clickClear(host);
    expect(getSelectionNote(host)).toContain(visible.assetId);
    handle.dispose();
  });

  it("keeps every needs-review card selectable", () => {
    const needsReview = cleanRecord({ technical: { imageIsSeamlessTile: false } });
    const host = makeHost();
    const onSelect = vi.fn();
    const handle = mountArtworkCatalog(host, {
      catalog: [needsReview],
      printUse: "all-over",
      onSelect,
    });
    const card = getCards(host)[0]!;
    expect(card.querySelector(".uiq-artwork-assessment")!.getAttribute("data-level")).toBe("needs-review");
    const button = card.querySelector("button") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    button.click();
    expect(onSelect).toHaveBeenCalledWith(needsReview.assetId);
    handle.dispose();
  });
});

describe("image safety and hostile strings", () => {
  it("renders same-origin http images and falls back for remote URLs", () => {
    const local = cloneRecord({
      assetId: "builtin-met-92001",
      image: { localImageUrl: safeLocalUrl(), filename: "safe.jpg" },
    });
    const remote = cloneRecord({
      assetId: "builtin-met-92002",
      image: { localImageUrl: "https://example.com/remote.jpg", filename: "remote.jpg" },
    });
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog: [local, remote], onSelect: vi.fn() });
    const cards = getCards(host);
    const localImage = cards[0]!.querySelector("img.uiq-artwork-image") as HTMLImageElement;
    expect(localImage.src).toBe(safeLocalUrl());
    expect(cards[0]!.querySelector(".uiq-artwork-fallback")!.hasAttribute("hidden") || (cards[0]!.querySelector(".uiq-artwork-fallback") as HTMLElement).hidden).toBe(true);
    const remoteCard = cards[1]!;
    expect(remoteCard.querySelector("img.uiq-artwork-image")).toBeNull();
    expect((remoteCard.querySelector(".uiq-artwork-fallback") as HTMLElement).hidden).toBe(false);
    expect(remoteCard.querySelector("button")!.disabled).toBe(false);
    expect(host.querySelectorAll("a")).toHaveLength(0);
    handle.dispose();
  });

  it("rejects https cross-origin, data, javascript, credentialed, empty, and invalid URLs", () => {
    const fixtures: Array<{ id: string; url: string }> = [
      { id: "builtin-met-92101", url: "https://example.com/assets/remote.jpg" },
      { id: "builtin-met-92102", url: "data:image/png;base64,AAA" },
      { id: "builtin-met-92103", url: "javascript:alert(1)" },
      { id: "builtin-met-92104", url: credentialedUrl() },
      { id: "builtin-met-92105", url: passwordOnlyUrl() },
      { id: "builtin-met-92106", url: "http://example.com/assets/remote.jpg" },
      { id: "builtin-met-92107", url: "" },
      { id: "builtin-met-92108", url: "   " },
      { id: "builtin-met-92109", url: "https://" },
      { id: "builtin-met-92110", url: new URL("/api/preview", window.location.href).href },
      { id: "builtin-met-92112", url: `${safeLocalUrl()}?redirect=https://example.com` },
    ];
    const catalog = fixtures.map((item) =>
      cloneRecord({ assetId: item.id as ArtworkCatalogRecord["assetId"], image: { localImageUrl: item.url, filename: "test.jpg" } }),
    );
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog, onSelect: vi.fn() });
    expect(host.querySelectorAll("img.uiq-artwork-image")).toHaveLength(0);
    expect(host.querySelectorAll(".uiq-artwork-fallback").length).toBe(fixtures.length);
    for (const card of getCards(host)) {
      expect(card.querySelector("button")!.disabled).toBe(false);
    }
    handle.dispose();
  });

  it("accepts an https same-protocol check path and same-origin https-style fallback without loading remote bytes", () => {
    const httpsRemote = cloneRecord({
      assetId: "builtin-met-92111",
      image: { localImageUrl: "https://example.com/assets/other.jpg", filename: "other.jpg" },
    });
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog: [httpsRemote], onSelect: vi.fn() });
    expect(host.querySelector("img.uiq-artwork-image")).toBeNull();
    expect((host.querySelector(".uiq-artwork-fallback") as HTMLElement).hidden).toBe(false);
    handle.dispose();
  });

  it("shows a descriptive fallback after an image error without disabling selection", () => {
    const record = cloneRecord({
      assetId: "builtin-met-92201",
      image: { localImageUrl: safeLocalUrl(), filename: "missing.jpg" },
    });
    const onSelect = vi.fn();
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog: [record], onSelect });
    const image = host.querySelector("img.uiq-artwork-image") as HTMLImageElement;
    image.dispatchEvent(new Event("error"));
    const fallback = host.querySelector(".uiq-artwork-fallback") as HTMLElement;
    expect(fallback.hidden).toBe(false);
    expect(fallback.textContent).toContain("missing.jpg");
    const button = host.querySelector(".uiq-artwork-choose") as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    button.click();
    expect(onSelect).toHaveBeenCalledWith(record.assetId);
    handle.dispose();
  });

  it("renders hostile strings literally and keeps provenance URLs as unfetched text", () => {
    const hostile = cloneRecord({
      assetId: "builtin-met-92301",
      title: "<img src=x onerror=alert(1)>",
      description: "<script>alert(2)</script>",
      tags: ["<b>bold</b>"],
      creator: "<svg onload=alert(3)>",
      source: {
        itemRecordUrl: "https://example.test/<script>",
        apiRecordUrl: "https://example.test/api?<img>",
        originalImageUrl: "https://example.test/original?<svg>",
        creditLine: "<iframe src=javascript:alert(4)>",
      },
    });
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog: [hostile], onSelect: vi.fn() });
    const card = getCards(host)[0]!;
    expect(card.querySelector(".uiq-artwork-title")!.textContent).toBe("<img src=x onerror=alert(1)>");
    expect(card.querySelectorAll("a")).toHaveLength(0);
    expect(card.querySelectorAll("img.uiq-artwork-image")).toHaveLength(1);
    expect(card.querySelector("script")).toBeNull();
    expect(card.querySelector("iframe")).toBeNull();
    const codes = Array.from(card.querySelectorAll("code")).map((item) => item.textContent);
    expect(codes).toContain("https://example.test/<script>");
    expect(card.textContent).toContain("never fetches them");
    handle.dispose();
  });
});

describe("assessment severities and record details", () => {
  it("recommends clean supported uses at the suggested size", () => {
    const clean = cleanRecord({ assetId: "builtin-met-93001" });
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog: [clean], printUse: "placement", onSelect: vi.fn() });
    const box = host.querySelector(".uiq-artwork-assessment")!;
    expect(box.getAttribute("data-level")).toBe("recommended");
    expect(box.textContent).toContain("Recommended");
    expect(box.textContent).toContain("Placement guidance");
    expect(host.querySelector(".uiq-artwork")!.textContent).toContain("catalog default, not your current placement");
    handle.dispose();
  });

  it("marks textile photographs and paper studies as possible with visible caveats", () => {
    const textile = cleanRecord({
      assetId: "builtin-met-93002",
      technical: { presentation: "textile-photograph", imageIsSeamlessTile: false },
    });
    const paper = cleanRecord({
      assetId: "builtin-met-93003",
      technical: { presentation: "paper-study", imageIsSeamlessTile: false },
    });
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog: [textile, paper], printUse: "panel", onSelect: vi.fn() });
    const boxes = Array.from(host.querySelectorAll(".uiq-artwork-assessment"));
    expect(boxes[0]!.getAttribute("data-level")).toBe("possible");
    expect(boxes[0]!.textContent).toContain("Possible");
    expect(boxes[1]!.getAttribute("data-level")).toBe("possible");
    handle.dispose();
  });

  it("needs review for all-over without a seamless tile and for unconfirmed presentation", () => {
    const nonTile = cleanRecord({
      assetId: "builtin-met-93004",
      technical: { imageIsSeamlessTile: false },
    });
    const unknown = cleanRecord({
      assetId: "builtin-met-93005",
      technical: { presentation: "unconfirmed" },
    });
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog: [nonTile, unknown], printUse: "all-over", onSelect: vi.fn() });
    const boxes = Array.from(host.querySelectorAll(".uiq-artwork-assessment"));
    expect(boxes[0]!.getAttribute("data-level")).toBe("needs-review");
    expect(boxes[0]!.textContent).toContain("Needs review");
    expect(boxes[1]!.getAttribute("data-level")).toBe("needs-review");
    handle.dispose();
  });

  it("covers clean-artwork presentation and verified tiles", () => {
    const clean = cleanRecord({ assetId: "builtin-met-93006" });
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog: [clean], onSelect: vi.fn() });
    expect(host.querySelector(".uiq-artwork")!.textContent).toContain("Clean artwork image");
    expect(host.querySelector(".uiq-artwork")!.textContent).toContain("Verified seamless tile");
    handle.dispose();
  });

  it("shows size-unavailable guidance for unusable ranges and incomplete provenance", () => {
    const badRange = cleanRecord({
      assetId: "builtin-met-93007",
      use: { suggestedPlacementWidthCm: { minimum: 0, maximum: 10 } },
    });
    const incomplete = cleanRecord({
      assetId: "builtin-met-93008",
      source: { creditLine: " " },
    });
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { catalog: [badRange, incomplete], onSelect: vi.fn() });
    const texts = Array.from(host.querySelectorAll(".uiq-artwork-assessment")).map((item) => item.textContent);
    expect(texts[0]).toContain("size unavailable");
    expect(texts[1]).toContain("size unavailable");
    expect(texts[0]).toContain("Needs review");
    expect(texts[1]).toContain("Needs review");
    handle.dispose();
  });

  it("shows every required card field with full assessment reason", () => {
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { onSelect: vi.fn() });
    const card = getCards(host)[0]!;
    expect(card.querySelector(".uiq-artwork-title")!.textContent).toBe(ARTWORK_CATALOG[0]!.title);
    expect(card.textContent).toContain(ARTWORK_CATALOG[0]!.source.institution);
    expect(card.textContent).toContain(ARTWORK_CATALOG[0]!.source.rightsLabel);
    expect(card.textContent).toContain(ARTWORK_CATALOG[0]!.source.checkedOn);
    expect(card.textContent).toContain(`${String(ARTWORK_CATALOG[0]!.image.widthPx)} × ${String(ARTWORK_CATALOG[0]!.image.heightPx)} px`);
    expect(card.textContent).toContain("Repeat:");
    expect(card.textContent).toContain("remains selectable");
    expect(card.textContent).toContain(ARTWORK_CATALOG[0]!.assetId);
    const details = card.querySelector("details.uiq-artwork-provenance")!;
    expect(details.textContent).toContain(ARTWORK_CATALOG[0]!.source.itemRecordUrl);
    expect(details.textContent).toContain(ARTWORK_CATALOG[0]!.image.sha256);
    handle.dispose();
  });

  it("labels focal graphic and border uses distinctly", () => {
    const fixture = cleanRecord({ assetId: "builtin-met-93009" });
    for (const printUse of ["focal graphic", "border/trim"] as const) {
      const host = makeHost();
      const handle = mountArtworkCatalog(host, { catalog: [fixture], printUse, onSelect: vi.fn() });
      expect(host.querySelector(".uiq-artwork-assessment-heading")!.textContent).toContain(
        printUse === "focal graphic" ? "Focal graphic" : "Border / trim",
      );
      handle.dispose();
    }
    const allOverHost = makeHost();
    const allOverHandle = mountArtworkCatalog(allOverHost, {
      catalog: [fixture],
      printUse: "all-over" as ArtworkPrintUse,
      onSelect: vi.fn(),
    });
    expect(allOverHost.querySelector(".uiq-artwork-assessment-heading")!.textContent).toContain("All-over");
    allOverHandle.dispose();
  });
});

describe("instances and disposal", () => {
  it("keeps simultaneous instances independent with unique input IDs", () => {
    const firstHost = makeHost();
    const secondHost = makeHost();
    const first = mountArtworkCatalog(firstHost, { onSelect: vi.fn() });
    const second = mountArtworkCatalog(secondHost, { onSelect: vi.fn() });
    const firstInput = getSearchInput(firstHost);
    const secondInput = getSearchInput(secondHost);
    expect(firstInput.id).not.toBe(secondInput.id);
    expect(firstInput.id.length).toBeGreaterThan(0);
    const firstLabels = Array.from(firstHost.querySelectorAll("label"));
    for (const label of firstLabels) {
      const target = firstHost.querySelector(`#${label.getAttribute("for")!}`);
      expect(target).not.toBeNull();
    }
    setSearch(firstHost, "floral");
    expect(getSearchInput(secondHost).value).toBe("");
    expect(getCards(secondHost)).toHaveLength(12);
    first.dispose();
    expect(firstHost.querySelector(".uiq-artwork")).toBeNull();
    expect(secondHost.querySelector(".uiq-artwork")).not.toBeNull();
    second.dispose();
  });

  it("dispose is idempotent and detached controls cannot call back", () => {
    const host = makeHost();
    const sibling = document.createElement("p");
    sibling.textContent = "sibling stays";
    host.appendChild(sibling);
    const onSelect = vi.fn();
    const handle = mountArtworkCatalog(host, { onSelect });
    const button = host.querySelector("button[data-asset-id]") as HTMLButtonElement;
    const root = host.querySelector(".uiq-artwork")!;
    const input = getSearchInput(host);
    const selects = getSelects(host);
    const clear = host.querySelector<HTMLButtonElement>(".uiq-artwork-clear")!;
    const image = host.querySelector("img")!;
    const before = root.innerHTML;
    handle.dispose();
    handle.dispose();
    expect(host.textContent).toContain("sibling stays");
    expect(host.querySelector(".uiq-artwork")).toBeNull();
    button.click();
    input.value = "not-in-catalog";
    input.dispatchEvent(new Event("input"));
    for (const select of selects) select.dispatchEvent(new Event("change"));
    clear.click();
    image.dispatchEvent(new Event("error"));
    expect(root.innerHTML).toBe(before);
    expect(onSelect).not.toHaveBeenCalled();
    handle.setSelection(ARTWORK_CATALOG[0]!.assetId);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("releases obsolete card listeners on a filter rerender", () => {
    const host = makeHost();
    const onSelect = vi.fn();
    const handle = mountArtworkCatalog(host, { onSelect });
    const oldButton = host.querySelector<HTMLButtonElement>(".uiq-artwork-choose")!;
    const oldImage = host.querySelector<HTMLImageElement>(".uiq-artwork-image")!;
    setSearch(host, "floral");
    oldButton.click();
    oldImage.dispatchEvent(new Event("error"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(oldImage.hidden).toBe(false);
    handle.dispose();
  });

  it("associates every control with its label", () => {
    const host = makeHost();
    const handle = mountArtworkCatalog(host, { onSelect: vi.fn() });
    const pairs: Array<[string, string]> = [
      ["Search references", getSearchInput(host).id],
      ["Category", getSelectByLabel(host, "Category").id],
      ["Garment family", getSelectByLabel(host, "Garment family").id],
      ["Piece role", getSelectByLabel(host, "Piece role").id],
      ["Print use (filters and guidance)", getSelectByLabel(host, "Print use (filters and guidance)").id],
    ];
    for (const [labelText, id] of pairs) {
      expect(id.length).toBeGreaterThan(0);
      const label = Array.from(host.querySelectorAll("label")).find((item) => item.textContent === labelText)!;
      expect(label.getAttribute("for")).toBe(id);
    }
    handle.dispose();
  });
});
