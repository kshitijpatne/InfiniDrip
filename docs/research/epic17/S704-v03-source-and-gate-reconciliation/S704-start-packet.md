# EPIC-17 / G04 V03 — S704 source and gate reconciliation

## Verified start and purpose

- Start: 2026-10-11 00:17:34 UTC; branch `codex/epic-17-g04`.
- Start commit: S703 `4914366c`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S703 is highest; S704 is the next unique slice.
- Canonical board revision 4144: EPIC-17 In Progress, G04-V03 Blocked, V01/V02 Done.
- S703 unintentionally truncated the historical tail of `CONTEXT-INDEX.md` and `PROJECT-STATE.md`. This slice restores both full files from exact S702 commit `f06e9691b8ccb5c7ea8b3e0fb3c0e9a21e4dd61a`, then prepends verified S703 state while preserving all history. Do not rewrite the already landed S703 commit.

## Scope

1. Restore full historical context/state from S702 and add only the verified S703 current boundary.
2. Reconcile each unchanged V03 gate against the actual S700 source, S700/S703 returns, S686/S696/S701 plans and findings, existing DGS/GMS/LibreCAD/OpenCAD/CLO evidence, and the current opt-in DXF writer.
3. Group the remaining failures by cause and identify any concrete source-side correction that can be justified from code and saved return evidence. Define one decisive verification per group and a stop condition. No CAD mode/app/receiver trials, entity encoding sweep, standards-conformance claim, acceptance change, or code implementation in this reconciliation slice.
4. Record the full next implementation plan with bounded slice groups, all-seven/options/grades scope, fixed tolerances, legacy-output identities, final gates, and cleanup inventory boundary.

## Acceptance and exit gates

- Both restored history-bearing documents match S702 content plus the S703 current-state entry; no prior records are dropped.
- V03 matrix labels each gate passed/failed/unproven, strongest evidence, shared cause, and exact proof/change still needed.
- Plan prioritizes repeated measurable causes, uses current fixtures, and explains why each source-side correction is expected to address named failures without weakening a fixed threshold.
- If the current source cannot support a safe correction, record the specific missing technical fact and a concrete bounded path that does not repeat already failed external tests.
- Control Center suite, diff check, validated board closeout; no product-code gate unless code changes are separately authorized by evidence and added to a later slice.
- Preserve all V03/all-seven requirements, protected export identities, no fit/factory/production-readiness claims. Keep goal active. Cleanup is inventoried only here; do not delete files in this slice.

## Non-goals and delegation

No new app/software, receiver/profile, CAD operation, purchase, scope relaxation, physical sample, supplier, broad UI work, history rewrite, or cleanup deletion. No safe disjoint delegation is needed for a single integrated source/gate reconciliation. Codex owns the source audit and final plan.

## Timing fields

Implementation: pending. Focused verification: pending. External wait: 0m planned. Maintainer-decision time: 0m. Start 00:17:34 UTC. Record actual durations at closeout.
