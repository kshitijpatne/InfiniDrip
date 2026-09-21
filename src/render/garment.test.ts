import { describe, it, expect } from "vitest";
import { STANDARD_M, derive, necklineEdge, NECKLINE_DEFAULT } from "../drafting";
import { tankFrontNeckline, tankBackNeckline } from "../drafting/tank";
import { renderGarment, FABRICS, DEFAULT_FABRIC } from "./garment";
import { poloDetailsSvg } from "./polo-details";

describe("FABRICS", () => {
  it("offers a few fabric colours", () => {
    expect(FABRICS.length).toBeGreaterThan(2);
  });
  it("uses a real fabric colour as the default", () => {
    expect(FABRICS.map((f) => f.color)).toContain(DEFAULT_FABRIC);
  });
});

describe("renderGarment", () => {
  const svg = renderGarment(STANDARD_M, "#123456");
  it("produces one svg", () => {
    expect(svg.startsWith("<svg")).toBe(true);
  });
  it("draws the front and back silhouettes", () => {
    expect((svg.match(/<g transform/g) || []).length).toBe(2);
    expect(svg).toContain(">FRONT<");
    expect(svg).toContain(">BACK<");
  });
  it("fills the garment with the chosen fabric colour", () => {
    expect(svg).toContain('fill="#123456"');
  });
});

describe("renderGarment — sleeveless (Slice 60)", () => {
  const withSleeve = renderGarment(STANDARD_M, "#123456", true);
  const withoutSleeve = renderGarment(STANDARD_M, "#123456", false);

  it("still produces a valid svg with both silhouettes", () => {
    expect(withoutSleeve.startsWith("<svg")).toBe(true);
    expect(withoutSleeve).toContain(">FRONT<");
    expect(withoutSleeve).toContain(">BACK<");
  });

  it("draws a narrower figure than the sleeved version — no sleeve extending outward", () => {
    const widthOf = (svg: string): number => {
      const m = svg.match(/viewBox="0 0 ([\d.]+)/)!;
      return parseFloat(m[1]);
    };
    expect(widthOf(withoutSleeve)).toBeLessThan(widthOf(withSleeve));
  });

  it("draws no dashed armhole seam — a sleeveless armhole is a finished edge, not a seam", () => {
    expect(withSleeve).toContain("stroke-dasharray");
    expect(withoutSleeve).not.toContain("stroke-dasharray");
  });

  it("defaults hasSleeve to true when omitted", () => {
    expect(renderGarment(STANDARD_M, "#123456")).toEqual(withSleeve);
  });
});

describe("renderGarment — real neckline sync (Slice 61)", () => {
  const pathsOf = (svg: string): string[] => [...svg.matchAll(/<path d="([^"]+)"/g)].map((mm) => mm[1]);

  it("draws the front collar from the real necklineEdge(), not a fixed placeholder", () => {
    const d = derive(STANDARD_M);
    const { cNeck, hps } = necklineEdge(
      "front", d.neckWidthHalf, d.frontNeckDepth, d.shoulderHalf, STANDARD_M.armholeDepth, NECKLINE_DEFAULT);
    const [frontD] = pathsOf(renderGarment(STANDARD_M, "#123456"));
    expect(frontD).toContain(`${hps.x} 0`);
    expect(frontD).toContain(`0 ${cNeck.y}`);
    expect(frontD).toContain("C "); // real cubic curve, not the old "Q" placeholder
  });

  it("changing only the FRONT neckline shape moves only the front path, not the back's", () => {
    const [front1, back1] = pathsOf(renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT));
    const [front2, back2] = pathsOf(renderGarment(STANDARD_M, "#123456", true, tankFrontNeckline(STANDARD_M), NECKLINE_DEFAULT));
    expect(front2).not.toBe(front1); // the shape that changed
    expect(back2).toBe(back1);       // the shape that didn't
  });

  it("defaults both necklines to crew (NECKLINE_DEFAULT) when omitted", () => {
    expect(renderGarment(STANDARD_M, "#123456", true))
      .toEqual(renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT));
  });
});

