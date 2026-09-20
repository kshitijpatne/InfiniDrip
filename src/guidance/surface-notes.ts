// Surface artwork guidance — warn-only notes for placements.
//
// Validity notes need no thresholds. Bounds, resolution, and coverage notes
// read through the piece-frame anchor contract (see surface/piece-frames):
// artwork centres sit on the piece cut-box centre plus the placement offset,
// evaluated at base size. Resolution floors at MIN_PRINT_PX_PER_CM, derived
// in SURFACE-DESIGN-RESEARCH.md from the 150 DPI textile-print minimum;
// coverage warns at a ratio of 1, the physical full-bleed boundary, never an
// invented budget. Notes carry actionable corrections and field keys the app
// resolves to real controls; dismissal, persistence, and reappearance ride
// the existing ignored-guidance behavior untouched.

import type { Note } from "./note";
import { placementError, type ArtworkPlacement } from "../surface/placement";
import { surfaceList, type SurfaceBook } from "../surface/store";
import {
  artworkBounds,
  artworkInPiece,
  artworkInsidePiece,
  artworkResolution,
  coverageRatio,
  resolvePieceFrame,
  type PieceFrameSet,
} from "../surface/piece-frames";

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
  "sourcePxWidth",
  "sourcePxHeight",
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
  frames?: PieceFrameSet,
): Note[] {
  const notes: Note[] = [];
  surfaceList(book, key).forEach((item, index) => {
    const error = placementError(item);
    if (error) {
      notes.push({
        level: "warn",
        field: surfaceErrorField(error, index),
        text: `Artwork '${displayId(item, index)}' on ${styleLabel}: ${error}`,
      });
      return;
    }
    if (frames) notes.push(...surfaceFrameNotes(item, index, styleLabel, frames));
  });
  return notes;
}

/** Deterministic print floor: the 150 DPI textile-print minimum in px/cm,
 * floored. Derivation lives in SURFACE-DESIGN-RESEARCH.md; the value is a
 * contributor proposal pending maintainer confirmation. */
export const MIN_PRINT_PX_PER_CM = 59;

/** Coverage ratio at or above piece area: full-bleed class by geometry. */
export const FULL_COVERAGE_RATIO = 1;

/** Bounds, resolution, and coverage notes for one valid placement. */
function surfaceFrameNotes(
  item: ArtworkPlacement,
  index: number,
  styleLabel: string,
  frames: PieceFrameSet,
): Note[] {
  const frame = resolvePieceFrame(frames, item.pieceRole);
  if (!frame) {
    return [{
      level: "warn",
      field: `surface-${index}-pieceRole`,
      text: `Artwork '${displayId(item, index)}' on ${styleLabel} names piece role ` +
        `'${item.pieceRole}' which is not in the current block. ` +
        (frames.roles.length === 0
          ? "No roles are available."
          : `Pick one of: ${frames.roles.join(", ")}.`),
    }];
  }
  const notes: Note[] = [];
  const corners = artworkInPiece(item, frame);
  const box = artworkBounds(corners);
  const centreX = (box.minX + box.maxX) / 2;
  const centreY = (box.minY + box.maxY) / 2;
  const centred = frame.minX <= centreX && centreX <= frame.maxX &&
    frame.minY <= centreY && centreY <= frame.maxY;
  if (!artworkInsidePiece(item, frame)) {
    notes.push({
      level: "warn",
      field: `surface-${index}-${centred ? "scale" : "dx"}`,
      text: `Artwork '${displayId(item, index)}' on ${styleLabel} extends beyond ` +
        `the ${frame.role} piece. Shrink it or move it toward the piece centre.`,
    });
  }
  const resolution = artworkResolution(item);
  if (resolution) {
    const floor = Math.min(resolution.xPxPerCm, resolution.yPxPerCm);
    if (floor < MIN_PRINT_PX_PER_CM) {
      notes.push({
        level: "warn",
        field: `surface-${index}-sourcePxWidth`,
        text: `Artwork '${displayId(item, index)}' on ${styleLabel} prints at ` +
          `about ${Math.floor(floor)} px/cm, below the ${MIN_PRINT_PX_PER_CM} px/cm ` +
          `floor for clean print. Use a higher-resolution source.`,
      });
    }
  }
  const ratio = coverageRatio(item, frame);
  if (ratio !== null && ratio >= FULL_COVERAGE_RATIO) {
    notes.push({
      level: "warn",
      field: `surface-${index}-scale`,
      text: `Artwork '${displayId(item, index)}' on ${styleLabel} covers about ` +
        `${Math.round(ratio * 100)}% of the ${frame.role} piece. Confirm full-coverage print intent.`,
    });
  }
  return notes;
}
