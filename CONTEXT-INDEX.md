# InfiniDrip context index

This repository is the durable source of project context shared by Codex,
Claude Code, and future development sessions. Chat history and external Project
Knowledge may add evidence, but must not silently override the documents below.
The execution-time efficiency rules in `AGENTS.md` and their maintainer
decision in `docs/PROJECT-DECISIONS.md` apply to every new or resumed task.

## Authority and reading order

Read these before any implementation work, in order:

1. `AGENTS.md` — standing workflow and verification rules.
2. `PROJECT-STATE.md` — authoritative current status, completed slices, active
   directive, exact test count, and immediate next work.
3. `docs/PROJECT-DECISIONS.md` — maintainer decisions and resolved ambiguities.
4. `ARCHITECTURE.md` — current system structure, invariants, and architectural
   boundaries.
5. The task-relevant planning and research documents listed below.

When documents conflict, prefer the newest evidence in this order:

1. Current code and Git state
2. `PROJECT-STATE.md`
3. `docs/PROJECT-DECISIONS.md`
4. `ARCHITECTURE.md`
5. `docs/planning/MVP-PLAN.md`
6. `docs/planning/ROADMAP.md`
7. Historical briefs and archived handoffs

Older test counts, recipe counts, and "next slice" statements remain historical
snapshots; they are not current status.

Every fresh or resumed task must be self-contained from the repository and may
not rely on chat history. `AGENTS.md` defines the admission-packet and
slice-boundary handoff contract; `PROJECT-STATE.md` and the canonical Control
Center board define current status. Planned roadmap scope becomes executable
only through an explicitly admitted, linked Epic packet.

## Current status documents

- `PROJECT-STATE.md` — engineering status log and immediate roadmap.
- `ARCHITECTURE.md` — newcomer-readable current architecture and standing
  principles. Its former mixed current/history narrative is preserved in
  `docs/archive/ARCHITECTURE-HISTORY.md`.
- `docs/BUG-LEDGER.md` — durable UI/UX bug IDs, severity, priority, root cause,
  fix, and verification history.
- `docs/research/UI-MANUAL-QUALITY-FINDINGS-2026-09.md` — 15 maintainer browser
  annotations captured as high-priority findings, with mapped G03–G17 review
  checkpoints and post-G17 follow-up. Findings only; they are not roadmap or
  Control Center work items until the maintainer confirms.
- `README.md` — user-facing project overview; useful but less authoritative than
  the two files above.
- `docs/PROJECT-DECISIONS.md` — decisions confirmed directly by the maintainer.
- `docs/OPENCODE-WORKFLOW.md` — required delegation, branch, PR, review, and
  feedback policy for using OpenCode alongside Codex.
- `docs/research/PUBLIC-WEB-PLATFORM-COST-RESEARCH.md` — proposed public-web,
  identity, delivery-governance, feature-flag and local-control-center stack;
  current provider costs, assumptions, risks and approval gates. It is not an
  authorization to purchase a service, collect user data, deploy publicly or
  change the current local-first product boundary.
- `ops/control-center/` — Slice 184 schema-v2 canonical board and shared atomic
  command layer, Slice 185 localhost-only authoring service and responsive
  dashboard, and Slice 211's guarded maintainer-only epic organization. It is
  operational evidence, not the hosted workspace.
- `ops/web/` — completed Slice 173 provider-neutral artifact manifest utility,
  Slice 179 local candidate/rollback rehearsal, and Slice 209 rendered-browser
  verifier for safe local artwork drag/drop persistence; delivery descriptors
  and preview instructions do not deploy or create a provider account.
- `ops/readiness/` — completed Slice 180 deterministic synthetic readiness
  fixture and strict validator; provider-backed scenarios remain deferred.
- `docs/release/EPIC-12-NO-COST-INTERIM-EXIT.md` — completed Slice 181
  preview-only/no-cost exit, final verification, launch re-entry boundary and
  maintainer discussion gate; it does not claim authenticated beta or
  production readiness.
- `docs/release/EPIC-13-PRE-GARMENT-READINESS-EXIT.md` — Slice 211's verified
  grouping and closure of the nine completed pre-garment phases. Epic 13 does
  not authorize a garment queue; explicit garment-direction approval remains
  separate.
- Slices 183–186 complete the documentation pass and no-cost local Control
  Center v2. Slice 187 adds validated local UI item creation; `board.json`
  remains canonical. The approved Phases 1–9 pre-garment sequence is complete
  and grouped under closed EPIC-13 in `board.json`; see the exit report and
  `docs/planning/PRE-GARMENT-EXECUTION.md`. Do not start a garment queue before
  separate explicit maintainer approval.
- Phase 2's read-only repository and newcomer audit is complete and recorded in
  `docs/planning/REPOSITORY-AND-NEWCOMER-AUDIT.md`. No files or history were
  removed or rewritten; the personal resume-staging archive remains tracked
  under the non-destructive default. Phase 3's accepted tutorial specification
  is `docs/planning/FIRST-LOAD-TUTORIAL-SPEC.md`; Phase 4 implements and
  verifies that contract. See `PROJECT-STATE.md` for the latest phase result.

## Planning documents

- `docs/planning/MVP-PLAN.md` — operative six-month launch plan. Its old
  "immediate next actions" are a historical baseline; use `PROJECT-STATE.md` for
  today's next slice.
- `docs/planning/ROADMAP.md` — strategic competitive analysis, prioritization,
  long-term scope, and cut list.
- `docs/planning/END-TO-END-CAPABILITY-ROADMAP.md` — maintainer-directed
  post-Phase-9 capability sequence, evidence and ambiguity ledger, planned work
  packets, conditional target dates, dependencies, numbered Epic 14–30 mapping,
  initially tracked lanes A–E, the Epic 14 execution-order
  diagram, and digital exit gates. Slice 242 reconciles its status snapshots
  with the merged G02 exit; future scope remains planned until separately
  admitted. It
  does not authorize a garment queue, launch spending, supplier contact, or
  physical sampling after the completed pre-garment sequence.
- `docs/planning/EPIC-14-ADMISSION.md` — the maintainer-admitted C01/C02/C05/C06
  evidence wave, its individual exits, conditional targets, and preserved
  product/supplier/sampling boundaries.
- `docs/planning/EPIC-15-ADMISSION.md` — the post-G01 maintainer admission,
  verified repository starting point, F01/F02/F03 sequence, Slice 229–240
  boundaries, risks, and exit gates. It authorizes only local-first G02 work;
  use `PROJECT-STATE.md` and the canonical Control Center for current status.
- `docs/planning/EPIC-16-ADMISSION.md` — the maintainer-admitted G03/M01–M03
  execution contract, verified start, seven-recipe C03 boundaries, ordered
  Slice 244–253 plan, source qualification and grade approval gates, and merge
  exit; Slices 254–256 are bounded final-review corrections and verification
  follow-ups, not new garment scope. Slices 246–247 completed the guided route,
  source-qualified field help, resume, conflict, narrow-layout, accessibility
  and all-recipe validation. Slice 248–249 completed M02. Use
  `PROJECT-STATE.md` and the canonical Control Center for live status.
- `docs/planning/EPIC-17-ADMISSION.md` — Slice 261's maintainer-authorized
  G04 admission from verified `origin/main`, ordered V01 → V02 → V03 scope,
  current conditional 39–44-slice estimate, rights/receiver gate, acceptance evidence and
  merge exit. V01 and its contracts are complete; consult `PROJECT-STATE.md`
  for the current V02 rendering and interchange gates.
- `docs/research/epic17/G04-V02-TROUSER-WAISTBAND-DEPTH-POM-S311.md` — Slice
  311's source-backed mark-target POM mapping, production-rendered verification,
  held-face limits and current G04 boundary. Use `PROJECT-STATE.md` and the
  validated Control Center board for the next slice.
- `docs/research/epic17/G04-V02-SKIRT-BACK-POM-ANCHORS-S312.md` — Slice 312's
  source-equivalent Skirt waist/hip anchors on the accepted back flat, plus
  current rendered evidence and hold limits. Use `PROJECT-STATE.md` and the
  validated Control Center board for the next boundary.
