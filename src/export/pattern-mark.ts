// Format-neutral helpers for internal construction marks. They deliberately
// live beside writers: a mark has no effect on piece bounds, nesting, or seam
// allowance, but every cutting output must carry it at true scale.

import { PatternMark } from "../drafting";

const round = (n: number): number => Math.round(n * 1000) / 1000;
const pt = (cm: number): number => round(cm * 72 / 2.54);

export type PatternMarkPdfLabelLayout =
  | "inline"
  | "staggered-box-pleat-guides"
  | "line-aligned-box-pleat-guides";

export function translatePatternMarks(
  marks: readonly PatternMark[] | undefined, dx: number, dy: number
): readonly PatternMark[] {
  if (!marks) return [];
  return marks.map((mark) => "start" in mark
    ? { ...mark, start: { x: mark.start.x + dx, y: mark.start.y + dy }, end: { x: mark.end.x + dx, y: mark.end.y + dy } }
    : { ...mark, at: { x: mark.at.x + dx, y: mark.at.y + dy } });
}

/** Mirror off-fold marks for projector single-layer output; fold marks stay once. */
export function unfoldPatternMarks(marks: readonly PatternMark[] | undefined): readonly PatternMark[] {
  if (!marks) return [];
  const onFold = (x: number): boolean => Math.abs(x) <= 0.01;
  const mirror = (mark: PatternMark): PatternMark => "start" in mark
    ? { ...mark, name: `${mark.name}-mirror`, start: { x: -mark.start.x, y: mark.start.y }, end: { x: -mark.end.x, y: mark.end.y } }
    : { ...mark, name: `${mark.name}-mirror`, at: { x: -mark.at.x, y: mark.at.y } };
  return marks.flatMap((mark) => {
    const entirelyOnFold = "start" in mark
      ? onFold(mark.start.x) && onFold(mark.end.x)
      : onFold(mark.at.x);
    return entirelyOnFold ? [mark] : [mark, mirror(mark)];
  });
}

const dxfPair = (code: number, value: string | number): string => `${code}\n${value}\n`;
const dxfNum = (n: number, coordinateDecimals: 3 | 6): string => {
  const scale = 10 ** coordinateDecimals;
  return (Math.round(n * scale) / scale).toString();
};

/** DXF R12 entities on named construction layers. */
export function patternMarksDxf(
  marks: readonly PatternMark[] | undefined, height: number, coordinateDecimals: 3 | 6 = 3,
  buttonholePointStyle: "point" | "cross" = "point",
): string {
  if (!marks) return "";
  return marks.map((mark) => {
    const layer = `MARK_${mark.kind.toUpperCase()}`;
    if ("start" in mark) {
      return dxfPair(0, "LINE") + dxfPair(8, layer) +
        dxfPair(10, dxfNum(mark.start.x, coordinateDecimals)) + dxfPair(20, dxfNum(height - mark.start.y, coordinateDecimals)) +
        dxfPair(11, dxfNum(mark.end.x, coordinateDecimals)) + dxfPair(21, dxfNum(height - mark.end.y, coordinateDecimals));
    }
    if (mark.kind === "button") {
      return dxfPair(0, "CIRCLE") + dxfPair(8, layer) +
        dxfPair(10, dxfNum(mark.at.x, coordinateDecimals)) + dxfPair(20, dxfNum(height - mark.at.y, coordinateDecimals)) + dxfPair(40, "0.15");
    }
    if (buttonholePointStyle === "cross" && mark.kind === "buttonhole") {
      const halfSpan = 0.25;
      const centerY = height - mark.at.y;
      return dxfPair(0, "LINE") + dxfPair(8, layer) +
        dxfPair(10, dxfNum(mark.at.x - halfSpan, coordinateDecimals)) + dxfPair(20, dxfNum(centerY, coordinateDecimals)) +
        dxfPair(11, dxfNum(mark.at.x + halfSpan, coordinateDecimals)) + dxfPair(21, dxfNum(centerY, coordinateDecimals)) +
        dxfPair(0, "LINE") + dxfPair(8, layer) +
        dxfPair(10, dxfNum(mark.at.x, coordinateDecimals)) + dxfPair(20, dxfNum(centerY - halfSpan, coordinateDecimals)) +
        dxfPair(11, dxfNum(mark.at.x, coordinateDecimals)) + dxfPair(21, dxfNum(centerY + halfSpan, coordinateDecimals));
    }
    return dxfPair(0, "POINT") + dxfPair(8, layer) +
      dxfPair(10, dxfNum(mark.at.x, coordinateDecimals)) + dxfPair(20, dxfNum(height - mark.at.y, coordinateDecimals));
  }).join("");
}

