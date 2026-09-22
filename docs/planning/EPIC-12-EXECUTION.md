# EPIC 12 — Public Web Platform and Delivery Governance

Status: **SLICES 171–174 AND 176–181 COMPLETE; SLICE 175 DEFERRED BY THE
LAUNCH-COST HOLD; NO-COST INTERIM COMPLETE; LAUNCH-BACKED WORK DEFERRED**

Owner: **Codex**. Claude Code and OpenCode may contribute only bounded,
isolated audits or mechanical work under `docs/OPENCODE-WORKFLOW.md`. Codex
owns the platform contract, security/data decisions, actual diff review,
repairs, release gates and any push to `origin/main`.

Research authority: `docs/research/PUBLIC-WEB-PLATFORM-COST-RESEARCH.md` and
`docs/research/WEB-PLATFORM-THREAT-MODEL.md`.

## Objective

Turn InfiniDrip from a local-first Vite/Electron application into a safely
operated public web product without weakening the drafting, persistence,
guidance, export, legacy-hash, or honesty contracts. The target product has a
shareable global URL, optional authenticated profiles and cross-device design
workspace sync, reversible user-visible feature flags, controlled blue/green
releases, and a repository-local visual Control Center that records the real
development lifecycle.

The web product must remain usable as a local-first application when the
network, identity provider or flag service is unavailable. A hosted account is
not a prerequisite for drafting or local save. No personal data is collected,
provider account is created, domain is registered, or public deployment is
made by this packet.

## Classification and hard boundaries

- **Primary:** platform/reliability and delivery-governance epic.
- **Secondary:** additive identity, sync, feature-flag and operations layers.
- **Not:** a drafting rewrite, export rewrite, cloud-only conversion, analytics
  project, physical-fit claim, or Electron-signing project.
- The current local persistence path remains the baseline until cloud sync earns
  its own compatibility and recovery gate.
- Authentication and row-level security are security boundaries, never UI-only
  feature flags.
- A flag may control presentation or an explicitly reversible behavior, but it
  may not hide invalid geometry, weaken authorization, or make two incompatible
  save schemas appear compatible.
- No service key, database credential or privileged token may enter the browser
  bundle, repository, screenshots, Control Center data, or test fixture.

## Current maintainer boundary — no-cost interim track

All work that creates a one-time or recurring launch cost is held until the
maintainer explicitly says the project is ready for launch. This includes paid
hosting or database plans, domains, profiles, cloud sync, email delivery,
hosted monitoring, paid repository governance, code signing and provider-backed
operational services. The recommended launch stack and its approximately
$59/month planning envelope remain future research, not an implementation
target.

The existing zero-cost, URL-only Cloudflare Pages preview and its verified
GitHub Actions artifact delivery may continue. No new account, plan, domain,
provider integration, secret, or external data path may be added under this
hold. “No-cost” means repository-local, test-only, provider-neutral work plus
the already-approved static preview; it does not mean that a free-tier account
for a database, auth, email, monitoring or cloud workspace is admitted.

Slice 175 is deferred rather than an active engineering blocker. Its unresolved
jurisdiction, entity, privacy, data-region, personal-data, schema,
authentication and support questions remain the re-entry checklist for launch
work, but do not need to be resolved for the interim track. Login UI, auth SDK,
SQL/RLS migration, profiles, cloud sync and personal-data flow remain out of
scope.

## Recommended operating model

The future launch model recommends Cloudflare Registrar/DNS, Vercel Pro, Supabase
Auth/Postgres with separate staging and production projects, Resend through
Supabase custom SMTP, an owned Supabase-backed flag interface with local
defaults, Sentry Developer plus Better Stack Free, and a repository-local
Control Center. The cost research estimates approximately $59/month for a
low-volume authenticated beta plus a normal domain, before tax and variable
usage. No purchase is implied.

