import { describe, expect, it } from "vitest";
import { emptyHistory, recordHistory, redoHistory, undoHistory } from "./history";

describe("bounded design history", () => {
  it("keeps the newest entries, clears redo, and never grows past the limit", () => {
    let history = emptyHistory<number>();
    history = recordHistory(history, 1, 2);
    history = recordHistory(history, 2, 2);
    history = recordHistory({ ...history, future: [9] }, 3, 2);
    expect(history).toEqual({ past: [2, 3], future: [] });
  });

  it("moves the current value between undo and redo stacks", () => {
    const history = recordHistory(recordHistory(emptyHistory<number>(), 1, 3), 2, 3);
    const undone = undoHistory(history, 3);
    expect(undone).toEqual({ current: 2, history: { past: [1], future: [3] } });
    expect(redoHistory(undone!.history, undone!.current)).toEqual({
      current: 3, history: { past: [1, 2], future: [] },
    });
  });

  it("returns no transition when the requested direction is empty", () => {
    const history = emptyHistory<number>();
    expect(undoHistory(history, 1)).toBeNull();
    expect(redoHistory(history, 1)).toBeNull();
  });
});
