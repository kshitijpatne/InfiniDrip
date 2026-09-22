# InfiniDrip — Confirmed project decisions

_Confirmed directly by Kshitij on 2026-09-10 after the Slice 63 handoff. These
decisions resolve the open questions recorded in that handoff._

## Development sequence

The required sequence is:

1. Slice 64: perform the Tank rework reality-check.
2. Fix every real-world failure found by that review before moving on.
3. Build the polo end-to-end.
4. Complete Phase C3.

Do not begin polo before the Tank reality-check and any resulting fixes are
closed. Do not move Phase C3 ahead of the polo without a new maintainer decision.

## Physical validation

No physical garment validation has occurred yet. No garment drafted by InfiniDrip
has been confirmed by cutting, sewing, and fitting it on a real body. This remains
the project's highest product risk and must not be represented as complete.

Physical sampling is currently on hold at the maintainer's request because no
manufacturer or printer is available. Do not suggest or schedule physical
sampling, sewing, or measurement validation unless the maintainer explicitly
reopens it.

## Polo V1 — confirmed 2026-09-11

- Construction is **collar plus stand**.
- Base is the loose tee with the current tee sleeve.
- Placket is visible, clean, folded, uses the same body knit with lightweight
  stabilizer, and finishes at 14 cm long × 3 cm wide.
- It has exactly three buttons at 3.5 cm centre-to-centre.
- Meaningful polo dimensions must be user-adjustable with guardrails.
- Finished collar stand: 2 cm default, adjustable 1–3 cm.
- Finished pointed collar leaf: 5 cm default, adjustable 4–7 cm.
- Button centres are 3.5 cm, 7.0 cm, and 10.5 cm below placket top.
- Side vents are excluded from V1.

The build contract and researched construction evidence live in
`research/garments/POLO-RESEARCH.md` and `planning/POLO-V1-SCOPE.md`.

## Garment research

`docs/research/garments/TANK-RESEARCH.md` is durable project documentation.
Every future garment must have an equivalent research document created before
implementation. Each document must record sources, construction rules, conflicts
between sources, estimates, product decisions, and unresolved questions.

## Adjustability and guidance

Tank neckline width must become user-adjustable.

The broader product principle is that every garment aspect should be adjustable
where meaningful. Validity must be protected through guardrails rather than
hidden limits: invalid or incompatible combinations must remain visible and be
detected by the guidance system, which must explain the problem and offer
actionable corrections. Do not silently clamp or replace a user's selection.

## Code signing

Code-signing procurement and implementation have not started.

## Resource-document lineage

`docs/research/ASSET-RESOURCES.md` is the refined, analyzed successor to
`apparel_design_resources.md`. They serve the same purpose. The legacy document
is retained only for provenance and should not be used for current decisions.

## Open-source due diligence — confirmed 2026-09-17

Repository research must go below README-level synthesis. Before a dependency,
port, algorithm, schema, asset, dataset, or implementation idea reaches the
roadmap, verify the exact license and transitive obligations, inspect source and
tests, compare it to actual InfiniDrip behavior, and pressure-test user value,
scalability, maintenance, hidden dependencies, failure modes, and overlap.
Rejected repositories remain in a reasoned ledger rather than disappearing.

Permissive licensing is necessary but not sufficient. No-license sources are
not code-reuse sources; GPL code requires a deliberate distribution decision;
noncommercial data is not usable for the intended commercial product; and a
list's license never clears everything it links. Pattern formulas must also have
clean subject-matter provenance rather than relying on code licensing alone.

Accepted external technology must use the smallest reversible boundary, retain
InfiniDrip-owned validation and deterministic fallback, and preserve pure
drafting, visible-invalid/actionable guidance, 100% coverage, rendered/parsed
verification, and the eight export hashes unless a separately documented and
approved baseline decision says otherwise. An optimizer or linter never proves
physical fit. Full decisions live in
`docs/research/OPEN-SOURCE-REPOSITORY-AUDIT.md`.

## Planning decisions confirmed 2026-09-12

