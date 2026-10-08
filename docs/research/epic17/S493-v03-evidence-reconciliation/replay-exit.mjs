import { readFile } from "node:fs/promises";
import { executeBoardCommand, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S493-exit-board-commands.json", import.meta.url), "utf8"));
let board = await readBoardFile();
for (const command of commands) {
  if (command.expectedRevision !== board.revision) {
    throw new Error(`Expected revision ${command.expectedRevision}, current ${board.revision}`);
  }
  board = await executeBoardCommand(command);
  console.log(`${command.type}: ${board.revision}`);
}
console.log(JSON.stringify({ finalRevision: board.revision }, null, 2));
