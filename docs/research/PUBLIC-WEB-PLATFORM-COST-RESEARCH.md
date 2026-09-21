# Public Web Platform and Delivery Governance — Cost Research

Status: **research and recommendation only — no provider account, purchase,
deployment, application code, or current product decision is authorized by this
record.**

Last checked: 2026-09-21. Currency: USD, before tax unless stated otherwise.

## Purpose and current boundary

InfiniDrip is currently a local-first Vite/TypeScript drafting application with
an Electron shell and local workspace persistence. Epic 11 is in progress and
must remain isolated from this work. It is not currently a hosted account
product. Existing first-run journey copy is local tutorial state, not account
onboarding.

This packet records the researched route to a public, globally reachable web
application with authenticated profiles, cross-device workspace sync, reversible
feature releases, blue/green delivery, and a local delivery-control board. It
does not alter the pure drafting/export contracts, the eight protected legacy
hashes, or the honesty boundary around physical fit.

## Recommended initial stack

| Need | Recommendation | Why | Deferred alternative |
| --- | --- | --- | --- |
| Domain/DNS | Cloudflare Registrar and DNS | at-cost annual registration, WHOIS redaction, DNSSEC and no renewal markup | another registrar only if the desired TLD is unsupported |
| Public web host | Vercel Pro | immutable previews, controlled promotion/rollback, skew protection and rolling releases make the requested blue/green operation practical | Cloudflare Pages is excellent for low-cost static delivery but needs more owned release orchestration for the same rollout controls |
| User identity/data | Supabase Auth + Postgres, separate staging and production projects | familiar Vite client, Auth, RLS, migration history and private user rows in one service | Firebase is viable but changes the relational/data-policy model without a compensating need |
| Auth email | Resend, through Supabase custom SMTP | branded transactional delivery; free tier covers a small pilot | Supabase's default mail only for non-critical development testing |
| Feature flags | owned flag interface backed by Supabase configuration; offline default embedded in the client | no new paid vendor, per-user/global rollout and an independently testable fallback | PostHog only if product analytics/experiments become a deliberate later need; never Unleash Cloud at current scale |
| Error/uptime | Sentry Developer initially + Better Stack Free | separate error and external-uptime signals without early spend | Sentry Team when multiple responders/integrations need access |
| Delivery board | repo-local Control Center: versioned JSON/Markdown source plus local UI | no seat tax, no operational data vendor, agents can update it atomically with slice work | optional GitHub Projects overlay; Jira is not needed |

## Cost model

The numbers below are a planning envelope, not invoices. The selected domain,
traffic, log volume, screenshot/replay policy, deployment count, tax, and paid
seats determine the actual bill. Agent/model subscriptions and engineering or
legal labour are deliberately excluded because they are not priced by these
providers and must not be invented.

| Stage | Required services and assumptions | Monthly recurring | Annual / one-time | Notes |
| --- | --- | ---: | ---: | --- |
| A — private planning/development | GitHub Free; no public commercial URL; local board; Sentry/Better Stack free; Supabase Free only for a disposable development proof | $0 | $0 | Supabase Free may pause after one inactive week. Vercel Hobby is non-commercial only, so it is not a public-beta option. |
| A+ — protected private workflow | GitHub Team, one maintainer seat, for protected branches/CODEOWNERS on a private repository | $4 | $0 | Recommended as soon as multiple agents or reviewers regularly contribute. |
| B — public web preview, no account sync | GitHub Team $4 + Vercel Pro $20; free monitoring; a standard domain | $24 | approximately $8–$15/year for a non-premium domain | This publishes a stable V1 app but does not meet cross-device profile requirements. |
| C — authenticated public beta, recommended minimum | Stage B + Supabase Pro $25, with production Micro covered by its included $10 compute credit and an additional staging Micro at $10; Resend/Sentry/Better Stack free tiers | **about $59** | domain above | The $35 Supabase line keeps two active environments rather than accepting a paused staging database. |
| D — 1,000 MAU, realistic operated service | Stage C + Sentry Team $26 for shared alerts; otherwise same low-volume traffic, flag and email assumptions | **about $85** | domain above | Add Better Stack Responder only when telephone/SMS on-call is actually required: $29/month on annual billing ($34 monthly), taking this to about $114/month. |

