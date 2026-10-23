import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import { DEFAULT_JEANS_OPTIONS } from "./jeans-contract";
import { buildJeansFrontPocket } from "./jeans-pocket";
import { edgeStart, pieceEdge, type Piece } from "./piece";

function frontBase(options: { readonly hipY?: number; readonly badSide?: boolean; readonly badInner?: boolean } = {}): Piece {
  const hipY = options.hipY ?? 22;
  const sideYoke = point(25, 4.5);
  const sideHip = point(27, hipY);
  const sideWaistToYoke = options.badSide
    ? {
        kind: "curve" as const,
        name: "sideWaistToYoke",
        curve: { start: point(24, 0), control1: point(24.5, 1.5), control2: point(25, 3), end: sideYoke },
      }
    : { kind: "line" as const, name: "sideWaistToYoke", start: point(24, 0), end: sideYoke };
  return {
    name: "jeans front left",
    onFold: false,
    edges: [
      { kind: "line", name: "waist", start: point(0, 0), end: point(24, 0) },
      sideWaistToYoke,
      { kind: "line", name: "sideYokeToHip", start: sideYoke, end: sideHip },
      { kind: "line", name: "sideHipToThigh", start: sideHip, end: point(20, 34) },
      { kind: "line", name: "sideThighToKnee", start: point(20, 34), end: point(18, 72) },
      { kind: "line", name: "sideKneeToHem", start: point(18, 72), end: point(20, 100) },
      { kind: "line", name: "hem", start: point(20, 100), end: point(6, 100) },
      { kind: "line", name: "inseamLower", start: point(6, 100), end: point(6, 72) },
      { kind: "line", name: "inseamUpper", start: point(6, 72), end: point(6, 34) },
      {
        kind: "line",
        name: "innerThighToCrotch",
        start: options.badInner ? point(Number.NaN, 34) : point(6, 34),
        end: point(9, 28),
      },
      {
        kind: "curve",
        name: "crotch",
        curve: { start: point(9, 28), control1: point(7, 27), control2: point(3, 27), end: point(0, 27) },
      },
      { kind: "line", name: "centerFront", start: point(0, 27), end: point(0, 0) },
    ],
  };
}

describe("Jeans front pocket geometry guards", () => {
  it("requires the original upper side boundary to remain straight", () => {
    expect(() => buildJeansFrontPocket(frontBase({ badSide: true }), DEFAULT_JEANS_OPTIONS))
      .toThrow(/sideWaistToYoke.*straight edge/);
  });

  it("rejects a drop beyond the front hip station", () => {
    expect(() => buildJeansFrontPocket(frontBase({ hipY: 10 }), { ...DEFAULT_JEANS_OPTIONS, frontPocketDrop: 12 }))
      .toThrow(/must fall between the Jeans waist and hip stations/);
  });

  it("rejects a non-finite front-panel boundary instead of building a bag through it", () => {
    expect(() => buildJeansFrontPocket(frontBase({ badInner: true }), DEFAULT_JEANS_OPTIONS))
      .toThrow(/no finite inner boundary/);
  });

  it("rejects a bag depth with no side boundary at the lower station", () => {
    const base = frontBase();
    const noLowerSide: Piece = {
      ...base,
      edges: base.edges.filter(({ name }) =>
        name !== "sideHipToThigh" && name !== "sideThighToKnee" && name !== "sideKneeToHem"),
    };
    expect(() => buildJeansFrontPocket(noLowerSide, DEFAULT_JEANS_OPTIONS))
      .toThrow(/no finite side boundary/);
  });

  it("walks horizontal sampled boundaries without inventing a non-finite intersection", () => {
    const ordinary = buildJeansFrontPocket(frontBase(), DEFAULT_JEANS_OPTIONS);
    const bottomY = edgeStart(pieceEdge(ordinary.bag, "bagBottom")).y;
    const base = frontBase();
    const horizontal: Piece = {
      ...base,
      edges: base.edges.map((edge) => edge.name === "innerThighToCrotch"
        ? { kind: "line", name: edge.name, start: point(7, bottomY), end: point(8, bottomY) }
        : edge.name === "crotch"
          ? {
              kind: "curve",
              name: edge.name,
              curve: {
                start: point(7, bottomY),
                control1: point(7.5, bottomY),
                control2: point(8, bottomY),
                end: point(8.5, bottomY),
              },
            }
          : edge),
    };
    expect(() => buildJeansFrontPocket(horizontal, DEFAULT_JEANS_OPTIONS)).not.toThrow();
  });
});
