import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S464-start-board-commands.json", import.meta.url), "utf8"));
let board = await readBoardFile(DEFAULT_BOARD_PATH);
const startRevision = board.revision;
for (const command of commands) board = applyBoardCommand(board, command);
const result = {
  startRevision,
  exitRevision: board.revision,
  epicStatus: board.epics.find((epic) => epic.id === "EPIC-17")?.status,
  v03Status: board.workItems.find((item) => item.id === "G04-V03")?.status,
  commands,
};
await writeFile(new URL("./S464-start-preflight.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ startRevision, exitRevision: board.revision, epicStatus: result.epicStatus, v03Status: result.v03Status }, null, 2));
