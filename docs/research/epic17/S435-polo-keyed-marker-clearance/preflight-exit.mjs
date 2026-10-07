import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
if (board.revision !== 2591) throw new Error(`Expected start board 2591; found ${board.revision}`);
const epic = board.epics.find(({ id }) => id === "EPIC-17");
const epicCard = board.workItems.find(({ id }) => id === "EPIC-17");
const v02 = board.workItems.find(({ id }) => id === "G04-V02");
const oldConflict = "Clearance review found 34 J glyph conflicts across 17 options (underCollar.centerFront and component outline strokes); FG has zero measured glyph/source collisions. A constant `(0,+0.70 cm)` J text-only offset keeps the exact ring station and clears sampled paths/marks across all options, but remains a diagnostic awaiting maintainer approval.";
const newFinding = "S435 applies S426's corrected full-label Chromium audit directly to all 17 S434 Polo front SVGs/revisions: 660 source-label instances, 153 keyed glyphs, all 13 schedule rows/front, zero measured label/marker/schedule overlaps and zero browser errors. S434's raw path/mark proximity contacts include represented target stations and are not a readability-collision metric; its J text-offset scan is diagnostic, unnecessary under S435, and was not implemented.";
if (!epic.description.includes(oldConflict) || !v02.description.includes("The S426 source-path/mark clearance method finds 34 J glyph conflicts:")) {
  throw new Error("Expected stale S434 clearance wording was not found; refusing to overwrite board summaries");
}
const nextEpicDescription = epic.description.replace(oldConflict, newFinding)
  .replace("Dense neck/shoulder markings and other V02 checks remain; no faces were accepted and all 34 Polo/56 Woven faces stay held.", "Corrected S435 full-label review finds no callout-box collision, while other V02 checks remain; no faces are accepted and all 34 Polo/56 Woven faces stay held.")
  .replace("See docs/research/epic17/S433-polo-output-blocker-diagnosis/G04-V02-POLO-OUTPUT-BLOCKER-DIAGNOSIS-S433.md.", "See docs/research/epic17/S435-polo-keyed-marker-clearance/G04-V02-POLO-KEYED-MARKER-CLEARANCE-S435.md.");
const nextCardDescription = v02.description.replace(/The S426 source-path\/mark clearance method finds 34 J glyph conflicts:[\s\S]*?pending maintainer approval\./u, newFinding)
  .replace("See docs/research/epic17/S433-polo-output-blocker-diagnosis/G04-V02-POLO-OUTPUT-BLOCKER-DIAGNOSIS-S433.md.", "S434 implements the approved J/FG source-bound mapping and complete 13-row schedule. S435 confirms zero measured full-label overlaps across all 17 Polo options; all faces remain held pending the remaining V02 gates. Packet: docs/research/epic17/S435-polo-keyed-marker-clearance/G04-V02-POLO-KEYED-MARKER-CLEARANCE-S435.md.");
const commands = [
  { type: "addEvidence", expectedRevision: 2591, itemId: "G04-V02", evidence: {
    id: "E-G04-S435-EXIT", kind: "document", uri: "docs/research/epic17/S435-polo-keyed-marker-clearance/G04-V02-POLO-KEYED-MARKER-CLEARANCE-S435.md", verified: true,
    note: "Corrected full-label Chromium review of exact S434 production SVGs across all 17 Polo options: 660 source labels, 153 key glyphs, complete 13-row schedule and zero measured overlaps; all Polo/Woven holds and V02 gates remain." } },
  { type: "addEpicEvidence", expectedRevision: 2592, actor: "Codex", role: "maintainer", epicId: "EPIC-17", evidenceId: "E-G04-S435-EXIT" },
  { type: "editItem", expectedRevision: 2593, itemId: "G04-V02", patch: { description: nextCardDescription } },
  { type: "editEpic", expectedRevision: 2594, actor: "Codex", role: "maintainer", reason: "Reconcile the preliminary S434 raw path/mark contacts with S435's corrected production-SVG full-label audit; preserve all V02 holds and scope.", epicId: "EPIC-17", patch: { description: nextEpicDescription } },
  { type: "addComment", expectedRevision: 2595, itemId: "G04-V02", actor: "Codex", text: "S435 reconciliation: the corrected complete-label audit of all 17 exact S434 production fronts finds zero source-label, marker-glyph or schedule overlaps. Preliminary raw path/mark contacts include intentional represented-station contacts and do not establish unreadability; the unimplemented J offset is unnecessary. The user reconfirmed the exact approved J/FG mapping. No face is accepted; all 34 Polo and 56 Woven views remain held." },
];
let candidate = structuredClone(board);
for (const command of commands) candidate = applyBoardCommand(candidate, command, { now: "2026-10-07T19:41:00.000Z" });
const result = { sourceRevision: board.revision, resultingRevision: candidate.revision,
  statusesUnchanged: board.epics.every((item) => candidate.epics.find((next) => next.id === item.id)?.status === item.status)
    && board.workItems.every((item) => candidate.workItems.find((next) => next.id === item.id)?.status === item.status),
  evidenceLinked: candidate.workItems.find(({ id }) => id === "G04-V02").evidenceRefs.includes("E-G04-S435-EXIT")
    && candidate.epics.find(({ id }) => id === "EPIC-17").evidenceRefs.includes("E-G04-S435-EXIT"),
  noStaleCollisionClaim: !candidate.epics.find(({ id }) => id === "EPIC-17").description.includes(oldConflict),
  tally: "56 accepted / 90 held; 73 configurations / 146 faces" };
if (result.resultingRevision !== 2596 || !result.statusesUnchanged || !result.evidenceLinked || !result.noStaleCollisionClaim) {
  throw new Error(`S435 exit preflight failed: ${JSON.stringify(result)}`);
}
await writeFile(new URL("S435-exit-board-commands.json", folder), `${JSON.stringify(commands, null, 2)}\n`);
await writeFile(new URL("S435-exit-preflight.json", folder), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
