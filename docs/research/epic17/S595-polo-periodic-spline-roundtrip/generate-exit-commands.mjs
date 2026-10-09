import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const directory = "docs/research/epic17/S595-polo-periodic-spline-roundtrip";
const board = JSON.parse(await readFile("ops/control-center/data/board.json", "utf8"));
assert.equal(board.revision, 3508, "refusing stale S595 exit command generation");
assert.equal(board.workItems.find(({ id }) => id === "EPIC-17")?.status, "In Progress");
assert.equal(board.workItems.find(({ id }) => id === "G04-V02")?.status, "Done");
assert.equal(board.workItems.find(({ id }) => id === "G04-V03")?.status, "In Progress");

const description = "EPIC-17/G04 remains In Progress through admitted V01→V02→V03 and safe merge. Admission: docs/planning/EPIC-17-ADMISSION.md. V01 and V02 are Done; S459 accepts all seven recipes, 73 supported configurations and 146 front/back faces. Woven's 56 local faces pass the approved S457 front mask and local-Y back/band placement. S406's approved view-only collar-over-plackets order remains implemented. Maintainer authorization for CLO product-development use and local-only file handling is recorded. S595 independently proves five Polo M periodic degree-1 SPLINE inputs source-exact (1,603 samples; 0 cm residual); one CLO 2026.1.310 DXF-AAMA generation returns nine pieces, passes 4/9 CUT and 9/9 SEW, and fails five CUT contours (back, both stands, both pointed collars) under 0.001 cm. The periodic encoding is rejected for this tested receiver; no CLO cause is inferred and no V03 gate clears. See docs/research/epic17/S595-polo-periodic-spline-roundtrip/S595-exit-packet.md and V03-CURRENT-GATE-MATRIX-S595.md. Next S596 must identify a specific source- and receiver-measurable entity-translation/stage question before another trial. Preserve V02-before-V03, legacy DXF behavior and protected export identities; retain all-seven scope and every rights/profile/identity/semantics/marks/grades/negative/repeated-round-trip gate. No universal compatibility, physical-fit, factory-acceptance or production-readiness claim.";
const commands = [
  { type: "editEpic", expectedRevision: 3508, epicId: "EPIC-17", actor: "Codex", role: "maintainer", reason: "Record S595 periodic SPLINE source proof and the measured five-contour CLO failure; preserve all G04 V03 gates and statuses.", patch: { description } },
  { type: "editItem", expectedRevision: 3509, itemId: "EPIC-17", patch: { description } },
  { type: "addEvidence", expectedRevision: 3510, itemId: "G04-V03", evidence: { id: "E-G04-S595-EXIT", kind: "document", uri: `${directory}/S595-exit-packet.md`, verified: true, note: "S595 proves five periodic degree-1 Polo M SPLINE inputs source-exact (1,603 samples, 0 cm residual); the authorized local CLO DXF-AAMA generation passes 4/9 CUT and 9/9 SEW and fails back, both stands, and both pointed collars under 0.001 cm. No V03 gate clears." } },
  { type: "addComment", expectedRevision: 3511, itemId: "G04-V03", actor: "Codex", text: "S595's exact periodic degree-1 source candidate was imported/exported once in the authorized local CLO 2026.1.310 DXF-AAMA trial. It returned nine pieces, passed all nine SEWs and four CUTs, and failed five CUTs: back 4.063040 cm; outer/inner stands 9.311107947/9.311054798 cm; upper/under collars 0.159214023/0.159193055 cm, against the unchanged 0.001 cm gate. Independent source proof is exact across 1,603 samples, so the receiver trial rejects this encoding; it does not establish CLO's internal cause or clear a V03 gate. The inspected snapshot is gross piece-presence evidence only. Permission and local handling are confirmed; files remained in the S595 C: folder. See docs/research/epic17/S595-polo-periodic-spline-roundtrip/S595-exit-packet.md. Next S596 identifies a measurable candidate before any receiver trial; preserve all seven recipes and every remaining V03 gate." },
];
const names = ["edit-epic", "edit-item", "add-evidence", "add-comment"];
for (let index = 0; index < commands.length; index += 1) {
  await writeFile(`${directory}/S595-exit-${names[index]}.json`, `${JSON.stringify(commands[index], null, 2)}\n`);
}
console.log("Wrote S595 exit commands for expected revisions 3508→3512.");
