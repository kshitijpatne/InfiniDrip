// SVG presentation of construction marks. Geometry owns mark coordinates;
// renderers only translate/style them, keeping export truth separate from UI.

import { PatternMark } from "../drafting";

const round = (n: number): number => Math.round(n * 1000) / 1000;

export interface PatternMarkStyle {
  readonly stroke: string;
  readonly width: number;
  readonly pointSize?: number;
  readonly labelSize?: number;
}

export function patternMarksSvg(
  marks: readonly PatternMark[] | undefined,
  style: PatternMarkStyle,
  dx = 0,
  dy = 0
): string {
  if (!marks || marks.length === 0) return "";
  const pointSize = style.pointSize ?? 0.35;
  const labelSize = style.labelSize ?? 1.6;
  return marks.map((mark) => {
    const attr = `data-pattern-mark="${mark.kind}" data-pattern-mark-name="${mark.name}"`;
    if ("start" in mark) {
      const dash = mark.kind === "cutLine" ? "3 1.5" : mark.kind === "foldLine" ? "1.5 1.5" : "0.8 1.2";
      const line = `<line ${attr} x1="${round(mark.start.x + dx)}" y1="${round(mark.start.y + dy)}" ` +
        `x2="${round(mark.end.x + dx)}" y2="${round(mark.end.y + dy)}" stroke="${style.stroke}" ` +
        `stroke-width="${style.width}" stroke-dasharray="${dash}" vector-effect="non-scaling-stroke"/>`;
      return line + (mark.label ? `<text x="${round((mark.start.x + mark.end.x) / 2 + dx)}" ` +
        `y="${round((mark.start.y + mark.end.y) / 2 + dy - 0.5)}" fill="${style.stroke}" ` +
        `font-size="${labelSize}" text-anchor="middle">${mark.label}</text>` : "");
    }
    const x = round(mark.at.x + dx);
    const y = round(mark.at.y + dy);
    const point = mark.kind === "button"
      ? `<circle ${attr} cx="${x}" cy="${y}" r="${pointSize}" fill="none" stroke="${style.stroke}" stroke-width="${style.width}" vector-effect="non-scaling-stroke"/>`
      : `<path ${attr} d="M ${round(x - pointSize)} ${y} L ${round(x + pointSize)} ${y} M ${x} ${round(y - pointSize)} L ${x} ${round(y + pointSize)}" fill="none" stroke="${style.stroke}" stroke-width="${style.width}" vector-effect="non-scaling-stroke"/>`;
    return point + (mark.label ? `<text x="${x}" y="${round(y - pointSize - 0.5)}" fill="${style.stroke}" ` +
      `font-size="${labelSize}" text-anchor="middle">${mark.label}</text>` : "");
  }).join("");
}
