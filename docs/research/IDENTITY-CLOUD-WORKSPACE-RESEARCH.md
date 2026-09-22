# Epic 12 Slice 174 — Identity and cloud-workspace contract

Status: **provider-independent contract complete; provider implementation
deferred by the launch-cost hold and future maintainer/legal decisions**
Reviewed: 2026-09-21
Owner: Codex

This record makes Slice 174 implementation-ready without creating an account,
registering a domain, collecting personal data, adding a provider SDK, or
running a migration. It is an engineering contract, not a privacy notice or
legal advice. The existing local-first drafting, persistence, guidance and
export behavior remains authoritative.

## Decision summary

1. **Guest/local mode remains the default.** A person can draft, save and
   export without login, network access or cloud-sync consent.
2. **Cloud sync is opt-in per workspace.** Login alone never uploads a local
   workspace. The first cloud operation must explain what is sent, why it is
   needed, where it is stored and how to stop/delete it.
3. **P0 is single-owner workspaces.** Sharing, teams, public links, comments,
   multi-user editing and vendor marketplace data are P2 and require a new
   threat model.
4. **Identity and design data are separate.** Auth owns credentials and
   sessions; application tables refer to the provider user ID. Body
   measurements, garment options, patterns and surface artwork are treated as
   sensitive product/user data by default and never become analytics or flag
   audience data.
5. **The server never uses blind last-write-wins.** Every accepted cloud write
   has a server revision, client origin and client revision. A stale base
   revision is rejected as a conflict while the local copy remains intact.
6. **No privileged browser path exists.** The browser may use only a public
   client key; service-role credentials, migration credentials and account
   deletion authority stay server-side and out of Vite artifacts, logs and
   fixtures.
7. **Deletion is a workflow, not a row toggle.** Live rows, provider sessions,
   backups, email records, monitoring events and local caches each need an
   explicit retention/deletion outcome.

## Data classes and purpose limitation

| Entity | P0 purpose | Sensitivity | Allowed location | Explicitly prohibited |
| --- | --- | --- | --- | --- |
| Auth identity, verified email, provider user ID, sessions | authenticate and recover the account | Restricted identity | managed Auth provider; minimal application references | passwords, refresh tokens or raw provider secrets in InfiniDrip logs |
| Profile settings | display name, units, locale and product preferences | Personal profile | owner-scoped `profiles` row and local cache | measurements, pattern payloads, analytics or flag audience data |
| Workspace document | user-owned measurements, garment options, pattern state and surface placements | Sensitive product/user data | local workspace by default; cloud only after consent | telemetry, public URLs, cross-user access, raw HTML execution |
| Accepted workspace revisions | conflict-safe sync and recovery | Sensitive product/user data | owner-scoped append-only revision rows | silent overwrite, arbitrary mutation, indefinite retention without policy |
| Sync consent | prove the cloud-sync purpose/version accepted by the user | Consent record | owner-scoped consent row | bundling consent into a login click or using it for unrelated analytics |
| Release/flag evidence | operate the product safely | Operational configuration/integrity evidence | repository, Control Center and controlled config | user measurements or workspace content in rollout audiences |

