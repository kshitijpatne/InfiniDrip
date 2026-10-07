import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardUrl = new URL("../../../../ops/control-center/data/board.json", folder);
const commands = JSON.parse(await readFile(new URL("S433-start-board-commands.json", folder), "utf8"));
for (const command of commands) {
  const board = JSON.parse(await readFile(boardUrl, "utf8"));
  if (command.expectedRevision !== board.revision) throw new Error(`Expected ${command.expectedRevision}; found ${board.revision}`);
  await executeBoardCommand(command);
}
const board = JSON.parse(await readFile(boardUrl, "utf8"));
const result = { revision: board.revision, v02: board.workItems.find(({ id }) => id === "G04-V02").status,
  v03: board.workItems.find(({ id }) => id === "G04-V03").status };
if (result.revision !== 2560 || result.v02 !== "In Progress" || result.v03 !== "Backlog") {
  throw new Error(`S433 start replay failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S433-start-board-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
