import { describe, expect, it } from "vitest";
import { point } from "../geometry";
import type { NestingProofInstance, NestingProofPiece } from "./nesting-proof-contract";
import { NESTING_PROOF_INSTANCE_VERSION, admitNestingProofInstance } from "./nesting-proof-contract";

const loop = [point(0, 0), point(2, 0), point(2, 2), point(0, 2)];

function piece(overrides: Partial<NestingProofPiece> = {}): NestingProofPiece {
  return {
    identity: "tee-front-m",
    flat: { name: "front", sew: loop, cut: loop },
    quantity: 1,
    materialId: "main",
    fold: "none",
    pairing: "single",
    allowedRotations: [0, 180],
    nap: "none",
    ...overrides,
  };
}

function instance(overrides: Partial<NestingProofInstance> = {}): NestingProofInstance {
  return {
    version: NESTING_PROOF_INSTANCE_VERSION,
    seed: 17,
    fabric: { widthCm: 150, edgeMarginCm: 1, clearanceCm: 2 },
    pieces: [piece()],
    ...overrides,
  };
}

describe("admitNestingProofInstance", () => {
  it("admits a fully explicit, single-material physical instance without mutating it", () => {
    const input = instance();
    const admitted = admitNestingProofInstance(input);
    expect(admitted).toEqual({ accepted: true, instance: input });
    expect(input.pieces[0].allowedRotations).toEqual([0, 180]);
  });

  it("rejects empty and structurally malformed instances", () => {
    expect(admitNestingProofInstance(instance({ pieces: [] }))).toMatchObject({
      accepted: false,
      rejection: "empty-input",
    });
    expect(admitNestingProofInstance(instance({ version: 0 as 1 }))).toMatchObject({
      accepted: false,
      rejection: "malformed-input",
    });
    expect(admitNestingProofInstance(instance({ seed: -1 }))).toMatchObject({
      accepted: false,
      rejection: "malformed-input",
    });
    expect(admitNestingProofInstance(instance({ fabric: { widthCm: 2, edgeMarginCm: 1, clearanceCm: -1 } }))).toMatchObject({
      accepted: false,
      rejection: "malformed-input",
    });
    expect(admitNestingProofInstance(instance({ pieces: [piece({ identity: "", quantity: 0 })] }))).toMatchObject({
      accepted: false,
      rejection: "malformed-input",
    });
    expect(admitNestingProofInstance(instance({ pieces: [piece({ flat: { name: "bad", sew: [], cut: loop } })] }))).toMatchObject({
      accepted: false,
      rejection: "malformed-input",
    });
  });

  it("rejects unknown and unsupported apparel semantics instead of guessing", () => {
    const cases: readonly [NestingProofPiece, string][] = [
      [piece({ fold: "unknown" }), "unknown-physical-semantics"],
      [piece({ pairing: "unknown" }), "unknown-physical-semantics"],
      [piece({ fold: "on-fold" }), "unsupported-fold"],
      [piece({ pairing: "mirror-pair" }), "unsupported-pairing"],
      [piece({ nap: "directional", allowedRotations: [0, 180] }), "unsupported-orientation"],
      [piece({ allowedRotations: [] }), "unsupported-orientation"],
    ];
    for (const [candidate, rejection] of cases) {
      expect(admitNestingProofInstance(instance({ pieces: [candidate] }))).toMatchObject({
        accepted: false,
        rejection,
      });
    }
    expect(admitNestingProofInstance(instance({ pieces: [piece(), piece({ identity: "tee-back-m", materialId: "rib" })] }))).toMatchObject({
      accepted: false,
      rejection: "unsupported-multi-material",
    });
  });
});
