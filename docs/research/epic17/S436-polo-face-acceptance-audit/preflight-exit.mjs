import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
const commands = JSON.parse(await readFile(new URL("S436-exit-board-commands.json", folder), "utf8"));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; candidate is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T19:56:00.000Z" });
}
const work = (id) => candidate.workItems.find(({ id: value }) => id === value);
const epic = candidate.epics.find(({ id }) => id === "EPIC-17");
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  statusesUnchanged: board.epics.every((item) => candidate.epics.find((next) => next.id === item.id)?.status === item.status)
    && board.workItems.every((item) => candidate.workItems.find((next) => next.id === item.id)?.status === item.status),
  evidenceLinked: ["E-G04-S436-EXIT", "E-G04-S436-MATRIX"].every((id) => work("G04-V02").evidenceRefs.includes(id) && epic.evidenceRefs.includes(id)),
  tallyPreserved: epic.description.includes("56 accepted / 90 held"),
  statuses: { epic: epic.status, v01: work("G04-V01").status, v02: work("G04-V02").status, v03: work("G04-V03").status },
  faces: "56 accepted / 90 held across 73 configurations / 146 faces" };
if (result.sourceRevision !== 2600 || result.resultingRevision !== 2604 || !result.statusesUnchanged || !result.evidenceLinked || !result.tallyPreserved) {
  throw new Error(`S436 exit preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S436-exit-preflight.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
