import type { Edge } from "./piece";

type StraightEdge = Extract<Edge, { kind: "line" }>;

/** Keep the reference-edge assumption explicit and independently testable. */
export function fittedPrincessLineReferences(
  shoulder: Edge,
  hem: Edge,
  centerFront: Edge,
): { readonly shoulder: StraightEdge; readonly hem: StraightEdge; readonly centerFront: StraightEdge } {
  if (shoulder.kind !== "line" || hem.kind !== "line" || centerFront.kind !== "line") {
    throw new Error("Princess-seam fitted geometry requires straight shoulder, hem, and center-front references.");
  }
  return { shoulder, hem, centerFront };
}