- Phase C3 includes a visible Side view. Its initial contract remains
  render-only unless a genuine measurement/data requirement is separately
  approved.
- Edit remains preview-only through Phase 5. A later cross-garment final
  design-editing system must define durable overrides, persistence,
  size/grading semantics, downstream validation, and export behavior first.
- The first woven shirt is a reusable relaxed short-sleeve button-up block with
  a point collar and separate stand, front button placket, back yoke, one simple
  patch pocket, turned sleeve cuff/band, curved hem, small side vent, and six
  or seven evenly spaced buttons. Spacing must become research-derived and
  adjustable. Long/two-piece sleeves, sleeve plackets, complex cuffs, multiple
  pockets, pleated backs, princess seams, decorative details, and Polo V2
  changes are deferred.
- The woven shirt is a digital component-library milestone. Do not schedule or
  suggest physical validation unless the maintainer explicitly reopens it.
- The first trouser is a reusable relaxed casual straight-leg block with a
  separate waistband, simple front closure, and minimal pocket construction.
  Its rise, crotch, seat, waistband, grading, and fit logic should support
  later shorts and joggers.
- Surface design is a separate later Epic after the trouser block.
- OpenCode is preferred for higher-volume research, documentation, UI polish,
  export QA, and test expansion. Claude Code is preferred for shorter,
  high-signal tasks. Codex retains geometry, drafting, garment architecture,
  shared pipeline, data model, grading, exports, physical-validation
  decisions, final review, and integration.

## Refined forward Epic plan

### Woven-shirt button count clarified 2026-09-12

The six or seven evenly spaced buttons are on the front placket. The collar
stand has one additional button. The maintainer confirmed this during Slice 85;
UI, BOM, pattern marks and reports must agree.

### Epic 1 — Phase C3 croquis and views (Slices 80–84)

Complete upper/lower croquis routing, expose the visible Side view, add
cross-garment front/side/back render-contract tests, prove croquis remains
outside drafting, grading, checks, nesting, and exports, then run the C3 exit
gate and update durable context.

### Epic 2 — Phase 4 reusable woven shirt (Slices 85–93)

Research and document the block; define construction and component contracts;
implement the bodice, point collar/stand, placket, button spacing, back yoke,
pocket, sleeve band, curved hem, side vent, recipe integration, and complete
digital gate. Narrow research, documentation, focused tests, and export QA
may be delegated; geometry, drafting, architecture, data-model, grading, and
exports remain Codex-owned.

### Epic 3 — Phase 5 trouser block and later surface foundation (Slices 94–103)

Research and define the reusable trouser measurement/ease, rise, seat,
waistband, grading, closure, and pocket contracts; implement and verify the
straight-leg trouser; define the later shorts/jogger relationship; then keep
surface design independent from unfinished garment geometry.

Every slice must state scope, acceptance criteria, non-goals, dependencies,
ownership, recommended model/reasoning, whether the drafting/data model must
change, and applicable verification gates before work starts.

### UI bug-fix phase before Epic 3 — confirmed 2026-09-12

Before starting Epic 3, the maintainer inserted a dedicated `BUGFIX` phase for
the Slice 93 UI/UX audit. It is split into three sequential tagged epics:
`EPIC-BUGFIX-P1` for correctness and trust, `EPIC-BUGFIX-P2` for usability and
interaction, and `EPIC-BUGFIX-P3` for polish and discoverability. The durable
records and phase rules live in `docs/BUG-LEDGER.md` and
`docs/planning/BUG-FIX-PHASE.md`.

Every bug record must retain a stable ID, separate severity and priority, the
observed reproduction, root cause, fix slice, commit/PR reference, tests, live
or rendered evidence, and closure status. No record may be removed merely
because it was fixed or reclassified. Epic 3 is gated on the three bug-fix
epics' exit reports and the normal 100% coverage, typecheck, production-build,
parsed-output, and legacy-export-identity gates. Physical validation remains
deferred.

## Numeric editing — confirmed 2026-09-12

