import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const packet = await readFile("docs/research/epic17/S621-aama-swap-lines-import/S621-start-packet.md", "utf8");
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.match(packet, /Swap cut and sewing lines/);
assert.match(packet, /0\.001 cm/);
assert(packet.includes("G04-CLO-DXF-Exchange"));
assert.match(packet, /written confirmation/);
assert.equal(board.revision, 3618);
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert(!board.evidence.some((item) => item.id === "E-G04-S621-START"));
console.log("S621 start preflight passed at verified board revision 3618.");