- `docs/research/epic17/G04-V02-TANK-BACK-POM-ANCHORS-S313.md` — Slice 313's
  active source-equality gate for exact Tank back POM targets. Front-neck drop
  remains front-only; exit evidence and unsupported-view holds are recorded in
  the packet and `PROJECT-STATE.md`.
- `docs/research/epic17/S313-tank-back-pom-browser/` — S313 production Chromium
  matrix, parsed SVGs, diagnostics and manually reviewed default screenshots.
- `docs/research/epic17/G04-V02-TEE-BACK-POM-ANCHORS-S314.md` — S314's
  source-equality gate and verified exit for exact Tee back POM vertices. Polo
  remains on the front-only shared POM set, and Tee's complete face stays held
  for its sleeve assembly gap.
- `docs/research/epic17/S314-tee-back-pom-browser/` — S314's production
  Chromium matrix, diagnostics and manually reviewed front/back screenshots
  for default and changed Tee measurements.
- `docs/research/epic17/G04-V02-INTEGRATED-MATRIX-S315.md` — S315's start
  packet for a fresh all-recipe, all-option production Chromium replay and
  accepted/held output reconciliation after S299–S314. Check
  `PROJECT-STATE.md` and the validated Control Center board for its exit.
- `docs/research/epic17/S315-browser-final/` — S315's complete 73-configuration
  production Chromium matrix, accepted SVGs, retained UI screenshots,
  diagnostics, and manual output review. S315 confirms 28/146 accepted and
  118/146 held; V02 remains open.
- `docs/research/epic17/G04-V02-TROUSER-BACK-OVERLAY-S316.md` — S316's
  bounded output-only Style overlay check on the newly accepted Trouser back;
  see `PROJECT-STATE.md` and the canonical board for its verified exit.
- `docs/research/epic17/S316-trouser-back-overlay/` — S316's retained live
  production Chromium replay, matrix, SVG, screenshots and diagnostic output.
- `docs/research/epic17/G04-V02-TROUSER-OPTION-OVERLAY-S317.md` — S317's
  bounded Trouser option/overlay boundary check at documented option endpoints;
  read with `PROJECT-STATE.md` and the canonical board before continuing.
- `docs/research/epic17/S317-trouser-option-overlay/` — S317's five-case
  production replay, option matrix, retained SVG/screenshots and raster manual
  review, including the visible-colorway blocker.
- `docs/research/epic17/G04-V02-CLOSED-COLORWAY-CONTOURS-S318.md` — S318's
  exact-closure colorway fill contract, fail-closed behavior and verification
  gates.
- `docs/research/epic17/S318-colorway-browser/` — S318's fresh live-UI SVGs,
  production raster comparisons, replay matrices and manual review.
- `docs/research/epic17/G04-V02-INTEGRATED-OUTPUT-RECONCILIATION-S319.md` —
  S319's admitted all-recipe/all-option production replay, colorway raster,
  accepted/held reconciliation and V02 readiness gate.
- `docs/research/epic17/S319-browser-final/` — S319's retained 73-case/146-face
  production replay, selected rendered output, all emitted colorway SVGs and
  rasters, per-fill review and manual accepted/held output assessment.
- `docs/research/epic17/G04-V02-CONSTRUCTION-EVIDENCE-AMBIGUITY-RESOLUTION-S320.md`
  — S320's admitted source audit and fact-by-fact evidence/decision ledger;
  mapping is gated until each needed construction relation is established.
- `docs/research/epic17/G04-V02-SOURCE-MAPPING-PROPOSALS-S321.md` and
  `docs/research/epic17/S321-pattern-overlays/` — exact pattern topology
  overlays and source-versus-decision proposals for every remaining V02 hold.
  The decisions are recorded in `docs/PROJECT-DECISIONS.md`; S322's focused
  implementation and exit gates are in
  `docs/research/epic17/G04-V02-TEE-FITTED-SLEEVE-VIEW-MAPPING-S322.md`.
  S323's approved Polo/Woven collar exterior mapping and checks are in
  `docs/research/epic17/G04-V02-COLLAR-EXTERIOR-VIEW-MAPPING-S323.md`.
  S324's conditional Woven sleeve/band and approved closure mapping boundaries
  are in `docs/research/epic17/G04-V02-WOVEN-SLEEVE-CLOSURE-VIEW-MAPPING-S324.md`.
  S325's concrete Trouser front source-repair proposal and in-memory
  24-configuration feasibility evidence are in
  `docs/research/epic17/G04-V02-TROUSER-FLY-SOURCE-REPAIR-PROPOSAL-S325.md` and
  `docs/research/epic17/S325-trouser-source-proposal/`.
  The maintainer approved the exact proposal; S326's bounded implementation,
  export-identity boundary and all-24 option/render gates are in
  `docs/research/epic17/G04-V02-TROUSER-FLY-UNDERLAP-IMPLEMENTATION-S326.md`.
  Current production browser and source-topology evidence is in
  `docs/research/epic17/S326-trouser-browser/`.
  S327's source-exact waistband contour and measured hip-depth label fixes,
  focused gates, 24-configuration Trouser replay and integrated matrix are
  verified in
  `docs/research/epic17/G04-V02-TROUSER-FRONT-COLORWAY-CALLOUT-S327.md`,
  `docs/research/epic17/S327-trouser-browser/` and
  `docs/research/epic17/S327-integrated-browser/`. At S327 exit, 52/146 faces
  emit and 94 remain held; all-seven-recipe V02 acceptance is still required.
  Slice 328's approved fill-only sleeve closure metadata, rendered body-overlap
  finding and explicit hold are recorded in
  `docs/research/epic17/G04-V02-TEE-FITTED-SLEEVE-COLORWAY-S328.md`, with strict
  and integrated production-browser output in `S328-tee-fitted-browser/` and
  `S328-integrated-browser/`. The integrated tally remains 52/146 accepted
  and 94 held; no V02 acceptance is inferred from the earlier pre-review run.
  S329 confirms the source endpoint order but rejects the generated
  body-relative Tee/Fitted sleeve transform after rendered FRONT_FLAT geometry
  still crosses inward; all four defaults remain held. The diagnostic
  candidates and the no-regression 73-configuration production replay are in
  `docs/research/epic17/G04-V02-TEE-FITTED-SLEEVE-TRANSFORM-S329.md`,
  `docs/research/epic17/S329-orientation-candidate/`, and
  `docs/research/epic17/S329-tee-fitted-browser/`,
  `docs/research/epic17/S329-integrated-browser/`. Do not treat candidate
  SVGs as accepted output; use `PROJECT-STATE.md` and the validated board for
  the next S330 boundary. S330's verified front/back endpoint mappings, strict
  and integrated production output, changed-measurement hold and MQF review are
  in `docs/research/epic17/G04-V02-TEE-FITTED-SLEEVE-ENDPOINT-MAPPING-S330.md`,
  `docs/research/epic17/S330-tee-fitted-browser/`, and
  `docs/research/epic17/S330-integrated-browser/`. Only Tee/Fitted defaults
  newly pass; all other output holds remain. Slice 331 investigates the exact
  Polo split-collar colorway closure under the previously approved S321
  shoulder stations; its scope and gates are in
  `docs/research/epic17/G04-V02-POLO-COLLAR-COLORWAY-CLOSURE-S331.md`. Use
  `docs/research/epic17/S331-polo-browser/manual-review.md` for the exact
  fill-only result and the separate Polo sleeve crossing that keeps all 34
  faces held; final full-face withholding evidence is in
  `docs/research/epic17/S331-polo-browser-final/`. Use `PROJECT-STATE.md` and
  the validated board for the S331 exit and next S332 gate. S332's exact live
  Polo sleeve source trace, 17-option topology comparison, proposed face map,
  current shoulder residual, and diagnostic overlays are in
  `docs/research/epic17/G04-V02-POLO-SLEEVE-MAPPING-PROPOSAL-S332.md` and
  `docs/research/epic17/S332-polo-sleeve/`. The maintainer approved the exact
  view-only map; S333's implementation and 17-option rendered replay are tracked
  in `docs/research/epic17/G04-V02-POLO-SLEEVE-IMPLEMENTATION-S333.md`. Polo
  remains fully held: the 17-option production Chromium replay emitted 0/34
  faces because `Sleeve-cap ease` remains 0.68 cm against the 0.25 cm gate.
  Screenshots, per-face issue records and replay are in
  `docs/research/epic17/S333-polo-browser/`; do not release those views or
  infer the sleeve POM anchors from the view convention. S334's admitted
  Woven sleeve-placement diagnosis, exact source/view scope, 28-configuration
  gates and hold boundary are in
  `docs/research/epic17/G04-V02-WOVEN-SLEEVE-PLACEMENT-S334.md`; current
  source-topology overlay, 28-option diagnostics, production Chromium matrix and
  reviewed hold screenshots are in `docs/research/epic17/S334-woven-sleeve/`.
  The two source-order view corrections are implemented and covered, but every
  Woven face remains held (0/56 emitted); continue from the next action in
  `PROJECT-STATE.md` and the validated board.
