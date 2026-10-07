import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const commands = JSON.parse(await readFile(new URL("S436-exit-board-commands.json", folder), "utf8"));
for (const command of commands) {
  const board = JSON.parse(await readFile(boardPath, "utf8"));
  if (command.expectedRevision !== board.revision) throw new Error(`Expected ${command.expectedRevision}; found ${board.revision}`);
  await executeBoardCommand(command);
}
const board = JSON.parse(await readFile(boardPath, "utf8"));
const work = (id) => board.workItems.find(({ id: value }) => id === value);
const epic = board.epics.find(({ id }) => id === "EPIC-17");
const result = { revision: board.revision, statuses: { epic: epic.status, v01: work("G04-V01").status,
  v02: work("G04-V02").status, v03: work("G04-V03").status },
  evidenceLinked: ["E-G04-S436-EXIT", "E-G04-S436-MATRIX"].every((id) => work("G04-V02").evidenceRefs.includes(id) && epic.evidenceRefs.includes(id)),
  tallyPreserved: epic.description.includes("56 accepted / 90 held"),
  poloFacesStillHeld: work("G04-V02").comments.at(-1)?.text.includes("All 34 Polo faces remain held") };
if (result.revision !== 2604 || result.statuses.epic !== "In Progress" || result.statuses.v01 !== "Done"
  || result.statuses.v02 !== "In Progress" || result.statuses.v03 !== "Backlog" || !result.evidenceLinked
  || !result.tallyPreserved || !result.poloFacesStillHeld) throw new Error(`S436 exit replay failed: ${JSON.stringify(result)}`);
await writeFile(new URL("S436-exit-board-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
