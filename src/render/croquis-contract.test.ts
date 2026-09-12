// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  GARMENTS, STANDARD_M, TEE, blockPieces, draftAtSize,
} from "../drafting";
import {
  exportA0Pdf, exportDxf, exportPdf, exportProjectorSvg, exportSvg,
  exportTechPack, gradedMarker,
} from "../export";
import { renderBody } from "./body";
import { croquisPath } from "./croquis";
import { renderSideCroquis } from "./croquis-view";
import { renderSkirtBody } from "./skirt-figure";
import { renderTrouserBody, renderTrouserSide } from "./trouser-figure";

const parse = (svg: string): Document => new DOMParser().parseFromString(svg, "image/svg+xml");
const GARMENT_CASES = GARMENTS.map((recipe) => [recipe.name, recipe] as const);

function upperBody(recipe: typeof GARMENTS[number], position: "front" | "back"): string {
  return renderBody(
    STANDARD_M,
    recipe.fields.includes("sleeveLength"),
    position === "front" ? recipe.frontNeckline?.(STANDARD_M) : recipe.backNeckline?.(STANDARD_M),
    recipe.strapWidth?.(STANDARD_M),
    position,
  );
}

describe("shared croquis contracts across the garment registry", () => {
  it.each(GARMENT_CASES)("keeps %s on a valid front/side/back contract", (_name, recipe) => {
    const region = recipe.region ?? (recipe.fields.includes("chest") ? "upper" : "lower");
    const isTrouser = recipe.name === "trouser";
    const front = region === "upper"
      ? upperBody(recipe, "front")
      : isTrouser ? renderTrouserBody(STANDARD_M, {}, "front") : renderSkirtBody(STANDARD_M);
    const back = region === "upper"
      ? upperBody(recipe, "back")
      : isTrouser ? renderTrouserBody(STANDARD_M, {}, "back") : renderSkirtBody(STANDARD_M);
    const side = isTrouser
      ? renderTrouserSide(STANDARD_M)
      : renderSideCroquis(STANDARD_M, region);

    if (!isTrouser) {
      for (const view of ["front", "side", "back"] as const) {
        const path = croquisPath(region, STANDARD_M, view);
        expect(path.startsWith("M ")).toBe(true);
        expect(path.trim().endsWith("Z")).toBe(true);
      }
    }

    expect(parse(front).querySelector("parsererror")).toBeNull();
    expect(parse(back).querySelector("parsererror")).toBeNull();
    const sideDoc = parse(side);
    expect(sideDoc.querySelector("parsererror")).toBeNull();
    expect(sideDoc.querySelector("[data-dim]")).toBeNull();
    expect(sideDoc.querySelector("[data-edge]")).toBeNull();

    if (isTrouser) {
      expect(sideDoc.querySelector('[data-part="side-silhouette"]')).not.toBeNull();
      expect(parse(front).querySelector('[data-role="frontLeft"]')).not.toBeNull();
      expect(parse(back).querySelector('[data-role="backLeft"]')).not.toBeNull();
    } else if (region === "upper") {
      expect(parse(front).querySelector('[data-edge="figure"]')).not.toBeNull();
      expect(parse(back).querySelector('[data-edge="figure"]')).not.toBeNull();
    } else {
      expect(parse(front).querySelector('[data-part="silhouette"]')).not.toBeNull();
      expect(parse(back).querySelector('[data-part="cloth"]')).not.toBeNull();
      expect(sideDoc.querySelector('[data-part="side-silhouette"]')?.getAttribute("d"))
        .toBe(croquisPath(region, STANDARD_M, "side"));
    }
  });

  it("keeps every export writer unchanged when the side croquis is rendered", () => {
    const pieces = blockPieces(draftAtSize(STANDARD_M, TEE.grade, 0, TEE.draft));
    const exportBundle = (): readonly unknown[] => [
      exportSvg(pieces, TEE.allowances, TEE.notches),
      exportDxf(pieces, TEE.allowances),
      exportPdf(pieces, TEE.allowances),
      exportTechPack(TEE, STANDARD_M),
      gradedMarker(TEE, STANDARD_M, 150),
      exportProjectorSvg(TEE, STANDARD_M),
      exportA0Pdf(pieces, TEE.allowances, TEE.notches),
    ];
    const before = exportBundle();
    renderSideCroquis(STANDARD_M, "upper");
    renderSideCroquis(STANDARD_M, "lower");
    expect(exportBundle()).toEqual(before);
  });
});
