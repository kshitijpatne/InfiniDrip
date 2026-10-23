// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { STANDARD_M } from "../drafting/measurements";
import { DEFAULT_SHORTS_OPTIONS } from "../drafting/shorts-contract";
import {
  renderShortsBody,
  renderShortsBodyPair,
  renderShortsGarment,
  renderShortsSide,
} from "./shorts-figure";

const parse = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");

describe("shorts Body and assembled renderers", () => {
  it("renders front and back from their actual leg roles and exposes recipe-owned dimensions", () => {
    const front = parse(renderShortsBody(STANDARD_M, DEFAULT_SHORTS_OPTIONS, "front"));
    const back = parse(renderShortsBody(STANDARD_M, DEFAULT_SHORTS_OPTIONS, "back"));

    expect(front.querySelector("parsererror")).toBeNull();
    expect(back.querySelector("parsererror")).toBeNull();
    expect(front.documentElement.getAttribute("data-croquis-view")).toBe("front");
    expect(back.documentElement.getAttribute("data-croquis-view")).toBe("back");
    expect(front.querySelector('[data-role="frontLeft"]')).not.toBeNull();
    expect(front.querySelector('[data-role="frontRight"]')).not.toBeNull();
    expect(front.querySelectorAll('[data-edge="ease"]')).toHaveLength(2);
    expect([...front.querySelectorAll('[data-edge="ease"]')]
      .every((target) => target.closest('[data-edge="figure"]') === null)).toBe(true);
    expect(back.querySelector('[data-role="backLeft"]')).not.toBeNull();
    expect(back.querySelector('[data-role="backRight"]')).not.toBeNull();
    expect(back.querySelectorAll('[data-edge="ease"]')).toHaveLength(2);
    expect(front.querySelector('[data-dim="thigh"]')?.textContent).toContain("Finished thigh target");
    expect(front.querySelector('[data-edge="option-frontRiseEase"]')).not.toBeNull();
    expect(back.querySelector('[data-edge="option-backRiseEase"]')).not.toBeNull();
    expect(front.querySelector('[data-edge="option-shortsInseam"]')?.textContent).toContain("20 cm");
    expect(front.querySelector('[data-edge="option-hemOpening"]')).not.toBeNull();
    expect(`${front.documentElement.textContent}${back.documentElement.textContent}`).not.toMatch(/knee/i);
  });

  it("renders a front/back pair and keeps the raw crossing-knee length visible without creating a knee feature", () => {
    const pair = parse(`<root>${renderShortsBodyPair(STANDARD_M, { ...DEFAULT_SHORTS_OPTIONS, shortsInseam: 45 })}</root>`);
    expect(pair.querySelectorAll("svg")).toHaveLength(2);
    expect(pair.querySelector('[data-croquis-view="front"]')).not.toBeNull();
    expect(pair.querySelector('[data-croquis-view="back"]')).not.toBeNull();
    expect(pair.documentElement.textContent).toContain("Shorts length 45 cm");
    expect(pair.documentElement.textContent).not.toMatch(/knee/i);
  });

  it("assembles all nine actual roles and keeps component option overlays on their pieces", () => {
    const svg = parse(renderShortsGarment(STANDARD_M, "#123456", DEFAULT_SHORTS_OPTIONS)).documentElement;
    expect(svg.getAttribute("data-garment")).toBe("shorts");
    expect(svg.querySelector("parsererror")).toBeNull();
    expect(svg.getAttribute("viewBox")?.trim().split(/\s+/)).toHaveLength(4);
    expect(svg.querySelectorAll('[data-edge="ease"]')).toHaveLength(4);
    expect([...svg.querySelectorAll('[data-edge="ease"]')]
      .every((target) => target.closest('[data-edge="figure"]') === null)).toBe(true);
    for (const role of [
      "frontLeft", "frontRight", "backLeft", "backRight", "waistband",
      "flyShield", "flyUnderlap", "pocketBagLeft", "pocketBagRight",
    ]) expect(svg.querySelector(`[data-role="${role}"]`)).not.toBeNull();
    for (const option of [
      "waistbandDepth", "flyLength", "pocketOpening", "pocketAngle", "pocketBagDepth", "pocketDrop",
    ]) {
      const overlays = [...svg.querySelectorAll(`[data-edge="option-${option}"]`)];
      expect(overlays.length, option).toBeGreaterThan(0);
      expect(overlays.every((overlay) => overlay.closest('[data-edge="component"]') !== null), option).toBe(true);
    }
    expect(svg.textContent).not.toMatch(/knee/i);
  });

  it("uses one continuous front-panel side profile without trouser stations", () => {
    const base = parse(renderShortsSide(STANDARD_M, DEFAULT_SHORTS_OPTIONS));
    const longer = parse(renderShortsSide(STANDARD_M, { ...DEFAULT_SHORTS_OPTIONS, shortsInseam: 45 }));
    expect(base.querySelector("parsererror")).toBeNull();
    expect(base.documentElement.getAttribute("data-croquis-region")).toBe("lower");
    expect(base.querySelector('[data-part="side-silhouette"]')).not.toBeNull();
    expect(base.querySelector("[data-dim]")).toBeNull();
    expect(base.documentElement.getAttribute("viewBox")).not.toBe(longer.documentElement.getAttribute("viewBox"));
    expect(base.documentElement.textContent).toContain("SHORTS DRAFT");
    expect(base.documentElement.textContent).not.toMatch(/trouser|knee/i);
  });
});
