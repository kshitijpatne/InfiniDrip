# EPIC-17 / G04 — S727 integrated release gate

## Start and verified repository state

- Started: 2026-10-11 07:00:41 UTC.
- Branch: `codex/epic-17-g04`; HEAD: `672332e90943fc21cb19aea7f5c58c084048a688` (S726).
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it is an ancestor of HEAD.
- S726 is the latest unique landed slice; reserve S727. Board revision at reservation: 4245.
- Board: S726 landed evidence recorded at revision 4246; S727 start evidence and current Epic/V03 summary reconciled through revision 4251.
- Initial tracked working tree is clean. Two unrelated, untracked S700 coverage diagnostic text files remain preserved and unstaged; inspect and remove only during the authorized final cleanup if not required by the product or tests.
- Usage preflight: ordinary usage allowed; primary 49% used, weekly 8% used.
- Goal remains active through verified implementation, cleanup, merge, and production E2E.

## Objective

Run the settled EPIC-17 candidate through its final repository and release gates, reconcile current records to the S726 acceptance correction, review the final generated/rendered outputs, remove only nonessential repository artifacts at the final cleanup point, and complete the authorized PR merge, ancestry and deployment checks.

## Scope and unchanged acceptance

- V01 and V02 stay Done based on existing source-bound and rendered evidence; V03 technical acceptance is complete under the explicit S726 source-breadth/receiver-structure sampling rule. The receiver claim is limited to LibreCAD 2.2.1.5 / Drawing Exchange DXF 2000 and the exact 11 saved/reopened/audited/reviewed fixtures. Do not call LibreCAD industrial or standards-conformant and do not claim all 315 normalized shapes were receiver-round-tripped.
- Retain seven recipes, all 73 supported options across five sizes (365 source packages), the 0.001 cm selected-return geometry threshold, units, identity/relationships, CUT/SEW and typed construction marks, readability, semantic repeat evidence, product-side malformed-input rejection, legacy DXF behavior and protected export byte identities.
- Final gates: full repository tests with 100% global statement/branch/function/line coverage; integrated build; required browser/Electron checks; exact final output replay/review; clean minimal staged tree; PR review; safe merge to origin/main; refreshed ancestry; required automatic GitHub Actions deployment; production HTTP and application E2E.
- If a source/test/config/dependency change is needed after any passing full gate, run affected focused checks and rerun the full gate on the settled candidate. Do not alter thresholds or baselines.

## Non-goals and material risks

No new CAD software, formats, settings, app trials, app purchase, supplier contact, V02 design expansion, new recipe, physical sampling, fit/factory/standards/production-readiness claim, launch spending, hosted service, or protected export baseline change. The S700 diagnostics are not product files; preserve outside the repo if needed for traceability, otherwise exclude from the final candidate. Do not delete any tracked artifact without verifying its role and staged diff.

## Independent work and timing

No safe independent task exists: this is a shared integrated release candidate with one owner for final verification, cleanup, PR and merge. Keep execution in Codex. Record implementation/reconciliation, focused verification, full gates, waits and maintainer-decision time separately in the exit packet.

## Slice boundary rule

At this numbered slice boundary, record the actual result and one next action even when an integrated release gate fails. The Epic and goal remain In Progress until every listed completion gate passes. If a gate exposes a reproducible source or test-contract defect, assign its correction the next unique slice, run focused checks first, then rerun the integrated gate on the settled candidate. Do not describe a failed gate as Epic completion.