Blue and Green are immutable deployment aliases, not permanently diverging
branches. `main` is the protected source line. A branch produces a preview; a
release candidate is built once; the inactive production alias receives that
same artifact; traffic switches only after the gate; the previous healthy alias
remains the rollback target. Staging uses its own Supabase project. Blue and
Green production aliases share the production database and therefore require
expand → migrate → contract schema changes.

The planned cadence is a two-week feature train: scope cut one week before the
release, code freeze two business days before Tuesday 2:00 PM Eastern release,
candidate smoke and rollback rehearsal during the freeze, then independent
review and traffic promotion. A P0 security, outage, data-loss or user-blocking
patch may ship outside the train with focused evidence, an approval record and
a known rollback artifact.

## Slice plan

Slice numbers continue after the cost-research record at Slice 170. They are
execution boundaries, not promises of calendar dates.

### Slice 171 — platform admission, threat model and release contract — complete

Define the data classes, trust boundaries, provider choices, cost ceiling,
blue/green semantics, freeze rules, flag contract, local Control Center
contract, open legal/product decisions, and the no-account/no-deployment gate.

Acceptance:

- `docs/research/WEB-PLATFORM-THREAT-MODEL.md` covers assets, trust boundaries,
  threats, controls, retention/deletion, incident response and unresolved
  decisions.
- This execution packet states P0/P1/P2 scope, non-goals, dependencies,
  acceptance gates, rollback rules and ownership.
- `PROJECT-STATE.md`, `ARCHITECTURE.md`, `docs/PROJECT-DECISIONS.md`,
  `ROADMAP.md` and `CONTEXT-INDEX.md` identify Epic 12 and its current gate.
- The packet explicitly forbids provider mutation and preserves all existing
  product/export contracts.

Non-goals: no provider SDK, schema migration, login UI, remote flag read,
deployment workflow, domain registration, user-data collection or Control
Center runtime code.

Owner/model: Codex; Sol-high review for security/data/release boundaries,
Luna-max for document reconciliation and mechanical consistency checks.

### Slice 172 — repository-local Control Center v1 — complete

Add a dependency-light local board under `ops/control-center/` with a versioned
work-item schema, Epic/release/evidence records, a read-only visual dashboard,
state-transition rules and an importer that only records verifiable commit and
exit-report facts. It must show historic work as `incomplete` where evidence is
missing rather than inventing dates, owners or acceptance proof.

Acceptance: every item exposes ID/type, parent Epic, release, opened/target/
delivered dates, priority/risk, owner/contributor/reviewer, dependencies,
protected surfaces, description, expectation, acceptance criteria, status
history, comments and immutable evidence references. Contributors can move an
item only to `In Review`; Codex closes it after independent evidence review.
Malformed board data is rejected visibly. The dashboard remains local and does
not become the product's hosted user workspace.

Non-goals: Jira replacement with remote collaboration, automatic status guesses,
provider integration, modifying application drafting UI, or a new runtime
dependency without an explicit license/size review.

Verified: the canonical board, JSON schemas, validator, importer and dashboard
are covered by nine focused Node tests; a fresh Playwright browser loaded the
dashboard and displayed the board title and `SLICE-173`. The importer rejects
unknown evidence, URI/kind changes, duplicate facts and facts without a
commit/hash proof.

Owner/model: Codex contract; OpenCode may implement an isolated read-only
dashboard and fixtures; Codex reviews and integrates.

### Slice 173 — static web preview and immutable delivery proof — complete

Prove that the existing Vite build serves correctly over HTTP(S), keeps
Electron's relative asset contract, emits a repeatable candidate artifact, and
can be promoted/rolled back by immutable deployment identity. Add only
repository-local scripts/configuration and CI checks after provider-independent
local proof; no provider routing file is admitted before a hosting choice and
deployment rehearsal are approved. No account or secret is needed for the
first artifact rehearsal.

Acceptance: a fresh browser loads the real app; all existing render/export
tests, legacy hashes and build gates pass; the artifact manifest is repeatable;
a candidate and rollback alias can be described without source-branch mutation;
secrets are absent from output. Public deployment remains a separate approval.

