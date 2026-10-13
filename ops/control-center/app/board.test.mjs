import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import board from "../data/board.json" with { type: "json" };
import { canTransition, filterItems, filterOptions, renderCreateForm, renderDetail, renderItemList, renderSummary, safeText, summarizeBoard, validateBoard } from "./board.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const g04FinalExitRecorded = board.evidence.some((entry) => entry.id === "E-G04-S732-EXIT");
const expectedG04V03Status = g04FinalExitRecorded ? "Done" : "In Progress";
const g05AdmissionRecorded = board.evidence.some((entry) => entry.id === "E-EPIC18-S762-ADMISSION");

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

test("UIQ integration status follows its release evidence", () => {
  const ids = Array.from({ length: 13 }, (_, index) => `UIQ-${String(index + 1).padStart(2, "0")}`);
  const cards = ids.map((id) => board.workItems.find((item) => item.id === id));
  const gate = board.workItems.find((item) => item.id === "UIQ-GATE");
  const approval = board.evidence.find((entry) => entry.id === "E-UIQ-APPROVAL");
  const gateExit = board.evidence.find((entry) => entry.id === "E-UIQ-GATE-S733-VERIFICATION");
  const integrationAdmission = board.evidence.find((entry) => entry.id === "E-UIQ02-INTEGRATION-ADMISSION-S734");
  const packageBlock = board.evidence.find((entry) => entry.id === "E-UIQ02-S734-ELECTRON-BLOCK");
  const packagePass = board.evidence.find((entry) => entry.id === "E-UIQ02-S734-ELECTRON-VERIFIED");
  const uiq01Reconciliation = board.evidence.find((entry) => entry.id === "E-UIQ01-S761-EXIT");
  const g04UiReconciliation = board.evidence.find((entry) => entry.id === "E-G04-S354-EXIT");
  const g04UiRevalidation = board.evidence.find((entry) => entry.id === "E-G04-S368-EXIT");
  const g04FinalExit = board.evidence.find((entry) => entry.id === "E-G04-S732-EXIT");
  const uiq05Exit = board.evidence.find((entry) => entry.id === "E-UIQ05-S741");
  const uiq05Closeout = board.evidence.find((entry) => entry.id === "E-UIQ05-S742");
  assert.equal(approval?.kind, "decision");
  assert.equal(approval?.verified, true);
  assert.equal(approval?.uri, "docs/planning/UI-ENHANCEMENT-SEQUENCE.md");
  for (const card of cards) {
    assert.ok(card);
    if (["UIQ-01", "UIQ-02", "UIQ-03", "UIQ-04"].includes(card.id)) assert.equal(card.status, "Done");
    else if (card.id === "UIQ-05") assert.equal(card.status, "Done");
    else if (card.id === "UIQ-06") assert.equal(card.status, "Done");
    else if (["UIQ-07", "UIQ-08"].includes(card.id)) assert.equal(card.status, "Done");
    else assert.equal(card.status, "Backlog");
    assert.equal(card.owner, "Codex");
    assert.equal(card.reviewer, "Codex");
    assert.equal(card.targetAt, null);
    const expectedDeliveredAt = card.id === "UIQ-01" ? "2026-10-12"
      : ["UIQ-02", "UIQ-03"].includes(card.id) ? "2026-10-11"
        : ["UIQ-04", "UIQ-05", "UIQ-06", "UIQ-07", "UIQ-08"].includes(card.id) ? "2026-10-12" : null;
    assert.equal(card.deliveredAt, expectedDeliveredAt);
    assert.equal(card.releaseId, null);
    assert.notEqual(card.epicId, "EPIC-17");
    assert.ok(card.evidenceRefs.includes(approval.id));
    assert.ok(card.acceptanceCriteria.length >= 4);
  }
  assert.equal(uiq01Reconciliation?.verified, true);
  assert.equal(uiq01Reconciliation?.uri, "docs/research/uiq01-reconciliation/S761-exit-packet.md");
  assert.equal(hashEvidenceArtifact(uiq01Reconciliation.uri), uiq01Reconciliation.sha256.toLowerCase());
  assert.equal(g04UiReconciliation?.verified, true);
  assert.equal(g04UiRevalidation?.verified, true);
  assert.equal(g04FinalExit?.verified, true);
  assert.ok(cards[0].evidenceRefs.includes("E-UIQ01-S761-EXIT"));
  assert.ok(cards[0].evidenceRefs.includes("E-G04-S354-EXIT"));
  assert.ok(cards[0].evidenceRefs.includes("E-G04-S368-EXIT"));
  assert.ok(cards[0].evidenceRefs.includes("E-G04-S418-EXIT"));
  assert.ok(cards[0].evidenceRefs.includes("E-G04-S732-EXIT"));
  assert.ok(cards[0].statusHistory.some((entry) => entry.status === "Done" && entry.evidenceRefs.includes("E-UIQ01-S761-EXIT")));
  assert.ok(cards[0].comments.some((comment) => comment.text.includes("review checkpoint only")));
  assert.equal(cards[8].status, "Backlog");
  assert.ok(cards[8].acceptanceCriteria[0].includes("Epic19 admission"));
  assert.deepEqual(cards[8].dependencies, ["EPIC-17", "EPIC-19"]);
  assert.equal(board.epics.find((epic) => epic.id === "EPIC-19")?.status, "Backlog");
  assert.ok(cards[8].comments.some((comment) => comment.text.includes("EPIC-19 admission remains required")));
  assert.equal(cards[1].contributor, "Codex");
  assert.equal(cards[1].flagKey, "uiq_foundation");
  assert.equal(cards[2].contributor, "Codex");
  assert.equal(cards[2].flagKey, "uiq_guidance");
  assert.equal(cards[3].title, "Material clarity integration");
  assert.equal(cards[3].contributor, "Codex");
  assert.equal(cards[3].flagKey, "uiq_material");
  assert.deepEqual(cards[3].dependencies, ["UIQ-02", "UIQ-03", "UIQ-GATE", "UIQ04-CANDIDATE"]);
  assert.ok(cards[3].description.includes("docs/planning/UIQ-04-INTEGRATION-ADMISSION.md"));
  assert.ok(cards[3].comments.some((comment) => comment.text.includes("Slice 739 work started")));
  assert.ok(cards[3].comments.some((comment) => comment.text.includes("Slice 739 is ready for review")));
  assert.ok(cards[3].comments.some((comment) => comment.text.includes("Slice 740 verified main deployment")));
  assert.ok(cards[3].evidenceRefs.includes("E-UIQ04-S739"));
  assert.ok(cards[3].evidenceRefs.includes("E-UIQ04-S740"));
  assert.equal(cards[4].title, "Artwork catalog presentation integration");
  assert.equal(cards[4].contributor, "Codex");
  assert.equal(cards[4].flagKey, "uiq_artwork");
  assert.deepEqual(cards[4].dependencies, ["UIQ-GATE", "UIQ05-CANDIDATE"]);
  assert.ok(cards[4].description.includes("docs/planning/UIQ-05-INTEGRATION-ADMISSION.md"));
  assert.equal(cards[4].deliveredAt, "2026-10-12");
  assert.equal(uiq05Exit?.verified, true);
  assert.equal(uiq05Exit?.uri, "docs/release/UIQ-05-INTEGRATION-S741-EXIT.md");
  assert.ok(cards[4].evidenceRefs.includes("E-UIQ05-S741"));
  assert.ok(cards[4].statusHistory.some((entry) => entry.status === "Review" && entry.evidenceRefs.includes("E-UIQ05-S741")));
  assert.ok(cards[4].comments.some((comment) => comment.text.includes("Slice 741 is ready for review")));
  assert.equal(uiq05Closeout?.verified, true);
  assert.equal(uiq05Closeout?.uri, "docs/release/UIQ-05-INTEGRATION-S742-CLOSEOUT.md");
  assert.ok(cards[4].evidenceRefs.includes("E-UIQ05-S742"));
  assert.ok(cards[4].statusHistory.some((entry) => entry.status === "Done" && entry.evidenceRefs.includes("E-UIQ05-S742")));
  assert.ok(cards[4].comments.some((comment) => comment.text.includes("UIQ-05 closed Done after Slice 742")));
  assert.equal(cards[5].title, "Operational controls and critical-state readability");
  assert.equal(cards[5].contributor, "Codex");
  assert.equal(cards[5].flagKey, "uiq_operational_clarity");
  assert.deepEqual(cards[5].dependencies, ["UIQ-GATE"]);
  assert.ok(cards[5].description.includes("docs/planning/UIQ-06-ADMISSION.md"));
  assert.ok(cards[5].statusHistory.some((entry) => entry.status === "In Progress"));
  assert.ok(cards[5].statusHistory.some((entry) => entry.status === "Done" && entry.evidenceRefs.includes("E-UIQ06-S751-LIVE-EXIT")));
  assert.ok(cards[5].evidenceRefs.includes("E-UIQ06-S750-SETTLED-RELEASE"));
  assert.ok(cards[5].evidenceRefs.includes("E-UIQ06-S751-LIVE-EXIT"));
  assert.ok(cards[5].evidenceRefs.includes("E-UIQ06-S752-FINAL-DEPLOYMENT"));
  assert.ok(cards[5].evidenceRefs.includes("E-UIQ06-S753-FINAL-CLOSEOUT"));
  assert.ok(cards[5].evidenceRefs.includes("E-UIQ06-S753-DEPLOYMENT-VERIFICATION"));
  assert.ok(cards[5].evidenceRefs.includes("E-UIQ06-S754-POSTMERGE-STATE"));
  assert.ok(cards[5].evidenceRefs.includes("E-UIQ06-S754-DEPLOYMENT-VERIFICATION"));
  assert.ok(cards[5].comments.some((comment) => comment.text.includes("UIQ-06 is Done at board revision 4439")));
  assert.ok(cards[5].comments.some((comment) => comment.text.includes("Slice 752 verified the post-PR #32 main workflow")));
  const uiq06S752Exit = board.evidence.find((entry) => entry.id === "E-UIQ06-S752-FINAL-DEPLOYMENT");
  assert.equal(uiq06S752Exit?.verified, true);
  assert.equal(uiq06S752Exit?.uri, "docs/research/uiq06/S752-FINAL-DEPLOYMENT-EXIT.md");
  assert.equal(hashEvidenceArtifact(uiq06S752Exit.uri), uiq06S752Exit.sha256.toLowerCase());
  const uiq06S753Exit = board.evidence.find((entry) => entry.id === "E-UIQ06-S753-FINAL-CLOSEOUT");
  assert.equal(uiq06S753Exit?.verified, true);
  assert.equal(uiq06S753Exit?.uri, "docs/research/uiq06/S753-FINAL-CLOSEOUT.md");
  assert.equal(hashEvidenceArtifact(uiq06S753Exit.uri), uiq06S753Exit.sha256.toLowerCase());
  const uiq06S753MachineEvidence = board.evidence.find((entry) => entry.id === "E-UIQ06-S753-DEPLOYMENT-VERIFICATION");
  assert.equal(uiq06S753MachineEvidence?.verified, true);
  assert.equal(hashEvidenceArtifact(uiq06S753MachineEvidence.uri), uiq06S753MachineEvidence.sha256.toLowerCase());
  assert.ok(cards[5].comments.some((comment) => comment.text.includes("Slice 753 verified PR #33 merged")));
  const uiq06S754Exit = board.evidence.find((entry) => entry.id === "E-UIQ06-S754-POSTMERGE-STATE");
  assert.equal(uiq06S754Exit?.verified, true);
  assert.equal(uiq06S754Exit?.uri, "docs/research/uiq06/S754-POSTMERGE-STATE.md");
  assert.equal(hashEvidenceArtifact(uiq06S754Exit.uri), uiq06S754Exit.sha256.toLowerCase());
  const uiq06S754MachineEvidence = board.evidence.find((entry) => entry.id === "E-UIQ06-S754-DEPLOYMENT-VERIFICATION");
  assert.equal(uiq06S754MachineEvidence?.verified, true);
  assert.equal(hashEvidenceArtifact(uiq06S754MachineEvidence.uri), uiq06S754MachineEvidence.sha256.toLowerCase());
  assert.ok(cards[5].comments.some((comment) => comment.text.includes("Slice 754 verified PR #34 merge")));
  const uiq07Admission = board.evidence.find((entry) => entry.id === "E-UIQ07-INTEGRATION-ADMISSION");
  const uiq07PublicCloseout = board.evidence.find((entry) => entry.id === "E-UIQ07-S756-PUBLIC");
  const uiq07FinalExit = board.evidence.find((entry) => entry.id === "E-UIQ07-S756-EXIT");
  const uiq08Admission = board.evidence.find((entry) => entry.id === "E-UIQ08-INTEGRATION-ADMISSION");
  const uiq08S759 = board.workItems.find((item) => item.id === "UIQ08-S759-INTEGRATION");
  const uiq08S760 = board.workItems.find((item) => item.id === "UIQ08-S760-CLOSEOUT");
  const uiq08LiveEvidence = board.evidence.find((entry) => entry.id === "E-UIQ08-S760-LIVE");
  const uiq08ExitEvidence = board.evidence.find((entry) => entry.id === "E-UIQ08-S760-EXIT");
  assert.equal(cards[6].title, "Static native entry and original wordmark");
  assert.equal(cards[6].flagKey, "uiq_welcome");
  assert.equal(cards[6].releaseId, null);
  assert.equal(cards[6].deliveredAt, "2026-10-12");
  assert.deepEqual(cards[6].dependencies, ["UIQ-02", "UIQ-GATE"]);
  assert.ok(cards[6].description.includes("docs/planning/UIQ-07-INTEGRATION-ADMISSION.md"));
  assert.ok(cards[6].statusHistory.some((entry) => entry.status === "In Progress"));
  assert.ok(cards[6].evidenceRefs.includes("E-UIQ07-INTEGRATION-ADMISSION"));
  assert.equal(uiq07Admission?.kind, "decision");
  assert.equal(uiq07Admission?.verified, true);
  assert.equal(uiq07Admission?.uri, "docs/planning/UIQ-07-INTEGRATION-ADMISSION.md");
  assert.equal(hashEvidenceArtifact(uiq07Admission.uri), uiq07Admission.sha256.toLowerCase());
  assert.equal(uiq07PublicCloseout?.kind, "exit-report");
  assert.equal(uiq07PublicCloseout?.verified, true);
  assert.equal(uiq07PublicCloseout?.uri, "docs/research/uiq07-integration/evidence/S756-public-verification.json");
  assert.equal(hashEvidenceArtifact(uiq07PublicCloseout.uri), uiq07PublicCloseout.sha256.toLowerCase());
  assert.equal(uiq07FinalExit?.kind, "exit-report");
  assert.equal(uiq07FinalExit?.verified, true);
  assert.equal(uiq07FinalExit?.uri, "docs/release/UIQ-07-INTEGRATION-S756-CLOSEOUT.md");
  assert.equal(hashEvidenceArtifact(uiq07FinalExit.uri), uiq07FinalExit.sha256.toLowerCase());
  assert.equal(cards[7].title, "Native inspection-toolbar presentation");
  assert.equal(cards[7].status, "Done");
  assert.equal(uiq08Admission?.verified, true);
  assert.equal(uiq08Admission?.uri, "docs/planning/UIQ-08-INTEGRATION-ADMISSION.md");
  assert.equal(hashEvidenceArtifact(uiq08Admission.uri), uiq08Admission.sha256.toLowerCase());
  assert.equal(uiq08S759?.status, "Done");
  assert.ok(uiq08S759?.evidenceRefs.includes("E-UIQ08-S759-MERGED"));
  assert.equal(uiq08S760?.status, "Done");
  assert.deepEqual(uiq08S760?.dependencies, ["UIQ08-S759-INTEGRATION"]);
  assert.equal(uiq08LiveEvidence?.verified, true);
  assert.equal(uiq08LiveEvidence?.kind, "browser");
  assert.equal(hashEvidenceArtifact(uiq08LiveEvidence.uri), uiq08LiveEvidence.sha256.toLowerCase());
  assert.equal(uiq08ExitEvidence?.verified, true);
  assert.equal(uiq08ExitEvidence?.kind, "exit-report");
  assert.equal(hashEvidenceArtifact(uiq08ExitEvidence.uri), uiq08ExitEvidence.sha256.toLowerCase());
  const uiq08Live = JSON.parse(readFileSync(resolve(projectRoot, uiq08LiveEvidence.uri), "utf8"));
  assert.equal(uiq08Live.workflow.runId, 38290776264);
  assert.equal(uiq08Live.workflow.conclusion, "success");
  assert.deepEqual(uiq08Live.targets.map((target) => target.kind), ["stable", "immutable"]);
  assert.ok(uiq08Live.targets.every((target) => target.requests.length === 0 && target.pageErrors.length === 0 && target.consoleErrors.length === 0));
  assert.ok(uiq08Live.targets.every((target) => target.assets.length >= 2 && target.assets.every((asset) => asset.matchesLocal)));
  const mobileToolbarBug = board.workItems.find((item) => item.id === "BUG-UI-048");
  assert.equal(mobileToolbarBug?.title, "More views and Assembled overlap on mobile");
  assert.equal(mobileToolbarBug?.type, "bug");
  assert.equal(mobileToolbarBug?.status, "Backlog");
  assert.equal(mobileToolbarBug?.priority, "P2");
  assert.equal(mobileToolbarBug?.epicId, null);
  assert.equal(mobileToolbarBug?.deliveredAt, null);
  assert.match(mobileToolbarBug?.description ?? "", /byte-identical stable and immutable deployments/);
  assert.match(mobileToolbarBug?.expectation ?? "", /separate, visibly distinct/);
  assert.ok(mobileToolbarBug?.evidenceRefs.includes("E-BUG-UI-048-REPRO"));
  const mobileToolbarRepro = board.evidence.find((entry) => entry.id === "E-BUG-UI-048-REPRO");
  assert.equal(mobileToolbarRepro?.verified, true);
  assert.equal(mobileToolbarRepro?.uri, "docs/research/uiq06/evidence/S752-postdeploy/toolbar-overlap-320.json");
  assert.equal(hashEvidenceArtifact(mobileToolbarRepro.uri), mobileToolbarRepro.sha256.toLowerCase());
  assert.ok(cards[5].comments.some((comment) => comment.text.includes("Slice 744 admitted")));
  assert.ok(cards[5].evidenceRefs.includes("E-UIQ06-S745"));
  assert.ok(board.evidence.some((entry) => entry.id === "E-UIQ06-S745" && entry.verified && entry.uri === "docs/release/UIQ-06-S745-EXIT.md"));
  assert.ok(cards[5].comments.some((comment) => comment.text.includes("Slice 745 is complete")));
  const uiq06S745Exit = board.evidence.find((entry) => entry.id === "E-UIQ06-S745");
  assert.equal(hashEvidenceArtifact(uiq06S745Exit.uri), uiq06S745Exit.sha256.toLowerCase());
  assert.ok(cards[5].evidenceRefs.includes("E-UIQ06-S746-EXIT"));
  assert.ok(cards[5].comments.some((comment) => comment.text.includes("Slice 746 completed")));
  const uiq06S746Exit = board.evidence.find((entry) => entry.id === "E-UIQ06-S746-EXIT");
  assert.equal(uiq06S746Exit?.uri, "docs/research/uiq06/S746-REPORT-DURABILITY-CORRECTION.md");
  assert.equal(integrationAdmission?.verified, false);
  assert.equal(integrationAdmission?.uri, "docs/planning/UIQ-02-INTEGRATION-ADMISSION.md");
  assert.ok(cards[1].evidenceRefs.includes(integrationAdmission.id));
  assert.equal(packageBlock?.verified, false);
  assert.equal(packageBlock?.uri, "tmp/epic9-release/verification.json");
  assert.ok(cards[1].evidenceRefs.includes(packageBlock.id));
  assert.equal(packagePass?.verified, true);
  assert.equal(packagePass?.uri, "docs/research/uiq02-integration/evidence/S734-electron-packaged-verification.json");
  assert.ok(cards[1].evidenceRefs.includes(packagePass.id));
  assert.equal(gate?.status, "Done");
  assert.equal(gate?.releaseId, null);
  assert.equal(gate?.deliveredAt, "2026-10-11");
  assert.ok(gateExit?.verified);
  assert.ok(gate?.evidenceRefs.includes(gateExit.id));
  assert.deepEqual(gate?.dependencies, ["EPIC-17"]);
  assert.deepEqual(cards[2].dependencies, ["UIQ-02"]);
  assert.deepEqual(cards[3].dependencies, ["UIQ-02", "UIQ-03", "UIQ-GATE", "UIQ04-CANDIDATE"]);
  assert.deepEqual(cards[4].dependencies, ["UIQ-GATE", "UIQ05-CANDIDATE"]);
  assert.deepEqual(cards[12].dependencies, ["UIQ-07", "UIQ-GATE"]);
  assert.equal(board.workItems.find((item) => item.id === "EPIC-17").dependencies.some((id) => ids.includes(id)), false);
});