Measurement and related numeric edit fields use a shared direct-entry plus
click/hold +/- control. The decrement action is on the left, increment on the
right, and native browser number spinners are hidden. A compact Boundary Rail
shows each control's declared lower and upper endpoints and the current value's
position without adding instructional copy. Manual invalid values remain raw
and visible to guidance; only an explicit +/- recovery action moves an invalid
or empty value to a declared boundary. The same interaction applies to every
garment's measurements, recipe-owned numeric options, nesting fabric width,
and open-ended exploratory Edit coordinates (which show open endpoints rather
than invented limits). This is a UI contract only and does not alter drafting,
grading, persistence, exports, or physical-validation status.

## Epic 4 — Component Architecture and Garment Grammar — confirmed 2026-09-13

- The full Priority 1 package is in scope: component architecture, structural
  primitives, and the shared render-only croquis/Side-view library.
- Epic 4 delivers the internal architecture plus one narrowly scoped
  user-facing composition proof. It does not deliver a general-purpose
  configurator or a new garment family.
- Components own geometry and named interfaces; composition owns
  dependency-ordered assembly and seam matching; options are scoped to their
  owning component; downstream consumers read the composed result.
- All seven current recipes — Tee, Fitted tee, Tank, Polo, Woven shirt, Skirt,
  and Trouser — must migrate through the shared grammar. The eight legacy
  export hashes remain unchanged, and the other existing outputs require
  semantic/rendered parity.
- No new garment family is added. An existing garment or variant is the proof
  vehicle when a real composition consumer is needed.
- Edit remains preview-only through Phase 5; surface design, physical
  validation, and production-readiness claims remain outside this Epic.

## Epic 5 — Beginner-facing UI/UX redesign — authorized 2026-09-13; exit confirmed 2026-09-19

The maintainer requests research before implementation and a thorough redesign
from first launch to final export, not isolated cosmetic fixes. The supplied
screenshots establish long measurement panels, a separated assembled preview,
cluttered controls/progress/export layout, weak garment/color/style selection,
distant guidance, and missing field highlights as priorities. Codex must also
find additional issues through actual use, current competitor tools, public
forums, image/video references and historical usability research.

The requested behavior includes keeping controls and the active design visible
together, a reversible in-canvas Assembled toggle, stage-relevant disclosure,
clearer save/load consequences, contextual exports with size first, richer
color/texture/shine editing, and actionable field/seam-linked guidance. Ignored
suggestions remain visible for reconsideration in Check. That request does not
authorize suppressing invalid input or failed geometry into a passing result.

The implementation must preserve all existing garments/features, clean reusable
code, meaningful tests, the full project gate, and unchanged legacy hashes.
Usage-limit pacing and supported quiet autonomous continuation remain required;
no reset credit/account-allowance changes are authorized. No physical sampling
or physical-fit/manufacturing guarantee is authorized. Exact researched design
choices and their verification live in the new UX execution/research records.

The actual history confirms that Epic 4 closed at `816b9ff` (Slice 113) before
Slice 114 began this separate workstream. Slices 114–121 are therefore Epic 5,
not a reopened Epic 4 migration. Epic 5 exits only after the full project gate,
parsed output consumers, eight unchanged legacy hashes, rendered/live seven-
garment matrix, responsive evidence, and durable records pass. The final
accessibility trial uses `axe-core` only in development tests; jsdom's
layout-dependent color contrast is reviewed manually in the live browser. No
physical-fit or production-readiness claim is permitted.

## Epic 6 — Surface design — completed 2026-09-20 (originally confirmed 2026-09-19)

Surface design is an additive layer for prints, patches, colour blocking, and
fabric-preview decoration. It sits above existing pattern pieces and never
modifies drafting geometry, grading, POM checks, nesting, cutting files, or
legacy export bytes when placement is empty. Epic 6 is complete: the headless
contract, Style-panel wiring, optional save/recovery section, true-scale
artwork-space preview, opt-in calibrated print sheet, tech-pack placement
specification, warn-only invalid-entry guidance, and seven-garment exit audit
are merged to `origin/main`.

