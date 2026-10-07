import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8" }));
const startCommands = JSON.parse(await readFile(new URL("S437-start-board-commands.json", folder), "utf8"));
const exitCommands = JSON.parse(await readFile(new URL("S437-exit-board-commands.json", folder), "utf8"));
let candidate = structuredClone(board);
const commands = [...startCommands, ...exitCommands];
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; candidate is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T20:03:20.000Z" });
}
const item = (id) => candidate.workItems.find(({ id: value }) => value === id);
const epic = candidate.epics.find(({ id }) => id === "EPIC-17");
const v02 = item("G04-V02");
const summary = item("EPIC-17");
const result = {
  sourceRevision: board.revision,
  resultingRevision: candidate.revision,
  statusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status)
    && board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
  tallyPreserved: summary.description.includes("56 accepted / 90 held"),
  evidenceLinked: ["E-G04-S437-TRACE", "E-G04-S437-EXIT"].every((id) => v02.evidenceRefs.includes(id) && epic.evidenceRefs.includes(id)),
  v02CommentRecorded: v02.comments.some((entry) => entry.text.includes("S437 revalidates the current exact Woven 14:14 output")),
  statuses: { epic: candidate.epics.find(({ id }) => id === "EPIC-17").status,
    v01: item("G04-V01").status, v02: v02.status, v03: item("G04-V03").status },
};
if (result.sourceRevision !== 2604 || result.resultingRevision !== 2613 || !result.statusesUnchanged
  || !result.tallyPreserved || !result.evidenceLinked || !result.v02CommentRecorded
  || result.statuses.epic !== "In Progress" || result.statuses.v01 !== "Done"
  || result.statuses.v02 !== "In Progress" || result.statuses.v03 !== "Backlog") {
  throw new Error(`S437 exit preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S437-exit-preflight.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
