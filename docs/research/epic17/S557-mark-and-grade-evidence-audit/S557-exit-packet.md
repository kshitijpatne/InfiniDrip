# EPIC-17 / G04 V03 — Mark and grade evidence audit — Slice 557 exit

## Result

S557 completes a hash-pinned audit of the retained seven-recipe CLO DXF-AAMA
cohort and its available rendered evidence, and checks the actual export path
for source-backed grading. The report is generated only under
`C:\G04-CLO-DXF-Exchange\S557-mark-and-grade-evidence-audit\Evidence`.
The seven generation-two DXFs match the previously recorded hashes and all
declare `$ACADVER=AC1009`. AC1009 identifies a DXF database version, not an
AAMA edition or conformance claim.

The retained cohort has 41/41 uniquely identified SEW-based piece blocks
across all seven recipes. Its output has nine mixed CUT/SEW semantic layer
assignments; every recipe has at least one. The source audit found 100 mark
entities total: 22 exact direct-geometry matches and 78 without a direct
same-kind/geometry match. The latter count does not prove those marks were
lost; transformed, split, and generated output representations were not
fully semantically decoded. By recipe, direct-match gaps are Tee 0, Fitted 0,
Polo 25, Woven 29, Tank 0, Trouser 29, and Skirt 0. Polo additionally retains
the five known CUT contours outside tolerance. The saved CLO screenshots
show major piece presence and layout, but their scale cannot establish small
mark preservation. The semantic audit reports no ambiguous block identities;
it is not a profile-conformance certification.

All seven retained DXF fixtures are size M/default. Repository inspection
confirms that `src/export/dxf.ts` exports the `Piece[]` it receives and the
current UI builds that list for one selected size (`src/ui/app.ts` around
4357 and 4550). No genuine multi-size/grade DXF fixture with an authoritative
source relationship was found. Separately drafted sizes or CLO's menu label
“Graded Nest” are not grade-interchange evidence. Therefore grades and the
full supported option matrix remain unestablished.

The maintainer's written confirmation settles that the trial may be used for
InfiniDrip product-development DXF evaluation and that DXF processing is
local. This is digital technical-flat and CAD-interchange product work, not
garment production, physical sampling, or a fit/factory claim.

## Correction to S556

S556 incorrectly treated an independent second receiver as a required V03
gate. The admission's V03 acceptance criterion requires a documented
industrial profile and representative round trip, selected after rights
review; it does not require a second application. A same-app CLO round trip
may count if CLO's exact profile, rights evidence, and all other gates pass.
A second receiver is optional assurance. The correction is recorded in
`S557-scope-correction.md` and in the current matrix below. The change removes
only that extra, unadmitted prerequisite; it does not claim CLO is qualified
or alter any admitted acceptance criterion.

## Remaining V03 disposition

- **Still failing:** five Polo CUT contours exceed the 0.001 cm limit by
  0.01274–0.01399 cm; tested layer 8 mixes CUT and SEW; the tested malformed
  input was silently accepted while an inset SEW contour disappeared.
- **Still unproven:** exact industrial profile/edition and rights-reviewed
  profile mapping; semantic disposition of unmatched marks; grade and
  representative supported-option interchange; fine-detail rendered review.
- **Limited evidence only:** seven M/default recipes, 41 unique piece
  identities, and two generations have been observed. Same-app round trip is
  permissible evidence but these failures and gaps prevent acceptance.
- **No new CLO scenario:** this slice used retained files only. The app
  remains open for any later evidence-backed test; no action was taken in the
  inconsistent visible/accessibility state previously observed.

No source pattern, stitch graph, production code, export baseline, tolerance,
legacy behavior, protected byte identity, or acceptance criterion changed.
All seven-recipe and V03 holds remain. No physical-fit, factory-acceptance,
or production-readiness claim is made.

## Verification and timing

- The audit was run twice against the same hash-pinned cohort; both generated
  the same report hash. `node --check` passed for the audit and board helper
  scripts. `npm run control-center:test` passed 42/42; `git diff --check`
  and board validation/replay passed.
- No production source/tests changed, so no full repository coverage gate is
  due. No new CLO import/export was performed.
- Start: 2026-10-08 23:52:28 UTC from S556 `66e087dc9f88d560ef2024be85189a63d68fe16b`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. Start board revisions 3341→3343; exit replay reaches 3345; G04-V03 remains In Progress.
- Elapsed 23:52:28–00:02:00 UTC (9m32s): retained-file/hash/render audit ~3m30s; grade/export-path inspection ~1m; durable matrix/state/board closeout and focused verification ~5m02s; implementation 0m; external-agent waits 0m; maintainer-decision time 0m.
- The report hash was identical across two runs. The two captured run logs also match at SHA-256 `E9EA28023E9463EAD5D98052364B643C9C610CB4FFD9D46AD7C94A39216E25AC`.

## Next action

Use current authoritative publisher evidence to identify what CLO's selected
DXF-AAMA mode claims, and whether that exact profile/build can be documented
as an industrial apparel-CAD exchange profile. Do not repeat known geometry,
unit, option, or malformed-file trials. If the claim cannot be established,
keep the profile gate held and assess only a new evidence-backed route. The
second receiver is optional, not a closure dependency.
