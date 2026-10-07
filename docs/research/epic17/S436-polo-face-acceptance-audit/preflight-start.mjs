import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
const commands = JSON.parse(await readFile(new URL("S436-start-board-commands.json", folder), "utf8"));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; candidate is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T19:45:35.000Z" });
}
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  statusesUnchanged: board.epics.every((item) => candidate.epics.find((next) => next.id === item.id)?.status === item.status)
    && board.workItems.every((item) => candidate.workItems.find((next) => next.id === item.id)?.status === item.status),
  tallyUnchanged: candidate.workItems.find(({ id }) => id === "EPIC-17").description.includes("56 accepted / 90 held"),
  startEvidenceLinked: candidate.workItems.find(({ id }) => id === "G04-V02").evidenceRefs.includes("E-G04-S436-START") };
if (result.sourceRevision !== 2596 || result.resultingRevision !== 2599 || !result.statusesUnchanged || !result.tallyUnchanged || !result.startEvidenceLinked) {
  throw new Error(`S436 start preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S436-start-preflight.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
