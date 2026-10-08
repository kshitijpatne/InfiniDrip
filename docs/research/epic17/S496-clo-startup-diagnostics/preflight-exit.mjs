import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S496-exit-board-commands.json", import.meta.url), "utf8"));
let board = await readBoardFile();
for (const command of commands) {
  if (command.expectedRevision !== board.revision) throw new Error(`Expected ${command.expectedRevision}, got ${board.revision}`);
  board = applyBoardCommand(board, command);
}
if (board.revision !== 3089) throw new Error(`Unexpected exit revision ${board.revision}`);
const epic = board.epics.find((item) => item.id === "EPIC-17");
const v03 = board.workItems.find((item) => item.id === "G04-V03");
if (epic?.status !== "In Progress" || v03?.status !== "In Progress") throw new Error("S496 must preserve Epic/V03 status");
if (!epic.evidenceRefs.includes("E-G04-S496-EXIT") || !v03.evidenceRefs.includes("E-G04-S496-EXIT")) throw new Error("S496 exit evidence is not linked");
console.log(JSON.stringify({ revision: board.revision, epic: epic.status, v03: v03.status }, null, 2));
