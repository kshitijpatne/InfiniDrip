import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S624-opencadstudio-desktop-r14-receiver";
const packet = await readFile(`${dir}/S624-start-packet.md`, "utf8");
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.match(packet, /Open CAD Studio Windows portable/);
assert.match(packet, /synthetic R12 fixture/);
assert.match(packet, /0\.001 cm/);
assert.match(packet, /C:\\G04-CLO-DXF-Exchange/);
assert([3632, 3634].includes(board.revision));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
assert.equal(board.evidence.some((item) => item.id === "E-G04-S624-START"), board.revision === 3634);
console.log(`S624 start preflight passed at board revision ${board.revision}.`);
