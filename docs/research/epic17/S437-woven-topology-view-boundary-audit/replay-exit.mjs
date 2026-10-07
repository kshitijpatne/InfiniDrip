import { readFile, writeFile } from "node:fs/promises";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const board = JSON.parse(await readFile(boardPath, "utf8"));
const item = (id) => board.workItems.find(({ id: value }) => value === id);
const epic = board.epics.find(({ id }) => id === "EPIC-17");
const result = {
  revision: board.revision,
  statuses: { epic: board.epics.find(({ id }) => id === "EPIC-17").status,
    v01: item("G04-V01").status, v02: item("G04-V02").status, v03: item("G04-V03").status },
  evidenceLinked: ["E-G04-S437-TRACE", "E-G04-S437-EXIT"].every((id) => item("G04-V02").evidenceRefs.includes(id)
    && epic.evidenceRefs.includes(id)),
  tallyPreserved: item("EPIC-17").description.includes("56 accepted / 90 held"),
  exitCommentRecorded: item("G04-V02").comments.some((entry) => entry.text.includes("S437 revalidates the current exact Woven 14:14 output")),
};
if (result.revision !== 2613 || result.statuses.epic !== "In Progress" || result.statuses.v01 !== "Done"
  || result.statuses.v02 !== "In Progress" || result.statuses.v03 !== "Backlog"
  || !result.evidenceLinked || !result.tallyPreserved || !result.exitCommentRecorded) throw new Error(`S437 exit verification failed: ${JSON.stringify(result)}`);
await writeFile(new URL("S437-exit-board-result.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