- `docs/research/epic17/G04-V02-WOVEN-FRONT-COLORWAY-CLOSURE-S335.md` — Slice
  335's exact contour closures, source-versus-approved-view evidence, residual
  holds and output review. Its 28-case topology trace, annotated overlay,
  candidate renders and final 56-face held replay are in
  `docs/research/epic17/S335-woven-contours/`. Every Woven face remains held
  (0/56 emitted) because exact sleeve-cap and outerStand-to-neckline joins still
  exceed the 0.25 cm residual gate; closures do not imply acceptance. Continue
  from the S335 exit in `PROJECT-STATE.md` and the validated board; keep V03
  gated.
- `docs/research/epic17/G04-V02-WOVEN-PLACEMENT-DIAGNOSIS-S336.md` — S336's
  source-order endpoint correction, 28-case station/transform trace, annotated
  join panels and production Chromium hold replay. All 56 Woven faces remain
  held: the sleeve-cap and outerStand-to-neckline joins still exceed 0.25 cm,
  with an inconsistent back sleeve transform. Continue from its explicit
  maintainer decision request; do not introduce nonrigid geometry or lower the
  all-seven acceptance criterion without approval.
- `docs/research/epic17/G04-V02-POLO-REMAINING-HOLDS-S337.md` — current
  independent source/topology, POM-reference and production-output diagnosis
  for the remaining Polo V02 holds. It records the maintainer-approved
  conservative Woven hold, the approved two Polo dimension-only references,
  and the source-visible POM anchor map. Keep all Polo faces held until the
  17-option output gate passes.
- `docs/research/epic17/G04-V02-POLO-POM-ANCHORS-S338.md` — S338 implemented
  exact Polo same-revision POM role/edge/mark mapping and fail-closed option
  handling. Focused behavior/build/export/replay checks pass, but 100% branch
  coverage remains unmet, two stale Trouser assertions were found in the wider
  drafting/render selection, and the diagnostic POM labels crowd/overlap.
  Every Polo face remains held. Follow its exit record before starting the
  approved dimension-only annotations.
- `docs/research/epic17/G04-V02-POM-VERIFICATION-CLOSEOUT-S339.md` — active
  S339 packet for the specific S338 branch-coverage failure, corrected S326
  Trouser assertions, and the approved exact fly-underlap shield-edge notch.
  It authorizes that one construction mark without cut-geometry or stitch
  changes. Polo label crowding and approved dimensions remain separate work.
- `docs/research/epic17/G04-V02-POLO-DIMENSION-REFERENCES-S340.md` and
  `docs/research/epic17/S340-polo-dimensions/` — completed S340 packet and
  source/rendered evidence for the two Polo dimension-only references. The
  hidden `upperCollar.centerBack` fold-axis measurement and projected
  front-hem level are bound to exact source revision identities. Production
  replay retains all 34 Polo holds for unresolved sleeve assembly and POM label
  conflicts; V02 and V03 remain open/gated.
- `docs/research/epic17/G04-V02-INTEGRATED-HOLD-REFRESH-S341.md` and
  `docs/research/epic17/S341-integrated-browser/` — completed S341 current-build
  Chromium replay, case-by-case reconciliation and exact hold inventory for all
  73 configurations / 146 faces. Status remains 56 accepted / 90 held; the
  refreshed blockers select the next bounded Woven collar-interface
  investigation.
- `docs/research/epic17/G04-V02-WOVEN-COLLAR-JOIN-DIAGNOSIS-S342.md` and
  `docs/research/epic17/S342-woven-collar/` — completed source/overlay
  diagnosis across all 28 Woven options. It finds a straight stand base against
  curved front/yoke neckline pieces and proposes one exact body-edge seam
  representation. The maintainer has approved the view-only convention; S343
  implements it while preserving the source stitch and every other output hold.
- `docs/research/epic17/G04-V02-WOVEN-COLLAR-SEAM-REPRESENTATION-S343.md` and
  `docs/research/epic17/S343-woven-seam/` — completed approved Woven base-seam
  display mapping and 28-configuration/56-face production replay. The duplicate
  collar-base residual is gone from guidance, but all Woven faces remain held
  by sleeve-cap residual/solver conflicts; no face is accepted.
- `docs/research/epic17/G04-V02-WOVEN-SLEEVE-CAP-JOIN-DIAGNOSIS-S344.md` and
  `docs/research/epic17/S344-woven-sleeve/` — completed Slice 344 source,
  topology and transform diagnosis for Woven sleeve-cap joins across all 28
  configurations. No production edit is made; all 56 faces remain held pending
  complete output validation. The maintainer approved S345's bounded
  revision-bound view-only eased-seam projection; the S345 implementation
  packet and exact decision record govern the work.
- `docs/research/epic17/G04-V02-WOVEN-EASED-SEAM-PROJECTION-S345.md` — current
  S345 exit record: exact approved Woven body-edge projection, duplicate
  cap-stroke suppression and back-facing seam-layer correction. Source geometry
  and stitch graph remain unchanged. `docs/research/epic17/S345-woven-sleeve/`
- `docs/research/epic17/G04-V02-POLO-RESIDUAL-AND-LABEL-HOLD-DIAGNOSIS-S351.md`
  and `docs/research/epic17/G04-V02-POLO-ROUTED-POM-LAYOUT-EXPERIMENT-S352.md`
  — S351's current-source 17-option diagnosis retains all 34 Polo holds for
  the 0.68 cm cap residual and 51 recurring label failures. On 2026-10-02 the
  maintainer approved S351's view-only normalized-arclength mapping from the
  two sleeve-cap halves to their receiving armholes. S352 independently tests
  routed POM label layout; none of the 51 tested leader candidates passed the
  rendered-stroke/label checks. Its 34 source SVGs and candidate overlays are
  under `docs/research/epic17/S352-polo-pom-routing/`. Neither the decision nor
  the experiment accepts a Polo face.
  contains the 28-option production replay and `manual-review.md`; 28 front
  candidates emitted but none passed review, while all 28 backs remain held on
  open collar contours. No Woven face is accepted.
- `docs/research/epic17/G04-V02-WOVEN-COLLAR-POM-REMAINING-HOLDS-S346.md` —
  S346 exit for both-face approved Woven collar fill closure, same-revision
  source-backed POM anchors and the retained 28-option replay. All 56 candidates
  remain manually rejected for detached/crossing collar contours and crossing
  back strokes. `docs/research/epic17/S346-woven-collar/` contains full replay,
  preserved initial failure, source overlay and manual review. V02 remains
  all-seven and V03 remains gated.
