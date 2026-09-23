import { describe, expect, it } from "vitest";
import {
  ARTWORK_CATALOG,
  ARTWORK_CATEGORIES,
  PRINT_USES,
  type ArtworkCatalogRecord,
  type ArtworkCategory,
} from "./catalog";
import { assessArtworkUse, searchArtworkCatalog } from "./search";

function makeRecord(overrides: Record<string, unknown> = {}): ArtworkCatalogRecord {
  const base = ARTWORK_CATALOG[0];
  const sourceOverrides = (overrides.source ?? {}) as object;
  const imageOverrides = (overrides.image ?? {}) as object;
  const technicalOverrides = (overrides.technical ?? {}) as object;
  const useOverrides = (overrides.use ?? {}) as Record<string, unknown>;
  const widthRangeOverrides = (useOverrides.suggestedPlacementWidthCm ?? {}) as object;
  return {
    ...base,
    ...overrides,
    source: { ...base.source, ...sourceOverrides },
    image: { ...base.image, ...imageOverrides },
    technical: { ...base.technical, ...technicalOverrides },
    use: {
      ...base.use,
      ...useOverrides,
      suggestedPlacementWidthCm: {
        ...base.use.suggestedPlacementWidthCm,
        ...widthRangeOverrides,
      },
    },
  } as unknown as ArtworkCatalogRecord;
}

