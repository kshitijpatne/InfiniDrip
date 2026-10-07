import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const commands = JSON.parse(await readFile(new URL("S432-exit-board-commands.json", folder), "utf8"));
const boardUrl = new URL("../../../../ops/control-center/data/board.json", folder);
for (const command of commands) {
  const current = JSON.parse(await readFile(boardUrl, "utf8"));
  if (command.expectedRevision !== current.revision) throw new Error(`Expected revision ${command.expectedRevision}; found ${current.revision}`);
  await executeBoardCommand(command);
}
const board = JSON.parse(await readFile(boardUrl, "utf8"));
const result = { revision: board.revision, epicStatus: board.epics.find(({ id }) => id === "EPIC-17").status,
  v01Status: board.workItems.find(({ id }) => id === "G04-V01").status,
  v02Status: board.workItems.find(({ id }) => id === "G04-V02").status,
  v03Status: board.workItems.find(({ id }) => id === "G04-V03").status,
  exitEvidenceLinked: board.workItems.find(({ id }) => id === "G04-V02").evidenceRefs.includes("E-G04-S432-EXIT") };
if (result.revision !== 2558 || result.epicStatus !== "In Progress" || result.v01Status !== "Done"
  || result.v02Status !== "In Progress" || result.v03Status !== "Backlog" || !result.exitEvidenceLinked) {
  throw new Error(`S432 exit board replay failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S432-exit-board-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
