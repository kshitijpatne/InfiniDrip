import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { rolePiece } from "./block";
import { draftFitted, FITTED_OPTIONS, FITTED_PRINCESS_ENTRY_ID } from "./fitted";
import { specSheet } from "./pom";
import { gradeRun } from "./grading";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "./tshirt-grade";
import { FITTED_NOTCHES, FITTED_POMS, fittedPanelChecks } from "./fitted-tables";
import { defaultGarmentOptions } from "./options";
import { pieceEdge, edgeEnd, edgeStart, type Edge, type Piece } from "./piece";
import { resolveNotch } from "../render/notch";

function withEdge(piece: Piece, name: string, replacement: Edge): Piece {
  return { ...piece, edges: piece.edges.map((edge) => edge.name === name ? replacement : edge) };
}

describe("FITTED_NOTCHES", () => {
  it("gives the darted front its own rules and reuses the tee's back and sleeve", () => {
    expect(FITTED_NOTCHES.map((r) => r.pieceName)).toEqual([
      "fitted front", "fitted front center", "fitted side front (cut 2 mirrored)", "back", "sleeve",
    ]);
    const front = FITTED_NOTCHES[0];
    // the side notch lives on the lower side segment, below the dart mouth
    expect(front.notches.some((n) => n.edgeName === "sideLower")).toBe(true);
  });

  it("provides separate notches and a finite interior grainline for both F03 front panels", () => {
    const options = defaultGarmentOptions(FITTED_OPTIONS, FITTED_PRINCESS_ENTRY_ID);
    const block = draftFitted(STANDARD_M, options);
    const centerRule = FITTED_NOTCHES.find((rule) => rule.pieceName === "fitted front center")!;
    const sideRule = FITTED_NOTCHES.find((rule) => rule.pieceName === "fitted side front (cut 2 mirrored)")!;
    const center = rolePiece(block, "front");
    const side = rolePiece(block, "frontSide");
    const sideGrainline = sideRule.grainline.resolve!(side);
    const centerUpper = pieceEdge(center, "princessUpper");
    const sideUpper = pieceEdge(side, "princessUpper");

    expect(centerRule.notches.map((notch) => notch.edgeName)).toContain("princessUpper");
    expect(sideRule.notches.map((notch) => notch.edgeName)).toContain("princessUpper");
    const centerApexNotch = resolveNotch(center, centerRule.notches.find((notch) => notch.edgeName === "princessUpper")!);
    const sideApexNotch = resolveNotch(side, sideRule.notches.find((notch) => notch.edgeName === "princessUpper")!);
    expect(centerApexNotch.point).toEqual(edgeEnd(centerUpper));
    expect(sideApexNotch.point).toEqual(edgeStart(sideUpper));
    expect(sideGrainline.top.x).toBeCloseTo(sideGrainline.bottom.x, 9);
    expect(sideGrainline.top.y).toBeLessThan(sideGrainline.bottom.y);
    expect(sideGrainline.top.x).toBeGreaterThan(0);
    expect(sideGrainline.top.x).toBeLessThan(edgeEnd(pieceEdge(side, "sideUpper")).x);
    expect(edgeEnd(pieceEdge(center, "centerFront")).x).toBe(0);
  });

  it("resolves horizontal samples and falls back to lower edges when upper edges miss the grainline", () => {
    const options = defaultGarmentOptions(FITTED_OPTIONS, FITTED_PRINCESS_ENTRY_ID);
    const block = draftFitted(STANDARD_M, options);
    const side = rolePiece(block, "frontSide");
    const rule = FITTED_NOTCHES.find((candidate) => candidate.pieceName === "fitted side front (cut 2 mirrored)")!;
    const resolve = rule.grainline.resolve!;
    const originalSideUpper = pieceEdge(side, "sideUpper");
    const originalSideLower = pieceEdge(side, "sideLower");
    const underarmY = edgeStart(originalSideUpper).y;
    const hemY = edgeEnd(originalSideLower).y;
    const midpointY = (underarmY + hemY) / 2;
    const upper = pieceEdge(side, "princessUpper");
    const lower = pieceEdge(side, "princessLower");
    expect(upper.kind).toBe("curve");
    expect(lower.kind).toBe("curve");
    if (upper.kind !== "curve" || lower.kind !== "curve") throw new Error("Expected authored princess curves.");
    const horizontalCurve = (edge: Extract<Edge, { kind: "curve" }>, y: number): Edge => ({
      ...edge,
      curve: {
        start: { ...edge.curve.start, y },
        control1: { ...edge.curve.control1, y },
        control2: { ...edge.curve.control2, y },
        end: { ...edge.curve.end, y },
      },
    });

    const horizontalLine = withEdge(side, "princessUpper", {
      kind: "line", name: "princessUpper", start: { x: 2, y: midpointY }, end: { x: 4, y: midpointY },
    });
    const horizontalResult = resolve(horizontalLine);
    expect(Number.isFinite(horizontalResult.top.x)).toBe(true);
    expect(horizontalResult.top.x).toBe(horizontalResult.bottom.x);

    const fallbackHemY = underarmY + 10;
    const fallbackMidpointY = underarmY + 5;
    const upperMiss = withEdge(side, "princessUpper", horizontalCurve(upper, underarmY));
    const lowerHit = withEdge(upperMiss, "princessLower", horizontalCurve(lower, fallbackMidpointY));
    const sideUpperMiss = withEdge(lowerHit, "sideUpper", {
      kind: "line", name: "sideUpper", start: { x: 8, y: underarmY }, end: { x: 9, y: underarmY },
    });
    const sideLowerHit = withEdge(sideUpperMiss, "sideLower", {
      kind: "line", name: "sideLower", start: { x: 10, y: fallbackMidpointY }, end: { x: 12, y: fallbackHemY },
    });
    const fallback = resolve(sideLowerHit);
    expect(Number.isFinite(fallback.top.x)).toBe(true);
    expect(fallback.top.x).toBe(fallback.bottom.x);

    const noSeamIntersection = withEdge(
      withEdge(sideUpperMiss, "princessLower", horizontalCurve(lower, underarmY)),
      "sideLower", { kind: "line", name: "sideLower", start: { x: 10, y: fallbackHemY }, end: { x: 12, y: fallbackHemY } },
    );
    const noIntersection = resolve(noSeamIntersection);
    expect(Number.isNaN(noIntersection.top.x)).toBe(true);
    expect(Number.isNaN(noIntersection.bottom.x)).toBe(true);
  });
});