describe("renderGarment — real strap position for a sleeveless garment (Slice 63)", () => {
  const pathsOf = (svg: string): string[] => [...svg.matchAll(/<path d="([^"]+)"/g)].map((mm) => mm[1]);

  it("draws BOTH front and back shoulder corners at the REAL strapWidth, not the full sleeved shoulder point", () => {
    const [front, back] = pathsOf(renderGarment(
      STANDARD_M, "#123456", false, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M), 8));
    expect(front).toContain("15 4"); // neckline edge (7) + finished strap width (8)
    expect(back).toContain("15 4");
    expect(front).not.toContain("22.5 4"); // NOT the full sleeved shoulderHalf
  });

  it("defaults to the full sleeved shoulder point when strapWidth is omitted — byte-identical to before Slice 63", () => {
    expect(renderGarment(STANDARD_M, "#123456", true, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M)))
      .toEqual(renderGarment(
        STANDARD_M, "#123456", true, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M), undefined));
  });

  it("moves the drawn strap point when strapWidth changes", () => {
    const [narrow] = pathsOf(renderGarment(
      STANDARD_M, "#123456", false, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M), 12));
    const [wide] = pathsOf(renderGarment(
      STANDARD_M, "#123456", false, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M), 20));
    expect(narrow).not.toBe(wide);
  });

  it("uses the drafted curved armhole for a tank, not a straight diagonal", () => {
    const [front] = pathsOf(renderGarment(
      STANDARD_M, "#123456", false, tankFrontNeckline(STANDARD_M), tankBackNeckline(STANDARD_M), 8));
    expect(front).toContain("C 13.75 9 20 19 27.5 24");
  });
});

describe("renderGarment — Polo V1", () => {
  const POLO = { placketLength: 14, placketWidth: 3, standHeight: 2, collarLeafDepth: 5 };

  it("shows selected finished collar, stand, placket, and three buttons only on the front", () => {
    const svg = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, {
      placketLength: 14, placketWidth: 3, standHeight: 2, collarLeafDepth: 5,
    });
    expect(svg).toContain('width="3" height="14"');
    expect((svg.match(/r="0.35"/g) ?? []).length).toBe(3);
    expect(svg).toContain("-7"); // stand + selected 5 cm leaf depth
    expect(svg).toContain('data-edge="option-standHeight"');
    expect(svg).toContain('data-edge="option-collarLeafDepth"');
  });

  it("moves the finished placket when its option changes", () => {
    const short = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, {
      placketLength: 14, placketWidth: 3, standHeight: 2, collarLeafDepth: 5,
    });
    const long = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, {
      placketLength: 20, placketWidth: 4, standHeight: 3, collarLeafDepth: 7,
    });
    expect(long).not.toBe(short);
    expect(long).toContain('width="4" height="20"');
  });

  it("keeps the neckline-following stand valid for a V neckline too", () => {
    const svg = renderGarment(STANDARD_M, "#123456", true,
      { shape: "v", widthEase: 0, frontDrop: 0 }, NECKLINE_DEFAULT, undefined, POLO);
    expect(svg).toContain("L 0");
    expect(svg).toContain('data-edge="option-standHeight"');
  });
});

describe("renderGarment — Polo V2", () => {
  const POLO_V2 = {
    placketLength: 14, placketWidth: 3, standHeight: 2, collarLeafDepth: 5,
    standFrontRise: 0.75, collarPointExtension: 1.5, sideVentDepth: 6, backHemDrop: 1.5,
  };

  it("renders neckline-derived collar details on both front and back with all option owners", () => {
    const svg = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, POLO_V2);
    expect((svg.match(/data-garment-detail="polo"/g) ?? []).length).toBe(2);
    expect(svg).toContain('data-garment-detail="polo" data-position="front"');
    expect(svg).toContain('data-garment-detail="polo" data-position="back"');
    for (const option of ["placketLength", "placketWidth", "standHeight", "collarLeafDepth", "standFrontRise", "collarPointExtension", "sideVentDepth", "backHemDrop"]) {
      expect(svg).toContain(`data-edge="option-${option}"`);
    }
    expect(svg).toContain('data-edge="option-sideVentDepth"><path');
    expect(svg).toContain('stroke-dasharray="2 1"');
    expect(svg).toContain('data-edge="option-backHemDrop"><path');
    expect(svg).toContain("71.5");
  });

  it("moves the finished silhouette and details when V2 values change", () => {
    const base = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, POLO_V2);
    const changed = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, {
      ...POLO_V2, standFrontRise: 1.5, collarPointExtension: 2.5, sideVentDepth: 9, backHemDrop: 3,
    });
    expect(changed).not.toBe(base);
    expect(changed).toContain('height="89"');
  });

  it("supports a closed vent and a level back hem without inventing open-edge cues", () => {
    const closed = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, {
      ...POLO_V2, sideVentDepth: 0, backHemDrop: 0,
    });
    expect(closed).toContain('data-edge="option-sideVentDepth"');
    expect(closed).toContain('data-edge="option-backHemDrop"');
    expect(closed).toContain('height="86"');
  });

  it("keeps the V2 detail fallback visible when the collar solver rejects non-finite input", () => {
    const svg = poloDetailsSvg({
      neckWidthHalf: 7, frontNeckDepth: 8, backNeckDepth: 3, shoulderHalf: 22.5,
      armholeDepth: 24, neckline: NECKLINE_DEFAULT,
      placketLength: 14, placketWidth: 3, standHeight: Number.NaN, collarLeafDepth: 5,
      standFrontRise: 0.75, collarPointExtension: 1.5, sideVentDepth: 6, backHemDrop: 1.5,
    });
    expect(svg).toContain('data-edge="option-standHeight"');
  });

  it("keeps partially specified V2 detail calls deterministic through their documented defaults", () => {
    const common = {
      neckWidthHalf: 7, frontNeckDepth: 8, shoulderHalf: 22.5, armholeDepth: 24,
      neckline: NECKLINE_DEFAULT, placketLength: 14, placketWidth: 3,
      standHeight: 2, collarLeafDepth: 5,
    };
    const front = poloDetailsSvg({ ...common, standFrontRise: 0.75, sideVentDepth: 0, backHemDrop: 0 });
    const back = poloDetailsSvg({ ...common, standFrontRise: 0.75, collarPointExtension: 1.5, position: "back", sideVentDepth: 0 });
    const flat = poloDetailsSvg({ ...common, collarPointExtension: 1.5 });
    expect(front).toContain('data-position="front"');
    expect(back).toContain('data-position="back"');
    expect(flat).toContain('data-position="front"');
    expect(front).not.toContain('data-edge="option-sideVentDepth">M');
  });

  it("keeps the back view renderable when the optional drop is not yet present", () => {
    const { backHemDrop: _backHemDrop, ...partial } = POLO_V2;
    const svg = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, partial);
    expect(svg).toContain('data-position="back"');
  });
});

