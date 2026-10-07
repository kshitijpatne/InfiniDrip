import { readFile, writeFile } from "node:fs/promises";

const folder = new URL("./", import.meta.url);
const board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
const g04 = board.workItems.find((item) => item.id === "G04-V02");
const epic = board.epics.find((item) => item.id === "EPIC-17");
const oldG04 = "S434 implements the approved J key at `outerStand.frontEnd` and one FG marker at `outerStand.frontNeckline`; all 13 full-text keyed rows remain independent and source-bound. The production compiler, SVG renderer and Chromium replay pass all 17 options / 34 faces with no compiler, renderer or browser errors. The neck/shoulder construction labels remain crowded on reviewed output, so this targeted change accepts no face. All 34 Polo and 56 Woven faces remain held pending every applicable V02 gate.";
const oldEpic = "S434 implements the approved Polo J/FG keyed display: production compiler, SVG renderer and Chromium replay pass all 17 options / 34 faces, with 13 complete keyed rows per front. This targeted display change accepts no face; reviewed output still has dense neck/shoulder construction markings and separate Polo V02 gates remain. All 34 Polo and 56 Woven faces remain held.";
if (!g04.description.includes(oldG04) || !epic.description.includes(oldEpic)) throw new Error("S434 board summary changed since initial replay; inspect before an additive reconciliation.");
const nextG04 = g04.description.replace(oldG04,
  "S434 implements approved source-bound J and FG rings; all 13 full-text keyed rows remain independent. Production compile/render/Chromium passes 17 options / 34 faces with zero tool errors. The S426 source-path/mark clearance method finds 34 J glyph conflicts: it overlaps `underCollar.centerFront` in 17/17 options and component outline strokes in 17/17 (buttonPlacket 14, outerStand 2, front 1); FG has no measured glyph/source collision. A constant `(0,+0.70 cm)` J text offset while keeping the ring fixed clears all sampled paths/marks across all options, but is diagnostic only pending maintainer approval. Reviewed neck/shoulder markings remain dense. No face is accepted; all 34 Polo and 56 Woven faces remain held.");
const nextEpic = epic.description.replace(oldEpic,
  "S434 implements approved Polo J/FG keyed rings with 13 full-text keyed rows per front; production compile/render/Chromium passes 17 options / 34 faces with zero tool errors. Clearance review found 34 J glyph conflicts across 17 options (underCollar.centerFront and component outline strokes); FG has zero measured glyph/source collisions. A constant `(0,+0.70 cm)` J text-only offset keeps the exact ring station and clears sampled paths/marks across all options, but remains a diagnostic awaiting maintainer approval. Dense neck/shoulder markings and other V02 checks remain; no faces were accepted and all 34 Polo/56 Woven faces stay held.");
if (nextG04 === g04.description || nextEpic === epic.description) throw new Error("Expected S434 text not found; do not overwrite newer board wording.");
const commands = [
  { type: "editItem", expectedRevision: board.revision, itemId: "G04-V02", patch: { description: nextG04 } },
  { type: "editEpic", expectedRevision: board.revision + 1, actor: "Codex", role: "maintainer",
    reason: "Add the S434 rendered J glyph collision findings and fixed-ring offset trial without accepting faces or changing scope/status.",
    epicId: "EPIC-17", patch: { description: nextEpic } },
  { type: "addEvidence", expectedRevision: board.revision + 2, itemId: "G04-V02", evidence: {
    id: "E-G04-S434-CLEARANCE", kind: "document",
    uri: "docs/research/epic17/S434-polo-j-fg-keyed-display/S434-marker-clearance-matrix.json",
    verified: true, note: "Replays the S426 marker-clearance method on all 17 current S434 Polo front SVGs; records 34 new J glyph/source conflicts and zero FG source collisions." } },
  { type: "addEpicEvidence", expectedRevision: board.revision + 3, actor: "Codex", role: "maintainer",
    epicId: "EPIC-17", evidenceId: "E-G04-S434-CLEARANCE" },
  { type: "addComment", expectedRevision: board.revision + 4, itemId: "G04-V02", actor: "Codex",
    text: "S434 follow-up output review: J's glyph collides with `underCollar.centerFront` in 17/17 Polo options and with component outlines in 17/17; FG has no measured glyph/source overlap. A fixed-ring (0,+0.70 cm) text offset clears sampled paths, source marks and other key glyphs in the 17-option diagnostic scan and was rendered in default/min/max crops. It remains unimplemented pending approval. All 34 Polo / 56 Woven faces remain held." },
];
await writeFile(new URL("S434-clearance-board-commands.json", folder), `${JSON.stringify(commands, null, 2)}\n`);
console.log(JSON.stringify({ sourceRevision: board.revision, resultingRevision: board.revision + commands.length,
  commandTypes: commands.map(({ type }) => type) }, null, 2));
