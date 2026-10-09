import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const dir = "docs/research/epic17/S622-standard-dxf-connected-line-import";
const packet = await readFile(`${dir}/S622-start-packet.md`, "utf8");
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.match(packet, /Standard-DXF/);
assert.match(packet, /A95E2CBAFAA14555421517505CA83225E9E0ACB26DBADB4B7FA62AC5A0D1B675/);
assert.match(packet, /0\.001 cm/);
assert.match(packet, /do not export/);
assert.match(packet, /Do not launch\/restart\/close CLO/);
assert([3622, 3624].includes(board.revision));
assert.equal(board.workItems.find((item) => item.id === "G04-V03")?.status, "In Progress");
const evidence = board.evidence.some((item) => item.id === "E-G04-S622-START");
assert.equal(evidence, board.revision === 3624);
console.log(`S622 start preflight passed at board revision ${board.revision}.`);
