# EPIC-17 / G04 V03 — Current evidence and gate matrix — Slice 633

## Decision summary

V03 is still **In Progress**. S628–S632 add useful, fixture-bounded evidence,
but none clears a full V03 acceptance gate. The CLO DXF-ASTM import-mode test
specifically repeats the known Polo losses, so further import/export menu
permutations on the same fixture are not justified. V02 remains Done; the
all-seven recipe and supported-option criteria, `0.001 cm` contour tolerance,
legacy DXF behavior, protected output byte identities, and all existing holds
remain unchanged.

| Admitted acceptance area | Verified evidence through S632 | Current disposition / missing proof |
|---|---|---|
| Receiver, documented industrial apparel profile, and profile rights | S611 found no free/local candidate with demonstrated apparel-profile round trip and local handling. S630 reviewed CLO's public DXF help, the public ASTM D6673-10 record, historical NIST apparel-model figures, and DXF version references. CLO names selectable Standard/AAMA/ASTM modes, but the pages do not identify a normative versioned apparel profile or exact mark mapping; D6673-10 is withdrawn, names Version 13 in its public scope, and its public record does not expose technical clauses. Tested CLO output is AC1009/R12. S632's ASTM import selection does not add profile evidence. | **Open / blocking.** No rights-reviewed, qualified industrial receiver/profile. A menu label, generic R12/R14 round trip, or product-use/local-file permission is not profile conformance or rights for a standard. Evidence: `S611-exit-packet.md`, `S630-exit-packet.md`, `S632-exit-packet.md`. |
| Units and coordinate contract | S627–S628 CLO runs selected centimeters at 100%, but saved AC1009 output has no `$INSUNITS`; the general R14 cohort uses unitless output. S632 imports a cm-header Polo fixture with CLO units explicitly set to cm, but this single-path setting does not document a receiver-independent end-to-end units contract. | **Open / blocking.** Specify and prove units, scale, axes/origin and rounding under the selected profile. Evidence: S627/S628/S632 exit packets and their raw reports. |
| Source validity and CUT/SEW geometry | S627 repaired the valid Woven zero-depth vent source case. Its final STANDARD_M cohort passes two Open CAD Studio R14 generations for 73/73 supported configurations and passes one CLO DXF-AAMA Woven zero-vent geometry round trip. CLO Polo S632 ASTM import/export gives 9/9 SEW passes but only 4/9 CUT passes in each generation; back, both collar stands, and both pointed collars fail. Generation 2's worst CUT conservative upper bound is `0.01422316 cm`, over fourteen times the unchanged gate. S610 previously found the same five CLO-failing roles on a different source/export pair; the failing stage was not isolated. | **Open / blocking for the tested apparel receiver path.** General-CAD geometry success is not a CLO/profile pass. Determine the exact source-to-output entity/vertex cause on the pinned S617 cm-header file before proposing any source change. Evidence: S610, S627, S632 exit packets and S632 geometry reports. |
| Seven recipes, supported options, and grades | S627's general R14 fixture matrix includes all seven recipes and 73 STANDARD_M supported-option rows. The CLO S628 Woven test is one zero-vent configuration; S632 is one Polo M configuration. No evidence covers required apparel-profile behavior across all seven recipes, all supported options, and graded/nested sizes. | **Open / blocking.** Must pass the accepted recipe/configuration cohort and required grade/nest cases in the chosen profile. Evidence: S627 matrix/exit; S628 and S632 exits. |
| Piece identity, revision identity, and relationships | S628's one-size Woven fixture preserved 12 role names through unique BLOCK/INSERT pairs and visible PIECE NAME annotations; CLO appends `_M`. S627 also observed numeric pattern names. Neither result defines stable product/revision identity and semantic relationships for all recipes/options. S632's Polo blocks are fixture-scoped, not an accepted identity contract. | **Partial; blocking.** Prove stable garment, piece, revision, and relationship identity on the selected profile across repeated exchanges, options and grades. Evidence: S628 and S632 exits. |
| Manufacturing marks and layer/entity semantics | S627's R14 cohort preserved named `MARK_*` geometry for its source-valid fixtures. CLO S629 Woven retains 13/13 line geometries as separate lines but has 0/8 whole-circle passes and 0/8 discrete buttonhole points. S631's existing Polo route has 12/21 source points uniquely matched, 6 ambiguous, 3 unmatched; 11/14 lines separately matched and 3 coincident with outlines; 0/3 button circles pass. S632 ASTM import repeats the aggregate Polo outcomes: 12/21 unique points, 6 ambiguous, 3 unmatched; 11/14 separate lines, 3 outline coincidences; 0/3 circles pass. CLO numeric layers do not preserve source names. | **Open / blocking.** Requires a sourced, profile-specific encoding and one-to-one semantic preservation; proximity, numeric layers and shared paths do not pass. Evidence: S627, S629, S631, S632 exits and raw JSON. |
| Malformed/invalid input behavior | S626 showed Open CAD Studio accepting a nonfinite/NaN DXF and emitting degenerate finite output. S627 repaired a valid zero-depth source fixture; it did not test or clear malformed-input rejection. CLO S632 used a valid Polo fixture only. | **Open / blocking.** Define and verify fail-closed behavior for malformed and invalid input in the selected receiver/profile. Evidence: S626 and S627 exits; S632 scope. |
| Repeated exchange and round-trip stability | Open CAD Studio R14 second generations are byte-identical for the tested 73-row source cohort. CLO S628 is one Woven round trip, not repeated output. S632's two ASTM-mode Polo outputs are each 221,643 bytes but have different SHA-256 hashes; their pass/fail geometry and mark classifications repeat, while CUT residuals change slightly and remain failing. | **Partial; blocking.** Demonstrate the admitted repeat-round-trip behavior under the qualified profile; S632 fails byte identity and geometry acceptance, so it does not clear this gate. Evidence: S627, S628, S632 exits and exact hashes. |
| Rendered output and readability | S624 reviewed nine general-CAD plots, S628 reviewed Woven gross pieces/names, and S632's nine-piece Polo overview shows no obvious gross deformation. S629/S631/S632 explicitly find overviews inadequate to establish fine-mark visibility/readability. No complete profile-specific render review covers the accepted all-seven/options/grades cohort. | **Open / blocking.** Need detailed, readable rendered/output evidence across applicable representative configurations after geometry/mark gates pass. Evidence: S624, S628, S629, S631, S632 exits. |
| Legacy DXF and protected output identities | No S628–S632 source, pattern, or production-writer change occurred. S627's narrow Woven source repair was covered by focused 100% changed-code coverage and protected-export checks; integrated Epic gates remain due. | **Preserved so far; final gate pending.** Keep legacy behavior and protected byte identities, then run full repository tests/100% coverage and integrated output/browser gates once on the settled Epic candidate. Evidence: S627 exit, S632 exit, project workflow. |
| V02 dependency and all-seven scope | V02 is recorded Done; S627's R14 cohort covers all seven recipes and 73 supported STANDARD_M rows for its bounded receiver screen. The admitted V02 and V03 acceptance boundaries remain separate. | **V02 prerequisite met; V03 all-seven exchange proof open.** Do not reinterpret the general-CAD matrix as V03 acceptance. Evidence: S627, S632 exits and canonical board revision 3674. |

