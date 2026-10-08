import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S474-start-board-commands.json", import.meta.url), "utf8"));
let board = await readBoardFile(DEFAULT_BOARD_PATH);
const startRevision = board.revision;
for (const command of commands) board = applyBoardCommand(board, command);
const result = {
  startRevision,
  exitRevision: board.revision,
  epicStatus: board.epics.find((item) => item.id === "EPIC-17")?.status,
  v03Status: board.workItems.find((item) => item.id === "G04-V03")?.status,
};
if (startRevision !== 2919 || result.exitRevision !== 2923 || result.epicStatus !== "In Progress" || result.v03Status !== "In Progress") {
  throw new Error(`Unexpected S474 start board preflight: ${JSON.stringify(result)}`);
}
await writeFile(new URL("./S474-start-preflight.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
