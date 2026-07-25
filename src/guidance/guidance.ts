// The guidance engine: it reads a t-shirt block plus its measurements and
// returns plain-English notes about whether the pattern is sound. Every check
// is a small, enforceable fact about a valid t-shirt — no guessing.

import { Measurements, Block, edgeLength, pieceEdge, rolePiece } from "../drafting";
import { plausibilityChecks, coherenceChecks } from "./plausibility";

export type Level = "ok" | "info" | "warn";

export interface Note {
  readonly level: Level;
  readonly text: string;
}

/** Severity as an ICON, not colour alone — so the signal survives colour-blindness
 *  and greyscale. Defined once here; every renderer (this app's guidance panel, and
 *  Fable's journey UI) reads it rather than inventing its own glyph. */
export const SEVERITY_ICON: Record<Level, string> = { ok: "✓", info: "ℹ", warn: "⚠" };

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

/** Run every check against a drafted block and its measurements. */
export function guide(m: Measurements, block: Block): Note[] {
  const geometric: (Note | null)[] = [
    armholeMatch(block),
    easeRange(m),
    armholeDepthCheck(m),
    shoulderCheck(m),
  ];
  // Geometry first (does it sew?), then the number-sanity tiers (are the inputs
  // real?). Both new families warn only — they never change a measurement.
  return [
    ...geometric.filter((n): n is Note => n !== null),
    ...plausibilityChecks(m),
    ...coherenceChecks(m),
  ];
}
