import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = "C:/G04-CLO-DXF-Exchange/S524-independent-local-aama-receiver";
const expectedRecipes = ["tee", "fitted", "polo", "woven-shirt", "tank", "trouser", "skirt"];
const manifest = JSON.parse(await readFile(`${folder}/Evidence/fixture-manifest.json`, "utf8"));
assert.deepEqual(manifest.fixtures.map(({ recipe }) => recipe), expectedRecipes);
for (const fixture of manifest.fixtures) {
  const content = await readFile(`${folder}/Input/${fixture.file}`);
  assert.equal(createHash("sha256").update(content).digest("hex"), fixture.sha256, `${fixture.recipe} fixture hash`);
  assert.equal(fixture.closedCutSewOutlineCount, fixture.pieceCount * 2, `${fixture.recipe} CUT/SEW outline count`);
}
const outputFiles = await readdir(`${folder}/Output`);
assert.deepEqual(outputFiles, [], "no Pixie export was saved");

let board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const file of ["S524-start-board-commands.json", "S524-exit-board-commands.json"]) {
  const commands = JSON.parse(await readFile(new URL(`./${file}`, import.meta.url), "utf8"));
  for (const command of commands) {
    assert.equal(command.expectedRevision, board.revision, `${file} expected revision`);
    board = applyBoardCommand(board, command);
  }
}
assert.equal(board.revision, 3211);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S524 fixture hashes/counts and start+exit board replay pass at revision 3211; Output is empty.");
