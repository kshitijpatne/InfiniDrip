import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";
import { readBoardFile } from "../../../../ops/control-center/board-store.mjs";

const boardPath = resolve("ops/control-center/data/board.json");
const commandPath = resolve("docs/planning/UI-ENHANCEMENT-BOARD-COMMANDS.json");
const board = await readBoardFile(boardPath);
const commands = JSON.parse(await readFile(commandPath, "utf8"));
let simulated = board;
const counts = { appliedToClone: 0, identicalSkipped: 0 };
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

for (const command of commands) {
  let identical = false;
  if (command.type === "createItem") {
    const expected = command.workItem;
    const existing = simulated.workItems.find((item) => item.id === expected.id);
    if (existing) {
      const keys = ["id", "type", "title", "epicId", "releaseId", "priority", "risk", "owner", "contributor",
        "reviewer", "targetAt", "dependencies", "protectedSurfaces", "description", "expectation",
        "acceptanceCriteria", "flagKey"];
      identical = existing.status === "Backlog" && keys.every((key) => {
        const value = expected[key] ?? ({ epicId: null, releaseId: null, contributor: expected.owner,
          reviewer: expected.owner, targetAt: null, dependencies: [], protectedSurfaces: [], flagKey: null })[key];
        return same(existing[key], value);
      });
      if (!identical) throw new Error(`Existing item ${expected.id} differs from the approved UI command`);
    }
  } else if (command.type === "addEvidence" && command.evidence) {
    const expected = command.evidence;
    const existing = simulated.evidence.find((entry) => entry.id === expected.id);
    if (existing) {
      identical = ["id", "kind", "uri", "commit", "sha256", "verified", "note"]
        .every((key) => same(existing[key] ?? null, expected[key] ?? null));
      if (!identical) throw new Error(`Existing evidence ${expected.id} differs from the approved UI command`);
    }
  } else if (command.type === "addEvidence" && command.evidenceId) {
    const item = simulated.workItems.find((entry) => entry.id === command.itemId);
    if (!simulated.evidence.some((entry) => entry.id === command.evidenceId)) {
      throw new Error(`Missing referenced evidence ${command.evidenceId}`);
    }
    identical = item?.evidenceRefs.includes(command.evidenceId) === true;
  } else if (command.type === "addComment") {
    const item = simulated.workItems.find((entry) => entry.id === command.itemId)
      ?? simulated.epics.find((entry) => entry.id === command.itemId);
    identical = item?.comments.some((entry) => entry.actor === command.actor && entry.text === command.text) === true;
  }

  if (identical) {
    counts.identicalSkipped += 1;
    continue;
  }
  simulated = applyBoardCommand(simulated, { ...command, expectedRevision: simulated.revision },
    { now: "2026-10-02T00:00:00.000Z" });
  counts.appliedToClone += 1;
}

console.log(JSON.stringify({ boardRevision: board.revision, commandCount: commands.length, ...counts,
  cloneFinalRevision: simulated.revision, canonicalBoardWritten: false }, null, 2));
