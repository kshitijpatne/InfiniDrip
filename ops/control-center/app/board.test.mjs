import test from "node:test";
import assert from "node:assert/strict";
import board from "../data/board.json" with { type: "json" };
import { canTransition, filterItems, filterOptions, renderCreateForm, renderDetail, renderItemList, renderSummary, safeText, summarizeBoard, validateBoard } from "./board.mjs";

test("canonical board validates and summarizes its tracked work", () => {
  const result = validateBoard(board);
  assert.deepEqual(result, { valid: true, errors: [] });
  const summary = summarizeBoard(board);
  assert.equal(summary.epics, board.epics.length);
  assert.equal(summary.workItems, board.workItems.length);
  assert.equal(summary.evidence, board.evidence.length);
  assert.equal(summary.statusCounts.Done, board.workItems.filter((item) => item.status === "Done").length);
  assert.equal(summary.statusCounts.Backlog, board.workItems.filter((item) => item.status === "Backlog").length);
  assert.equal(summary.statusCounts.Ready ?? 0, board.workItems.filter((item) => item.status === "Ready").length);
  assert.match(renderSummary(board), new RegExp(String(board.workItems.length)));
  assert.match(renderItemList(board.workItems, "SLICE-184"), /SLICE-184/);
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
  malformed.schemaVersion = 3;
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
  assert.ok(result.errors.some((error) => error.includes("must be null or an ISO date")));
});

test("contributors can submit review but cannot complete work", () => {
  assert.equal(canTransition("In Progress", "Review", "contributor"), true);
  assert.equal(canTransition("Review", "Done", "contributor"), false);
  assert.equal(canTransition("Review", "Done", "reviewer"), true);
  assert.equal(canTransition("Done", "In Progress", "reviewer"), false);
});

test("admitted Epic 14 and its active research lanes match the future backlog", () => {
  for (let index = 1; index <= 17; index += 1) {
    const id = `EPIC-${index + 13}`;
    const goal = `G${String(index).padStart(2, "0")}`;
    const epic = board.epics.find((entry) => entry.id === id);
    const card = board.workItems.find((entry) => entry.id === id);
    const expectedStatus = id === "EPIC-14" ? "In Progress" : "Backlog";
    assert.equal(epic?.status, expectedStatus);
    assert.equal(card?.status, expectedStatus);
    assert.equal(card?.type, "epic");
    assert.equal(card?.epicId, id);
    assert.match(card.title, new RegExp(`^${id}: ${goal}`));
    assert.equal(card.dependencies.includes(`CAPABILITY-${goal}`), false);
  }
  const expectedLaneStatus = { A: "Backlog", B: "Done", C: "In Progress", D: "In Progress" };
  for (const letter of ["A", "B", "C", "D"]) {
    const lane = board.workItems.find((entry) => entry.id === `EPIC-14-LANE-${letter}`);
    assert.equal(lane?.epicId, "EPIC-14");
    assert.equal(lane?.status, expectedLaneStatus[letter]);
  }
  for (const id of ["EPIC-14-C01", "EPIC-14-C02", "EPIC-14-C05", "EPIC-14-C06"]) {
    const packet = board.workItems.find((entry) => entry.id === id);
    assert.equal(packet?.epicId, "EPIC-14");
    assert.equal(packet?.status, ["EPIC-14-C01", "EPIC-14-C02"].includes(id) ? "Done" : "In Progress");
    assert.ok(packet.acceptanceCriteria.length >= 5);
  }
  const laneB = board.workItems.find((entry) => entry.id === "EPIC-14-LANE-B");
  assert.ok(laneB.evidenceRefs.includes("E-EPIC14-C01-BASELINE"));
  assert.ok(laneB.evidenceRefs.includes("E-EPIC14-C02-PARITY"));
  const shorts = board.workItems.find((entry) => entry.id === "EPIC-20-LANE-E");
  assert.equal(shorts?.epicId, "EPIC-20");
  assert.equal(shorts?.status, "Backlog");
  assert.ok(shorts.acceptanceCriteria.some((entry) => entry.includes("Explicit maintainer garment-direction approval")));
});

test("literal search and filters cover title, slice, body, owner, priority, and type", () => {
  assert.deepEqual(filterItems(board.workItems, { query: "schema and command layer" }).map((item) => item.id), ["SLICE-184"]);
  assert.ok(filterItems(board.workItems, { query: "atomic persistence" }).some((item) => item.id === "SLICE-184"));
  assert.ok(filterItems(board.workItems, { status: "Done", owner: "Codex", priority: "P0", type: "slice" }).length > 0);
  assert.equal(filterItems(board.workItems, { query: "[not a regex" }).length, 0);
  const choices = filterOptions(board.workItems);
  assert.ok(choices.status.includes("Done"));
  assert.ok(choices.type.includes("slice"));
});

test("detail rendering exposes editing, evidence, history, and escapes board text", () => {
  const fixture = structuredClone(board);
  const item = fixture.workItems.find((entry) => entry.id === "SLICE-184");
  item.title = '<script>alert("x")</script>';
  const html = renderDetail(item, fixture, "maintainer");
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /edit-form/);
  assert.match(html, /transition-form/);
  assert.match(html, /create-evidence-form/);
  assert.match(html, /Transition history/);
  assert.match(html, /E-SLICE184/);
  assert.equal(safeText("<&'\""), "&lt;&amp;&#39;&quot;");

  const epicLinkedFixture = structuredClone(board);
  const phaseItem = epicLinkedFixture.workItems.find((entry) => entry.id === "PREQUEUE-PHASE-01");
  phaseItem.epicId = "EPIC-13";
  const phaseHtml = renderDetail(phaseItem, epicLinkedFixture, "maintainer");
  assert.match(phaseHtml, /<select name="epicId" disabled>/);
  assert.match(phaseHtml, /<option selected disabled>EPIC-13<\/option>/);
  const unrelated = epicLinkedFixture.workItems.find((entry) => entry.id === "EPIC-30");
  assert.match(renderDetail(unrelated, epicLinkedFixture, "maintainer"), /<option disabled>EPIC-13<\/option>/);
  assert.match(renderCreateForm(epicLinkedFixture), /<option disabled>EPIC-13<\/option>/);
});

test("new work item form captures schema-required fields and starts with Backlog workflow guidance", () => {
  const html = renderCreateForm(board);
  assert.match(html, /id="create-item-form"/);
  for (const field of ["id", "title", "type", "priority", "risk", "owner", "description", "expectation", "acceptanceCriteria", "actor", "reason"]) {
    assert.match(html, new RegExp(`name="${field}"[^>]*required|<textarea required name="${field}"`));
  }
  assert.match(html, /name="epicId"/);
  assert.match(html, /New items start in Backlog/);
  assert.match(html, /id="cancel-create-button"/);
});
