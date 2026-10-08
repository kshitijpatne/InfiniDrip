import { readFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const command = JSON.parse(await readFile(new URL("./S486-next-step-board-command.json", import.meta.url), "utf8"));
const board = await executeBoardCommand(command);
console.log(`${command.type}: revision ${board.revision}`);
