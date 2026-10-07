import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const [command] = JSON.parse(await readFile(new URL("S433-board-epic-card-tally-phrase.json", folder), "utf8"));
const board = JSON.parse(await readFile(boardPath, "utf8"));
if (board.revision === command.expectedRevision) await executeBoardCommand(command);
else if (board.revision !== command.expectedRevision + 1) throw new Error(`Expected revision ${command.expectedRevision} or its replay result; found ${board.revision}`);
const updated = JSON.parse(await readFile(boardPath, "utf8"));
const description = updated.workItems.find(({ id }) => id === "EPIC-17").description;
const result = { revision: updated.revision,
  expectedTallyPreserved: /Latest verified tally remains 56 accepted \/ 90 held/u.test(description)
    && /latest integrated tally remains 56 accepted \/ 90 held/u.test(description),
  s433AndHoldsPreserved: /S433 fixes Polo back sleeve colorway contour closure/u.test(description)
    && /All 34 Polo and 56 Woven faces remain held/u.test(description) };
if (result.revision !== 2574 || !result.expectedTallyPreserved || !result.s433AndHoldsPreserved) {
  throw new Error(`Epic card tally reconciliation failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S433-board-epic-card-tally-phrase-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
