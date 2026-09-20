// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { EMPTY_TRANSFORM, type ArtworkPlacement } from "../surface/placement";
import { exportSurfaceSheet } from "./surface-sheet";

const placement = (overrides: Partial<ArtworkPlacement> = {}): ArtworkPlacement => ({
  id: "a",
  kind: "print",
  pieceRole: "front",
  widthCm: 20,
  heightCm: 25,
  transform: EMPTY_TRANSFORM,
  zOrder: 0,
  sourceName: "",
  ...overrides,
});

const parse = (svg: string): Document =>
  new DOMParser().parseFromString(svg, "image/svg+xml");

describe("exportSurfaceSheet", () => {
  it("draws true-scale artwork with a measurable calibration square", () => {
    const doc = parse(exportSurfaceSheet([placement()], "Classic tee"));
    expect(doc.querySelector("parsererror")).toBeNull();
    const svg = doc.querySelector("svg")!;
    expect(svg.getAttribute("viewBox")).toBe("0 0 82.5 66.5");
    const square = [...doc.querySelectorAll("rect")].find((r) => r.getAttribute("width") === "10")!;
    expect(square.getAttribute("height")).toBe("10");
    expect(square.getAttribute("x")).toBe("5");
    expect(square.getAttribute("y")).toBe("23.5");
    const polygon = doc.querySelector("polygon")!;
    expect(polygon.getAttribute("points")).toBe("5,36.5 25,36.5 25,61.5 5,61.5");
    expect(polygon.getAttribute("data-placement")).toBe("a");
    const text = doc.querySelector("svg")!.textContent ?? "";
    expect(text).toContain("Artwork print sheet - Classic tee");
    expect(text).toContain("Shared across graded sizes");
    expect(text).toContain("#1 a (print) on front - 20 x 25 cm");
  });

  it("names the source when one is recorded", () => {
    const doc = parse(exportSurfaceSheet([placement({ sourceName: "tiger.svg" })], "Scoop"));
    expect(doc.querySelector("svg")!.textContent).toContain("tiger.svg");
  });

  it("names invalid entries with their error and draws nothing for them", () => {
    const bad = placement({ id: "bad", widthCm: 0 });
    const doc = parse(exportSurfaceSheet([bad], "Scoop"));
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelector("svg")!.textContent).toContain("INVALID");
    expect(doc.querySelectorAll("polygon")).toHaveLength(0);
  });

  it("reports unmeasurable geometry without throwing on hostile saves", () => {
    const hostile = {
      ...placement({ id: "hostile", zOrder: NaN }),
      widthCm: "big" as unknown as number,
      kind: 9 as unknown as "print",
      pieceRole: null as unknown as string,
      transform: null as unknown as ArtworkPlacement["transform"],
    };
    const doc = parse(exportSurfaceSheet([hostile], "Scoop"));
    expect(doc.querySelector("parsererror")).toBeNull();
    const text = doc.querySelector("svg")!.textContent ?? "";
    expect(text).toContain("unmeasurable size");
    expect(text).toContain("unmeasurable pose");
    expect(doc.querySelectorAll("polygon")).toHaveLength(0);
  });

  it("marks a non-numeric stack order instead of printing it", () => {
    const doc = parse(exportSurfaceSheet([placement({ zOrder: "high" as unknown as number })], "Scoop"));
    expect(doc.querySelector("svg")!.textContent).toContain("stack ?");
  });

  it("stays a valid calibrated sheet with no artwork", () => {
    const doc = parse(exportSurfaceSheet([], "Scoop"));
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelector("svg")!.textContent).toContain("No artwork on Scoop.");
    expect(doc.querySelector('rect[width="10"]')).not.toBeNull();
    expect(doc.querySelectorAll("polygon")).toHaveLength(0);
  });
});
