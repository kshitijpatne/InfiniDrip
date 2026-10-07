import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const [command] = JSON.parse(await readFile(new URL("S433-board-epic-phrase-reconciliation.json", folder), "utf8"));
const board = JSON.parse(await readFile(boardPath, "utf8"));
if (command.expectedRevision !== board.revision) throw new Error(`Expected revision ${command.expectedRevision}; found ${board.revision}`);
await executeBoardCommand(command);
const updated = JSON.parse(await readFile(boardPath, "utf8"));
const description = updated.workItems.find(({ id }) => id === "EPIC-17").description;
const result = { revision: updated.revision,
  requiredPhraseRetained: /S406's approved view-only collar-over-plackets order remains implemented/u.test(description),
  currentS433SummaryRetained: /S433 fixes Polo back colorway contour closure/u.test(description) };
if (result.revision !== 2569 || !result.requiredPhraseRetained || !result.currentS433SummaryRetained) {
  throw new Error(`Phrase reconciliation failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S433-board-epic-phrase-reconciliation-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