/** PDF path/text operators for marks, translated already into sheet coordinates. */
export function patternMarksPdfOps(
  marks: readonly PatternMark[] | undefined,
  sheetHeight: number,
  labelLayout: PatternMarkPdfLabelLayout = "inline",
  sheetWidth?: number,
): string {
  if (!marks || marks.length === 0) return "";
  const y = (v: number): number => pt(sheetHeight - v);
  const safe = (s: string): string => s.replace(/[()\\]/g, "");
  const pageHeightPt = pt(sheetHeight);
  const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
  const lineAlignedLabelOrigins = new Map<number, { x: number; y: number; vertical: boolean }>();
  if (labelLayout === "line-aligned-box-pleat-guides" && sheetWidth !== undefined) {
    const occupied: Array<{ x: number; y: number; halfWidth: number; halfHeight: number }> = [];
    const candidates = marks.flatMap((mark, index) => {
      if (!("start" in mark) || !mark.label || !/^Box pleat \d+ (fold|roll|placement)$/i.test(mark.label)) return [];
      const dx = Math.abs(mark.start.x - mark.end.x);
      const dy = Math.abs(mark.start.y - mark.end.y);
      const vertical = dx < 0.01 && dy >= 0.01;
      const horizontal = dy < 0.01 && dx >= 0.01;
      return vertical || horizontal ? [{ mark, index, vertical }] : [];
    });

    for (const { mark, index, vertical } of candidates) {
      const labelWidth = mark.label!.length * 7 * 0.5;
      const labelLengthCm = labelWidth / pt(1);
      const marginCm = 0.25;
      let min: number;
      let max: number;
      let fixedX: number;
      let fixedY: number;
      if (vertical) {
        const lineX = (mark.start.x + mark.end.x) / 2;
        if (lineX < 0 || lineX > sheetWidth) continue;
        const visibleStart = Math.max(0, Math.min(mark.start.y, mark.end.y));
        const visibleEnd = Math.min(sheetHeight, Math.max(mark.start.y, mark.end.y));
        if (visibleEnd - visibleStart < labelLengthCm + marginCm * 2) continue;
        min = visibleStart + labelLengthCm / 2 + marginCm;
        max = visibleEnd - labelLengthCm / 2 - marginCm;
        const preferredOffset = lineX <= sheetWidth / 2 ? 0.4 : -0.4;
        fixedX = pt(lineX + preferredOffset);
        fixedY = (visibleStart + visibleEnd) / 2;
      } else {
        const lineY = (mark.start.y + mark.end.y) / 2;
        if (lineY < 0 || lineY > sheetHeight) continue;
        const visibleStart = Math.max(0, Math.min(mark.start.x, mark.end.x));
        const visibleEnd = Math.min(sheetWidth, Math.max(mark.start.x, mark.end.x));
        if (visibleEnd - visibleStart < labelLengthCm + marginCm * 2) continue;
        min = visibleStart + labelLengthCm / 2 + marginCm;
        max = visibleEnd - labelLengthCm / 2 - marginCm;
        const linePageY = y(lineY);
        const inwardOffset = linePageY < 9 ? pt(0.3) : linePageY > pageHeightPt - 9 ? -pt(0.3) : pt(0.3);
        fixedX = (visibleStart + visibleEnd) / 2;
        fixedY = sheetHeight - (linePageY + inwardOffset) / pt(1);
      }

      const base = clamp(vertical ? fixedY : fixedX, min, max);
      const step = labelLengthCm + marginCm * 2;
      const positions = [base, min, max];
      for (let distance = step; distance <= max - min; distance += step) positions.push(base + distance, base - distance);
      positions.sort((left, right) => Math.abs(left - base) - Math.abs(right - base));
      const halfAlong = labelLengthCm / 2 + marginCm;
      const halfAcross = 0.25;
      const centerX = vertical ? fixedX / pt(1) : 0;
      const centerY = vertical ? 0 : fixedY;
      const placement = positions.find((position) => {
        if (position < min || position > max) return false;
        const x = vertical ? centerX : position;
        const yCenter = vertical ? position : centerY;
        const halfWidth = vertical ? halfAcross : halfAlong;
        const halfHeight = vertical ? halfAlong : halfAcross;
        return !occupied.some((box) =>
          Math.abs(x - box.x) < halfWidth + box.halfWidth &&
          Math.abs(yCenter - box.y) < halfHeight + box.halfHeight
        );
      });
      if (placement === undefined) continue;
      const centerXcm = vertical ? centerX : placement;
      const centerYcm = vertical ? placement : centerY;
      const halfWidth = vertical ? halfAcross : halfAlong;
      const halfHeight = vertical ? halfAlong : halfAcross;
      occupied.push({ x: centerXcm, y: centerYcm, halfWidth, halfHeight });
      const origin = vertical
        ? { x: fixedX, y: round(y(centerYcm) - labelWidth / 2), vertical: true }
        : { x: round(pt(centerXcm) - labelWidth / 2), y: round(y(centerYcm)), vertical: false };
      lineAlignedLabelOrigins.set(index, origin);
    }
  }

  return marks.map((mark, index) => {
    if ("start" in mark) {
      const line = `${pt(mark.start.x)} ${y(mark.start.y)} m ${pt(mark.end.x)} ${y(mark.end.y)} l S`;
      if (!mark.label) return line;
      const boxPleatLabel = /^Box pleat \d+ (fold|roll|placement)$/i.test(mark.label);
      const dx = Math.abs(mark.start.x - mark.end.x);
      const dy = Math.abs(mark.start.y - mark.end.y);
      if (labelLayout === "line-aligned-box-pleat-guides" && boxPleatLabel && dx < 0.01) {
        const labelWidth = mark.label.length * 7 * 0.5;
        const lineX = (mark.start.x + mark.end.x) / 2;
        const allocated = lineAlignedLabelOrigins.get(index);
        if (allocated?.vertical) return line + ` BT /F1 7 Tf 0 1 -1 0 ${allocated.x} ${allocated.y} Tm (${safe(mark.label)}) Tj ET`;
        if (sheetWidth !== undefined) return line;
        const labelX = pt(lineX + 0.4);
        const labelY = round(y((mark.start.y + mark.end.y) / 2) - labelWidth / 2);
        return line + ` BT /F1 7 Tf 0 1 -1 0 ${labelX} ${labelY} Tm (${safe(mark.label)}) Tj ET`;
      }
      if (labelLayout === "line-aligned-box-pleat-guides" && boxPleatLabel && dy < 0.01) {
        const labelWidth = mark.label.length * 7 * 0.5;
        const lineY = (mark.start.y + mark.end.y) / 2;
        const allocated = lineAlignedLabelOrigins.get(index);
        if (allocated && !allocated.vertical) return line + ` BT /F1 7 Tf ${allocated.x} ${allocated.y} Td (${safe(mark.label)}) Tj ET`;
        if (sheetWidth !== undefined) return line;
        const labelX = round(pt((mark.start.x + mark.end.x) / 2) - labelWidth / 2);
        return line + ` BT /F1 7 Tf ${labelX} ${y(lineY) + pt(0.3)} Td (${safe(mark.label)}) Tj ET`;
      }
      const boxPleatRole = labelLayout === "staggered-box-pleat-guides" && Math.abs(mark.start.x - mark.end.x) < 0.01
        ? /^Box pleat \d+ (fold|roll|placement)$/i.exec(mark.label)?.[1]?.toLowerCase()
        : undefined;
      const roleOffsetCm = boxPleatRole === "fold" ? -0.8 : boxPleatRole === "placement" ? 0.8 : 0;
      const labelX = pt((mark.start.x + mark.end.x) / 2 + (boxPleatRole ? 0.25 : 0));
      const labelY = y((mark.start.y + mark.end.y) / 2 - 0.5 + roleOffsetCm);
      return line + ` BT /F1 7 Tf ${labelX} ${labelY} Td (${safe(mark.label)}) Tj ET`;
    }
    const size = pt(0.25);
    const x = pt(mark.at.x);
    const cy = y(mark.at.y);
    const cross = mark.kind === "button"
      ? `${x - size} ${cy - size} ${size * 2} ${size * 2} re S`
      : `${x - size} ${cy} m ${x + size} ${cy} l S ${x} ${cy - size} m ${x} ${cy + size} l S`;
    return cross + (mark.label ? ` BT /F1 7 Tf ${x} ${cy + size + 4} Td (${safe(mark.label)}) Tj ET` : "");
  }).join("\n");
}
