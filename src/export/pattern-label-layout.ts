export interface PatternLabelBounds {
  readonly minX: number;
  readonly minY: number;
  readonly width: number;
  readonly height: number;
}

export interface PatternLabelPose {
  readonly x: number;
  readonly y: number;
  readonly fontSize: number;
  readonly rotation: 0 | 90;
}

/** Keep recipe-specific narrow-piece labels inside their cut bounds and clear of marks. */
export function patternLabelPose(
  pieceName: string,
  labelText: string,
  bounds: PatternLabelBounds,
  baseFontSize: number,
): PatternLabelPose {
  const centerX = bounds.minX + bounds.width / 2;
  const centerY = bounds.minY + bounds.height / 2;
  const normalizedName = pieceName.toLowerCase();
  if (normalizedName === "jogger waistband casing") {
    return {
      x: centerX,
      y: bounds.minY + bounds.height + 0.8,
      fontSize: Math.min(baseFontSize, 0.8),
      rotation: 0,
    };
  }
  if (normalizedName === "shorts waistband") {
    const widthFit = (bounds.width * 0.42) / Math.max(1, labelText.length * 0.58);
    return {
      x: bounds.minX + bounds.width * 0.25,
      y: centerY,
      fontSize: Math.min(baseFontSize, widthFit),
      rotation: 0,
    };
  }
  if (/^(?:shorts|jogger) (?:fly shield|fly underlap|pocket bag (?:left|right))$/iu.test(pieceName)) {
    const labelSpan = Math.max(1, labelText.length * 0.58);
    const isPocketBag = /^(?:shorts|jogger) pocket bag (?:left|right)$/iu.test(pieceName);
    const heightFit = (isPocketBag ? bounds.height * 0.45 : Math.max(0, bounds.height - 1)) / labelSpan;
    const widthFit = bounds.width * 0.3;
    const verticalPosition = isPocketBag
      ? bounds.minY + bounds.height * 0.68
      : centerY;
    return {
      x: bounds.minX + bounds.width * 0.3,
      y: verticalPosition,
      fontSize: Math.min(baseFontSize, heightFit, widthFit),
      rotation: 90,
    };
  }
  return { x: centerX, y: centerY, fontSize: baseFontSize, rotation: 0 };
}
