import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert([3544, 3546].includes(board.revision), "refusing stale S603 exit state");
assert(board.evidence.some(({ id, uri, verified }) =>
  id === "E-G04-S603-START" &&
  uri === "docs/research/epic17/S603-waistband-sew-grading-trial/S603-start-packet.md" && verified));
if (board.revision === 3544) assert(!board.evidence.some(({ id }) => id === "E-G04-S603-EXIT"));
if (board.revision === 3546) assert(board.evidence.some(({ id, uri, verified }) =>
  id === "E-G04-S603-EXIT" &&
  uri === "docs/research/epic17/S603-waistband-sew-grading-trial/S603-exit-packet.md" && verified));
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");

const packetPath = "docs/research/epic17/S603-waistband-sew-grading-trial/S603-exit-packet.md";
const packet = await readFile(packetPath);
assert(packet.length > 2500);
assert.match(packet.toString(), /Fail-closed result/);
assert.match(packet.toString(), /2ca92f80cfecaa22168bf6aa0089a79e9bb14b0d10395b0cbeed8f50cafb8956/);

const capturePath = "C:\\G04-CLO-DXF-Exchange\\S603-waistband-sew-grading-trial\\s603-ambiguous-internal-grade-selection.jpg";
const capture = await readFile(capturePath);
assert.equal(createHash("sha256").update(capture).digest("hex"),
  "2ca92f80cfecaa22168bf6aa0089a79e9bb14b0d10395b0cbeed8f50cafb8956");
console.log(`S603 exit preflight passed; packet SHA-256 ${createHash("sha256").update(packet).digest("hex")}.`);
