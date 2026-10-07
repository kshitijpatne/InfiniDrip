import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const [command] = JSON.parse(await readFile(new URL("S433-board-epic-card-reconciliation.json", folder), "utf8"));
const board = JSON.parse(await readFile(boardPath, "utf8"));
if (command.expectedRevision !== board.revision) throw new Error(`Expected revision ${command.expectedRevision}; found ${board.revision}`);
await executeBoardCommand(command);
const updated = JSON.parse(await readFile(boardPath, "utf8"));
const description = updated.workItems.find(({ id }) => id === "EPIC-17").description;
const result = { revision: updated.revision,
  currentS433Summary: /S433 fixes Polo back sleeve colorway contour closure/u.test(description),
  preservesGateAndHolds: /all-seven V02/u.test(description) && /All 34 Polo and 56 Woven faces remain held/u.test(description),
  preservesHistoricalPhrase: /S406's approved view-only collar-over-plackets order remains implemented/u.test(description) };
if (result.revision !== 2573 || !result.currentS433Summary || !result.preservesGateAndHolds || !result.preservesHistoricalPhrase) {
  throw new Error(`Epic card reconciliation failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S433-board-epic-card-reconciliation-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
