import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import board from "../data/board.json" with { type: "json" };
import { canTransition, filterItems, filterOptions, renderCreateForm, renderDetail, renderItemList, renderSummary, safeText, summarizeBoard, validateBoard } from "./board.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function hashEvidenceArtifact(uri) {
  const artifact = readFileSync(resolve(projectRoot, uri));
  const binaryExtensions = new Set([".jpg", ".jpeg", ".pdf", ".png", ".zip"]);
  const canonical = binaryExtensions.has(extname(uri).toLowerCase())
    ? artifact
    : Buffer.from(artifact.toString("utf8").replace(/\r\n/g, "\n"));
  return createHash("sha256").update(canonical).digest("hex");
}

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

test("closed Epics 14 and 15 and gated future backlog match their evidence", () => {
  for (let index = 1; index <= 17; index += 1) {
    const id = `EPIC-${index + 13}`;
    const goal = `G${String(index).padStart(2, "0")}`;
    const epic = board.epics.find((entry) => entry.id === id);
    const card = board.workItems.find((entry) => entry.id === id);
    const expectedEpicStatus = id === "EPIC-14" || id === "EPIC-15" ? "Closed" : "Backlog";
    const expectedCardStatus = id === "EPIC-14" || id === "EPIC-15" ? "Done" : "Backlog";
    assert.equal(epic?.status, expectedEpicStatus);
    assert.equal(card?.status, expectedCardStatus);
    assert.equal(card?.type, "epic");
    assert.equal(card?.epicId, id);
    assert.match(card.title, new RegExp(`^${id}: ${goal}`));
    assert.equal(card.dependencies.includes(`CAPABILITY-${goal}`), false);
    if (id === "EPIC-15") {
      assert.ok(card.evidenceRefs.includes("E-EPIC15-S240-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-EPIC15-G02-MERGE-S241"));
    }
  }
  const expectedLaneStatus = { A: "Done", B: "Done", C: "Done", D: "Done" };
  for (const letter of ["A", "B", "C", "D"]) {
    const lane = board.workItems.find((entry) => entry.id === `EPIC-14-LANE-${letter}`);
    assert.equal(lane?.epicId, "EPIC-14");
    assert.equal(lane?.status, expectedLaneStatus[letter]);
  }
  const laneA = board.workItems.find((entry) => entry.id === "EPIC-14-LANE-A");
  for (const id of ["EPIC-14-C01", "EPIC-14-C02", "EPIC-14-C05", "EPIC-14-C06"]) {
    const packet = board.workItems.find((entry) => entry.id === id);
    assert.equal(packet?.epicId, "EPIC-14");
    assert.equal(packet?.status, ["EPIC-14-C01", "EPIC-14-C02", "EPIC-14-C05", "EPIC-14-C06"].includes(id) ? "Done" : "In Progress");
    assert.ok(packet.acceptanceCriteria.length >= 5);
  }
  const laneB = board.workItems.find((entry) => entry.id === "EPIC-14-LANE-B");
  assert.ok(laneB.evidenceRefs.includes("E-EPIC14-C01-BASELINE"));
  assert.ok(laneB.evidenceRefs.includes("E-EPIC14-C02-PARITY"));
  const laneC = board.workItems.find((entry) => entry.id === "EPIC-14-LANE-C");
  assert.ok(laneC.evidenceRefs.includes("E-EPIC14-C05-3D-FEASIBILITY"));
  const laneD = board.workItems.find((entry) => entry.id === "EPIC-14-LANE-D");
  assert.ok(laneD.evidenceRefs.includes("E-EPIC14-C06-STARTER-UPCYCLE-SUPPLIER"));
  const c03 = board.workItems.find((entry) => entry.id === "EPIC-14-C03");
  const c04 = board.workItems.find((entry) => entry.id === "EPIC-14-C04");
  const finalReview = board.workItems.find((entry) => entry.id === "EPIC-14-G01-FINAL-REVIEW");
  assert.equal(c03?.status, "Done");
  assert.equal(c04?.status, "Done");
  assert.equal(finalReview?.status, "Done");
  assert.deepEqual(c03?.dependencies, ["PREQUEUE-PHASE-09", "EPIC-14-C01", "EPIC-14-C02", "EPIC-14-C05", "EPIC-14-C06"]);
  assert.deepEqual(c04?.dependencies, ["PREQUEUE-PHASE-09", "EPIC-14-C03"]);
  assert.deepEqual(finalReview?.dependencies, ["PREQUEUE-PHASE-09", "EPIC-14-C01", "EPIC-14-C02", "EPIC-14-C05", "EPIC-14-C06", "EPIC-14-C03", "EPIC-14-C04"]);
  const c03Evidence = board.evidence.find((entry) => entry.id === "E-EPIC14-C03-S222");
  assert.ok(c03?.evidenceRefs.includes(c03Evidence?.id));
  assert.equal(c03Evidence?.verified, true);
  assert.equal(c03Evidence?.kind, "document");
  assert.match(c03Evidence?.sha256 ?? "", /^[a-f\d]{64}$/);
  assert.equal(hashEvidenceArtifact(c03Evidence.uri), c03Evidence.sha256);
  const c04Evidence = board.evidence.find((entry) => entry.id === "E-EPIC14-C04-S226");
  assert.ok(c04?.evidenceRefs.includes(c04Evidence?.id));
  assert.equal(c04Evidence?.verified, true);
  assert.equal(c04Evidence?.kind, "document");
  assert.match(c04Evidence?.sha256 ?? "", /^[a-f\d]{64}$/);
  assert.equal(hashEvidenceArtifact(c04Evidence.uri), c04Evidence.sha256);
  const finalEvidence = board.evidence.find((entry) => entry.id === "E-EPIC14-G01-EXIT-S228");
  const outputEvidence = board.evidence.find((entry) => entry.id === "E-EPIC14-G01-OUTPUT-S227");
  assert.ok(finalReview?.evidenceRefs.includes(finalEvidence?.id));
  assert.ok(laneA.evidenceRefs.includes(finalEvidence?.id));
  assert.ok(board.workItems.find((entry) => entry.id === "EPIC-14")?.evidenceRefs.includes(finalEvidence?.id));
  assert.ok(board.epics.find((entry) => entry.id === "EPIC-14")?.evidenceRefs.includes(finalEvidence?.id));
  assert.equal(finalEvidence?.verified, true);
  assert.equal(finalEvidence?.kind, "exit-report");
  assert.match(finalEvidence?.sha256 ?? "", /^[a-f\d]{64}$/);
  assert.equal(hashEvidenceArtifact(finalEvidence.uri), finalEvidence.sha256);
  assert.ok(finalReview?.evidenceRefs.includes(outputEvidence?.id));
  assert.equal(outputEvidence?.verified, true);
  assert.equal(outputEvidence?.kind, "document");
  assert.match(outputEvidence?.sha256 ?? "", /^[a-f\d]{64}$/);
  assert.equal(hashEvidenceArtifact(outputEvidence.uri), outputEvidence.sha256);
  assert.equal(board.epics.find((entry) => entry.id === "EPIC-14")?.status, "Closed");
  assert.equal(board.epics.find((entry) => entry.id === "EPIC-15")?.status, "Closed");
  const g02Admission = board.workItems.find((entry) => entry.id === "EPIC-15-ADMISSION");
  const f01 = board.workItems.find((entry) => entry.id === "EPIC-15-F01");
  const f02 = board.workItems.find((entry) => entry.id === "EPIC-15-F02");
  const f03 = board.workItems.find((entry) => entry.id === "EPIC-15-F03");
  const g02FinalReview = board.workItems.find((entry) => entry.id === "EPIC-15-G02-FINAL-REVIEW");
  assert.equal(g02Admission?.status, "Done");
  assert.equal(f01?.status, "Done");
  assert.equal(f02?.status, "Done");
  assert.equal(f03?.status, "Done");
  assert.equal(g02FinalReview?.status, "Done");
  assert.deepEqual(g02Admission?.dependencies, ["EPIC-14"]);
  assert.deepEqual(f01?.dependencies, ["EPIC-15-ADMISSION"]);
  assert.deepEqual(f02?.dependencies, ["EPIC-15-F01"]);
  assert.deepEqual(f03?.dependencies, ["EPIC-15-F02"]);
  assert.deepEqual(g02FinalReview?.dependencies, ["EPIC-15-F03"]);
  const s240EvidenceIds = [
    "E-EPIC15-S240-EXIT",
    "E-EPIC15-S240-COVERAGE",
    "E-EPIC15-S240-PACKAGE",
    "E-EPIC15-S240-RESPONSIVE",
    "E-EPIC15-S240-REVISIONS",
  ];
  for (const evidenceId of s240EvidenceIds) {
    const evidence = board.evidence.find((entry) => entry.id === evidenceId);
    assert.ok(g02FinalReview?.evidenceRefs.includes(evidenceId), `${evidenceId} is linked to final review`);
    assert.equal(evidence?.verified, true, `${evidenceId} is verified`);
    assert.equal(hashEvidenceArtifact(evidence.uri), evidence.sha256, `${evidenceId} matches its stored SHA-256`);
  }
  const g02MergeExitEvidence = board.evidence.find((entry) => entry.id === "E-EPIC15-G02-MERGE-S241");
  assert.ok(board.epics.find((entry) => entry.id === "EPIC-15")?.evidenceRefs.includes(g02MergeExitEvidence?.id));
  assert.equal(g02MergeExitEvidence?.verified, true);
  assert.equal(g02MergeExitEvidence?.kind, "exit-report");
  const mergeExitReport = readFileSync(resolve(projectRoot, g02MergeExitEvidence.uri), "utf8");
  assert.match(mergeExitReport, /e5155e82dbd21cda5b3f537b950eb4c32a22d215/);
  assert.match(mergeExitReport, /94ce7cdfc8faa73c1000343418a3347476f34cff/);
  assert.match(mergeExitReport, /46b78b76c799e54657c46e6fb0053c042a6b36eb/);
  const futureEpics = board.epics.filter((entry) => /^EPIC-(1[6-9]|2\d|30)$/.test(entry.id));
  assert.equal(futureEpics.length, 15);
  assert.ok(futureEpics.every((entry) => entry.status === "Backlog"), "later goals remain gated in Backlog");
  const g02AdmissionEvidence = board.evidence.find((entry) => entry.id === "E-EPIC15-G02-ADMISSION-S229");
  const f01StorageContractEvidence = board.evidence.find((entry) => entry.id === "E-EPIC15-F01-STORAGE-S230");
  const f01RecordModelEvidence = board.evidence.find((entry) => entry.id === "E-EPIC15-F01-MODEL-S231");
  const f01RepositoryEvidence = board.evidence.find((entry) => entry.id === "E-EPIC15-F01-REPO-S232");
  const f01PackageEvidence = board.evidence.find((entry) => entry.id === "E-EPIC15-F01-PACKAGE-S234");
  const f02DependencyEvidence = board.evidence.find((entry) => entry.id === "E-EPIC15-F02-DEPENDENCY-S236");
  const f02RenderedEvidence = board.evidence.find((entry) => entry.id === "E-EPIC15-F02-DEPENDENCY-S236-RENDER");
  assert.ok(g02Admission?.evidenceRefs.includes(g02AdmissionEvidence?.id));
  assert.ok(board.epics.find((entry) => entry.id === "EPIC-15")?.evidenceRefs.includes(g02AdmissionEvidence?.id));
  assert.equal(g02AdmissionEvidence?.verified, true);
  assert.equal(g02AdmissionEvidence?.kind, "document");
  assert.equal(hashEvidenceArtifact(g02AdmissionEvidence.uri), g02AdmissionEvidence.sha256);
  assert.ok(f01?.evidenceRefs.includes(f01StorageContractEvidence?.id));
  assert.equal(f01StorageContractEvidence?.verified, true);
  assert.equal(f01StorageContractEvidence?.kind, "document");
  assert.equal(hashEvidenceArtifact(f01StorageContractEvidence.uri), f01StorageContractEvidence.sha256);
  assert.ok(f01?.evidenceRefs.includes(f01RecordModelEvidence?.id));
  assert.equal(f01RecordModelEvidence?.verified, true);
  assert.equal(f01RecordModelEvidence?.kind, "document");
  assert.equal(hashEvidenceArtifact(f01RecordModelEvidence.uri), f01RecordModelEvidence.sha256);
  assert.ok(f01?.evidenceRefs.includes(f01RepositoryEvidence?.id));
  assert.equal(f01RepositoryEvidence?.verified, true);
  assert.equal(f01RepositoryEvidence?.kind, "document");
  assert.equal(hashEvidenceArtifact(f01RepositoryEvidence.uri), f01RepositoryEvidence.sha256);
  assert.ok(f01?.evidenceRefs.includes(f01PackageEvidence?.id));
  assert.ok(f02?.evidenceRefs.includes(f01PackageEvidence?.id));
  assert.equal(f01PackageEvidence?.verified, true);
  assert.equal(f01PackageEvidence?.kind, "exit-report");
  assert.equal(hashEvidenceArtifact(f01PackageEvidence.uri), f01PackageEvidence.sha256);
  assert.ok(f02?.evidenceRefs.includes(f02DependencyEvidence?.id));
  assert.ok(f02?.evidenceRefs.includes(f02RenderedEvidence?.id));
  assert.equal(f02DependencyEvidence?.verified, true);
  assert.equal(f02DependencyEvidence?.kind, "exit-report");
  assert.equal(hashEvidenceArtifact(f02DependencyEvidence.uri), f02DependencyEvidence.sha256);
  assert.equal(f02RenderedEvidence?.verified, true);
  assert.equal(f02RenderedEvidence?.kind, "rendered-output");
  assert.equal(hashEvidenceArtifact(f02RenderedEvidence.uri), f02RenderedEvidence.sha256);
  const epic15Items = board.workItems.filter((entry) => entry.epicId === "EPIC-15");
  assert.equal(epic15Items.length, 6);
  for (const item of epic15Items) {
    assert.equal(item.status, "Done", `${item.id} must be Done before EPIC-15 closes`);
    assert.ok(item.evidenceRefs.some((ref) => board.evidence.some((evidence) => evidence.id === ref && evidence.verified && evidence.kind !== "incomplete")), `${item.id} needs verified evidence`);
  }
  const epic14Items = board.workItems.filter((entry) => entry.epicId === "EPIC-14");
  assert.ok(epic14Items.length > 1);
  for (const item of epic14Items) {
    assert.equal(item.status, "Done", `${item.id} must be Done before EPIC-14 closes`);
    assert.ok(item.evidenceRefs.some((ref) => board.evidence.some((evidence) => evidence.id === ref && evidence.verified && evidence.kind !== "incomplete")), `${item.id} needs verified evidence`);
  }
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
