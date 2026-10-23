import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { rolePiece, type Block } from "./block";
import { allowanceFor } from "./allowance";
import { gradeRun } from "./grading";
import { STANDARD_M } from "./measurements";
import { resolveGrainline, resolveNotch } from "../render/notch";
import { interfaceLength, stitchChecks } from "./stitch";
import { draftJogger, joggerOpeningFromBlock, JOGGER_GRAMMAR } from "./jogger";
import {
  JOGGER_ALLOWANCES,
  JOGGER_GRADE,
  JOGGER_NOTCHES,
  JOGGER_POMS,
  JOGGER_SIZES,
  JOGGER_TECH_PACK,
} from "./jogger-tables";
import { joggerGuidance } from "./jogger-guidance";
import { JOGGER_DEFAULT_OPTIONS } from "./jogger-contract";
import type { JoggerOptions } from "./jogger-contract";
import type { GarmentOptions } from "./options";
import { GARMENTS, JOGGER } from "./recipe";
import { pointMark } from "./pattern-mark";
import { pointOnEdge } from "../render/notch";
import type { Piece } from "./piece";

function sampledOutline(piece: Piece): { x: number; y: number }[] {
  return piece.edges.flatMap((edge) => Array.from({ length: edge.kind === "line" ? 1 : 24 }, (_, index) =>
    pointOnEdge(edge, index / (edge.kind === "line" ? 1 : 24))));
}

function hasProperSelfIntersection(points: readonly { x: number; y: number }[]): boolean {
  const cross = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x * b.y - a.y * b.x;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const ab = { x: b.x - a.x, y: b.y - a.y };
    for (let j = i + 2; j < points.length; j++) {
      if (i === 0 && j === points.length - 1) continue;
      const c = points[j], d = points[(j + 1) % points.length];
      const cd = { x: d.x - c.x, y: d.y - c.y };
      const denominator = cross(ab, cd);
      if (Math.abs(denominator) < 1e-9) continue;
      const ca = { x: c.x - a.x, y: c.y - a.y };
      const t = cross(ca, cd) / denominator;
      const u = cross(ca, ab) / denominator;
      if (t > 1e-8 && t < 1 - 1e-8 && u > 1e-8 && u < 1 - 1e-8) return true;
    }
  }
  return false;
}

