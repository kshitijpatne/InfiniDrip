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

- `docs/coordination/TEAM-CONTEXT-REGISTRY.md` — referenced by older context
  snapshots but absent from current `origin/main`; do not rely on it. Discover
  active worktrees, refs, open PRs and the canonical board before using a
  main-based snapshot. Each lane retains its own scope/approval gates.
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

- `docs/planning/UIQ-08-ADMISSION.md` and `UIQ-08-GOAL.md` — Slice 757 isolated
  inspection-toolbar candidate complete. Full two-worker repository coverage
  passed 165 files/2,672 tests at 100%; no repository worker default changed.
  Codex review recommends solid controls only: translucency has no meaningful
  effect in the real normal-flow layout. Parent UIQ-08 remains Backlog/unshipped;
  app integration still requires separate maintainer admission. Review, exit
  metrics and hash-bound evidence are in `docs/research/uiq08/`.

- `docs/planning/UIQ-CLARITY-ADMISSION.md` — maintainer-admitted 2026-10-02
  UIQ03 guidance and UIQ04 material clarity isolated candidates, frozen read-only
  contracts, two Claude worktrees and exact-model OpenCode independent QA.
  `UIQ-CLARITY-GOAL.md` records actual sessions/boundaries. Both corrected root
  candidates are independently accepted; immutable proof is
  `docs/research/uiq-clarity/CANDIDATE-EXIT.json` (137 suites/2292 tests,100%
  coverage,18 rendered checks). Review/matrix and complete goal record retain
  diagnostic history and later integration holds; original CLI snapshots are
  not the accepted source. Candidate children Done does not ship parent cards.
  `docs/research/uiq-clarity/BOARD-CLOSEOUT.json` confirms board447, the verified
  immutable exit hash, reviewer closure and post-close34-test command-layer pass.

- `docs/planning/UIQ-PARALLEL-ADMISSION.md` — explicitly admitted 2026-10-02
  isolated UIQ-02 foundation and UIQ-05 artwork candidates, frozen API/CSS,
  disjoint CLI worktrees and full candidate gates. No production integration.
  `UIQ-PARALLEL-GOAL.md` records sessions/results/resume boundaries;
  `UIQ-PARALLEL-BOARD-COMMANDS.json` is additive candidate tracking only.
  `docs/research/uiq-parallel/CODEX-REVIEW.md` records actual corrections,
  browser proof, final-gate status and the separate integration holds.
  `docs/research/uiq-parallel/CANDIDATE-EXIT.json` is the immutable accepted
  root-candidate proof:135 suites/2091 tests,100% coverage, rendered/no-egress
  evidence and protected identity. Child cards Done does not ship parent UIQs.

- `docs/planning/UI-ENHANCEMENT-SEQUENCE.md` — approved 2026-10-01 native-first
  order, 13 stable UIQ packages plus integration gate, future Epic18/19/21/22
  routing, isolated CLI ownership, exclusions and boundary-only EPIC-17 work.
- `docs/planning/UIQ-07-ADMISSION.md` and `UIQ-07-GOAL.md` — admitted and
  completed isolated native welcome/wordmark candidate while EPIC-17 was active.
  Exit proof and reviewer audit are `docs/research/uiq07/CANDIDATE-EXIT.json`
  and `CODEX-REVIEW.md`; `BOARD-CLOSEOUT.json` confirms board456 and its verified
  evidence hash. `UIQ-07-BOARD-COMMANDS.json` is its additive replay. Candidate
  child is Done. The separately admitted current-main integration is
  `docs/planning/UIQ-07-INTEGRATION-ADMISSION.md`, with live gates in
  `docs/planning/UIQ-07-INTEGRATION-GOAL.md`; it wraps only the existing
  first-run tutorial welcome and retains its current actions/caveat. UIQ-07
  passed Slice 755 pre-merge acceptance (2,669 tests and 100% global coverage,
  build/operational/packaged gates, 13 rendered checks); see
  `docs/release/UIQ-07-INTEGRATION-S755-EXIT.md` and
  `docs/research/uiq07-integration/evidence/S755-verification.json`. The
  canonical board is revision 4464 and UIQ-07 is Done after PR #36, successful
  deployment run 38259487661, and stable/immutable public-browser verification;
  see `docs/release/UIQ-07-INTEGRATION-S756-CLOSEOUT.md`.
- `docs/planning/UIQ-GATE-ADMISSION.md`, `UIQ-GATE-GOAL.md`,
  `UIQ-GATE-BOARD-COMMANDS.json`, and
  `docs/release/UIQ-GATE-S733-EXIT.md` / `UIQ-GATE-S733-VERIFICATION.json` —
  post-EPIC-17 readiness gate, closed at board revision 4352. The packet freezes
  current host/props/style ownership and candidate provenance; S733 does not
  wire features. Parent UIQ cards remain Backlog/unshipped. UIQ-02 was
  subsequently admitted as Slice 734; its current gate and next action are in
  the integration admission and exit packet below.
