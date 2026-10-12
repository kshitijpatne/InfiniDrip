# Slice 751 — merge, automatic deployment, and live closeout

Started 2026-10-12 03:52 UTC on `codex/uiq06-admission` after S750 commit
`1c0cca2861b6a37eb3195746f5fbce7d2f067f34` was pushed. Pull request #31 is
open at <https://github.com/kshitijpatne/InfiniDrip/pull/31>, targets `main`,
and GitHub reports it mergeable. GitHub reports no configured branch checks;
S750's full local release evidence is digest-bound on the canonical board.
The branch contains the complete admitted S744–S750 work based on
`origin/main` `7923a7f4323d713b069817adfd7626f19c7b48f5`.

The repository workflow `.github/workflows/pages-deployment.yml` deploys only
on pushes to `main` (or manual dispatch). A merge should trigger its full test,
production build, deterministic web-manifest/proof checks, and Cloudflare Pages
deployment to project `infinidrip-preview`, branch `main`. It must finish
successfully before any live acceptance claim.

## S751 gates

1. Refresh refs and PR; verify #31 still contains the reviewed head, has no
   unexpected files/commits, and is based on current `main`. Reconfirm only the
   scoped UIQ-06 files are included; unrelated EPIC-17 S425 working artifacts
   remain excluded.
2. Reconcile any PR comments/checks. Codex is the independent final reviewer;
   preserve all S750 gates and the export byte-identity baseline. Merge without
   squashing/rewrite so each numbered slice remains identifiable.
3. Verify the merge commit is on `origin/main`, then wait for the main-only
   Cloudflare Pages workflow to complete successfully. Record the run ID,
   commit, deployment and stable URL.
4. Test the deployed stable URL at desktop, tablet and narrow widths; check
   the changed Nesting/project/recovery presentations, keyboard/focus and
   reduced-motion/forced-color behavior, no horizontal overflow, no page
   errors, and zero off-origin requests. Confirm the current shared site loads
   the merged artifact and does not claim physical fit.
5. Write hash-bound S751 live evidence, use the validated Control Center
   command layer to close UIQ-06 only after every gate passes, update
   `PROJECT-STATE.md`, `CONTEXT-INDEX.md`, `ARCHITECTURE.md` and the goal ledger,
   then run the Control Center suite after final board replay.

No further feature/source changes, deploy credentials changes, history rewrite,
unrelated EPIC work, UIQ-07 admission, or export-baseline change is in scope.
If deployment or live checks fail, preserve exact evidence, diagnose and fix
only within UIQ-06; rerun affected checks and the settled release gate after
any source/test/config/dependency change. Keep the board and goal In Progress
until the deployed behavior and validated closeout are confirmed.