- `docs/research/epic17/G04-V02-WOVEN-COLLAR-BACK-CROSSING-DIAGNOSIS-S347.md` —
  S347 source/entity diagnosis of the detached Woven collar contours and
  crossing back strokes. It identifies a source-ID substring collision that
  places `sleeveBand` with the earlier `sleeve` role; exact overlays and
  same-source assembly transforms are retained in
  `docs/research/epic17/S347-woven-crossings/`. S348 is limited to exact role
  token matching; the other sleeve and collar defects remain held.
- `docs/research/epic17/G04-V02-WOVEN-ROLE-TOKEN-IDENTITY-S348.md` — S348
  fixes and verifies exact colon-delimited source-role identification for the
  Woven `sleeveBand` substring collision. Its 28-option audit confirms exact
  joins but finds four intersections between the mirrored band contours in
  every back view; all Woven faces remain held. The production replay and
  colored role overlays are retained in `S348-woven-role-token/`.
- `docs/research/epic17/G04-V02-WOVEN-BACK-BAND-PAIR-CROSSING-S349.md` — S349
  traces the source stitch graph and option-specific placement behind the four
  sleeve-band pair intersections on every Woven back. Diagnostic only; preserve
  all holds until a source-backed or maintainer-approved mapping clears the
  crossing gate.
- `docs/research/epic17/G04-V02-WOVEN-BACK-BODY-OCCLUSION-PROJECTION-S350.md`
  — S350 tests the approved replay-only back body/yoke occlusion candidate
  against all 28 Woven backs. No production mapping changes or face release
  occur unless sleeve visibility, exact joins, silhouette, overlap and
  readability pass.
- `docs/research/epic17/G04-V02-POLO-RESIDUAL-AND-LABEL-HOLD-DIAGNOSIS-S351.md`
  — S351 re-drafts current Polo source across all 17 options / 34 faces,
  confirms the 0.68 cm sleeve-cap residual and exact anchors for its 51 blocked
  POM callouts, and retains diagnostic Chromium overlays. See
  `S351-polo-residual-labels/`; all Polo faces remain held pending a cap-ease
  view decision and routed-label verification.
- `docs/research/epic17/G04-V02-PROJECTION-MAPPING-S277.md` — Slice 277's
  current projection-mapping contract boundary, source-reference rules,
  fail-closed semantics, and focused acceptance gates.
- `docs/research/epic17/G04-V02-PROJECTION-GEOMETRY-S278.md` — Slice 278's
  current contract for compiling exact mapped edge runs while preserving
  source IDs and withholding faces with unresolved visible edges.
- `docs/research/epic17/G04-V02-LIVE-PROJECTION-S279.md` — Slice 279's
  source-backed per-recipe maps, live integration, rejected visual output and
  exit evidence. Its follow-up decision authorizes only view metadata supported
  by construction sources.
- `docs/research/epic17/G04-V02-ON-FOLD-VIEW-METADATA-S280.md` — Slice 280's
  source audit, exact center-axis reflection rules, explicit Skirt waistband
  exception, retained browser evidence and unresolved visual findings. V02
  remains open.
- `docs/research/epic17/G04-V02-ASSEMBLY-REVIEW-S281.md` — Slice 281's
  source seam/face-placement review, the Tee/Fitted sleeve and Skirt waistband
  fail-closed map decision, retained production browser output and the V02
  blocker disposition.
- `docs/research/epic17/G04-V02-FACE-SEGMENT-CONTRACT-S282.md` — Slice 282's
  completed source audit of ordered stitch traversal, shared junctions, and the
  fail-closed contract for source-backed face segments and view instances.
- `docs/research/epic17/G04-V02-SOURCE-INTERFACE-SEGMENTS-S283.md` — Slice
  283's completed implementation/exit record for source-derived Skirt
  waistband segments, panel-axis reflection, focused 100% coverage, protected
  identities and rendered evidence. G04 V02 remains open.
- `docs/research/epic17/S283-skirt-browser/` — retained production Chromium
  SVG/PNG output and revision/configuration evidence for the six S283 views.
- `docs/research/epic17/G04-V02-INTEGRATED-OUTPUT-REVIEW-S284.md` — completed
  Slice 284 73-configuration/146-face rendered review, mapped MQF checkpoints,
  held-source boundaries and V02 acceptance gate.
- `docs/research/epic17/G04-V02-SOURCE-REFERENCE-AUDIT-S285.md` — completed
  Slice 285 source/provenance audit for the remaining held V02 roles. It
  records the maintainer's source-backed view-metadata authorization and
  exact primary references. Woven collar/vent metadata is eligible for a
  bounded implementation; the Polo cubic outer-collar correspondence,
  Tee/Fitted sleeve projection and Trouser placement remain visibly held.
- `docs/research/epic17/G04-V02-WOVEN-COLLAR-VENT-S286.md` — Slice 286's
  bounded implementation packet for source-derived Woven collar/stand
  shoulder metadata and omission of the closed zero-depth vent. Its 56-face
  Chromium review rejected crossing front components and conflicting back
  sleeve-cap placement, so Woven remains visibly held. Polo, Tee/Fitted and
  Trouser blockers remain; V02 remains open. Candidate and retained output are
  in `S286-candidate-rejected/` and `S286-browser/`.
- `docs/research/epic17/G04-V02-WOVEN-SLEEVE-CAP-ASSEMBLY-S287.md` — Slice
  287's completed bounded audit of Woven sleeve-cap assembly placement and
  crossing source roles. The current eased aggregate stitch and pattern notch
  do not define front/back cap boundaries or instances; the affected faces
  remain held.
- `docs/research/epic17/G04-V02-POLO-COLLAR-LANDMARK-S288.md` — completed
  source audit for a pattern-specific shoulder correspondence on the Polo's
  authored outer collar cubic. Specific Polo and two-piece collar references
  establish base-seam construction but not a unique outer-cubic point; its
  faces remain held.
