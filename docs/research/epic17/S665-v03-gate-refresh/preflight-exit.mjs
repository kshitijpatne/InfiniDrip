import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = new URL(".", import.meta.url);
let board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
assert.equal(board.revision, 3889, "S665 exit must replay on the S665 start board");

const epicDescription = "EPIC-17/G04 remains In Progress through admitted V01→V02→V03 and safe merge. V01/V02 are Done; S459 accepted all seven recipes, 73 supported configurations and 146 front/back faces. Preserve V02-before-V03, legacy DXF behavior and protected export identities. V03 remains unqualified. The authorized local GetonAgain DGS session is signed in; executable file version 2023.1.0.0, About VID:20250610 (V2024.1 is the manual/package). The maintainer-approved S662 source-derived LINE/GRAINLINE mapping was tested in S664; DGS warned grainline outside border on 9/9. S661's no-grainline input showed the same warning. These exact candidates fail; cause and broader DXF support remain unproven. S665 records the gate matrix and bounded route. Next S666: one C:-only native DGS grainline calibration with exact settings recorded, fixed geometry/units/frame, precision at 0.001 cm, one parse and one reimport. Stop the DGS candidate on inability to prove precision or unresolved loss; no permutations. Preserve all-seven/options/grades, fixed thresholds, C04 sidecar limits, V02 holds, legacy DXF, protected identities and final gates. No ANSI/AAMA or ASTM conformance, physical-fit, factory-acceptance or production-readiness claim. Current state: PROJECT-STATE.md; S665 packet: docs/research/epic17/S665-v03-gate-refresh/S665-exit-packet.md.";
const v03Description = "Qualify one rights-reviewed industrial CAD receiver/profile with representative import/export/round trips across all seven recipes and supported options/grades. Preserve the fixed 0.001 cm geometry gate, units, piece/grade identity and relations, seams/marks, malformed-input rejection, repeatability, readable rendered output, legacy DXF and protected export identities. Do not infer ANSI/AAMA or ASTM conformance from a vendor menu label. GetonAgain DGS local evaluation rights, local handling and sign-in are settled; executable file version 2023.1.0.0 / About VID:20250610. The user-approved S662 source mapping was tried once in S664: all nine pieces loaded but all nine received grainline-outside-border warnings. S661's no-grainline fixture showed the same symptom. Reject those exact candidates; DGS cause and broader profile remain unproven. S665 gate matrix and prioritized plan: docs/research/epic17/S665-v03-gate-refresh/. Next S666 is one C:-only native-grainline calibration, then one source-matched Polo pilot only on measurable, warning-free success. Preserve every admitted gate and hold; no standards, fit, factory or readiness claim.";

const commands = [
  {
    type: "editEpic", epicId: "EPIC-17", actor: "Codex", role: "maintainer",
    reason: "S665 reconciles current V03 evidence and replaces obsolete approval-pending/profile claims with verified S664/S665 results and the bounded next gate.",
    patch: { description: epicDescription },
  },
  { type: "editItem", itemId: "EPIC-17", patch: { description: epicDescription } },
  { type: "editItem", itemId: "G04-V03", patch: { description: v03Description } },
  {
    type: "addEvidence", itemId: "G04-V03",
    evidence: {
      id: "E-G04-S665-EXIT", kind: "document",
      uri: "docs/research/epic17/S665-v03-gate-refresh/S665-exit-packet.md",
      verified: true,
      note: "S665 reconciles every V03 gate after S664, records the bounded reviewed route and S666 stop conditions, and preserves all acceptance, holds, thresholds and profile/conformance claim limits.",
    },
  },
  { type: "addEpicEvidence", epicId: "EPIC-17", evidenceId: "E-G04-S665-EXIT", actor: "Codex", role: "maintainer" },
  {
    type: "addComment", itemId: "G04-V03", actor: "Codex",
    text: "S665 closes the current V03 reconciliation without changing any gate. The approved S662 mapping was tested in S664 and the exact LINE/GRAINLINE candidate failed 9/9; S661's no-grainline input showed the same warning, so the internal cause and broader DGS DXF support remain unproven. The next authorized action is one C:-only native DGS grainline calibration with fixed geometry/settings, a 0.001 cm evidence stop, one parse and one reimport. No format/entity/mode/settings permutations. See S665 matrix, plan, reviewer disposition and exit packet.",
  },
];

for (let i = 0; i < commands.length; i += 1) {
  const command = { ...commands[i], expectedRevision: board.revision };
  board = applyBoardCommand(board, command, { now: "2026-10-10T09:00:00.000Z" });
  await writeFile(new URL(`S665-exit-command-${String(i + 1).padStart(2, "0")}.json`, dir), `${JSON.stringify(command, null, 2)}\n`);
}

assert.equal(board.revision, 3895);
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.epics.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert(board.epics.find(({ id }) => id === "EPIC-17")?.evidenceRefs.includes("E-G04-S665-EXIT"));
assert(board.workItems.find(({ id }) => id === "G04-V03")?.evidenceRefs.includes("E-G04-S665-EXIT"));
console.log("S665 exit preflight passed: validated commands 3889→3895; statuses unchanged.");
