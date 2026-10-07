import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const folder = new URL("./", import.meta.url);
const boardPath = new URL("../../../../ops/control-center/data/board.json", import.meta.url);
const board = JSON.parse(await readFile(boardPath, "utf8"));
const g04 = board.workItems.find((item) => item.id === "G04-V02");
const epic = board.epics.find((item) => item.id === "EPIC-17");
const target = "The two front POM label placements still fail in all 17 options; the exact J/FG keyed schedule trial awaits approval.";
if (!g04?.description.includes(target)) throw new Error("Expected S433 G04 board passage not found; inspect current board before making a new additive reconciliation.");
const g04Description = g04.description.replace(target,
  "S434 implements the approved J key at `outerStand.frontEnd` and one FG marker at `outerStand.frontNeckline`; all 13 full-text keyed rows remain independent and source-bound. Production compiler, SVG renderer and Chromium replay pass all 17 options / 34 faces with no tool errors. The S426 collision method finds the J glyph overlaps `underCollar.centerFront` in 17/17 options and component outline strokes in 17/17; the FG glyph has no such finding. A fixed-ring, 0,+0.70 cm J text-offset trial clears paths/marks across all 17 but is diagnostic only and awaits maintainer approval. Reviewed neck/shoulder labels remain crowded. No face is accepted; all 34 Polo and 56 Woven faces remain held.");
const epicDescription = epic.description.replace(
  "The two front POM label placements remain unresolved in all 17 options; the J/FG marker/full-schedule proposal awaits approval.",
  "S434 implements the approved Polo J/FG keyed display: production compiler, SVG renderer and Chromium replay pass all 17 options / 34 faces, with 13 complete keyed rows per front. S434's source-clearance replay finds the J glyph overlaps a source mark in all 17 options and component outlines in all 17; a fixed-ring 0,+0.70 cm text-offset scan clears sampled paths/marks in every option but remains diagnostic pending approval. This targeted display change accepts no face; dense neck/shoulder markings and other Polo V02 gates remain. All 34 Polo and 56 Woven faces remain held.");
if (epicDescription === epic.description) throw new Error("Expected S433 EPIC passage not found; inspect current board before making a new additive reconciliation.");
const commands = [
  { type: "editItem", expectedRevision: board.revision, itemId: "G04-V02", patch: { description: g04Description } },
  { type: "editEpic", expectedRevision: board.revision + 1, actor: "Codex", role: "maintainer",
    reason: "Record S434's approved source-bound Polo J/FG keyed display, 17-option production output evidence, and remaining holds without changing EPIC scope or status.",
    epicId: "EPIC-17", patch: { description: epicDescription } },
  { type: "addEvidence", expectedRevision: board.revision + 2, itemId: "G04-V02", evidence: {
    id: "E-G04-S434-EXIT", kind: "document",
    uri: "docs/research/epic17/S434-polo-j-fg-keyed-display/G04-V02-POLO-J-FG-KEYED-DISPLAY-S434.md",
    verified: true,
    note: "Implements approved source-bound J/FG markers; 17-option/34-face production renderer and browser replay pass. Clearance replay finds repeated J overlaps; a constant text-only offset trial remains unapproved. All prior V02 holds remain; no face accepted." } },
  { type: "addEpicEvidence", expectedRevision: board.revision + 3, actor: "Codex", role: "maintainer",
    epicId: "EPIC-17", evidenceId: "E-G04-S434-EXIT" },
  { type: "addComment", expectedRevision: board.revision + 4, itemId: "G04-V02", actor: "Codex",
    text: "S434 implements the approved J/FG view markers while preserving every source POM row and its exact revision/edge identity. Production SVG and Chromium replay passed 17/17 options and 34/34 faces with zero tool errors; all 13 keyed rows appear per front. S426-method clearance analysis finds 34 J glyph conflicts across 17 options (underCollar.centerFront plus component outlines), while FG has zero; the fixed-ring 0,+0.70 cm J glyph offset is only diagnostic and awaits approval. No face accepted: all 34 Polo and 56 Woven views remain held; preserve all-seven V02, the exact S351 exception and 0.25 cm gate elsewhere, V02-before-V03, legacy DXF, protected export identities and V03 rights/round-trip gates." },
  { type: "addComment", expectedRevision: board.revision + 5, itemId: "EPIC-17", actor: "Codex",
    text: "S434 closes its approved presentation change with 17-option production compile/render/Chromium evidence. This does not pass face acceptance: 34 Polo and 56 Woven faces remain held, V02 is still In Progress, and V03 remains gated behind all-seven V02 plus rights-cleared profile and representative round-trip evidence." },
];
await writeFile(new URL("S434-exit-board-commands.json", folder), `${JSON.stringify(commands, null, 2)}\n`);
console.log(JSON.stringify({ sourceRevision: board.revision, resultingRevision: board.revision + commands.length,
  commandTypes: commands.map(({ type }) => type) }, null, 2));
