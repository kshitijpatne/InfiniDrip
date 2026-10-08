import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { validateBoard } from "../../../../ops/control-center/board-core.mjs";

const root = "C:/G04-CLO-DXF-Exchange";
const auditRoot = `${root}/S525-clo-semantic-layer-audit`;
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const auditBytes = await readFile(`${auditRoot}/Evidence/semantic-layer-audit.json`);
assert.equal(digest(auditBytes), "a6aefa5e4df4a7a2236792dcac05be6e4702430a509b3a414497f8e385dfa3df");
const audit = JSON.parse(auditBytes.toString("utf8"));
assert.equal(audit.summary.recipes, 7);
assert.equal(audit.summary.recipesWithUniquePieceIdentity, 7);
assert.equal(audit.summary.uniqueSewIdentityPieces, 41);
assert.equal(audit.summary.mixedSemanticLayerCount, 14);
assert.equal(audit.summary.sourceEntitiesWithoutDirectGeometryMatch, 83);
assert.deepEqual(audit.recipes.filter(({ recipe }) => ["tee", "polo", "woven-shirt"].includes(recipe)).map(({ observedExportFormat }) => observedExportFormat), ["DXF-ASTM", "DXF-ASTM", "DXF-ASTM"]);
assert.deepEqual(audit.recipes.filter(({ recipe }) => ["fitted", "tank", "trouser", "skirt"].includes(recipe)).map(({ observedExportFormat }) => observedExportFormat), ["DXF-AAMA", "DXF-AAMA", "DXF-AAMA", "DXF-AAMA"]);
for (const recipe of audit.recipes) {
  assert.equal(recipe.totals.uniquePieceIdentity, true, `${recipe.recipe}: unique piece identity`);
  assert.ok(recipe.outputLayerMap.some(({ layer, sourceSemantics }) => layer === "8" && sourceSemantics.CUT && sourceSemantics.SEW), `${recipe.recipe}: layer 8 remains semantically mixed`);
  const output = await readFile(recipe.receiverFile);
  assert.equal(digest(output), recipe.receiverSha256, `${recipe.recipe}: pinned receiver hash`);
}
const polo = audit.recipes.find(({ recipe }) => recipe === "polo");
assert.equal(polo.sourceSemanticCoverage.find(({ sourceLayer, sourceType }) => sourceLayer === "CUT" && sourceType === "POLYLINE").missingCount, 5);
const starts = JSON.parse(await readFile(new URL("./S525-start-board-commands.json", import.meta.url), "utf8"));
const exits = JSON.parse(await readFile(new URL("./S525-exit-board-commands.json", import.meta.url), "utf8"));
let board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
for (const [label, commands] of [["start", starts], ["exit", exits]]) for (const command of commands) {
  if (command.expectedRevision !== undefined) assert.equal(command.expectedRevision, board.revision, `${label} expected revision`);
  board = applyBoardCommand(board, command);
}
assert.equal(board.revision, 3215);
assert.equal(validateBoard(board).valid, true);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
console.log("S525 source-match summary, all seven receiver hashes, and start+exit board replay pass at revision 3215.");
