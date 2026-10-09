# EPIC-17 / G04 V03 — Current evidence and gate matrix — Slice 638

## Decision summary

V03 remains **In Progress**; no acceptance gate is cleared by this
reconciliation. S636 shows identical five-point Polo CUT loss under CLO
Standard and DXF-ASTM imports at the fixed `0.001 cm` threshold. S637 shows
the eight source Woven button circles are not retained as visible marks after
the exact-locus quarter-ARC import. Both pre-export checks failed, so neither
run exported a DXF. No further variation of those same CLO settings or mark
entity encodings is justified.

The official sources distinguish current *vendor menu support* from active
standard status. ANSI's November 22, 2002 Standards Action says ANSI/AAMA
292-1993 and its TR292 implementation guideline were withdrawn effective
November 13, 2002. ASTM's current sewn-product automation catalog lists
D6673-10 as withdrawn in 2019. CLO's documentation, updated September 28,
2026, currently offers DXF-AAMA, DXF-ASTM and Standard DXF for import/export,
but names no normative edition and makes no statement of conformance to ANSI
292 or an ASTM D6673 edition. That vendor support is a testable receiver
feature; it is not evidence of current standard status, licensed rights to
reproduce standard text, or conformance.

### Current official references and limits

| Source | Direct evidence | Does not establish |
|---|---|---|
| [ANSI Standards Action, 2002-11-22, pp. 6 and 20](https://share.ansi.org/Shared%20Documents/Standards%20Action/2002%20PDFs/SAV3341.pdf) | Lists ANSI/(AAMA) 292-1993 for withdrawal, then records administrative withdrawal of ANSI/AAMA 292-1993 and TR292 effective 2002-11-13. | Reason for the withdrawal, later technical revisions outside this notice, copyright license, or how present vendor DXF-AAMA menus map to the 1993 clauses. |
| [ASTM textile standards catalog](https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html) | Its current “Sewn Product Automation” section lists ASTM D6673-10 as withdrawn in 2019. | Why it was withdrawn, whether any vendor dialect conforms, or rights to reuse the standard text. The catalog view does not by itself prove no private successor agreement exists. |
| [ASTM D6673-04 historical product page](https://store.astm.org/d6673-04.html) | Identifies -04 as Historical, displays a paid purchase listing, and summarizes a 2D CAD/CAM pattern-piece and grade-rule-table scope. | Exact -10 clauses or permissions to reproduce text. S638 did not purchase or reproduce the paid document. The summary also says the practice does not model relationships between pieces or 2D/3D garment correspondence. |
| [CLO 2D Pattern DXF Import/Export Help](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export) | Updated 2026-09-28. Documents import choices Standard/AAMA/ASTM, units/scale, rotation and options; export choices DXF-AAMA/DXF-ASTM/Standard DXF; only one size group per export; graded information can be embedded or placed in a Rule File. | A normative edition, differences between AAMA/ASTM internals, layer/entity clauses, grade-rule file syntax, rights/conformance, or successful behavior for this product. |
| [CLO compatible file-format list](https://support.clo3d.com/hc/en-us/articles/115002000227-Compatible-File-Format) and [CLO import help](https://support.clo3d.com/hc/en-us/articles/115012380628-Import-DXF) | Current CLO vendor documentation presents DXF-AAMA/ASTM as import/export product features and names other CAD systems as compatible. | An independent test, particular profile edition, all-seven behavior, or conformance to the withdrawn standards. |

The ANSI primary PDF was directly opened and its exact 2002 withdrawal text
verified by Codex. Claude Opus 5.5 returned the same conclusion for ASTM and
CLO; its own fetch of the ANSI PDF returned HTTP 403 and its response treated
that point as unverified. Codex does not rely on that search snippet: the
directly opened ANSI PDF above is the source of record. The ASTM current
catalog, not the historical -04 product page, is the source for current
D6673 status. These are factual status findings, not legal advice.

## Gate matrix

| Admitted V03 gate | Latest evidence through S638 | Disposition |
|---|---|---|
| Receiver, documented profile, and rights | The official CLO docs expose vendor modes but no edition or normative conformance. ANSI/AAMA 292-1993 was withdrawn in 2002; ASTM's current catalog lists D6673-10 withdrawn in 2019. Written approval covers CLO product-development use and local files, not reproducing paid standards. | **Open / blocking.** The vendor-defined CLO DXF-AAMA mode remains an empirical candidate only; it cannot be described as current ANSI/AAMA or ASTM-conformant on this evidence. No profile is qualified. |
| Units and coordinate contract | CLO trials explicitly selected cm at 100%; S627/S628 exports were AC1009/R12 without `$INSUNITS`; general R14 outputs were unitless. | **Open / blocking.** No receiver-independent profile contract for units, axes/origin, scale, rounding and grade-rule units. |
| Source validity and CUT/SEW geometry | S635/S636 use the same Polo revision/entity input in CLO Standard and DXF-ASTM: four of nine CUT contours pass and the same five miss vertices at `0.012736–0.013970 cm`; no export after the gate failure. S627's generic R14 cohort passes its bounded geometry run but is not the required apparel-profile result. | **Open / blocking.** No qualified profile round-trip for all accepted recipes/options. Keep `0.001 cm`. |
| Seven recipes, supported options, and grades | S627's generic R14 STANDARD_M cohort covers 73 rows across seven recipes but no CLO all-seven cohort; S637 is one Woven size-M option. CLO docs say one size group per export, with grade information in DXF or a separate Rule File, but do not specify syntax. | **Open / blocking.** No profile-specific all-seven/options/grade evidence. |
| Piece identity, revision identity, and relationships | S628 and S637 show single-size Woven roles represented as named blocks/pattern names in one fixture; CLO suffixes or numeric names and these results do not define durable garment/revision/relationship identity across the cohort. | **Partial / blocking.** No stable profile identity/relationship round trip across options, grades and repeated exchanges. |
| Manufacturing marks and layer/entity semantics | S629's eight Woven circles failed as receiver-native full circles. S637 replaced them with 32 exact-locus quarter-ARCs; CLO returned 12 named patterns without API errors, but the query's affected child shapes are only straight `Base Line` shapes and the 1:1 render omits seven placket buttons and the stand mark. The API reports one more child than it enumerates for both affected pieces. S631/S632 Polo circles also fail; S637 stopped before export. | **Open / blocking.** Visible mark gate failed on this trial; no one-to-one semantic/layer preservation is proven. Do not repeat the same ARC or import-setting trial. |
| Malformed/invalid input | S626 documents the generic R14 receiver accepting nonfinite input and emitting degenerate finite output; S638 adds no negative-input evidence for an admissible apparel profile. | **Open / blocking.** Fail-closed malformed/invalid behavior remains unproven. |
| Repeated exchange/round-trip stability | S627's generic R14 test repeated byte-identically but was not an apparel-profile pass; S628 is one CLO Woven round trip; S632 CLO outputs differed in SHA-256 and retained failing CUT/mark results; S637 made no export. | **Partial / blocking.** No qualified profile has passing repeated-round-trip evidence. |
| Rendered output/readability | S637's actual CLO 1:1 overview and detailed button-placket crop are readable enough to show the expected circles are absent; thus the mark display gate fails. No all-seven profile render cohort is accepted. | **Open / blocking.** Actual S637 output is negative evidence; complete profile-specific rendered evidence remains absent. |
| Legacy DXF/protected identities | S634–S638 changed no product writer, production source, legacy DXF behavior or protected export identity. | **Preserved so far; final integrated gate pending.** |
| V02 dependency/all-seven scope | Board revision 3694 retains V01/V02 Done and V03/EPIC-17 In Progress. V02's seven-recipe front/back acceptance is complete; the distinct V03 all-seven exchange gate remains open. | **V02 prerequisite met; V03 incomplete.** Do not merge Epic or claim V03 complete. |

## Recommendation and next gate

Keep the admitted V03 scope and every hold unchanged. Treat the currently
documented `CLO 2026.1.310 DXF-AAMA` route as a **vendor-specific test target
only**, without asserting ANSI/AAMA 292 or ASTM D6673 conformance. This is the
only zero-purchase, zero-supplier-contact route with direct CLO import/export
documentation and the maintainer's written authorization for product-use
testing. It is not qualified: S636 and S637 expose concrete pre-export
failures, and single-fixture S627/S628 outcomes cannot clear the matrix.

Next, ask the maintainer to confirm this limited *candidate-profile label*
before investing in a new profile-specific experiment: it preserves the
existing acceptance criteria and allows empirical work on a named vendor
mode, but it explicitly does not treat a withdrawn standards label as current
conformance. If the maintainer requires an active normative standard, the
current public official evidence does not identify a current, zero-cost
normative profile ready for this CLO trial; retain V03 as blocked pending a
separately rights-reviewed current receiver or standard. This is a search
result, not proof that no such profile exists. Do not buy standards, contact
suppliers, loosen gates, or run another CLO permutation without the decision
and a source-backed new hypothesis.

## Source records

- Prior consolidated matrix and baseline: `../S634-polo-cut-topology-forensics/V03-CURRENT-GATE-MATRIX-S634.md`.
- S635/S636 CLO CUT matrix: their exit packets and pinned evidence under
  `../S635-clo-lwpolyline-cut-import/` and
  `../S636-clo-lwpolyline-astm-import/`.
- S637 Woven circle/ARC rendered failure:
  `../S637-woven-circle-arc-trial/S637-exit-packet.md`; C:-only artifacts at
  `C:\G04-CLO-DXF-Exchange\S637-woven-circle-arc-trial\`.
- Independent read-only researcher: Claude Opus 5.5; see S638 exit packet for
  returned claims, review, and the ANSI 403 discrepancy.
