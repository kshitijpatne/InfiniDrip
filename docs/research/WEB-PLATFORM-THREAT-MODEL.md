# Web Platform Epic — threat model and data-boundary record

Status: **Slice 171 threat boundary + Slice 174 contract reviewed; Slice 175
deferred by the launch-cost hold; launch-backed provider implementation gated**
Date: 2026-09-21  
Owner: Codex

This record defines the security and privacy boundary before InfiniDrip adds
accounts, cloud persistence or a public deployment. It is engineering planning,
not legal advice or a privacy notice. No provider account, domain, database,
email sender, telemetry stream or user data collection is authorized by this
record.

Slice 174 applies this boundary in the provider-independent contract at
`docs/research/IDENTITY-CLOUD-WORKSPACE-RESEARCH.md`; the Slice 175 deferral
audit at `docs/planning/EPIC-12-SLICE-175-ADMISSION.md` confirms that the
unresolved legal and product decisions below remain required before any
launch-backed auth UI, provider implementation or personal-data flow. They do
not block the current repository-local, provider-neutral interim work.

## System and trust boundaries

1. **Local app boundary.** The existing Vite/Electron application drafts,
   checks, renders and exports locally. Local saves remain usable without an
   account or network.
2. **Browser delivery boundary.** A future static web artifact is served from
   an immutable deployment. The browser is untrusted: anything in its bundle,
   local storage, query string or client flag state is user-controlled.
3. **Identity boundary.** A future managed Auth provider owns credentials,
   session issuance and email verification. InfiniDrip must not receive or log
   passwords, service-role keys or raw authentication secrets.
4. **Data boundary.** A future Postgres API stores only rows authorized by
   owner-scoped RLS. The browser may use an anon/public key, never a service
   key. Production and staging projects are separate.
5. **Operations boundary.** Hosting, email, error monitoring, uptime checks,
   source control and the local Control Center each receive the minimum data
   needed for their function. Workspace geometry and body measurements are not
   telemetry payloads.

## Asset classification

| Asset | Classification | Default location | Required control |
| --- | --- | --- | --- |
| Auth email, provider user ID, session metadata | Restricted identity | Auth provider | provider controls, short-lived sessions, no password handling, deletion path |
| Display name, units, preferences | Personal profile | owner-scoped profile row and local cache | RLS, export/delete, explicit consent where required |
| Body measurements, garment options, patterns, surface artwork, drafts | Sensitive product/user data | local workspace; cloud only after opt-in | owner RLS, encryption in transit/at rest, no logs/analytics, export/delete, conflict-safe sync |
| Feature-flag definitions and exposure rules | Operational configuration | versioned repo/defaults plus controlled config | owner, audience, expiry, audit/evidence, safe offline default |
| Release artifacts, hashes, approvals, rollback records | Integrity evidence | GitHub/Control Center | immutable references, review, no secrets |
| Error/uptime events | Operational telemetry | Sentry/Better Stack later | redact URLs/payloads, no workspace content, retention limit |

## Threats and required controls

