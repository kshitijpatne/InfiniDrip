import { readFile } from "node:fs/promises";
import { executeBoardCommand, readBoardFile } from "../../../../ops/control-center/board-store.mjs";
let board = await readBoardFile();
for (const name of ["S512-exit-board-commands.json"]) { const commands = JSON.parse(await readFile(new URL(`./${name}`, import.meta.url), "utf8")); for (const command of commands) { if (command.expectedRevision !== board.revision) throw new Error(`Expected ${command.expectedRevision}, got ${board.revision}`); board = await executeBoardCommand(command); console.log(`${command.type}: ${board.revision}`); } }

\n