test("S354 reconciliation evidence is linked without changing G04 acceptance status", () => {
  const epic = board.workItems.find((item) => item.id === "EPIC-17");
  const g04 = board.workItems.find((item) => item.id === "G04-V02");
  for (const id of ["E-G04-S354-START", "E-G04-S354-EXIT"]) {
    assert.ok(board.evidence.some((entry) => entry.id === id && entry.uri === "docs/research/epic17/G04-UI-RECOMMENDATION-RECONCILIATION-S354.md"));
    assert.ok(epic.evidenceRefs.includes(id));
    assert.ok(g04.evidenceRefs.includes(id));
  }
  assert.equal(g04.status, "Done");
  assert.ok(g04.evidenceRefs.includes("E-G04-S459-EXIT"));
  assert.ok(g04.comments.some((comment) => /Slice 354 reconciles/.test(comment.text)));
  assert.equal(epic.dependencies.includes("UIQ-GATE"), false);
});

test("S355 Woven diagnosis is linked while every G04 acceptance hold remains", () => {
  const epic = board.workItems.find((item) => item.id === "EPIC-17");
  const g04 = board.workItems.find((item) => item.id === "G04-V02");
  for (const id of ["E-G04-S355-START", "E-G04-S355-EXIT"]) {
    assert.ok(board.evidence.some((entry) => entry.id === id && entry.uri === "docs/research/epic17/G04-V02-WOVEN-BACK-SEAM-OCCLUSION-DIAGNOSIS-S355.md"));
    assert.ok(epic.evidenceRefs.includes(id));
    assert.ok(g04.evidenceRefs.includes(id));
  }
  assert.equal(g04.status, "Done");
  assert.ok(g04.evidenceRefs.includes("E-G04-S459-EXIT"));
  assert.equal(board.workItems.find((item) => item.id === "G04-V03").status, expectedG04V03Status);
  assert.equal(epic.dependencies.includes("UIQ-GATE"), false);
  assert.ok(g04.comments.some((comment) => /Slice 355 rejected Woven back seam-layer occlusion/.test(comment.text)));
});

