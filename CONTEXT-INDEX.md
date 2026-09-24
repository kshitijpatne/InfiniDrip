# InfiniDrip context index

This repository is the durable source of project context shared by Codex,
Claude Code, and future development sessions. Chat history and external Project
Knowledge may add evidence, but must not silently override the documents below.

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

## Current status documents

- `PROJECT-STATE.md` — engineering status log and immediate roadmap.
- `ARCHITECTURE.md` — newcomer-readable current architecture and standing
  principles. Its former mixed current/history narrative is preserved in
  `docs/archive/ARCHITECTURE-HISTORY.md`.
- `docs/BUG-LEDGER.md` — durable UI/UX bug IDs, severity, priority, root cause,
  fix, and verification history.
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
  individually tracked immediate lanes A–E, the Epic 14 execution-order
  diagram, and digital exit gates. It
  does not authorize a garment queue, launch spending, supplier contact, or
  physical sampling after the completed pre-garment sequence.
- `docs/planning/EPIC-14-ADMISSION.md` — the maintainer-admitted C01/C02/C05/C06
  evidence wave, its individual exits, conditional targets, and preserved
  product/supplier/sampling boundaries.
- `docs/research/epic14/` — accepted evidence packets for C01 recipe baseline,
  C02 standards and tools, C05 3D feasibility, C06 starter/assortment/upcycling/
  supplier evidence, and C03 measurement/donor contract. C04 is the active
  technical-pack/CAD contract at
  `C04-TECHPACK-VIEW-REVISION-CAD-CONTRACT.md`; Slice 223 audits the current
  output and records the no-interoperability-claim boundary. Final G01 review
  follows C04. Read accepted
  packets before downstream contract work or feature implementation;
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
