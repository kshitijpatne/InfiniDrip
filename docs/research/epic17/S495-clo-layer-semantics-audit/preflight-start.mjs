import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S495-start-board-commands.json", import.meta.url), "utf8"));
let board = await readBoardFile();
for (const command of commands) {
  if (command.expectedRevision !== board.revision) throw new Error(`Expected ${command.expectedRevision}, got ${board.revision}`);
  board = applyBoardCommand(board, command);
}
if (board.revision !== 3079) throw new Error(`Unexpected revision ${board.revision}`);
if (board.epics.find((item) => item.id === "EPIC-17")?.status !== "In Progress") throw new Error("Epic status changed");
if (board.workItems.find((item) => item.id === "G04-V03")?.status !== "In Progress") throw new Error("V03 status changed");
console.log(JSON.stringify({ revision: board.revision, epic: "In Progress", v03: "In Progress" }, null, 2));
