// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  DEFAULT_TROUSER_OPTIONS,
  STANDARD_M,
  draftTrouserWithPockets,
  rolePiece,
} from "../drafting";
import {
  renderTrouserBody,
  renderTrouserBodyPair,
  renderTrouserGarment,
  renderTrouserSide,
} from "./trouser-figure";
import { pieceToPath } from "./shape";

const parse = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");

describe("trouser render integration (Slice 100)", () => {
  it("renders the actual four panels and construction components", () => {
    const block = draftTrouserWithPockets(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    const svg = renderTrouserGarment(STANDARD_M, "#123456", DEFAULT_TROUSER_OPTIONS);
    const doc = parse(svg);

    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelector('svg[data-garment="trouser"]')).not.toBeNull();
    expect(svg).toContain(pieceToPath(rolePiece(block, "frontLeft")));
    expect(svg).toContain(pieceToPath(rolePiece(block, "backLeft")));
    expect(svg).toContain("FRONT");
    expect(svg).toContain("BACK");
    expect(svg).toContain('data-garment-detail="trouser-components"');
    expect(svg).toContain('data-role="trouser waistband"');
    expect(svg).toContain('data-role="trouser fly shield"');
    expect(svg).toContain('data-role="trouser pocket bag left"');
    expect(svg).toContain('data-role="trouser pocket bag right"');
  });

  it("exposes every live construction option on the actual body/assembled geometry", () => {
    const assembled = renderTrouserGarment(STANDARD_M, "#123456", DEFAULT_TROUSER_OPTIONS);
    const body = renderTrouserBody(STANDARD_M, DEFAULT_TROUSER_OPTIONS, "front");
    const bodyPair = renderTrouserBodyPair(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    for (const id of [
      "frontRiseEase", "backRiseEase", "waistbandDepth", "thighEase", "kneeEase",
      "legOpening", "flyLength", "pocketOpening", "pocketAngle", "pocketBagDepth", "pocketDrop",
    ]) {
      expect(assembled).toContain(`data-edge="option-${id}"`);
      expect(bodyPair).toContain(`data-edge="option-${id}"`);
    }
    expect(body).toContain('data-edge="option-frontRiseEase"');
  });

  it("annotates lower-body controls and returns separate front/back body figures", () => {
    const front = parse(renderTrouserBody(STANDARD_M, DEFAULT_TROUSER_OPTIONS, "front"));
    const back = parse(renderTrouserBody(STANDARD_M, DEFAULT_TROUSER_OPTIONS, "back"));
    const pair = parse(renderTrouserBodyPair(STANDARD_M, DEFAULT_TROUSER_OPTIONS));
    for (const doc of [front, back]) {
      expect(doc.querySelector("parsererror")).toBeNull();
      for (const id of ["waist", "hip", "hipDepth", "crotchDepth", "thigh", "knee", "inseam"]) {
        expect(doc.querySelector(`[data-dim="${id}"]`)).not.toBeNull();
        expect(doc.querySelector(`[data-edge="${id}"]`)).not.toBeNull();
      }
    }
    expect(pair.querySelectorAll("svg")).toHaveLength(2);
    expect(pair.querySelector('svg[data-croquis-view="front"]')).not.toBeNull();
    expect(pair.querySelector('svg[data-croquis-view="back"]')).not.toBeNull();
  });

  it("keeps the side projection tied to the live drafted inseam and options", () => {
    const base = renderTrouserSide(STANDARD_M, DEFAULT_TROUSER_OPTIONS);
    const longer = renderTrouserSide({ ...STANDARD_M, inseam: 90 }, { ...DEFAULT_TROUSER_OPTIONS, pocketDrop: 5 });
    const doc = parse(base);
    expect(doc.querySelector("parsererror")).toBeNull();
    expect(doc.querySelector('[data-part="side-silhouette"]')).not.toBeNull();
    expect(doc.querySelector("[data-dim]")).toBeNull();
    expect(doc.querySelector("[data-edge]")).toBeNull();
    expect(longer).not.toBe(base);
  });

  it("moves assembled and body output when a trouser option changes", () => {
    const base = renderTrouserGarment(STANDARD_M, "#123456", DEFAULT_TROUSER_OPTIONS);
    const changed = renderTrouserGarment(STANDARD_M, "#123456", {
      ...DEFAULT_TROUSER_OPTIONS, legOpening: 48, pocketAngle: 42, pocketBagDepth: 28,
    });
    const body = renderTrouserBody(STANDARD_M, DEFAULT_TROUSER_OPTIONS, "front");
    const changedBody = renderTrouserBody(STANDARD_M, { ...DEFAULT_TROUSER_OPTIONS, flyLength: 19 }, "front");
    expect(changed).not.toBe(base);
    expect(changedBody).not.toBe(body);
  });
});
