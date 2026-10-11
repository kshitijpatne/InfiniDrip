# EPIC-17 / G04 — S725 Trouser candidate readability and option-grade output

## Closeout

- Slice: S725, started 2026-10-11 06:02 UTC from S724 `84191188da1c202320d7bf437ccf48d2772b391d`; branch `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S725 was the next unique slice after S724.
- S725 status: **closed**. G04-V01/V02 remain Done; G04-V03 and EPIC-17 remain In Progress. No goal-status change.

## Result

The Trouser drawing's visible crowding came from how the candidate package arranged separate pattern pieces on the page. It was not a cut-outline intersection: the exact S723 source and return contain nine pieces and zero inter-piece segment intersections. The old 2 cm horizontal gaps were only about 4.5 screen pixels at the whole-layout scale, so adjacent outlines looked joined or crossed.

The opt-in interchange package now gives Trouser a 5 cm layout gap. The other six recipes retain 2 cm; the legacy `exportDxf` default remains 2 cm and its protected byte identities remain unchanged. This changes only each piece's candidate drawing placement and its manifest transform. Pattern geometry, piece identity, stitch graph, marks, grade, and option values are unchanged. The regenerated Trouser M LibreCAD 2.2.1.5 / Drawing Exchange DXF 2000 save/reopen passes the existing source-bound audit: 9 pieces, 18 outlines, 103 marks and 0.000 cm maximum geometry difference. The whole layout and detail were visually inspected in LibreCAD; the pieces are visibly separated and readable without hiding entities.

The S724 receiver fixture inputs were reconciled to current source: nine hashes are unchanged, while the Trouser default fixture was regenerated for the new layout. All ten selected fixture drawings were inspected in the actual LibreCAD window; no inter-piece crossing or obscured outline was seen. This is empirical evidence for these exact fixtures and this exact route, not a standards or universal compatibility claim.

The full S330 option matrix crossed with each supported grade produced **365/365 verified one-size packages** across all seven recipes: 73 option scenarios × five sizes. This passes product-side package breadth for the tested matrix. It does not prove that every distinct source geometry/topology class has a receiver fixture; the nine entity-count signatures from earlier work are not geometric classes.

## Verification

- Focused tests: 18/18 passed. Changed production files `dxf.ts`, `dxf-centimeters.ts`, and `dxf-interchange-package.ts`: 100% statements, branches, functions, and lines.
- Legacy export regressions: 8/8 passed; protected byte identities unchanged.
- Control Center tests: 42/42 passed.
- `git diff --check`: passed.
- A first coverage run used parallel workers and hit the test timeout; a repeated single-worker focused run passed. No runner default changed and no assertions were removed.
- Current generated matrix audit: `C:\G04-CAD-Interchange\S725-trouser-readable-output\option-grade-packages\S725-option-grade-package-audit.json` (365 passed, zero failed; source matrix SHA-256 `69627e68f8d8e1c724c91d23fb885cbbc6b9fbccc42512d1d4c3e19ef14d8739`).
- Candidate and saved LibreCAD return, audit, package manifest, geometry diagnostics, and scripts are under `C:\G04-CAD-Interchange\S725-trouser-readable-output\`; none are tracked in the repository.

## Acceptance status and next step

| V03 gate | S725 status | Remaining proof |
|---|---|---|
| Every supported option × grade source package | Passed for the 73 S330 option scenarios and five supported sizes | Preserve report and rerun only if candidate source changes. |
| Selected receiver geometry, identity, marks, units | Passed for ten exact fixtures, including regenerated Trouser M | No broad claim beyond those fixtures. |
| Selected receiver readability | Passed for the ten selected drawings in actual LibreCAD review | Expand only to fixtures selected by source-derived geometry/topology coverage. |
| Representative source geometry/topology coverage | Unproven | Replace entity-count groupings with normalized geometry/topology signatures; map classes to the existing ten fixtures and add coverage only for an uncovered material class. |
| Receiver/profile rights and exact claim boundary | Partly documented; not independently settled | Record LibreCAD license/right basis, version, exact DXF 2000 workflow, local handling and limits for the empirical profile. No industrial, ASTM/AAMA, factory or physical claim. |
| Repeatability | Passed for Tee M semantic repeat only | Retain this bounded claim; determine whether source-derived class coverage needs one additional existing-fixture repeat. |
| Malformed-input fail-closed product behavior | Passed for recorded product-side cases | Keep current negative matrix; no receiver behavior claim. |
| Legacy DXF and protected export identities | Passed in focused regression suite; final integrated gate remains | Run full fixed gate on the settled PR candidate. |

Next slice: S726 is a bounded evidence task using the existing candidate package reports and the ten already-saved receiver fixtures. Derive normalized geometry/topology signatures, map each fixture to its class, and complete the first-party rights/profile note for LibreCAD 2.2.1.5 / DXF 2000. Do not install, purchase, or test another application, format, or setting. If existing fixtures cover all material classes and the rights basis supports the exact empirical claim, continue directly to the integrated G04 gate; otherwise identify only the uncovered class or rights question and the smallest evidence-based next step. V03 acceptance, the 0.001 cm threshold, all-seven/options/grades scope, legacy behavior, and final release gates remain unchanged.

## Time and durable handoff

- Implementation: approximately 10 minutes.
- Focused verification and package matrix: approximately 12 minutes.
- Receiver save/reopen and rendered review: approximately 7 minutes.
- External-agent waits: 0 minutes.
- Maintainer-decision time: 0 minutes.
- Elapsed from S725 start to closeout: approximately 30 minutes.
- Board closeout is linked as `E-G04-S725-EXIT`; next action is the S726 class-coverage/rights reconciliation above.
