// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { STANDARD_M } from "../drafting";
import { croquisPath, lowerCroquisPath, upperCroquisPath } from "./croquis";

describe("croquis library", () => {
  it.each(["front", "side", "back"] as const)("provides an upper %s figure", (view) => {
    const path = upperCroquisPath(STANDARD_M, view);
    expect(path.startsWith("M ")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it.each(["front", "side", "back"] as const)("provides a lower %s figure", (view) => {
    const path = lowerCroquisPath(STANDARD_M, view);
    expect(path.startsWith("M ")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
  });

  it("dispatches by region without conflating upper and lower figures", () => {
    expect(croquisPath("upper", STANDARD_M, "front")).toBe(upperCroquisPath(STANDARD_M, "front"));
    expect(croquisPath("lower", STANDARD_M, "front")).toBe(lowerCroquisPath(STANDARD_M, "front"));
    expect(croquisPath("upper", STANDARD_M, "front")).not.toBe(croquisPath("lower", STANDARD_M, "front"));
  });

  it("keeps side geometry distinct from the front/back envelope", () => {
    expect(upperCroquisPath(STANDARD_M, "side")).not.toBe(upperCroquisPath(STANDARD_M, "front"));
    expect(lowerCroquisPath(STANDARD_M, "side")).not.toBe(lowerCroquisPath(STANDARD_M, "back"));
  });
});
