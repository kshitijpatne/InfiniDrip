import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const evidence = JSON.parse(await readFile(new URL("./S487-start-board-command.json", import.meta.url), "utf8"));
const comment = JSON.parse(await readFile(new URL("./S487-start-comment-command.json", import.meta.url), "utf8"));
const board = await readBoardFile(DEFAULT_BOARD_PATH);
const afterEvidence = applyBoardCommand(board, evidence);
const next = applyBoardCommand(afterEvidence, comment);
const result = {
  startRevision: board.revision,
  finalRevision: next.revision,
  epicStatus: next.epics.find((item) => item.id === "EPIC-17")?.status,
  v03Status: next.workItems.find((item) => item.id === "G04-V03")?.status,
};
if (result.startRevision !== 3025 || result.finalRevision !== 3027 || result.epicStatus !== "In Progress" || result.v03Status !== "In Progress") {
  throw new Error(`Unexpected S487 start preflight: ${JSON.stringify(result)}`);
}
await writeFile(new URL("./S487-start-preflight.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
