import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = new URL(".", import.meta.url);
let board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
assert.equal(board.revision, 3897);
const commands = [
  {
    type: "addEvidence", itemId: "G04-V03",
    evidence: {
      id: "E-G04-S666-START", kind: "document",
      uri: "docs/research/epic17/S666-dgs-native-grainline-calibration/S666-start-packet.md",
      verified: true,
      note: "Starts one bounded C:-only DGS-native grainline calibration to identify emitted semantics; fixed geometry, 0.001 cm precision and no-permutation stop conditions. No V03 gate pre-passes.",
    },
  },
  { type: "addEpicEvidence", epicId: "EPIC-17", evidenceId: "E-G04-S666-START", actor: "Codex", role: "maintainer" },
  {
    type: "addComment", itemId: "G04-V03", actor: "Codex",
    text: "S666 starts the single S665-authorized native DGS grainline calibration. It is limited to one synthetic closed rectangle, exactly one native grainline, one recorded AutoCAD/No RUL export if available, one parse and one reimport. Prove coordinates at 0.001 cm or stop; no format/mode/entity/settings permutations. No apparel exchange gate is presumed passed. See the S666 start packet.",
  },
  {
    type: "addComment", itemId: "EPIC-17", actor: "Codex",
    text: "Slice 666 begins from verified S665 commit 253d3b9f and board revision 3897. One DGS-native grainline calibration only; all admitted criteria, holds, V02-before-V03, legacy DXF behavior, protected byte identities and final gates remain unchanged.",
  },
];
for (let i = 0; i < commands.length; i += 1) {
  const command = { ...commands[i], expectedRevision: board.revision };
  board = applyBoardCommand(board, command, { now: "2026-10-10T09:07:06.000Z" });
  await writeFile(new URL(`S666-start-command-${String(i + 1).padStart(2, "0")}.json`, dir), `${JSON.stringify(command, null, 2)}\n`);
}
assert.equal(board.revision, 3901);
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
console.log("S666 start preflight passed: validated commands 3897→3901; Epic/V03 statuses unchanged.");
