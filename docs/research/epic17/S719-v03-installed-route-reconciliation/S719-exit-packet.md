# EPIC-17 / G04 V03 — S719 installed-route reconciliation exit

## Result

The exact canonical G04-V03 card requires a rights-reviewed industrial CAD receiver/profile and import/export round trips over all seven recipes and supported options/grades, preserving the fixed `0.001 cm` geometry threshold, units, identities/relations, CUT/SEW, marks/grainlines, malformed input, repeatability, readable output, legacy DXF, and protected byte identities.

S719 compared that contract to S709's plan and existing actual receiver artifacts, then obtained one bounded read-only Sol high-reasoning review of the saved CLO input/return, writer, unit contract, return auditor and tests. The reviewer confirmed that the writer emits adaptive CUT vertices at six-decimal precision with `$INSUNITS=5`; the CLO return's retained vertices are source vertices, while omitted shallow vertices produce five measured CUT failures. The exact deviations exceed `0.001 cm` by 0.00258–0.03294 cm. The return also omits the centimeter declaration and source-identifiable mark/layer information. The review found no supported writer/source change that restores this data while preserving the cut geometry and fixed gates; changing the audit threshold or code cannot restore lost receiver data. No files were changed by the reviewer.

Route status is now explicit: CLO 2026.1.310 fails measured fixed gates; DGS V2024.1 has recorded data-loss/blank-import results; LibreCAD 2.2.1.5 DXF 2000 passes one Polo M fixture but is generic CAD and does not meet the board's industrial apparel receiver/profile requirement; OpenCAD evidence is generic. The S716–S718 local auditor/panel checks pass only the exercised product-local malformed-input cases. No current tested route clears receiver eligibility plus the representative fixed-gate exchange. The current gate table and bounded completion plan are `S719-v03-current-matrix.md` and `S719-v03-completion-plan.md`.

No implementation, app, file-format, profile, entity-encoding, setting, garment, export baseline, threshold, or acceptance change occurred. No V03 criterion is declared passed by this review. V01/V02 remain Done, V03/EPIC-17 remain In Progress, and the goal remains active. No physical, factory, standards-conformance, or production-readiness claim.

## Verification and timing

- Source and saved-report reconciliation: complete; current report hashes/measurements were read from S714/S715/S711 records.
- Independent review: WORK FINISHED; no edits. Codex verified conclusions against the repository code and saved evidence.
- Focused validation: `npm run control-center:test` passes 42/42; `git diff --check` passes; S719 command JSON parses. No production code changed, so changed-code coverage and the full repository gate are not applicable to this documentation/board slice.
- Start: 2026-10-11 03:56 UTC from S718 `5282eab2`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor; canonical board start replay 4203→4205 and exit replay 4205→4207 through the validated command layer.
- Time: implementation 0m; evidence reconciliation, board validation and durable closeout approximately 4m; external reviewer wait 0m in this continuation (the bounded review was already complete); maintainer-decision time 0m.
- Two pre-existing untracked S700 coverage diagnostic files remain untouched.

## Next action

Do not repeat any settled installed route, mode, file setting, or encoding. Continue only when an eligible industrial apparel receiver/profile is supported by exact build/profile/rights evidence and a representative source-bound exchange can be run against the fixed gates. Then reuse the existing breadth, grade, negative-input and repeatability matrices once. Goal remains active; this slice does not change acceptance or release readiness.
