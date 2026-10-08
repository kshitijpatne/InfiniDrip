import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S476-start-board-commands.json", import.meta.url), "utf8"));
const board = await readBoardFile(DEFAULT_BOARD_PATH);
let next = board;
for (const command of commands) next = applyBoardCommand(next, command);
const result = {
  startRevision: board.revision,
  exitRevision: next.revision,
  epicStatus: next.epics.find((item) => item.id === "EPIC-17")?.status,
  v03Status: next.workItems.find((item) => item.id === "G04-V03")?.status,
};
if (result.startRevision !== 2935 || result.exitRevision !== 2939 || result.epicStatus !== "In Progress" || result.v03Status !== "In Progress") {
  throw new Error(`Unexpected S476 start board preflight: ${JSON.stringify(result)}`);
}
await writeFile(new URL("./S476-start-preflight.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
