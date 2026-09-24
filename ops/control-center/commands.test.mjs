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

test("maintainer editEpic updates metadata and records the reason on its summary card", () => {
  const edited = applyBoardCommand(board, {
    type: "editEpic", epicId: "EPIC-14", actor: "Maintainer", role: "maintainer",
    reason: "Record the explicit admission and current parallel packet boundary.",
    patch: { description: "Epic 14 is admitted; C01, C02, C05 and C06 are active." },
  }, { now: NOW });
  assert.equal(edited.epics.find((epic) => epic.id === "EPIC-14").description,
    "Epic 14 is admitted; C01, C02, C05 and C06 are active.");
  assert.match(edited.workItems.find((item) => item.id === "EPIC-14").comments.at(-1).text,
    /explicit admission and current parallel packet boundary/);
  assert.equal(edited.revision, board.revision + 1);
  assert.deepEqual(validateBoard(edited), { valid: true, errors: [] });
  assert.throws(() => applyBoardCommand(board, {
    type: "editEpic", epicId: "EPIC-14", actor: "Contributor", role: "contributor",
    reason: "No authority.", patch: { description: "Changed." },
  }, { now: NOW }), /Only a maintainer/);
  assert.throws(() => applyBoardCommand(board, {
    type: "editEpic", epicId: "EPIC-14", actor: "Maintainer", role: "maintainer",
    reason: "Empty patch.", patch: {},
  }, { now: NOW }), /at least one editable Epic field/);
  assert.throws(() => applyBoardCommand(board, {
    type: "editEpic", epicId: "EPIC-14", actor: "Maintainer", role: "maintainer",
    reason: "Status uses its own command.", patch: { status: "In Progress" },
  }, { now: NOW }), /cannot be edited directly/);
  assert.throws(() => applyBoardCommand(board, {
    type: "editEpic", epicId: "EPIC-14", actor: "Maintainer", role: "maintainer",
    reason: "Title stays linked to its numbered card.", patch: { title: "Unlinked title" },
  }, { now: NOW }), /cannot be edited directly/);
  assert.throws(() => applyBoardCommand(board, {
    type: "editEpic", epicId: "EPIC-14", actor: "Maintainer", role: "maintainer",
    reason: "Blank metadata is invalid.", patch: { description: " " },
  }, { now: NOW }), /patch.description is required/);
  assert.throws(() => applyBoardCommand(board, {
    type: "editEpic", epicId: "UNKNOWN-EPIC", actor: "Maintainer", role: "maintainer",
    reason: "Unknown Epic.", patch: { description: "Changed." },
  }, { now: NOW }), /Unknown epic/);
});

test("maintainer rename keeps dependent work linked and records the old identifier", () => {
  const fixture = structuredClone(board);
  fixture.workItems.find((item) => item.id === "EPIC-14-LANE-B").dependencies = ["EPIC-14-LANE-A"];
  const renamed = applyBoardCommand(fixture, {
    type: "renameItem", itemId: "EPIC-14-LANE-A", newId: "EPIC-14-LANE-A-RENAMED",
    actor: "Maintainer", role: "maintainer", reason: "Adopt numbered epic sequence.",
  }, { now: NOW });
  assert.equal(renamed.workItems.some((item) => item.id === "EPIC-14-LANE-A"), false);
  const goal = renamed.workItems.find((item) => item.id === "EPIC-14-LANE-A-RENAMED");
  assert.match(goal.comments.at(-1).text, /EPIC-14-LANE-A to EPIC-14-LANE-A-RENAMED/);
  assert.deepEqual(renamed.workItems.find((item) => item.id === "EPIC-14-LANE-B").dependencies, ["EPIC-14-LANE-A-RENAMED"]);
  assert.deepEqual(validateBoard(renamed), { valid: true, errors: [] });
  assert.throws(() => applyBoardCommand(board, {
    type: "renameItem", itemId: "EPIC-14-LANE-A", newId: "EPIC-14-LANE-A-RENAMED",
    actor: "Contributor", role: "contributor", reason: "No authority.",
  }, { now: NOW }), /Only a maintainer/);
  assert.throws(() => applyBoardCommand(board, {
    type: "renameItem", itemId: "EPIC-14-LANE-A", newId: "EPIC-14-LANE-B",
    actor: "Maintainer", role: "maintainer", reason: "Duplicate.",
  }, { now: NOW }), /duplicates/);
  assert.throws(() => applyBoardCommand(board, {
    type: "renameItem", itemId: "PREQUEUE-PHASE-01", newId: "PHASE-RENAMED",
    actor: "Maintainer", role: "maintainer", reason: "Protected.",
  }, { now: NOW }), /protected/);
  assert.throws(() => applyBoardCommand(board, {
    type: "renameItem", itemId: "EPIC-14", newId: "EPIC-14-RENAMED",
    actor: "Maintainer", role: "maintainer", reason: "Would desynchronize the Epic record.",
  }, { now: NOW }), /cannot be renamed separately/);
});

