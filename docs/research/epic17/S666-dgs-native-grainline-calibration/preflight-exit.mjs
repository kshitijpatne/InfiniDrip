import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = new URL(".", import.meta.url);
let board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
assert.equal(board.revision, 3901, "S666 exit replays on its validated start revision");

const epicDescription = "EPIC-17/G04 remains In Progress through admitted V01→V02→V03 and safe merge. V01/V02 are Done; S459 accepts all seven recipes, 73 supported configurations and 146 front/back faces. Woven's 56 local faces pass the approved S457 front mask and local-Y back/band placement. S406's approved view-only collar-over-plackets order remains implemented. Admission: docs/planning/EPIC-17-ADMISSION.md. Preserve V02-before-V03, legacy DXF behavior and protected export identities. V03 remains In Progress and no technical exchange gate is qualified. GetonAgain DGS local evaluation rights, local handling and sign-in are settled; executable file version 2023.1.0.0 / About VID:20250610 (V2024.1 is the manual/package). S664's user-approved LINE/GRAINLINE Pattern candidate failed 9/9 with grainline-outside-border warnings. S666 independently verified one closed 20x30 cm CUT and zero source grainline entities, but DGS AUTOCAD/Pattern reported the same warning, showed unexpected internal strokes, and retained the warning after one native selected-pattern recreation. No output was exported. The exact candidate failed; DGS-wide cause/support remain unproven. S666 matrix and plan: docs/research/epic17/S666-dgs-native-grainline-calibration/. Next S667: one AutoCAD/Design import of the exact source-matched S664 Polo M candidate, changing only Pattern→Design; require warning-free, readable geometry/identity within 0.001 cm before one export/parse/reimport. Stop that candidate on a concrete miss; no other DGS permutations. Preserve all-seven/options/grades, fixed thresholds, C04 sidecar limits, V02 holds, legacy DXF, protected identities and final gates. No ANSI/AAMA or ASTM conformance, physical-fit, factory-acceptance or production-readiness claim. Current state: PROJECT-STATE.md; S666 packet: docs/research/epic17/S666-dgs-native-grainline-calibration/S666-exit-packet.md.";
const v03Description = "Qualify one rights-reviewed industrial CAD receiver/profile with representative import/export/round trips across all seven recipes and supported options/grades. Preserve the fixed 0.001 cm geometry gate, units, piece/grade identity and relations, seams/marks, malformed-input rejection, repeatability, readable rendered output, legacy DXF and protected export identities. Do not infer ANSI/AAMA or ASTM conformance from a vendor menu label. GetonAgain DGS local evaluation rights, local handling and sign-in are settled; executable file version 2023.1.0.0 / About VID:20250610. S661/S664 AutoCAD/Pattern candidates failed with nine outside-border warnings. S666's one closed control fixture has zero source grainline entities, but one DGS AutoCAD/Pattern import reported the same warning and rendered unexpected internal strokes; selected-pattern native recreation did not clear it. No export occurred; this exact candidate failed and the DGS-wide cause remains unproven. See S666 gate delta/plan. Next S667 tests only the documented AutoCAD/Design mode against the exact S664 source-matched Polo M candidate, changing Pattern→Design. Require warning-free, readable geometry and identity within 0.001 cm before one export/parse/reimport; stop on any concrete miss. Preserve every acceptance gate and hold.";

const commands = [
  {
    type: "editEpic", epicId: "EPIC-17", actor: "Codex", role: "maintainer",
    reason: "Close S666 with its measured DGS Pattern-mode failure and make the evidence-based S667 Design-mode check current.",
    patch: { description: epicDescription },
  },
  { type: "editItem", itemId: "EPIC-17", patch: { description: epicDescription } },
  { type: "editItem", itemId: "G04-V03", patch: { description: v03Description } },
  {
    type: "addEvidence", itemId: "G04-V03",
    evidence: {
      id: "E-G04-S666-EXIT", kind: "document",
      uri: "docs/research/epic17/S666-dgs-native-grainline-calibration/S666-exit-packet.md",
      verified: true,
      note: "S666 independently inspects the synthetic control, records actual DGS settings and warning/render, executes one approved native grainline recreation that leaves the warning, and stops this exact Pattern-mode candidate before export. S667's single Design-mode follow-up is justified by the repeated Pattern warnings and the manual's separate Design choice.",
    },
  },
  { type: "addEpicEvidence", epicId: "EPIC-17", evidenceId: "E-G04-S666-EXIT", actor: "Codex", role: "maintainer" },
  {
    type: "addComment", itemId: "G04-V03", actor: "Codex",
    text: "S666's exact AutoCAD/Pattern candidate failed: DGS reported one grainline-outside-border warning although the source has zero grainline entities; the warning remained after one selected-pattern native recreation. The render also contains unexpected internal strokes. No export/reimport was attempted. S667 changes only the documented Pattern/Design choice on the existing S664 source-matched Polo M candidate to determine whether Design mode is a viable clean exchange path. See S666 gate delta and completion plan. All thresholds and V03 acceptance remain unchanged.",
  },
];

for (let i = 0; i < commands.length; i += 1) {
  const command = { ...commands[i], expectedRevision: board.revision };
  board = applyBoardCommand(board, command, { now: "2026-10-10T09:32:10.000Z" });
  await writeFile(new URL(`S666-exit-command-${String(i + 1).padStart(2, "0")}.json`, dir), `${JSON.stringify(command, null, 2)}\n`);
}
assert.equal(board.revision, 3907);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert(board.epics.find(({ id }) => id === "EPIC-17")?.evidenceRefs.includes("E-G04-S666-EXIT"));
assert(board.workItems.find(({ id }) => id === "G04-V03")?.evidenceRefs.includes("E-G04-S666-EXIT"));
console.log("S666 exit preflight passed: validated commands 3901→3907; V03/Epic remain in progress; V02 remains Done.");
