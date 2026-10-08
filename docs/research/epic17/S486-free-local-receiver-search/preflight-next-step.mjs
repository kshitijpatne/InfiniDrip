import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const command = JSON.parse(await readFile(new URL("./S486-next-step-board-command.json", import.meta.url), "utf8"));
const board = await readBoardFile(DEFAULT_BOARD_PATH);
const next = applyBoardCommand(board, command);
const result = {
  startRevision: board.revision,
  exitRevision: next.revision,
  epicStatus: next.epics.find((item) => item.id === "EPIC-17")?.status,
  v03Status: next.workItems.find((item) => item.id === "G04-V03")?.status,
};
if (result.startRevision !== 3024 || result.exitRevision !== 3025 || result.epicStatus !== "In Progress" || result.v03Status !== "In Progress") {
  throw new Error(`Unexpected S486 next-step preflight: ${JSON.stringify(result)}`);
}
await writeFile(new URL("./S486-next-step-preflight.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
