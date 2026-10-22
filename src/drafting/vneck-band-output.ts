import type { GarmentOptions } from "./options";
import { edgeLength, pieceEdge, type Piece } from "./piece";

/** Ephemeral Tech Pack context; never saved as a garment design option. */
export const TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION = "teeSelectedSizeVBandOutput";

export function teeVBandTechPackOptions(
  baseOptions: GarmentOptions,
  selectedPieces: readonly Piece[],
  settings: { readonly lengthPercent: number; readonly finishedWidthCm: number },
): GarmentOptions {
  const front = selectedPieces.find((piece) => piece.name.trim().toLowerCase() === "front");
  const back = selectedPieces.find((piece) => piece.name.trim().toLowerCase() === "back");
  if (!front || !back) throw new Error("The selected Tee pattern must include front and back pieces.");
  const necklineCm = 2 * (edgeLength(pieceEdge(front, "neckline")) + edgeLength(pieceEdge(back, "neckline")));
  if (!Number.isFinite(necklineCm) || necklineCm <= 0) {
    throw new Error("The selected Tee neckline geometry is not usable for a V-band Tech Pack.");
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
