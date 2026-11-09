import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { blockPieces, rolePiece } from "./block";
import { pieceEdge, edgeStart, edgeEnd, edgeLength } from "./piece";
import { draftSkirt, skirtPanelChecks, skirtGuidance, SKIRT_GRADE, SKIRT_POMS, SKIRT_NOTCHES, skirtPanel,
  SKIRT_A_LINE_HEM_SWEEP_OPTION_ID, SKIRT_A_LINE_HEM_POM, skirtHemSweepQuarterCm,
  SKIRT_PENCIL_HEM_TAPER_OPTION_ID, SKIRT_PENCIL_HEM_POM, skirtHemTaperQuarterCm,
  SKIRT_GATHER_RATIO_OPTION_ID, SKIRT_CASING_DEPTH_OPTION_ID,
  SKIRT_GATHERED_POMS, SKIRT_GATHERED_NOTCHES, gatheredSkirtOptions, isGatheredSkirtProfile } from "./skirt";
import { stitchChecks } from "./stitch";
import { resolveNotch } from "../render/notch";
import { SKIRT, gradeRun, specSheet } from "./index";

/** The whole sewability surface for a skirt — stitches plus panel checks
 *  together, the same combination garmentReport assembles in production. */
function allSkirtChecks(b: ReturnType<typeof draftSkirt>) {
  return [...stitchChecks(b, b.stitches), ...skirtPanelChecks(b)];
}

