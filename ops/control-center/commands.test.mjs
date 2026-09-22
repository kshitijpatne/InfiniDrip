import test from "node:test";
import assert from "node:assert/strict";
import board from "./data/board.json" with { type: "json" };
import { allowedTransitions, canTransition, validateBoard } from "./board-core.mjs";
import { applyBoardCommand } from "./commands.mjs";

const NOW = "2026-09-22T18:00:00.000Z";

test("approved role guidance exposes the basic workflow and maintainer override", () => {
  assert.equal(canTransition("Ready", "In Progress", "contributor"), true);
  assert.equal(canTransition("In Progress", "Review", "contributor"), true);
  assert.equal(canTransition("Review", "Done", "contributor"), false);
  assert.equal(canTransition("Review", "Done", "reviewer"), true);
  assert.equal(canTransition("Review", "In Progress", "reviewer"), true);
  assert.equal(canTransition("Done", "In Progress", "reviewer"), false);
  assert.equal(canTransition("Done", "In Progress", "maintainer"), true);
  assert.equal(canTransition("Done", "Archived", "maintainer"), true);
  assert.equal(canTransition("Backlog", "Blocked", "contributor"), true);
  assert.equal(canTransition("Done", "Blocked", "contributor"), false);
  assert.equal(canTransition("Ready", "Ready", "maintainer"), false);
  assert.equal(canTransition("unknown", "Ready", "maintainer"), false);
  assert.deepEqual(allowedTransitions("Review", "reviewer"), ["In Progress", "Done", "Blocked"]);
});

test("editItem changes only editable details and increments the revision", () => {
  const edited = applyBoardCommand(board, {
    type: "editItem",
    itemId: "SLICE-175",
    patch: {
      title: "Deferred welcome and profile admission",
      priority: "P1",
      dependencies: ["SLICE-174"],
    },
  }, { now: NOW });
  const item = edited.workItems.find((candidate) => candidate.id === "SLICE-175");
  assert.equal(item.title, "Deferred welcome and profile admission");
  assert.equal(item.priority, "P1");
  assert.equal(edited.revision, board.revision + 1);
  assert.equal(edited.updatedAt, NOW);
  assert.notEqual(edited, board);
  assert.throws(() => applyBoardCommand(board, { type: "editItem", itemId: "SLICE-175", patch: {} }, { now: NOW }), /at least one/);
  assert.throws(() => applyBoardCommand(board, { type: "editItem", itemId: "SLICE-175", patch: { status: "Done" } }, { now: NOW }), /cannot be edited directly/);
});

test("createItem validates a new backlog record and records its creation in transition history", () => {
  const created = applyBoardCommand(board, {
    type: "createItem",
    actor: "Maintainer",
    role: "maintainer",
    reason: "Add the approved pre-garment sequence to the queue.",
    workItem: {
      id: "NEW-ITEM-CREATE-COMMAND",
      title: "Dogfood and improve Control Center",
      type: "task",
      priority: "P1",
      risk: "low",
      owner: "Codex",
      description: "Use the local board to track the approved development sequence.",
      expectation: "Phase work is visible, ordered, and auditable in board.json.",
      acceptanceCriteria: ["All nine approved phases have board records"],
      dependencies: [],
      protectedSurfaces: ["local Control Center", "board.json"],
    },
  }, { now: NOW });
  const item = created.workItems.find((candidate) => candidate.id === "NEW-ITEM-CREATE-COMMAND");
  assert.ok(item);
  assert.equal(item.status, "Backlog");
  assert.equal(item.openedAt, "2026-09-22");
  assert.equal(item.contributor, "Codex");
  assert.equal(item.reviewer, "Codex");
  assert.deepEqual(item.statusHistory, [{
    status: "Backlog", at: NOW, actor: "Maintainer", role: "maintainer",
    note: "Add the approved pre-garment sequence to the queue.", evidenceRefs: [],
  }]);
  assert.equal(created.revision, board.revision + 1);
  assert.deepEqual(validateBoard(created), { valid: true, errors: [] });
});

test("createItem rejects missing rationale, invalid fields, and duplicate identifiers", () => {
  const command = {
    type: "createItem", actor: "Maintainer", role: "maintainer", reason: "Added for planning.",
    workItem: {
      id: "NEW-ITEM", title: "A planned task", type: "task", priority: "P1", risk: "low", owner: "Codex",
      description: "Describe the work.", expectation: "Describe the result.", acceptanceCriteria: ["Pass the criteria"],
      dependencies: [], protectedSurfaces: [],
    },
  };
  assert.throws(() => applyBoardCommand(board, { ...command, reason: "  " }, { now: NOW }), /reason is required/);
  assert.throws(() => applyBoardCommand(board, { ...command, workItem: { ...command.workItem, type: "invented" } }, { now: NOW }), /Unknown workItem.type/);
  assert.throws(() => applyBoardCommand(board, { ...command, workItem: { ...command.workItem, invented: true } }, { now: NOW }), /cannot be set at creation/);
  assert.throws(() => applyBoardCommand(board, { ...command, workItem: { ...command.workItem, id: "SLICE-175" } }, { now: NOW }), /duplicates SLICE-175/);
});

