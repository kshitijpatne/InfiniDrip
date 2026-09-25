import { describe, expect, it } from "vitest";
import { allowanceFor } from "./allowance";

describe("piece-specific cutting allowances", () => {
  it("prefers an exact piece edge, then a shared edge, then the default", () => {
    const spec = {
      default: 0.5,
      byEdge: { hem: 1 },
      byPieceEdge: { front: { hem: 2 } },
    } as const;
    expect(allowanceFor(spec, "hem", "front")).toBe(2);
    expect(allowanceFor(spec, "hem", "sleeve")).toBe(1);
    expect(allowanceFor(spec, "hem")).toBe(1);
    expect(allowanceFor(spec, "unknown", "sleeve")).toBe(0.5);
  });
});