OpenCode PRs #1–#4 are the reviewed Slices 122–125 batch. Their original base
was the Epic 4 exit, so they are integrated only after review on top of the Epic
5 exit. Slice 123 is intentionally narrowed to the pure placement model and
validation boundary; persistence and Fabric.js SVG-fidelity proof are explicit
Slice 126 stop conditions, not silently assumed complete. Invalid placement data
stays visible to future guidance rather than being clamped. Non-finite or
non-positive resolution inputs are unratable. Surface preview is flat artwork
placement and makes no physical-fit, drape, sewability, manufacturing, or
production-readiness claim.

Piece clipping/on-piece anchoring remains explicitly blocked: Slice 130 defines
a digital cut-box-centre anchor for measured guidance, but it does not clip or
reposition artwork on the garment. Actionable out-of-bounds, low-resolution,
and full-coverage warnings are now implemented as warn-only digital checks;
they do not gate exports or assert physical fit, print quality, sewability,
manufacturing, or production readiness. Fabric.js was proven in a scratch
round-trip but not added because the shipped numeric-control/string-SVG
consumer needs no canvas dependency; any future direct manipulation must
re-verify the then-current version and license before adoption. Embroidery
machine formats, 3D/VTO, signing, packaging, and physical validation remain
outside this Epic.

### Epic 6 Slice 130 — accepted digital contracts

1. Piece-space anchor: artwork centres sit on the named piece's true-scale
   cut-box centre plus the placement offset, evaluated at base size. Any
   artwork corner outside that box warns; edge-touching counts as inside.
2. Print floor: 59 px/cm, derived as `floor(150 / 2.54)`. It is a warn-only
   digital floor; placements without source dimensions are unratable and never
   warn.
3. Full-coverage warning: artwork-to-piece cut-outline area ratio `>= 1`.
   This is a containment/intent cue, not a production ink budget.
4. Source pixel dimensions are optional persisted placement fields. Missing
   dimensions remain unknown rather than failing validation, with no save-format
   version change.

## Epic 7 — Nesting Intelligence Pack — authorized 2026-09-20

Epic 7 is an additive enhancement around the existing deterministic
`nestPieces` shelf estimator. It may expose utilization-derived waste percent,
optional fabric-on-hand fit/shortage, a cutting buffer, and a truthful
directional/nap assumption. It must not change drafted geometry, shelf-pack
placement truth, grainline behavior, export writers, or the eight legacy hashes.

- Cutting buffer: default `10%`, editable `0–50%`, step `1%`; it changes only
  the displayed/planned required length, not the raw estimator result.
- Fabric-on-hand length: optional positive centimetres; blank means unknown and
  must not display a false fit verdict.
- Directional/nap flag: default `true`; advisory only because the current
  estimator already keeps grain upright and never rotates or interlocks.
- Difficulty rating (roadmap 0.5.8), Sparrow/irregular nesting, rotation,
  interlocking, physical validation, and production claims are explicitly out
  of scope.
- New planning values use an optional additive save/recovery section so old
  payloads remain loadable without a format-version bump. Raw invalid direct
  entries remain visible and receive actionable guidance; no silent clamping.

OpenCode owns isolated implementation Slices 132–134 under a Codex-authored
execution packet. Codex owns the actual diff review, defect fixes, full gate,
merge, and push to `origin/main`.

## Epic 8 — true-shape nesting proof — scoped 2026-09-21

The reserved Epic 8 slot is scoped as a **true-shape nesting proof and
controlled redesign**, not as a default replacement of `nestPieces`. The
Codex-authored packet is `docs/planning/EPIC-8-EXECUTION.md`; the research and
license/runtime record is `docs/research/NESTING-REDESIGN-RESEARCH.md`.

- The current deterministic shelf packer remains the default and unconditional
  fallback. A candidate solver may return transforms only; InfiniDrip owns the
  original loops, marks, identities and post-solver validation.
- Sparrow/Jagua is an isolated proof candidate. Top-level Sparrow and
  Sparrow Studio are MIT, while the Jagua-RS collision dependency is MPL-2.0;
  exact revisions, generated WASM artifacts, notices and source/modification
  obligations must be pinned and reviewed before any runtime dependency ships.
