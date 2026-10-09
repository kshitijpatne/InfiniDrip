import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S623-opencadstudio-r14-receiver";
const packet = await readFile(`${dir}/S623-start-packet.md`, "utf8");
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.match(packet, /R14 DXF/);
assert.match(packet, /seven base-M recipes/);
assert.match(packet, /C:-only/);
assert.match(packet, /cannot by itself prove apparel-specific/);
assert.match(packet, /0\.001 cm/);
assert.match(packet, /malformed/);
assert([3627, 3629, 3632].includes(board.revision));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
const evidence = board.evidence.some((item) => item.id === "E-G04-S623-START");
assert.equal(evidence, board.revision >= 3629);
console.log(`S623 start preflight passed at board revision ${board.revision}.`);
