import { readFile, writeFile } from "node:fs/promises";
import { executeBoardCommand } from "../../../../ops/control-center/board-store.mjs";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const [command] = JSON.parse(await readFile(new URL("S433-board-v02-phrase-reconciliation.json", folder), "utf8"));
const board = JSON.parse(await readFile(boardPath, "utf8"));
if (command.expectedRevision !== board.revision) throw new Error(`Expected revision ${command.expectedRevision}; found ${board.revision}`);
await executeBoardCommand(command);
const updated = JSON.parse(await readFile(boardPath, "utf8"));
const description = updated.workItems.find(({ id }) => id === "G04-V02").description;
const result = { revision: updated.revision,
  requiredHistoricalFactsRetained: /S406's approved view-only collar-over-plackets order remains implemented/u.test(description)
    && /S419 tested a 2–3-arc Polo H locator across 17 options/u.test(description),
  currentS433FactsAndHoldsRetained: /S433 fixes/u.test(description) && /All 56 Woven and 34 Polo faces remain held/u.test(description),
  v03GateRetained: /Preserve all-seven V02, keep V03 gated/u.test(description) };
if (result.revision !== 2570 || !result.requiredHistoricalFactsRetained || !result.currentS433FactsAndHoldsRetained || !result.v03GateRetained) {
  throw new Error(`V02 phrase reconciliation failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S433-board-v02-phrase-reconciliation-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
