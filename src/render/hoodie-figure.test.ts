import { describe, expect, it } from "vitest";
import { rolePiece } from "../drafting/block";
import { draftHoodie } from "../drafting/hoodie";
import { resolveHoodieOptions } from "../drafting/hoodie-contract";
import { STANDARD_M } from "../drafting/measurements";
import { pieceToPath } from "./shape";
import { renderHoodieBody, renderHoodieBodyPair, renderHoodieGarment } from "./index";

const DISCLOSURE = "SCHEMATIC ONLY · NOT PATTERN-LINKED · NO FIT OR MATERIAL CLAIM";

function expectSourcePiece(svg: string, role: string, d: string): void {
  expect(svg).toContain('data-source-role="' + role + '"');
  expect(svg).toContain('data-role="' + role + '" d="' + d + '"');
}

describe("hidden Hoodie schematic views", () => {
  it("draws front/back Body views and their pair from the live draft pieces", () => {
    const options = resolveHoodieOptions();
    const block = draftHoodie(STANDARD_M, options);
    const front = renderHoodieBody(STANDARD_M, options, "front");
    const back = renderHoodieBody(STANDARD_M, options, "back");
    const pair = renderHoodieBodyPair(STANDARD_M, options);

    expect(front).toContain('aria-label="Hoodie front body schematic"');
    expectSourcePiece(front, "front", pieceToPath(rolePiece(block, "front")));
    expect(front).toContain('data-pattern-mark-name="kangarooPouchOpening"');
    expect(front).toContain('data-disclosure="schematic-not-pattern-linked"');
    expect(front).toContain(DISCLOSURE);
    expect(back).toContain('aria-label="Hoodie back body schematic"');
    expectSourcePiece(back, "back", pieceToPath(rolePiece(block, "back")));
    expect(back).not.toContain('data-pattern-mark-name="kangarooPouchOpening"');
    expect(back).toContain(DISCLOSURE);
    expect(pair.match(/<svg /gu)).toHaveLength(2);
    expect(pair).toContain("FRONT BODY");
    expect(pair).toContain("BACK BODY");
  });

  it("lays out every available source role and authored mark in the assembled view", () => {
    const options = resolveHoodieOptions();
    const block = draftHoodie(STANDARD_M, options);
    const svg = renderHoodieGarment(STANDARD_M, "#123456", options);

    expect(svg).toContain('aria-label="Hoodie assembled schematic"');
    for (const role of Object.keys(block.roles)) {
      expectSourcePiece(svg, role, pieceToPath(rolePiece(block, role)));
    }
    expect(svg).toContain('data-pattern-mark-name="hoodDrawcordExit"');
    expect(svg).toContain("KANGAROO POUCH · ON FOLD");
    expect(svg).toContain('data-on-fold="true"');
    expect(svg).toContain('fill="#123456"');
    expect(svg).toContain(DISCLOSURE);
  });

  it("uses valid custom draft options and preserves an explicitly omitted pouch", () => {
    const custom = {
      hoodHeight: 40,
      hoodDepth: 34,
      hoodFrontOverlap: 4,
      hoodCasingWidth: 2.5,
      pocketWidth: 42,
      pocketHeight: 24,
      pocketOpeningLength: 12,
      pocketOpeningAngle: 50,
      pocketHemClearance: 7,
    };
    const defaultView = renderHoodieGarment(STANDARD_M, "#123456");
    const customBlock = draftHoodie(STANDARD_M, resolveHoodieOptions(custom));
    const customView = renderHoodieGarment(STANDARD_M, "#123456", custom);
    const customFront = renderHoodieBody(STANDARD_M, custom, "front");
    const omittedBlock = draftHoodie(STANDARD_M, resolveHoodieOptions({ pocketWidth: 0 }));
    const omittedView = renderHoodieGarment(STANDARD_M, "#123456", { pocketWidth: 0 });
    const omittedFront = renderHoodieBody(STANDARD_M, { pocketWidth: 0 }, "front");

    expect(customView).not.toBe(defaultView);
    expectSourcePiece(customView, "hoodOuterLeft", pieceToPath(rolePiece(customBlock, "hoodOuterLeft")));
    expectSourcePiece(customFront, "front", pieceToPath(rolePiece(customBlock, "front")));
    expect(omittedBlock.roles.pocket).toBeUndefined();
    expect(omittedView).not.toContain('data-role="pocket"');
    expect(omittedFront).not.toContain('data-pattern-mark-name="kangarooPouchOpening"');
    expect(omittedView).toContain(DISCLOSURE);
  });
});
