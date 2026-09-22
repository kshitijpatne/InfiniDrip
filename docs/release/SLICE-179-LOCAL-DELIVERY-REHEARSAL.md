# Slice 179 — local delivery and rollback rehearsal

Status: **complete as a repository-local, provider-neutral rehearsal**.

This record covers the no-cost Slice 179 boundary around the existing static
Vite preview. It does not create or operate a hosting alias, account, database,
domain, monitoring service, auth provider or personal-data path. The existing
URL-only Cloudflare Pages preview remains the only approved external exception;
this slice adds no provider mutation.

## Candidate contract

`ops/web/release-rehearsal.mjs` treats a candidate as an immutable source
identity plus a deterministic artifact identity and explicit observed checks:

- `candidateId` is a Git commit identity or safe repository ref;
- `manifestDigest` is a stable SHA-256 over the complete artifact manifest;
- `checks` must explicitly contain boolean `tests`, `build`, `manifest` and
  `smoke` results;
- `approval` must contain a reviewer and canonical ISO timestamp;
- `previousKnownGood` is accepted only when its identity, digest, approval and
  required checks are valid.

The helper never runs a provider operation. A candidate is `promotable` only
when every check and approval is valid. A smoke-only failure is `rolled-back`
to the supplied, fully validated previous candidate; malformed candidates,
missing checks, failed non-smoke checks and invalid rollback targets are
`rejected`. No result silently changes a ref or an external alias.

## Deterministic rehearsal fixture

The following fixed record exercises the failed-smoke path. The commit IDs are
existing repository identities, and the artifact digest is for the small
manifest fixture used by the focused tests. This is contract evidence, not a
claim that either commit was deployed.

```json
{
  "schemaVersion": 1,
  "candidateId": "4b9e393",
  "manifestDigest": "c32903622ada18a1109b48b2104d773242aa9ee85a34f82167039bb483aa8458",
  "checks": { "tests": true, "build": true, "manifest": true, "smoke": false },
  "approval": { "reviewer": "Codex", "timestamp": "2026-09-22T14:00:00.000Z" },
  "previousKnownGood": {
    "candidateId": "52b36a6",
    "manifestDigest": "c32903622ada18a1109b48b2104d773242aa9ee85a34f82167039bb483aa8458",
    "checks": { "tests": true, "build": true, "manifest": true, "smoke": true },
    "approval": { "reviewer": "Codex", "timestamp": "2026-09-22T13:00:00.000Z" }
  }
}
```

Expected result: `status: "rolled-back"`, `selectedCandidate.candidateId:
"52b36a6"`, and `operation: "none"`. The Control Center evidence entry points
to this record and its evidence-file SHA-256; the board does not infer status
from the fixture or from chronology.

## Freeze checklist

Before a local candidate may be recorded as promotable, the reviewer records:

1. The source commit identity and whole-manifest digest.
2. Explicit results for tests, TypeScript/build, manifest generation and local
   HTTP smoke; absent results are failures, not unknown passes.
3. A reviewer and timestamp in the candidate record.
4. A complete previous-known-good record before any smoke rehearsal.
5. No new provider, secret, account, cost, domain, database or personal-data
   behavior in the diff.
6. The Control Center evidence URI and evidence-file SHA-256.

The existing GitHub Actions workflow remains the repository's already-approved
free delivery check. GitHub branch protection and required-check settings are
host configuration, not repository files, and were not changed by this slice.
No CODEOWNERS file is invented without an explicit maintainer ownership map.

## Smoke and incident matrix

| Local observation | Required result | Evidence/fallback |
| --- | --- | --- |
| Test, build or manifest gate is missing/false | Reject candidate | Preserve the failed record; do not mark promotable |
| Local HTTP smoke is false and all other candidate fields are valid | Select previous known-good | Return `rolled-back` with `operation: "none"` |
| Rollback target is missing, malformed or failed | Reject candidate | Stop; do not fabricate a fallback |
| A local preview defect is found after freeze | Patch from a new commit, rerun all gates and obtain a new approval | Keep the prior known-good record unchanged |
| A P0 local delivery defect needs an out-of-band patch | Record the failure and focused patch evidence, then repeat the same rehearsal | No hosted alert, alias switch or incident service is implied |

## Future migration placeholder

No SQL, database schema, auth/profile record or migration is introduced here.
When launch work is explicitly reopened, future database changes must use the
previously recorded expand → migrate → contract sequence with separate
compatibility, ownership, privacy and rollback evidence. Until then, migration
work is deferred and cannot be marked passed by this local rehearsal.

## Verification boundary

Verified locally on 2026-09-22:

- `npm run web:release:test`: 10/10 tests passed;
- `npm run web:proof:test`: 2/2 tests passed;
- `npm run control-center:test`: 7/7 tests passed;
- `npm test`: 105 files / 1,421 tests passed;
- `npm run coverage`: 105 files / 1,421 tests passed at 100% statements,
  branches, functions and lines;
- `npm run build`: strict TypeScript and the Vite production build passed.

No authenticated-beta, public-production or physical-fit claim follows from
this record.
