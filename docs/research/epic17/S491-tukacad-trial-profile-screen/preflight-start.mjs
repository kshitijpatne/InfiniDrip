import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S491-start-board-commands.json", import.meta.url), "utf8"));
let board = await readBoardFile();
for (const command of commands) {
  if (command.expectedRevision !== board.revision) {
    throw new Error(`Expected revision ${command.expectedRevision}, current ${board.revision}`);
  }
  board = applyBoardCommand(board, command);
  console.log(`${command.type}: ${board.revision}`);
}
console.log(JSON.stringify({ finalRevision: board.revision, epic: board.epics.find((item) => item.id === "EPIC-17")?.status, v03: board.workItems.find((item) => item.id === "G04-V03")?.status }, null, 2));
