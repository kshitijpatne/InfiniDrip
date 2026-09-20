// Surface artwork guidance — warn-only notes for invalid placements.
//
// Validity is the only data-driven signal available without invented
// thresholds: out-of-bounds, resolution-floor, and ink-coverage warnings need
// piece anchoring, source dimensions, and researched thresholds that do not
// exist yet (see SURFACE-DESIGN-RESEARCH.md), so this module reports exactly
// what the placement contract already proves — nothing more. Notes carry the
// placementError text itself as the actionable correction and a field key the
// app resolves to the failing control; dismissal, persistence, and
// reappearance ride the existing ignored-guidance behavior untouched.

import type { Note } from "./note";
import { placementError } from "../surface/placement";
import { surfaceList, type SurfaceBook } from "../surface/store";

const FIELD_TOKENS: readonly string[] = [
  "widthCm",
  "heightCm",
  "dx",
  "dy",
  "scale",
  "rotationDeg",
  "zOrder",
  "kind",
  "pieceRole",
  "sourceName",
  "id",
];

/** Control key for a placement error: the failing aspect when the error names
 * one, otherwise the row itself (step navigation still lands on the panel). */
export function surfaceErrorField(error: string, index: number): string {
  const token = FIELD_TOKENS.find((candidate) => error.includes(candidate));
  return token === undefined ? `surface-${index}` : `surface-${index}-${token}`;
}

const displayId = (item: unknown, index: number): string => {
  const id = (item as { id?: unknown } | null | undefined)?.id;
  return typeof id === "string" && id.length > 0 ? id : `#${index + 1}`;
};

/** One warning per invalid placement, in stored order. Empty for valid sets. */
export function surfaceGuidance(
  book: SurfaceBook,
  key: string,
  styleLabel: string,
): Note[] {
  const notes: Note[] = [];
  surfaceList(book, key).forEach((item, index) => {
    const error = placementError(item);
    if (!error) return;
    notes.push({
      level: "warn",
      field: surfaceErrorField(error, index),
      text: `Artwork '${displayId(item, index)}' on ${styleLabel}: ${error}`,
    });
  });
  return notes;
}
