import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const board = JSON.parse(await readFile(boardPath, "utf8"));
const commands = JSON.parse(await readFile(new URL("S433-exit-board-commands.json", folder), "utf8"));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; candidate is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T18:40:00.000Z" });
}
const epic = candidate.epics.find(({ id }) => id === "EPIC-17");
const work = (id) => candidate.workItems.find((item) => item.id === id);
const statusesUnchanged = board.epics.every((item) => candidate.epics.find((next) => next.id === item.id)?.status === item.status)
  && board.workItems.every((item) => candidate.workItems.find((next) => next.id === item.id)?.status === item.status);
const result = {
  sourceRevision: board.revision,
  resultingRevision: candidate.revision,
  epicStatus: epic.status,
  v01Status: work("G04-V01").status,
  v02Status: work("G04-V02").status,
  v03Status: work("G04-V03").status,
  exitLinkedToEpic: epic.evidenceRefs.includes("E-G04-S433-EXIT"),
  exitLinkedToV02: work("G04-V02").evidenceRefs.includes("E-G04-S433-EXIT"),
  statusesUnchanged,
  allExpectedHoldsPresent: /56 Woven/u.test(work("G04-V02").description) && /34 Polo/u.test(work("G04-V02").description),
};
if (result.sourceRevision !== 2560 || result.resultingRevision !== 2566 || result.epicStatus !== "In Progress"
  || result.v01Status !== "Done" || result.v02Status !== "In Progress" || result.v03Status !== "Backlog"
  || !result.exitLinkedToEpic || !result.exitLinkedToV02 || !result.statusesUnchanged || !result.allExpectedHoldsPresent) {
  throw new Error(`S433 exit preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S433-exit-preflight.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