- The instance contract must explicitly represent or reject unknown bolt,
  clearance, grain, nap, fold, mirror/pair, quantity, identity and
  multi-material semantics. No silent rotation, unfolding, duplication,
  omission, clamping or fallback is permitted.
- Proof slices do not change UI, persistence, export writers or protected
  hashes. Any later opt-in mode or downstream export use requires a separate
  promotion decision based on deterministic replay, owned validation, benchmark
  improvement, bounded runtime/memory, offline packaging and visible fallback.
- Slice 162 is complete as a contract-only admission decision. Slice 163's safe
  artifact/legal/worker packet is now recorded in
  `docs/research/EPIC-8-SLICE-163-ADMISSION.md`, with InfiniDrip-owned locked
  evidence under `docs/research/epic8/sparrow-wasm/`.
- The packet captures exact revisions, the full locked Rust graph, notices and
  MPL-2.0 obligations, but fails offline reproducibility and worker-containment
  admission: there is no pinned `wasm-pack`, vendored Cargo source, generated
  WASM hash or replay; the inspected worker has no proven hard memory/watchdog
  boundary, runtime candidate schema validation, fixed-seed replay or
  unconditional `nestPieces` fallback.
- Epic 8 therefore takes the proof-only/no-go lane. The original adapter and
  Slices 164–168 are not admitted; `nestPieces` remains the only runtime
  behavior. Reopening requires a new maintainer-authorized packet that closes
  every failed gate. This is not a legal opinion and does not reject MPL-2.0 in
  principle; release counsel must review any future executable distribution.
  The completed Slice 169 exit report is
  `docs/release/EPIC-8-EXIT-REPORT.md`.

## Epic 11 — Polo V2 fidelity packet — authorized 2026-09-20

The product owner authorized Codex to complete the garment-expansion/refinement
research packet and to continue until the goal was complete. The resulting
research-backed execution contract is:

- Epic 11 upgrades the existing stable `polo` recipe; it does not create a
  parallel Polo recipe or new garment family.
- P0 includes a shaped collar/stand derived from the real neckline, shared
  front/back representation, CB/shoulder/CF landmarks, true placket-base clip
  and reinforcement marks, side vents, and an adjustable dropped back hem.
- New defaults are 0.75 cm stand-front rise, 1.5 cm collar-point extension,
  6 cm vent depth and 1.5 cm back drop. Exact bounds and dynamic guidance live
  in `docs/research/garments/POLO-V2-RESEARCH.md`; values remain verbatim and
  are never silently clamped.
- Sleeve rib/band is deferred because no universal reduction was established
  and the draft graph does not receive the selected material's stretch and
  recovery. Upper-collar turn-of-cloth remains deferred to material/physical
  evidence.
- Polo grading remains measurement-driven re-drafting. The supplied CAD
  assignment's isolated point shifts are not a complete grade and will not be
  layered onto the engine.
- Slice 148 completes research and scoping only. Slices 155–161 required Epic 7
  to be Codex-reviewed, merged and pushed; that prerequisite is now satisfied
  at `db14b63`. Epic 11 must not modify Epic 7,
  `nestPieces`, Electron release work or protected export baselines.
- Physical sampling remains paused. Digital seam/output evidence cannot be
  described as proof of fit, collar roll, recovery, wash behavior or production
  readiness.

## Garment-expansion research wave — authorized 2026-09-20

- Slices 149–154 are a research-only wave in this order: casual shorts,
  joggers, cut-and-sew crewneck sweatshirt/pullover hoodie, then jeans, followed
  by cross-family synthesis. Parallel evidence gathering may finish out of
  sequence, but the dependency and eventual implementation order must remain
  explicit.
- Codex owns the shared family contract, shorts, jeans, roadmap decisions,
  contributor review and integration. Claude Code CLI may contribute only the
  two isolated knit-family research files under the binding wave packet.
- Shorts and joggers are evaluated as derivatives of the shipped straight-leg
  trouser, not assumed to be mere length/style toggles. A sweatshirt precedes a
  pullover hood. Jeans require their own denim/construction record.
