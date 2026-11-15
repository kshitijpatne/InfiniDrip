export interface A0ExportStatus {
  readonly disabled: boolean;
  readonly description: string;
  readonly title: string | null;
}

/** Keep true-scale A0 limitations and the available tiled fallback explicit. */
export function a0ExportStatus(
  oversizedPieceNames: readonly string[],
  overflowAllowed: boolean,
): A0ExportStatus {
  if (oversizedPieceNames.length === 0) {
    return { disabled: false, description: "Full-sheet print · selected size", title: null };
  }
  if (!overflowAllowed) {
    const name = oversizedPieceNames[0]!;
    return {
      disabled: true,
      description: `${name} exceeds a single A0 sheet at true scale. Use the tiled PDF export.`,
      title: `${name} exceeds A0 at true scale. Use the tiled PDF export.`,
    };
  }
  return {
    disabled: false,
    description: "A0 sheets tile oversized pieces at true scale. Print at 100% and align the registration marks; a separate scale-check page is included.",
    title: "Oversized pieces are tiled across A0 sheets at true scale; print at 100% and align the registration marks.",
  };
}
