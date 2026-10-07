import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
const commands = JSON.parse(await readFile(new URL("S435-start-board-commands.json", folder), "utf8"));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; candidate is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T19:30:37.000Z" });
}
const work = (id) => candidate.workItems.find((item) => item.id === id);
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  epicStatus: candidate.epics.find(({ id }) => id === "EPIC-17").status,
  v01Status: work("G04-V01").status, v02Status: work("G04-V02").status, v03Status: work("G04-V03").status,
  startEvidenceLinked: work("G04-V02").evidenceRefs.includes("E-G04-S435-START"),
  statusesUnchanged: board.epics.every((item) => candidate.epics.find((next) => next.id === item.id)?.status === item.status)
    && board.workItems.every((item) => candidate.workItems.find((next) => next.id === item.id)?.status === item.status) };
if (result.sourceRevision !== 2588 || result.resultingRevision !== 2591 || result.epicStatus !== "In Progress"
  || result.v01Status !== "Done" || result.v02Status !== "In Progress" || result.v03Status !== "Backlog"
  || !result.startEvidenceLinked || !result.statusesUnchanged) throw new Error(`S435 start preflight failed: ${JSON.stringify(result)}`);
await writeFile(new URL("S435-start-preflight.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
