import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const commands = JSON.parse(await readFile(new URL("S437-start-board-commands.json", folder), "utf8"));
for (const command of commands) {
  const board = JSON.parse(await readFile(boardPath, "utf8"));
  if (command.expectedRevision !== board.revision) throw new Error(`Expected ${command.expectedRevision}; found ${board.revision}`);
  await executeBoardCommand(command);
}
const board = JSON.parse(await readFile(boardPath, "utf8"));
const work = (id) => board.workItems.find(({ id: candidate }) => candidate === id);
const result = {
  revision: board.revision,
  statuses: { epic: board.epics.find(({ id }) => id === "EPIC-17").status,
    v01: work("G04-V01").status, v02: work("G04-V02").status, v03: work("G04-V03").status },
  startEvidenceLinked: work("G04-V02").evidenceRefs.includes("E-G04-S437-START"),
  tallyPreserved: work("EPIC-17").description.includes("56 accepted / 90 held"),
};
if (result.revision !== 2607 || result.statuses.epic !== "In Progress" || result.statuses.v01 !== "Done"
  || result.statuses.v02 !== "In Progress" || result.statuses.v03 !== "Backlog"
  || !result.startEvidenceLinked || !result.tallyPreserved) throw new Error(`S437 start replay failed: ${JSON.stringify(result)}`);
await writeFile(new URL("S437-start-board-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