### Included-usage assumptions at Stage D

- 1,000 MAU is far below Supabase Pro's 100,000 included MAU; its cost is
  driven by always-on production/staging and backup posture, not users.
- PostHog is not necessary for flags. If later adopted, its first 1 million
  feature-flag evaluations/month are free. Cache remote flags and evaluate
  only on app start/session refresh; do not poll each render.
- Resend's free tier permits 3,000 emails/month but has a 100/day ceiling.
  At public invitation spikes or sustained user growth, use Pro: $20/month for
  50,000 emails, then $0.90 per additional 1,000.
- Sentry Developer is one-user and 5,000 errors/month. Move to Team only for
  more maintainers, integration needs, or sustained volume.
- Vercel Pro pricing includes a $20 flexible usage credit; transfer, edge,
  function and image use beyond entitlement are variable. Set spending limits
  and alerts before accepting public traffic.

## Per-service options and cost rationale

| Service | Best choice at this stage | Price/limit checked | Do not choose yet because |
| --- | --- | --- | --- |
| GitHub governance | Team | $4/user/month; 3,000 private Actions minutes | Enterprise at $21/user/month is only justified when private-repo environment required-reviewer/wait-timer controls or enterprise SSO are truly mandatory. |
| GitHub Actions excess | hosted Linux jobs | $0.006/minute after quota; Windows $0.010/minute; macOS $0.062/minute | budget cross-OS desktop release testing separately; standard unit/type/build gates should remain Linux. |
| Vercel | Pro, one paid seat | $20/month plus $20 included usage credit | Hobby is personal/non-commercial; Enterprise and paid protection/SSO add-ons are premature. |
| Cloudflare Pages | alternative only | static requests are unlimited/free; Workers Paid begins at $5/month | it is cheaper for a static-only product, but Vercel Pro better fits approved manual promotion, rollback and progressive-release requirements. |
| Supabase | Pro, two Micro projects | organization Pro $25; extra Micro project $10 after the included credit | Free has a one-week inactivity pause, no automatic backups and no branching; Team starts at $599/month. |
| Feature flags | Supabase-owned config | no incremental cost within the chosen platform envelope | Unleash Cloud begins at $75/seat/month; its self-hosted licensing and operations are disproportionate. |
| Optional analytics/experiments | PostHog | 1M flag requests/month free, then $0.0001/request in the first paid band | do not add it merely for a boolean release flag; it adds event-data governance and vendor dependency. |
| Error monitoring | Sentry Developer → Team | $0 then $26/month annually ($29 monthly) | Business/Enterprise adds cost before the app has a compliance or high-volume need. |
| External uptime | Better Stack Free → Responder | $0 for 10 monitors/heartbeats; $29/month annual per responder | no on-call subscription before someone is genuinely available to respond. |
| Domain | Cloudflare Registrar | at-cost; official current example shows a standard registration at $8.57 and advertised domains start at $7.85 | exact renewal varies by TLD and premium-name status, so validate the exact name before purchase. |

## Desktop-distribution costs — separate from public web

The web plan does not make the existing Electron build publicly distributable.
Epic 9 proves an unsigned Windows x64 unpacked package only.

| Requirement | Recommended route | Cost | Trigger |
| --- | --- | ---: | --- |
| Windows code signing | Microsoft Azure Artifact Signing (formerly Trusted Signing) | $9.99/month for up to 5,000 signatures; $0.005/additional signature | before public Windows installer distribution |
| Windows alternative | DigiCert Code Signing + KeyLocker | currently listed $996/year; EV $1,272/year | use only if a certificate/vendor requirement outweighs Azure's managed-signing route |
| macOS signing/notarization | Apple Developer Program | $99/year | only before a public macOS distribution path is authorized |
| Installer/updater | engineering and verification labour | unquoted | after signed Windows/macOS package contracts are separately scoped |

Microsoft identifies Artifact Signing as its recommended external-Store code
signing service, but signing does not provide instant SmartScreen reputation;
the publisher identity must build history. No signing purchase is authorized by
this packet.

## Delivery, freeze, and blue/green rules

