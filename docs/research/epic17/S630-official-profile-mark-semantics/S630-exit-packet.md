# EPIC-17 / G04 V03 — Official profile and mark-semantics audit — Slice 630 exit

## Result

S630 reviewed the public receiver and standards sources that could establish a
specific mark-encoding rule. **None supports a concrete, rights-accessible
mapping for S629's lost/approximated button and buttonhole marks.** The V03
hold remains unchanged. This is a bounded documentation result; it is not
evidence that all DXF receivers fail.

| Source | Directly established | Not established | S630 disposition |
| --- | --- | --- | --- |
| CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export), official API `updated_at=2026-09-28` | The application lists Standard, AAMA and ASTM import modes and Standard, DXF-AAMA and DXF-ASTM export modes, plus options for notches, annotations, curve optimization and grading. | No normative edition/year, versioned apparel profile, mark entity/layer mapping, or semantics for button circles and buttonhole points. A UI mode label does not certify conformance. | Does not justify a guessed mapping or another CLO conversion trial by itself. |
| ASTM, [D6673-10 official record](https://store.astm.org/d6673-10.html) and [catalog](https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html) | The public record identifies D6673-10 as withdrawn in 2019 with no replacement. Its public scope describes 2D sewn-product pattern pieces and grade-rule tables, excludes piece relationships/2D–3D geometry correspondence, and names AutoCAD Version 13 DXF. | Public record does not expose full technical clauses or the apparel mark layer/entity table. Withdrawal does not show that all vendors stopped using a related profile. | No rights-accessible normative mark rule is available from these public pages. Do not claim D6673-10 conformance. |
| NIST, [NISTIR 5969](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5969.pdf), 1997 | A STEP/EXPRESS research model names five mark categories. Section 2.1 defines `MARK_FEATURE`; Figure 2.9 links its feature type and location to a point; Figure 2.10 defines point X/Y coordinates. Section 3.3 describes a prototype STEP/EXPRESS-to-AAMA-292 translator and 14 apparel information layers. | It defines no button/buttonhole mark types, circle/radius size, or exact DXF entity/layer encoding. It is historical research and calls its model a proposal for future apparel STEP work. It describes ANSI/AAMA-292 as AutoCAD Version 11 DXF, not ASTM D6673-10's Version 13. The two single-size demonstration garments do not prove grading. | Conceptual mark categories do not justify translating a buttonhole POINT into a guessed drill-hole layer or replacing a source circle with a point. |
| NIST, [NISTIR 5823](https://nvlpubs.nist.gov/nistpubs/Legacy/IR/nistir5823.pdf), 1996 | Historical survey entry for ANSI/AAMA-292-1993. | No current status, rights, mapping or receiver conformance; one historical footnote is internally inconsistent. | Historical context only. |
| Autodesk, [DXF HEADER reference](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm) | `$ACADVER` AC1009 identifies R11/R12 and AC1012 identifies R13. The existing S628 CLO output records AC1009. | Header identity alone proves no apparel-profile conformance or semantic preservation. | The tested S628 output is not identified as the Version 13 DXF named in ASTM D6673-10's public scope. |

The NIST diagrams were rendered from the official public PDF and visually
checked. Claude Opus 5.5 `xhigh` independently reviewed the named sources,
returned the required `WORK FINISHED`, and made no file changes. Codex
rechecked the diagram, CLO API article metadata, ASTM record, S628 `$ACADVER`
and Autodesk code definitions. The detailed source docket is
`profile-mark-source-audit.md`; the independent return is
`claude-review-return.md`.

## V03 impact and continuing plan

- No additional CLO operation is justified by an invented mark-layer
  permutation. Existing empirical results remain scoped to their tested build,
  fixture, mode and output.
- S630 clears no V03 gate and changes no acceptance threshold, status, hold,
  source geometry, receiver rights position, legacy DXF behavior or protected
  export identity. The all-seven recipe requirement, exact geometry, units,
  identity/revision, semantic marks, grading/options, negative inputs,
  repeatability, render review and rights/profile evidence all remain as
  applicable and documented in the current V03 matrix.
- **Next:** S631 should audit the already-existing S617 CLO DXF-ASTM output
  offline against its pinned centimeter-header Polo source, first inventories
  exact source/output mark primitives and geometry, then inspects the saved
  reimport render at detail scale. This uses a completed, hash-pinned exchange
  and diagnoses whether the already-tried CLO ASTM-labeled export carries any
  usable mark geometry without repeating a UI operation. If there is no
  identifiable preserved mark geometry, record that measured limit and move
  to the next distinct V03 gate. Do not change source inputs, infer a
  normative edition from `DXF-ASTM`, relax any criterion, or claim profile
  conformance from this offline audit.

## Verification and time

- Start: `2026-10-09 17:46:54 UTC`; clean S629 `8a45420b96f8513f02348aabe19d5b247c57aba1`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` was an ancestor; board revision 3660. Validated start replay: 3660→3662.
- NISTIR pages containing Figures 2.9 and 2.10 were downloaded from NIST's official host to temporary local review files and rendered; the figures match the report's point-based model. Autodesk's official `$ACADVER` table confirms the S628 header interpretation. CLO Help Center API reports updated 2026-09-28.
- Independent Claude Opus 5.5 `xhigh` returned after approximately 6 minutes with exact `WORK FINISHED`; review worktree was clean. Analysis and records: approximately 6 minutes, overlapping research wait; focused checks and visual source review: approximately 3 minutes; validated board closeout/documentation: approximately 4 minutes; maintainer decisions: 0 minutes. No CLO session operation occurred.
- `npm run control-center:test`: 42/42 passed. Exit preflight and post-replay board validation passed at revision 3664. `git diff --check` passed. No production code changed; changed-code coverage is not applicable. The one full repository gate remains due on the settled Epic/PR candidate.
- The first post-replay preflight assertion expected a phrase without the packet's Markdown line wrap; the check failed before any mutation. The assertion was corrected to accept intervening whitespace and then passed against the same unchanged, revision-3664 board.
- CLO remains open for the active Epic. CLO rights and local-processing authorization are settled and recorded. V02 remains Done; V03 and EPIC-17 remain In Progress. No physical-fit, factory-acceptance, or production-readiness claim is made.
