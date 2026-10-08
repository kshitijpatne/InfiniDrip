import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
const commands = JSON.parse(await readFile(new URL("./S503-start-board-commands.json", import.meta.url), "utf8"));
let projected = board;
for (const command of commands) {
  assert.equal(command.expectedRevision, projected.revision);
  projected = applyBoardCommand(projected, command);
}
assert.equal(projected.revision, 3127);
assert.equal(projected.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log(`S503 start preflight passed at projected board revision ${projected.revision}; no file written.`);
