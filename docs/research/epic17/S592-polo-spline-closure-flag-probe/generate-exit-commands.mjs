import { writeFile } from "node:fs/promises";

const dir = "docs/research/epic17/S592-polo-spline-closure-flag-probe";
const description = "EPIC-17/G04 remains In Progress through admitted V01→V02→V03 and safe merge. Admission: docs/planning/EPIC-17-ADMISSION.md. V01 and V02 are Done; S459 accepts all seven recipes, 73 supported configurations and 146 front/back faces. Woven's 56 local faces pass the approved S457 front mask and local-Y back/band placement. S406's approved view-only collar-over-plackets order remains implemented. Written product-development/local-file-processing permission and the narrow CLO 2026.1.310 / DXF-AAMA test identity are recorded. S591's exact-source degree-1 SPLINE failed five Polo M CUT contours at 0.841822–13.113897 cm. S592 changed only the closed flag on those five SPLINEs; nine SEW and four unaffected CUT contours pass, while back and four collar CUT contours still fail at 4.063040 and 0.159193–0.467258 cm. Clearing the flag materially improves output but does not meet 0.001 cm. These results reject only tested fixtures/build/profile and do not infer CLO internals. Details: docs/research/epic17/S591-polo-degree1-spline-probe/S591-exit-packet.md and docs/research/epic17/S592-polo-spline-closure-flag-probe/S592-exit-packet.md plus V03-CURRENT-GATE-MATRIX-S592.md. Next S593 maps all receiver CUT candidates to source segment/vertex neighborhoods using recorded outputs; no further encoding trial absent one bounded source-exact hypothesis. Preserve V02-before-V03, legacy DXF behavior and protected export identities, all-seven scope and every V03 gate. No universal format, physical-fit, factory-acceptance or production-readiness claim.";
const commands = [
  {
    type: "editEpic", expectedRevision: 3487, epicId: "EPIC-17", actor: "Codex", role: "maintainer",
    reason: "Record S592's measured SPLINE closure-flag round trip and bounded S593 diagnosis without changing Epic status or V03 gates.",
    patch: { description },
  },
  {
    type: "editItem", expectedRevision: 3488, itemId: "EPIC-17", patch: { description },
  },
  {
    type: "addEvidence", expectedRevision: 3489, itemId: "G04-V03", evidence: {
      id: "E-G04-S592-EXIT", kind: "document",
      uri: "docs/research/epic17/S592-polo-spline-closure-flag-probe/S592-exit-packet.md",
      verified: true,
      note: "One clean CLO 2026.1.310 DXF-AAMA exchange of five source-exact degree-1 SPLINE Polo CUT paths with only group 70 closed bit cleared: 9/9 SEW and four other CUTs pass; back and four collar CUT contours improve but still fail 0.001 cm at 0.159193–4.063040 cm. Tested variant rejected only; all V03 gates remain.",
    },
  },
  {
    type: "addComment", expectedRevision: 3490, itemId: "G04-V03", actor: "Codex",
    text: "S592 completed one clean-scene CLO 2026.1.310 DXF-AAMA round trip after changing only SPLINE group 70 from 25 to 24 on five source-exact Polo M CUT entities. The source-side proof is zero deviation; CLO rendered nine pieces without a format error. Nine SEW and four unaffected CUT paths pass. The back and four collar CUT bounds improve versus S591 but remain 4.063040 and 0.159193–0.467258 cm, over the unchanged 0.001 cm gate. The tested variant is rejected for this build/profile/fixture only; no undocumented cause is inferred, and no V03 gate or source geometry changes. PDF/PNG, project, fixture/output hashes and analysis are in the S592 packet. Next S593 maps every receiver CUT candidate to source segment/vertex neighborhoods; no further encoding trial without a bounded source-exact hypothesis.",
  },
];
for (const [index, command] of commands.entries()) {
  await writeFile(`${dir}/S592-exit-${["edit-epic", "edit-item", "add-evidence", "add-comment"][index]}.json`, `${JSON.stringify(command, null, 2)}\n`);
}
console.log("Wrote four S592 exit command files for expected revisions 3487→3491.");
