import { readFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

for (const name of ["S487-start-board-command.json", "S487-start-comment-command.json"]) {
  const command = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8"));
  const board = await executeBoardCommand(command);
  console.log(`${command.type}: revision ${board.revision}`);
}
