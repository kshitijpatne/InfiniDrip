# EPIC-17 / G04 V03 — evidence-led completion plan — Slice 660

## Receiver decision

Choose one **empirical test hypothesis**, not a qualified apparel profile:
GetonAgain DGS `VID:20250610`, executable SHA-256
`97CBBEFCAAD74EF558D19695F898611F7FE0E8E503525D0832EECAC01C859EB0`, using
the observed local `AutoCAD` DXF import mode for the existing generic R14
fixture. Its actual path is
`C:\G04-CLO-DXF-Exchange\S648-getonagain-fixture-preflight\Input\polo-m-idr-profile-r14-first.dxf`,
153,647 bytes, SHA-256
`ABB6282723B9A4198F6DE54D5A1CFA70D5784455402D5FBD25E7791456B87461`.
That source is generic DXF AC1014 with named piece blocks and custom XDATA;
no source proves it implements GetonAgain's AutoCAD route contract. Selecting
the mode because it is the closest empirical hypothesis does not establish
format compatibility. Make no ANSI/AAMA, ASTM, or factory-profile claim.

Before import, make a byte-identical copy under a new S661 folder in
`C:\G04-GetonAgain-CAD-Exchange\` and verify the hash. Freeze the import
settings from the S659 UI contract: Pattern, Import text on, Grainline 2-way,
Unit of file, Only base size off, Recognize seam on, Nest pattern off. The
manual recommends avoiding nesting for fidelity checks. Do not rotate, scale,
repair, or try another mode/setting.

## Measurement and evidence method

The repository has no installed DXF parser dependency. The separate local
MIT `dxf-parser@1.1.2` package at
`C:\G04-CLO-DXF-Exchange\Tools\open-patterns-astm-parser\node_modules\dxf-parser`
successfully parsed the S648 input read-only, including its nine top-level
piece INSERTs, 11 named blocks and 56 nested geometry/mark entities. This is
an independent DXF read-back library; the Open Patterns importer itself was
previously rejected and is not the receiver. Use the parser on the source and
actual GetonAgain-exported DXF to compare entity types/layers, block and piece
identity, units, geometry coordinates and mark locations/values at the fixed
`0.001 cm` tolerance. Preserve an actual DGS whole-layout and detail screenshot
for visible joins, marks, warnings and readability. Screenshots alone cannot
pass numeric geometry. If DGS cannot produce an export or the parser cannot
recover enough coordinates/roles to verify the gate, record an evidence-
capability stop; do not infer pass or failure from appearance.

This end-to-end round trip does not claim to inspect private intermediate
native geometry before export. It establishes only what the exact input,
build, mode and settings produce through re-export. A C04-compatible,
version-matched sidecar can carry permitted grade/piece/seam relationships;
it must be explicitly prepared, integrity-bound and associated. The S648
fixture currently has no such sidecar, and its XDATA does not establish seam
relationships. No sidecar can compensate for missing or changed CUT/SEW
geometry or visible marks.

## Prioritized work and decisive checks

| Order | Work | Decisive verification | Stop condition |
|---:|---|---|---|
| 1 | S661 preflight and one Polo M pilot. Copy/hash-check S648 into the dedicated GetonAgain S661 folder; freeze the exact build/mode/settings; import once; record every dialog value and warning; inspect DGS output; export once only if import and output inspection show no decisive failure. Inspect the export dialog once. The S653 manual says RUL export omits quilt/sew lines, so select a documented no-RUL route if available for the geometry-bearing DXF; record any remaining mark/grade limitation. | Independent parse of source and exported DXF plus DGS rendered whole/detail views: all CUT/SEW paths and required marks/values retain source identity/placement and remain within `0.001 cm`; correct units/transform; no loss warning; named piece/revision identity preserved or explicitly bound through a prepared C04 sidecar; output readable. | Stop this exact input/build/AutoCAD-mode/settings route on a measured fidelity, warning, output, or evidence-capability failure. Do not generalize to other DGS modes. If export mode cannot preserve required SEW geometry, stop this route; no RUL/no-RUL permutation. |
| 2 | Only after the pilot's geometry/marks/units/output pass, prepare a version-matched C04 sidecar from existing source identity/stitch/grade data and prove integrity binding to the exact DXF, garment revision and piece IDs. | Independent sidecar/schema/hash validation and deliberate mismatch/replacement rejection; relation checks match the source topology; documented unsupported fields remain explicit. | Missing source relation package or inability to bind/reject mismatch leaves identity/relationships and grade gates unproven; stop before breadth. Do not require unsupported fields inside DXF if the approved C04 sidecar contract is satisfied. |
| 3 | Run invalid-input controls next, then repeatability. Reuse existing S531 malformed/invalid cases and S626 controls; if the route passes negatives, perform two frozen-revision round trips with the exact same mode/settings and prepared sidecar. | Every invalid fixture is explicitly rejected with no partial output, silent repair or clamp; both round trips preserve geometry, marks, units, identity and sidecar association. | Any silent acceptance/omission, output drift, lost sidecar, or non-repeatability stops this candidate before the large matrix. CLO/OpenCAD results remain candidate-specific. |
| 4 | Only after orders 1–3 pass, replay S627's corrected 73-row/seven-recipe cohort and S559/S562 grade fixtures through the same pinned route/sidecar; perform relevant renders and final G04 mapped MQF reviews. | Every supported recipe/option/grade passes fixed source-bound gates; output review confirms no joins, crossings, missing marks or unreadable details; complete global 100% test/coverage, build/browser/Electron and protected-output gates. | Any failure holds V03 and all-seven acceptance; no subset compatibility claim. |
| 5 | Final review and delivery. | Final output review, PR review, safe merge, `origin/main` ancestry and required automatic deployment success. | Any required gate/deploy failure keeps Epic open. |

## Estimates and preserved conditions

S649's former estimate is stale. The current local route and sign-in are
available, and S660 has verified an independent read-back parser on the exact
input, but no GetonAgain fixture has been imported. The next work is one
representative pilot plus the sidecar preflight (1–2 evidence slices). If it
passes, expect 2–4 more slices for negatives, repeated rounds and the 73-row/
grade breadth, then 2–3 integration/PR/merge/deployment slices. If the pilot
fails, stop this exact route and re-estimate from the measured cause; another
mode is not presumed. These are conditional ranges, not delivery promises.

Keep all-seven recipes, supported options and grades, every V03 gate, the
`0.001 cm` threshold, C04 sidecar rules, legacy DXF behavior, protected export
byte identities, and all existing holds unchanged. No source geometry repair,
new recipe, physical sampling, fit claim, factory acceptance or production-
readiness claim is in scope.
