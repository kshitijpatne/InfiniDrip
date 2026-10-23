import { describe, expect, it } from "vitest";
import type { Piece } from "./piece";
import { teeVBandTechPackOptions, TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION, vNeckBodyPieces } from "./vneck-band-output";

const linePiece = (name: string, lengthCm: number): Piece => ({
  name,
  onFold: false,
  edges: [{ kind: "line", name: "neckline", start: { x: 0, y: 0 }, end: { x: lengthCm, y: 0 } }],
});

describe("teeVBandTechPackOptions", () => {
  it("measures front and back necklines and preserves the selected band settings", () => {
    const result = teeVBandTechPackOptions(
      { chestEase: 7 },
      [linePiece(" Front ", 9), linePiece("BACK", 10)],
      { lengthPercent: 84, finishedWidthCm: 2.4 },
    );

    expect(result).toEqual({
      chestEase: 7,
      teeNeckbandLengthPercent: 84,
      teeNeckbandFinishedWidthCm: 2.4,
      teeVNecklineCircumferenceCm: 38,
      teeVNeckbandTargetLengthCm: 31.92,
      [TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION]: 1,
    });
  });

  it("rejects a selected pattern without both front and back pieces", () => {
    expect(() => teeVBandTechPackOptions(
      {}, [linePiece("front", 9)], { lengthPercent: 84, finishedWidthCm: 2.4 },
    )).toThrow("The selected Tee pattern must include front and back pieces.");
  });

  it("rejects zero-length selected neckline geometry", () => {
    expect(() => teeVBandTechPackOptions(
      {}, [linePiece("front", 0), linePiece("back", 0)], { lengthPercent: 84, finishedWidthCm: 2.4 },
    )).toThrow("The selected Tee neckline geometry is not usable for a V-band Tech Pack.");
  });

  it("accepts the Fitted recipe's fitted-front role for its selected-size V-band", () => {
    const front = linePiece("Fitted Front", 9);
    const back = linePiece("Back", 10);
    const body = vNeckBodyPieces([front, back], "Fitted Tee");
    const result = teeVBandTechPackOptions({}, [front, back],
      { lengthPercent: 84, finishedWidthCm: 2.4 }, "Fitted Tee");

    expect(body).toEqual({ front, back });
    expect(result).toMatchObject({
      teeVNecklineCircumferenceCm: 38,
      teeVNeckbandTargetLengthCm: 31.92,
      [TEE_SELECTED_SIZE_VBAND_OUTPUT_OPTION]: 1,
    });
  });

  it("keeps family-specific errors clear when an Fitted body piece is missing", () => {
    expect(() => vNeckBodyPieces([linePiece("back", 10)], "Fitted Tee"))
      .toThrow("The selected Fitted Tee pattern must include front and back pieces.");
    expect(() => teeVBandTechPackOptions({}, [linePiece("fitted front", 0), linePiece("back", 0)],
      { lengthPercent: 84, finishedWidthCm: 2.4 }, "Fitted Tee"))
      .toThrow("The selected Fitted Tee neckline geometry is not usable for a V-band Tech Pack.");
  });
});
