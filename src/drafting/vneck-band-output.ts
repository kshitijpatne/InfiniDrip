import type { GarmentOptions } from "./options";
import { edgeLength, pieceEdge, type Piece } from "./piece";

/** Ephemeral Tech Pack context; never saved as a garment design option. */
export const TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION = "teeSelectedSizeVBandOutput";
export const TEE_SELECTED_SIZE_NECKBAND_OUTPUT_OPTION = "teeSelectedSizeNeckbandOutput";

export function vNeckBodyPieces(
  pieces: readonly Piece[],
  familyLabel = "Tee",
): { readonly front: Piece; readonly back: Piece } {
  const front = pieces.find((piece) => piece.name.trim().toLowerCase() === "front")
    ?? pieces.find((piece) => piece.name.trim().toLowerCase() === "fitted front");
  const back = pieces.find((piece) => piece.name.trim().toLowerCase() === "back");
  if (!front || !back) throw new Error(`The selected ${familyLabel} pattern must include front and back pieces.`);
  return { front, back };
}

export function teeVBandTechPackOptions(
  baseOptions: GarmentOptions,
  selectedPieces: readonly Piece[],
  settings: { readonly lengthPercent: number; readonly finishedWidthCm: number },
  familyLabel = "Tee",
): GarmentOptions {
  const { front, back } = vNeckBodyPieces(selectedPieces, familyLabel);
  const necklineCm = 2 * (edgeLength(pieceEdge(front, "neckline")) + edgeLength(pieceEdge(back, "neckline")));
  if (!Number.isFinite(necklineCm) || necklineCm <= 0) {
    throw new Error(`The selected ${familyLabel} neckline geometry is not usable for a V-band Tech Pack.`);
  }
  return {
    ...baseOptions,
    teeNeckbandLengthPercent: settings.lengthPercent,
    teeNeckbandFinishedWidthCm: settings.finishedWidthCm,
    teeVNecklineCircumferenceCm: necklineCm,
    teeVNeckbandTargetLengthCm: necklineCm * settings.lengthPercent / 100,
    [TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION]: 1,
  };
}

export function teeNeckbandTechPackOptions(
  baseOptions: GarmentOptions,
  selectedPieces: readonly Piece[],
  settings: { readonly lengthPercent: number; readonly finishedWidthCm: number },
  familyLabel = "Tee",
): GarmentOptions {
  const { front, back } = vNeckBodyPieces(selectedPieces, familyLabel);
  const necklineCm = 2 * (edgeLength(pieceEdge(front, "neckline")) + edgeLength(pieceEdge(back, "neckline")));
  if (!Number.isFinite(necklineCm) || necklineCm <= 0) {
    throw new Error(`The selected ${familyLabel} neckline geometry is not usable for a neckband Tech Pack.`);
  }
  return {
    ...baseOptions,
    teeNeckbandLengthPercent: settings.lengthPercent,
    teeNeckbandFinishedWidthCm: settings.finishedWidthCm,
    teeNecklineCircumferenceCm: necklineCm,
    teeNeckbandTargetLengthCm: necklineCm * settings.lengthPercent / 100,
    [TEE_SELECTED_SIZE_NECKBAND_OUTPUT_OPTION]: 1,
  };
}
