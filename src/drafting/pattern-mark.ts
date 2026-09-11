// Internal pattern marks are construction data, distinct from a piece's closed
// cutting outline. A polo's centre-front slit, placket folds, button centres,
// and buttonholes must survive exports without pretending to be exterior seams.

import { Point } from "../geometry";

export type PatternMark =
  | {
      readonly kind: "cutLine" | "foldLine" | "placementLine";
      readonly name: string;
      readonly start: Point;
      readonly end: Point;
      readonly label?: string;
    }
  | {
      readonly kind: "button" | "buttonhole" | "placementPoint";
      readonly name: string;
      readonly at: Point;
      readonly label?: string;
    };

export const lineMark = (
  kind: "cutLine" | "foldLine" | "placementLine", name: string,
  start: Point, end: Point, label?: string
): PatternMark => ({ kind, name, start, end, label });

export const pointMark = (
  kind: "button" | "buttonhole" | "placementPoint", name: string,
  at: Point, label?: string
): PatternMark => ({ kind, name, at, label });
