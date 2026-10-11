# EPIC-17 / G04 — S724 LibreCAD option evidence and acceptance correction

## Verified result

- Start: 2026-10-11 05:16 UTC from S723 `b10f308e0c6c4d9a08c0040232f109dc9eff1c66`.
- Branch: `codex/epic-17-g04`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- Board start revision: 4226; latest validated closeout revision: 4234. EPIC-17 and G04-V03 remain In Progress; V01/V02 remain Done. Goal remains active.
- Receiver/profile: LibreCAD 2.2.1.5, GUI `Save As → Drawing Exchange DXF 2000`, one save per fixture. No standards, industrial-CAD, factory, physical-fit, or production-readiness claim.
- S724 generated and independently package-verified all 73 S330 option rows at size M. Recipe distribution is Tee 1, Fitted 1, Tank 1, Polo 17, Woven shirt 28, Skirt 1, Trouser 24. All 73 are option scenarios, not grade rows. The nine entity-count signatures are count summaries only.
- Ten saved returns pass the existing S710 source-bound audit: seven S723 default-M recipe files plus Polo `sideVentDepth-min`, Woven `combined-supported`, and Woven `sideVentDepth-min`. Each retains centimeter units, named piece identities, CUT/SEW, and typed marks; the maximum measured geometry delta is 0.000 cm for all ten. Exact hashes, revisions and row audit are in `C:\G04-CAD-Interchange\S724-librecad-option-grade-matrix\S724-option-roundtrip-audit.json`.
- The Tee default-M fixture was saved and audited twice. Both audits report 3 pieces, 6 outlines, 26 mark entities, and 0.000 cm maximum difference. Exact result: `C:\G04-CAD-Interchange\S724-librecad-option-grade-matrix\S724-repeat-audit.json`.
- S723 reopened all seven default returns. The Trouser receiver drawing is visibly crowded with crossing strokes. Its machine geometry audit passes, but readable output is not accepted. S723 mislabeled this as a V02 hold; V02 was already accepted at S459. This is a distinct V03 receiver-output finding. The three S724 option returns have machine audits but lack durable visual review in this packet.

## Corrected V03 acceptance model

The previous plan's “73 option/grade receiver round trips” was the wrong test: it confused an M-only option matrix with grade coverage and treated every UI setting row as if it were a distinct receiver contract. V03 will instead prove the product's full supported source behavior and separately demonstrate a carefully chosen, exact empirical receiver profile:

1. **Product output breadth:** every registered recipe, supported option scenario, and supported grade size produces a verified one-size DXF plus its source-bound manifest. The matrix must exercise every supported option row across the recipe's full grade run, not infer grades from the 73 M-size option rows. Validate source revision, recipe/options/selected grade, geometry, piece identities, stitch graph, CUT/SEW, marks/grainlines, centimeter declaration, and fail-closed unsupported inputs. No CAD receiver is claimed to understand data that only exists in the companion manifest.
2. **Empirical receiver profile:** document the exact installed receiver/version, profile, Save As/reopen steps, local handling, and claim limits. Run the unchanged round-trip auditor on a representative receiver set that covers all seven recipes and each materially distinct option/topology class identified from normalized package geometry—not a blind save for every source row. Keep the fixed 0.001 cm threshold and no missing/additional entity rule on every selected round trip. State exactly which fixtures passed.
3. **Repeat and readable output:** retain a semantic repeated exchange; reopen and visually review every selected receiver fixture, including the option representatives and a grade boundary representative. Any crossed, overlapping, clipped, or unreadable selected result fails this gate regardless of machine audit.
4. **Release integrity:** preserve the protected legacy DXF bytes and other protected export identities. Keep final global 100% coverage, build, browser/Electron, integrated output review, necessary-file cleanup, PR, safe merge, origin ancestry, required deployment, and production end-to-end checks.

This is an empirical compatibility claim for the exact LibreCAD version/workflow and exact passed fixtures. It is not a claim of universal DXF support, ANSI/AAMA/ASTM conformance, industrial apparel-CAD certification, or factory acceptance. The all-seven recipe, supported option and grade requirements and 0.001 cm fidelity threshold remain. This definition is an explicit maintainer-directed correction to receiver breadth; it does not waive source output, grade, option, readability, or release gates.

## Gate status at S724

| Gate | Status | Evidence / remaining proof |
|---|---|---|
| Current package integrity, units, source identity | Passed for 73 M option scenarios | S724 source packages verify; grade-size/option cross-product still must be exercised. |
| LibreCAD geometry, pieces, CUT/SEW, marks, units | Passed for ten named M fixtures only | Ten exact reports, all 0.000 cm; do not extend claim to the rest of the 73 options or other grades. |
| Receiver repeatability | Passed for Tee default M | Two semantic audits; one style/size only. |
| All supported option × grade source outputs | Unproven | Run the bounded product-side matrix and record all exact row joins. Existing tests separately cover option cases at M and default-option grade runs, not their full cross-product. |
| Receiver output readability | Failed for Trouser; unproven for three S724 option returns | Fix the candidate drawing layout without changing pattern contours, then inspect saved/reopened outputs in LibreCAD. Do not label this V02. |
| Product malformed-input fail-closed handling | Passed for recorded tested classes | S716–S718 local auditor/UI tests; not a receiver behavior claim. |
| Protected output byte identities | Existing regression gate retained | Must pass the final integrated gate; no baseline was moved. |
| Standards / industrial / factory acceptance | Out of claim | No such claim will be made. |

## Scope and next action

S724 is an evidence/documentation slice. No production code, cut geometry,
legacy export, baseline, test threshold, or UI design changed. S725 will first
measure the receiver drawing's cross-piece bounds/intersections, implement only
a candidate-layout spacing correction if that source analysis identifies the
cause, and run focused 100%-coverage tests plus actual LibreCAD saved/reopened
render review. It will also generate the 73-option × each-supported-grade
source-package matrix to close the distinct product-output gate. All raw CAD,
manifests, scripts, returns, screenshots and reports stay under the named
`C:\G04-CAD-Interchange\S724-librecad-option-grade-matrix\` or S725 C: folder.

## Verification and time

- Evidence review: S724 10/10 return audits passed; repeat 2/2; 73/73 option source packages verified; 73 rows are size M.
- No production code changed. Changed-code coverage and the full repository gate were not due. The first board-suite run after the Epic summary refresh exposed stale exact-copy assertions for the historical S459/S406 wording; I restored those accurate accepted-history phrases while retaining the new S724 detail. The final `npm run control-center:test` passed 42/42 and `git diff --check` passed.
- External review: one bounded read-only high-reasoning review completed; it confirmed the M-only matrix limitation and called out the Trouser rendered-output issue. Review is evidence, not a gate pass.
- Timing from S724 start to this boundary: approximately 40 minutes total. Receiver/source evidence review: 30 minutes; acceptance/packet/board reconciliation: 10 minutes; external-agent wait: 0 minutes; maintainer-decision wait: 0 minutes.
- Existing unrelated S700 diagnostics remain untouched. Raw generated/receiver files remain outside the repository.
- Next action: S725 receiver-layout diagnosis and all-grade option package cross-product, with focused changed-code tests and rendered LibreCAD verification.
