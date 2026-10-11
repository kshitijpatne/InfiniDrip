# V03 current gate matrix — S682

This table distinguishes source-package correctness from receiver behavior.
“Passed” is scoped to the cited fixture. It does not mean the complete V03
gate passes unless the evidence covers the full admitted matrix and a
qualified receiver.

| Gate | Current status | Strongest existing evidence | Remaining proof or change |
|---|---|---|---|
| Rights and local handling | **Passed for authorized local trials** | Maintainer's written confirmations for CLO product-development evaluation/local files and GetonAgain local evaluation; `docs/PROJECT-DECISIONS.md`. | None for those confirmed uses. This does not qualify their file exchange. |
| Qualified receiver/profile | **Failed for tested candidate set** | CLO 2026.1.310 AAMA route fails Polo CUT geometry; DGS apparel-decoder import registers 0 patterns; LibreCAD R12 is generic and drops units; OpenCAD R14 is generic and accepts malformed input. S585, S668, S674, S675. | No tested route satisfies the full V03 contract. Do not claim ANSI/AAMA/ASTM conformance from a menu label. |
| Source units | **Passed** | S679/S680/S681 candidate DXFs declare centimeters with `$INSUNITS=5`; verifier requires the matching manifest. | Receiver must preserve or truthfully report the unit contract. |
| Receiver units | **Failed on LibreCAD R12; unproven on current package elsewhere** | S674 saved R12 output omits the centimeter declaration. Older CLO tested output did not establish a passing unit contract. | A qualified receiver's actual saved/reopened file must retain explicit centimeters. |
| Source CUT/SEW geometry | **Passed for generated source packages** | S680/S681 validate 73 S330 options and all seven recipe grade rows; source DXF drawing hashes are pinned. | Nothing source-side identified by Sol remains to fix for those checks. |
| Receiver geometry | **Failed on CLO Polo; passed only on bounded generic fixtures** | CLO S498/S503/S516 misses five Polo CUT corners by `0.01019–0.01118 cm` against `0.001 cm`; S574's connected-line source also fails. LibreCAD S674 passes 18/18 paths on one Polo M; generic OpenCAD S627 passes its 73-fixture source matrix. | No qualified receiver passes the complete seven-recipe/option/grade package. Do not repeat a setting/representation already measured. |
| All seven recipes and supported options | **Passed source-side; receiver gate unproven** | S330's pinned 73-row matrix and S680/S681 generation cover Tee, Fitted, Tank, Polo, Woven, Skirt and Trouser. | A qualified receiver must round-trip the same full matrix. OpenCAD's 73-row result is generic and its malformed-input failure disqualifies that route. |
| Grades/sizes | **Passed source-side; receiver gate unproven** | S678/S681 generate every recipe grade row and bind the selected size/grade rule in the manifest. S559/S562 provide 35 source-size fixtures. | Prove grade/size mapping in an eligible receiver; a sidecar alone is not receiver grading. |
| Piece, revision and seam identity | **Passed source-package integrity; receiver preservation unproven** | S678/S681 bind manifest revision and drawing digest; pieces and stitch graph are source-recorded. Sol confirmed the Polo receiver fixture lacks identity payload, so its old result cannot prove identity. | Round-trip a fixture with identity payload and verify sidecar-to-drawing pairing and mismatch rejection in a qualifying route. |
| Construction marks and mark identity | **Passed source-package integrity; partial old receiver evidence** | S677 emits recipe notches/grainline; S681 binds each `PatternMark` name/label, source shape, layer/type and one-based DXF entity position. LibreCAD S674 matches 38 typed marks on one Polo M; CLO's mark behavior varies and was not full-matrix evidence. | A qualified receiver must retain the actual visible marks and their typed/layer meaning across the full matrix. Sidecar records supplement, never replace, those shapes. |
| Malformed/unsupported input | **Failed on tested CLO and OpenCAD paths** | S627 found OpenCAD accepts malformed non-finite input; prior CLO negative fixtures were accepted without a sufficient blocking error. | A qualifying receiver must visibly reject/block invalid content. Do not repeat the already-failing negative controls. |
| Repeatability | **Partial on generic OpenCAD only; candidate gate unproven** | S627 shows byte-stable second-generation OpenCAD output for its valid source matrix; LibreCAD was one generation and CLO's repeated route still failed geometry. | Same accepted receiver/profile must pass repeated exchange with unchanged semantic/geometry checks. |
| Readable receiver output | **Unproven overall; one CLO path failed** | S674 saw outlines/layers after LibreCAD reopen but no durable fine-detail readability evidence; S508 CLO Standard collapsed output; S680/S681 source renders are diagnostic renders, not receiver screens. | Inspect saved, complete receiver output with piece identity and fine marks readable at useful scale. |
| Legacy and protected bytes | **Preserved by these source slices; final integrated gate pending** | S676–S681 are additive candidate-only work; S681's 73 drawing hashes equal S680 and focused regressions pass. | Full repository coverage and all protected export identities on the settled integrated PR candidate. |
| Final merge/deployment | **Pending** | No EPIC-17 PR/merge exists at this boundary. | Full global gate, final rendered/output review, PR, safe merge, `origin/main` ancestry and any required Actions deployment. |

## Sol review and Codex conclusion

The bounded Sol review found no remaining product-code defect in the S676–S681
unit, construction-mark, option, grade, piece/revision, seam, or mark-identity
changes. Codex independently verified S680/S681 tests, coverage, hashes and
receiver packets. One prior explicit source omission—`PatternMark.name` and
`label`—was fixed in S681. The candidate remains opt-in; the protected legacy
export intentionally stays byte-identical.

The failed receiver rows are measured outputs, not assumed app defects: the
evidence does not identify whether each CLO contour change happens on import
or export. S574 tested a distinct source entity representation and worsened
the measured cut mismatch. There is no evidence-backed source algorithm change
that would make a previously failed receiver route pass all fixed criteria.

## Shortest credible completion path and stop condition

1. Keep the verified source-side fixes and all acceptance thresholds.
2. Stop replaying CLO, DGS, LibreCAD R12 or generic OpenCAD permutations already
   retired by a decisive fixed-gate failure.
3. Reopen receiver work only for a specifically qualified route or a specific
   source representation change with a falsifiable reason it addresses one
   measured gate. Reuse the current package and fixtures; begin with one
   decisive exact-file round trip and stop on its first fixed-gate miss.
4. After a route passes the decisive profile and geometry gates, run its full
   seven-recipe/options/grades, marks/identity, malformed-input,
   repeatability, and rendered-output matrix. Then run the settled full repo
   coverage/output gates, PR, merge, ancestry and deployment check.

**Stop condition:** no tested route currently meets the unchanged V03 gate set;
there is no specific untested code correction shown by current evidence. No new
app is recommended and no software was installed in S680–S682. Without a newly
qualified receiver route, cannot truthfully claim V03 pass or safely close and
merge this Epic as complete.
