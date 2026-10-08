import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, executeBoardCommand, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S459-start-board-commands.json", import.meta.url), "utf8"));
let preview = await readBoardFile(DEFAULT_BOARD_PATH);
for (const command of commands) preview = applyBoardCommand(preview, command);
for (const command of commands) {
  const saved = await executeBoardCommand(command, { boardPath: DEFAULT_BOARD_PATH });
  console.log(`${command.type}: revision ${saved.revision}`);
}