Verified: `npm test` passes 104 files / 1,415 tests, TypeScript and the Vite
production build pass, the manifest is byte-for-byte repeatable across two
generations, and HTTP smoke checks load the built index plus both referenced
assets. No provider account, secret, domain or deployment was used.

#### Approved interim preview boundary

The maintainer subsequently approved a zero-cost friend/family preview without
opening the authenticated platform gates. The preview may deploy only the
immutable `dist/` artifact from `main` to Cloudflare Pages Free at a
`*.pages.dev` URL, with `noindex, nofollow, noarchive` and URL-only access.
It remains local-first: no login, database, cloud sync, telemetry, email
sender or measurement egress is admitted, and each user's saved workspace
remains in that browser's local storage. Cloudflare account OAuth and Pages
project creation were the only external deployment actions in this interim
track; Access allowlisting, custom domains, paid services and launch
infrastructure remain deferred. The noindex hardening is on `origin/main` at
`ae1afe8`. The `infinidrip-preview` Direct Upload project is live at
`https://infinidrip-preview.pages.dev/`; deployment ID, artifact source,
browser/network evidence and limitations are recorded in
`docs/release/WEB-PREVIEW-DEPLOYMENT.md`. Because Cloudflare does not permit
converting Direct Upload to Git integration, the repository's bounded
`.github/workflows/pages-deployment.yml` workflow is the active automatic
delivery path. It runs on every `main` push (and explicit manual dispatch)
after the two protected GitHub Actions secrets are configured.

### Slice 174 — identity and cloud-workspace contract — contract complete; provider gated

Define the Supabase-compatible schema and migration contract for `profiles`,
private `workspaces`, revisions/sync metadata, and deletion/export operations.
The provider-independent contract is recorded in
`docs/research/IDENTITY-CLOUD-WORKSPACE-RESEARCH.md`. Implement migrations and
deny/allow RLS tests only after domain, jurisdiction, privacy/terms,
retention, consent, data-region and support decisions are recorded. Keep
design data separate from auth identity and never log measurements or
workspace contents.

Acceptance: cross-user reads/writes are denied; owner access is allowed;
anonymous/local mode remains usable; migration is expand/migrate/contract safe;
export and deletion are testable; conflicts never silently discard a local or
remote revision.

Contract evidence: the logical schema, data classification, owner-only RLS and
grant matrix, migration sequence, local-first sync/idempotency/conflict rules,
export/deletion/backup-retention contract and pressure-test matrix are complete.
No SQL migration, provider SDK, login UI, account, public URL or personal-data
collection is included. Slice 175 is held by the launch-cost decision; the
decisions in the Slice 174 research record are retained for later re-entry and
are not a current prerequisite for no-cost work.

Owner/model: Codex; Sol-high for security/privacy/RLS review, Luna-max for
document reconciliation. Claude/OpenCode may audit the matrix or produce
provider-neutral fixtures only after Codex issues a bounded handoff.

### Slice 175 — welcome, login and profile flow — deferred

**Current status: DEFERRED by the launch-cost hold.** The implementation is
not scheduled until the maintainer explicitly reopens launch work and approves
the required provider/cost/data decisions. The record in
`docs/planning/EPIC-12-SLICE-175-ADMISSION.md` is a future re-entry checklist,
not a current blocker for local development. No login UI, auth SDK, SQL/RLS
migration, provider account, email sender or personal-data flow may be added
under the hold.

Add the first-run welcome state, login/logout/session recovery and minimal
profile settings as an additive shell around the existing journey. Existing
local saves load without an account. A user may defer account creation until
cloud sync is requested; auth failure never destroys the local workspace.

Acceptance: new, returning, logged-out, expired-session, email-failure,
offline and account-deletion states are visible and actionable; no measurement
is sent before explicit sync consent; focus/accessibility and responsive gates
match Epic 5.

### Slice 176 — static preview noindex hardening — complete

