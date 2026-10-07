import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const commands = JSON.parse(await readFile(new URL("S435-exit-board-commands.json", folder), "utf8"));
for (const command of commands) {
  const board = JSON.parse(await readFile(boardPath, "utf8"));
  if (command.expectedRevision !== board.revision) throw new Error(`Expected ${command.expectedRevision}; found ${board.revision}`);
  await executeBoardCommand(command);
}
const board = JSON.parse(await readFile(boardPath, "utf8"));
const work = (id) => board.workItems.find(({ id: candidate }) => candidate === id);
const epic = board.epics.find(({ id }) => id === "EPIC-17");
const result = { revision: board.revision, epicStatus: epic.status,
  v01Status: work("G04-V01").status, v02Status: work("G04-V02").status, v03Status: work("G04-V03").status,
  evidenceLinked: work("G04-V02").evidenceRefs.includes("E-G04-S435-EXIT") && epic.evidenceRefs.includes("E-G04-S435-EXIT"),
  staleJConflictRemoved: !epic.description.includes("34 J glyph conflicts across 17 options"),
  currentMatrixSummary: work("G04-V02").description.includes("zero measured label/marker/schedule overlaps"),
  statusesUnchanged: epic.status === "In Progress" && work("G04-V01").status === "Done"
    && work("G04-V02").status === "In Progress" && work("G04-V03").status === "Backlog" };
if (result.revision !== 2596 || !result.evidenceLinked || !result.staleJConflictRemoved || !result.currentMatrixSummary || !result.statusesUnchanged) {
  throw new Error(`S435 exit replay failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S435-exit-board-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
