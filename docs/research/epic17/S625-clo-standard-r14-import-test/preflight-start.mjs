import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S625-clo-standard-r14-import-test";
const packet = await readFile(`${dir}/S625-start-packet.md`, "utf8");
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
const expected = "368aa9611fad15af99cacebdfe970d7521bdcd1c";
const head = (await import("node:child_process")).execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
assert.equal(head, expected);
assert.match(packet, /Standard-DXF R14 import/);
assert.match(packet, /0\.001 cm/);
assert.match(packet, /confirmed in writing/);
assert([3637, 3639, 3642].includes(board.revision));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert.equal(board.evidence.some((item) => item.id === "E-G04-S625-START"), board.revision >= 3639);
assert.equal(board.evidence.some((item) => item.id === "E-G04-S625-EXIT"), board.revision === 3642);
const input = "C:/G04-CLO-DXF-Exchange/S625-clo-standard-r14-import-test/Input/polo-m-r14.dxf";
if (board.revision >= 3639) {
  const hash = createHash("sha256").update(await readFile(input)).digest("hex").toUpperCase();
  assert.equal(hash, "AA6E409E84345DB89E094CC3AE8F131BEC0EC0B21373B57B3DC0DCDF7D3A7C1C");
}
console.log(`S625 start preflight passed at board revision ${board.revision}.`);