- `docs/research/epic17/G04-V02-INTEGRATED-OUTPUT-REVIEW-S291.md` — latest V02 integrated output gate. It retains the fresh 73-configuration/146-face Chromium matrix, accepted SVG replays, Tank overlay and manual MQF review; V02 remains open because 142 faces are held.
- `docs/research/epic17/G04-V02-WOVEN-SOURCE-MAPPING-S292.md` — S292's exact Woven body-axis/multiplicity and sleeve-cap source audit. Body metadata candidates are recorded, but no partial flat was emitted; all 56 Woven faces remain held pending complete sleeve and collar mapping.
- `docs/research/epic17/G04-V02-WOVEN-BODY-VIEW-METADATA-S293.md` — S293 confirms the source names right/left placket joins but both typed interfaces still target one front role; overlap layer order and instance binding remain unsupported, so the full Woven face stays held.
- `docs/research/epic17/G04-V02-COLLAR-REFERENCE-REVIEW-S294.md` — S294 compares the Massey composite-collar thesis and Müller & Sohn separate-stand method with Polo/Woven's authored outer contours; neither supplies the exact local shoulder-to-edge relation, so both full-face holds remain.
- `docs/research/epic17/G04-V02-WOVEN-BACK-YOKE-FOLD-MAP-S295.md` — S295 activates only exact source-declared center-back fold reflection for Woven back/yoke view metadata. The back/yoke source contours map, while sleeve/collar/placket and assembly gaps still withhold the full live faces.
- `docs/research/epic17/G04-V02-WOVEN-SLEEVE-SOURCE-REVIEW-S296.md` — S296 finds that Thread Theory's Fairfield sleeve tutorial covers sewing/ease handling but no exact current-pattern cap split or front/back view instance. The Woven sleeve and complete live faces remain held.
- `docs/research/epic17/G04-V02-WOVEN-FRONT-PAIR-METADATA-S297.md` — S297's bounded source-backed Woven physical-pair reflection contract; complete live faces remain held pending sleeve, collar and closure evidence.
- `docs/research/epic17/S297-browser-final/` — S297 production Chromium matrix and manually reviewed default/representative Woven held-output screenshots (28 configurations, 56 faces).
- `docs/research/epic17/G04-V02-HELD-GUIDANCE-READABILITY-S298.md` — S298's narrow G04 issue-list readability boundary; identical repeated edge-level hold messages may be grouped only while retaining all edge IDs and distinct blockers.
- `docs/research/epic17/G04-V02-WOVEN-PLACKET-SOURCE-REVIEW-S299.md` — S299 compares the Woven two-placket closure with its linked construction source; no unique physical-instance/layer map is supported, so all Woven faces remain held.
- `docs/research/epic17/G04-V02-POLO-COLLAR-FOLD-MAPPING-S300.md` — Slice 300 full-role reflection candidate emitted crossed Polo collar/stand components; its source change was reverted and complete face holds remain.
- `docs/research/epic17/G04-V02-POLO-COLLAR-SEWN-PLACEMENT-S301.md` — Slice 301 tests whether the exact Polo collar/stand sewn-interface graph uniquely places complete roles into front/back flat coordinates; implementation is gated on source and topology evidence.
- `docs/research/epic17/G04-V02-ESTIMATE-RECONCILIATION-S302.md` — Slice 302 re-estimates the remaining V02/V03/integrated gates from current verified output evidence and corrects stale future slice assignments.
- `docs/research/epic17/G04-V02-SOURCE-DEPENDENCY-INVENTORY-S303.md` — Slice 303 maps the 142 held faces to exact missing source facts/artifacts by recipe family; user-confirmed Woven placket hold remains intact.
- `docs/research/epic17/G04-V02-ACCEPTED-FACE-OVERLAYS-S304.md` — Slice 304's bounded actual-browser artwork/colorway overlay review for the four currently accepted Tank/Skirt faces.
- `docs/research/epic17/S304-browser/` — Slice 304's parsed front/back SVGs, production Chromium screenshots and revision/layer/target matrix for Tank and Skirt overlays.
- `docs/research/epic17/G04-V02-TROUSER-WAISTBAND-VIEW-SEGMENTS-S305.md` — Slice 305's bounded source/topology attempt to map Trouser waistband segments to front/back flats using the maintained V1 construction contract.
- `docs/research/epic17/G04-V02-TROUSER-WAISTBAND-FRAGMENTS-S306.md` — Slice 306's exact same-role Trouser waistband source intervals and panel-relative rigid attachments. Complete face output remains held until a later slice compiles these intervals and passes rendered review.
- `docs/research/epic17/S306-trouser-browser/` — Slice 306's production Chromium 24-configuration/48-face hold matrix, run log, and manually reviewed default front/back hold screenshots.
- `docs/research/epic17/G04-V02-TROUSER-WAISTBAND-FRAGMENT-COMPILER-S307.md` and `docs/research/epic17/S307-trouser-browser/` — Slice 307's compiler contract, verified exit, retained production Chromium matrix/SVG/PNG output, and stale-build diagnosis. Back output passes for all 24 Trouser configurations; front output remains wholly held at the exact center-front fragment join.
- `docs/research/epic17/G04-V02-TROUSER-FRONT-CENTER-JOIN-S308.md` — Slice 308's bounded source-backed Trouser front join/fly-shield map-or-hold packet; no construction or overlap may be inferred.
- `docs/research/epic17/G04-V02-TROUSER-BACK-RISE-POM-S309.md` — Slice 309 maps the existing finished Trouser back-rise method to its exact same-revision back-center geometry; no other POM or held front is inferred.
- `docs/research/epic17/G04-V02-TROUSER-WAISTBAND-DEPTH-POM-S310.md` — Slice 310 verifies whether the existing waistband-depth POM can target an exact source-backed landmark on the compiled same-revision Trouser back; implement only if the source fragment and emitted target prove it.
- `docs/research/epic17/S310-waistband-depth-anchor-probe.json` — executable summary of all 24 retained accepted Trouser back SVG checks, proving the source `centerBack` waistband mark is the revision-bound midpoint of the rendered closure edge and that its length matches each option value.
- `docs/research/epic17/G04-V02-TROUSER-WAISTBAND-DEPTH-POM-S311.md` — Slice 311's bounded implementation packet for the proven same-revision centerBack mark target, shared callout layout, and preserved Trouser front holds.
- `docs/research/epic17/G04-V02-TROUSER-FACE-PLACEMENT-S289.md` and `docs/research/epic17/G04-V02-SOURCE-DEPENDENCY-INVENTORY-S303.md` — Slice 305 addenda supersede the earlier claim that Trouser waistband construction intent is absent; the view-fragment/transform contract is still pending.
- `docs/research/epic17/S298-browser-final/` — S298 final production 73-configuration/146-face matrix and manually reviewed held/accepted screenshots; accepted Tank/Skirt SVG replay evidence is retained with the matrix.
- `docs/research/epic17/G04-V02-TEE-FITTED-SLEEVE-SOURCE-S290.md` — completed
  S290 source audit for the exact shared Tee/Fitted sleeve contour and
  supported orthographic view instances.
- `docs/research/epic17/G04-V02-TROUSER-FACE-PLACEMENT-S289.md` — completed
  S289 bounded source-topology audit; its fly/shield and waistband conflicts do not support a coherent placement, so both faces remain held.
- `src/render/technical-flat-projection.ts` — versioned G04 face-projection
  metadata and exact drafted-topology validation. Interior split landmarks not
  present as source endpoints remain unsupported and explicitly held.
- `docs/research/epic17/G04-V01-SOURCE-INVENTORY.md` — Slice 262's observed
  source inventory and seven-recipe front/back candidate map. It records what
  pattern, stitch, mark, option, artwork and POM data can support and where
  missing construction semantics must remain visible.
- `src/render/technical-flat.ts` — Slice 263's versioned vector primitive,
  source/revision, semantic-layer, artwork and anchored-callout contract plus
  runtime validation. Recipe mapping and live rendering remain in progress.
- `src/render/technical-flat-geometry.ts` — exact Block-derived geometry and
  the optional S278 projection-map path. It preserves stable outline IDs and
  per-edge provenance, and withholds faces that include unresolved visible
  edges; the live renderer does not use this path until recipe maps are added.
- `docs/research/epic17/G04-V02-LIVE-S272.md` — Slice 272's completed live
  front/back canvas integration and retained real-browser output evidence. Its
  runtime revision token binds one current draft snapshot and is not saved
  revision or receiver acceptance evidence.
- `docs/research/epic17/G04-V02-LABEL-REFLOW-S273.md` — Slice 273's completed
  seven-recipe default-label placement boundary, actual-browser collision and
  panel-clipping evidence, rendered outputs, interim mapped MQF review and
  verified exit gates. It records three existing assembly-cycle holds and
  allows no pattern geometry, POM value or missing construction source to be
  inferred to make labels fit.
- `docs/research/epic17/G04-V02-OPTION-MATRIX-S274.md` — Slice 274's current
  rendered all-recipe option endpoint scope, 146-face evidence, assembly
  blockers, mapped MQF review, overlay proof and next V02 gate.
- `docs/research/epic17/G04-V02-ASSEMBLY-CORRECTION-S275.md` — Slice 275's
  exact ordered-interface boundary and Trouser waistband-direction correction,
  full 146-face render result, unresolved source cycles and crossed accepted
  Polo/Woven output that keeps V02 open.
- `docs/research/epic17/G04-V02-FACE-PROJECTION-S276.md` — Slice 276's
  face-projection source investigation, rejected whole-fold reflection trial,
  and full 146-face browser evidence. No experimental product code was retained.
- `src/render/technical-flat-mapping.ts` and
  `docs/research/epic17/G04-V01-MAPPING-S264.md` — Slice 264's explicit
  seven-recipe role-to-face map, topology checks, option endpoint checks,
  construction-source mapping and unsupported-source notices. Actual assembled
  coordinates and live rendering are V02 work.
- `src/render/technical-flat-transform.ts` — Slice 265's rigid source-to-view
  transforms for paths and other flat primitives. It preserves curve controls,
  dimensions, source/revision identity and semantic layer while rejecting
  scaling and invalid coordinates. It does not assemble or render the live
  front/back views by itself.
