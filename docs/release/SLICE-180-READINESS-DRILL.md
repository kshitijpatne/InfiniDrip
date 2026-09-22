# Slice 180 — provider-neutral readiness dry-run

Status: **complete as a synthetic, local-only preview drill**.

This slice records failure and recovery semantics without running a provider,
monitoring service, backup service, auth flow, email sender, database, alert or
real user workspace. The fixture is deterministic and contains no timestamps,
secrets, personal measurements or personal workspace contents. It cannot claim
authenticated-beta or production readiness.

## Contract and result

`ops/readiness/readiness-drill.mjs` requires exactly eight scenario IDs. Every
scenario carries an owner, runbook, fallback and evidence string. The six
repository/local scenarios may be `passed` or `failed`; the two provider-backed
scenarios are structurally required to remain `deferred` and can never be
counted as passed. The summary is always `overallState: "preview-only"` and
explicitly returns `authenticatedBetaReady: false` and `productionReady: false`.

The focused fixture result is:

```json
{
  "overallState": "preview-only",
  "localPassed": 6,
  "localFailed": 0,
  "providerDeferred": 2,
  "authenticatedBetaReady": false,
  "productionReady": false
}
```

## Scenario matrix

| Scenario | Scope/result | Owner | Runbook | Fallback/evidence |
| --- | --- | --- | --- | --- |
| `static-preview-outage` | local / passed | preview-operator | Serve the retained static artifact locally and inspect the noindex response | Retained local artifact; synthetic response and artifact inspection |
| `artifact-rollback` | local / passed | release-reviewer | Select the validated prior artifact through Slice 179's local rehearsal contract | Keep the prior known-good candidate; no provider operation |
| `local-save-backup-restore` | local / passed | workspace-operator | Export a synthetic local workspace copy, clear that synthetic copy, then restore it | Retain the synthetic export until restore verification; no user content |
| `stale-feature-flag` | local / passed | feature-owner | Evaluate a throwaway flag definition with stale metadata | Embedded safe default and readiness-only diagnostic; real catalog is untouched |
| `malformed-input` | local / passed | input-owner | Submit a malformed synthetic record to strict validation | Reject it and retain the last valid local state |
| `local-export-and-delete` | local / passed | local-data-owner | Verify a synthetic export, then remove the synthetic local copy | Keep the verified export until removal is confirmed; no hosted deletion claim |
| `hosted-provider-unavailable` | provider / deferred | launch-owner | Reopen only after launch readiness authorizes a provider outage exercise | Continue local-first drafting/save/export; no provider contact |
| `hosted-data-deletion` | provider / deferred | launch-owner | Reopen only after hosted deletion policy and provider operations are authorized | Keep data local; no hosted data exists in this drill |

The local export/delete row is intentionally limited to a synthetic fixture
copy. The current product has local export/download and recovery-clear paths,
but it does not have an in-app primary saved-workspace deletion affordance;
therefore this record does not imply that hosted deletion or a user-data
deletion flow was implemented or tested. Both hosted deletion and provider
outage exercise remain deferred.

The stale-flag scenario uses a throwaway definition passed to the existing
pure evaluator. It must not edit `FEATURE_FLAGS`, change the `polo_v2` record,
or create a live switch.

## Safety and evidence rules

- `validateReadinessDrill()` rejects missing, unknown or duplicate scenarios,
  missing owner/runbook/fallback/evidence, local failures marked as passed,
  provider scenarios marked as passed, secret-like strings and strings that
  contain personal measurement values.
- The fixture contains no real workspace, body measurement, auth identifier,
  access token, API key or provider response. Any future fixture that needs
  data must use a non-personal synthetic constant and remain outside runtime
  persistence.
- Slice 179's local artifact identity/rollback mechanism is referenced rather
  than repeated as a provider operation. No external alias or branch setting is
  changed.
- Provider-backed outage, hosted data deletion, monitoring, backup/restore,
  auth-abuse, rate-limit, email, cost-alert and production uptime checks are
  deferred and are not converted into local passes.

## Verification boundary

Verified locally on 2026-09-22:

- `npm run readiness:drill:test`: 5/5 tests passed;
- `npm run control-center:test`: 7/7 tests passed with Slice 180 Closed and
  provider-backed scenarios still deferred;
- `npm run web:release:test`: 10/10 tests passed;
- `npm run web:proof:test`: 2/2 tests passed;
- `npm run build`: strict TypeScript and the Vite production build passed;
- the fixture validates all eight required scenario IDs;
- the provider-backed scenarios remain deferred under mutation tests;
- malformed, duplicate, missing, secret-like and personal-measurement records
  are rejected;
- the summary remains deterministic and preview-only.

The parent Slice 179 commit `eb7a475` already passed the full 105-file /
1,421-test and 100%-coverage gate, and this slice changes no `src/`, Electron,
geometry or export path. The full application and coverage gates will be
re-run at the Slice 181 no-cost exit. No garment, Epic 8, database, auth,
provider, monitoring or personal-data behavior changed.