describe("draftSkirt", () => {
  it("drafts front/back panels and separate on-fold waistband pieces — no sleeve", () => {
    const b = draftSkirt(STANDARD_M);
    expect(blockPieces(b).map((p) => p.name).sort()).toEqual([
      "back", "front", "waistbandBack", "waistbandFront",
    ]);
    const edges = rolePiece(b, "front").edges.map((e) => e.name);
    expect(edges).toEqual(["waist", "sideUpper", "sideLower", "hem", "center"]);
    expect(rolePiece(b, "waistbandFront").onFold).toBe(true);
    expect(rolePiece(b, "waistbandBack").onFold).toBe(true);
    expect(() => rolePiece(b, "sleeve")).toThrow(); // structurally not a top
  });

  it("derives each waistband seam from its matching body's waist interface", () => {
    const b = draftSkirt(STANDARD_M);
    for (const [bodyRole, bandRole] of [
      ["front", "waistbandFront"],
      ["back", "waistbandBack"],
    ] as const) {
      expect(edgeLength(pieceEdge(rolePiece(b, bandRole), "seam")))
        .toBeCloseTo(edgeLength(pieceEdge(rolePiece(b, bodyRole), "waist")), 6);
    }
  });

  it("declares one continuous side zipper path from each band through the upper body seam", () => {
    const b = draftSkirt(STANDARD_M);
    const zipper = b.stitches.find((stitch) => stitch.label === "Side zipper path (waistband → hip)")!;
    expect(zipper.a.edges).toEqual([
      { piece: "waistbandFront", edge: "side" },
      { piece: "front", edge: "sideUpper" },
    ]);
    expect(zipper.b.edges).toEqual([
      { piece: "waistbandBack", edge: "side" },
      { piece: "back", edge: "sideUpper" },
    ]);
    expect(allSkirtChecks(b).find((check) => check.name === zipper.label)?.ok).toBe(true);
  });

  it("marks each side-zipper endpoint at the front and back hip transition", () => {
    const measurements = [
      STANDARD_M,
      { ...STANDARD_M, waist: 92, hip: 112, hipDepth: 22, length: 88, ease: 8 },
      { ...STANDARD_M, waist: 76, hip: 104, hipDepth: 18, length: 102, ease: 12 },
    ];
    for (const input of measurements) {
      const b = draftSkirt(input);
      for (const position of ["front", "back"] as const) {
        const piece = rolePiece(b, position);
        const table = SKIRT_NOTCHES.find((entry) => entry.pieceName === position)!;
        const rule = table.notches.find((notch) => notch.edgeName === "sideUpper" && notch.t === 1);
        expect(rule).toBeDefined();
        const resolved = resolveNotch(piece, rule!);
        const hipEndpoint = edgeEnd(pieceEdge(piece, "sideUpper"));
        expect(resolved.point).toEqual(hipEndpoint);
        expect(resolved.point).toEqual(edgeStart(pieceEdge(piece, "sideLower")));
      }
    }
  });
  it("makes the hip wider than the waist (the side seam tapers out)", () => {
    const front = rolePiece(draftSkirt(STANDARD_M), "front");
    const waistX = edgeEnd(pieceEdge(front, "waist")).x;      // side point at the waist
    const hipX = edgeStart(pieceEdge(front, "sideLower")).x;   // side point at the hip
    expect(hipX).toBeGreaterThan(waistX);
  });

  it("adds ease around the hip: finished hip = hip + ease", () => {
    const front = rolePiece(draftSkirt(STANDARD_M), "front");
    const hipQuarter = edgeStart(pieceEdge(front, "sideLower")).x;
    expect(hipQuarter * 4).toBeCloseTo(STANDARD_M.hip + STANDARD_M.ease, 5);
  });

  it("distributes the selected whole-garment hem sweep equally across four quarter panels", () => {
    expect(skirtHemSweepQuarterCm()).toBe(0);
    for (const sweep of [4, 12, 24]) {
      const options = { [SKIRT_A_LINE_HEM_SWEEP_OPTION_ID]: sweep };
      const block = draftSkirt(STANDARD_M, options);
      const front = rolePiece(block, "front");
      const back = rolePiece(block, "back");
      const straight = rolePiece(draftSkirt(STANDARD_M), "front");
      const hipX = edgeStart(pieceEdge(front, "sideLower")).x;
      const hemX = edgeStart(pieceEdge(front, "hem")).x;
      expect(skirtHemSweepQuarterCm(options)).toBe(sweep / 4);
      expect(hemX - hipX).toBeCloseTo(sweep / 4, 8);
      expect(edgeStart(pieceEdge(back, "hem")).x).toBeCloseTo(hemX, 8);
      expect(edgeStart(pieceEdge(front, "sideLower")).x)
        .toBe(edgeStart(pieceEdge(straight, "sideLower")).x);
      expect(edgeLength(pieceEdge(front, "hem")) - edgeLength(pieceEdge(straight, "hem")))
        .toBeCloseTo(sweep / 4, 8);
      expect(4 * (edgeLength(pieceEdge(front, "hem")) - edgeLength(pieceEdge(straight, "hem"))))
        .toBeCloseTo(sweep, 8);
      expect(SKIRT_A_LINE_HEM_POM.measure(block)).toBeCloseTo(STANDARD_M.hip + STANDARD_M.ease + sweep, 8);
      expect(SKIRT_A_LINE_HEM_POM.anchor?.(block))
        .toEqual(edgeStart(pieceEdge(front, "hem")));
      expect(SKIRT_A_LINE_HEM_POM.backAnchor?.(block))
        .toEqual(edgeStart(pieceEdge(back, "hem")));
      expect(allSkirtChecks(block).every((check) => check.ok)).toBe(true);
    }
  });

  it("narrows each of the four quarter hems by one quarter of the selected whole-garment taper", () => {
    expect(skirtHemTaperQuarterCm()).toBe(0);
    const straight = draftSkirt(STANDARD_M);
    const straightFront = rolePiece(straight, "front");
    const straightHemLength = edgeLength(pieceEdge(straightFront, "hem"));
    const waistPom = SKIRT_POMS.find((pom) => pom.label === "Waist (finished)")!;
    const hipPom = SKIRT_POMS.find((pom) => pom.label === "Hip (finished)")!;
    for (const taper of [4, 8, 12]) {
      const options = { [SKIRT_PENCIL_HEM_TAPER_OPTION_ID]: taper };
      const block = draftSkirt(STANDARD_M, options);
      const front = rolePiece(block, "front");
      const back = rolePiece(block, "back");
      const hipX = edgeStart(pieceEdge(front, "sideLower")).x;
      const hemX = edgeStart(pieceEdge(front, "hem")).x;
      expect(skirtHemTaperQuarterCm(options)).toBe(taper / 4);
      expect(hipX - hemX).toBeCloseTo(taper / 4, 8);
      expect(edgeStart(pieceEdge(back, "hem")).x).toBeCloseTo(hemX, 8);
      expect(hemX).toBeGreaterThan(0);
      expect(4 * (straightHemLength - edgeLength(pieceEdge(front, "hem")))).toBeCloseTo(taper, 8);
      expect(SKIRT_PENCIL_HEM_POM.measure(block)).toBeCloseTo(
        STANDARD_M.hip + STANDARD_M.ease - taper, 8,
      );
      expect(SKIRT_PENCIL_HEM_POM.anchor?.(block))
        .toEqual(edgeStart(pieceEdge(front, "hem")));
      expect(SKIRT_PENCIL_HEM_POM.backAnchor?.(block))
        .toEqual(edgeStart(pieceEdge(back, "hem")));
      expect(SKIRT.sizeMetric(block)).toBeCloseTo(SKIRT.sizeMetric(straight) - taper / 4, 8);
      expect(waistPom.measure(block)).toBeCloseTo(waistPom.measure(straight), 8);
      expect(hipPom.measure(block)).toBeCloseTo(hipPom.measure(straight), 8);
      expect(allSkirtChecks(block).every((check) => check.ok)).toBe(true);
      for (const piece of blockPieces(block)) {
        for (const edge of piece.edges) {
          const start = edgeStart(edge);
          const end = edgeEnd(edge);
          expect(Number.isFinite(start.x)).toBe(true);
          expect(Number.isFinite(start.y)).toBe(true);
          expect(Number.isFinite(end.x)).toBe(true);
          expect(Number.isFinite(end.y)).toBe(true);
        }
      }
    }
  });

  it("rejects negative, nonfinite, combined and hem-collapsing skirt adjustments", () => {
    expect(() => draftSkirt(STANDARD_M, { [SKIRT_PENCIL_HEM_TAPER_OPTION_ID]: -4 }))
      .toThrow(/cannot be negative/);
    expect(() => draftSkirt(STANDARD_M, { [SKIRT_A_LINE_HEM_SWEEP_OPTION_ID]: Number.NaN }))
      .toThrow(/must be finite/);
    expect(() => draftSkirt(STANDARD_M, {
      [SKIRT_A_LINE_HEM_SWEEP_OPTION_ID]: 4,
      [SKIRT_PENCIL_HEM_TAPER_OPTION_ID]: 4,
    })).toThrow(/cannot combine/);
    const quarterHip = (STANDARD_M.hip + STANDARD_M.ease) / 4;
    expect(() => skirtPanel(STANDARD_M, {
      position: "front", silhouette: "taper", hemTaperQuarterCm: quarterHip,
    })).toThrow(/positive finite quarter-panel width/);
  });
  // Slice 42: the waist-to-hip drop used to be a hard-coded HIP_DROP = 20 in this
  // file AND in render/skirt-figure.ts. It is now the real `hipDepth` measurement.
  // The gate is a MEASURED y-coordinate on the drafted piece, not a re-derivation.
  it("puts the hip point at exactly m.hipDepth below the waist", () => {
    const front = rolePiece(draftSkirt(STANDARD_M), "front");
    expect(edgeStart(pieceEdge(front, "sideLower")).y).toBeCloseTo(STANDARD_M.hipDepth, 5);
  });

  it("moves the hip point when hipDepth changes — it is no longer a constant", () => {
    const deep = rolePiece(draftSkirt({ ...STANDARD_M, hipDepth: 28 }), "front");
    expect(edgeStart(pieceEdge(deep, "sideLower")).y).toBeCloseTo(28, 5);

    const shallow = rolePiece(draftSkirt({ ...STANDARD_M, hipDepth: 14 }), "front");
    expect(edgeStart(pieceEdge(shallow, "sideLower")).y).toBeCloseTo(14, 5);
  });

  it("still drafts a sewable panel at the extremes of the hipDepth range", () => {
    for (const hipDepth of [12, 35]) {
      const b = draftSkirt({ ...STANDARD_M, hipDepth });
      expect(allSkirtChecks(b).every((c) => c.ok)).toBe(true);
    }
  });
});

