// Guidance for the sleeved-top family (tee + fitted), owned by the recipe.
//
// These are the garment-SPECIFIC guidance checks the engine used to hard-code in
// guide(): the sleeve-cap↔armhole match, ease band, armhole depth, shoulder width.
// A skirt has no sleeve, so guide() must not name one itself. Moving them here (as
// `recipe.guidance`) is the guidance twin of Slice 35's recipe-owned sewability
// checks — the engine now calls `recipe.guidance(block, m)` and never reaches for a
// "sleeve".
//
// Lives in the drafting layer (with the recipe it belongs to) and imports the pure
// Note type from `../guidance/note`, which depends on nothing — so no cycle.

import { Block } from "./block";
import { Measurements } from "./measurements";
import { rolePiece } from "./block";
import { pieceEdge, edgeLength } from "./piece";
import { Note } from "../guidance/note";

/** The headline check: does the sleeve cap match the armhole it sews into? */
export function armholeMatch(block: Block): Note {
  const armhole =
    edgeLength(pieceEdge(rolePiece(block, "front"), "armhole")) +
    edgeLength(pieceEdge(rolePiece(block, "back"), "armhole"));
  const cap =
    edgeLength(pieceEdge(rolePiece(block, "sleeve"), "capLeft")) +
    edgeLength(pieceEdge(rolePiece(block, "sleeve"), "capRight"));
  const diff = cap - armhole; // positive = cap longer (normal easing)

  if (diff >= -1 && diff <= 4) {
    return { level: "ok", text: `Sleeve cap matches the armhole (ease ${diff.toFixed(1)} cm).` };
  }
  if (diff > 4) {
    return {
      level: "warn",
      text: `Sleeve cap is ${diff.toFixed(1)} cm longer than the armhole — the bicep is too ` +
            `wide for this armhole. Reduce bicep or increase armhole depth.`,
    };
  }
  return {
    level: "warn",
    text: `Sleeve cap is ${(-diff).toFixed(1)} cm shorter than the armhole — the sleeve will ` +
          `not reach. Increase bicep or reduce armhole depth.`,
  };
}

/** Ease, always surfaced: too tight to wear, roomy/oversized, or comfortable.
 *  Never silent — a positive "you're in range" is guidance too, and stops the reader
 *  wondering whether the check even ran. */
export function easeRange(m: Measurements): Note {
  if (m.ease < 5) {
    return { level: "warn", text: `Ease is ${m.ease} cm — tight to pull on. Most tees use 8–12 cm.` };
  }
  if (m.ease > 16) {
    return { level: "info", text: `Ease is ${m.ease} cm — roomy; expect an oversized fit.` };
  }
  return { level: "ok", text: `Ease is ${m.ease} cm — a comfortable amount for a tee.` };
}

/** An armhole too shallow for the chest binds the arm. */
export function armholeDepthCheck(m: Measurements): Note | null {
  const minDepth = m.chest / 8;
  if (m.armholeDepth < minDepth) {
    return {
      level: "warn",
      text: `Armhole depth (${m.armholeDepth} cm) is shallow for this chest — try at least ` +
            `${minDepth.toFixed(1)} cm.`,
    };
  }
  return null;
}

/** The shoulder point should not sit outside the side seam. */
export function shoulderCheck(m: Measurements): Note | null {
  const panel = (m.chest + m.ease) / 4;
  if (m.shoulderWidth / 2 > panel) {
    return {
      level: "warn",
      text: `Shoulder width (${m.shoulderWidth} cm) is wider than the body panel allows here — ` +
            `the shoulder point sits past the side seam. Reduce shoulder width or add chest/ease.`,
    };
  }
  return null;
}

/** The garment-specific guidance for a sleeved top, in the order the panel shows
 *  them. Nulls (checks that pass silently) are dropped. */
export function sleevedTopGuidance(block: Block, m: Measurements): Note[] {
  const notes: (Note | null)[] = [
    armholeMatch(block),
    easeRange(m),
    armholeDepthCheck(m),
    shoulderCheck(m),
  ];
  return notes.filter((n): n is Note => n !== null);
}
