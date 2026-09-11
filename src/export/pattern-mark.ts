// Format-neutral helpers for internal construction marks. They deliberately
// live beside writers: a mark has no effect on piece bounds, nesting, or seam
// allowance, but every cutting output must carry it at true scale.

import { PatternMark } from "../drafting";

const round = (n: number): number => Math.round(n * 1000) / 1000;
const pt = (cm: number): number => round(cm * 72 / 2.54);

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
const dxfNum = (n: number): string => round(n).toString();

/** DXF R12 entities on named construction layers. */
export function patternMarksDxf(marks: readonly PatternMark[] | undefined, height: number): string {
  if (!marks) return "";
  return marks.map((mark) => {
    const layer = `MARK_${mark.kind.toUpperCase()}`;
    if ("start" in mark) {
      return dxfPair(0, "LINE") + dxfPair(8, layer) +
        dxfPair(10, dxfNum(mark.start.x)) + dxfPair(20, dxfNum(height - mark.start.y)) +
        dxfPair(11, dxfNum(mark.end.x)) + dxfPair(21, dxfNum(height - mark.end.y));
    }
    if (mark.kind === "button") {
      return dxfPair(0, "CIRCLE") + dxfPair(8, layer) +
        dxfPair(10, dxfNum(mark.at.x)) + dxfPair(20, dxfNum(height - mark.at.y)) + dxfPair(40, "0.15");
    }
    return dxfPair(0, "POINT") + dxfPair(8, layer) +
      dxfPair(10, dxfNum(mark.at.x)) + dxfPair(20, dxfNum(height - mark.at.y));
  }).join("");
}

/** PDF path/text operators for marks, translated already into sheet coordinates. */
export function patternMarksPdfOps(marks: readonly PatternMark[] | undefined, sheetHeight: number): string {
  if (!marks || marks.length === 0) return "";
  const y = (v: number): number => pt(sheetHeight - v);
  const safe = (s: string): string => s.replace(/[()\\]/g, "");
  return marks.map((mark) => {
    if ("start" in mark) {
      const line = `${pt(mark.start.x)} ${y(mark.start.y)} m ${pt(mark.end.x)} ${y(mark.end.y)} l S`;
      return line + (mark.label ? ` BT /F1 7 Tf ${pt((mark.start.x + mark.end.x) / 2)} ${y((mark.start.y + mark.end.y) / 2 - 0.5)} Td (${safe(mark.label)}) Tj ET` : "");
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
