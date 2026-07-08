import { describe, it, expect } from "vitest";
import { STANDARD_M } from "./measurements";
import { draftFront } from "./tshirt";
import { draftFittedFront } from "./fitted";
import { dartOf, dartIntake } from "./dart";

describe("dartOf", () => {
  it("returns null for a piece with no dart", () => {
    expect(dartOf(draftFront(STANDARD_M))).toBeNull();
  });

  it("resolves the apex (leg join) and the two mouth points", () => {
    const f = draftFittedFront(STANDARD_M);
    const d = dartOf(f)!;
    // apex is interior (left of the side seam); mouth sits on the side seam
    const sideX = Math.max(...f.edges.flatMap((e) =>
      e.kind === "line" ? [e.start.x, e.end.x] : [e.curve.end.x]));
    expect(d.apex.x).toBeLessThan(sideX);
    expect(d.mouth[0].x).toBeCloseTo(sideX);
    expect(d.mouth[1].x).toBeCloseTo(sideX);
    // apex is the shared vertex of the two legs
    expect(d.apex).toEqual(point("bustDartUpper end", f));
  });
});

describe("dartIntake", () => {
  it("is zero without a dart and the mouth gap with one", () => {
    expect(dartIntake(draftFront(STANDARD_M))).toBe(0);
    expect(dartIntake(draftFittedFront(STANDARD_M))).toBeCloseTo(4);
  });
});

// tiny helper: the end point of a named leg edge, for the shared-apex assertion
function point(_label: string, f: ReturnType<typeof draftFittedFront>) {
  const e = f.edges.find((x) => x.name === "bustDartUpper")!;
  return e.kind === "line" ? e.end : e.curve.end;
}
