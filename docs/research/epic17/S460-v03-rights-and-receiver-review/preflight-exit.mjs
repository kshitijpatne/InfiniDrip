import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S460-exit-board-commands.json", import.meta.url), "utf8"));
let preview = await readBoardFile(DEFAULT_BOARD_PATH);
const startRevision = preview.revision;
for (const command of commands) preview = applyBoardCommand(preview, command);
const result = {
  startRevision,
  exitRevision: preview.revision,
  epicStatus: preview.epics.find((item) => item.id === "EPIC-17")?.status,
  workStatus: preview.workItems.find((item) => item.id === "G04-V03")?.status,
  evidenceIds: ["E-G04-S460-EXIT", "E-G04-S460-SOURCE-CONTRACT", "E-EPIC17-S460-EXIT"],
  commands
};
await writeFile(new URL("./S460-exit-preflight.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ startRevision, exitRevision: preview.revision, epicStatus: result.epicStatus, workStatus: result.workStatus }, null, 2));