test("future epic can be registered in Backlog without implying work has started", () => {
  const planned = applyBoardCommand(board, {
    type: "createEpic", actor: "Maintainer", role: "maintainer", reason: "Register future roadmap epic.",
    epic: { id: "EPIC-31", title: "Future admission", status: "Backlog", owner: "Codex", description: "Held until admitted." },
  }, { now: NOW });
  assert.equal(planned.epics.find((epic) => epic.id === "EPIC-31").status, "Backlog");
  assert.throws(() => applyBoardCommand(board, {
    type: "createEpic", actor: "Maintainer", role: "maintainer", reason: "Invalid status.",
    epic: { id: "EPIC-31", title: "Future admission", status: "Done", owner: "Codex", description: "Invalid." },
  }, { now: NOW }), /Unknown epic status/);
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
  assert.throws(() => applyBoardCommand(board, { ...command, workItem: { ...command.workItem, epicId: "EPIC-13" } }, { now: NOW }), /EPIC-13 membership must be changed through linkItemsToEpic/);
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

const PRE_GARMENT_IDS = Array.from({ length: 9 }, (_, index) =>
  `PREQUEUE-PHASE-${String(index + 1).padStart(2, "0")}`);

function epic13TestBoard() {
  const fixture = structuredClone(board);
  fixture.epics = fixture.epics.filter((epic) => epic.id !== "EPIC-13");
  fixture.evidence = fixture.evidence.filter((entry) => entry.id !== "E-EPIC13-EXIT");
  for (const item of fixture.workItems) {
    if (PRE_GARMENT_IDS.includes(item.id)) item.epicId = null;
  }
  return fixture;
}

function createEpic13(inputBoard = epic13TestBoard(), role = "maintainer") {
  return applyBoardCommand(inputBoard, {
    type: "createEpic",
    actor: "Maintainer",
    role,
    reason: "Group the nine completed pre-garment readiness phases.",
    epic: {
      id: "EPIC-13",
      title: "Pre-Garment Readiness",
      owner: "Codex",
      description: "Verified completion of the approved nine-phase pre-garment sequence.",
    },
  }, { now: NOW });
}

function linkEpic13(inputBoard, itemIds = PRE_GARMENT_IDS) {
  return applyBoardCommand(inputBoard, {
    type: "linkItemsToEpic",
    epicId: "EPIC-13",
    itemIds,
    actor: "Maintainer",
    role: "maintainer",
    reason: "Associate only the nine completed phase records, in their approved order.",
  }, { now: NOW });
}

test("Epic 13 links and closes only the nine evidence-backed phases without rewriting their history", () => {
  const base = epic13TestBoard();
  const phaseSnapshot = base.workItems
    .filter((item) => PRE_GARMENT_IDS.includes(item.id))
    .map((item) => structuredClone(item));
  let result = createEpic13(base);
  assert.equal(result.epics.find((epic) => epic.id === "EPIC-13").status, "In Progress");
  result = linkEpic13(result);
  assert.deepEqual(result.workItems.filter((item) => item.epicId === "EPIC-13").map((item) => item.id), PRE_GARMENT_IDS);
  for (const prior of phaseSnapshot) {
    const current = result.workItems.find((item) => item.id === prior.id);
    assert.deepEqual(current, { ...prior, epicId: "EPIC-13" });
  }
  result = applyBoardCommand(result, {
    type: "addEpicEvidence",
    epicId: "EPIC-13",
    actor: "Maintainer",
    role: "maintainer",
    evidence: {
      id: "E-EPIC13-EXIT",
      kind: "exit-report",
      uri: "docs/release/EPIC-13-PRE-GARMENT-READINESS-EXIT.md",
      verified: true,
      note: "Exit report verifies all nine Done phases, their existing evidence, and the separate garment approval gate.",
    },
  }, { now: NOW });
  result = applyBoardCommand(result, {
    type: "updateEpicStatus",
    epicId: "EPIC-13",
    actor: "Maintainer",
    role: "maintainer",
    status: "Closed",
    reason: "All nine phases and the verified Epic 13 exit report are complete.",
    evidenceRefs: ["E-EPIC13-EXIT"],
  }, { now: NOW });
  assert.equal(result.epics.find((epic) => epic.id === "EPIC-13").status, "Closed");
  assert.deepEqual(result.epics.find((epic) => epic.id === "EPIC-13").evidenceRefs, ["E-EPIC13-EXIT"]);
  assert.deepEqual(validateBoard(result), { valid: true, errors: [] });
});

test("ordinary item edits cannot bypass Epic 13's exact membership boundary", () => {
  const grouped = linkEpic13(createEpic13());
  assert.throws(() => applyBoardCommand(grouped, {
    type: "editItem", itemId: PRE_GARMENT_IDS[0], patch: { epicId: null },
  }, { now: NOW }), /EPIC-13 membership must be changed through linkItemsToEpic/);
  assert.throws(() => applyBoardCommand(grouped, {
    type: "editItem", itemId: "EPIC-30", patch: { epicId: "EPIC-13" },
  }, { now: NOW }), /EPIC-13 membership must be changed through linkItemsToEpic/);
  assert.throws(() => applyBoardCommand(epic13TestBoard(), {
    type: "createEpic", actor: "Maintainer", role: "maintainer", reason: "Use the approved epic name.",
    epic: { id: "EPIC-13", title: "Different title", owner: "Codex", description: "Not the approved Epic 13." },
  }, { now: NOW }), /EPIC-13 title must be Pre-Garment Readiness/);
});

test("Epic 13 rejects wrong membership, unverified phase evidence, incomplete phases, and evidence-free closure", () => {
  const created = createEpic13();
  assert.throws(() => linkEpic13(created, [...PRE_GARMENT_IDS].reverse()), /exactly PREQUEUE-PHASE-01 through PREQUEUE-PHASE-09 in order/);
  assert.throws(() => linkEpic13(created, [...PRE_GARMENT_IDS, "EPIC-30"]), /exactly PREQUEUE-PHASE-01 through PREQUEUE-PHASE-09 in order/);
  assert.throws(() => linkEpic13(created, [...PRE_GARMENT_IDS, PRE_GARMENT_IDS[0]]), /itemIds must be unique/);
  assert.throws(() => applyBoardCommand(created, {
    type: "linkItemsToEpic", epicId: "EPIC-13", itemIds: [],
    actor: "Maintainer", role: "maintainer", reason: "Empty group is invalid.",
  }, { now: NOW }), /itemIds must be a non-empty array/);

  const reordered = epic13TestBoard();
  const firstPhaseIndex = reordered.workItems.findIndex((item) => item.id === PRE_GARMENT_IDS[0]);
  [reordered.workItems[firstPhaseIndex], reordered.workItems[firstPhaseIndex + 1]] =
    [reordered.workItems[firstPhaseIndex + 1], reordered.workItems[firstPhaseIndex]];
  assert.throws(() => linkEpic13(createEpic13(reordered)), /Board pre-garment phases must remain exactly nine items in phase order/);

  const unverified = epic13TestBoard();
  unverified.evidence.find((entry) => entry.id === "E-SLICE187-EXIT").verified = false;
  assert.throws(() => linkEpic13(createEpic13(unverified)), /needs verified, non-incomplete exit evidence/);

  const reopened = applyBoardCommand(epic13TestBoard(), {
    type: "updateStatus",
    itemId: PRE_GARMENT_IDS[0],
    actor: "Maintainer",
    role: "maintainer",
    status: "In Progress",
    reason: "Fixture for an incomplete readiness phase.",
    evidenceRefs: [],
  }, { now: NOW });
  assert.throws(() => linkEpic13(createEpic13(reopened)), /must be Done before epic linkage/);

  const linked = linkEpic13(created);
  assert.throws(() => linkEpic13(linked), /already has linked work/);
  assert.throws(() => applyBoardCommand(linked, {
    type: "updateEpicStatus",
    epicId: "EPIC-13",
    actor: "Maintainer",
    role: "maintainer",
    status: "Closed",
    reason: "Try closing without the required exit report.",
    evidenceRefs: [],
  }, { now: NOW }), /requires verified exit-report evidence/);

  const linkedWithExit = applyBoardCommand(linked, {
    type: "addEpicEvidence", epicId: "EPIC-13", actor: "Maintainer", role: "maintainer",
    evidence: {
      id: "E-EPIC13-NEGATIVE-EXIT", kind: "exit-report",
      uri: "docs/release/EPIC-13-PRE-GARMENT-READINESS-EXIT.md", verified: true,
      note: "Negative fixture for phase evidence revalidation.",
    },
  }, { now: NOW });
  const invalidatedEvidence = structuredClone(linkedWithExit);
  invalidatedEvidence.evidence.find((entry) => entry.id === "E-SLICE187-EXIT").verified = false;
  assert.throws(() => applyBoardCommand(invalidatedEvidence, {
    type: "updateEpicStatus", epicId: "EPIC-13", actor: "Maintainer", role: "maintainer",
    status: "Closed", reason: "A phase evidence item is no longer verified.", evidenceRefs: ["E-EPIC13-NEGATIVE-EXIT"],
  }, { now: NOW }), /needs verified, non-incomplete exit evidence/);
});

test("epic creation, evidence, and closure commands require maintainer authority", () => {
  assert.throws(() => createEpic13(epic13TestBoard(), "reviewer"), /Only a maintainer can create an epic/);
  const created = createEpic13();
  const blocked = applyBoardCommand(created, {
    type: "updateEpicStatus", epicId: "EPIC-13", actor: "Maintainer", role: "maintainer",
    status: "Blocked", reason: "Temporary review hold.", evidenceRefs: [],
  }, { now: NOW });
  assert.equal(blocked.epics.find((epic) => epic.id === "EPIC-13").status, "Blocked");
  assert.throws(() => applyBoardCommand(created, {
    type: "updateEpicStatus", epicId: "EPIC-13", actor: "Maintainer", role: "maintainer",
    status: "Archived", reason: "Unknown epic status.", evidenceRefs: [],
  }, { now: NOW }), /Unknown epic status/);
  assert.throws(() => applyBoardCommand(created, {
    type: "addEpicEvidence",
    epicId: "EPIC-13",
    actor: "Reviewer",
    role: "reviewer",
    evidenceId: "E-PREQUEUE-PHASE9-REVIEW",
  }, { now: NOW }), /Only a maintainer can add epic evidence/);
  const linkedExisting = applyBoardCommand(created, {
    type: "addEpicEvidence", epicId: "EPIC-13", actor: "Maintainer", role: "maintainer",
    evidenceId: "E-PREQUEUE-PHASE9-S210-EXIT",
  }, { now: NOW });
  assert.ok(linkedExisting.epics.find((epic) => epic.id === "EPIC-13").evidenceRefs.includes("E-PREQUEUE-PHASE9-S210-EXIT"));
  assert.throws(() => applyBoardCommand(created, {
    type: "updateEpicStatus",
    epicId: "EPIC-13",
    actor: "Reviewer",
    role: "reviewer",
    status: "Closed",
    reason: "Reviewer cannot close a planning epic.",
    evidenceRefs: [],
  }, { now: NOW }), /Only a maintainer can change epic status/);
  assert.throws(() => applyBoardCommand(created, {
    type: "createEpic",
    actor: "Maintainer",
    role: "maintainer",
    reason: "Duplicate epic ID must be rejected.",
    epic: { id: "EPIC-13", title: "Duplicate", owner: "Codex", description: "Invalid duplicate." },
  }, { now: NOW }), /duplicates EPIC-13/);
});
