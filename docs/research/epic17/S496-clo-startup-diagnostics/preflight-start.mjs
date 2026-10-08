import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S496-start-board-commands.json", import.meta.url), "utf8"));
let board = await readBoardFile();
for (const command of commands) {
  if (command.expectedRevision !== board.revision) throw new Error(`Expected ${command.expectedRevision}, got ${board.revision}`);
  board = applyBoardCommand(board, command);
}
if (board.revision !== 3085) throw new Error(`Unexpected start revision ${board.revision}`);
const epic = board.epics.find((item) => item.id === "EPIC-17");
const v03 = board.workItems.find((item) => item.id === "G04-V03");
if (epic?.status !== "In Progress" || v03?.status !== "In Progress") throw new Error("S496 start must preserve active status");
console.log(JSON.stringify({ revision: board.revision, epic: epic.status, v03: v03.status }, null, 2));
