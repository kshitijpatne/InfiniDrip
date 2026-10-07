import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
const commands = JSON.parse(await readFile(new URL("S434-clearance-board-commands.json", folder), "utf8"));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; candidate is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T19:08:11.000Z" });
}
const epic = candidate.epics.find(({ id }) => id === "EPIC-17");
const g04 = candidate.workItems.find(({ id }) => id === "G04-V02");
const statusRows = { epic: epic.status, v01: candidate.workItems.find(({ id }) => id === "G04-V01").status,
  v02: g04.status, v03: candidate.workItems.find(({ id }) => id === "G04-V03").status };
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision, statusRows,
  exitEvidenceStillLinked: epic.evidenceRefs.includes("E-G04-S434-EXIT") && g04.evidenceRefs.includes("E-G04-S434-EXIT"),
  clearanceEvidenceLinked: epic.evidenceRefs.includes("E-G04-S434-CLEARANCE") && g04.evidenceRefs.includes("E-G04-S434-CLEARANCE"),
  allHoldsPreserved: /34 Polo/u.test(g04.description) && /56 Woven/u.test(g04.description),
  collisionFactsRecorded: /underCollar\.centerFront/u.test(g04.description) && /buttonPlacket 14, outerStand 2, front 1/u.test(g04.description),
  historicalEvidencePreserved: /S381 found no evidence supporting a false Woven back-hem gap/u.test(g04.description)
    && /S419 tested a 2–3-arc Polo H locator across 17 options/u.test(g04.description)
    && /S406's approved view-only collar-over-plackets order remains implemented/u.test(epic.description) };
if (result.sourceRevision !== 2583 || result.resultingRevision !== 2588 || statusRows.epic !== "In Progress"
  || statusRows.v01 !== "Done" || statusRows.v02 !== "In Progress" || statusRows.v03 !== "Backlog"
  || !result.exitEvidenceStillLinked || !result.clearanceEvidenceLinked || !result.allHoldsPreserved
  || !result.collisionFactsRecorded || !result.historicalEvidencePreserved) throw new Error(`S434 clearance preflight failed: ${JSON.stringify(result)}`);
await writeFile(new URL("S434-clearance-preflight.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
