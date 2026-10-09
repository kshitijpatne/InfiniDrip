import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const directory = "docs/research/epic17/S601-clo-roundtrip-output-render";
const before = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
if (before.revision === 3538 && before.evidence.some(({ id }) => id === "E-G04-S601-EXIT")) {
  console.log("S601 exit replay already applied at revision 3538.");
  process.exit(0);
}
assert.equal(before.revision, 3536, "refusing stale S601 exit replay");
for (const name of ["S601-exit-add-evidence.json", "S601-exit-add-comment.json"]) {
  execFileSync(process.execPath, ["ops/control-center/cli.mjs", `${directory}/${name}`], { stdio: "inherit" });
}
const after = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(after.revision, 3538);
assert.equal(after.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(after.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(after.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert(after.evidence.some(({ id, uri, verified }) => id === "E-G04-S601-EXIT" && uri === `${directory}/S601-exit-packet.md` && verified));
console.log("S601 exit replay passed at revision 3538; EPIC-17/V03 remain In Progress and V02 remains Done.");
