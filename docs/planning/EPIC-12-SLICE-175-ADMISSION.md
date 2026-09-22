# Epic 12 — Slice 175 admission audit

**Reviewed:** 2026-09-21
**Owner:** Codex
**Status:** **DEFERRED — launch-cost hold; implementation not scheduled**

## Decision

Slice 175's planned welcome, login, logout, session-recovery and profile UI is
deferred because the maintainer has placed every one-time and recurring launch
cost on hold until launch readiness is explicitly reopened. The unresolved
identity, legal and product questions are retained as a future re-entry
checklist, but they are not a current engineering blocker and do not need to
be answered to continue no-cost local development and testing.

This is an intentional product deferral, not an implementation failure. Local
drafting, local persistence and exports remain available without an account or
network. Nothing in this slice creates an account, provider project, public
URL, migration, browser credential path, email sender or personal-data flow.

## Evidence checked

- `docs/research/IDENTITY-CLOUD-WORKSPACE-RESEARCH.md` names eight blocking
  decision groups and states that login UI is not admitted until they are
  resolved.
- `docs/planning/EPIC-12-EXECUTION.md` makes the same gate part of the Slice
  175 acceptance boundary.
- `docs/research/WEB-PLATFORM-THREAT-MODEL.md` continues to prohibit provider
  mutation and personal-data collection before launch is explicitly reopened.
- The current `origin/main` includes the latest Epic 8 packet correction at
  `18b8bac`; this audit was reconciled on top of that ref.
- The current maintainer decision records a launch-cost hold; the required
  answers remain a future re-entry checklist rather than a current blocker.

## Decisions required before launch-backed re-entry

When launch work is reopened, the maintainer/legal/product owner must add an
authoritative decision record covering each item below. A statement of intent
is not enough; the record needs an owner, date, scope, and evidence or
rationale. No one needs to resolve these questions for the no-cost interim
track.

1. Launch entity, initial jurisdictions, privacy notice, terms, support
   contact, and age/parental-consent policy.
2. Whether measurements and pattern/workspace content are sensitive or
   special-category data in every intended jurisdiction; until decided,
   engineering treats them as high sensitivity.
3. Lawful basis and separate consent wording for account creation, cloud
   sync, transactional email, cookies/storage, and any future analytics.
4. Data region, subprocessors, transfer mechanism and DPA approval for the
   selected hosting, Auth, database, email and monitoring providers.
5. Retention and deletion-completion targets for live rows, revisions,
   backups, email logs, security logs and local caches.
6. P0 authentication method and session scope. The packet recommends the
   smallest tested passwordless flow first; password/OAuth recovery surface
   and local-device versus global sign-out must be explicit.
7. Confirmation that anonymous share links are out of P0. Any later link
   requires a separate expiry, revocation and content-leak threat model.
8. Operating ceiling, abuse controls and shutdown owner for provider usage,
   email and storage growth.

## Authorized work while deferred

Only the following remains in scope:

- provider-neutral contract fixtures and tests that collect no real data;
- repository-local Control Center/evidence updates;
- static artifact and local-first outage/recovery proofs; and
- documentation needed to capture the decisions and re-admit Slice 175; and
- the remaining no-cost portions of Slices 180–181 defined in
  `docs/planning/EPIC-12-EXECUTION.md`.

The following are explicitly out of scope until the decision record is
approved: welcome/login/profile UI, auth SDKs, database migrations, RLS SQL,
provider accounts, public deployment, email delivery and personal-data
collection.

## Re-entry gate

Codex may reopen Slice 175 only after the maintainer explicitly reopens launch
readiness, approves the cost envelope, and the decision record is committed
and reviewed. The re-entry packet must then freeze the selected auth/session
contract, consent copy, data-region/subprocessor list, retention/deletion
targets, and provider-neutral test fixtures before any provider or UI code is
added. The first implementation must preserve guest/local drafting and must
prove offline, expired-session, email-failure, deletion and consent-denied
states without losing a local workspace.
