import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8" }));
const commands = JSON.parse(await readFile(new URL("S438-start-board-commands.json", folder), "utf8"));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; candidate is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T20:07:51.000Z" });
}
const item = (id) => candidate.workItems.find(({ id: value }) => value === id);
const baseEpic = board.workItems.find(({ id }) => id === "EPIC-17");
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  statusesUnchanged: board.epics.every((entry) => candidate.epics.find((next) => next.id === entry.id)?.status === entry.status)
    && board.workItems.every((entry) => candidate.workItems.find((next) => next.id === entry.id)?.status === entry.status),
  tallyPreserved: item("EPIC-17").description.includes("56 accepted / 90 held")
    && baseEpic.description.includes("56 accepted / 90 held"),
  startEvidenceLinked: item("G04-V02").evidenceRefs.includes("E-G04-S438-START"),
};
if (result.sourceRevision !== 2613 || result.resultingRevision !== 2616 || !result.statusesUnchanged
  || !result.tallyPreserved || !result.startEvidenceLinked) throw new Error(`S438 start preflight failed: ${JSON.stringify(result)}`);
await writeFile(new URL("S438-start-preflight.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