Keep the approved friend/family preview out of search and archival indexes by
emitting `noindex, nofollow, noarchive` in the static HTML. This slice changed
no drafting, persistence, export, account, data or provider-runtime behavior.

Verified: the noindex hardening is on `origin/main` at `ae1afe8`, and the
existing fresh-browser, network-capture and static artifact checks remain the
evidence for the URL-only preview. Slice 176 is already assigned and must not
be reused for a later feature.

### Slice 177 — no-cost launch hold and slice-sequence correction — complete

Record the maintainer's explicit hold on all one-time and recurring launch
costs, verify the free static-preview and public-repository CI boundaries, and
re-sequence future work from the next unused slice number. This slice changes
planning and delivery governance only; it does not add a provider, account,
database, auth path, personal-data flow or application runtime behavior.

Verified: the no-cost interim boundary, the deferred Slice 175 re-entry path,
the unique monotonically increasing commit rule, and the corrected future
sequence are recorded in durable context and the local Control Center. Slice
177 is now assigned to this planning decision and must not be reused.

### Slice 178 — embedded feature lifecycle and Polo rollout readiness — complete

Implement and test the repository-local portion of the flag contract: typed
flag metadata, embedded safe defaults, explicit owner/audience/expiry,
ON/OFF behavior, unknown/stale diagnostics, and removal-release evidence.
Remote configuration, cache invalidation against a provider, hosted flag
storage, cohort targeting and any auth/RLS integration are deferred.

The slice may audit and prepare the `polo_v2` rollout contract, but it may not
ship a public toggle unless a compatible V1 fallback actually exists. If that
fallback is absent, the accepted result is a readiness record and safe local
flag infrastructure with no live Polo switch. No flag may hide invalid
geometry or act as authorization.

Implementation: `src/platform/feature-flags.ts` and its focused test suite
provide typed metadata, embedded defaults, deterministic local overrides,
unknown/stale/expiry diagnostics and explicit readiness-only handling. The
catalog records `polo_v2` with no compatible V1 fallback, so no runtime toggle
was wired. Existing legacy-save compatibility remains covered by
`src/ui/persist.test.ts` and no save-version, drafting, export or geometry
behavior changed.

Verified: the full suite passes 105 files / 1,421 tests with 100% statements,
branches, functions and lines; strict TypeScript and the production build
pass. Claude's read-only audit confirmed that a Polo V1 renderer does not
exist, so a kill switch would have been dishonest. Slice 179 follows as the
next no-cost delivery boundary.

### Slice 179 — repository/local delivery and rollback rehearsal — no-cost scope

Add or verify repository-owned governance artifacts: CODEOWNERS/required-check
configuration where the current public GitHub Free repository supports it,
candidate promotion records, freeze checklist, static migration-compatibility
placeholders, smoke matrix, local rollback rehearsal, incident patch route and
artifact evidence. Rehearse immutable candidate identity using the existing
manifest and static preview contract; do not create a paid plan, domain,
production alias, database, or new provider workflow.

Acceptance: a failed local check cannot be recorded as promotable; a failed
smoke rehearsal selects the previous known-good artifact; rollback is
documented and repeatable; future database changes are explicitly marked
deferred; and the Control Center records commit, artifact hash, approvals,
timestamps and rehearsal result without contacting a new provider.

Implemented in `ops/web/release-rehearsal.mjs` and recorded in
`docs/release/SLICE-179-LOCAL-DELIVERY-REHEARSAL.md`. The repository verifies
the candidate/manifest/approval contract locally. CODEOWNERS and required-check
settings remain external maintainer configuration and were not invented or
mutated; no new provider workflow, account, plan or cost was introduced.

### Slice 180 — provider-neutral readiness dry-run — partial no-cost scope

Run a synthetic, local-only operating drill for the failure matrix: static
preview outage, artifact rollback, local-save backup/restore, stale flag,
malformed input, export/deletion behavior, and unavailable future providers.
Use fixtures and runbooks only; do not create monitoring, backup, auth, email,
database or alerting services, and do not exercise real personal data or invite
users.

