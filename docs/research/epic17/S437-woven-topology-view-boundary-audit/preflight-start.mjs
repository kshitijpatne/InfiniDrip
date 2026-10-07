import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
const commands = JSON.parse(await readFile(new URL("S437-start-board-commands.json", folder), "utf8"));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; candidate is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T19:58:26.000Z" });
}
const work = candidate.workItems.find(({ id }) => id === "G04-V02");
const epic = candidate.workItems.find(({ id }) => id === "EPIC-17");
const result = {
  sourceRevision: board.revision,
  resultingRevision: candidate.revision,
  statusesUnchanged: board.epics.every((item) => candidate.epics.find((next) => next.id === item.id)?.status === item.status)
    && board.workItems.every((item) => candidate.workItems.find((next) => next.id === item.id)?.status === item.status),
  tallyUnchanged: epic.description.includes("56 accepted / 90 held"),
  startEvidenceLinked: work.evidenceRefs.includes("E-G04-S437-START"),
  faceStatusUnchanged: work.status === "In Progress",
};
if (result.sourceRevision !== 2604 || result.resultingRevision !== 2607 || !result.statusesUnchanged
  || !result.tallyUnchanged || !result.startEvidenceLinked || !result.faceStatusUnchanged) {
  throw new Error(`S437 start preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S437-start-preflight.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