## Next evidence-led action

Reserve S634 for an offline, source-bound topology comparison of the pinned
S617 centimeter-header Polo source and its already existing Standard/ASTM
CLO outputs against both S632 generations. Bind all five failed CUT roles by
exact source/output piece identity; identify the precise source segment or
vertex omitted/changed, its residual and the corresponding mark/outline
relationship. Compare only these already captured inputs/outputs and S610's
prior diagnosis. Do not reopen CLO, alter settings, edit cut geometry, or
change the stitch graph. If the offline evidence supports a source repair,
prepare a concrete proposal and verification plan for maintainer approval
before implementation. This targets the repeated geometry blocker while
avoiding another unsupported receiver permutation.

The receiver/profile and mark-semantics blockers remain separate. A geometry
repair cannot establish profile rights/conformance, units, all-seven grades,
malformed-input handling, semantic mark preservation, repeat behavior, or
readability. Do not declare V03 ready on a Polo-only geometry fix.

## Source records

- Prior gate baseline: `../S627-woven-zero-vent-source-repair/V03-CURRENT-GATE-MATRIX-S627.md`.
- S628 piece names/geometry: `../S628-named-block-piece-identity-pilot/S628-exit-packet.md`.
- S629 CLO Woven marks: `../S629-clo-mark-geometry-audit/S629-exit-packet.md`.
- S630 profile/standards research: `../S630-official-profile-mark-semantics/S630-exit-packet.md`.
- S631 existing Polo output audit: `../S631-s617-astm-mark-audit/S631-exit-packet.md`.
- S632 controlled CLO ASTM import trial: `../S632-astm-import-mode-polo/S632-exit-packet.md`.
- Canonical work statuses after S633 closeout: G04-V01/V02 Done; G04-V03 and EPIC-17 In Progress.
