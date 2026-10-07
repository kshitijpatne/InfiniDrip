import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const commands = JSON.parse(await readFile(new URL("S434-clearance-board-commands.json", folder), "utf8"));
let board = JSON.parse(await readFile(boardPath, "utf8"));
for (const command of commands) {
  board = JSON.parse(await readFile(boardPath, "utf8"));
  if (command.expectedRevision !== board.revision) throw new Error(`Expected revision ${command.expectedRevision}; found ${board.revision}`);
  await executeBoardCommand(command);
}
board = JSON.parse(await readFile(boardPath, "utf8"));
const epic = board.epics.find(({ id }) => id === "EPIC-17");
const g04 = board.workItems.find(({ id }) => id === "G04-V02");
const result = { revision: board.revision, epicStatus: epic.status,
  v01Status: board.workItems.find(({ id }) => id === "G04-V01").status, v02Status: g04.status,
  v03Status: board.workItems.find(({ id }) => id === "G04-V03").status,
  exitEvidenceLinked: epic.evidenceRefs.includes("E-G04-S434-EXIT") && g04.evidenceRefs.includes("E-G04-S434-EXIT"),
  clearanceEvidenceLinked: epic.evidenceRefs.includes("E-G04-S434-CLEARANCE") && g04.evidenceRefs.includes("E-G04-S434-CLEARANCE") };
if (result.revision !== 2588 || result.epicStatus !== "In Progress" || result.v01Status !== "Done"
  || result.v02Status !== "In Progress" || result.v03Status !== "Backlog"
  || !result.exitEvidenceLinked || !result.clearanceEvidenceLinked) throw new Error(`S434 clearance replay failed: ${JSON.stringify(result)}`);
await writeFile(new URL("S434-clearance-board-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
