# EPIC-17 / G04 S493 evidence packet hygiene — Slice 494 start

## Scope

Correct the two S493 packet files' extra blank line at EOF and reconcile the
durable verification statement with the actual staged diff check. Keep S493's
slice identity and committed history intact. No product code, CAD fixture,
receiver/profile, acceptance threshold, evidence result, board status, or
export identity changes.

## Verified start

- Started `2026-10-08 13:50:04 UTC` from clean S493 commit
  `96075a88b152313955eb11e0eae8616569f69a61` on `codex/epic-17-g04`.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S493 is highest; S494 is unique.
- Canonical board revision 3071; EPIC-17 and G04-V03 remain In Progress,
  V01/V02 Done. The goal remains active.
- The actual staged `git diff --check` reported one extra blank line at EOF
  in each new S493 start/exit packet. The earlier unstaged check could not
  inspect those still-untracked files; S493's recorded clean-check statement
  was therefore premature.

## Exit gates

1. Normalize only the two S493 packet EOFs and correct their verification
   statement to retain the diagnostic accurately.
2. Keep all S493 measurements and V03 decisions unchanged.
3. Run staged `git diff --check`, the focused Control Center suite, packet
   script syntax checks, and final staged-diff review.
4. Record the correction in project state, admission history, and the
   validated Control Center command layer. Preserve all G04 statuses.

## Ownership and next action

Codex owns this narrow documentation follow-up. No safe independent delegated
work exists. Next remains S493's exact V03 dependency: obtain permitted use
and local-handling evidence for an exact receiver/build before further
receiver fixture transfers.
