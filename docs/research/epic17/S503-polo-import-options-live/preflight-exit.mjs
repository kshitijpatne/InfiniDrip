import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const start = JSON.parse(await readFile(new URL("./S503-start-board-commands.json", import.meta.url), "utf8"));
const exit = JSON.parse(await readFile(new URL("./S503-exit-board-commands.json", import.meta.url), "utf8"));
let projected = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const command of [...start, ...exit]) {
  assert.equal(command.expectedRevision, projected.revision);
  projected = applyBoardCommand(projected, command);
}
assert.equal(projected.revision, 3129);
assert.equal(projected.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(projected.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
console.log(`S503 exit preflight passed at projected board revision ${projected.revision}; no file written.`);
