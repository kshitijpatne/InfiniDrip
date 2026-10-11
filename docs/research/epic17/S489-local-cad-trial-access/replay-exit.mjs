import { readFile } from "node:fs/promises";
import { DEFAULT_BOARD_PATH, executeBoardCommand, readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const commands = JSON.parse(await readFile(new URL("./S489-exit-board-commands.json", import.meta.url), "utf8"));
let board = await readBoardFile(DEFAULT_BOARD_PATH);

function alreadyApplied(command) {
  if (command.type === "addEvidence") {
    const item = board.workItems.find((entry) => entry.id === command.itemId);
    return board.evidence.some((entry) => entry.id === command.evidence.id)
      && item?.evidenceRefs.includes(command.evidence.id);
  }
  if (command.type === "addEpicEvidence") {
    const epic = board.epics.find((entry) => entry.id === command.epicId);
    return epic?.evidenceRefs.includes(command.evidenceId) ?? false;
  }
  if (command.type === "addComment") {
    const item = board.workItems.find((entry) => entry.id === command.itemId);
    return item?.comments.some((entry) => entry.text === command.text) ?? false;
  }
  return false;
}

for (const command of commands) {
  if (command.expectedRevision < board.revision) {
    if (alreadyApplied(command)) {
      console.log(`${command.type}: already persisted at an earlier revision`);
      continue;
    }
    throw new Error(`Revision ${command.expectedRevision} is stale and its effect is not present; current board is ${board.revision}`);
  }
  if (command.expectedRevision !== board.revision) {
    throw new Error(`Command expects revision ${command.expectedRevision}; current board is ${board.revision}`);
  }
  board = await executeBoardCommand(command);
  console.log(`${command.type}: revision ${board.revision}`);
}
