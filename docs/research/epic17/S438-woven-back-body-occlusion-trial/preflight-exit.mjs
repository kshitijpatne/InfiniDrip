import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8" }));
const start = JSON.parse(await readFile(new URL("S438-start-board-commands.json", folder), "utf8"));
const exit = JSON.parse(await readFile(new URL("S438-exit-board-commands.json", folder), "utf8"));
let candidate = structuredClone(board);
for (const command of [...start, ...exit]) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; candidate is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T20:11:39.000Z" });
}
const item = (id) => candidate.workItems.find(({ id: value }) => value === id);
const epic = candidate.epics.find(({ id }) => id === "EPIC-17");
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  statusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status)
    && board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
  tallyPreserved: item("EPIC-17").description.includes("56 accepted / 90 held"),
  evidenceLinked: ["E-G04-S438-EXIT", "E-G04-S438-MATRIX"].every((id) => item("G04-V02").evidenceRefs.includes(id) && epic.evidenceRefs.includes(id)),
  exitCommentRecorded: item("G04-V02").comments.some((entry) => entry.text.includes("S438 rejects the body-fill mask trial")),
  statuses: { epic: epic.status, v01: item("G04-V01").status, v02: item("G04-V02").status, v03: item("G04-V03").status },
};
if (result.sourceRevision !== 2613 || result.resultingRevision !== 2622 || !result.statusesUnchanged
  || !result.tallyPreserved || !result.evidenceLinked || !result.exitCommentRecorded
  || result.statuses.epic !== "In Progress" || result.statuses.v01 !== "Done"
  || result.statuses.v02 !== "In Progress" || result.statuses.v03 !== "Backlog") {
  throw new Error(`S438 exit preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S438-exit-preflight.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