test("S356 rejects the Woven chord-reflection candidate and retains every hold", () => {
  const epic = board.workItems.find((item) => item.id === "EPIC-17");
  const g04 = board.workItems.find((item) => item.id === "G04-V02");
  for (const id of ["E-G04-S356-START", "E-G04-S356-EXIT"]) {
    assert.ok(board.evidence.some((entry) => entry.id === id && entry.uri === "docs/research/epic17/G04-V02-WOVEN-SLEEVE-BAND-CHORD-REFLECTION-CANDIDATE-S356.md"));
    assert.ok(epic.evidenceRefs.includes(id));
    assert.ok(g04.evidenceRefs.includes(id));
  }
  assert.equal(g04.status, "Done");
  assert.ok(g04.evidenceRefs.includes("E-G04-S459-EXIT"));
  assert.equal(board.workItems.find((item) => item.id === "G04-V03").status, expectedG04V03Status);
  assert.ok(g04.comments.some((comment) => /Slice 356 rejected the Woven sleeve\/band chord-reflection candidate/.test(comment.text)));
});

test("S357 Polo residual study retains the source ease, threshold, and all holds", () => {
  const epic = board.workItems.find((item) => item.id === "EPIC-17");
  const g04 = board.workItems.find((item) => item.id === "G04-V02");
  for (const id of ["E-G04-S357-START", "E-G04-S357-EXIT"]) {
    assert.ok(board.evidence.some((entry) => entry.id === id && entry.uri === "docs/research/epic17/G04-V02-POLO-EASE-RESIDUAL-SOURCE-REPAIR-STUDY-S357.md"));
    assert.ok(epic.evidenceRefs.includes(id));
    assert.ok(g04.evidenceRefs.includes(id));
  }
  assert.equal(g04.status, "Done");
  assert.ok(g04.evidenceRefs.includes("E-G04-S459-EXIT"));
  assert.equal(board.workItems.find((item) => item.id === "G04-V03").status, expectedG04V03Status);
  assert.ok(g04.comments.some((comment) => /Slice 357 found no viable Polo source repair/.test(comment.text)));
});

