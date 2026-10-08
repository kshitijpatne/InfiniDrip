import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S493-exit-board-commands.json", import.meta.url), "utf8"));
let board = await readBoardFile();
for (const command of commands) {
  if (command.expectedRevision !== board.revision) {
    throw new Error(`Expected revision ${command.expectedRevision}, current ${board.revision}`);
  }
  board = applyBoardCommand(board, command);
}
if (board.revision !== 3071) throw new Error(`Unexpected exit revision ${board.revision}`);
const epic = board.epics.find((item) => item.id === "EPIC-17");
const v03 = board.workItems.find((item) => item.id === "G04-V03");
if (epic?.status !== "In Progress" || v03?.status !== "In Progress") {
  throw new Error("S493 must preserve EPIC-17 and G04-V03 status");
}
for (const id of ["E-G04-S493-MATRIX", "E-G04-S493-EXIT"]) {
  if (!board.evidence.some((item) => item.id === id)) throw new Error(`Missing evidence ${id}`);
  if (!v03.evidenceRefs.includes(id)) throw new Error(`G04-V03 not linked to ${id}`);
}
if (!epic.evidenceRefs.includes("E-G04-S493-EXIT")) throw new Error("Epic exit evidence is not linked");
console.log(JSON.stringify({ revision: board.revision, epic: epic.status, v03: v03.status }, null, 2));