- `src/render/technical-flat-geometry.ts` — Slice 266's revision-bound
  component source geometry compiler for mapped role outlines, dart legs and
  pattern marks. Coordinates remain component-local; hidden interior roles and
  unsupported sources stay explicit instead of being inferred as visible
  garment features.
- `src/render/technical-flat-options.ts` — Slice 267's raw option and
  topology gate. It checks recipe keys, finite values, declared ranges and
  increments before drafting, then requires valid source mapping and geometry
  on both faces; invalid input returns corrections without partial geometry.
- `src/render/technical-flat-assembly.ts` and
  `docs/research/epic17/G04-V02-ASSEMBLY-S270.md` — Slice 270's face-specific
  rigid placement map from ordered stitch interfaces, including multi-edge and
  split waistband joins, with explicit issues for unresolved construction.
  It preserves pattern coordinates but is not a rendered flat.
- `src/render/technical-flat-svg.ts` and
  `docs/research/epic17/G04-V02-SVG-S271.md` — Slice 271's centimeter-sized,
  layered SVG renderer, browser-SVG text measurement, revision metadata, and
  visible notice treatment. Its browser recipe matrix records eight default
  faces accepted and six blocked for label collisions; rendered reflow and live
  product integration remain required. PNG/SVG visual sample and recipe matrix
  are retained alongside the report.
- `docs/research/epic16/S250-EXIT.md` — verified S250 completion, test/build/
  browser evidence, and the remaining S251 integration boundary.
- `docs/research/epic16/S251-EXIT.md` and
  `docs/research/epic16/evidence/S251-graded-output-verification.json` — Slice
  251's approved plan-driven graded outputs, exact unrounded POM gate, output
  parsing and coverage evidence. Slice 252 records the independent-review
  safety remediation; Slice 253 is the final review and merge gate.
- `docs/research/epic16/S252-GRADE-RUN-SAFETY-REMEDIATION.md` and
  `docs/research/epic16/evidence/S252-safety-verification.json` — accepted
  independent S251 audit findings, bounded safety-remediation scope, exact
  acceptance results, full-coverage metrics, build/Control Center results, and
  rendered grade-plan review for Slice 252.
- `docs/research/epic16/S253-G03-FINAL-REVIEW.md` and
  `docs/research/epic16/evidence/S253-final-review-verification.json` — the
  final-review boundary, pre/post-audit full-gate results, seven-recipe
  distinct-size output replay, independent audit reconciliation, rendered Grade
  plan panel screenshot, and S253 PR/board state. The S253 audits are complete;
  the current merge gates and board state are summarized in S254–S256.
- `docs/research/epic16/S254-G03-AUDIT-CORRECTIONS.md`,
  `docs/research/epic16/S255-FULL-GATE-TEST-ISOLATION.md`, and
  `docs/research/epic16/S256-LOAD-STATE-AND-REVIEW-HANDOFF.md`, and
  `docs/research/epic16/S257-ELECTRON-STATUS-ASSERTION.md` — bounded
  final-review corrections, test-isolation evidence, independent final audits,
  and the exact S257 full-coverage pass. `S258-G03-FINAL-REVIEW.md` records the
  final local gates, product limits, and remaining merge/board/deployment
  checks. `docs/release/EPIC-16-G03-MERGE-EXIT-S259.md` records the merged PR,
  verified ancestry/tree, board closure, and the separate Actions deployment
  gate. Deployment succeeded in Actions run `36535708194` for main commit
  `2525993ceac31d426fbd5286c14d5011169b79a5`.
- `docs/research/S260-EXECUTION-EFFICIENCY-RULES.md` — Slice 260's exact
  boundaries, start time, applied files, rule-preservation checks, and separate
  elapsed-time accounting. `AGENTS.md` is the operational source; the
  maintainer decision records its project-wide authority.
- `docs/research/epic16/S250-EXPLICIT-GRADE-PLAN-RECORD-AND-REVIEW.md` — Slice
  250's exact scope, strict grade-plan fields, stale-approval boundary,
  migration/output non-goals, and exit checks. It does not supply a population,
  size range, grade rule, or numerical increments.
- `docs/research/epic16/S250-GRADE-PLAN-DECISION-RECONCILIATION.md` — Codex's
  source-checked resolutions of the independent Claude/OpenCode M03 audits,
  the intended record/persistence boundary, and risks held for Slice 251.
- `docs/research/epic16/MEASUREMENT-HELP-SOURCE-AUDIT.md` — OpenCode's
  source-traced M01 audit of all seven recipe inputs, the limits of public
  measurement guidance, and the safe explanatory-copy boundary. It does not
  authorize unsourced measurement procedures or product changes.
- `docs/research/epic16/ONE-SIZE-RECIPE-MAPPING-AUDIT.md` — Claude Code's
  read-only M01/M02 audit of recipe inputs, drafting consumers, POMs, and the
  one-size parity risks Codex must resolve before output verification. It is
  evidence for implementation planning, not an approval to change legacy
  drafting or export baselines.
- `docs/research/epic16/S247-M01-VALIDATION-EXIT.md` and
  `docs/research/epic16/evidence/` — Slice 247's durable capture/resume,
  conflict, package-compatibility, all-recipe, production-browser, narrow,
  accessible-field-tree, and 100% full-coverage evidence. M01 is complete;
  Slice 248 may start M02 under the unchanged one-size and export boundaries.
- `docs/research/epic15/F01-STORAGE-CONTRACT-S230.md` — Slice 230's accepted
  IndexedDB repository, non-destructive legacy migration, per-style recovery,
  artwork two-store, portable package, failure and test contracts. Its Electron
  `file://` proof is narrow; it does not claim shipped persistence behavior.
- `docs/research/epic15/F01-RECORD-MODEL-S231.md` — Slice 231's strict
  versioned project/style/recovery/migration records and pure SaveFile v1–v5
  conversion; it does not claim that IndexedDB or app migration is wired.
- `docs/research/epic15/F01-TRANSACTIONAL-REPOSITORY-S232.md` — Slice 232's
  exact IndexedDB schema checks, atomic project/style/recovery operations,
  source-fingerprinted migration, fault rollback tests, and Electron
  restart/path-change proof. Slice 233 integrates the repository at startup and
  in Save/Load, recovery, and project/style UI; actual-browser and Electron
  evidence is in `docs/research/epic15/F01-PROJECT-STYLE-WORKFLOW-S233.md`.
  Slice 234 completes F01's portable ZIP backup/import with strict validation,
  artwork and recovery remapping, rollback behavior, stress limits, and a
  browser/Electron restart proof in
  `docs/research/epic15/F01-PACKAGE-EXPORT-IMPORT-S234.md`. Consult
  `docs/research/epic15/F02-FIELD-PROVENANCE-S235.md` for Slice 235's
  C03-aligned field definitions, provenance/history schema, migration and
  100% focused module coverage and browser/Electron restart evidence. Read
  `docs/research/epic15/F02-DEPENDENCY-INVALIDATION-S236.md` for the complete
  85-input seven-recipe matrix, output recomputation semantics, actual output
  comparisons, mandatory Slice 238 propagation fixes, and rendered-browser/
  reload evidence. Consult `PROJECT-STATE.md` and the canonical Control
  Center for F01/F02's current status and next numbered slice.
- `docs/research/epic15/F03-CONSTRAINED-EDIT-S237.md` — the deterministic
  semantic-anchor, geometry, stitch, graded-measurement and POM contract for
  Slice 237. `F03-SLICE-237-EXIT.md` records model coverage, the invalid-preview
  browser proof and byte-identical parametric SVG output. At that slice's exit,
  the Edit preview was still transient; Slice 238 now owns its style-scoped
  persistence and dependent-output integration. Its complete implementation,
  verification digests and rendered Woven-shirt evidence are in
  `docs/research/epic15/F03-CROSS-OUTPUT-EDITING-S238.md`. Slice 239 completes
  immutable revisions and frozen digital-output evidence in
  `docs/research/epic15/F03-IMMUTABLE-REVISIONS-S239.md` and
  `docs/research/epic15/evidence/S239-rendered-verification.json`. Slice 240's
  final review evidence is in
  `docs/release/EPIC-15-G02-FINAL-REVIEW-S240.md` and
  `docs/research/epic15/evidence/S240-*`. Slice 241 records PR #11's merge,
  verified S204/S205/S240 ancestry, and the validated Control Center closure at
  revision 315 in `docs/release/EPIC-15-G02-MERGE-EXIT-S241.md`. EPIC-15/G02 is
  Closed; EPIC-16/G03 is also closed after its verified merge and deployment.
  EPIC-17 through EPIC-30 remain Backlog. Do not begin EPIC-17 until the
  maintainer explicitly asks to begin it. `PROJECT-STATE.md` and the canonical
  Control Center carry the current status.
