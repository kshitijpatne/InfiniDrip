import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const commands = JSON.parse(await readFile(new URL("S436-start-board-commands.json", folder), "utf8"));
for (const command of commands) {
  const board = JSON.parse(await readFile(boardPath, "utf8"));
  if (command.expectedRevision !== board.revision) throw new Error(`Expected ${command.expectedRevision}; found ${board.revision}`);
  await executeBoardCommand(command);
}
const board = JSON.parse(await readFile(boardPath, "utf8"));
const work = (id) => board.workItems.find(({ id: candidate }) => candidate === id);
const result = { revision: board.revision, epicStatus: board.epics.find(({ id }) => id === "EPIC-17").status,
  v02Status: work("G04-V02").status, v01Status: work("G04-V01").status, v03Status: work("G04-V03").status,
  startEvidenceLinked: work("G04-V02").evidenceRefs.includes("E-G04-S436-START") };
if (result.revision !== 2599 || result.epicStatus !== "In Progress" || result.v02Status !== "In Progress"
  || result.v01Status !== "Done" || result.v03Status !== "Backlog" || !result.startEvidenceLinked) {
  throw new Error(`S436 start replay failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S436-start-board-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
