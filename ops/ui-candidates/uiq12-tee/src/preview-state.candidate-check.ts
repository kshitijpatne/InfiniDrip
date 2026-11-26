import { expect, it } from "vitest";
import { createHistory, createLatest } from "./preview-state";

it("drops old requests even if the source content returns to an earlier state", () => {
  const latest = createLatest();
  const old = latest.next();
  latest.next();
  const current = latest.next();
  expect(latest.isCurrent(old)).toBe(false);
  expect(latest.isCurrent(current)).toBe(true);
});

it("supports undo, redo and clearing forward history when a draft changes", () => {
  const history = createHistory(10);
  history.undo();
  history.redo();
  expect(history.current()).toBe(10);
  expect(history.canUndo()).toBe(false);
  history.commit(11);
  history.undo();
  expect(history.canRedo()).toBe(true);
  history.redo();
  expect(history.current()).toBe(11);
  expect(history.canUndo()).toBe(true);
  history.undo();
  history.commit(12);
  expect(history.canRedo()).toBe(false);
});