function cleanArtwork(overrides: Record<string, unknown> = {}): ArtworkCatalogRecord {
  const imageOverrides = (overrides.image ?? {}) as object;
  const technicalOverrides = (overrides.technical ?? {}) as object;
  const useOverrides = (overrides.use ?? {}) as Record<string, unknown>;
  const rangeOverrides = (useOverrides.suggestedPlacementWidthCm ?? {}) as object;
  return makeRecord({
    ...overrides,
    technical: {
      presentation: "clean-artwork",
      imageIsSeamlessTile: true,
      repeatMotif: "visible",
      directionality: "upright",
      ...technicalOverrides,
    },
    use: {
      printUses: PRINT_USES,
      garmentFamilies: ARTWORK_CATALOG[0].use.garmentFamilies,
      pieceRoleGroups: ARTWORK_CATALOG[0].use.pieceRoleGroups,
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

describe("artwork catalog search and filters", () => {
  it("returns a fresh, stable full catalog for omitted and blank queries", () => {
    const omitted = searchArtworkCatalog();
    const blank = searchArtworkCatalog({ query: " \t\n " });
    expect(omitted).toEqual(ARTWORK_CATALOG);
    expect(blank).toEqual(ARTWORK_CATALOG);
    expect(omitted).not.toBe(ARTWORK_CATALOG);
    expect(blank).not.toBe(ARTWORK_CATALOG);
    expect(omitted.map((item) => item.assetId)).toEqual(ARTWORK_CATALOG.map((item) => item.assetId));
  });

  it("normalizes Unicode compatibility forms, case, and whitespace while matching literal phrases", () => {
    const candidate = makeRecord({ title: "ＡＲＴ   Deco — needle & thread" });
    expect(searchArtworkCatalog({ query: "  art\t deco  " }, [candidate])).toEqual([candidate]);
    expect(searchArtworkCatalog({ query: "needle & THREAD" }, [candidate])).toEqual([candidate]);
    expect(searchArtworkCatalog({ query: "needle thread" }, [candidate])).toEqual([]);
    expect(searchArtworkCatalog({ query: "art deco needle" }, [candidate])).toEqual([]);
  });

  it("searches every documented display and provenance field", () => {
    const cases: Array<[string, ArtworkCatalogRecord]> = [
      ["quartz pin", makeRecord({ title: "Quartz pin" })],
      ["velvet plume", makeRecord({ description: "Velvet plume" })],
      ["tagneedle", makeRecord({ tags: ["tagneedle"] })],
      ["makerneedle", makeRecord({ creator: "Makerneedle" })],
      ["cultneedle", makeRecord({ culture: "Cultneedle" })],
      ["1847", makeRecord({ date: "1847" })],
      ["mediumneedle", makeRecord({ medium: "Mediumneedle" })],
      ["museumneedle", makeRecord({ source: { institution: "Museumneedle" } })],
      ["record-4921", makeRecord({ source: { itemRecordUrl: "https://example.test/record-4921" } })],
      ["creditneedle", makeRecord({ source: { creditLine: "Creditneedle" } })],
      ["public domain", makeRecord({ source: { rightsLabel: "Public Domain" } })],
    ];
    for (const [query, candidate] of cases) {
      expect(searchArtworkCatalog({ query }, [candidate]), query).toEqual([candidate]);
    }
  });

  it("does not index API/image/policy URLs, local paths, or hashes", () => {
    expect(searchArtworkCatalog({ query: "DP889362.jpg" })).toEqual([]);
    expect(searchArtworkCatalog({ query: "metmuseum.org/about-the-met/policies" })).toEqual([]);
    expect(searchArtworkCatalog({ query: "40639b7eb9f6a5e78e3d0ca7d3fcbb7f" })).toEqual([]);
  });

  it("combines filters with OR within each field and AND across fields", () => {
    const matches = makeRecord({
      assetId: "builtin-met-10101",
      categories: ["geometric"],
      use: { garmentFamilies: ["tee"], pieceRoleGroups: ["front"], printUses: ["panel"] },
    });
    const failsFamily = makeRecord({
      assetId: "builtin-met-10102",
      categories: ["botanical/floral"],
      use: { garmentFamilies: ["tank"], pieceRoleGroups: ["front"], printUses: ["panel"] },
    });
    const failsRole = makeRecord({
      assetId: "builtin-met-10103",
      categories: ["botanical/floral"],
      use: { garmentFamilies: ["tee"], pieceRoleGroups: ["pocket"], printUses: ["panel"] },
    });
    const failsUse = makeRecord({
      assetId: "builtin-met-10104",
      categories: ["botanical/floral"],
      use: { garmentFamilies: ["tee"], pieceRoleGroups: ["front"], printUses: ["all-over"] },
    });
    const catalog = [matches, failsFamily, failsRole, failsUse];
    const found = searchArtworkCatalog({
      filters: {
        categories: ["geometric", "botanical/floral"],
        garmentFamilies: ["tee", "tank"],
        pieceRoleGroups: ["front", "pocket"],
        printUses: ["panel", "placement"],
      },
    }, catalog);
    expect(found.map((item) => item.assetId)).toEqual(catalog.slice(0, 3).map((item) => item.assetId));
  });

  it("treats undefined and empty filter selections as no constraint", () => {
    const catalog = ARTWORK_CATALOG.slice(0, 3);
    expect(searchArtworkCatalog({ filters: {} }, catalog)).toEqual(catalog);
    expect(searchArtworkCatalog({ filters: { categories: [] } }, catalog)).toEqual(catalog);
    expect(searchArtworkCatalog({ filters: { garmentFamilies: [] } }, catalog)).toEqual(catalog);
    expect(searchArtworkCatalog({ filters: { pieceRoleGroups: [] } }, catalog)).toEqual(catalog);
    expect(searchArtworkCatalog({ filters: { printUses: [] } }, catalog)).toEqual(catalog);
    expect(searchArtworkCatalog({ query: "textile", filters: {} }, catalog)).toEqual(
      catalog.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes("textile")),
    );
  });

  it("returns no matches for unknown filter values and leaves the catalog untouched", () => {
    const catalog = ARTWORK_CATALOG.slice(0, 2);
    const before = JSON.stringify(catalog);
    expect(searchArtworkCatalog({ filters: { categories: ["not-a-category" as ArtworkCategory] } }, catalog)).toEqual([]);
    expect(searchArtworkCatalog({ filters: { garmentFamilies: ["not-a-family"] as never[] } }, catalog)).toEqual([]);
    expect(JSON.stringify(catalog)).toBe(before);
  });

  it("preserves source ordering and combines a query with active filters", () => {
    const first = makeRecord({ assetId: "builtin-met-20101", title: "Floral first", categories: ["botanical/floral"] });
    const second = makeRecord({ assetId: "builtin-met-20102", title: "Floral second", categories: ["geometric"] });
    const third = makeRecord({ assetId: "builtin-met-20103", title: "Geometric only", categories: ["geometric"] });
    const catalog = [first, second, third];
    expect(searchArtworkCatalog({ query: "floral", filters: { categories: ["geometric", "botanical/floral"] } }, catalog))
      .toEqual([first, second]);
    expect(searchArtworkCatalog({ query: "floral", filters: { categories: ["geometric"] } }, catalog)).toEqual([second]);
  });

  it("keeps all ten taxonomy filters usable, including empty categories", () => {
    for (const category of ARTWORK_CATEGORIES) {
      const result = searchArtworkCatalog({ filters: { categories: [category] } });
      expect(result.every((item) => item.categories.includes(category))).toBe(true);
    }
    expect(ARTWORK_CATEGORIES).toHaveLength(10);
    expect(searchArtworkCatalog({ filters: { categories: ["dot/spot"] } })).toEqual([]);
    expect(searchArtworkCatalog({ filters: { categories: ["abstract"] } })).toEqual([]);
    expect(searchArtworkCatalog({ filters: { categories: ["typography/logo"] } })).toEqual([]);
  });

  it("accepts an injected empty catalog", () => {
    expect(searchArtworkCatalog({}, [])).toEqual([]);
  });
});

describe("artwork use guidance", () => {
  it("assesses every catalog item for every use with a reason, disclaimer, and continued selection", () => {
    for (const item of ARTWORK_CATALOG) {
      for (const printUse of PRINT_USES) {
        const result = assessArtworkUse(item, printUse);
        expect(result.assetId).toBe(item.assetId);
        expect(result.printUse).toBe(printUse);
        expect(["recommended", "possible", "needs-review"]).toContain(result.level);
        expect(result.reason.trim().length).toBeGreaterThan(0);
        expect(result.reason).toContain("remains selectable");
        expect(result.reason).toContain("or validate production printing, physical fit, or sewability");
        expect(result.selectable).toBe(true);
      }
    }
  });

  it("recommends clean, supported uses and does not require a seamless tile for border, panel, or focal work", () => {
    const clean = cleanArtwork({ technical: { imageIsSeamlessTile: false } });
    for (const printUse of ["panel", "focal graphic", "placement"] as const) {
      expect(assessArtworkUse(clean, printUse).level).toBe("recommended");
    }
    const border = assessArtworkUse(clean, "border/trim");
    expect(border.level).toBe("possible");
    expect(border.reason).not.toContain("seamless repeat tile");
    expect(border.reason).toContain("production repeat or trim unit is not verified");
  });

  it("requires a verified seamless tile for all-over use only", () => {
    const nonTile = cleanArtwork({ technical: { imageIsSeamlessTile: false } });
    const result = assessArtworkUse(nonTile, "all-over");
    expect(result.level).toBe("needs-review");
    expect(result.reason).toContain("not a verified seamless repeat tile");
    expect(result.selectable).toBe(true);
  });

  it("reports each print use that was not curated for a record", () => {
    const candidate = cleanArtwork({ use: { printUses: ["panel"] } });
    const result = assessArtworkUse(candidate, "border/trim");
    expect(result.level).toBe("needs-review");
    expect(result.reason).toContain("not curated for border/trim use");
  });

  it("keeps source photographs and paper studies possible while unknown presentation needs review", () => {
    const textile = cleanArtwork({ technical: { presentation: "textile-photograph" } });
    const paper = cleanArtwork({ technical: { presentation: "paper-study" } });
    const unknown = cleanArtwork({ technical: { presentation: "unconfirmed" } });
    const missing = cleanArtwork({ technical: { presentation: undefined } });
    expect(assessArtworkUse(textile, "panel").level).toBe("possible");
    expect(assessArtworkUse(textile, "panel").reason).toContain("specimen edges or background");
    expect(assessArtworkUse(paper, "panel").level).toBe("possible");
    expect(assessArtworkUse(paper, "panel").reason).toContain("paper margins or surface");
    expect(assessArtworkUse(unknown, "panel").level).toBe("needs-review");
    expect(assessArtworkUse(unknown, "panel").reason).toContain("presentation is unconfirmed");
    expect(assessArtworkUse(missing, "panel").level).toBe("needs-review");
  });

  it("retains unknown direction and repeat as use-relevant caveats, not positive claims", () => {
    const unknownDirection = cleanArtwork({ technical: { directionality: "unconfirmed" } });
    const unknownRepeat = cleanArtwork({ technical: { repeatMotif: "unconfirmed" } });
    const missingDirection = cleanArtwork({ technical: { directionality: undefined } });
    const missingRepeat = cleanArtwork({ technical: { repeatMotif: undefined } });
    expect(assessArtworkUse(unknownDirection, "placement").level).toBe("possible");
    expect(assessArtworkUse(unknownDirection, "placement").reason).toContain("directionality is unconfirmed");
    expect(assessArtworkUse(unknownRepeat, "all-over").level).toBe("possible");
    expect(assessArtworkUse(unknownRepeat, "all-over").reason).toContain("Repeat boundaries are unconfirmed");
    expect(assessArtworkUse(unknownRepeat, "border/trim").level).toBe("possible");
    expect(assessArtworkUse(unknownRepeat, "panel").level).toBe("recommended");
    expect(assessArtworkUse(missingRepeat, "border/trim").reason).toContain("Repeat boundaries are unconfirmed");
    expect(assessArtworkUse(missingDirection, "placement").reason).toContain("directionality is unconfirmed");
  });

  it("defaults to suggested maximum width and preserves source aspect ratio", () => {
    const result = assessArtworkUse(cleanArtwork(), "placement");
    expect(result.level).toBe("recommended");
    expect(result.assessedWidthCm).toBe(10);
    expect(result.assessedHeightCm).toBe(10);
    expect(result.estimatedPxPerCm).toBe(120);
  });

  it("uses both actual placement axes and the existing resolution floor", () => {
    const exactFloor = cleanArtwork({ image: { widthPx: 590, heightPx: 1180 } });
    const atFloor = assessArtworkUse(exactFloor, "placement", { widthCm: 10, heightCm: 20 });
    expect(atFloor.level).toBe("recommended");
    expect(atFloor.estimatedPxPerCm).toBe(59);

    const aspectMismatch = cleanArtwork({ image: { widthPx: 1200, heightPx: 800 } });
    const lowVerticalResolution = assessArtworkUse(aspectMismatch, "placement", { widthCm: 20, heightCm: 20 });
    expect(lowVerticalResolution.level).toBe("needs-review");
    expect(lowVerticalResolution.estimatedPxPerCm).toBe(40);
    expect(lowVerticalResolution.reason).toContain("below the app's 59 px/cm print-guidance floor");
  });

  it("marks adequate-resolution widths outside the editorial range as possible", () => {
    const result = assessArtworkUse(cleanArtwork(), "placement", { widthCm: 12 });
    expect(result.level).toBe("possible");
    expect(result.reason).toContain("outside the curator's 4–10 cm starting range");
  });

  it("requires usable suggested ranges", () => {
    for (const range of [
      { minimum: Number.NaN, maximum: 10 },
      { minimum: 4, maximum: Number.POSITIVE_INFINITY },
      { minimum: 0, maximum: 10 },
      { minimum: 11, maximum: 10 },
    ]) {
      const candidate = cleanArtwork({ use: { suggestedPlacementWidthCm: range } });
      const result = assessArtworkUse(candidate, "placement");
      expect(result.level).toBe("needs-review");
      expect(result.reason).toContain("does not have a usable suggested width range");
      expect(result.assessedWidthCm).toBeNull();
    }
  });

  it("rejects invalid width and height inputs without clamping them", () => {
    for (const widthCm of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = assessArtworkUse(cleanArtwork(), "placement", { widthCm });
      expect(result.level).toBe("needs-review");
      expect(result.reason).toContain("positive, finite placement width");
      expect(result.assessedWidthCm).toBeNull();
    }
    for (const heightCm of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = assessArtworkUse(cleanArtwork(), "placement", { heightCm });
      expect(result.level).toBe("needs-review");
      expect(result.reason).toContain("positive, finite placement height");
      expect(result.assessedHeightCm).toBeNull();
    }
  });

  it("requires complete rights and provenance evidence", () => {
    const incompleteSource = cleanArtwork({ source: { creditLine: " " } });
    const wrongRights = cleanArtwork({ source: { rightsLabel: "CC BY" } });
    const apiDisagrees = cleanArtwork({ source: { apiIsPublicDomain: false } });
    const invalidHash = cleanArtwork({ image: { sha256: "z".repeat(64) } });
    for (const candidate of [incompleteSource, wrongRights, apiDisagrees, invalidHash]) {
      const result = assessArtworkUse(candidate, "placement");
      expect(result.level).toBe("needs-review");
      expect(result.reason).toContain("source, rights, or local asset record is incomplete");
    }
  });

  it("requires valid source dimensions and finite computed resolution", () => {
    for (const image of [
      { widthPx: 0, heightPx: 1200 },
      { widthPx: 1200, heightPx: 0 },
      { widthPx: Number.NaN, heightPx: 1200 },
      { widthPx: 1200, heightPx: Number.POSITIVE_INFINITY },
    ]) {
      const result = assessArtworkUse(cleanArtwork({ image }), "placement");
      expect(result.level).toBe("needs-review");
      expect(result.reason).toContain("source image dimensions are not usable");
    }
    const extremeScale = assessArtworkUse(cleanArtwork(), "placement", {
      widthCm: Number.MIN_VALUE,
      heightCm: 1,
    });
    expect(extremeScale.level).toBe("needs-review");
    expect(extremeScale.reason).toContain("scale cannot be assessed");
  });

  it("does not mutate catalog records while assessing them", () => {
    const candidate = cleanArtwork();
    const before = JSON.stringify(candidate);
    assessArtworkUse(candidate, "placement", { widthCm: 8, heightCm: 8 });
    expect(JSON.stringify(candidate)).toBe(before);
  });
});
