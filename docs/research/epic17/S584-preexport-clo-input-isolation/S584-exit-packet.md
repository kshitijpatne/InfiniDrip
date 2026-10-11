# EPIC-17 / G04 V03 — CLO pre-export input isolation — Slice 584 exit

## Result

S584 opened the hash-pinned S574 project saved after Polo M input import and before any export in the already-running CLO 2026.1.310 session. The selected file was `clo-after-line-chain-import.zprj`, SHA-256 `43AB4CD6DE6A823CF671BF7FE748ABC4052744A396E3DBCB0FE9539055D39E25`. The CLO open dialog accepted its default `Open`/`Garment` load settings, completed its garment-load progress, and returned to the nine-piece pattern workspace. The CLO Python Editor then ran one read-only S584 script capture; the script path and intended project path are visible in the saved editor screenshot and encoded in the resulting JSON.

`GetPatternCount` returned 9; `GetPatternPieceName` returned indexes `0`–`8`; `GetPatternInputInformation(index)` returned a string parsing as JSON for all nine indexes. There were zero getter-call errors and zero JSON parse errors. No DXF was imported/exported, no source or project geometry was edited, and no CLO project was saved.

## Geometry comparison and stage result

The comparison uses S574's hash-pinned Polo M source and line-chain derivative, fixed 10 mm/source-cm scale, x unchanged, y sign tested, translation only, cyclic/reverse point order allowed, and no scale or free rotation. The unchanged acceptance gate remains 0.001 cm = 0.01 mm.

- Eight of nine indexed point paths have at least one within-gate candidate, all on literal source `SEW` contours; none matches a literal source `CUT` contour.
- Index 3 remains an unmatched four-point 3 mm diamond. Index 4 has two repeated rectangular `SEW` candidates; indexes 7 and 8 each have two repeated 44-point `SEW` candidates. These ambiguities remain unresolved.
- The maximum residual among the within-gate S584 source candidates is 0.0002442505 mm. This is a geometry comparison against source `SEW`, not proof that CLO gives those paths a sewing or cutting role.
- S584 and S583 have matching indexes, names, point counts and per-index source-contour candidate sets. Their returned JSON and parsed getter values are not byte/deep identical. The maximum direct coordinate delta at corresponding point positions is 0.000244140625 mm. No tolerance was changed; the measured delta is below the 0.01 mm acceptance gate.

The specific getter geometry observed in S583 is therefore also present in the selected saved **pre-export** project. The getter documentation does not define CUT/SEW semantics or promise that this list is the pattern boundary, so this does not establish that CLO's importer caused a manufacturing-geometry loss. Separately, S574/S575 directly measured the generation-one DXF: no source CUT contour has an accepted path match in the saved output under the unchanged gate. That remains a concrete failed round-trip result. S584 clears no technical compatibility gate and changes no V03 scope or claim.

## Diagnostics and evidence

The first stage-comparison helper attempt incorrectly required the complete floating-point report to be deeply identical. It failed because corresponding point values differ slightly between captures and residual ordering swaps repeated-shape candidates. This was an analyzer assertion that was too strict, not an app/API failure. The corrected helper compares point counts, per-index source-candidate sets, and measured corresponding-point deltas. Its diagnostic is preserved in the named C: evidence folder.

All live-app inputs/outputs and screenshots are confined to `C:\G04-CLO-DXF-Exchange\S584-preexport-clo-input-isolation` and the previously hash-pinned S574 folder. S584 does not invoke cloud features. The maintainer has confirmed written product-development rights and local file processing; no further rights/locality check is outstanding.

- Raw getter JSON: `Evidence\preexport-pattern-input-information.json`, SHA-256 `E422018EB0735BB4C34004506CCF5B53C810C83FEC4BA8F48EDE1B38515B4736`.
- Fixed source comparison: `Evidence\preexport-source-geometry-comparison.json`, SHA-256 `F27D933AE2F0342C6E7E8044395A2F3D238400EBC08F33A02C5083424E66BF04`.
- S583/S584 point and candidate-set comparison: `Evidence\preexport-vs-s583-stage-comparison.json`, SHA-256 `A3CDFA40667F595C42246C892F1E955FAD4F79E041CB9FB052E5F3206C464CF8`.
- Full CLO screenshot: `Evidence\clo-s584-preexport-getter.jpg`, SHA-256 `A12423717954C372239DAEFAA9D6F6D20B0B42258CABDF5EC0EFAFBB329EB061`.
- Readable editor detail: `Evidence\clo-s584-python-editor-detail.jpg`, SHA-256 `3992FD9E662B6537E41A365E3F5C07AA540E6638606785AF5EAAD60AC31C6B1B`.
- Comparator diagnostic: `Evidence\comparator-diagnostic.txt`, SHA-256 `784DE517C2149EC72D3888DE9BDCCD5AF9494377C094C02449F53B5EDF397314`.
- CLO script: `Scripts\read_preexport_input_information.py`, SHA-256 `1686AFA83441DA8329F115C6CCA6EFE11E68153B1ECEC6EDE0F8C69D025E2FB2`.
- Analysis helpers: `compare-preexport-input-info.mjs` and `compare-stage-snapshots.mjs`.

## Acceptance, verification and scope

S584's bounded check passes: the hash-pinned project was selected/opened in CLO; all nine documented getter calls and JSON parses succeeded; and fixed source comparison and S583 point/candidate comparison completed. The measured CUT/SEW geometry, piece-identity, format, semantics, grading/options, malformed-input, all-seven-recipe and other V03 gates remain unchanged. Preserve legacy DXF behavior, protected export byte identities, all-seven V02 acceptance, and the 0.001 cm threshold. No fit, factory, or production-readiness claim is made. CLO remains open for the admitted Epic.

Focused verification: S584 JSON/project-hash checks; both comparison scripts syntax/run checks; screenshot and evidence hashes; focused Control Center tests 42/42; validated board preflight/exit replay/status; and `git diff --check`. Documentation/evidence only changed; production source/tests and export baselines did not, so the full repository gate remains reserved for the settled PR candidate.

## Boundary and next action

S584 began `2026-10-09 05:47:57 UTC` from S583 commit `8a933cb63b9261e00e9738adc4069a4b3f44c68f` and closed `2026-10-09 06:06:48 UTC` (elapsed 18m51s). `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. Board start/exit replay: 3449→3451→3453. The goal remains active and aligned with the admitted EPIC-17/G04 objective. Timings: live CLO interaction, getter capture, and geometry analysis 11m; focused verification and rendered/output review 3m; durable packet/state/board closeout and checks 4m51s; external-agent waits 0m; maintainer-decision time 0m. No independent delegation was safe for a single live-app state check.

At the next slice, reconcile the now-settled rights evidence with the existing S498 DXF-ASTM and S574/S575 DXF-AAMA Polo results plus this pre-export observation. Determine whether any already-tested CLO profile/settings remains a plausible path to the unchanged Polo and V03 gates; do not repeat a known exchange, API survey, or prior S574 generation-one run. Close the CLO candidate only if the reviewed evidence supports that disposition, then continue the remaining admitted V03 work without weakening acceptance.

The validated exit command layer records E-G04-S584-EXIT and the slice summary at board revision 3453. The first `git diff --check` identified one extra trailing blank line in each updated state file; both were corrected and the final diff check passed.
