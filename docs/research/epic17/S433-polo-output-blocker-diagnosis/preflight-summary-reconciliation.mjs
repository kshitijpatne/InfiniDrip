import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
const commands = JSON.parse(await readFile(new URL("S433-board-summary-reconciliation-commands.json", folder), "utf8"));
let candidate = structuredClone(board);
for (const command of commands) {
  if (command.expectedRevision !== candidate.revision) throw new Error(`Expected ${command.expectedRevision}; candidate is ${candidate.revision}`);
  candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T18:41:00.000Z" });
}
const g04 = candidate.workItems.find(({ id }) => id === "G04-V02");
const epic = candidate.workItems.find(({ id }) => id === "EPIC-17");
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  historicalG04FactsRetained: /S381 found no evidence supporting a false Woven back-hem gap/u.test(g04.description)
    && /S419 tested a 2–3-arc Polo H locator across 17 options/u.test(g04.description),
  historicalEpicFactsRetained: /Latest integrated tally remains 56 accepted \/ 90 held/u.test(epic.description)
    && /S406's approved view-only collar-over-plackets order remains implemented/u.test(epic.description),
  currentS433AndHoldsRetained: /S433 fixes/u.test(g04.description) && /All 56 Woven and 34 Polo faces remain held/u.test(g04.description),
};
if (result.sourceRevision !== 2566 || result.resultingRevision !== 2568 || !result.historicalG04FactsRetained
  || !result.historicalEpicFactsRetained || !result.currentS433AndHoldsRetained) {
  throw new Error(`Summary preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S433-board-summary-reconciliation-preflight.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
