export function createLatest() {
  let current = 0;
  return { next: () => ++current, isCurrent: (ticket: number) => ticket === current };
}

export function createHistory<T>(initial: T) {
  let value = initial;
  const past: T[] = [];
  const future: T[] = [];
  return {
    current: () => value,
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    commit(next: T) {
      past.push(value);
      future.length = 0;
      value = next;
    },
    undo() {
      if (!past.length) return;
      future.push(value);
      value = past.pop()!;
    },
    redo() {
      if (!future.length) return;
      past.push(value);
      value = future.pop()!;
    },
  };
}
