/** Small bounded history for intentional design-state changes. */
export interface HistoryState<T> {
  readonly past: readonly T[];
  readonly future: readonly T[];
}

export interface HistoryTransition<T> {
  readonly current: T;
  readonly history: HistoryState<T>;
}

export function emptyHistory<T>(): HistoryState<T> {
  return { past: [], future: [] };
}

export function recordHistory<T>(history: HistoryState<T>, previous: T, limit: number): HistoryState<T> {
  const boundedLimit = Math.max(1, Math.floor(limit));
  const past = [...history.past, previous];
  return { past: past.slice(Math.max(0, past.length - boundedLimit)), future: [] };
}

export function undoHistory<T>(history: HistoryState<T>, current: T): HistoryTransition<T> | null {
  const previous = history.past[history.past.length - 1];
  if (previous === undefined) return null;
  return {
    current: previous,
    history: { past: history.past.slice(0, -1), future: [current, ...history.future] },
  };
}

export function redoHistory<T>(history: HistoryState<T>, current: T): HistoryTransition<T> | null {
  const next = history.future[0];
  if (next === undefined) return null;
  return {
    current: next,
    history: { past: [...history.past, current], future: history.future.slice(1) },
  };
}