- A true knitted sweater, zip-up hoodie/lightweight zip jacket, woven chore
  jacket/overshirt and tailored jacket are not part of this wave. They retain
  separate engine or complexity gates.
- Any proposal needing new draft-time material/hardware state, shared source-of-
  truth changes, save migration, baseline movement or physical-performance
  claims is recorded as a future decision, not hidden behind a constant.
- The wave does not authorize implementation. Polo V2 remains the next
  implementation-ready garment geometry epic after its unchanged Epic 7 gate,
  now numbered Slices 155–161.

## Epic 7 and garment-wave closure — decided 2026-09-20

- Epic 7 is complete, Codex-reviewed and pushed to `origin/main` at `db14b63`.
  Epic 11's merge prerequisite is satisfied; this does not itself start Epic
  11 or remove the product owner's scheduling authority.
- Slices 149–154 are complete research, not implementation authority. The
  binding synthesis is `docs/planning/GARMENT-EXPANSION-SYNTHESIS.md`; where a
  contributor proposal differs, the Slice 154 synthesis controls.
- Future implementation order after Polo is casual woven shorts, adult
  crewneck sweatshirt, adult knit jogger, pullover-hoodie extension, then rigid
  five-pocket jeans. Epic numbers remain unassigned because Epic 8 is reserved.
- Automatic geometry derived from nominal fabric stretch/recovery is deferred.
  The first banded garment instead uses explicit user-owned finished band/cuff
  lengths and a ratio-aware stretch-to-fit interface that reports the real
  opening/band relationship without using absolute-centimetre `Stitch.ease`.
- No new ankle/head global measurement or save-version bump is accepted for
  these P0 garments. Hood/cuff dimensions remain recipe options and carry no
  body-fit claim.
- Adult-only P0 resolves drawcord scope for jogger/hoodie. Child sizing, age
  mapping and covered-size behavior require a later explicit legal/product
  decision.
- Buttonhole marks plus BOM/construction text represent eyelet exits in P0.
  A new shared mark kind waits for a consumer that needs distinct geometry.
- Elastic cut length is user-measured/test-fit and recorded; the app does not
  calculate a universal elastic reduction.
- A banded or lined garment may not describe a combined main/rib/lining nest as
  one truthful fabric estimate. Its execution packet must add role/material
  grouping with separate estimates or leave secondary-material yardage unknown.

## Epic 12 — Public Web Platform and Delivery Governance — authorized 2026-09-21

The maintainer authorized the Web Platform Epic to begin after Epic 11. The
approved cost research is the planning baseline, not a purchase order. Slices
171–173 establish the provider-independent execution, local board and static
delivery proof; accounts, domains, subscriptions, deployments and personal-
data collection still require their own explicit gate.

- The maintainer separately approved a zero-cost friend/family preview. It may
  serve only the built Vite `dist/` artifact from `main` through Cloudflare
  Pages Free at a `*.pages.dev` URL, with `noindex, nofollow, noarchive` and
  URL-only access initially. It must remain local-first: no login, database,
  cloud sync, telemetry, email sender or measurement egress. Browser storage
  is per device. The `infinidrip-preview` Direct Upload project and first
  production artifact are now created; the bounded GitHub Actions uploader is
  the active path for subsequent `main` pushes and explicit manual dispatches.
  Its two protected GitHub secrets are configured, and the successful run-6
  deployment is recorded in `docs/release/WEB-PREVIEW-DEPLOYMENT.md`. Paid
  services, custom domain, Access allowlisting and launch infrastructure remain
  deferred.

- The recommended low-volume authenticated-beta envelope is approximately
  $59/month plus a normal domain, using Vercel Pro, Supabase Pro with separate
  staging/production projects, Resend, owned Supabase-backed feature flags,
  Sentry Developer and Better Stack Free. Spend limits and alerts are required
  before accepting public traffic.
- Local-first drafting/export remains available without login or network.
  Cloud sync is opt-in, owner-scoped and conflict-safe; body measurements and
  workspace contents are not analytics or flag-audience data.