- `docs/research/epic14/` — accepted evidence packets for C01 recipe baseline,
  C02 standards and tools, C05 3D feasibility, C06 starter/assortment/upcycling/
  supplier evidence, and C03 measurement/donor contract. C04's accepted
  technical-pack/CAD contract is at
  `C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`; Slice 226 records its criteria
  reconciliation, no-target-CAD decision and downstream proof gates. The
  completed `G01-FINAL-REVIEW-EXIT.md` records the A-01–A-12 dispositions,
  actual draft-pack replay, Slice 227 fix, full gate results, downstream owners
  and limits. `evidence/G01/techpack-v2/` holds seven generated PDFs, all 33
  raster pages, a layout audit, and SHA-256 manifest. EPIC-14/G01 is closed;
  read this report and the accepted packets before starting any later Epic.
  `PROJECT-STATE.md` and the canonical board record current status.
- `docs/planning/COMPONENT-ARCHITECTURE.md` — design rationale and migration plan.
  Use `PROJECT-STATE.md` for which phases are actually complete.
- `docs/planning/SLICES-BRIEF.md` — reusable slice-planning brief. It is a
  template, not a live status source.
- `docs/planning/BUG-FIX-PHASE.md` — sequential P1/P2/P3 bug-fix epics and
  goal-setting, ownership, and exit-gate rules before Epic 3.
- `docs/planning/EPIC-3-EXECUTION.md` — authoritative Slice 94–104 execution,
  verification, and Epic 3 exit record.
- `docs/planning/EPIC-4-EXECUTION.md` — live Component Architecture and Garment
  Grammar execution, acceptance criteria, delegation boundary, and exit report.
- `docs/planning/UX-REDESIGN-EXECUTION.md` — Epic 5 beginner-facing workspace
  redesign, Slices 114–121, acceptance criteria, pacing and final exit record.
- `docs/planning/UX-REDESIGN-HANDOFFS.md` — isolated OpenCode research and Claude
  Code audit packets for Slice 114; Codex owns implementation and acceptance.
- `docs/planning/EPIC-6-EXECUTION.md` — Epic 6 surface-design execution plan,
  additive Slice 122–125 foundation, deferred wiring slices, and exit gate.
- `docs/planning/EPIC-7-EXECUTION.md` — OpenCode Nesting Intelligence Pack
  scope, exact buffer/on-hand/directional decisions, slice gates, safe boundary,
  and return contract.
- `docs/planning/EPIC-8-EXECUTION.md` — scoped true-shape nesting proof and
  controlled-redesign packet; Sparrow/Jagua adapter boundary, apparel
  constraints, fallback, benchmark and conditional promotion gates.
- `docs/planning/EPIC-9-EXECUTION.md` — Codex-owned bounded desktop release
  readiness scope, failure matrix, package evidence, and exit gate.
- `docs/planning/EPIC-10-EXECUTION.md` — Claude Code test-only adversarial
  hardening scope, seeded-property/oracle boundary, handoff prompt, and exit
  gate.
- `docs/planning/EPIC-11-EXECUTION.md` — Codex-owned Polo V2 fidelity redesign
  packet, exact scope/options, Epic 7 start gate, Slice 148 plus Slices 155–161,
  pressure
  matrix, and return contract.
- `docs/planning/EPIC-12-EXECUTION.md` — authorized Web Platform Epic packet:
  threat/data admission, static delivery, identity/sync, feature flags,
  blue/green governance, local Control Center, slice gates and ownership;
  current work was limited by the launch-cost hold to the no-cost interim lane;
  Slices 178–181 are complete and the launch-backed lane remains deferred.
- `docs/planning/EPIC-12-SLICE-175-ADMISSION.md` — current Slice 175
  deferral audit, future launch re-entry decisions, authorized no-cost interim
  work and re-entry gate; it does not authorize login UI or provider mutation.
- `docs/planning/CONTROL-CENTER-V2-EXECUTION.md` — binding no-cost Slices
  184–186 packet for canonical local authoring, role-guided transitions,
  atomic persistence, usable browser controls and the v2 exit gate.
- `docs/planning/PRE-GARMENT-EXECUTION.md` — maintainer-approved nine-phase
  no-cost sequence and acceptance criteria. Phase 9 is accepted; a separate
  explicit garment-direction decision remains required before any garment
  queue.
- `docs/planning/ARTWORK-LIBRARY-V1-EXECUTION.md` — Phase 8's local asset
  provenance, catalog contract, search/filter and recommendation semantics,
  bounded slice sequence, and the accepted Phase 9 reference-V1 exit.
- `docs/planning/ARTWORK-LIBRARY-PHASE9-REVIEW.md` — current V1 review findings,
  evidence limitations, maintainer acceptance, and the future G17 production-
  art library queue; it does not authorize garment work or spending.
- `docs/planning/ARTWORK-LIBRARY-G17-QUEUE.md` — deferred acceptance boundary
  for the dense production-art library; G17 follows the already-scoped G01–G16
  work and stays Backlog until explicitly opened by the maintainer.
- `docs/research/ARTWORK-EXPANSION-PHASE9-SCOPE.md` — Slice 207's exact
  four-image CMA shortlist, item-level rights/visual checks, asset-size budget,
  held-out candidates, and Slice 208 acceptance boundary.
- `docs/planning/PRE-GARMENT-PHASE6-PATTERN-MEASUREMENT-INVENTORY.md` — the
  40-block default-options mapping to measurement fields and groups, with the
  approved first-page-plus-links behavior used by Slice 198. Option-only
  blocks are explicitly distinguished from unmapped blocks.
- `docs/planning/FIRST-LOAD-TUTORIAL-SPEC.md` — Phase 3 research-backed,
  implementation-ready copy, tour-state, local-persistence, accessibility,
  and verification contract. Read before any Phase 4 tutorial code.
- `docs/planning/REPOSITORY-AND-NEWCOMER-AUDIT.md` — Phase 2's read-only
  inventory, historical duplicate-number feasibility check, and newcomer
  misunderstanding record; no cleanup or history rewrite was performed.
- `docs/planning/GARMENT-EXPANSION-RESEARCH-WAVE.md` — completed Slices 149–154
  research-only contract, evidence standard, Codex/Claude ownership boundaries,
  stop conditions and completed future-family synthesis gate.
- `docs/planning/GARMENT-EXPANSION-SYNTHESIS.md` — binding Slice 154
  cross-family decisions, shared knit/material gates, estimates, recommended
  order and safe parallel-development boundaries. It does not authorize code.
- `docs/release/EPIC-7-EXIT-REPORT.md` — reviewed nesting-intelligence scope,
  full-gate and live mounted-app evidence, origin commit and limitations.
- `docs/release/EPIC-9-EXIT-REPORT.md` — current-host packaged release
  evidence, failure matrix, artifact hashes, and explicit signing/platform
  limitations.
- `docs/release/EPIC-10-EXIT-REPORT.md` — seeded property/oracle evidence,
  seven-recipe hardening, permanent fixtures, the bounded Codex repair, and
  the final quality/release gate.
- `docs/release/EPIC-11-EXIT-REPORT.md` — Polo V2 implementation, downstream
  pressure matrix, parsed/rendered evidence, protected hashes and limitations.
