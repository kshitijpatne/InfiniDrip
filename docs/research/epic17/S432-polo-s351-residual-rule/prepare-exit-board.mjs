import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const board = JSON.parse(await readFile(boardPath, "utf8"));
if (board.revision !== 2552) throw new Error(`Expected S432 start board 2552; found ${board.revision}`);
const v02 = board.workItems.find(({ id }) => id === "G04-V02");
const epic = board.epics.find(({ id }) => id === "EPIC-17");
const oldResidual = "The 0.68 cm residual remains above the fixed 0.25 cm gate.";
const newResidual = "S432 applies the approved endpoint-residual exception only to the exact validated Polo S351 Sleeve-cap ease representation; 0.25 cm remains for every other relation.";
const v02Description = v02.description.replace(oldResidual, newResidual)
  + " S432 replayed all 17 Polo options/34 faces: no S351 residual issue remains, but all 17 fronts fail the finished-collar-stand-height and stand-front-rise POM label/leader layout, and all 17 backs fail closed colorway rendering for the sleeve outline. Back linework-only diagnostics were rendered and inspected; this is not final output acceptance. All 34 Polo and 56 Woven views remain held. Current packet: docs/research/epic17/S432-polo-s351-residual-rule/G04-V02-POLO-S351-EASE-RESIDUAL-RULE-S432.md";
if (v02Description === v02.description) throw new Error("Expected residual statement was not found in V02 board description");
const epicDescription = epic.description + " S432 implements the approved Polo S351 endpoint-residual applicability rule only for its exact validated same-revision eased-cap display; the numeric 0.25 cm limit remains for all other relations. Polo has 17/17 front POM layout failures and 17/17 back sleeve colorway-contour failures, so all 34 Polo faces remain held. Woven's 56 holds remain. V02 all-seven acceptance and V03 rights/round-trip gates are unchanged.";
const commands = [
  { type: "editItem", expectedRevision: 2552, itemId: "G04-V02", patch: { description: v02Description } },
  { type: "editEpic", expectedRevision: 2553, actor: "Codex", role: "maintainer", reason: "Update the canonical Epic summary from the S432 verified output replay without changing scope or status.", epicId: "EPIC-17", patch: { description: epicDescription } },
  { type: "addEvidence", expectedRevision: 2554, itemId: "G04-V02", evidence: {
    id: "E-G04-S432-EXIT", kind: "document", uri: "docs/research/epic17/S432-polo-s351-residual-rule/G04-V02-POLO-S351-EASE-RESIDUAL-RULE-S432.md",
    verified: true, note: "Implements the approved exact Polo S351 endpoint-residual applicability rule; replays 17 options/34 faces, records remaining POM/colorway blockers, and preserves every hold and G04 gate."
  } },
  { type: "addEpicEvidence", expectedRevision: 2555, actor: "Codex", role: "maintainer", epicId: "EPIC-17", evidenceId: "E-G04-S432-EXIT" },
  { type: "addComment", expectedRevision: 2556, itemId: "G04-V02", actor: "Codex", text: "S432 applies the approved S351-only residual applicability rule. All 17 Polo fronts remain held for two POM label/leader placements; all 17 backs remain held for the unclosed sleeve colorway contour. Back linework-only render is diagnostic and not a passing colorway output. All 34 Polo and 56 Woven views remain held; V02 acceptance and V03 gates are unchanged." },
  { type: "addComment", expectedRevision: 2557, itemId: "EPIC-17", actor: "Codex", text: "S432 closes with the approved narrow Polo residual rule implemented and independently failing POM/colorway output gates recorded. No face was accepted. Continue V02; do not start V03 until all-seven V02 and V03 rights/round-trip prerequisites pass." },
];
let candidate = structuredClone(board);
for (const command of commands) candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T18:11:00.000Z" });
if (candidate.revision !== 2558) throw new Error(`Unexpected resulting board revision ${candidate.revision}`);
const v02After = candidate.workItems.find(({ id }) => id === "G04-V02");
const checks = {
  sourceRevision: board.revision,
  resultingRevision: candidate.revision,
  epicStatus: candidate.epics.find(({ id }) => id === "EPIC-17").status,
  v01Status: candidate.workItems.find(({ id }) => id === "G04-V01").status,
  v02Status: v02After.status,
  v03Status: candidate.workItems.find(({ id }) => id === "G04-V03").status,
  exitEvidenceLinked: v02After.evidenceRefs.includes("E-G04-S432-EXIT"),
  wovenAndPoloHoldsRecorded: v02After.description.includes("All 34 Polo and 56 Woven views remain held."),
};
if (checks.epicStatus !== "In Progress" || checks.v01Status !== "Done" || checks.v02Status !== "In Progress"
  || checks.v03Status !== "Backlog" || !checks.exitEvidenceLinked || !checks.wovenAndPoloHoldsRecorded) {
  throw new Error(`S432 board preflight failed: ${JSON.stringify(checks)}`);
}
await writeFile(new URL("./S432-exit-board-commands.json", import.meta.url), `${JSON.stringify(commands, null, 2)}\n`);
await writeFile(new URL("./S432-exit-preflight.json", import.meta.url), `${JSON.stringify(checks, null, 2)}\n`);
console.log(JSON.stringify(checks));
