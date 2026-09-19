// Per-style surface book — the raw-preserving collection over the placement model.
//
// Placements are shared per style across graded sizes: the book key names the
// garment and style, never the size. Stored entries keep their raw values
// verbatim (invalid numbers included); validation runs lazily through
// placementError at render and guidance time, so nothing is ever clamped or
// rewritten without an explicit user action.

import {
  addPlacement,
  placementError,
  removePlacement,
  type ArtworkPlacement,
} from "./placement";

/** One style's stored set. Placements stay unknown-typed here so raw invalid
 * values survive save/load round-trips exactly as typed. */
export interface StoredSurface {
  readonly styleName: string;
  readonly placements: readonly unknown[];
}

/** The whole persisted surface state, keyed by garment/style (see surfaceKey). */
export type SurfaceBook = Record<string, StoredSurface>;

export const EMPTY_BOOK: SurfaceBook = {};

/** Book key for one garment/style pair. Sizes deliberately stay out of the key. */
export function surfaceKey(garment: string, style: string): string {
  return `${garment}/${style}`;
}

/** Working placements for a key. Unknown entries are cast, never rewritten:
 * placementError is the only reader that judges them. */
export function surfaceList(book: SurfaceBook, key: string): readonly ArtworkPlacement[] {
  const found = book[key];
  if (!found) return [];
  return found.placements as readonly ArtworkPlacement[];
}

/** Insert or replace by id. Missing keys are created with the given style name. */
export function surfaceAdd(
  book: SurfaceBook,
  key: string,
  styleName: string,
  placement: ArtworkPlacement,
): SurfaceBook {
  const updated = addPlacement({ styleName, placements: surfaceList(book, key) }, placement);
  return { ...book, [key]: { styleName, placements: updated.placements } };
}

/** Remove by id. Unknown keys and ids leave the book unchanged. */
export function surfaceRemove(book: SurfaceBook, key: string, id: string): SurfaceBook {
  const current = book[key];
  if (!current) return book;
  const updated = removePlacement(
    { styleName: current.styleName, placements: surfaceList(book, key) }, id);
  return { ...book, [key]: { styleName: current.styleName, placements: updated.placements } };
}

/** Replace the entry at an index, keeping every other entry untouched.
 * Out-of-range indexes leave the book unchanged, so duplicate ids can be
 * edited one row at a time without collapsing into each other. */
export function surfaceSetAt(
  book: SurfaceBook,
  key: string,
  index: number,
  placement: ArtworkPlacement,
): SurfaceBook {
  const current = book[key];
  if (!current) return book;
  if (!Number.isInteger(index) || index < 0 || index >= current.placements.length) return book;
  const placements = [...current.placements];
  placements[index] = placement;
  return { ...book, [key]: { styleName: current.styleName, placements } };
}

/** Remove the entry at an index. Out-of-range indexes leave the book unchanged. */
export function surfaceRemoveAt(book: SurfaceBook, key: string, index: number): SurfaceBook {
  const current = book[key];
  if (!current) return book;
  if (!Number.isInteger(index) || index < 0 || index >= current.placements.length) return book;
  return {
    ...book,
    [key]: {
      styleName: current.styleName,
      placements: current.placements.filter((_, i) => i !== index),
    },
  };
}

/** Next stacking position: one above the current maximum, or zero when empty. */
export function nextZOrder(placements: readonly ArtworkPlacement[]): number {
  const orders = placements
    .map((p) => p.zOrder)
    .filter((z) => typeof z === "number" && Number.isFinite(z));
  if (orders.length === 0) return 0;
  return Math.max(...orders) + 1;
}

/** True when a placement carries finite geometry the preview can draw.
 * Invalid entries stay in the book with their error; they are listed, not drawn. */
export function surfacePlaceable(item: unknown): item is ArtworkPlacement {
  if (typeof item !== "object" || item === null || Array.isArray(item)) return false;
  const p = item as Record<string, unknown>;
  const finite = (v: unknown): boolean => typeof v === "number" && Number.isFinite(v);
  if (!finite(p.widthCm) || (p.widthCm as number) <= 0) return false;
  if (!finite(p.heightCm) || (p.heightCm as number) <= 0) return false;
  const t = p.transform;
  if (typeof t !== "object" || t === null || Array.isArray(t)) return false;
  const tr = t as Record<string, unknown>;
  if (!finite(tr.dx) || !finite(tr.dy)) return false;
  if (!finite(tr.scale) || (tr.scale as number) <= 0) return false;
  if (!finite(tr.rotationDeg)) return false;
  return true;
}

export interface SurfaceProblem {
  /** Placement id, or a positional fallback when the id itself is unusable. */
  readonly id: string;
  readonly error: string;
}

/** Actionable validation for every invalid placement, in stored order. */
export function surfaceProblems(
  book: SurfaceBook,
  key: string,
): readonly SurfaceProblem[] {
  const problems: SurfaceProblem[] = [];
  surfaceList(book, key).forEach((item, index) => {
    const error = placementError(item);
    if (!error) return;
    const rawId = (item as { id?: unknown } | null | undefined)?.id;
    problems.push({
      id: typeof rawId === "string" && rawId.length > 0 ? rawId : `#${index + 1}`,
      error,
    });
  });
  return problems;
}

/** Lenient book parser for the versioned save section. Absent means empty
 * (pre-surface saves); malformed means rejected, never silently repaired.
 * Shape is checked, values are preserved verbatim for lazy validation. */
export function parseSurfaceBook(value: unknown): SurfaceBook | null {
  if (value === undefined) return {};
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const book: SurfaceBook = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return null;
    const record = entry as Record<string, unknown>;
    if (typeof record.styleName !== "string" || !Array.isArray(record.placements)) return null;
    if (!record.placements.every((item) =>
      typeof item === "object" && item !== null && !Array.isArray(item))) return null;
    book[key] = { styleName: record.styleName, placements: record.placements };
  }
  return book;
}
