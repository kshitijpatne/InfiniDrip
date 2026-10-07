import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8" }));
const start = JSON.parse(await readFile(new URL("S432-start-board-commands.json", folder), "utf8"));
const exit = JSON.parse(await readFile(new URL("S432-exit-board-commands.json", folder), "utf8"));
let candidate = structuredClone(board);
for (const command of [...start, ...exit]) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; candidate is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T18:11:00.000Z" });
}
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  epicStatus: candidate.epics.find(({ id }) => id === "EPIC-17").status,
  v01Status: candidate.workItems.find(({ id }) => id === "G04-V01").status,
  v02Status: candidate.workItems.find(({ id }) => id === "G04-V02").status,
  v03Status: candidate.workItems.find(({ id }) => id === "G04-V03").status,
  acceptedHeldTally: "56 accepted / 90 held across 73 configurations / 146 faces",
  poloOptionHolds: "17 front POM placement failures / 17 back unclosed sleeve colorway contours; all 34 held",
};
if (result.sourceRevision !== 2550 || result.resultingRevision !== 2558 || result.epicStatus !== "In Progress"
  || result.v01Status !== "Done" || result.v02Status !== "In Progress" || result.v03Status !== "Backlog") {
  throw new Error(`S432 exit preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S432-exit-preflight-replay.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
