// The guidance note — a plain-English observation with a severity.
//
// Extracted into its own dependency-free module (like check.ts's CheckResult) so
// that BOTH the guidance engine and a garment recipe can speak in Notes without a
// drafting↔guidance import cycle. This file imports nothing.

export type Level = "ok" | "info" | "warn";

export interface Note {
  readonly level: Level;
  readonly text: string;
}

/** Severity as an ICON, not colour alone — so the signal survives colour-blindness
 *  and greyscale. Defined once here; every renderer (this app's guidance panel, and
 *  Fable's journey UI) reads it rather than inventing its own glyph. */
export const SEVERITY_ICON: Record<Level, string> = { ok: "✓", info: "ℹ", warn: "⚠" };