describe("Jogger production contract", () => {
  it("composes the packeted pieces and exposes its real joins", () => {
    const registered = GARMENTS.find(({ name }) => name === "jogger");
    expect(registered).toBe(JOGGER);
    expect(registered?.grammar).toBe(JOGGER_GRAMMAR);
    expect(JOGGER_GRAMMAR.id).toBe("jogger");
    expect(JOGGER_GRAMMAR.nodes.map(({ id, kind, dependsOn }) => ({ id, kind, dependsOn }))).toEqual([
      { id: "legs", kind: "jogger-legs", dependsOn: [] },
      { id: "casing", kind: "self-fabric-casing", dependsOn: ["legs"] },
      { id: "pockets", kind: "slant-pocket-bags", dependsOn: ["legs", "casing"] },
    ]);
    const drafted = draftJogger(STANDARD_M);
    expect(Object.keys(drafted.roles)).toEqual([
      "frontLeft", "frontRight", "backLeft", "backRight", "waistband", "pocketBagLeft", "pocketBagRight",
    ]);
    expect(drafted.stitches.map(({ label }) => label)).toEqual([
      "Left jogger side seam", "Right jogger side seam", "Left jogger inseam", "Right jogger inseam",
      "Jogger centre-back rise", "Jogger waist to separate casing",
      "Left slant pocket opening to bag", "Right slant pocket opening to bag",
    ]);
    expect(stitchChecks(drafted, drafted.stitches).every(({ ok }) => ok)).toBe(true);
    for (const stitch of drafted.stitches) {
      expect(interfaceLength(drafted, stitch.a)).toBeCloseTo(interfaceLength(drafted, stitch.b), 6);
    }
    expect(joggerOpeningFromBlock(drafted, "frontLeft").start).toEqual(point(20, 2));
    const noOpening: Block = {
      ...drafted,
      roles: {
        ...drafted.roles,
        frontLeft: { ...rolePiece(drafted, "frontLeft"), marks: rolePiece(drafted, "frontLeft").marks?.filter(({ name }) => name !== "pocketOpening") },
      },
    };
    expect(() => joggerOpeningFromBlock(noOpening, "frontLeft")).toThrow(/no line pocketOpening mark/);
  });

  it("resolves allowances, notches, and grainlines on every actual cut piece", () => {
    const drafted = draftJogger(STANDARD_M);
    expect(JOGGER_ALLOWANCES.default).toBe(1);
    expect(JOGGER_ALLOWANCES.byEdge?.hem).toBe(2);
    expect(JOGGER_NOTCHES).toHaveLength(7);
    for (const piece of Object.values(drafted.roles)) {
      expect(piece.onFold).toBe(false);
      const rules = JOGGER_NOTCHES.find(({ pieceName }) => pieceName === piece.name);
      expect(rules, piece.name).toBeDefined();
      for (const edge of piece.edges) {
        expect(allowanceFor(JOGGER_ALLOWANCES, edge.name, piece.name), `${piece.name}:${edge.name}`).toBeGreaterThan(0);
      }
      for (const notch of rules!.notches) {
        const resolved = resolveNotch(piece, notch);
        expect(Number.isFinite(resolved.point.x) && Number.isFinite(resolved.point.y)).toBe(true);
      }
      const grainline = resolveGrainline(piece, rules!.grainline);
      expect(Number.isFinite(grainline.top.x) && Number.isFinite(grainline.top.y)).toBe(true);
      expect(Number.isFinite(grainline.bottom.x) && Number.isFinite(grainline.bottom.y)).toBe(true);
    }
    const frontNotch = JOGGER_NOTCHES.find(({ pieceName }) => pieceName === "jogger front left")!;
    expect(frontNotch.notches.map(({ edgeName }) => edgeName)).toContain("sideThighToKnee");
    expect(frontNotch.notches.map(({ edgeName }) => edgeName)).toContain("waist");
    const backNotch = JOGGER_NOTCHES.find(({ pieceName }) => pieceName === "jogger back left")!;
    expect(backNotch.notches.map(({ edgeName }) => edgeName).filter((edgeName) => edgeName.startsWith("side")))
      .toEqual(frontNotch.notches.map(({ edgeName }) => edgeName).filter((edgeName) => edgeName.startsWith("side")));
    expect(JOGGER_ALLOWANCES.byEdge?.opening).toBe(1);
    expect(JOGGER_ALLOWANCES.byEdge?.bottom).toBe(1);
  });

  it("grades XS through XL by redrafting and reads each POM from the live block", () => {
    const baseOptions: GarmentOptions = { ...JOGGER_DEFAULT_OPTIONS };
    const joggerDraft = (m: typeof STANDARD_M, options: GarmentOptions = {}) =>
      draftJogger(m, options as Partial<JoggerOptions>);
    const graded = gradeRun(STANDARD_M, JOGGER_GRADE, JOGGER_SIZES, joggerDraft, baseOptions);
    expect(graded.map(({ label }) => label)).toEqual(["XS", "S", "M", "L", "XL"]);
    expect(JOGGER_GRADE.ease).toBeUndefined();
    expect(JOGGER_GRADE.inseam).toBe(1.5);
    expect(JOGGER_POMS.map(({ label }) => label)).toContain("Hip depth (body reference)");
    expect(JOGGER_POMS.every(({ label }) => label === "Hip depth (body reference)" || label.includes("finished"))).toBe(true);
    for (const size of graded) {
      expect(stitchChecks(size.block, size.block.stitches).every(({ ok }) => ok), size.label).toBe(true);
      expect(joggerGuidance(size.block, size.measurements, JOGGER_DEFAULT_OPTIONS), size.label).toEqual([]);
      const pomValues = JOGGER_POMS.map(({ measure }) => measure(size.block));
      expect(pomValues.every(Number.isFinite), size.label).toBe(true);
      for (const piece of Object.values(size.block.roles)) {
        const outline = sampledOutline(piece);
        expect(outline.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y)), `${size.label}:${piece.name}`).toBe(true);
        expect(hasProperSelfIntersection(outline), `${size.label}:${piece.name}`).toBe(false);
      }
    }
    const medium = JOGGER_POMS.map(({ label, measure }) => [label, measure(graded[2].block)] as const);
    expect(medium.find(([label]) => label === "Waist (finished)")?.[1]).toBeCloseTo(94);
    expect(medium.find(([label]) => label === "Hip depth (body reference)")?.[1]).toBeCloseTo(STANDARD_M.hipDepth);
    expect(medium.find(([label]) => label === "Casing depth (finished)")?.[1]).toBeCloseTo(5.5);
    expect(medium.find(([label]) => label === "Left pocket opening (finished seam)")?.[1]).toBeCloseTo(16);
    const custom = draftJogger(STANDARD_M, { waistbandDepth: 6, pocketOpening: 18, pocketBagDepth: 24 });
    expect(JOGGER_POMS.find(({ label }) => label === "Casing depth (finished)")!.measure(custom)).toBeCloseTo(6);
    expect(JOGGER_POMS.find(({ label }) => label === "Left pocket opening (finished seam)")!.measure(custom)).toBeCloseTo(18);
    expect(JOGGER_POMS.find(({ label }) => label === "Pocket bag depth (finished)")!.measure(custom)).toBeCloseTo(24);
  });

  it("states construction without inventing cut lengths or unsupported quantities", () => {
    expect(JOGGER_TECH_PACK.bom).toHaveLength(4);
    expect(JOGGER_TECH_PACK.bom.find(({ material }) => material === "Elastic")?.qty).toMatch(/User-measured/);
    expect(JOGGER_TECH_PACK.bom.find(({ material }) => material === "Knit main fabric")?.qty).toMatch(/single-bolt estimate only/);
    const instructions = JOGGER_TECH_PACK.construction.join(" ");
    expect(instructions).toMatch(/centre-back retention mark/i);
    expect(instructions).toMatch(/buttonholes/);
    expect(instructions).toMatch(/plain leg hems/);
    expect(instructions).not.toMatch(/cut elastic to .* waist|elastic .* 10% shorter/i);
  });

  it("keeps default guidance clear and reports invalid raw controls and body fields", () => {
    const drafted = draftJogger(STANDARD_M);
    expect(joggerGuidance(drafted, STANDARD_M)).toEqual([]);
    const invalidOptions = joggerGuidance(draftJogger(STANDARD_M, { elasticWidth: Number.NaN }), STANDARD_M, { elasticWidth: Number.NaN });
    expect(invalidOptions.some(({ field, text }) => field === "option-elasticWidth" && /finite/.test(text))).toBe(true);
    const invalidExit = { ...JOGGER_DEFAULT_OPTIONS, drawcordExit: 2 };
    expect(joggerGuidance(draftJogger(STANDARD_M, invalidExit), STANDARD_M, invalidExit)
      .some(({ field, text }) => field === "option-drawcordExit" && /outside the 0–1 range/.test(text))).toBe(true);
    const invalidBody = { ...STANDARD_M, hipDepth: Number.POSITIVE_INFINITY };
    const invalidBodyNotes = joggerGuidance(draftJogger(STANDARD_M), invalidBody);
    expect(invalidBodyNotes.some(({ field, text }) => field === "hipDepth" && /finite body measurement/.test(text))).toBe(true);
    const zeroBody = { ...STANDARD_M, thigh: 0 };
    expect(joggerGuidance(draftJogger(STANDARD_M), zeroBody).some(({ field, text }) => field === "thigh" && /must be positive/.test(text))).toBe(true);
  });

  it("names actionable corrections for casing, rise, and drawcord conflicts", () => {
    const options = {
      ...JOGGER_DEFAULT_OPTIONS,
      frontRiseEase: 8,
      backRiseEase: 2,
      waistbandDepth: 40,
      elasticWidth: 5,
      drawcordCutWidth: 5,
      drawcordExitSpacing: 100,
    };
    const notes = joggerGuidance(draftJogger(STANDARD_M, options), STANDARD_M, options);
    expect(notes.some(({ text }) => /Back rise .* not greater/.test(text))).toBe(true);
    expect(notes.some(({ text }) => /Casing depth reaches the front rise/.test(text))).toBe(true);
    expect(notes.some(({ text }) => /Casing depth reaches the back rise/.test(text))).toBe(true);
    expect(notes.some(({ field, text }) => field === "option-drawcordExitSpacing" && /does not fit the finished waist/.test(text))).toBe(true);
    const channelOptions = { ...JOGGER_DEFAULT_OPTIONS, waistbandDepth: 5, elasticWidth: 5, drawcordCutWidth: 5 };
    expect(joggerGuidance(draftJogger(STANDARD_M, channelOptions), STANDARD_M, channelOptions)
      .some(({ text }) => /below the declared elastic\/drawcord channel need/.test(text))).toBe(true);
  });

  it("reports body ordering, nonpositive girths, and incoherent leg progression", () => {
    const measurements = { ...STANDARD_M, waist: 110, hip: 100, hipDepth: 40, crotchDepth: 30, thigh: 20, knee: 40, ease: -120 };
    const options = { ...JOGGER_DEFAULT_OPTIONS, thighEase: 0, kneeEase: 5, legOpening: 25 };
    const notes = joggerGuidance(draftJogger(measurements, options), measurements, options);
    expect(notes.some(({ field }) => field === "waist")).toBe(true);
    expect(notes.some(({ field }) => field === "hipDepth")).toBe(true);
    expect(notes.some(({ field }) => field === "ease")).toBe(true);
    expect(notes.some(({ field, text }) => field === "thigh" && /not wider than the knee/.test(text))).toBe(true);
    const tapered = { ...STANDARD_M, thigh: 100, knee: 40 };
    const taperOptions = { ...JOGGER_DEFAULT_OPTIONS, thighEase: 0, kneeEase: 0, legOpening: 25 };
    const taperNotes = joggerGuidance(draftJogger(tapered, taperOptions), tapered, taperOptions);
    expect(taperNotes.some(({ text }) => /knee-to-opening drop/.test(text))).toBe(true);
    const tooWide = { ...JOGGER_DEFAULT_OPTIONS, legOpening: 65 };
    expect(joggerGuidance(draftJogger(STANDARD_M, tooWide), STANDARD_M, tooWide).some(({ text }) => /wider than the finished knee/.test(text))).toBe(true);
    const zeroOpening = { ...JOGGER_DEFAULT_OPTIONS, legOpening: 0 };
    expect(joggerGuidance(draftJogger(STANDARD_M, zeroOpening), STANDARD_M, zeroOpening).some(({ field, text }) => field === "option-thighEase" && /must stay positive/.test(text))).toBe(true);
  });

  it("reports pocket opening escape, front-rise collision, bag depth, and missing marks", () => {
    const escapeOptions = { ...JOGGER_DEFAULT_OPTIONS, pocketOpening: 25, pocketAngle: 0 };
    const escaped = joggerGuidance(draftJogger(STANDARD_M, escapeOptions), STANDARD_M, escapeOptions);
    expect(escaped.some(({ field, text }) => field === "option-pocketOpening" && /leaves the Jogger front panel/.test(text))).toBe(true);
    expect(escaped.some(({ field, text }) => field === "option-pocketBagDepth" && /extends past the Jogger front-panel boundary/.test(text))).toBe(true);
    const farOptions = { ...JOGGER_DEFAULT_OPTIONS, pocketDrop: 200 };
    expect(joggerGuidance(draftJogger(STANDARD_M, farOptions), STANDARD_M, farOptions)
      .some(({ field, text }) => field === "option-pocketOpening" && /leaves the Jogger front panel/.test(text))).toBe(true);
    const deepOptions = { ...JOGGER_DEFAULT_OPTIONS, pocketAngle: 70, pocketOpening: 25, pocketDrop: 15, pocketBagDepth: 100 };
    const deep = joggerGuidance(draftJogger(STANDARD_M, deepOptions), STANDARD_M, deepOptions);
    expect(deep.some(({ field, text }) => field === "option-pocketDrop" && /reaches the front rise/.test(text))).toBe(true);
    expect(deep.some(({ text }) => /reaches the knee region/.test(text))).toBe(true);
    expect(deep.some(({ text }) => /reaches the hem/.test(text))).toBe(true);
    const drafted = draftJogger(STANDARD_M);
    const front = rolePiece(drafted, "frontLeft");
    const missing: Block = { ...drafted, roles: { ...drafted.roles, frontLeft: { ...front, marks: front.marks?.filter(({ name }) => name !== "pocketOpening") } } };
    expect(joggerGuidance(missing, STANDARD_M).some(({ text }) => /no line pocket-opening mark/.test(text))).toBe(true);
    const wrongMark: Block = {
      ...drafted,
      roles: {
        ...drafted.roles,
        frontLeft: {
          ...front,
          marks: [...(front.marks?.filter(({ name }) => name !== "pocketOpening") ?? []), pointMark("placementPoint", "pocketOpening", point(2, 2))],
        },
      },
    };
    expect(joggerGuidance(wrongMark, STANDARD_M).some(({ text }) => /no line pocket-opening mark/.test(text))).toBe(true);
  });

  it("does not hide a nonpositive inseam or a horizontal casing mark", () => {
    const short = { ...STANDARD_M, inseam: 0, hipDepth: 0 };
    const shortDraft = draftJogger(short, { pocketDrop: 0 });
    const notes = joggerGuidance(shortDraft, short, { pocketDrop: 0 });
    expect(notes.some(({ field, text }) => field === "inseam" && /must be positive/.test(text))).toBe(true);
    const badChannel = { ...STANDARD_M, inseam: 0 };
    const casing = rolePiece(draftJogger(badChannel), "waistband");
    expect(casing.marks?.some((mark) => mark.kind === "placementLine")).toBe(true);
  });
});