describe("fittedPanelChecks", () => {
  it("passes the closed-reference side, hem, trueing and retained-open-dart checks", () => {
    const results = fittedPanelChecks(draftFitted(STANDARD_M));
    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.map((result) => result.name)).toEqual([
      "Side seam (dart-closed reference)",
      "Side seam trued in closed reference",
      "Bust dart closed before trueing",
      "Hem level in dart-closed reference",
      "Hem square to fold (dart-closed reference)",
      "Open pattern retains one bust dart",
    ]);
    expect(results.find((result) => result.name === "Waist dart marks form one internal dart")).toBeUndefined();
  });

  it("checks F02 waist-dart marks as two internal legs with a shared apex", () => {
    const options = { waistDartWaistlineFromHps: 43, waistDartIntake: 2, waistDartLength: 10, waistDartPosition: 45 };
    const block = draftFitted(STANDARD_M, options);
    const valid = fittedPanelChecks(block).find((result) => result.name === "Waist dart marks form one internal dart");
    expect(valid).toMatchObject({ ok: true, detail: "two internal placement lines have a positive opening and meet at one apex" });

    const front = rolePiece(block, "front");
    const partial = { ...front, marks: front.marks?.filter((mark) => mark.name !== "waistDartLowerLeg") };
    const malformed = { ...block, roles: { ...block.roles, front: partial } };
    expect(fittedPanelChecks(malformed).find((result) => result.name === "Waist dart marks form one internal dart"))
      .toMatchObject({ ok: false, detail: "waist-dart marks are incomplete, non-finite, or do not meet at one apex" });

    const nonFinite = { ...front, marks: front.marks?.map((mark) => mark.name === "waistDartUpperLeg" && "start" in mark
      ? { ...mark, end: { ...mark.end, x: Number.NaN } }
      : mark) };
    const invalidNumbers = { ...block, roles: { ...block.roles, front: nonFinite } };
    expect(fittedPanelChecks(invalidNumbers)
      .find((result) => result.name === "Waist dart marks form one internal dart")?.ok).toBe(false);
  });

  it("detects a closed-reference side that no longer matches the back", () => {
    const block = draftFitted(STANDARD_M);
    const back = rolePiece(block, "back");
    const mismatchedBack = {
      ...back,
      edges: back.edges.map((edge) => edge.name === "side" && edge.kind === "line"
        ? { ...edge, end: { ...edge.end, y: edge.end.y + 1 } }
        : edge),
    };
    const malformed = { ...block, roles: { ...block.roles, back: mismatchedBack } };
    const results = fittedPanelChecks(malformed);
    expect(results.find((result) => result.name === "Side seam (dart-closed reference)")?.ok).toBe(false);
    expect(results.find((result) => result.name === "Hem level in dart-closed reference")?.ok).toBe(true);
  });

  it("detects a kink in the traced side seam", () => {
    const block = draftFitted(STANDARD_M);
    const front = rolePiece(block, "front");
    const malformedFront = {
      ...front,
      edges: front.edges.map((edge) => edge.name === "sideUpper" && edge.kind === "line"
        ? { ...edge, end: { ...edge.end, x: edge.end.x + 5 } }
        : edge),
    };
    const malformed = { ...block, roles: { ...block.roles, front: malformedFront } };
    const results = fittedPanelChecks(malformed);
    expect(results.find((result) => result.name === "Side seam trued in closed reference")?.ok).toBe(false);
  });
  it("reports malformed hem and fold geometry instead of passing its checks", () => {
    const block = draftFitted(STANDARD_M);
    const front = rolePiece(block, "front");
    const malformedFront = {
      ...front,
      edges: front.edges.map((edge) => edge.name === "centerFront" && edge.kind === "line"
        ? { ...edge, end: { ...edge.end, x: edge.end.x + 20 } }
        : edge),
    };
    const malformed = { ...block, roles: { ...block.roles, front: malformedFront } };
    const results = fittedPanelChecks(malformed);
    expect(results.find((result) => result.name === "Hem square to fold (dart-closed reference)")?.ok).toBe(false);

    const nonFiniteFront = {
      ...front,
      edges: front.edges.map((edge) => edge.name === "centerFront" && edge.kind === "line"
        ? { ...edge, start: { ...edge.start, y: Number.NaN } }
        : edge),
    };
    const nonFinite = { ...block, roles: { ...block.roles, front: nonFiniteFront } };
    expect(fittedPanelChecks(nonFinite)
      .find((result) => result.name === "Hem level in dart-closed reference")?.ok).toBe(false);
  });

  it("shows a failed mouth closure while retaining the authored dart", () => {
    const block = draftFitted(STANDARD_M);
    const front = rolePiece(block, "front");
    const malformedFront = {
      ...front,
      edges: front.edges.map((edge) => edge.name === "sideUpper" && edge.kind === "line"
        ? { ...edge, end: { ...edge.end, y: edge.end.y + 1 } }
        : edge),
    };
    const malformed = { ...block, roles: { ...block.roles, front: malformedFront } };
    const results = fittedPanelChecks(malformed);
    expect(results.find((result) => result.name === "Bust dart closed before trueing")).toMatchObject({ ok: false });
    expect(results.find((result) => result.name === "Open pattern retains one bust dart")).toMatchObject({ ok: true });
  });

  it("reports a failed transfer but preserves the named open-dart check", () => {
    const block = draftFitted(STANDARD_M);
    const front = rolePiece(block, "front");
    const malformedFront = { ...front, edges: front.edges.filter((edge) => edge.name !== "hem") };
    const malformed = { ...block, roles: { ...block.roles, front: malformedFront } };
    const results = fittedPanelChecks(malformed);
    expect(results.find((result) => result.name === "Bust dart closed before trueing")?.ok).toBe(false);
    expect(results.find((result) => result.name === "Open pattern retains one bust dart")?.ok).toBe(true);
  });
  it("keeps dart-retention and closure failures visible in checks", () => {
    const block = draftFitted(STANDARD_M);
    const front = rolePiece(block, "front");
    const malformed = { ...block, roles: { ...block.roles, front: { ...front, dart: undefined } } };
    const results = fittedPanelChecks(malformed);
    expect(results.find((result) => result.name === "Bust dart closed before trueing")).toMatchObject({ ok: false });
    expect(results.find((result) => result.name === "Open pattern retains one bust dart")).toMatchObject({ ok: false });
  });
  it("rejects malformed dart-leg naming during closure", () => {
    const block = draftFitted(STANDARD_M);
    const front = rolePiece(block, "front");
    const malformed = {
      ...block,
      roles: { ...block.roles, front: { ...front, dart: { legs: ["bustDartLower", "bustDartUpper"] as const } } },
    };
    const results = fittedPanelChecks(malformed);
    expect(results.find((result) => result.name === "Bust dart closed before trueing")?.ok).toBe(false);
    expect(results.find((result) => result.name === "Open pattern retains one bust dart")?.ok).toBe(false);
  });

  it("reports broken princess joins, shoulder placement, and panel cut semantics", () => {
    const options = defaultGarmentOptions(FITTED_OPTIONS, FITTED_PRINCESS_ENTRY_ID);
    const block = draftFitted(STANDARD_M, options);
    const center = rolePiece(block, "front");
    const side = rolePiece(block, "frontSide");
    const centerLower = pieceEdge(center, "princessLower");
    const sideShoulder = pieceEdge(side, "shoulder");
    expect(centerLower.kind).toBe("curve");
    expect(sideShoulder.kind).toBe("line");
    if (centerLower.kind !== "curve" || sideShoulder.kind !== "line") {
      throw new Error("Expected curved princess edges and a straight shoulder.");
    }
    const malformedCenter = {
      ...withEdge(center, "princessLower", {
        ...centerLower,
        curve: { ...centerLower.curve, start: { ...centerLower.curve.start, x: centerLower.curve.start.x + 0.5 } },
      }),
      onFold: false,
      dart: { legs: ["bustDartUpper", "bustDartLower"] as const },
    };
    const malformedSide = withEdge(side, "shoulder", {
      ...sideShoulder, start: { ...sideShoulder.start, x: sideShoulder.start.x + 0.5 },
    });
    const results = fittedPanelChecks({
      ...block, roles: { ...block.roles, front: malformedCenter, frontSide: malformedSide },
    });
    expect(results.find((result) => result.name === "Princess seam joins continuously through the apex"))
      .toMatchObject({ ok: false, detail: "one or both panel seams have a gap at the apex" });
    expect(results.find((result) => result.name === "Split shoulder joins continuously"))
      .toMatchObject({ ok: false, detail: "split shoulder edges do not meet" });
    expect(results.find((result) => result.name === "Center-front fold and side-front pair are distinct"))
      .toMatchObject({ ok: false, detail: "front panel cut semantics are inconsistent" });
    expect(results.find((result) => result.name === "Princess seam replaces the bust dart"))
      .toMatchObject({ ok: false, detail: "bust-dart geometry remains in the princess-seam pattern" });
  });
});

describe("FITTED_POMS", () => {
  const graded = gradeRun(STANDARD_M, TSHIRT_GRADE, TSHIRT_SIZES, draftFitted);
  const rows = specSheet(graded, FITTED_POMS);

  it("reports the dart intake and the closed side seam", () => {
    const intake = rows.find((r) => r.label === "Bust dart intake")!;
    expect(intake.values.every((v) => v === 4)).toBe(true);
    expect(rows.find((r) => r.label === "Side seam (dart closed)")).toBeDefined();
  });

  it("resolves every declared front POM callout anchor", () => {
    const block = draftFitted(STANDARD_M);
    const anchored = FITTED_POMS.filter((pom) => pom.anchor);
    expect(anchored).toHaveLength(3);
    expect(anchored.map((pom) => pom.anchor!(block))).toHaveLength(3);
  });

  it("measures body length at centre front, not the lengthened side", () => {
    const len = rows.find((r) => r.label === "Body length (HPS–hem)")!;
    const base = graded.findIndex((g) => g.step === 0);
    expect(len.values[base]).toBeCloseTo(STANDARD_M.length, 1);
  });
});
