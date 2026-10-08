import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const command = JSON.parse(await readFile(new URL("./S460-summary-command.json", import.meta.url), "utf8"));
const initial = await readBoardFile(DEFAULT_BOARD_PATH);
const preview = applyBoardCommand(initial, command);
const result = {
  startRevision: initial.revision,
  exitRevision: preview.revision,
  epicSummary: preview.workItems.find((item) => item.id === "EPIC-17").description,
  command
};
await writeFile(new URL("./S460-summary-preflight.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ startRevision: result.startRevision, exitRevision: result.exitRevision }, null, 2));
