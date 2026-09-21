import test from "node:test";
import assert from "node:assert/strict";
import board from "../data/board.json" with { type: "json" };
import { canTransition, renderBoard, summarizeBoard, validateBoard } from "./board.mjs";

test("canonical board validates and summarizes its tracked work", () => {
  const result = validateBoard(board);
  assert.deepEqual(result, { valid: true, errors: [] });
  const summary = summarizeBoard(board);
  assert.equal(summary.epics, 9);
  assert.equal(summary.workItems, 6);
  assert.equal(summary.statusCounts.Closed, 6);
  assert.match(renderBoard(board), /InfiniDrip delivery board/);
  assert.match(renderBoard(board), /incomplete/);
  assert.match(renderBoard(board), /SLICE-174/);
});

test("malformed board data is rejected instead of repaired", () => {
  const malformed = structuredClone(board);
  malformed.workItems[0].evidenceRefs = ["MISSING-EVIDENCE"];
  malformed.workItems[1].statusHistory.at(-1).status = "In Progress";
  const result = validateBoard(malformed);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("MISSING-EVIDENCE")));
  assert.ok(result.errors.some((error) => error.includes("last status")));
});

test("invalid top-level and duplicate records are reported", () => {
  assert.equal(validateBoard(null).valid, false);
  const malformed = structuredClone(board);
  malformed.schemaVersion = 2;
  malformed.epics.push(malformed.epics[0]);
  const result = validateBoard(malformed);
  assert.ok(result.errors.some((error) => error.includes("schemaVersion")));
  assert.ok(result.errors.some((error) => error.includes("duplicates EPIC-5")));
});

test("invalid calendar dates are rejected instead of normalized", () => {
  const malformed = structuredClone(board);
  malformed.workItems[0].openedAt = "2026-02-30";
  const result = validateBoard(malformed);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("invalid ISO date")));
});

test("contributors can submit review but cannot close work", () => {
  assert.equal(canTransition("In Progress", "In Review", "contributor"), true);
  assert.equal(canTransition("In Review", "Closed", "contributor"), false);
  assert.equal(canTransition("Accepted", "Closed", "reviewer"), true);
  assert.equal(canTransition("Closed", "In Progress", "reviewer"), false);
});