| Threat | Failure mode | Required mitigation / test |
| --- | --- | --- |
| Account takeover | stolen token or weak session handling exposes workspace | PKCE/session expiry/revocation, secure provider flow, no token in logs, expired-session test |
| IDOR / cross-user access | guessed workspace ID reads another user's measurements | owner foreign key plus deny-by-default RLS; automated allow/deny matrix for every table and operation |
| Privileged-key leak | service key shipped in Vite bundle or CI output | build-time secret scan, allowlist only public client key, fail build on service-key patterns |
| XSS / hostile profile data | profile, flags or comments become executable HTML | escape rendered values, CSP, no raw HTML from user/remote data, hostile-string browser tests |
| CSRF / unsafe mutation | cross-site request changes profile/workspace | provider token policy, same-site protections, explicit mutation origin checks where applicable |
| Lost edits | offline local and remote revisions overwrite silently | revision IDs, compare-before-write, preserved conflict copy, visible resolution; never blind last-write-wins for workspace data |
| Provider outage | login/sync failure blocks drafting or destroys local work | local-first mode, queued opt-in sync, clear offline state, local export/recovery tests |
| Flag tampering | client changes rollout or bypasses authorization | flags only choose UI/compatible behavior; server authorization/RLS independent; remote config signed/validated where used |
| Stale or bad flag | broken redesign reaches all users or cannot roll back | embedded default, TTL/staleness policy, kill switch, expiry owner, V1/V2 compatibility test |
| Supply-chain compromise | dependency or action changes artifact | lockfiles, pinned actions, checksum/manifest, minimal permissions, review and repeatable artifact hash |
| Artifact mismatch | staging-approved build is rebuilt for production | immutable artifact identity, manifest/hash recorded in Control Center, promote exact artifact only |
| Database migration break | blue/green versions disagree on schema | expand → migrate → contract, dual-read/write compatibility tests, rollback rehearsal, no destructive migration in switch |
| Email abuse / enumeration | login endpoint leaks accounts or is abused | generic responses, rate limits, provider abuse controls, no sensitive email content in logs |
| Excessive telemetry | measurements/patterns leave the product boundary | redact request/query bodies, disable session replay by default, review every event schema, retention cap |
| Cost runaway | traffic, email, flags or logs exceed budget | provider spend limits/alerts, quotas, staged rollout, incident owner and shutdown procedure |
| Malicious upload | future file/surface upload becomes code or storage abuse | no upload in P0; later content-type/size/virus/quarantine policy before implementation |
| Deletion failure | account deletion leaves workspace or backup copies unexpectedly | documented retention map, deletion job/evidence, export-before-delete and restore-boundary test |

## Identity and workspace rules

- Guest/local use is the default until the user explicitly requests cloud sync.
- The first-run welcome page explains local versus cloud persistence before
  login. It does not imply a login is required to draft or export.
- A profile row is keyed by the provider user ID, not email text. Email change
  and deletion follow the provider's verified identity flow.
- A workspace row is owned by exactly one user in P0. Sharing, teams and
  multi-user collaboration are P2 and require a new threat model.
- Cloud sync uses an explicit workspace revision and client origin. A stale
  write is rejected or preserved as a conflict; it is never silently accepted.
- Export and deletion are user-visible operations. Deleting an account must
  define provider backups, email logs, error events and local caches separately.
- Body measurements are not used for analytics, personalization experiments or
  feature-flag audience selection in P0.

## Release and incident controls

- `main` is protected; changes arrive through reviewed commits and required
  gates. Preview, staging and production aliases point to immutable artifacts.
- A two-week Tuesday train uses a one-week scope cut and two-business-day code
  freeze. Security, outage, data-loss and user-blocking defects use an
  expedited patch record with focused tests and a rollback target.
- Blue and Green production aliases share production data only through
  transition-safe schemas. An inactive slot is never used as a long-lived
  incompatible development branch.
- The previous healthy artifact stays available until the new release has
  passed smoke, health, error-rate and user-journey checks.
- Incident evidence records detection time, affected artifact/flag, user/data
  impact, mitigation, rollback, root cause, follow-up and reviewer. Secrets and
  workspace payloads never enter the incident record.

## Retention and deletion questions

These are future launch product/legal decisions required before Slice
175/provider implementation or any collection of personal data:

1. Entity/jurisdiction, privacy notice, terms, support contact and applicable
   age/consent policy — maintainer/legal.
2. Whether body measurements are treated as sensitive personal data in the
   intended launch jurisdictions — maintainer/legal.
3. Default cloud-sync retention, backup retention and deletion completion
   evidence — maintainer/product.
4. Required data region and subprocessor approvals — maintainer/legal.
5. Whether an anonymous share link is ever allowed — product/security; default
   is no.
6. Auth methods for P0 (email magic link/passwordless only, or password/OAuth)
   — product/security; default is the smallest tested method.

Until these decisions are recorded, launch-backed development may not add
provider or personal-data behavior. Repository-local, provider-neutral work,
the local Control Center and the approved static artifact proof may continue
under the current launch-cost hold.