Blue and Green are immutable deployment slots, not diverging branches. `main`
is the one protected source line. Preview environments come from feature
branches; staging is built from the candidate commit; the inactive production
slot receives that same immutable artifact; production traffic switches only
after the release gate passes. The previous healthy slot remains a rollback
target.

Database migrations use expand → migrate → contract. Production Blue and Green
share a database, so both releases must operate against the transition schema.
No destructive migration, RLS weakening, or flag-controlled authorization change
may accompany a traffic switch.

Proposed cadence: a two-week planned feature train, release Tuesday at 2 PM
Eastern; scope cut one week prior; code freeze two business days prior; release
candidate smoke and rollback rehearsal during the freeze. Security, outage,
data-loss and user-blocking defects may use an expedited patch path at any time,
with the same focused evidence, independent approval, deployment record and
rollback target. "Major release" here means a planned feature release, not an
automatic semantic-version major.

Code freeze protects contracts rather than forbidding repairs. Drafting,
exports, persistence, authentication, RLS, feature-flag evaluation and release
workflows become protected surfaces. A change requires named ownership, impact
analysis, relevant full gates, evidence and Codex review. Existing drafting
coverage and export byte-identity gates remain mandatory.

## Feature-flag contract

Flags apply to user-visible rollout boundaries, experiments, kill switches and
reversible redesigns—not every pure helper. Every flag must declare owner,
default, audience, expiry date, OFF behavior, ON behavior, test evidence, and
removal release. Server authorization and RLS never depend on a client flag.

For Polo V2, `polo_v2` initially defaults off for the public audience, can be
enabled for explicit testers, then expanded by cohort. The disabled path uses
Polo V1. The flag does not conceal a migration incompatibility; both paths must
remain save/data compatible throughout its lifetime.

## Local Control Center contract

The proposed no-cost source layout is:

```text
ops/control-center/
  schema/work-item.schema.json
  data/epics/
  data/work-items/
  data/releases/
  data/evidence/
  app/                         # local visual dashboard
```

Each item records IDs, parent Epic/release, opened/target/delivered dates,
priority/risk, owner/contributor/reviewer, dependencies, flag, protected
surfaces, description, acceptance criteria, status history, comments and
immutable evidence references. The state machine is `Draft → Backlog → Ready →
In Progress → In Review → Accepted/Closed`, with `Blocked` and `Reopened`
transitions. A contributor may move work only to `In Review`; Codex as
independent reviewer may close it after verified evidence is attached.

Historic work is imported from actual Git commits and exit reports. Missing
historical evidence is labelled incomplete, never reconstructed or invented.

## Approval gates before implementation

1. Confirm the recommended stack, Stage C budget envelope of about $59/month,
   and an operating ceiling for usage overages.
2. Select and register an actual domain; confirm jurisdiction, entity name,
   privacy notice, terms, retention/deletion policy and support contact.
3. Create a platform-threat-model and database/data-retention execution packet
   before any account or personal-measurement data is collected.
4. Create the Release Governance packet before the first public deployment;
   no direct push may ever release an unreviewed build.
5. Create the Identity/Cloud Workspace packet with migrations, RLS allow/deny
   tests, data export/deletion, conflict semantics and offline fallback.
6. Create the Feature Lifecycle packet before a public Polo V2 rollout.
7. Scope the local Control Center independently; it must not compete with or
   rewrite active Epic 11 work.

## Primary sources

- Cloudflare Registrar: https://www.cloudflare.com/domains/
- Cloudflare Pages pricing: https://developers.cloudflare.com/pages/functions/pricing/
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
- Vercel pricing: https://vercel.com/pricing
- Vercel promotion and rollback: https://vercel.com/docs/cli/alias
- Supabase pricing: https://supabase.com/pricing
- Supabase production checklist: https://supabase.com/docs/guides/deployment/going-into-prod
- GitHub plans: https://github.com/pricing
- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- PostHog pricing: https://posthog.com/services
- Resend pricing: https://resend.com/pricing
- Sentry pricing: https://sentry.io/pricing/
- Better Stack pricing: https://betterstack.com/pricing
- Azure Artifact Signing: https://azure.microsoft.com/en-us/products/artifact-signing
- Windows code-signing options: https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options
- Apple Developer Program: https://developer.apple.com/programs/
