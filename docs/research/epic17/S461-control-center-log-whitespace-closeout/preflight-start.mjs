import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { DEFAULT_BOARD_PATH, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S461-start-board-commands.json", import.meta.url), "utf8"));
let preview = await readBoardFile(DEFAULT_BOARD_PATH);
const startRevision = preview.revision;
for (const command of commands) preview = applyBoardCommand(preview, command);
const result = { startRevision, exitRevision: preview.revision, v03Status: preview.workItems.find((item) => item.id === "G04-V03")?.status, commands };
await writeFile(new URL("./S461-start-preflight.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ startRevision, exitRevision: preview.revision, v03Status: result.v03Status }, null, 2));