The application must document the purpose and minimum fields before collection.
The storage-limitation record must state a retention period or review rule for
each category; “keep forever” is not a default. The [ICO storage-limitation
guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/)
emphasizes purpose-linked retention and erasure/review, while the [EDPB data
subject-rights overview](https://www.edpb.europa.eu/topics/key-gdpr-concepts/data-subject-rights_en)
lists access, rectification, erasure, restriction and portability as rights
that need a clear procedure. The launch jurisdiction and legal basis remain
open decisions; these sources do not replace legal review.

## Logical schema contract (no migration yet)

The following is a provider-compatible logical shape, not an instruction to
create tables before the privacy gate. IDs are UUIDs unless noted. Timestamps
are UTC and server-generated. `created_at`/`updated_at` are not user-provided
and must never be used to invent historical delivery dates in the Control
Center.

### `profiles`

- `user_id` — primary key and foreign key to the provider's canonical user ID;
  immutable after creation.
- `display_name` — optional, length-limited, escaped on every render.
- `units` — an allow-listed value such as `metric` or `imperial`; no arbitrary
  JSON.
- `locale` — allow-listed product locale, nullable until selected.
- `created_at`, `updated_at` — server timestamps.

No body measurements, design payload, email copy, password, refresh token or
analytics identifiers belong in this row. Email changes and account deletion
follow the provider's verified identity flow rather than matching email text.

### `workspaces`

- `id` — opaque workspace UUID.
- `owner_user_id` — immutable foreign key to `profiles.user_id`/provider user
  ID; P0 has exactly one owner.
- `title` — optional length-limited display label.
- `document_schema_version` — version of the local workspace document contract.
- `server_revision` — monotonically increasing integer used for compare-before-
  write; starts at zero.
- `created_at`, `updated_at` — server timestamps.

There is no public slug, share token or member table in P0. Deleting a user
must not leave an orphaned workspace. A future sharing design must not weaken
the owner-only policies or reuse an opaque workspace ID as a secret.

### `workspace_revisions`

- `id` — opaque revision UUID.
- `workspace_id` — foreign key to `workspaces.id`.
- `client_origin` — random per local installation/workspace, not a person or
  tracking identifier.
- `client_revision` — monotonic revision from that client origin.
- `base_server_revision` — revision the client read before editing.
- `server_revision` — assigned atomically when accepted.
- `document_schema_version` — schema used to validate the payload.
- `document` — validated workspace document JSON; never logged or sent to
  analytics/error telemetry.
- `created_at` — server timestamp.

The uniqueness key `(workspace_id, client_origin, client_revision)` makes a
retry idempotent. Revisions are append-only to clients; correction/deletion is
performed through the owner workflow and retention job, not arbitrary client
updates.

### `sync_consents`

- `user_id` — owner/provider user ID.
- `workspace_id` — the workspace for which cloud sync was authorized.
- `purpose` — currently only `cloud_sync`.
- `policy_version` — version of the displayed privacy/terms/consent copy.
- `granted_at`, `withdrawn_at` — server timestamps; withdrawal stops new sync.

Consent is scoped to the purpose and workspace. A user may continue local work
after withdrawal; pending remote writes are not silently retried.

## Authorization and RLS contract

Every exposed table receives RLS and least-privilege grants in the same
migration. The anonymous role has no access to private rows. Every policy
names its role and checks the authenticated provider ID; owner filters are
indexed. Supabase documents that grants and policies are separate checks and
that enabling RLS alone does not remove existing grants; its [RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
also requires explicit `using`/`with check` policy tests for each operation.

| Table | Anonymous | Authenticated owner | Authenticated non-owner | Service workflow |
| --- | --- | --- | --- | --- |
| `profiles` | deny all | select/insert/update only own row; delete only through account-deletion workflow | deny | audited deletion/export orchestration only |
| `workspaces` | deny all | select/insert/update/delete own rows; `owner_user_id` cannot change | deny | migration/backfill only, never browser |
| `workspace_revisions` | deny all | select/insert revisions under an owned workspace; no direct update/delete | deny | retention/deletion job only |
| `sync_consents` | deny all | select/insert/withdraw only own consent | deny | legal/audit export, no content access |

For every table and operation, the test matrix must include:

- signed-out request (`anon`) is denied;
- user A cannot read, insert, update or delete user B's rows;
- user A cannot change an owner key to user B;
- user A can perform only the documented owner operation;
- expired/revoked sessions are denied for new requests;
- a service workflow is not reachable with the public browser key.

Use an explicit `auth.uid() IS NOT NULL` check plus the owner comparison where
appropriate. An update needs both a `using` check for the existing row and a
`with check` for the resulting owner key. Avoid recursive policies; if a future
membership feature needs a helper, isolate a reviewed security-definer
function with a fixed search path. The [Supabase user-data guidance](https://supabase.com/docs/guides/auth/managing-user-data)
confirms that provider user IDs, not mutable email text, are the durable
foreign-key boundary.

## Migration and environment contract

No SQL migration is included in Slice 174. Once the blocking decisions are
recorded, implementation must follow this sequence:

1. Create and test the schema in a separate staging project. Production and
   staging credentials, regions and data are never shared.
2. **Expand:** add new tables/indexes/nullable columns, enable RLS with deny-
   by-default policies, and grant only the operations under test.
3. **Migrate:** dual-read/write only where both the old and new application
   versions understand the transition shape; backfill in bounded, observable
   batches without logging payloads.
4. **Contract:** switch reads after compatibility evidence, then enforce
   constraints or remove old fields only after both Blue and Green artifacts no
   longer use them.
5. A failed migration uses a forward corrective migration or a known previous
   artifact; no destructive down migration is assumed to be safe.

Every migration receives staging pgTAP/deny-allow tests, schema-diff review,
backup/restore evidence and a Control Center record before production. Blue
and Green share the production database, so an application rollback must still
understand the transition schema.

## Local-first sync protocol

The contract is a compare-before-write protocol, not a real-time collaborative
editor:

```text
local edit
  → persist local workspace immediately
  → if no consent/network, remain local and show queued/offline state
  → if consented, send (workspace, clientOrigin, clientRevision,
     baseServerRevision, schemaVersion, document)
  → authenticate and verify owner
  → reject unsupported schema or stale base without writing
  → if idempotency key already accepted, return the original result
  → otherwise validate and atomically append revision + increment serverRevision
```

Conflict outcomes are explicit:

- **No conflict:** server accepts the document and returns the new revision.
- **Stale base:** server returns `conflict` plus the latest remote revision;
  the client preserves the unsent local copy. The user chooses keep local,
  keep remote, or duplicate the local copy as a new workspace.
- **Timeout after server acceptance:** retrying the same idempotency key returns
  the original result; it never creates a duplicate revision.
- **Schema mismatch:** keep local data usable, show an upgrade action, and do
  not silently drop unknown fields.
- **Auth expiry/provider outage:** keep local edits, stop remote retries until
  session/network recovery, and make the failure actionable.

Deletion or consent withdrawal pauses the queue first. A pending local revision
must never resurrect a deleted workspace. A conflict resolver must never use
last-write-wins, merge opaque JSON by guessing, or claim that a remote write
completed when the server result is unknown.

## Export, deletion and retention contract

### Export

The user can request a versioned, portable export containing the profile fields,
workspace metadata, current document, accepted revisions and sync-consent
records that belong to that user. It excludes provider passwords, session
tokens, service credentials and internal operational secrets. The export is
generated on demand, delivered through an authenticated path, and is not
written to error telemetry. Local export remains available without an account.

### Account deletion

The eventual workflow must:

1. require a clear, authenticated deletion request and offer export first;
2. mark sync/deletion pending so new writes cannot race the purge;
3. delete or anonymize owner-scoped profiles, workspaces, revisions and
   consent rows in a transactionally verifiable job;
4. revoke sessions/provider identity through the approved server workflow;
5. handle email delivery logs, monitoring events, local caches and provider
   backups under the documented retention schedule;
6. produce non-sensitive completion evidence without retaining workspace
   payloads; and
7. leave no path for an old queued client revision to recreate the account.

Supabase's [user-management documentation](https://supabase.com/docs/guides/auth/managing-user-data)
notes that deleting an Auth user invalidates refresh tokens but an already
issued JWT can remain usable until expiry; the contract therefore requires a
short, reviewed token lifetime or a session check for sensitive operations.
The [Supabase session/sign-out guidance](https://supabase.com/docs/guides/auth/sessions)
and [sign-out scopes](https://supabase.com/docs/guides/auth/signout) must be
tested for the chosen per-device versus global sign-out behavior.

Backups are not assumed to disappear at the instant live rows are deleted. The
retention record must state when backups are overwritten or placed beyond use,
who verifies completion and what a restore would do to a deletion request.

## Pressure-test matrix

| Scenario | Required truth | Contract response |
| --- | --- | --- |
| First visit, no network | drafting/export must still work | stay local; no auth or upload attempt |
| Login without sync consent | identity does not imply data upload | store only the minimum profile/session state; cloud workspace remains untouched |
| Consent then offline edit | local work cannot be lost | save locally, mark queued, retry only after recovery |
| Two devices edit offline | no silent overwrite | stale-base conflict with both choices visible |
| Request timeout after accepted write | retry cannot duplicate data | idempotency key returns original server result |
| Expired session during sync | no stale-token write or data loss | preserve local edit, require re-authentication |
| User A guesses B's workspace ID | IDs are not authorization | RLS denies every operation and reveals no existence signal |
| Account deletion with queued edits | deletion cannot be undone by a client | stop queue, purge, revoke, and reject subsequent writes |
| Blue rollback during migration | old artifact remains safe | expand/migrate/contract compatibility; no destructive switch |
| Hostile profile/title/document string | no code execution | validate lengths/types, escape UI, never inject raw HTML |
| Provider outage or cost ceiling | service failure is not product data loss | remain local, surface status, alert/shutdown before overage |

## Blocking decisions before provider implementation

The following must be answered and recorded by the maintainer/legal/product
owner before Slice 175 UI auth or any SQL/RLS implementation:

1. Launch entity, initial jurisdictions, privacy notice, terms, support
   contact and applicable age/parental-consent policy.
2. Whether body measurements and pattern/workspace content are treated as
   sensitive/special-category data in each intended jurisdiction; default
   engineering treatment is high sensitivity.
3. Lawful basis and consent wording for account, cloud sync, transactional
   email, cookies/storage and any future analytics; no bundled consent.
4. Data-region, subprocessors, transfer mechanism and DPA approval for the
   selected host/Auth/database/email/monitoring providers.
5. Retention periods and deletion completion targets for live rows, revision
   history, backups, email logs, security logs and local caches.
6. P0 auth method: recommend the smallest tested passwordless flow first;
   decide whether password or OAuth is needed before adding its attack/recovery
   surface. Decide whether sign-out is local-device or global by default.
7. No anonymous share links in P0; any future link requires a separate threat
   model, expiry/revocation and content-leak review.
8. Operating ceiling and shutdown owner for provider usage, email abuse and
   storage growth.

Until these are resolved, this identity/cloud track may add only contract
fixtures, local tests and evidence. No provider account, migration, login UI,
public URL or personal-data collection is admitted under the launch-cost hold.
Separate repository-local and provider-neutral Epic 12 interim work remains
authorized by `docs/planning/EPIC-12-EXECUTION.md`.

## Slice 174 acceptance and handoff

- Logical schemas, owner-only P0 scope and data classification are explicit.
- RLS/grant matrix covers anonymous, owner, non-owner, expired-session and
  service-workflow cases for every table and operation.
- Expand/migrate/contract, separate staging/production and no-browser-service-
  key rules are explicit.
- Sync has revision, client-origin, idempotency, conflict, outage, schema
  mismatch and deletion-race behavior with no silent last-write-wins.
- Export, deletion, backup-retention and local-cache outcomes are testable and
  do not claim instant deletion where the provider cannot guarantee it.
- Pressure tests include offline/local-first, IDOR, session expiry, retries,
  hostile values, provider outage, cost ceiling and blue/green migration.
- Blocking legal/product decisions are named; no implementation is claimed.
- `PROJECT-STATE.md`, `ARCHITECTURE.md`, `docs/PROJECT-DECISIONS.md`,
  `docs/planning/ROADMAP.md`, `CONTEXT-INDEX.md` and the Control Center record
  identify Slice 174 as contract-complete/provider-gated.

## Primary sources consulted

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase managing user data](https://supabase.com/docs/guides/auth/managing-user-data)
- [Supabase sessions](https://supabase.com/docs/guides/auth/sessions)
- [Supabase sign-out scopes](https://supabase.com/docs/guides/auth/signout)
- [ICO storage limitation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/storage-limitation/)
- [ICO right to erasure](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/)
- [European Data Protection Board — data subject rights](https://www.edpb.europa.eu/topics/key-gdpr-concepts/data-subject-rights_en)
- [California Privacy Protection Agency — CCPA statute](https://cppa.ca.gov/regulations/pdf/ccpa_statute_eff_20260101.pdf)
