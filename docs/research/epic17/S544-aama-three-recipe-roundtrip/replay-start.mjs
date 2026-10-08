import { readFile } from "node:fs/promises";
import { executeBoardCommand, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

for (const name of ["S544-start-add-evidence.json", "S544-start-add-comment.json"]) {
  const command = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8"));
  const current = await readBoardFile();
  if (command.expectedRevision !== current.revision) throw new Error(`Expected ${command.expectedRevision}, got ${current.revision}`);
  const board = await executeBoardCommand(command);
  console.log(`${command.type}: ${board.revision}`);
}