test("S358 retains the Woven collar hold and records the maintainer's Polo residual decision", () => {
  const epic = board.workItems.find((item) => item.id === "EPIC-17");
  const epicRecord = board.epics.find((item) => item.id === "EPIC-17");
  const g04 = board.workItems.find((item) => item.id === "G04-V02");
  for (const id of ["E-G04-S358-START", "E-G04-S358-EXIT"]) {
    assert.ok(board.evidence.some((entry) => entry.id === id && entry.uri === "docs/research/epic17/G04-V02-WOVEN-COLLAR-EXTERIOR-LAYER-DIAGNOSIS-S358.md"));
    assert.ok(epic.evidenceRefs.includes(id));
    assert.ok(epicRecord.evidenceRefs.includes(id));
    assert.ok(g04.evidenceRefs.includes(id));
  }
  assert.equal(g04.status, "Done");
  assert.ok(g04.evidenceRefs.includes("E-G04-S459-EXIT"));
  assert.equal(board.workItems.find((item) => item.id === "G04-V03").status, expectedG04V03Status);
  assert.ok(g04.comments.some((comment) => /Slice 358 exit: exact upperCollar\/underCollar path arrays coincide on all 56 current Woven faces/.test(comment.text)));
  assert.ok(epic.comments.some((comment) => /Slice 358 exit: exact upperCollar\/underCollar path arrays coincide on all 56 current Woven faces/.test(comment.text)));
});

test("S359 records the Woven rigid-fit decision boundary without releasing holds", () => {
  const epic = board.workItems.find((item) => item.id === "EPIC-17");
  const epicRecord = board.epics.find((item) => item.id === "EPIC-17");
  const g04 = board.workItems.find((item) => item.id === "G04-V02");
  for (const [id, uri] of [
    ["E-G04-S359-START", "docs/research/epic17/G04-V02-WOVEN-COLLAR-RIGID-ASSEMBLY-S359.md"],
    ["E-G04-S359-EXIT", "docs/research/epic17/G04-V02-WOVEN-COLLAR-RIGID-ASSEMBLY-S359.md"],
    ["E-G04-S359-MATRIX", "docs/research/epic17/S359-woven-collar-rigid-assembly/rigid-endpoint-feasibility-matrix.json"],
    ["E-G04-S359-OVERLAY", "docs/research/epic17/S359-woven-collar-rigid-assembly/rigid-endpoint-feasibility-overlay.png"],
  ]) {
    assert.ok(board.evidence.some((entry) => entry.id === id && entry.uri === uri));
    assert.ok(epic.evidenceRefs.includes(id));
    assert.ok(epicRecord.evidenceRefs.includes(id));
    assert.ok(g04.evidenceRefs.includes(id));
  }
  assert.equal(g04.status, "Done");
  assert.ok(g04.evidenceRefs.includes("E-G04-S459-EXIT"));
  assert.equal(board.workItems.find((item) => item.id === "G04-V03").status, expectedG04V03Status);
  assert.match(g04.description, /all 73 canonical supported configurations and 146 front\/back faces/);
  assert.ok(g04.comments.some((comment) => /Slice 359 exit: source arc\/chord incompatibility/.test(comment.text)));
  assert.ok(epic.comments.some((comment) => /Slice 359 retains the current 56 accepted \/ 90 held integrated tally/.test(comment.text)));
});

test("S360 binds the landed S359 commit without changing Polo or Woven holds", () => {
  const expectedCommit = "d519a8ac7b440ea310f660e80799bef9c0479ee1";
  const s359Ids = ["E-G04-S359-START", "E-G04-S359-EXIT", "E-G04-S359-MATRIX", "E-G04-S359-OVERLAY"];
  for (const id of s359Ids) {
    const evidence = board.evidence.find((entry) => entry.id === id);
    assert.ok(evidence, `${id} exists`);
    assert.equal(evidence.commit, expectedCommit);
    assert.equal(evidence.verified, true);
  }
  const epic = board.workItems.find((item) => item.id === "EPIC-17");
  const epicRecord = board.epics.find((item) => item.id === "EPIC-17");
  const g04 = board.workItems.find((item) => item.id === "G04-V02");
  for (const id of ["E-G04-S360-START", "E-G04-S360-EXIT"]) {
    assert.ok(board.evidence.some((entry) => entry.id === id && entry.uri === "docs/research/epic17/G04-V02-S359-EVIDENCE-CLOSEOUT-S360.md"));
    assert.ok(epic.evidenceRefs.includes(id));
    assert.ok(epicRecord.evidenceRefs.includes(id));
    assert.ok(g04.evidenceRefs.includes(id));
  }
  assert.equal(g04.status, "Done");
  assert.ok(g04.evidenceRefs.includes("E-G04-S459-EXIT"));
  assert.equal(board.workItems.find((item) => item.id === "G04-V03").status, expectedG04V03Status);
  assert.match(board.workItems.find((item) => item.id === "G04-V02").description, /0\.25 cm/);
});

