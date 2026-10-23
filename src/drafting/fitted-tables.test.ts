import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { rolePiece } from "./block";
import { draftFitted } from "./fitted";
import { specSheet } from "./pom";
import { gradeRun } from "./grading";
import { TSHIRT_GRADE, TSHIRT_SIZES } from "./tshirt-grade";
import { FITTED_NOTCHES, FITTED_POMS, fittedPanelChecks } from "./fitted-tables";

describe("FITTED_NOTCHES", () => {
  it("gives the darted front its own rules and reuses the tee's back and sleeve", () => {
    expect(FITTED_NOTCHES.map((r) => r.pieceName)).toEqual(["fitted front", "back", "sleeve"]);
    const front = FITTED_NOTCHES[0];
    // the side notch lives on the lower side segment, below the dart mouth
    expect(front.notches.some((n) => n.edgeName === "sideLower")).toBe(true);
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
