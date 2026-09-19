import { describe, it, expect } from "vitest";
import { EMPTY_TRANSFORM, type ArtworkPlacement } from "./placement";
import {
  EMPTY_BOOK,
  nextZOrder,
  parseSurfaceBook,
  surfaceAdd,
  surfaceKey,
  surfaceList,
  surfacePlaceable,
  surfaceProblems,
  surfaceRemove,
  surfaceRemoveAt,
  surfaceSetAt,
} from "./store";

const placement = (overrides: Partial<ArtworkPlacement> = {}): ArtworkPlacement => ({
  id: "chest-print",
  kind: "print",
  pieceRole: "front",
  widthCm: 20,
  heightCm: 25,
  transform: EMPTY_TRANSFORM,
  zOrder: 0,
  sourceName: "tiger.svg",
  ...overrides,
});

describe("surfaceKey", () => {
  it("names garment and style without any size", () => {
    expect(surfaceKey("tee", "Classic tee")).toBe("tee/Classic tee");
  });
});

describe("surfaceList", () => {
  it("returns an empty set for unknown keys", () => {
    expect(surfaceList(EMPTY_BOOK, "tee/Classic tee")).toEqual([]);
  });
  it("returns stored placements verbatim", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tee/Classic tee", "Classic tee", placement());
    expect(surfaceList(book, "tee/Classic tee")).toHaveLength(1);
  });
});

describe("surfaceAdd", () => {
  it("creates missing keys with the given style name", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tank/Scoop", "Scoop", placement({ id: "back" }));
    expect(book["tank/Scoop"].styleName).toBe("Scoop");
    expect(surfaceList(book, "tank/Scoop").map((p) => p.id)).toEqual(["back"]);
  });
  it("replaces the same id instead of duplicating it", () => {
    const key = "tee/Classic tee";
    const once = surfaceAdd(EMPTY_BOOK, key, "Classic tee", placement());
    const twice = surfaceAdd(once, key, "Classic tee", placement({ widthCm: 30 }));
    expect(surfaceList(twice, key)).toHaveLength(1);
    expect(surfaceList(twice, key)[0].widthCm).toBe(30);
  });
  it("keeps other keys untouched", () => {
    const book = surfaceAdd(
      surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement({ id: "a" })),
      "tee/B", "B", placement({ id: "b" }));
    expect(surfaceList(book, "tee/A").map((p) => p.id)).toEqual(["a"]);
  });
});

describe("surfaceRemove", () => {
  it("drops the named id and keeps the rest", () => {
    const key = "tee/Classic tee";
    const book = surfaceAdd(
      surfaceAdd(EMPTY_BOOK, key, "Classic tee", placement()),
      key, "Classic tee", placement({ id: "back-patch" }));
    const pruned = surfaceRemove(book, key, "chest-print");
    expect(surfaceList(pruned, key).map((p) => p.id)).toEqual(["back-patch"]);
  });
  it("leaves unknown keys and ids unchanged", () => {
    expect(surfaceRemove(EMPTY_BOOK, "missing/key", "x")).toBe(EMPTY_BOOK);
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement());
    expect(surfaceRemove(book, "tee/A", "missing")).toEqual(book);
  });
});

describe("nextZOrder", () => {
  it("starts at zero for an empty set", () => {
    expect(nextZOrder([])).toBe(0);
  });
  it("stacks one above the current maximum", () => {
    expect(nextZOrder([placement({ zOrder: 2 }), placement({ zOrder: 5 })])).toBe(6);
  });
  it("ignores non-finite orders instead of failing", () => {
    expect(nextZOrder([placement({ zOrder: NaN })])).toBe(0);
  });
});

describe("surfaceProblems", () => {
  it("reports nothing for a valid set", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement());
    expect(surfaceProblems(book, "tee/A")).toEqual([]);
  });
  it("reports nothing for an unknown key", () => {
    expect(surfaceProblems(EMPTY_BOOK, "missing")).toEqual([]);
  });
  it("names the failing placement with its actionable error", () => {
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement({ widthCm: 0 }));
    expect(surfaceProblems(book, "tee/A")).toEqual([
      { id: "chest-print", error: expect.stringContaining("widthCm") },
    ]);
  });
  it("falls back to position when the id itself is unusable", () => {
    const book = {
      "tee/A": { styleName: "A", placements: [{ ...placement(), id: "" }] },
    };
    expect(surfaceProblems(book, "tee/A")).toEqual([
      { id: "#1", error: expect.stringContaining("id") },
    ]);
  });
});

