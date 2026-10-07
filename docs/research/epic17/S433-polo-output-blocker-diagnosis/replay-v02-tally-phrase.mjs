import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const [command] = JSON.parse(await readFile(new URL("S433-board-v02-tally-phrase.json", folder), "utf8"));
const board = JSON.parse(await readFile(boardPath, "utf8"));
if (command.expectedRevision !== board.revision) throw new Error(`Expected revision ${command.expectedRevision}; found ${board.revision}`);
await executeBoardCommand(command);
const updated = JSON.parse(await readFile(boardPath, "utf8"));
const description = updated.workItems.find(({ id }) => id === "G04-V02").description;
const result = { revision: updated.revision,
  tallyPhraseRetained: /latest verified integrated tally is 56 accepted \/ 90 held across 73 configurations \/ 146 faces/u.test(description),
  s433AndAllHoldsRetained: /S433 fixes/u.test(description) && /All 56 Woven and 34 Polo faces remain held/u.test(description) };
if (result.revision !== 2572 || !result.tallyPhraseRetained || !result.s433AndAllHoldsRetained) {
  throw new Error(`Tally phrase reconciliation failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S433-board-v02-tally-phrase-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
