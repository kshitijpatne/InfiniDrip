import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const commands = JSON.parse(await readFile(new URL("S434-exit-board-commands.json", folder), "utf8"));
let board = JSON.parse(await readFile(boardPath, "utf8"));
for (const command of commands) {
  board = JSON.parse(await readFile(boardPath, "utf8"));
  if (command.expectedRevision !== board.revision) throw new Error(`Expected revision ${command.expectedRevision}; found ${board.revision}`);
  await executeBoardCommand(command);
}
board = JSON.parse(await readFile(boardPath, "utf8"));
const epic = board.epics.find(({ id }) => id === "EPIC-17");
const work = (id) => board.workItems.find((item) => item.id === id);
const result = { revision: board.revision, epicStatus: epic.status,
  v01Status: work("G04-V01").status, v02Status: work("G04-V02").status, v03Status: work("G04-V03").status,
  exitLinkedToEpic: epic.evidenceRefs.includes("E-G04-S434-EXIT"),
  exitLinkedToV02: work("G04-V02").evidenceRefs.includes("E-G04-S434-EXIT") };
if (result.revision !== 2583 || result.epicStatus !== "In Progress" || result.v01Status !== "Done"
  || result.v02Status !== "In Progress" || result.v03Status !== "Backlog"
  || !result.exitLinkedToEpic || !result.exitLinkedToV02) throw new Error(`S434 exit replay failed: ${JSON.stringify(result)}`);
await writeFile(new URL("S434-exit-board-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
