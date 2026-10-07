import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const board = JSON.parse(execFileSync("git", ["show", "HEAD:ops/control-center/data/board.json"], { encoding: "utf8" }));
const commands = JSON.parse(await readFile(new URL("./S433-start-board-commands.json", import.meta.url), "utf8"));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; found ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T18:18:31.000Z" });
}
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  v02: candidate.workItems.find(({ id }) => id === "G04-V02").status,
  v03: candidate.workItems.find(({ id }) => id === "G04-V03").status,
  linked: candidate.workItems.find(({ id }) => id === "G04-V02").evidenceRefs.includes("E-G04-S433-START") };
if (result.sourceRevision !== 2558 || result.resultingRevision !== 2560 || result.v02 !== "In Progress"
  || result.v03 !== "Backlog" || !result.linked) throw new Error(`S433 start preflight failed: ${JSON.stringify(result)}`);
await writeFile(new URL("./S433-start-preflight.json", import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
