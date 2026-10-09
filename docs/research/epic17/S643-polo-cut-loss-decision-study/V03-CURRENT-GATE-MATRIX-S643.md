# EPIC-17 / G04 V03 — Current evidence and gate matrix — Slice 643

## Decision summary

V03 remains **In Progress**. S642 confirms a narrow positive and negative result:
CLO DXF-AAMA retained all nine Polo piece-role names from the source-exact
named-block fixture, but only 13/18 CUT/SEW contours passed the unchanged
`0.001 cm` pre-export comparison. The five failures are the back, both collar
stands and both pointed collar leaves. This grouping trial does not clear a
V03 gate.

S643 inspected all 17 option rows in S380 against the recipe and collar
geometry code. The five affected regions are invariant across that matrix,
apart from a rigid Y translation of the four collar `backCollar` /
`backCollarBase` regions when `standHeight` changes. `back.neckline` is
independent of every Polo option. `poloBodyPiece` changes only lower-body
side/hem edges; collar geometry copies the normalized back neckline, translates
it by `standHeight`, and applies `standFrontRise` only to the front seam.
`collarLeafDepth` and `collarPointExtension` alter only outer collar geometry.
Placket and vent options do not alter these five regions. Thus S634's five
source vertex identities and its maximum `0.013974 cm` omitted-vertex chord
deviation remain applicable to every S380 option row for this STANDARD_M
revision. This is a source-code derivation, not 17 additional CLO imports or a
claim about CLO internals.

The smallest proposed source simplification—removing each sub-tolerance CUT
vertex so the adjacent source samples form a chord—would change the product's
generated CUT geometry by `0.012741–0.013974 cm` (`0.12741–0.13974 mm`). That
exceeds the admitted `0.001 cm` exchange tolerance by 12.7–14.0×. Code and
available pattern-specific evidence do not establish that these features are
physically redundant. **No source repair is recommended or authorized by this
study.** Preserve source geometry and keep CLO unqualified for this profile
until a receiver route passes the source-geometry gate.

## Gate matrix

| Admitted V03 gate | Latest evidence through S643 | Disposition |
|---|---|---|
| Receiver, documented industrial profile, and rights | S638's official-source review finds CLO's documented DXF-AAMA/ASTM labels do not identify an active normative edition or conformance. Maintainer authorization covers product-development testing and local files, not standards reproduction. S642 is empirical vendor-mode evidence only. | **Open / blocking.** No qualified receiver/profile or rights basis for an exact standard claim. |
| Units and coordinate contract | CLO tests set centimeters, 100%, no rotation; S642's measured pre-export contours still fail. Existing generic R14 evidence does not define an apparel-profile coordinate contract. | **Open / blocking.** Require a documented profile for axes, origin, scale, rounding, and grade-rule units. |
| Source validity and CUT/SEW geometry | S642 source-exact named-block import: 13/18 contours pass at `0.001 cm`; all 9 SEW and 4 CUT pass; five CUT fail. S634 ties the missing vertices to current Polo allowance output. S643's code-path inspection shows the same affected source regions across all 17 S380 option rows, with only rigid Y translation for collar `standHeight` variants. | **Open / blocking.** Keep source geometry and the `0.001 cm` gate. No physical-redundancy evidence supports deleting the vertices. |
| Seven recipes, supported options, and grades | S627 generic R14 covers a bounded STANDARD_M cohort across seven recipes, not a qualified apparel profile. S642 tests only Polo STANDARD_M, default option values. | **Open / blocking.** No profile-specific all-seven/options/grade cohort. |
| Piece, garment, revision identity, and relationships | S642 preserves all nine Polo role names in one M/default import. This does not establish stable garment/revision identity or piece relationships across recipes, options, grades, or repeated exchanges. | **Partial / blocking.** Role identity positive in one fixture; complete identity contract absent. |
| Manufacturing marks and layer/entity semantics | S637 rendered Woven button marks missing after the tested ARC input. S639 native Button/Buttonhole export changes source size/shape and moves mark centers by about `0.07616 cm`. S642 did not pass the pre-export geometry gate and did not assess marks through round-trip. | **Open / blocking.** Preserve exact source mark geometry, identity, and layer semantics in a passing receiver round trip. |
| Malformed and invalid input | S626's generic R14 negative-input result remains unqualified for an apparel receiver. S642 adds no malformed-input evidence. | **Open / blocking.** Fail-closed behavior unproven. |
| Repeat-round-trip stability | S627 generic R14 repeatability is not an apparel-profile pass. S642 stopped before export when geometry failed. | **Open / blocking.** No repeated passing apparel-profile round trip. |
| Rendered output and readability | S642 overview verifies nine named patterns are present without gross fragmentation only. The failed CUT pre-export check prevented output/reimport review. S637's specific visible-mark output was negative. | **Open / blocking.** No complete readable output cohort for the qualified profile. |
| Legacy DXF behavior and protected byte identities | S642 changed only disposable fixture wrapper content and evidence files; product writers and protected export identities are untouched. | **Preserved so far; final integrated regression gate remains due.** |
| V02/all-seven dependency | Canonical board retains V01/V02 Done and V03/Epic In Progress. | **V02 prerequisite met. V03 remains incomplete.** Do not close Epic or claim industrial compatibility. |

## Next decision gate

Keep all admitted thresholds, all-seven scope, and holds unchanged. Do not edit
the Polo recipe or allowance output to conceal CLO's point loss. S643 closes
the source-geometry ambiguity for these five vertices: the geometry is present
in current product output, and deleting it would exceed the required tolerance.
The next useful work is a distinct evidence-led receiver/profile route that
can be lawfully tested with local files and can preserve these coordinates;
do not repeat CLO block grouping, settings, import modes, or previously tested
entity-family trials. If no eligible receiver route can be identified, record
that concrete external dependency and keep V03/EPIC-17 In Progress rather than
changing acceptance.

## Evidence references

- Source point and offset trace: `../S634-polo-cut-topology-forensics/S634-exit-packet.md` and its hash-pinned JSON in `C:\G04-CLO-DXF-Exchange\S634-polo-cut-topology-forensics\Evidence\`.
- S380's 17 option rows: `../S380-polo-collar-callout-key-implementation/collar-point-callout-matrix.json`.
- Source formulas: `src/drafting/polo.ts` and `src/drafting/polo-collar.ts`; offset construction: `src/render/allowance.ts`.
- Actual S642 native import and rendered evidence: `../S642-polo-block-wrapper-cut-retention/S642-exit-packet.md` and `C:\G04-CLO-DXF-Exchange\S642-polo-block-wrapper-cut-retention\`.
- Profile/right evidence: `../S638-v03-profile-rights-reconciliation/V03-CURRENT-GATE-MATRIX-S638.md`.