This does not complete the provider-backed public-beta readiness slice. The
real uptime/error, backup/restore, auth-abuse, rate-limit, email, provider
outage, cost-alert and hosted data-deletion exercise remains deferred until
launch is explicitly reopened.

Acceptance: every no-cost failure path has an owner, runbook and fallback;
synthetic evidence contains no secrets or personal measurements; deferred
provider-backed checks are listed as deferred rather than marked passed; and
the result makes no authenticated-beta or production-readiness claim.

Implemented in `ops/readiness/readiness-drill.mjs` and recorded in
`docs/release/SLICE-180-READINESS-DRILL.md`. The local export/delete row covers
only a synthetic exported copy; hosted deletion remains deferred because the
current app has no hosted data path. The stale-flag row uses a throwaway
definition and does not mutate the real catalog. The deterministic summary is
preview-only: six local passes, two provider deferrals, and no beta/production
readiness claim.

### Slice 181 — preview-only/no-cost exit and durable handoff

Record the no-cost interim result as preview-only, with launch-backed identity,
cloud workspace and public-beta work explicitly deferred. Update release
evidence, context, architecture, roadmap and the Control Center. This exit may
close the interim track, but it must not claim authenticated beta readiness or
production readiness. Codex alone may close the interim track and push the reviewed
documentation/evidence result.

Implemented in `docs/release/EPIC-12-NO-COST-INTERIM-EXIT.md`. Slice 181 is
closed with the full status history and verified Control Center evidence. Epic
12 and `REL-PLATFORM-FOUNDATION` remain `In Progress` because launch-backed
identity, data, provider and operational work is still deferred. The garment
queue is not started by this exit; the maintainer discussion gate precedes any
new garment packet.

## Parallel tracks and ownership

Tracks 172 (local board), 173 (provider-independent delivery proof), 176
(preview noindex hardening), 177 (the no-cost decision/re-sequencing record),
178 (the local flag/readiness contract), 179 (local delivery/rollback
rehearsal), 180 (synthetic readiness drill) and 181 (preview-only exit) are
complete. Slice 179
depended on 173 and 178; Slice 180 depended on the local portions of 179.
Slice 181 closes the no-cost interim after those dry-runs. Slice 175 and all provider-backed portions
of 179–180 remain a separate launch track and are not dependencies for the
no-cost interim. None of these tracks may modify drafting geometry or export
writers.

Claude Code may perform a bounded threat-model or RLS adversarial review.
OpenCode may perform isolated Control Center rendering, fixture and CI-mechanical
work. Both return diffs and evidence only; Codex owns integration, corrections,
full gates and `origin/main`.

## Permanent gates

- Existing 100% coverage, TypeScript, production build, parsed-output and
  protected export-byte identity gates remain mandatory.
- No one-time or recurring cost, account, plan upgrade, domain, provider-backed
  feature, hosted monitoring path, database, auth/profile flow, cloud sync,
  email service or personal-data path may be added until the maintainer
  explicitly reopens launch readiness. The existing free static preview is the
  only external-service exception.
- No authenticated public platform, database, email service, domain,
  analytics, monitoring subscription or personal-data collection is activated
  without a separate explicit approval and current cost/terms check. The
  approved static friend/family preview is the sole interim public-URL
  exception and must remain artifact-only, noindex, URL-only and local-first.
- No cloud data path may make local drafting unavailable during provider outage.
- No flag may weaken authorization or conceal invalid application state.
- No release may promote an unreviewed or rebuilt artifact.
- No platform feature may claim physical fit, sewability, manufacturing
  readiness or production readiness.

## Return contract

Every slice returns its exact commit, changed files, focused/full gate results,
security/data evidence, rollback/fallback evidence, cost or provider impact,
known limitations, and a statement that no contributor pushed `main`. Codex
reviews the actual diff and evidence before accepting the next slice.
