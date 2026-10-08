import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S472-exit-board-commands.json", import.meta.url), "utf8"));
let board = await readBoardFile(DEFAULT_BOARD_PATH);
const startRevision = board.revision;
for (const command of commands) board = applyBoardCommand(board, command);
const result = {
  startRevision,
  exitRevision: board.revision,
  epicStatus: board.epics.find((x) => x.id === "EPIC-17")?.status,
  workItems: board.workItems.filter((x) => ["G04-V01", "G04-V02", "G04-V03"].includes(x.id)).map(({ id, status }) => ({ id, status })),
  commandCount: commands.length,
};
if (result.startRevision !== 2907 || result.exitRevision !== 2911 || result.epicStatus !== "In Progress" || result.workItems.find((x) => x.id === "G04-V03")?.status !== "In Progress") {
  throw new Error(`Unexpected S472 board preflight: ${JSON.stringify(result)}`);
}
await writeFile(new URL("./S472-exit-preflight.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
