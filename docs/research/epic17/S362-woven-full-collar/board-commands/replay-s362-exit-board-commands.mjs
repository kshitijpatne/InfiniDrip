import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { applyBoardCommand } from "../../../../../ops/control-center/commands.mjs";
import { executeBoardCommand, readBoardFile } from "../../../../../ops/control-center/board-store.mjs";

const boardPath = resolve("ops/control-center/data/board.json");
const commandPath = resolve("docs/research/epic17/S362-woven-full-collar/board-commands/S362-exit-board-commands.json");
const commands = JSON.parse(await readFile(commandPath, "utf8"));
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function identityState(board, command) {
  if (command.type === "editEpic") {
    const epic = board.epics.find((entry) => entry.id === command.epicId);
    return epic && Object.entries(command.patch).every(([key, value]) => equal(epic[key], value));
  }
  if (command.type === "editItem") {
    const item = board.workItems.find((entry) => entry.id === command.itemId);
    return item && Object.entries(command.patch).every(([key, value]) => equal(item[key], value));
  }
  if (command.type === "addEvidence" && command.evidence) {
    const evidence = board.evidence.find((entry) => entry.id === command.evidence.id);
    if (!evidence) return false;
    const normalized = { ...command.evidence, commit: command.evidence.commit ?? null, sha256: command.evidence.sha256 ?? null };
    if (!equal(evidence, normalized)) throw new Error(`Evidence identity collision: ${evidence.id}`);
    const target = board.workItems.find((entry) => entry.id === command.itemId);
    return target?.evidenceRefs.includes(evidence.id) === true;
  }
  if (command.type === "addEvidence" && command.evidenceId) {
    const target = board.workItems.find((entry) => entry.id === command.itemId);
    return target?.evidenceRefs.includes(command.evidenceId) === true;
  }
  if (command.type === "addEpicEvidence") {
    const epic = board.epics.find((entry) => entry.id === command.epicId);
    return epic?.evidenceRefs.includes(command.evidenceId) === true;
  }
  if (command.type === "addComment") {
    const item = board.workItems.find((entry) => entry.id === command.itemId)
      ?? board.epics.find((entry) => entry.id === command.itemId);
    return item?.comments.some((entry) => entry.actor === command.actor && entry.text === command.text) === true;
  }
  return false;
}

let clone = await readBoardFile(boardPath);
const preflightStart = clone.revision;
for (const command of commands) {
  if (identityState(clone, command)) continue;
  clone = applyBoardCommand(clone, { ...command, expectedRevision: clone.revision },
    { now: "2026-10-02T00:00:00.000Z" });
}

const replay = { preflightRevision: preflightStart, preflightFinalRevision: clone.revision,
  applied: 0, identicalSkipped: 0, revisions: [] };
for (const command of commands) {
  const current = await readBoardFile(boardPath);
  if (identityState(current, command)) {
    replay.identicalSkipped += 1;
    continue;
  }
  const updated = await executeBoardCommand({ ...command, expectedRevision: current.revision }, { boardPath });
  replay.applied += 1;
  replay.revisions.push(updated.revision);
}
console.log(JSON.stringify(replay, null, 2));