describe("skirtPanelChecks", () => {
  it("returns just the hem and waist checks — the side seam is a stitch now, not here", () => {
    const checks = skirtPanelChecks(draftSkirt(STANDARD_M));
    expect(checks.map((c) => c.name)).toEqual(["Hem square to the fold", "Waist square to the fold"]);
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it("combined with its stitch, the full skirt check surface passes and names no sleeve", () => {
    const b = draftSkirt(STANDARD_M);
    const checks = allSkirtChecks(b);
    expect(checks.every((c) => c.ok)).toBe(true);
    const names = checks.map((c) => c.name);
    expect(names).toContain("Side seam (front ↔ back)");
    expect(names).toContain("Hem square to the fold");
    expect(names).toContain("Waist square to the fold");
    expect(names.join(" ")).not.toContain("Sleeve");
  });
});

describe("skirtGuidance", () => {
  it("is happy with a normal waist < hip and comfortable ease", () => {
    const notes = skirtGuidance(draftSkirt(STANDARD_M), STANDARD_M);
    expect(notes.every((n) => n.level === "ok")).toBe(true);
  });

  it("warns when the waist is not smaller than the hip", () => {
    const m = { ...STANDARD_M, waist: 110, hip: 100 };
    const notes = skirtGuidance(draftSkirt(m), m);
    expect(notes.some((n) => n.level === "warn" && n.text.includes("wider"))).toBe(true);
  });

  // Slice 42: making hipDepth editable opened a failure mode that was unreachable
  // while it was a constant — a hem at or above the hip line folds the panel over
  // itself. Warn, never clamp: the draft still runs, the user is told.
  it("warns when the hem does not clear the hip depth", () => {
    const m = { ...STANDARD_M, length: 18, hipDepth: 24 };
    const notes = skirtGuidance(draftSkirt(m), m);
    expect(notes.some((n) => n.level === "warn" && n.text.includes("clear the hip depth"))).toBe(true);
  });

  it("warns on the exact boundary (hem level with the hip), not just below it", () => {
    const m = { ...STANDARD_M, length: 20, hipDepth: 20 };
    const notes = skirtGuidance(draftSkirt(m), m);
    expect(notes.some((n) => n.text.includes("clear the hip depth"))).toBe(true);
  });

  it("stays silent about hip depth on a normal skirt", () => {
    const notes = skirtGuidance(draftSkirt(STANDARD_M), STANDARD_M);
    expect(notes.some((n) => n.text.includes("clear the hip depth"))).toBe(false);
  });

  it("warns on too-tight ease and informs on loose ease", () => {
    expect(skirtGuidance(draftSkirt(STANDARD_M), { ...STANDARD_M, ease: 0 }).some((n) => n.level === "warn")).toBe(true);
    expect(skirtGuidance(draftSkirt(STANDARD_M), { ...STANDARD_M, ease: 20 }).some((n) => n.level === "info")).toBe(true);
  });
});

describe("SKIRT recipe end-to-end", () => {
  it("grades a POM run that grows in order", () => {
    const graded = gradeRun(STANDARD_M, SKIRT_GRADE, SKIRT.sizes, draftSkirt);
    const spec = specSheet(graded, SKIRT_POMS);
    const hip = spec.find((r) => r.label.startsWith("Hip"))!;
    for (let i = 1; i < hip.values.length; i++) {
      expect(hip.values[i]).toBeGreaterThan(hip.values[i - 1]);
    }
  });

  it("uses the lower-body field set (waist/hip/hipDepth, no chest/sleeve)", () => {
    expect(SKIRT.fields).toEqual(["waist", "hip", "hipDepth", "length", "ease"]);
  });

  it("anchors waist and hip POMs to exact corresponding front and back panel vertices", () => {
    const drafts = [STANDARD_M,
      { ...STANDARD_M, waist: 92, hip: 112, hipDepth: 22, length: 88, ease: 8 },
      { ...STANDARD_M, waist: 76, hip: 104, hipDepth: 18, length: 102, ease: 12 }];
    for (const measurements of drafts) {
      const b = draftSkirt(measurements);
      const front = rolePiece(b, "front");
      const back = rolePiece(b, "back");
      const waist = SKIRT_POMS.find((pom) => pom.label === "Waist (finished)")!;
      const hip = SKIRT_POMS.find((pom) => pom.label === "Hip (finished)")!;
      expect(waist.anchor?.(b)).toEqual(edgeEnd(pieceEdge(front, "waist")));
      expect(waist.backAnchor?.(b)).toEqual(edgeEnd(pieceEdge(back, "waist")));
      expect(waist.backAnchor?.(b)).toEqual(waist.anchor?.(b));
      expect(hip.anchor?.(b)).toEqual(edgeStart(pieceEdge(front, "sideLower")));
      expect(hip.backAnchor?.(b)).toEqual(edgeStart(pieceEdge(back, "sideLower")));
      expect(hip.backAnchor?.(b)).toEqual(hip.anchor?.(b));
      expect(waist.measure(b)).toBeCloseTo(measurements.waist + measurements.ease, 6);
      expect(hip.measure(b)).toBeCloseTo(measurements.hip + measurements.ease, 6);
      const length = SKIRT_POMS.find((pom) => pom.label === "Length (waist–hem)")!;
      expect(length.anchor).toBeUndefined();
      expect(length.backAnchor).toBeUndefined();
    }
  });
});

describe("skirtPanel — the Component contract (Phase C1, Slice 58)", () => {
  it("keys its piece under the requested position, exposes a waist interface, declares no internal stitches", () => {
    const result = skirtPanel(STANDARD_M, { position: "front", silhouette: "straight" });
    expect(Object.keys(result.pieces)).toEqual(["front"]);
    expect(result.pieces.front.name).toBe("front");
    expect(result.stitches).toHaveLength(0);
    expect(result.interfaces.waist.edges).toEqual([{ piece: "front", edge: "waist" }]);
  });

  it("requires a positive finite sweep before drafting a flared panel", () => {
    expect(() => skirtPanel(STANDARD_M, { position: "front", silhouette: "flare" }))
      .toThrow(/requires a positive finite hem-sweep/);
    expect(() => skirtPanel(STANDARD_M, { position: "front", silhouette: "flare", hemSweepQuarterCm: Number.NaN }))
      .toThrow(/requires a positive finite hem-sweep/);
    const unsupported = "unknown" as unknown as "straight" | "flare";
    expect(() => skirtPanel(STANDARD_M, { position: "front", silhouette: unsupported }))
      .toThrow(/is not supported/);
  });

  it("requires a positive finite taper and rejects taper hidden in another silhouette", () => {
    expect(() => skirtPanel(STANDARD_M, { position: "front", silhouette: "taper" }))
      .toThrow(/requires a positive finite hem-taper/);
    expect(() => skirtPanel(STANDARD_M, {
      position: "front", silhouette: "taper", hemTaperQuarterCm: Number.NaN,
    })).toThrow(/requires a positive finite hem-taper/);
    expect(() => skirtPanel(STANDARD_M, {
      position: "front", silhouette: "taper", hemTaperQuarterCm: 0,
    })).toThrow(/requires a positive finite hem-taper/);
    expect(() => skirtPanel(STANDARD_M, {
      position: "front", silhouette: "taper", hemTaperQuarterCm: 2, hemSweepQuarterCm: 1,
    })).toThrow(/cannot include hem sweep/);
    expect(() => skirtPanel(STANDARD_M, {
      position: "front", silhouette: "flare", hemSweepQuarterCm: 3, hemTaperQuarterCm: 2,
    })).toThrow(/cannot include hem taper/);
    expect(() => skirtPanel(STANDARD_M, {
      position: "front", silhouette: "straight", hemTaperQuarterCm: 2,
    })).toThrow(/cannot include hem taper/);
    const tapered = skirtPanel(STANDARD_M, {
      position: "front", silhouette: "taper", hemTaperQuarterCm: 2,
    });
    expect(edgeStart(pieceEdge(tapered.pieces.front, "hem")).x)
      .toBeCloseTo((STANDARD_M.hip + STANDARD_M.ease) / 4 - 2, 8);
  });
  it("does not accept flare hidden inside a straight-panel request", () => {
    expect(() => skirtPanel(STANDARD_M, { position: "front", silhouette: "straight", hemSweepQuarterCm: 1 }))
      .toThrow(/cannot include hem sweep/);
    const flared = skirtPanel(STANDARD_M, { position: "front", silhouette: "flare", hemSweepQuarterCm: 3 });
    expect(edgeStart(pieceEdge(flared.pieces.front, "hem")).x)
      .toBeCloseTo((STANDARD_M.hip + STANDARD_M.ease) / 4 + 3, 8);
  });

  it("draftSkirt's front and back pieces ARE skirtPanel's output, not a re-derivation of it", () => {
    const b = draftSkirt(STANDARD_M);
    expect(rolePiece(b, "front")).toEqual(skirtPanel(STANDARD_M, { position: "front", silhouette: "straight" }).pieces.front);
    expect(rolePiece(b, "back")).toEqual(skirtPanel(STANDARD_M, { position: "back", silhouette: "straight" }).pieces.back);
  });
});

describe("K03 gathered pull-on skirt draft", () => {
  const options = { [SKIRT_GATHER_RATIO_OPTION_ID]: 1.5, [SKIRT_CASING_DEPTH_OPTION_ID]: 4 };

  it("drafts only two on-fold body panels with gather, fold and casing guide data", () => {
    expect(isGatheredSkirtProfile({})).toBe(false);
    expect(isGatheredSkirtProfile(options)).toBe(true);
    expect(gatheredSkirtOptions()).toEqual({ gatherRatio: 1.5, casingDepthCm: 4 });
    const block = draftSkirt(STANDARD_M, options);
    expect(blockPieces(block).map((piece) => piece.name)).toEqual(["front", "back"]);
    expect(Object.keys(block.roles)).toEqual(["front", "back"]);
    expect(block.stitches.map((stitch) => stitch.label)).toEqual(["Side seam (gathered front ↔ back)"]);
    expect(allSkirtChecks(block).every((check) => check.ok)).toBe(true);
    expect(rolePiece(block, "front").onFold).toBe(true);
    expect(() => rolePiece(block, "waistbandFront")).toThrow();
    expect(block.stitches.some((stitch) => stitch.label.toLowerCase().includes("zipper"))).toBe(false);

    const front = rolePiece(block, "front");
    expect(edgeLength(pieceEdge(front, "waist")) * 4).toBeCloseTo(STANDARD_M.waist * 1.5, 8);
    expect(edgeEnd(pieceEdge(front, "waist")).y).toBe(-4);
    expect(edgeStart(pieceEdge(front, "sideUpper")).y).toBe(0);
    expect(edgeStart(pieceEdge(front, "sideLower")).y).toBe(STANDARD_M.hipDepth);
    expect(front.marks?.map((mark) => mark.name)).toEqual(["casingFold", "casingStitchGuide"]);
    expect(front.marks?.[0]).toMatchObject({ kind: "foldLine", label: "Finished waist fold line" });
    expect(front.marks?.[1]).toMatchObject({ kind: "placementLine", label: "Casing stitch guide (software depth)" });
    expect(SKIRT_GATHERED_NOTCHES.map((entry) => entry.pieceName)).toEqual(["front", "back"]);
  });

  it("reports modeled waist, pre-gather cut waist, hip and finished fold-to-hem length", () => {
    const block = draftSkirt(STANDARD_M, options);
    expect(SKIRT_GATHERED_POMS.map((pom) => pom.label)).toEqual([
      "Cut waist edge (before gathering)",
      "Measured waist (digital gathered-to reference)",
      "Hip (modeled)",
      "Length (finished top fold–hem)",
    ]);
    expect(SKIRT_GATHERED_POMS.map((pom) => pom.measure(block))).toEqual([
      STANDARD_M.waist * 1.5,
      STANDARD_M.waist,
      STANDARD_M.hip + STANDARD_M.ease,
      STANDARD_M.length,
    ]);
    expect(SKIRT_GATHERED_POMS[0]!.anchor?.(block)).toEqual(edgeEnd(pieceEdge(rolePiece(block, "front"), "waist")));
    expect(SKIRT_GATHERED_POMS[0]!.backAnchor?.(block)).toEqual(edgeEnd(pieceEdge(rolePiece(block, "back"), "waist")));
    expect(SKIRT_GATHERED_POMS[2]!.anchor?.(block)).toEqual(edgeStart(pieceEdge(rolePiece(block, "front"), "sideLower")));
    expect(SKIRT_GATHERED_POMS[2]!.backAnchor?.(block)).toEqual(edgeStart(pieceEdge(rolePiece(block, "back"), "sideLower")));
    expect(() => SKIRT_GATHERED_POMS[1]!.measure(draftSkirt(STANDARD_M)))
      .toThrow(/missing its casing fold line/);
  });

  it("preserves finite out-of-range settings and keeps the measured waist target independent of hip ease", () => {
    expect(gatheredSkirtOptions({ [SKIRT_GATHER_RATIO_OPTION_ID]: 1.4 }).gatherRatio).toBe(1.4);
    expect(gatheredSkirtOptions({ [SKIRT_CASING_DEPTH_OPTION_ID]: 5.5 }).casingDepthCm).toBe(5.5);
    expect(() => gatheredSkirtOptions({ [SKIRT_GATHER_RATIO_OPTION_ID]: Number.NaN })).toThrow(/must be finite/);
    expect(() => draftSkirt(STANDARD_M, {
      ...options,
      [SKIRT_A_LINE_HEM_SWEEP_OPTION_ID]: 4,
    })).toThrow(/cannot combine/);
    const highEase = { ...STANDARD_M, waist: 50, ease: 30 };
    const minimumRatio = draftSkirt(highEase, {
      [SKIRT_GATHER_RATIO_OPTION_ID]: 1.25,
      [SKIRT_CASING_DEPTH_OPTION_ID]: 4,
    });
    expect(SKIRT_GATHERED_POMS[0]!.measure(minimumRatio)).toBe(62.5);
    expect(SKIRT_GATHERED_POMS[1]!.measure(minimumRatio)).toBe(50);
    expect(SKIRT_GATHERED_POMS[2]!.measure(minimumRatio)).toBe(highEase.hip + highEase.ease);
    const zeroHipDepth = draftSkirt({ ...STANDARD_M, hipDepth: 0 }, options);
    expect(rolePiece(zeroHipDepth, "front").marks?.[1]).toMatchObject({
      name: "casingStitchGuide",
      start: { x: 0, y: 4 },
      end: { x: STANDARD_M.waist / 4, y: 4 },
    });
  });
});
