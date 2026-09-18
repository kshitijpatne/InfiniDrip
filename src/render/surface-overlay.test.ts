// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { point } from "../geometry/point";
import { surfaceOverlay, type OverlayItem } from "./surface-overlay";

const item = (overrides: Partial<OverlayItem> = {}): OverlayItem => ({
  id: "chest-print",
  pieceRole: "front",
  kind: "print",
  polygon: [point(0, 0), point(20, 0), point(20, 25), point(0, 25)],
  zOrder: 1,
  ...overrides,
});

const parse = (group: string): Document =>
  new DOMParser().parseFromString(
    `<svg xmlns="http://www.w3.org/2000/svg">${group}</svg>`,
    "image/svg+xml",
  );

describe("surfaceOverlay", () => {
  it("parses as real markup with a tagged group", () => {
    const doc = parse(surfaceOverlay([item()]));
    expect(doc.querySelector("parsererror")).toBeNull();
    const group = doc.querySelector('g[data-surface="overlay"]');
    expect(group).not.toBeNull();
    expect(group!.getAttribute("data-count")).toBe("1");
  });

  it("carries placement identity onto each polygon", () => {
    const doc = parse(surfaceOverlay([item()]));
    const polygon = doc.querySelector("polygon")!;
    expect(polygon.getAttribute("data-placement")).toBe("chest-print");
    expect(polygon.getAttribute("data-piece")).toBe("front");
    expect(polygon.getAttribute("data-kind")).toBe("print");
    expect(polygon.getAttribute("points")).toBe("0,0 20,0 20,25 0,25");
  });

  it("renders in ascending z-order regardless of input order", () => {
    const group = surfaceOverlay([
      item({ id: "top", zOrder: 5 }),
      item({ id: "bottom", zOrder: -2 }),
      item({ id: "mid", zOrder: 1 }),
    ]);
    const doc = parse(group);
    const ids = [...doc.querySelectorAll("polygon")].map((p) => p.getAttribute("data-placement"));
    expect(ids).toEqual(["bottom", "mid", "top"]);
  });

  it("escapes attribute characters so markup stays parseable", () => {
    const doc = parse(surfaceOverlay([item({ id: 'a"b&<c>' })]));
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelector("polygon")!.getAttribute("data-placement")).toBe('a"b&<c>');
  });

  it("rounds to millimetres like the piece paths", () => {
    const doc = parse(surfaceOverlay([
      item({ polygon: [point(1 / 3, 2 / 3), point(1, 1), point(2, 2)] }),
    ]));
    expect(doc.querySelector("polygon")!.getAttribute("points")).toBe("0.333,0.667 1,1 2,2");
  });

  it("emits an empty tagged group for no artwork", () => {
    const doc = parse(surfaceOverlay([]));
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelector('g[data-surface="overlay"]')!.getAttribute("data-count")).toBe("0");
    expect(doc.querySelectorAll("polygon")).toHaveLength(0);
  });
});
