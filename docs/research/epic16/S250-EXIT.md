# Slice 250 — explicit grade-plan record and review exit

**Status:** Complete; M03 remains in progress for Slice 251.
**Date:** 2026-09-27.
**Base:** Slice 249, `717af40`.
**Scope:** Strict custom-style grade-plan record, scoped persistence, review and
approval lifecycle, base-revision binding, stale-state visibility, and
project-package compatibility. The approved plan is not a generated or
validated graded run.

## Delivered behavior

- Custom one-size styles can author and persist a versioned grade plan with an
  explicit population/source or product-defined digital basis, declared range,
  base size and revision, per-size measurement/POM/control targets, explicit
  exceptions, and review history.
- Parsing rejects unsupported or incomplete data. Approval is an explicit
  action. Changes to the plan or bound design inputs invalidate the approval;
  stale or invalid state remains visible.
- The plan is scoped to its custom style, survives reload and portable
  full-project backup/import, and does not change legacy SaveFile v1–v6
  identity or legacy style grading behavior.
- Custom whole-run outputs remain withheld even after plan approval. Slice 251
  owns graded drafting, POM/cutting reconciliation, output diffs, and enabling
  graded artifacts after those checks pass.

## Verification

- `npm test -- --reporter=dot --maxWorkers=2 --minWorkers=1` — 131 test files;
  1,984 tests passed.
- `npm run coverage -- --reporter=dot --maxWorkers=2 --minWorkers=1
  --coverage.reportsDirectory=tmp/epic16-s250-coverage-final2` — passed the
  repository's 100% statement, branch, function, and line thresholds. Parsed
  report totals: 23,290/23,290 statements, 10,482/10,482 branches, and
  1,422/1,422 functions. The command also reported complete line coverage.
- `npm run build` — TypeScript and production Vite build passed. Vite emitted
  its existing large-chunk advisory.
- `npm run electron:build-main` — passed.
- `npm run control-center:test` — 33 passed.
- Production browser workflow on the isolated `localhost:4177` preview
  created a custom Tee, authored all 51 required size targets, reviewed and
  approved the plan, reloaded it, confirmed one-size behavior and continued
  withholding of whole-run outputs, then edited the plan back to draft and
  confirmed approval invalidation and refresh behavior. The user's
  `localhost:4173` browser tab was not used.
- Claude Code Opus 5.5 High and OpenCode Muse Spark 1.3 Xhigh completed
  disjoint read-only audits and returned `WORK FINISHED`. Codex reconciled both
  against source and admission; their evidence is recorded in
  `S250-GRADE-PLAN-DECISION-RECONCILIATION.md`.
- Protected legacy export identity checks passed as part of the verified
  repository suite; no export baseline was moved.

## Boundary and remaining work

Plan approval records user review of the authored rule only. It does not
qualify fit, validate drafted geometry, establish standards compliance, or
authorize physical production. Existing style behavior and protected export
bytes remain unchanged. Continue with Slice 251, integrating only approved
plans into per-size drafting and output after geometry, POM targets, cutting
quantities, exceptions, and stale/invalid conditions reconcile. Keep the
whole-run Tech Pack, Projector, Marker, and frozen-output gates closed until
Slice 251 proves them safe.