test("status transitions persist actor guidance, reason, evidence, and delivery date", () => {
  const ready = applyBoardCommand(board, {
    type: "updateStatus",
    itemId: "SLICE-175",
    status: "Ready",
    actor: "Maintainer",
    role: "maintainer",
    reason: "Launch work is admitted for planning only.",
  }, { now: NOW });
  const inProgress = applyBoardCommand(ready, {
    type: "updateStatus",
    itemId: "SLICE-175",
    status: "In Progress",
    actor: "Contributor",
    role: "contributor",
    reason: "Claimed the admitted work.",
  }, { now: "2026-09-22T18:01:00.000Z" });
  const review = applyBoardCommand(inProgress, {
    type: "updateStatus",
    itemId: "SLICE-175",
    status: "Review",
    actor: "Contributor",
    role: "contributor",
    reason: "Submitted the documented result.",
  }, { now: "2026-09-22T18:02:00.000Z" });
  const done = applyBoardCommand(review, {
    type: "updateStatus",
    itemId: "SLICE-175",
    status: "Done",
    actor: "Reviewer",
    role: "reviewer",
    reason: "Accepted against the admission record.",
    evidenceRefs: ["E-EPIC12-S175"],
  }, { now: "2026-09-22T18:03:00.000Z" });
  const item = done.workItems.find((candidate) => candidate.id === "SLICE-175");
  assert.equal(item.status, "Done");
  assert.equal(item.deliveredAt, "2026-09-22");
  assert.deepEqual(item.statusHistory.at(-1), {
    status: "Done",
    at: "2026-09-22T18:03:00.000Z",
    actor: "Reviewer",
    role: "reviewer",
    note: "Accepted against the admission record.",
    evidenceRefs: ["E-EPIC12-S175"],
  });
});

test("status commands reject missing reasons, role violations, and evidence-free completion", () => {
  assert.throws(() => applyBoardCommand(board, {
    type: "updateStatus", itemId: "SLICE-175", status: "Ready", actor: "Maintainer", role: "maintainer", reason: "",
  }, { now: NOW }), /reason is required/);
  assert.throws(() => applyBoardCommand(board, {
    type: "updateStatus", itemId: "SLICE-175", status: "Done", actor: "Contributor", role: "contributor", reason: "No review.",
  }, { now: NOW }), /cannot move/);
  const noEvidence = structuredClone(board);
  const item = noEvidence.workItems.find((candidate) => candidate.id === "SLICE-175");
  item.status = "Review";
  item.evidenceRefs = [];
  item.statusHistory.push({ status: "Review", at: NOW, actor: "Contributor", role: "contributor", note: "Review.", evidenceRefs: [] });
  assert.throws(() => applyBoardCommand(noEvidence, {
    type: "updateStatus", itemId: "SLICE-175", status: "Done", actor: "Reviewer", role: "reviewer", reason: "No evidence.",
  }, { now: "2026-09-22T18:01:00.000Z" }), /Done requires/);
});

test("addEvidence can create or link evidence and addComment records notes", () => {
  const withEvidence = applyBoardCommand(board, {
    type: "addEvidence",
    itemId: "SLICE-175",
    evidence: {
      id: "E-S175-NOTE",
      kind: "document",
      uri: "docs/planning/EPIC-12-SLICE-175-ADMISSION.md",
      verified: false,
      note: "Local admission document reference.",
    },
  }, { now: NOW });
  assert.ok(withEvidence.evidence.some((entry) => entry.id === "E-S175-NOTE" && entry.commit === null));
  assert.ok(withEvidence.workItems.find((item) => item.id === "SLICE-175").evidenceRefs.includes("E-S175-NOTE"));
  const linked = applyBoardCommand(board, {
    type: "addEvidence", itemId: "SLICE-175", evidenceId: "E-EPIC12-S175",
  }, { now: NOW });
  assert.equal(linked.workItems.find((item) => item.id === "SLICE-175").evidenceRefs.filter((ref) => ref === "E-EPIC12-S175").length, 1);
  const commented = applyBoardCommand(board, {
    type: "addComment", itemId: "SLICE-175", actor: "Maintainer", text: "Still deferred under the launch-cost hold.",
  }, { now: NOW });
  assert.deepEqual(commented.workItems.find((item) => item.id === "SLICE-175").comments.at(-1), {
    at: NOW, actor: "Maintainer", text: "Still deferred under the launch-cost hold.",
  });
  assert.throws(() => applyBoardCommand(board, {
    type: "addEvidence", itemId: "SLICE-175", evidenceId: "MISSING",
  }, { now: NOW }), /Unknown evidence/);
  assert.throws(() => applyBoardCommand(board, {
    type: "addEvidence",
    itemId: "SLICE-175",
    evidence: {
      id: "E-S175-EXTRA",
      kind: "document",
      uri: "docs/planning/EPIC-12-SLICE-175-ADMISSION.md",
      verified: false,
      note: "Contains an unknown field.",
      invented: true,
    },
  }, { now: NOW }), /evidence.invented is not allowed/);
  assert.throws(() => applyBoardCommand(board, { type: "notACommand" }, { now: NOW }), /Unknown board command/);
});