test("S361 evidence remains linked after the current summary reconciliation", () => {
  const epicCard = board.workItems.find((item) => item.id === "EPIC-17");
  const epicRecord = board.epics.find((item) => item.id === "EPIC-17");
  const g04 = board.workItems.find((item) => item.id === "G04-V02");
  const heldEvidence = ["E-G04-S361-EXIT", "E-G04-S361-MATRIX", "E-G04-S361-OVERLAY", "E-G04-S361-TEST"];
  for (const id of ["E-G04-S361-START", ...heldEvidence]) {
    assert.ok(epicCard.evidenceRefs.includes(id));
    assert.ok(epicRecord.evidenceRefs.includes(id));
    assert.ok(g04.evidenceRefs.includes(id));
  }
  assert.equal(g04.status, "Done");
  assert.ok(g04.evidenceRefs.includes("E-G04-S459-EXIT"));
  assert.equal(board.workItems.find((item) => item.id === "G04-V01").status, "Done");
  assert.equal(board.workItems.find((item) => item.id === "G04-V03").status, expectedG04V03Status);
  assert.match(g04.description, /Integrated all-seven V02 accepted at S459/);
  assert.match(g04.description, /exact approved S351 exception/);
  assert.match(g04.description, /all-seven V02/);
  assert.ok(g04.evidenceRefs.includes("E-G04-S458-EXIT"));
  assert.match(g04.description, /all-seven V02/);
  assert.match(epicCard.description, /S459 accepts all seven recipes, 73 supported configurations and 146 front\/back faces/);
  assert.match(epicCard.description, /S406's approved view-only collar-over-plackets order remains implemented/);
  assert.ok(g04.evidenceRefs.includes("E-G04-S457-EXIT"));
  assert.ok(g04.evidenceRefs.includes("E-G04-S458-EXIT"));
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

test("Epic 14–30 catalog status matches closure, admission, and current exit evidence", () => {
  for (let index = 1; index <= 17; index += 1) {
    const id = `EPIC-${index + 13}`;
    const goal = `G${String(index).padStart(2, "0")}`;
    const epic = board.epics.find((entry) => entry.id === id);
    const card = board.workItems.find((entry) => entry.id === id);
    const expectedEpicStatus = id === "EPIC-14" || id === "EPIC-15" || id === "EPIC-16"
      ? "Closed" : id === "EPIC-17" ? (g04FinalExitRecorded ? "Closed" : "In Progress")
        : id === "EPIC-18" && g05AdmissionRecorded ? "In Progress" : "Backlog";
    const expectedCardStatus = id === "EPIC-14" || id === "EPIC-15" || id === "EPIC-16"
      ? "Done" : id === "EPIC-17" ? (g04FinalExitRecorded ? "Done" : "In Progress")
        : id === "EPIC-18" && g05AdmissionRecorded ? "In Progress" : "Backlog";
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
    if (id === "EPIC-17") {
      const g04V02 = board.workItems.find((entry) => entry.id === "G04-V02");
      const g04V03 = board.workItems.find((entry) => entry.id === "G04-V03");
      const finalEvidence = board.evidence.find((entry) => entry.id === "E-G04-S732-EXIT");
      assert.match(epic.description, /docs\/planning\/EPIC-17-ADMISSION\.md/);
      assert.match(epic.description, /S459 accepts all seven recipes, 73 supported configurations and 146 front\/back faces/);
      assert.match(epic.description, /Woven's 56 local faces pass the approved S457 front mask and local-Y back\/band placement/);
      assert.match(epic.description, /S406's approved view-only collar-over-plackets order remains implemented/);
      assert.match(card.description, /S459 accepts all seven recipes, 73 supported configurations and 146 front\/back faces/);
      assert.match(card.description, /V01 and V02 are Done/);
      assert.match(card.description, /Preserve V02-before-V03, legacy DXF behavior and protected export identities/);
      assert.equal(g04V03?.status, expectedG04V03Status);
      if (g04FinalExitRecorded) {
        assert.match(card.description, /S732 closed EPIC-17 on 2026-10-11/);
        assert.ok(g04V03?.evidenceRefs.includes("E-G04-S732-EXIT"));
        assert.ok(card.evidenceRefs.includes("E-G04-S732-EXIT"));
        assert.ok(epic.evidenceRefs.includes("E-G04-S732-EXIT"));
        assert.equal(finalEvidence?.kind, "exit-report");
        assert.equal(finalEvidence?.verified, true);
        assert.equal(finalEvidence?.uri, "docs/research/epic17/S732-final-closeout/S732-exit-packet.md");
        assert.equal(hashEvidenceArtifact(finalEvidence.uri), finalEvidence.sha256);
      }
      assert.ok(g04V02?.evidenceRefs.includes("E-G04-S420-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S420-EXIT"));
      assert.ok(g04V02.evidenceRefs.includes("E-G04-S458-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-EPIC17-S458-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S420-EXIT"));
      assert.ok(g04V02?.evidenceRefs.includes("E-G04-S362-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S362-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S362-EXIT"));
      for (const evidenceId of ["E-G04-S363-START", "E-G04-S363-EXIT", "E-G04-S363-MATRIX",
        "E-G04-S363-MAX-HEIGHT-HOLD", "E-G04-S363-ANCHOR"]) {
        assert.ok(g04V02?.evidenceRefs.includes(evidenceId));
        assert.ok(card.evidenceRefs.includes(evidenceId));
        assert.ok(epic.evidenceRefs.includes(evidenceId));
      }
      assert.ok(g04V02?.comments.some((comment) => /Slice 362 exit: the approved Woven full-collar view projection emits all 56 option\/face requests/.test(comment.text)));
      assert.ok(g04V02?.evidenceRefs.includes("E-G04-S335-EXIT"));
      assert.ok(g04V02?.evidenceRefs.includes("E-G04-S335-BROWSER"));
      assert.ok(g04V02?.comments.some((comment) => /S335 verified exit: all five Woven front colorway contours now close/.test(comment.text)));
      assert.ok(g04V02?.evidenceRefs.includes("E-G04-S336-EXIT"));
      assert.ok(g04V02?.evidenceRefs.includes("E-G04-S336-BROWSER"));
      assert.ok(g04V02?.evidenceRefs.includes("E-G04-S336-DECISION"));
      assert.ok(g04V02?.evidenceRefs.includes("E-G04-S336-COMMIT"));
      assert.ok(g04V02?.evidenceRefs.includes("E-G04-S337-START"));
      for (const evidenceId of ["E-G04-S337-EXIT", "E-G04-S337-SOURCE", "E-G04-S337-BROWSER",
        "E-G04-S337-FRONT-OVERLAY", "E-G04-S337-BACK-OVERLAY", "E-G04-S337-DECISION"]) {
        assert.ok(g04V02?.evidenceRefs.includes(evidenceId));
        assert.ok(card.evidenceRefs.includes(evidenceId));
        assert.ok(epic.evidenceRefs.includes(evidenceId));
      }
      for (const evidenceId of ["E-G04-S337-COMMIT", "E-G04-S338-START"]) {
        assert.ok(g04V02?.evidenceRefs.includes(evidenceId));
        assert.ok(card.evidenceRefs.includes(evidenceId));
        assert.ok(epic.evidenceRefs.includes(evidenceId));
      }
      assert.ok(g04V02?.comments.some((comment) => /S336 verified exit: source-order endpoint correction passes focused gates; 0\/56 Woven faces emitted and two view-deformation decisions remain pending/.test(comment.text)));
      assert.ok(g04V02?.comments.some((comment) => /S337 started 2026-10-01 17:12:52 UTC from clean S336 9bce95df/.test(comment.text)));
      assert.ok(g04V02?.comments.some((comment) => /S337 exit: Polo source\/POM audit and 17-configuration\/34-face Chromium replay complete/.test(comment.text)));
      assert.ok(g04V02?.comments.some((comment) => /S338 started 2026-10-01 17:37:45 UTC from clean S337 b113f25/.test(comment.text)));
      for (const evidenceId of ["E-G04-S332-START", "E-G04-S332-EXIT", "E-G04-S332-OPTIONS", "E-G04-S332-RENDERED",
        "E-G04-S333-START", "E-G04-S333-EXIT", "E-G04-S333-BROWSER", "E-G04-S333-RENDERED", "E-G04-S333-COVERAGE",
        "E-G04-S333-COMMIT"]) {
        assert.ok(card.evidenceRefs.includes(evidenceId));
        assert.ok(epic.evidenceRefs.includes(evidenceId));
      }
      for (const evidenceId of ["E-G04-S334-START", "E-G04-S334-COMMIT", "E-G04-S334-EXIT", "E-G04-S334-DIAGNOSTIC", "E-G04-S334-BROWSER",
        "E-G04-S334-RENDERED", "E-G04-S334-COVERAGE", "E-G04-S334-BUILD", "E-G04-S335-START"]) {
        assert.ok(card.evidenceRefs.includes(evidenceId));
        assert.ok(epic.evidenceRefs.includes(evidenceId));
      }
      for (const evidenceId of ["E-G04-S335-EXIT", "E-G04-S335-CONTOURS", "E-G04-S335-OVERLAY",
        "E-G04-S335-CANDIDATE-BROWSER", "E-G04-S335-BROWSER", "E-G04-S335-RENDERED", "E-G04-S335-COVERAGE",
        "E-G04-S335-BUILD", "E-G04-S335-EXPORT", "E-G04-S335-CONTROL-CENTER"]) {
        assert.ok(card.evidenceRefs.includes(evidenceId));
        assert.ok(epic.evidenceRefs.includes(evidenceId));
      }
      for (const evidenceId of ["E-G04-S336-START", "E-G04-S336-EXIT", "E-G04-S336-DIAGNOSTIC", "E-G04-S336-OVERLAY",
        "E-G04-S336-BROWSER", "E-G04-S336-RENDERED", "E-G04-S336-COVERAGE", "E-G04-S336-BUILD",
        "E-G04-S336-EXPORT", "E-G04-S336-CONTROL-CENTER", "E-G04-S336-DECISION"]) {
        assert.ok(card.evidenceRefs.includes(evidenceId));
        assert.ok(epic.evidenceRefs.includes(evidenceId));
      }
      for (const evidenceId of ["E-G04-S336-COMMIT", "E-G04-S337-START"]) {
        assert.ok(card.evidenceRefs.includes(evidenceId));
        assert.ok(epic.evidenceRefs.includes(evidenceId));
      }
      assert.equal(board.evidence.find((entry) => entry.id === "E-G04-S335-BROWSER")?.uri,
        "docs/research/epic17/S335-woven-contours/replay-after-hold/matrix.json");
      assert.equal(board.evidence.find((entry) => entry.id === "E-G04-S336-BROWSER")?.uri,
        "docs/research/epic17/S336-woven-placement/production-replay/matrix.json");
      assert.equal(board.evidence.find((entry) => entry.id === "E-G04-S336-COMMIT")?.commit,
        "9bce95df80e0598d24c42b49d211df81f9892325");
      assert.equal(board.evidence.find((entry) => entry.id === "E-G04-S337-EXIT")?.uri,
        "docs/research/epic17/G04-V02-POLO-REMAINING-HOLDS-S337.md");
      assert.equal(board.evidence.find((entry) => entry.id === "E-G04-S337-COMMIT")?.commit,
        "b113f25da4b28d075326c5ec30f73030a79c2f35");
      assert.equal(board.evidence.find((entry) => entry.id === "E-G04-S338-START")?.uri,
        "docs/research/epic17/G04-V02-POLO-POM-ANCHORS-S338.md");
      assert.equal(board.evidence.find((entry) => entry.id === "E-G04-S337-BROWSER")?.uri,
        "docs/research/epic17/S337-polo-holds/production-replay/matrix.json");
      assert.match(board.evidence.find((entry) => entry.id === "E-G04-S337-DECISION")?.note ?? "",
        /keep Woven sleeve\/collar views held/);
      assert.equal(board.evidence.find((entry) => entry.id === "E-G04-S334-COMMIT")?.commit,
        "b27a444a020ff69330479554776977ab5aeb5be4");
      assert.ok(card.evidenceRefs.includes("E-G04-S315-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S315-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S316-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S316-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S317-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S317-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S328-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S328-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S329-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S329-INTEGRATED-BROWSER"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S329-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S329-INTEGRATED-BROWSER"));
      for (const evidenceId of [
        "E-G04-S330-EXIT",
        "E-G04-S330-TEE-FITTED-REVIEW",
        "E-G04-S330-TEE-FITTED-BROWSER",
        "E-G04-S330-MEASUREMENT-HOLD",
        "E-G04-S330-INTEGRATED-BROWSER",
        "E-G04-S330-COMMIT",
        "E-G04-S331-START",
        "E-G04-S331-EXIT",
        "E-G04-S331-REVIEW",
        "E-G04-S331-BROWSER",
      ]) {
        assert.ok(card.evidenceRefs.includes(evidenceId));
        assert.ok(epic.evidenceRefs.includes(evidenceId));
      }
      assert.equal(board.evidence.find((entry) => entry.id === "E-G04-S330-COMMIT")?.commit,
        "558564bab25ab0e717ee825f4c4ab54f9eba4ea2");
      assert.ok(card.evidenceRefs.includes("E-G04-S327-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S327-TROUSER-BROWSER"));
      assert.ok(card.evidenceRefs.includes("E-G04-S327-INTEGRATED-BROWSER"));
      assert.ok(card.evidenceRefs.includes("E-G04-S318-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S318-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S319-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S319-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S320-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S320-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S316-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S317-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S318-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S318-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S319-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S319-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S320-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S320-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S286-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S300-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S301-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S302-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S302-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S303-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S303-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S304-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S304-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S305-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S305-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S307-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S307-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S308-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S308-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S309-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S309-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S310-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S310-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S311-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S312-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S312-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S313-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S313-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S315-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S314-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S315-EXIT"));
      assert.ok(card.evidenceRefs.includes("E-G04-S301-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S300-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S301-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S302-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S302-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S303-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S303-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S304-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S304-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S305-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S305-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S307-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S308-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S308-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S309-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S309-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S310-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S310-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S311-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S312-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S312-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S313-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S313-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S314-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S315-START"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S315-EXIT"));
      assert.ok(epic.evidenceRefs.includes("E-G04-S301-EXIT"));
      assert.ok(card.comments.some((comment) => /Re-estimate from verified S301 boundary: 4\/146 faces are accepted, 142 remain held/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /Re-estimate from verified S307 boundary: 28\/146 faces are accepted, 118 remain held/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /Slice 308 started 2026-09-30 15:44:39 UTC from clean S307 54dc71b.*G04-V02-TROUSER-FRONT-CENTER-JOIN-S308\.md/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /Re-estimate from verified S308 boundary: output remains 28\/146 accepted and 118 held; 9–23 conditional slices remain/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /Re-estimate from verified S309 boundary: output remains 28\/146 accepted and 118 held; 8–22 conditional slices remain/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /Slice 310 started 2026-09-30 16:41:59 UTC from clean S309 b89eec1.*G04-V02-TROUSER-WAISTBAND-DEPTH-POM-S310\.md/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /Re-estimate from verified S310 boundary: output remains 28\/146 accepted and 118 held; 7–21 conditional slices remain/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /Slice 312 exit: Skirt waist and hip POMs resolve to matching exact front\/back outline vertices.*V02 remains In Progress; V03 remains Backlog/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /Slice 319 verified exit: all-recipe production replay and visible colorway raster review passed with unchanged 28\/146 accepted and 118 held; V02 remains In Progress and V03 remains Backlog/.test(comment.text)));
      assert.ok(card.evidenceRefs.includes("E-G04-S326-START"));
      assert.ok(card.evidenceRefs.includes("E-G04-S326-OUTPUT-REPLAY"));
      assert.ok(card.comments.some((comment) => /S325 verified exit: proposal-only Trouser fly-underlap fixture passes assembly feasibility in all 24 configurations/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /S326 verified exit: the approved Trouser underlap graph solves all 24 configurations; 24 back faces emit and 24 fronts remain held; all 24 front views retain the waistband color-contour and hip-depth label holds/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /S327 started 2026-10-01 05:41:32 UTC from clean S326 681aedd8.*G04-V02-TROUSER-FRONT-COLORWAY-CALLOUT-S327\.md/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /S327 start: re-estimated from 66 numbered slices landed through S326.*at least 10 more \/ 76 total/.test(comment.text)));
      assert.ok(card.comments.some((comment) => /S327 exit recorded\. Current minimum is at least 9 further slices after S327/ .test(comment.text)));
      assert.ok(card.comments.some((comment) => /Slice 318 exit: source-backed colorway areas are visibly rasterized at one 16% tint.*13 SVGs and 27 fills.*V02 remains In Progress; V03 remains Backlog/.test(comment.text)));
      assert.deepEqual(card.dependencies, ["EPIC-14", "EPIC-15", "EPIC-16"]);
      const admittedWork = board.workItems.filter((entry) => entry.epicId === id && entry.id !== id);
      assert.ok(admittedWork.find((entry) => entry.id === "G04-V02")?.comments.some((comment) => /S334 verified exit: exact Woven source-edge traversal corrections pass focused 100% coverage and build/.test(comment.text)));
      assert.ok(admittedWork.find((entry) => entry.id === "G04-V02")?.comments.some((comment) => /S335 started 2026-10-01 15:24:44 UTC from clean S334 b27a444a/.test(comment.text)));
      assert.deepEqual(admittedWork.map((entry) => entry.id), ["G04-V01", "G04-V02", "G04-V03"]);
      assert.deepEqual(admittedWork.map((entry) => entry.status), ["Done", "Done", expectedG04V03Status]);
      assert.match(admittedWork[1].description, /S406's approved view-only collar-over-plackets order remains implemented/);
      assert.match(admittedWork[1].description, /Integrated all-seven V02 accepted at S459/);
      assert.match(admittedWork[1].description, /exact approved S351 exception/);
      assert.match(admittedWork[1].description, /V01\/V02 Done/);
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S320-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S326-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S326-OUTPUT-REPLAY"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S327-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S327-TROUSER-BROWSER"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S327-INTEGRATED-BROWSER"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S328-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S328-TEE-FITTED-BROWSER"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S328-INTEGRATED-BROWSER"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S329-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S329-INTEGRATED-BROWSER"));
      for (const evidenceId of [
        "E-G04-S330-EXIT",
        "E-G04-S330-TEE-FITTED-REVIEW",
        "E-G04-S330-TEE-FITTED-BROWSER",
        "E-G04-S330-MEASUREMENT-HOLD",
        "E-G04-S330-INTEGRATED-BROWSER",
        "E-G04-S330-COMMIT",
        "E-G04-S331-START",
        "E-G04-S331-EXIT",
        "E-G04-S331-REVIEW",
        "E-G04-S331-BROWSER",
      ]) assert.ok(admittedWork[1].evidenceRefs.includes(evidenceId));
      assert.ok(admittedWork[1].comments.some((comment) => /S325 verified exit: proposal-only Trouser fly-underlap fixture passes assembly feasibility in all 24 configurations/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /S326 verified exit: the approved Trouser underlap graph solves all 24 configurations; 24 back faces emit and 24 fronts remain held; all 24 front views retain the waistband color-contour and hip-depth label holds/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /S327 started 2026-10-01 05:41:32 UTC from clean S326 681aedd8.*G04-V02-TROUSER-FRONT-COLORWAY-CALLOUT-S327\.md/.test(comment.text)));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S321-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S321-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S322-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S322-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S322-RECONCILIATION"));
      assert.ok(admittedWork[1].comments.some((comment) => /Start Slice 320 at 2026-10-01 00:04:19 UTC from clean S319 92a270753ee526d90c9daba0b3ffbfd45da68ff9/.test(comment.text)));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S320-START"));
      assert.match(admittedWork[1].description, /Integrated all-seven V02 accepted at S459/);
      assert.ok(admittedWork[0].evidenceRefs.includes("E-G04-S264-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S265-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S266-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S267-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S268-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S269-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S276-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S277-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S278-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S279-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S280-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S281-EXIT"));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 281 started.*G04-V02-ASSEMBLY-REVIEW-S281\.md/.test(comment.text)));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S282-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S283-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S284-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S284-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S291-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S291-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S292-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S292-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S293-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S293-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S294-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S294-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S295-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S296-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S296-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S297-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S297-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S298-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S298-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S299-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S299-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S300-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S300-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S301-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S302-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S302-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S303-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S303-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S304-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S304-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S305-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S305-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S306-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S306-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S307-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S307-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S308-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S308-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S309-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S309-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S310-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S310-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S311-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S312-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S312-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S313-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S313-EXIT"));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 305 started 2026-09-30 13:19:48 UTC.*G04-V02-TROUSER-WAISTBAND-VIEW-SEGMENTS-S305\.md/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 305 exit: TROUSER-RESEARCH specifies one closed waistband, separate front\/back joins.*S306.*V02 remains In Progress; V03 remains Backlog/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 306 started 2026-09-30 13:32:50 UTC.*G04-V02-TROUSER-WAISTBAND-FRAGMENTS-S306\.md/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 306 exit: exact same-role Trouser waistband intervals.*V02 remains In Progress; V03 remains Backlog/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Start Slice 307 from clean S306 c5930532.*S307 packet/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 307 exit: exact waistband fragments compile.*V02 remains In Progress; V03 remains Backlog/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Start Slice 308 from clean S307 54dc71b.*S308 packet/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 308 exit: the exact source graph places frontLeft at 0 degrees and frontRight at 180 degrees.*V02 remains In Progress; V03 remains Backlog/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Start Slice 309 at 2026-09-30 16:04:30 UTC.*G04-V02-TROUSER-BACK-RISE-POM-S309\.md/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 309 exit: the finished back-rise POM is anchored to the exact same-revision backLeft center-back crotch vertex.*V02 remains In Progress; V03 remains Backlog/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Start Slice 310 at 2026-09-30 16:41:59 UTC from clean S309 b89eec1.*G04-V02-TROUSER-WAISTBAND-DEPTH-POM-S310\.md/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 310 exit: source and retained production SVGs prove the authored `centerBack` mark is the exact same-revision midpoint of the compiled back closure edge in all 24 accepted configurations.*S311 will add the typed mark-entity anchor/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 312 exit: Skirt waist and hip POMs resolve to matching exact front\/back outline vertices.*V02 remains In Progress; V03 remains Backlog/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 313 started 2026-09-30 18:33:26 UTC from clean S312 c7e7a6fc.*G04-V02-TANK-BACK-POM-ANCHORS-S313\.md/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 319 exit: production replay covered 73 configurations, 146 faces and 32 option fields; 28 accepted and 118 complete source-backed holds exactly match S315/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 318 exit: source-backed colorway areas are visibly rasterized at one 16% tint.*13 SVGs and 27 fills.*V02 remains In Progress; V03 remains Backlog/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 304 started 2026-09-30 13:02:44 UTC.*G04-V02-ACCEPTED-FACE-OVERLAYS-S304\.md/.test(comment.text)));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S301-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S316-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S316-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S317-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S317-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S318-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S318-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S319-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S319-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S285-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S286-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S287-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S287-EXIT"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S288-START"));
      assert.ok(admittedWork[1].evidenceRefs.includes("E-G04-S288-EXIT"));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 282 started.*G04-V02-FACE-SEGMENT-CONTRACT-S282\.md/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 283 started.*G04-V02-SOURCE-INTERFACE-SEGMENTS-S283\.md/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 283 exit: source-backed Skirt waistband face segments passed/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 284 started 2026-09-30 05:24:03 UTC.*G04-V02-INTEGRATED-OUTPUT-REVIEW-S284\.md/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 288 exit: Jalie 3137, Maelo BL-018 and Threads two-piece collar drafting sources/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /S289 source-topology audit found no supported rigid Trouser face placement/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /S290 source audit: exact Tee.*cap edges pair to front.*armhole/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 292 started 2026-09-30 08:50:03 UTC.*G04-V02-WOVEN-SOURCE-MAPPING-S292\.md/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 293 started 2026-09-30 09:01:47 UTC.*G04-V02-WOVEN-BODY-VIEW-METADATA-S293\.md/.test(comment.text)));
      assert.ok(admittedWork[1].comments.some((comment) => /Slice 294 started 2026-09-30 09:16:12 UTC.*G04-V02-COLLAR-REFERENCE-REVIEW-S294\.md/.test(comment.text)));
      assert.deepEqual(admittedWork.map((entry) => entry.dependencies), [[], ["G04-V01"], ["G04-V02"]]);
    }
    if (id === "EPIC-16") {
      assert.match(epic.description, /docs\/planning\/EPIC-16-ADMISSION\.md/);
      const admittedWork = board.workItems.filter((entry) => entry.epicId === id && entry.id !== id);
      assert.deepEqual(admittedWork.map((entry) => entry.id), [
        "EPIC16-M01", "EPIC16-M02", "EPIC16-M03", "EPIC16-FINAL-REVIEW", "EPIC16-M03-SAFETY",
      ]);
      assert.equal(admittedWork[0].status, "Done");
      assert.deepEqual(admittedWork.slice(1).map((entry) => entry.status), [
        "Done", "Done", "Done", "Done",
      ]);
      assert.equal(epic.status, "Closed");
      assert.deepEqual(admittedWork.map((entry) => entry.dependencies.at(-1)), [
        "EPIC-15", "EPIC16-M01", "EPIC16-M02", "EPIC16-M03-SAFETY", "EPIC16-M03",
      ]);
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
  const laterEpics = board.epics.filter((entry) => /^EPIC-(1[6-9]|2\d|30)$/.test(entry.id));
  assert.equal(laterEpics.length, 15);
  assert.equal(laterEpics.find((entry) => entry.id === "EPIC-16")?.status, "Closed");
  assert.equal(laterEpics.find((entry) => entry.id === "EPIC-17")?.status, g04FinalExitRecorded ? "Closed" : "In Progress");
  assert.equal(laterEpics.find((entry) => entry.id === "EPIC-18")?.status, g05AdmissionRecorded ? "In Progress" : "Backlog");
  assert.ok(laterEpics.filter((entry) => !["EPIC-16", "EPIC-17", "EPIC-18"].includes(entry.id))
    .every((entry) => entry.status === "Backlog"),
  "goals after admitted EPIC-18 remain in Backlog");
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
  const g05 = board.epics.find((entry) => entry.id === "EPIC-18");
  const g05Card = board.workItems.find((entry) => entry.id === "EPIC-18");
  const g05Admission = board.evidence.find((entry) => entry.id === "E-EPIC18-S762-ADMISSION");
  const g05Exit = board.evidence.find((entry) => entry.id === "E-EPIC18-S762-EXIT");
  const g05Start = board.evidence.find((entry) => entry.id === "E-G05-S763-START");
  const g05S763Exit = board.evidence.find((entry) => entry.id === "E-G05-S763-EXIT");
  const g05S767Exit = board.evidence.find((entry) => entry.id === "E-G05-S767-EXIT");
  const g05S768Start = board.evidence.find((entry) => entry.id === "E-G05-S768-START");
  const g05S768Exit = board.evidence.find((entry) => entry.id === "E-G05-S768-EXIT");
  const g05S769Start = board.evidence.find((entry) => entry.id === "E-G05-S769-START");
  const g05S769Exit = board.evidence.find((entry) => entry.id === "E-G05-S769-EXIT");
  const g05S770Start = board.evidence.find((entry) => entry.id === "E-G05-S770-START");
  const g05S770Exit = board.evidence.find((entry) => entry.id === "E-G05-S770-EXIT");
  const g05S770Replay = board.evidence.find((entry) => entry.id === "E-G05-S770-REPLAY");
  const g05Children = board.workItems.filter((entry) => entry.epicId === "EPIC-18");
  assert.equal(g05?.status, "In Progress");
  assert.equal(g05Card?.status, "In Progress");
  assert.deepEqual(g05Card?.dependencies, ["EPIC-15", "EPIC-16", "EPIC-17"]);
  assert.equal(g05Admission?.uri, "docs/planning/EPIC-18-ADMISSION.md");
  assert.equal(g05Admission?.verified, true);
  assert.equal(hashEvidenceArtifact(g05Admission.uri), g05Admission.sha256);
  assert.equal(g05Exit?.uri, "docs/research/epic18/S762-admission/exit-packet.md");
  assert.equal(g05Exit?.kind, "exit-report");
  assert.equal(g05Exit?.verified, true);
  assert.equal(hashEvidenceArtifact(g05Exit.uri), g05Exit.sha256);
  assert.ok(g05Card?.evidenceRefs.includes(g05Exit.id));
  assert.ok(g05?.evidenceRefs.includes(g05Exit.id));
  assert.equal(g05Start?.uri, "docs/research/epic18/S763-T01-record-contract/start-packet.md");
  assert.equal(g05Start?.kind, "document");
  assert.equal(g05Start?.verified, true);
  assert.equal(hashEvidenceArtifact(g05Start.uri), g05Start.sha256);
  assert.ok(board.workItems.find((entry) => entry.id === "G05-T01")?.evidenceRefs.includes(g05Start.id));
  assert.equal(g05S763Exit?.uri, "docs/research/epic18/S763-T01-record-contract/exit-packet.md");
  assert.equal(g05S763Exit?.kind, "exit-report");
  assert.equal(g05S763Exit?.verified, true);
  assert.equal(hashEvidenceArtifact(g05S763Exit.uri), g05S763Exit.sha256);
  assert.ok(board.workItems.find((entry) => entry.id === "G05-T01")?.evidenceRefs.includes(g05S763Exit.id));
  assert.ok(g05?.evidenceRefs.includes(g05S763Exit.id));
  assert.equal(g05S767Exit?.uri, "docs/research/epic18/S767-T01-editor/exit-packet.md");
  assert.equal(g05S767Exit?.kind, "exit-report");
  assert.equal(g05S767Exit?.verified, true);
  assert.equal(hashEvidenceArtifact(g05S767Exit.uri), g05S767Exit.sha256);
  assert.ok(board.workItems.find((entry) => entry.id === "G05-T01")?.evidenceRefs.includes(g05S767Exit.id));
  assert.ok(g05?.evidenceRefs.includes(g05S767Exit.id));
  assert.equal(g05S768Start?.uri, "docs/research/epic18/S768-T02-pom-definition-contract/start-packet.md");
  assert.equal(g05S768Start?.verified, true);
  assert.equal(hashEvidenceArtifact(g05S768Start.uri), g05S768Start.sha256);
  assert.ok(board.workItems.find((entry) => entry.id === "G05-T02")?.evidenceRefs.includes(g05S768Start.id));
  assert.equal(g05S768Exit?.uri, "docs/research/epic18/S768-T02-pom-definition-contract/exit-packet.md");
  assert.equal(g05S768Exit?.kind, "exit-report");
  assert.equal(g05S768Exit?.verified, true);
  assert.equal(hashEvidenceArtifact(g05S768Exit.uri), g05S768Exit.sha256);
  assert.ok(board.workItems.find((entry) => entry.id === "G05-T02")?.evidenceRefs.includes(g05S768Exit.id));
  assert.ok(g05?.evidenceRefs.includes(g05S768Exit.id));
  assert.equal(g05S769Start?.uri, "docs/research/epic18/S769-T02-sample-qa-revision-binding/start-packet.md");
  assert.equal(g05S769Start?.kind, "document");
  assert.equal(g05S769Start?.verified, true);
  assert.equal(hashEvidenceArtifact(g05S769Start.uri), g05S769Start.sha256);
  assert.ok(board.workItems.find((entry) => entry.id === "G05-T02")?.evidenceRefs.includes(g05S769Start.id));
  assert.equal(g05S769Exit?.uri, "docs/research/epic18/S769-T02-sample-qa-revision-binding/exit-packet.md");
  assert.equal(g05S769Exit?.kind, "exit-report");
  assert.equal(g05S769Exit?.verified, true);
  assert.equal(hashEvidenceArtifact(g05S769Exit.uri), g05S769Exit.sha256);
  assert.ok(board.workItems.find((entry) => entry.id === "G05-T02")?.evidenceRefs.includes(g05S769Exit.id));
  assert.ok(g05?.evidenceRefs.includes(g05S769Exit.id));
  assert.equal(g05S770Start?.uri, "docs/research/epic18/S770-T02-callout-size-run-validation/start-packet.md");
  assert.equal(g05S770Start?.kind, "document");
  assert.equal(g05S770Start?.verified, true);
  assert.equal(hashEvidenceArtifact(g05S770Start.uri), g05S770Start.sha256);
  assert.ok(board.workItems.find((entry) => entry.id === "G05-T02")?.evidenceRefs.includes(g05S770Start.id));
  assert.ok(g05?.evidenceRefs.includes(g05S770Start.id));
  assert.equal(g05S770Exit?.uri, "docs/research/epic18/S770-T02-callout-size-run-validation/exit-packet.md");
  assert.equal(g05S770Exit?.kind, "exit-report");
  assert.equal(g05S770Exit?.verified, true);
  assert.equal(hashEvidenceArtifact(g05S770Exit.uri), g05S770Exit.sha256);
  const g05T02 = board.workItems.find((entry) => entry.id === "G05-T02");
  assert.ok(g05T02?.evidenceRefs.includes(g05S770Exit.id));
  assert.ok(g05T02?.statusHistory.some((entry) => entry.status === "Done" && entry.evidenceRefs.includes(g05S770Exit.id)));
  assert.ok(g05?.evidenceRefs.includes(g05S770Exit.id));
  assert.equal(g05S770Replay?.uri, "docs/research/epic18/S770-T02-callout-size-run-validation/post-replay-verification.md");
  assert.equal(g05S770Replay?.verified, true);
  assert.equal(hashEvidenceArtifact(g05S770Replay.uri), g05S770Replay.sha256);
  assert.ok(g05T02?.evidenceRefs.includes(g05S770Replay.id));
  assert.ok(g05?.evidenceRefs.includes(g05S770Replay.id));
  assert.deepEqual(g05Children.map((entry) => entry.id), [
    "EPIC-18", "UIQ-10", "G05-T01", "G05-T02", "G05-T03", "G05-T04", "G05-T05", "G05-EXIT",
  ]);
  assert.equal(board.workItems.find((entry) => entry.id === "G05-T01")?.status, "Done");
  assert.equal(board.workItems.find((entry) => entry.id === "G05-T02")?.status, "Done");
  assert.ok(["G05-T03", "G05-T04", "G05-T05", "G05-EXIT", "UIQ-10"]
    .every((id) => board.workItems.find((entry) => entry.id === id)?.status === "Backlog"));
  assert.deepEqual(board.workItems.find((entry) => entry.id === "UIQ-10")?.dependencies,
    ["EPIC-17", "G05-T01", "G05-T02", "G05-T03"]);
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