- The public web path uses immutable preview/staging/production artifacts.
  Blue and Green are deployment aliases, not diverging source branches. The
  previous healthy production artifact remains the rollback target. Database
  changes use expand → migrate → contract because both production aliases share
  the production database.
- The planned release train is biweekly on Tuesday at 2 PM Eastern, with a
  one-week scope cut and two-business-day code freeze. Security, outage,
  data-loss and user-blocking defects may use an expedited patch record with
  focused evidence and rollback.
- Feature flags control reversible UI/behavior rollout only. They never replace
  authorization/RLS or hide invalid geometry. Every flag declares owner,
  audience, default, expiry, ON/OFF behavior, tests and removal release. A
  `polo_v2` kill switch cannot be shipped until a compatible V1 fallback is
  actually present.
- The repository-local Control Center is the source of delivery truth. A
  contributor may move a work item only to `In Review`; Codex independently
  closes it after evidence. Missing historical evidence remains explicitly
  incomplete rather than invented.
- Slices 172–173 are complete without changing product drafting/export code:
  `ops/control-center/` contains the versioned board, validator, evidence-only
  importer and read-only dashboard; `ops/web/` contains the deterministic
  SHA-256 artifact manifest utility and provider-neutral delivery descriptor.
  The importer requires an existing evidence identity plus a verifiable
  commit/hash and cannot infer dates, owners, status or delivery.
- Slice 174's identity/cloud contract is complete in
  `docs/research/IDENTITY-CLOUD-WORKSPACE-RESEARCH.md`. P0 is guest/local mode
  plus explicit-consent, single-owner cloud sync with revision/idempotency
  conflict handling, deny-by-default RLS, expand/migrate/contract migrations,
  export and deletion semantics. SQL, provider SDKs, login UI, accounts and
  personal-data collection remain deferred under the launch-cost hold; the
  named jurisdiction, privacy/terms, consent, retention, auth-method,
  data-region, subprocessor, RLS and support decisions remain a future
  launch re-entry checklist.
- Slice 175's admission audit is recorded in
  `docs/planning/EPIC-12-SLICE-175-ADMISSION.md`. No authoritative record yet
  answers the required launch entity/jurisdiction, data sensitivity, lawful
  basis/consent, data-region/subprocessor, retention/deletion, P0 auth/session,
  anonymous-sharing or operating-ceiling decisions. The welcome/login/profile
  implementation is deferred by the explicit launch-cost hold, not a current
  blocker; provider-neutral fixtures, local evidence and decision
  documentation remain authorized.
- The standing platform threat model is
  `docs/research/WEB-PLATFORM-THREAT-MODEL.md`; no identity/cloud slice may
  collect data until its jurisdiction, retention, deletion, consent and RLS
  decisions are recorded.
- Shorts and sweatshirt geometry may run in parallel after Polo in isolated
  worktrees. Shared registry/UI/persistence/render/nesting/export integration
  is serialized and Codex-owned. Shorts, joggers and jeans may not concurrently
  change the lower-body source of truth.

## Launch-cost hold and no-cost interim platform work — confirmed 2026-09-21

- All work that creates a one-time or recurring launch cost is held until the
  maintainer explicitly says the project is ready for launch. This includes a
  paid hosting or database plan, domain registration, authenticated profiles,
  cloud sync, email delivery, hosted monitoring, paid repository governance,
  code-signing procurement, and any provider-backed operational service.
- The existing zero-cost, URL-only Cloudflare Pages preview and its verified
  GitHub Actions artifact delivery may continue. No new account, plan,
  domain, provider integration, secret, or external data path may be added
  under this hold.
- The unresolved jurisdiction, entity, privacy, data-region, personal-data,
  schema, authentication and support questions are deferred launch decisions,
  not current engineering blockers. They remain the re-entry checklist for
  the held identity/cloud work and must not be inferred during interim work.
- Slice 176 is already assigned to the preview noindex hardening recorded on
  `origin/main` at `ae1afe8`; it must not be reused for a later feature.