- `docs/planning/UIQ-02-INTEGRATION-ADMISSION.md` — maintainer-authorized
  current-main Slice 734 integration boundary for the accepted native
  foundation on the active guided tour and its local-storage warning only.
  It defines the embedded flag/default/fallback, shared-file ownership,
  rendered acceptance and explicit non-goals. The accepted integration is
  merged and deployed: Slice 734 implementation evidence is in
  `docs/release/UIQ-02-INTEGRATION-S734-EXIT.md`, and Slice 735 merge/deploy
  proof is in `docs/release/UIQ-02-INTEGRATION-S735-CLOSEOUT.md`. UIQ-02 is Done;
  this is not a global redesign. At the S735 boundary UIQ-03/04/05/07 were
  Backlog and required separate serialized admissions; UIQ-03 was subsequently
  admitted and shipped under its own S736/S737 packet below. UIQ-04/05/07 remain
  Backlog.
- `docs/planning/UIQ-02-S735-CLOSEOUT-BOARD-COMMANDS/` — validated board-layer
  commands that attach the merged/deployed UIQ-02 evidence and final coverage,
  close the parent as Done, and record its release comment; use only as
  historical proof and never replay against a newer board.
- `docs/planning/UIQ-03-INTEGRATION-ADMISSION.md` and
  `UIQ-03-GOAL.md` — fresh current-main, maintainer-authorized integration of
  the accepted UIQ-03 guidance panel. Slice 736 uses the stable Design
  readiness disclosure, embedded flag and exact legacy-checklist fallback;
  Slice 737 is deployment/board closeout only. Journey navigation, validation,
  correction semantics, saved data and exports remain protected.
  `docs/release/UIQ-03-INTEGRATION-S736-EXIT.md` and
  `docs/research/uiq03-integration/` record the full gate, packaged lifecycle,
  rendered pressure test and diagnostic coverage attempts. Slice 736's 100%
  global coverage and all pre-merge gates passed. PR #23 merged the integration;
  Slice 737 verified Actions run `38173525917`, the existing public preview URL
  and closed UIQ-03 Done at board revision 4380. Complete closeout is
  `docs/release/UIQ-03-INTEGRATION-S737-CLOSEOUT.md`; machine browser proof is
  `docs/research/uiq03-integration/evidence/S737-public-verification.json`.
  Final closeout PR #24 is merged at `bbb802a8`; main workflow `38176394059`
  succeeded and the public URL was verified again after deployment. See
  `docs/research/uiq03-integration/evidence/S738-final-closeout.json` and
  `docs/release/UIQ-03-S738-FINAL-CLOSEOUT.md`. Board revision 4383 retains
  UIQ-03 Done with the final proof; the UIQ-03 goal is complete.
  UIQ-04/05/07 remain Backlog at that historical closeout boundary; the
  maintainer subsequently admitted UIQ-04 on current main. Its exact host,
  value mapping, `uiq_material` fallback, file boundaries and two-slice gates
  are in `docs/planning/UIQ-04-INTEGRATION-ADMISSION.md`; live goal and
  verification ledger are in `docs/planning/UIQ-04-GOAL.md`. UIQ-04 completed
  through Slice 740: PR #26 merged to `main` at
  `956c5c5dd1eee83aca9153f759c21c693843b095`, deployment run 38185891574
  succeeded, the stable preview returned HTTP 200, and live browser checks
  passed on both stable and commit-specific URLs. The canonical board is Done
  at revision 4394. Pre-merge and release reports are
  `docs/release/UIQ-04-INTEGRATION-S739-EXIT.md` and
  `docs/release/UIQ-04-INTEGRATION-S740-CLOSEOUT.md`; machine evidence is under
  `docs/research/uiq04-integration/evidence/`. UIQ-05 is separately admitted
  from `origin/main` `f4cbfc45` as the next ordered presentation redesign;
  exact action preservation, flag/fallback, files and gates are in
  `docs/planning/UIQ-05-INTEGRATION-ADMISSION.md`, with live gates in
  `docs/planning/UIQ-05-GOAL.md`; S741 merged by PR #28 at `7f5e6263`.
  S741 evidence is in `docs/release/UIQ-05-INTEGRATION-S741-EXIT.md` and
  `docs/research/uiq05/evidence/S741-verification.json`. S742 deployment run
  38190492228 succeeded, and stable plus immutable URLs passed live browser
  checks. The validated board records UIQ-05 Done at revision 4404 with
  `E-UIQ05-S742`; final current-state reconciliation is in
  `docs/release/UIQ-05-INTEGRATION-S743-CLOSEOUT.md`. UIQ-05 is complete.
  The maintainer admitted UIQ-06 after PR #30; its active execution packet,
  goal ledger and baseline are `docs/planning/UIQ-06-ADMISSION.md`,
  `docs/planning/UIQ-06-GOAL.md`, and `docs/research/uiq06/`. Slice 744
  establishes the evidence-led presentation-only contract on clean
  `origin/main` `7923a7f`; S745 resolves the demonstrated Nesting-readout
  collision behind its embedded rollback flag, with rendered state evidence
  in `docs/research/uiq06/evidence/S745-rendered-pressure.json`. S746 corrected
  the ignored S745 exit report: it is tracked at the board-recorded URI, its
  digest is regression-tested, and S745 history is unchanged. S747's bounded
  measurement-history timestamp/source labels are accepted; details and
  rendered/synthetic pressure evidence are in
  `docs/research/uiq06/S747-MEASUREMENT-HISTORY-EXIT.md` and
  `docs/research/uiq06/evidence/S747-measurement-history-pressure.json`. The
  S748 then clarified grade-plan/Check table scrolling, per-size exception
  labels, and stable POM comparison columns without changing grade behavior;
  see `docs/research/uiq06/S748-GRADE-EXCEPTION-READABILITY-EXIT.md` and
  `docs/research/uiq06/evidence/S748-grade-exception-pressure.json`. S749
  clarified that project storage is local without implying current edits are
  saved, and that recovery preserves the saved version until explicit Save.
  Project/recovery/import/export behavior is unchanged; see
  `docs/research/uiq06/S749-PROJECT-RECOVERY-READABILITY-EXIT.md` and
  `docs/research/uiq06/evidence/S749-project-recovery-pressure.json`. S750
  settled the complete local release gate, four-metric 100% global
  coverage, export identities, operational/web/readiness tests, packaged
  Electron offline/export/recovery verification, and Codex candidate review;
  see `docs/research/uiq06/S750-SETTLED-RELEASE-EXIT.md` and
  `docs/research/uiq06/evidence/S750-packaged-verification.json`. S751 merged
  Codex-owned PR #31 to `origin/main` at
  `caa1c75111c55d75e8e6a495aa9c85e8d487aea9`; main-only Pages run
  `38201698605` passed. Stable and immutable URLs passed live 1280/640/320
  rendered, keyboard/accessibility and no-egress checks; UIQ-06 Nesting and
  local-project smoke passed. Final report:
  `docs/research/uiq06/S751-MERGE-DEPLOYMENT-EXIT.md`. Board revision 4451
  records UIQ-06 Done with digest-bound S750–S754 evidence. PR #32 merged at
  `34a2592a`; main run `38203805432` passed full tests/build/artifact/deploy.
  PR #33 merged at `c8f39c76`; run `38205969649` passed the full workflow and
  Cloudflare deploy, uploading zero files. PR #34 merged at `5929c8c6`; run
  `38207414640` passed full tests/build/artifact/deploy, uploading zero files.
  Stable `https://infinidrip-preview.pages.dev` and latest immutable
  `https://c6629cac.infinidrip-preview.pages.dev` returned HTTP 200. S752's
  responsive/no-egress browser proof applies to the identical app bundle.
  BUG-UI-048 remains Backlog-only with no fix admitted. S753 and S754 closeout
  evidence is linked at `docs/research/uiq06/S753-FINAL-CLOSEOUT.md`,
  `docs/research/uiq06/S754-POSTMERGE-STATE.md` and
  `docs/research/uiq06/evidence/S754-postmerge-state/`. UIQ-07 was separately
  admitted by the maintainer on 2026-10-12; UIQ-08 and later remain unadmitted.
