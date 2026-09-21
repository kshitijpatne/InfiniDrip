# EPIC 12 — Public Web Platform and Delivery Governance

Status: **SLICES 171–173 — FOUNDATION, CONTROL CENTER AND DELIVERY PROOF
COMPLETE; NO EXTERNAL ACCOUNT, PURCHASE OR PUBLIC DEPLOYMENT AUTHORIZED**

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

## Recommended operating model

The cost research recommends Cloudflare Registrar/DNS, Vercel Pro, Supabase
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

### Slice 174 — identity and cloud-workspace contract

Define the Supabase-compatible schema and migration contract for `profiles`,
private `workspaces`, revisions/sync metadata, and deletion/export operations.
Implement migrations and deny/allow RLS tests only after domain, jurisdiction,
privacy/terms, retention and support decisions are recorded. Keep design data
separate from auth identity and never log measurements or workspace contents.

Acceptance: cross-user reads/writes are denied; owner access is allowed;
anonymous/local mode remains usable; migration is expand/migrate/contract safe;
export and deletion are testable; conflicts never silently discard a local or
remote revision.

### Slice 175 — welcome, login and profile flow

Add the first-run welcome state, login/logout/session recovery and minimal
profile settings as an additive shell around the existing journey. Existing
local saves load without an account. A user may defer account creation until
cloud sync is requested; auth failure never destroys the local workspace.

Acceptance: new, returning, logged-out, expired-session, email-failure,
offline and account-deletion states are visible and actionable; no measurement
is sent before explicit sync consent; focus/accessibility and responsive gates
match Epic 5.

### Slice 176 — owned feature lifecycle and Polo rollout

Implement a typed flag interface with embedded safe defaults, optional remote
configuration, cache/staleness rules, owner, audience, expiry, ON/OFF behavior,
test evidence and removal release. `polo_v2` may only offer V2/V1 fallback if
both compatible paths actually exist; a flag cannot pretend a missing V1 path
is a rollback.

Acceptance: remote failure uses the declared default; stale/unknown flags are
visible in diagnostics; authorization/RLS do not depend on the client flag;
flagged and unflagged paths preserve save compatibility; every flag has an
expiry/removal owner.

### Slice 177 — protected delivery, freeze and blue/green rehearsal

Add branch protection/CODEOWNERS/required checks where the selected GitHub plan
supports them, candidate promotion records, freeze checklist, migration
compatibility check, smoke matrix, rollback rehearsal, incident patch route,
and deployment evidence. The inactive slot receives the exact candidate artifact
that passed staging; no manual rebuild occurs during promotion.

Acceptance: a failed check cannot promote; a failed smoke test returns traffic
to the previous alias; rollback is documented and rehearsed; database changes
are transition-safe; the Control Center records commit, artifact hash,
approvals, timestamps, flags and rollback result.

### Slice 178 — public beta readiness and operating drill

Run a bounded pre-launch exercise against the chosen providers: uptime/error
signals, backup/restore, auth abuse, rate limits, email failure, provider
outage, cost alerts, data deletion/export, stale flag, and blue/green rollback.
No real user invitation occurs during the exercise.

Acceptance: P0 failure paths have owner/runbook/rollback; spend ceiling and
alerts are active; privacy/terms/support links are present; no secret or
personal-measurement leak appears in logs or artifacts; explicit maintainer
approval is recorded before production traffic.

### Slice 179 — Epic 12 exit and durable handoff

Record whether the result is preview-only, authenticated beta-ready, or
blocked/no-go. Update release evidence, context, architecture, roadmap and the
Control Center. Codex alone may close the Epic and push a production-capable
result.

## Parallel tracks and ownership

Tracks 172 (local board) and 173 (provider-independent delivery proof) can run
in parallel. Track 174 must precede 175 and 176. Slice 177 depends on 173 and
the transition-safe portion of 174. Slice 178 depends on all production-facing
work. None of these tracks may modify drafting geometry or export writers.

Claude Code may perform a bounded threat-model or RLS adversarial review.
OpenCode may perform isolated Control Center rendering, fixture and CI-mechanical
work. Both return diffs and evidence only; Codex owns integration, corrections,
full gates and `origin/main`.

## Permanent gates

- Existing 100% coverage, TypeScript, production build, parsed-output and
  protected export-byte identity gates remain mandatory.
- No public URL, auth account, database, email service, domain, analytics,
  monitoring subscription or personal-data collection is activated without a
  separate explicit approval and current cost/terms check.
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
