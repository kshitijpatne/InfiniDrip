import { describe, it, expect } from "vitest";
import {
  BUFFER_DEFAULT_PCT,
  BUFFER_MAX_PCT,
  BUFFER_MIN_PCT,
  BUFFER_STEP_PCT,
  availableLengthError,
  bufferError,
  fitResult,
  napNoticeText,
  plannedLength,
  wastePercent,
} from "./nesting-intelligence";

describe("buffer contract", () => {
  it("declares the packet decisions as constants", () => {
    expect(BUFFER_DEFAULT_PCT).toBe(10);
    expect(BUFFER_MIN_PCT).toBe(0);
    expect(BUFFER_MAX_PCT).toBe(50);
    expect(BUFFER_STEP_PCT).toBe(1);
  });
  it("accepts the full valid range including both endpoints", () => {
    expect(bufferError(0)).toBeNull();
    expect(bufferError(10)).toBeNull();
    expect(bufferError(50)).toBeNull();
    expect(bufferError(12.5)).toBeNull();
  });
  it("rejects non-finite and out-of-range entries with the control bounds", () => {
    expect(bufferError(NaN)).toContain("finite");
    expect(bufferError(Infinity)).toContain("finite");
    expect(bufferError("10")).toContain("finite");
    expect(bufferError(-1)).toContain("0–50");
    expect(bufferError(51)).toContain("0–50");
  });
});

describe("plannedLength", () => {
  it("applies the buffer to the required length", () => {
    expect(plannedLength(100, 10)).toBeCloseTo(110, 9);
    expect(plannedLength(100, 0)).toBeCloseTo(100, 9);
    expect(plannedLength(76.4, 50)).toBeCloseTo(114.6, 9);
  });
  it("returns null for unusable length input", () => {
    expect(plannedLength(NaN, 10)).toBeNull();
    expect(plannedLength(-5, 10)).toBeNull();
    expect(plannedLength("100", 10)).toBeNull();
    expect(plannedLength(undefined, 10)).toBeNull();
  });
  it("returns null for unusable buffer input", () => {
    expect(plannedLength(100, NaN)).toBeNull();
    expect(plannedLength(100, -1)).toBeNull();
    expect(plannedLength(100, 51)).toBeNull();
    expect(plannedLength(100, undefined)).toBeNull();
  });
});

describe("wastePercent", () => {
  it("converts utilization to waste share", () => {
    expect(wastePercent(1)).toBeCloseTo(0, 9);
    expect(wastePercent(0)).toBeCloseTo(100, 9);
    expect(wastePercent(0.44)).toBeCloseTo(56, 9);
  });
  it("returns null for non-finite or out-of-range estimator output", () => {
    expect(wastePercent(NaN)).toBeNull();
    expect(wastePercent(Infinity)).toBeNull();
    expect(wastePercent(-0.1)).toBeNull();
    expect(wastePercent(1.1)).toBeNull();
    expect(wastePercent("0.5")).toBeNull();
  });
});

describe("availableLengthError", () => {
  it("treats blank as unknown, never an error", () => {
    expect(availableLengthError(undefined)).toBeNull();
    expect(availableLengthError(null)).toBeNull();
    expect(availableLengthError("")).toBeNull();
    expect(availableLengthError("   ")).toBeNull();
  });
  it("accepts finite positive lengths in both shapes", () => {
    expect(availableLengthError(150)).toBeNull();
    expect(availableLengthError("150")).toBeNull();
    expect(availableLengthError("150.5")).toBeNull();
  });
  it("rejects zero, negative, and non-finite entries", () => {
    expect(availableLengthError(0)).toContain("above 0");
    expect(availableLengthError(-20)).toContain("above 0");
    expect(availableLengthError(NaN)).toContain("above 0");
    expect(availableLengthError("many")).toContain("above 0");
    expect(availableLengthError(Infinity)).toContain("above 0");
  });
});

describe("fitResult", () => {
  it("stays unknown for blank or invalid on-hand input", () => {
    expect(fitResult(undefined, 110)).toEqual({ verdict: "unknown" });
    expect(fitResult(null, 110)).toEqual({ verdict: "unknown" });
    expect(fitResult("", 110)).toEqual({ verdict: "unknown" });
    expect(fitResult("   ", 110)).toEqual({ verdict: "unknown" });
    expect(fitResult(0, 110)).toEqual({ verdict: "unknown" });
    expect(fitResult(-5, 110)).toEqual({ verdict: "unknown" });
    expect(fitResult(NaN, 110)).toEqual({ verdict: "unknown" });
    expect(fitResult("many", 110)).toEqual({ verdict: "unknown" });
  });
  it("stays unknown for unratable planned input, never a false fit", () => {
    expect(fitResult(200, null)).toEqual({ verdict: "unknown" });
    expect(fitResult(200, NaN)).toEqual({ verdict: "unknown" });
    expect(fitResult(200, -3)).toEqual({ verdict: "unknown" });
  });
  it("fits at and above the planned length, shorts below it", () => {
    expect(fitResult(110, 110)).toEqual({ verdict: "fits" });
    expect(fitResult(200, 110)).toEqual({ verdict: "fits" });
    expect(fitResult("200", 110)).toEqual({ verdict: "fits" });
    expect(fitResult(100, 110)).toEqual({ verdict: "short", shortByCm: 10 });
    expect(fitResult("100", 110)).toEqual({ verdict: "short", shortByCm: 10 });
  });
  it("measures shortage exactly, including borderline values", () => {
    expect(fitResult(109.9, 110)).toEqual({ verdict: "short", shortByCm: expect.closeTo(0.1, 9) });
    expect(fitResult(0.5, 300)).toEqual({ verdict: "short", shortByCm: expect.closeTo(299.5, 9) });
  });
});

describe("napNoticeText", () => {
  it("states the no-rotation assumption either way", () => {
    expect(napNoticeText(true)).toContain("never rotate");
    expect(napNoticeText(false)).toContain("no rotation");
    expect(napNoticeText(true)).not.toBe(napNoticeText(false));
  });
});
