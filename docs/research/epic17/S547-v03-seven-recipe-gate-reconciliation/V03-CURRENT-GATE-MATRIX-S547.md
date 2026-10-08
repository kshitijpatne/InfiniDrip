# G04 / V03 current evidence matrix — Slice 547

Reviewed 2026-10-08 after S546. This table keeps bounded observations,
failures, and unknowns distinct. It does not revise V03 acceptance.

| V03 gate | Current disposition | Evidence and limits |
|---|---|---|
| Trial purpose and local handling | **Authorized for this bounded test** | Maintainer's written confirmation recorded in S538 and reaffirmed in this thread covers product-development evaluation and local DXF processing. This is the maintainer's evidence, not independent legal review. All exchange artifacts in the recent CLO run are under the named C: folders. |
| Receiver/build identity | **Observed, not independently qualified** | CLO 2026.1.310 (r58944) was used for the practical tests. Same-app import/export/re-import is observed behavior, not independent receiver acceptance. |
| Named industrial profile/edition | **Not established** | CLO's UI labels a DXF-AAMA mode; it does not name a normative edition or conformance mapping. ASTM D6673-10 is withdrawn; D6673-04 is historical, calls for R13, and does not establish current AAMA-292A status. The S541 `AC1009` audit was for the older mixed AAMA/ASTM cohort and cannot be transferred to S545's fresh AAMA files without inspecting those bytes. No exact current profile may be claimed from the menu label. See S533, S541–S543. |
| Seven-recipe fixture presence and two generations | **Pass, limited to M/default fixtures** | S523 exchanges Fitted, Tank, Skirt, and Trouser twice; S545 exchanges Tee, Polo, and Woven twice. Together these are all seven current recipes under the core DXF-AAMA, centimeter, 100%, no-rotation route. The 41 expected pieces were present in their per-slice imports/exports. This does not cover the options/grade matrix. |
| Closed CUT/SEW geometry at `0.001 cm` | **Fail for the combined seven-recipe cohort** | Generation 2: S523's 34/34 contours pass; S545's Tee 6/6 and Woven 24/24 pass; Polo passes only 13/18. Thus 77/82 pass and the same five Polo cuts fail in both generations at 0.01274–0.01399 cm. S546 records the evidence reconciliation and rejected analyzer attempt; no new CLO result. |
| Piece identity / expected piece count | **Pass for these M/default fixtures** | S523 and S545 report expected imports/blocks/pieces; S525's earlier all-seven audit maps 41/41 pieces to output blocks, but its Tee/Polo/Woven exports were ASTM mode. It supports identity observation, not full semantic interchange in one qualified AAMA receiver. |
| CUT/SEW/profile semantics | **Failed / unresolved** | In S545's new AAMA outputs, layer `8` contains both CUT and SEW contours for Tee, Polo, and Woven; S523/S525 establish the same ambiguity in the other four AAMA outputs and prior audit cohorts. S539 found no common entity-attribute discriminator on shared layer `8`. Numeric layer identity cannot reliably communicate CUT versus SEW in the tested cohort. |
| Other marks/notches/labels | **Not established** | S525 found 78 of 100 source marks without a direct same-kind/same-geometry match across its seven historical outputs; this does not itself prove loss because transformed/split/generated geometry was not semantically interpreted. The current AAMA trio has not received a complete source-to-receiver mark interpretation. |
| Size/grade behavior and supported options | **Not established** | All seven practical fixtures are M/default. `Graded Nest` is a UI export mode, not evidence of exact native size/grade relationships or all-option behavior. No representative multi-size/grade matrix passed. |
| Malformed-input behavior | **Failed for the tested negative fixture** | S531's malformed AAMA DXF was accepted silently while an inset SEW contour disappeared. This is a concrete failure for the tested CLO build/settings, not a claim about all receiver builds. |
| Re-import / generation two | **Partial pass** | All seven M/default fixtures were exported and re-imported for a second generation. Geometry remains within the gate except the five Polo cuts. This is same-app replay, not independent industrial-profile acceptance. |
| Rendered output | **Pass only for gross presence/readability check** | S523 and S545 captures show expected major pieces. These are not technical-design certification or a substitute for the geometry/semantic gates. CLO's Custom-mode seam-allowance notice was observed and understood; it is not the contour failure. |

## What this means

The written permission question and desktop targetability are resolved. The
remaining obstacle is now evidence, not a missing user action: the tested
CLO route has a real Polo contour failure, mixed CUT/SEW output semantics, a
bounded malformed-input failure, and no exact documented industrial profile
or grading/mark proof. More repetitions of the same CLO profile/settings will
not clear those gates. Do not claim V03 pass or general CLO incompatibility.

## Next action

Qualify a concrete alternative receiver/profile from primary documentation
before moving any more pattern files. Require its exact build and applicable
rights, local processing boundary, normative apparel profile, import/export
directions, grading/mark contract, and a measurable round-trip path. Existing
candidate screens must be reused: Seamly2D lacks DXF import; Valentina is
documented here for DXF export; Open Patterns has no DXF writer; OpenMarker
has no export; Pixie had no verifiable C:-only output path in S524; GetonAgain
free-build rights/build/locality are unresolved; and Richpeace candidates are
not qualified for this device/profile. Do not reopen those candidates without
a new specific primary-source fact. If no new eligible candidate exists, bring
the exact evidence-backed choice between retaining the unmodified V03 hold and
a separately approved scope amendment; do not weaken any gate silently.

## Source packets

- Permission/local handling: `S538-clo-authorization-control-recheck/S538-exit-packet.md`.
- Seven recipe cohorts: `S523-clo-remaining-recipes-roundtrip/S523-exit-packet.md`;
  `S545-clo-target-recovery/S545-exit-packet.md`.
- CUT/SEW/marks: `S525-clo-semantic-layer-audit/S525-exit-packet.md`;
  `S539-clo-semantic-attribute-audit/S539-exit-packet.md`.
- Negative input: `S531-clo-negative-input-control/S531-exit-packet.md`.
- Profile/version: `S533-apparel-dxf-profile-evidence/S533-exit-packet.md`;
  `S541-dxf-header-profile-audit/S541-exit-packet.md`;
  `S542-clo-version-selector-audit/S542-exit-packet.md`;
  `S543-current-apparel-dxf-profile-screen/S543-exit-packet.md`.
- Latest contour reconciliation: `S546-polo-contour-delta-diagnosis/S546-exit-packet.md`.
