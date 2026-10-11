# G04/UI recommendation reconciliation — Slice 354

## Start boundary and authority

- Started 2026-10-02 03:39:28 UTC in `C:\Users\kshit\.codex\worktrees\epic-17-g04\designApp`, on clean `codex/epic-17-g04` at S353 `6ea5967b1c2e76402323a730a35bc25972993e3a` (`Slice 353: project Polo cap seams to armholes`). Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. The canonical board was revision 1402; EPIC-17 and G04-V02 were In Progress, V01 Done, V03 Backlog, EPIC-14/15/16 closed. No UIQ item, approval evidence or matching EPIC-17 reconciliation comment was present.
- Reserved S354 as the next unused slice after checking current history. The S353 receipt, current admission packet, state, board, sequence, Epic17 note, additive commands, UI research recommendations, UI manual-quality findings and workflow instructions govern this slice.
- Maintainer-approved sequence dated 2026-10-01 authorizes planning/registration. This slice reconciles scope and registers Backlog items only; it does not admit UI implementation packages.

## Reconciliation against admitted G04

| Recommendation | Current G04 disposition | Evidence / boundary |
|---|---|---|
| Source-bound construction geometry and technical-flat semantics | Already in scope and implemented incrementally in V01/V02. Continue exact source piece/edge/landmark, orientation, multiplicity, seam/mark roles, layer order, option topology and same-revision provenance checks. | Existing source-to-view metadata and live SVG compiler remain the single renderer. Every unresolved topology or visibility conflict keeps the complete face held. |
| Piece/revision identity | Existing required contract; retain in every view primitive, overlay, POM anchor and emitted output. | Current S353 evidence checks exact same-revision armhole references. No new identity system or parallel renderer. |
| Exact POM callouts and inspection readability | Already in V02. Values/methods/anchors must remain source-bound; inspect label, marker and leader geometry in actual rendered views across options. | Current Polo front labels and neck/shoulder crowding remain held. No dropping or changing a POM, generic cosmetic cleanup, or loosening readability gates. Review MQF-005–007 at applicable output exits. |
| Artwork and colorway overlays | Existing G04 V02 behavior where the recipe and face support them. Validate source region, piece and revision identity and option-specific closure/placement with emitted views. | Preserve recipe-specific holds and source evidence. UI research does not authorize new artwork acquisition, an editor, or a schema. Review MQF-011 at its relevant exit. |
| Inspection toolbar, contrast and other presentation recommendations | Product-level candidate UI packages outside G04's admitted critical path. | UIQ-02..08 and UIQ-GATE are Backlog. Isolated candidates require their own admission; no contributor starts here. UIQ-GATE may depend on EPIC-17, but EPIC-17 has no dependency on UIQ work. |
| Artwork catalog presentation | Existing catalog UI candidate outside G04; existing G04 overlay correctness remains in scope. | UIQ-05 Backlog; no catalog/schema/acquisition expansion. |
| Recipe thumbnails, pack forms, assembled 3D and optional ShaderGradient | Later G06/G05/G09 or conditional UI work under their own admissions. | UIQ-09..13 Backlog. Pattern-linked side/oblique/inside/assembled views remain G09/D04; production tech-pack content remains G05. |

The recommendations therefore add no new V02/V03 gate and do not relax any current hold. The roadmap still requires all seven recipes to pass V02 before V03, protects generic DXF behavior and byte identities, and permits only evidence-backed industrial CAD compatibility claims. MQF-004–007, MQF-011, MQF-012 and MQF-015 retain their existing “To be reviewed” exits; post-G17 deferrals are unchanged.

## Scope, non-goals, risks and gates

Scope: selectively retain the approved UI planning/research references and G04 reconciliation; preflight and replay only the supplied additive board commands through the validated command layer; append a regression assertion without replacing current board tests; update current state/context/roadmap and board evidence.

Non-goals: no production UI or flat renderer changes; no new visual treatment, pattern geometry, stitch graph, recipes, measurements, artwork schema, POM behavior, hold release, acceptance criteria or V02/V03 dependency changes. No UIQ implementation or contributor launch. No V03 work, supplier contact, spending, hosted service, physical fit, factory acceptance or production-readiness claims.

Required checks: command-sequence preflight against a clone of the latest board; validated replay against that board with fresh expected revisions and identity-aware skipping; Control Center tests; `git diff --check`; inspect resulting board statuses/dependencies/evidence and the complete diff; one uniquely numbered commit. No full Epic suite is due for this documentation/board-only slice. No safe disjoint external delegation exists.

## Exit evidence

- Retained the approved planning packet, boundary note and 29-command JSON in
  `docs/planning/`; retained the relevant 42-row recommendation report and
  linked visual atlas in `docs/research/ui-repo-review-2026-10-01/`. Did not
  copy the stale local-status commands, old board/state, or unrelated UI
  prototype. Updated `CONTEXT-INDEX.md`, `PROJECT-STATE.md`, the G04 roadmap
  row, and the existing Control Center board test.
- Clone preflight through `executeBoardCommand`: 29 commands, 29 applied, 0
  identical skipped; clone revision 1402→1431. Canonical replay through the
  validated command layer with fresh expected revisions: 29 applied, 0
  identical skipped; board revision 1402→1431. A second identity pass skips
  all 29. All 14 UIQ cards are Backlog, the approved EPIC-17 comment and
  `E-UIQ-APPROVAL` exist, EPIC-17 retains only its existing EPIC-14/15/16
  dependencies, and G04-V02 remains In Progress. Validated revisions 1432–1438
  add S354 start/exit evidence and comments to G04-V02 and EPIC-17.
- The appended backlog/dependency regression assertion passes. `npm run
  control-center:test`: 35/35, including UIQ backlog/dependency and S354 packet
  link regressions; `git diff --check`: pass. No production code, renderer,
  export behavior, pattern/stitch geometry or gate changed. The full Epic gate
  is deferred until the integrated Epic/PR candidate is settled.
- The packet-link regression initially assumed its exit comment was the most
  recent board comment. A later validated verification note made that false;
  the test now checks that the exit comment exists anywhere in the history,
  and the focused suite passes 35/35.
- First preflight-helper attempt failed before any board write because it
  expected every `addEvidence` command to contain evidence content; commands
  that only link existing evidence use `evidenceId`. After correcting the
  helper to recognize both forms, clone preflight and canonical replay passed.
- Elapsed 03:39:28–03:53 UTC, approximately 14 minutes: reconciliation,
  documentation and board work 9m; focused verification/diff review 4m;
  external-agent waits 0m; maintainer-decision time 0m. No safe disjoint
  delegation was appropriate.

**Disposition:** S354 is complete as a planning/context/board reconciliation.
The G04 V02 holds and all-seven acceptance requirement are unchanged; V03
remains gated. UIQ items are registered only and do not authorize candidate
implementation.

**Next action:** reserve S355 from refreshed history and board; continue the
remaining G04-V02 held views and option checks. Keep exact source and rendered
evidence gates; do not begin V03 or UIQ implementation until its respective
entry conditions are met.