- `docs/release/WEB-PREVIEW-DEPLOYMENT.md` — current Cloudflare Pages Free
  friend/family preview URL, artifact/deployment evidence, and the direct-upload
  versus automatic-Git-delivery decision gate.

## Research documents

- `docs/research/ASSET-RESOURCES.md` — refined, analyzed resource catalogue and
  successor to the legacy `apparel_design_resources.md` link list.
- `docs/research/TOOLS-RESEARCH.md` — tools, techniques, and feasibility research.
- `docs/research/MARKETPLACE-GOALS.md` — separate vendor-layer research track;
  not active product-development scope unless the maintainer explicitly starts a
  research chunk.
- `docs/research/garments/TANK-RESEARCH.md` — durable tank construction research.
  Every future garment must receive an equivalent research document in this
  directory before implementation.
- `docs/research/garments/TEMPLATE.md` — required starting structure for each
  future garment's research record.
- `docs/research/garments/POLO-V2-RESEARCH.md` — Epic 11 cross-vetted Polo V2
  collar/stand, placket-base, vent, back-drop and grading decisions; records
  the sleeve-rib/material boundary and physical unknowns.
- `docs/research/garments/CASUAL-SHORTS-RESEARCH.md` — Slice 150 lower-body
  derivative audit, short-length station contract, collision matrix and future
  7–9-slice boundary.
- `docs/research/garments/JOGGERS-RESEARCH.md` — Slice 151 adult knit-jogger
  evidence, elastic/casing/cuff decisions, material limits and future 5–7-slice
  P0 boundary.
- `docs/research/garments/SWEATSHIRT-HOODIE-RESEARCH.md` — Slice 152
  cut-and-sew sweatshirt band contract plus staged adult pullover hood and
  kangaroo-pocket research.
- `docs/research/garments/JEANS-RESEARCH.md` — Slice 153 rigid five-pocket
  component, fly, yoke, waistband, material and 11–14-slice scope audit.
- `docs/research/garments/WOVEN-SHIRT-RESEARCH.md` — Slice 85 evidence, source
  conflicts, measurements/construction proposals and digital verification scope
  for the relaxed button-up. Read before Slices 86-93.
- `docs/research/NUMERIC-CONTROLS-RESEARCH.md` — Slice 104 research and the
  shared Boundary Rail decision for numeric edit controls.
- `docs/research/UX-REDESIGN-RESEARCH.md` — current screenshot/live audit,
  competitor/historical/community evidence, design rationale and limitations.
- `docs/research/DESKTOP-RELEASE-RESEARCH.md` — OpenCode's observed Electron
  release architecture, signing/offline/update risks, and deferred packaging
  gates; it does not claim a packaged or signed release.
- `docs/research/OPEN-SOURCE-REPOSITORY-AUDIT.md` — 2026-09-17 license,
  dependency, architecture-fit, edge-case and roadmap audit of the
  product-owner-supplied GitHub repositories/topics plus adjacent candidates.
  Its accept/reject decisions are the current open-source due-diligence record;
  re-check exact licenses and dependency trees before implementation.
- `docs/research/NESTING-REDESIGN-RESEARCH.md` — Epic 8's 2026-09-21
  Sparrow/Jagua live recheck, apparel-constraint boundary, legal/runtime
  posture, pressure-tested alternatives and proof admission hypothesis.
- `docs/research/EPIC-8-SLICE-162-ADMISSION.md` — completed proof-contract,
  pinned-upstream and legal/runtime-admission record. It explicitly withholds
  runtime/WASM admission pending an owned artifact, notice and offline-build
  packet.
- `docs/research/EPIC-8-SLICE-163-ADMISSION.md` — completed artifact, legal,
  reproducibility and worker-containment packet. It records the exact source
  revisions, MPL-2.0 duties, notice/lock hashes, build flags and the durable
  proof-only/no-go decision after offline-build and worker-isolation gates fail.
- `docs/research/epic8/sparrow-wasm/` — InfiniDrip-owned evidence copies of the
  exact WASM Cargo manifest/lock, reference package lock, toolchain/build script,
  full transitive notices and dataset notice, plus the checked manifest JSON.
- `docs/release/EPIC-8-EXIT-REPORT.md` — completed Slice 169 proof-only/no-go
  exit with verification results, exact provenance, worker pressure outcomes,
  fallback boundary and reopen conditions.
- `docs/research/PUBLIC-WEB-PLATFORM-COST-RESEARCH.md` — costed web-launch,
  identity, feature-flag, delivery-governance and local Control Center proposal;
  provider/account choices and cost envelope. Epic 12 now authorizes execution
  planning, but no account, purchase, deployment or personal-data collection.
- `docs/research/WEB-PLATFORM-THREAT-MODEL.md` — Epic 12 trust boundaries,
  data classes, threats, controls, retention/deletion questions and incident
  rules; launch-backed identity/cloud implementation remains deferred.
- `docs/research/IDENTITY-CLOUD-WORKSPACE-RESEARCH.md` — Slice 174's
  provider-independent identity, owner-only workspace, RLS/grant, migration,
  conflict-safe sync, export/deletion and blocking legal/product contract;
  provider implementation is not authorized by this record.
- `docs/research/SURFACE-DESIGN-RESEARCH.md` — Epic 6 surface-layer contract,
  library decision boundary, source conflicts, and unresolved placement questions.

## Historical archive

- `docs/archive/2026-09-10-INFINIDRIP-HANDOFF.md` — Claude-to-Codex handoff
  snapshot through Slice 63. It is evidence, not a maintained source of truth.
- `docs/archive/FABLE-BRIEF.md` — completed Fable F1/F2 epic specification.
- `docs/archive/RESUME-LOG.md` — personal proof/resume staging record, not project
  status or implementation instructions.
- `docs/archive/ARCHITECTURE-HISTORY.md` — complete pre-Slice-183 architecture
  snapshot; historical evidence only, not current instructions.

## Superseded material

- `apparel_design_resources.md` is retained for provenance only and is
  superseded by `docs/research/ASSET-RESOURCES.md`.

## External research references routed to future slices

The following product-owner-supplied references are durable research inputs,
not implementation instructions. Consult them automatically when a slice
concerns the listed subject, distinguishing source guidance from estimates,
product decisions, and unresolved questions:

- `F:\tank-sketches\scribd - garment-design - files\226112995-Pattern-Making.pdf` — measurement taxonomy, block/working/master pattern lifecycle, grain/layout, seam allowance, hem, and future trouser coverage.
- `F:\tank-sketches\scribd - garment-design - files\aqm1_spec_sheet_detailed_reference.docx` — POM/spec-sheet structure, relaxed versus extended measurements, pocket placement, operation sequencing, and technical-pack vocabulary.
- `F:\tank-sketches\scribd - garment-design - files\garment_measurement_quick_reference.docx` — finished-garment measurement definitions and collar, sleeve, waistband, rise, inseam, outseam, pocket, and stretch-state terminology.
- `F:\tank-sketches\scribd - garment-design - files\pattern_drafting_quick_reference.docx` — drafting workflow, ease, landmarks, truing, markings, reusable blocks, grading, and quality checks.
- `F:\tank-sketches\scribd - garment-design - files\pattern_making_body_measurements_reference.docx` — standardized body measurements, trouser dimensions, grading, balance, fitting diagnostics, grain, and layout.
- `F:\tank-sketches\scribd - garment-design - files\stitches_seams_detailed_reference.docx` — stitch/seam terminology and construction metadata by operation and fabric; not proof of sewability or a source for hardcoded machine settings.
- `F:\tank-sketches\scribd - garment-design - files\types_of_fullness_detailed_reference.docx` — deferred fullness techniques; consult only if a future garment explicitly introduces darts, gathers, pleats, or tucks.
- `F:\tank-sketches\290184313-T-shirt-Poloshirt-Cad-Drawing.pdf` — Polo V2 research input for collar/stand, placket, longer-back/side-vent, sleeve-rib, and Polo-specific grading questions; its assignment-specific values are not universal formulas.

These references do not authorize physical sampling. Physical validation is on
hold until the maintainer explicitly reopens it.
