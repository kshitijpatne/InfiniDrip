import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S480-exit-board-commands.json", import.meta.url), "utf8"));
const board = await readBoardFile(DEFAULT_BOARD_PATH);
let next = board;
for (const command of commands) next = applyBoardCommand(next, command);
const result = {
  startRevision: board.revision,
  exitRevision: next.revision,
  epicStatus: next.epics.find((item) => item.id === "EPIC-17")?.status,
  v03Status: next.workItems.find((item) => item.id === "G04-V03")?.status,
  exitEvidenceId: next.workItems.find((item) => item.id === "G04-V03")?.evidenceRefs?.at(-1),
};
if (result.startRevision !== 2971 || result.exitRevision !== 2975 || result.epicStatus !== "In Progress" || result.v03Status !== "In Progress" || result.exitEvidenceId !== "E-G04-S480-EXIT") {
  throw new Error(`Unexpected S480 exit board preflight: ${JSON.stringify(result)}`);
}
await writeFile(new URL("./S480-exit-preflight.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
