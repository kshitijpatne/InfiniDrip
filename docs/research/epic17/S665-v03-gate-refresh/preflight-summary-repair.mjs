import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { applyBoardCommand } from "../../../../ops/control-center/commands.mjs";

const dir = new URL(".", import.meta.url);
let board = JSON.parse(await readFile(new URL("../../../../ops/control-center/data/board.json", import.meta.url), "utf8"));
assert.equal(board.revision, 3895);
const description = "EPIC-17/G04 remains In Progress through admitted V01→V02→V03 and safe merge. V01 and V02 are Done. S459 accepts all seven recipes, 73 supported configurations and 146 front/back faces. Woven's 56 local faces pass the approved S457 front mask and local-Y back/band placement. S406's approved view-only collar-over-plackets order remains implemented. Admission: docs/planning/EPIC-17-ADMISSION.md. Preserve V02-before-V03, legacy DXF behavior and protected export identities. V03 remains In Progress and no technical exchange gate has passed. GetonAgain DGS local evaluation rights, local handling and sign-in are settled; executable file version 2023.1.0.0 / About VID:20250610 (V2024.1 is the manual/package). The user-approved S662 source-derived LINE/GRAINLINE mapping was tested in S664; DGS warned grainline outside border on 9/9. S661's no-grainline input showed the same warning. These exact candidates fail; cause and broader DXF support remain unproven. S665 records the gate matrix, reviewed shortest route and stop conditions. Next S666: one C:-only native DGS grainline calibration with exact settings recorded, fixed geometry/units/frame, precision at 0.001 cm, one parse and one reimport. Stop the DGS candidate on inability to prove precision or unresolved loss; no permutations. Preserve all-seven/options/grades, fixed thresholds, C04 sidecar limits, V02 holds, legacy DXF, protected identities and final gates. No ANSI/AAMA or ASTM conformance, physical-fit, factory-acceptance or production-readiness claim. Current state: PROJECT-STATE.md; S665 packet: docs/research/epic17/S665-v03-gate-refresh/S665-exit-packet.md.";
const commands = [
  {
    type: "editEpic", epicId: "EPIC-17", actor: "Codex", role: "maintainer",
    reason: "Restore protected V02 admission summary wording after S665 gate reconciliation while retaining the verified current V03 status.",
    patch: { description },
  },
  { type: "editItem", itemId: "EPIC-17", patch: { description } },
];
for (let i = 0; i < commands.length; i += 1) {
  const command = { ...commands[i], expectedRevision: board.revision };
  board = applyBoardCommand(board, command, { now: "2026-10-10T09:04:00.000Z" });
  await writeFile(new URL(`S665-summary-repair-${String(i + 1).padStart(2, "0")}.json`, dir), `${JSON.stringify(command, null, 2)}\n`);
}
assert.equal(board.revision, 3897);
assert.equal(board.epics.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
const card = board.workItems.find(({ id }) => id === "EPIC-17");
assert(card.description.includes("docs/planning/EPIC-17-ADMISSION.md"));
assert(card.description.includes("S459 accepts all seven recipes, 73 supported configurations and 146 front/back faces"));
console.log("S665 summary repair preflight passed: validated commands 3895→3897; Epic status unchanged.");