- Slice 177 is assigned to this launch-cost hold, no-cost interim re-scope and
  unique slice-sequence correction; it must not be reused for a feature.
- Epic 12's no-cost interim track may prepare local, repository and
  provider-neutral work only: Slice 178's embedded flag contract and rollout
  readiness, Slice 179's local delivery/governance rehearsal, Slice 180's
  synthetic failure/readiness drill, and Slice 181's preview-only/no-go
  handoff. Remote flags, a real Polo V2 rollout, provider promotion, hosted
  monitoring, backup services, email, auth, database, and public-beta claims
  remain deferred.
- The garment implementation queue begins only after this no-cost interim
  track is complete and the maintainer schedules the next family. Its order
  remains casual woven shorts, adult crewneck sweatshirt, adult knit jogger,
  pullover-hoodie extension, then rigid five-pocket jeans.

## Slice 178 local feature lifecycle and Polo readiness — complete 2026-09-22

- The no-cost local flag contract is implemented in
  `src/platform/feature-flags.ts`. Definitions declare owner, audience,
  embedded default, expiry, ON/OFF behavior, removal release, rollout mode and
  fallback availability. Unknown, stale/invalid-expiry and readiness-only
  outcomes are disabled and return explicit diagnostics; deterministic local
  overrides exist only as a contract/test input, not as a hosted control plane.
- The catalog records `polo_v2` as readiness-only with `fallback: none` and no
  live switch. A read-only source audit verified that no Polo V1 renderer or
  parallel recipe remains; the former V1 path was replaced in place. Existing
  legacy-save compatibility remains the current V2 pipeline and was not
  changed.
- No provider, network, account, database, profile, personal-data, drafting,
  persistence, export or authorization behavior was added. Full application
  tests and 100% coverage pass at 105 files / 1,421 tests, with strict
  TypeScript and the production build passing.
- Slice 179 completed the no-cost repository/local delivery boundary. Its
  candidate identity, explicit gates, approval/timestamp, failed-smoke
  selection, freeze checklist, incident route and deferred migration placeholder
  are recorded in `docs/release/SLICE-179-LOCAL-DELIVERY-REHEARSAL.md`. No
  CODEOWNERS or branch-protection setting was invented because ownership and
  required-check settings are external maintainer configuration; no provider
  mutation or cost was introduced.

## Slice 179 local delivery and rollback rehearsal — complete 2026-09-22

- `ops/web/release-rehearsal.mjs` computes a canonical whole-manifest digest
  and strictly validates candidate identity, four explicit gate booleans,
  reviewer approval/timestamp and a previous known-good record.
- Only an all-green, approved candidate is `promotable`. A smoke-only failure
  returns the validated previous candidate as `rolled-back` with
  `operation: "none"`; malformed candidates, missing/failed checks and invalid
  rollback targets are rejected without coercion.
- The freeze/smoke/incident matrix and the explicit no-SQL/no-database
  migration deferral are versioned in the Slice 179 release record. The local
  Control Center references that record and its evidence-file hash.
- The focused, application, coverage, build, manifest and Control Center gates
  are required for acceptance. No auth, profile, cloud sync, database,
  personal-data, hosted monitoring, domain, paid plan or runtime feature flag
  was added. Slice 180 completed the no-cost boundary; Slice 181 is next.

## Slice 180 provider-neutral readiness dry-run — complete 2026-09-22

- The local-only readiness fixture in `ops/readiness/readiness-drill.mjs`
  covers six synthetic local scenarios and two provider-backed scenarios.
  Every scenario must name an owner, runbook, fallback and evidence.
- Provider outage and hosted data deletion are structurally `deferred`, never
  passed. Local export/copy removal is synthetic only; it does not imply a
  primary saved-workspace deletion affordance or hosted deletion behavior.
- The stale-flag case uses a throwaway definition and cannot mutate the real
  catalog or create a live switch. Secret-like and personal-measurement values
  are rejected from fixture records.
- The result is `preview-only` with authenticated-beta and production readiness
  false. No provider, database, auth, monitoring, backup service, garment or
  personal-data behavior was added. Slice 181 is the next no-cost boundary.
