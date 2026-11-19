// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  DEFAULT_TROUSER_OPTIONS,
  STANDARD_M,
  draftTrouserWithPockets,
  rolePiece,
} from "../drafting";
import { TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY, TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY } from "../drafting/trouser-contract";
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

  it("renders the R06 cut-intake contour, all pleat option overlays and the post-fold waist dimension", () => {
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      [TROUSER_PLEATED_FRONT_PROFILE_ROUTE_KEY]: 1 as const,
      frontPleatIntakeCm: 4,
      frontPleatOffsetCm: 6,
      frontPleatStitchDepthCm: 8,
    };
    const body = renderTrouserBody(STANDARD_M, options, "front");
    const bodyDoc = parse(body);
    const waist = bodyDoc.querySelector('[data-edge="waist"]');
    const side = parse(renderTrouserSide(STANDARD_M, options));

    expect(bodyDoc.querySelector("parsererror")).toBeNull();
    expect(waist?.querySelectorAll("line")).toHaveLength(10);
    expect(body).toContain('data-edge="option-frontPleatOffsetCm"');
    expect(body).toContain('data-edge="option-frontPleatIntakeCm"');
    expect(body).toContain('data-edge="option-frontPleatStitchDepthCm"');
    expect(body).toContain('data-pattern-mark-name="frontWaistAfterPleat"');
    expect(side.querySelector('[data-part="side-silhouette"]')?.getAttribute("d")).toContain("6 -2");
  });

  it("renders R07 casing marks and digital dimensions without separate waistband or fly pieces", () => {
    const options = {
      ...DEFAULT_TROUSER_OPTIONS,
      [TROUSER_ELASTIC_PULLON_PROFILE_ROUTE_KEY]: 1 as const,
      waistGatherRatio: 1.4,
      casingDepthCm: 5.5,
    };
    const assembled = renderTrouserGarment(STANDARD_M, "#123456", options);
    const body = parse(renderTrouserBody(STANDARD_M, options, "front"));
    const side = parse(renderTrouserSide(STANDARD_M, options));

    expect(parse(assembled).querySelector("parsererror")).toBeNull();
    expect(assembled).toContain('data-pattern-mark-name="casingFold"');
    expect(assembled).toContain('data-pattern-mark-name="casingStitchGuide"');
    expect(assembled).not.toContain('data-role="trouser waistband"');
    expect(assembled).not.toContain('data-role="trouser fly shield"');
    expect(body.querySelector("parsererror")).toBeNull();
    expect(body.querySelector('[data-dim="casingDepthCm"]')?.textContent).toContain("Digital casing depth 5.5");
    expect(body.querySelector('[data-edge="option-waistGatherRatio"]')).not.toBeNull();
    expect(body.querySelector('[data-edge="option-casingDepthCm"]')).not.toBeNull();
    expect(side.querySelector("parsererror")).toBeNull();
    expect(side.querySelector('[data-part="side-silhouette"]')?.getAttribute("d")).toContain("-6.1");
  });
});