- `docs/research/uiq04/CONTRIBUTOR-RETURN.md` and
  `docs/research/uiq-clarity/CANDIDATE-EXIT.json` document the accepted,
  immutable UIQ-04 isolated candidate. Candidate completion is not shipped
  behavior; use the fresh UIQ-04 integration admission for app wiring.
- `docs/planning/UI-ENHANCEMENT-BOARD-COMMANDS.json` — additive validated replay
  for newer boards, never replacement of active progress with an older board.
  `UI-ENHANCEMENT-EPIC17-NOTE.md` is the user-pasted non-diverting handoff;
  `UI-ENHANCEMENT-PLAN-GOAL.md` records this unlanded update's evidence.
- `docs/research/ui-repo-review-2026-10-01/` — four pinned audits, licensing
  boundaries, 42 screen/state mappings, isolated proof and visual atlas.
  Approval does not automatically clear restricted code or renderer dependencies.

EPIC-17/G04 is closed after PR #19 merged to `origin/main` at
`89e52024b3599d3c1977a2a73aec60476cdc5a74`; see the S732 closeout in
`PROJECT-STATE.md` and the canonical board. UIQ integration is now a separate
lane: candidate children may be Done while all UIQ parent release cards remain
Backlog/unshipped until individually admitted and integrated. The dirty
pre-merge coordinator checkout is preserved and is not the source for new
implementation work.

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
  Closed; EPIC-16/G03 and EPIC-17/G04 are also closed after their verified
  merges. EPIC-18 through EPIC-30 remain Backlog. `PROJECT-STATE.md` and the
  canonical Control Center carry the current status.
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
