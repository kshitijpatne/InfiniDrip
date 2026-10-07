import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const commands = JSON.parse(await readFile(new URL("S433-board-summary-reconciliation-commands.json", folder), "utf8"));
for (const command of commands) {
  const current = JSON.parse(await readFile(boardPath, "utf8"));
  if (command.expectedRevision !== current.revision) throw new Error(`Expected revision ${command.expectedRevision}; found ${current.revision}`);
  await executeBoardCommand(command);
}
const board = JSON.parse(await readFile(boardPath, "utf8"));
const result = { revision: board.revision,
  g04SummaryRetainsEvidence: /S381 found no evidence supporting a false Woven back-hem gap/u.test(board.workItems.find(({ id }) => id === "G04-V02").description),
  epicSummaryRetainsEvidence: /Latest integrated tally remains 56 accepted \/ 90 held/u.test(board.workItems.find(({ id }) => id === "EPIC-17").description),
  allHoldsRetained: /All 56 Woven and 34 Polo faces remain held/u.test(board.workItems.find(({ id }) => id === "G04-V02").description),
};
if (result.revision !== 2568 || !result.g04SummaryRetainsEvidence || !result.epicSummaryRetainsEvidence || !result.allHoldsRetained) {
  throw new Error(`Summary reconciliation failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S433-board-summary-reconciliation-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
