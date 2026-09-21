// Epic 8's deliberately narrow input boundary.  This is not a nesting engine:
// it makes the physical facts a future solver must receive explicit, and refuses
// facts the current proof cannot faithfully carry.  `nestPieces` remains the
// product nesting implementation and is intentionally not imported here.

import type { FlatPiece } from "./layout";

export const NESTING_PROOF_INSTANCE_VERSION = 1 as const;

export type NestingProofRotation = 0 | 180;
export type NestingProofNap = "none" | "directional";
export type NestingProofFold = "none" | "on-fold" | "unknown";
export type NestingProofPairing = "single" | "mirror-pair" | "unknown";

export interface NestingProofFabric {
  readonly widthCm: number;
  readonly edgeMarginCm: number;
  readonly clearanceCm: number;
}

export interface NestingProofPiece {
  /** Stable origin identity; solver order and display labels cannot replace it. */
  readonly identity: string;
  /** InfiniDrip-owned geometry. A solver may never substitute this. */
  readonly flat: FlatPiece;
  /** Physical cut count, not a display or graded-marker count. */
  readonly quantity: number;
  /** A proof instance may contain exactly one material. */
  readonly materialId: string;
  /** Fold pieces need an owned fold-edge representation, not an inferred mirror. */
  readonly fold: NestingProofFold;
  /** Pair/mirror cutting is deferred until it has owned placement semantics. */
  readonly pairing: NestingProofPairing;
  /** 90/270-degree rotation is deliberately unrepresentable in this proof. */
  readonly allowedRotations: readonly NestingProofRotation[];
  readonly nap: NestingProofNap;
}

export interface NestingProofInstance {
  readonly version: typeof NESTING_PROOF_INSTANCE_VERSION;
  readonly seed: number;
  readonly fabric: NestingProofFabric;
  readonly pieces: readonly NestingProofPiece[];
}

export type NestingProofRejection =
  | "empty-input"
  | "malformed-input"
  | "unknown-physical-semantics"
  | "unsupported-fold"
  | "unsupported-pairing"
  | "unsupported-multi-material"
  | "unsupported-orientation";

export type NestingProofAdmission =
  | { readonly accepted: true; readonly instance: NestingProofInstance }
  | {
      readonly accepted: false;
      readonly rejection: NestingProofRejection;
      readonly detail: string;
    };

function reject(rejection: NestingProofRejection, detail: string): NestingProofAdmission {
  return { accepted: false, rejection, detail };
}

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function hasFiniteLoop(points: FlatPiece["cut"]): boolean {
  return (
    points.length >= 3 &&
    points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
  );
}

function supportsOrientation(piece: NestingProofPiece): boolean {
  const rotations = piece.allowedRotations;
  const rotationsAreKnown =
    rotations.length > 0 && rotations.every((rotation) => rotation === 0 || rotation === 180);
  const directionalNapIsFixed = piece.nap !== "directional" || rotations.every((rotation) => rotation === 0);
  return rotationsAreKnown && directionalNapIsFixed;
}

/**
 * Admit only proof instances whose physical facts have an exact current meaning.
 * This validates structural safety, not polygon simplicity, collision or a solver
 * result; those belong to the later owned adapter and placement-validator slices.
 */
export function admitNestingProofInstance(instance: NestingProofInstance): NestingProofAdmission {
  if (instance.version !== NESTING_PROOF_INSTANCE_VERSION) {
    return reject("malformed-input", "The nesting proof instance version is not supported.");
  }
  if (!Number.isSafeInteger(instance.seed) || instance.seed < 0) {
    return reject("malformed-input", "The nesting proof seed must be a non-negative safe integer.");
  }
  const { widthCm, edgeMarginCm, clearanceCm } = instance.fabric;
  if (
    !isFinitePositive(widthCm) ||
    !Number.isFinite(edgeMarginCm) ||
    edgeMarginCm < 0 ||
    edgeMarginCm * 2 >= widthCm ||
    !Number.isFinite(clearanceCm) ||
    clearanceCm < 0
  ) {
    return reject("malformed-input", "Fabric width, margins and clearance are not usable.");
  }
  if (instance.pieces.length === 0) {
    return reject("empty-input", "A true-shape proof needs at least one physical piece.");
  }

  const materialId = instance.pieces[0].materialId;
  for (const piece of instance.pieces) {
    if (
      piece.identity.trim().length === 0 ||
      piece.materialId.trim().length === 0 ||
      !Number.isSafeInteger(piece.quantity) ||
      piece.quantity < 1 ||
      !hasFiniteLoop(piece.flat.sew) ||
      !hasFiniteLoop(piece.flat.cut)
    ) {
      return reject("malformed-input", "A piece is missing finite geometry or physical identity.");
    }
    if (piece.fold === "unknown" || piece.pairing === "unknown") {
      return reject("unknown-physical-semantics", "Fold or pairing facts are unknown.");
    }
    if (piece.fold !== "none") {
      return reject("unsupported-fold", "Cut-on-fold needs an owned fold-edge contract.");
    }
    if (piece.pairing !== "single") {
      return reject("unsupported-pairing", "Mirror-pair cutting is outside this proof.");
    }
    if (piece.materialId !== materialId) {
      return reject("unsupported-multi-material", "A proof instance may contain one material only.");
    }
    if (!supportsOrientation(piece)) {
      return reject("unsupported-orientation", "The requested grain/nap rotation policy is not supported.");
    }
  }
  return { accepted: true, instance };
}