describe("surfacePlaceable", () => {
  it("accepts finite positive geometry", () => {
    expect(surfacePlaceable(placement())).toBe(true);
  });
  it("rejects non-objects and broken shapes", () => {
    expect(surfacePlaceable(null)).toBe(false);
    expect(surfacePlaceable([])).toBe(false);
    expect(surfacePlaceable({ ...placement(), widthCm: 0 })).toBe(false);
    expect(surfacePlaceable({ ...placement(), widthCm: "big" })).toBe(false);
    expect(surfacePlaceable({ ...placement(), heightCm: -2 })).toBe(false);
    expect(surfacePlaceable({ ...placement(), transform: null })).toBe(false);
    expect(surfacePlaceable({ ...placement(), transform: [] })).toBe(false);
    expect(surfacePlaceable({ ...placement(), transform: { ...EMPTY_TRANSFORM, dx: NaN } })).toBe(false);
    expect(surfacePlaceable({ ...placement(), transform: { ...EMPTY_TRANSFORM, dy: Infinity } })).toBe(false);
    expect(surfacePlaceable({ ...placement(), transform: { ...EMPTY_TRANSFORM, scale: 0 } })).toBe(false);
    expect(surfacePlaceable({ ...placement(), transform: { ...EMPTY_TRANSFORM, rotationDeg: "up" } })).toBe(false);
  });
});

describe("surfaceSetAt", () => {
  it("replaces one index without touching its neighbours", () => {
    const key = "tee/A";
    const book = surfaceAdd(
      surfaceAdd(EMPTY_BOOK, key, "A", placement({ id: "a" })),
      key, "A", placement({ id: "b" }));
    const updated = surfaceSetAt(book, key, 1, placement({ id: "b", widthCm: 30 }));
    expect(surfaceList(updated, key).map((p) => p.widthCm)).toEqual([20, 30]);
  });
  it("leaves unknown keys and out-of-range indexes unchanged", () => {
    expect(surfaceSetAt(EMPTY_BOOK, "missing", 0, placement())).toBe(EMPTY_BOOK);
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement());
    expect(surfaceSetAt(book, "tee/A", 4, placement())).toBe(book);
    expect(surfaceSetAt(book, "tee/A", -1, placement())).toBe(book);
    expect(surfaceSetAt(book, "tee/A", 0.5, placement())).toBe(book);
  });
});

describe("surfaceRemoveAt", () => {
  it("drops one index and keeps the rest", () => {
    const key = "tee/A";
    const book = surfaceAdd(
      surfaceAdd(EMPTY_BOOK, key, "A", placement({ id: "a" })),
      key, "A", placement({ id: "b" }));
    const pruned = surfaceRemoveAt(book, key, 0);
    expect(surfaceList(pruned, key).map((p) => p.id)).toEqual(["b"]);
  });
  it("leaves unknown keys and out-of-range indexes unchanged", () => {
    expect(surfaceRemoveAt(EMPTY_BOOK, "missing", 0)).toBe(EMPTY_BOOK);
    const book = surfaceAdd(EMPTY_BOOK, "tee/A", "A", placement());
    expect(surfaceRemoveAt(book, "tee/A", 3)).toBe(book);
    expect(surfaceRemoveAt(book, "tee/A", -1)).toBe(book);
    expect(surfaceRemoveAt(book, "tee/A", NaN)).toBe(book);
  });
});

describe("parseSurfaceBook", () => {
  it("reads absent as empty for pre-surface saves", () => {
    expect(parseSurfaceBook(undefined)).toEqual({});
  });
  it("rejects non-objects", () => {
    expect(parseSurfaceBook(null)).toBeNull();
    expect(parseSurfaceBook("surface")).toBeNull();
    expect(parseSurfaceBook([])).toBeNull();
  });
  it("rejects malformed entries without repairing them", () => {
    expect(parseSurfaceBook({ key: null })).toBeNull();
    expect(parseSurfaceBook({ key: [] })).toBeNull();
    expect(parseSurfaceBook({ key: { styleName: "A" } })).toBeNull();
    expect(parseSurfaceBook({ key: { styleName: "A", placements: {} } })).toBeNull();
    expect(parseSurfaceBook({ key: { styleName: "A", placements: [null] } })).toBeNull();
    expect(parseSurfaceBook({ key: { styleName: 7, placements: [] } })).toBeNull();
  });
  it("preserves raw invalid values verbatim for lazy validation", () => {
    const raw = { "tee/A": { styleName: "A", placements: [{ ...placement(), widthCm: "huge" }] } };
    const book = parseSurfaceBook(raw);
    expect(book!["tee/A"].placements).toHaveLength(1);
    expect(surfaceProblems(book!, "tee/A")).toEqual([
      { id: "chest-print", error: expect.stringContaining("widthCm") },
    ]);
  });
  it("round-trips an empty book", () => {
    expect(parseSurfaceBook(JSON.parse(JSON.stringify(EMPTY_BOOK)))).toEqual({});
  });
});