describe("renderGarment — woven shirt integration", () => {
  const shirt = {
    neckWidthHalf: 10, frontNeckDepth: 8, backNeckDepth: 3,
    buttonCount: 6, buttonSpacing: 8, frontOverlap: 1.5, placketWidth: 3,
    standHeight: 2.5, collarLeafDepth: 6, yokeDepth: 10, pocketWidth: 12,
    pocketHeight: 13, sleeveBandDepth: 3, sideVentDepth: 3, hemTurn: 1,
  };

  it("shows the selected placket, yoke, pocket, vent, and six front buttons", () => {
    const svg = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, undefined, shirt);
    expect(svg).toContain('data-garment-detail="woven-shirt"');
    expect((svg.match(/data-garment-detail="woven-shirt"/g) ?? []).length).toBe(2);
    expect((svg.match(/data-edge="woven-button"/g) ?? []).length).toBe(6);
    expect(svg).toContain('data-edge="option-yokeDepth"');
    expect(svg).toContain('data-edge="option-pocketWidth"');
    expect(svg).toContain('data-edge="option-sideVentDepth"');
    expect(svg).toContain('data-edge="option-collarLeafDepth"');
    expect(svg).toContain('data-edge="option-sleeveBandDepth"');
    for (const option of ["neckEase", "buttonCount", "buttonSpacing", "frontOverlap", "pocketHeight", "hemTurn"]) {
      expect(svg).toContain(`data-edge="option-${option}"`);
    }
    expect(svg).toContain("C "); // the woven curved hem
  });

  it("keeps back-only yoke construction out of the front and uses selected collar/hem dimensions", () => {
    const svg = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, undefined, shirt);
    const front = svg.match(/<g data-garment-detail="woven-shirt" data-position="front"[\s\S]*?<\/g>/)![0];
    const back = svg.match(/<g data-garment-detail="woven-shirt" data-position="back"[\s\S]*?<\/g>/)![0];
    expect(front).not.toContain('data-edge="option-yokeDepth"');
    expect(back).toContain('data-edge="option-yokeDepth"');
    const altered = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, undefined, {
      ...shirt, collarLeafDepth: 8, sleeveBandDepth: 4, hemTurn: 2,
    });
    expect(altered).not.toBe(svg);
  });

  it("moves the assembled details when a live dimension changes", () => {
    const short = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, undefined, shirt);
    const long = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, undefined, { ...shirt, buttonSpacing: 9, pocketWidth: 14 });
    expect(long).not.toBe(short);
    expect((long.match(/data-edge="woven-button"/g) ?? []).length).toBe(6);
  });

  it("does not draw buttons for a non-finite button count", () => {
    const svg = renderGarment(STANDARD_M, "#123456", true, NECKLINE_DEFAULT, NECKLINE_DEFAULT, undefined, undefined, { ...shirt, buttonCount: Number.NaN });
    expect(svg).not.toContain('data-edge="woven-button"');
  });
});
