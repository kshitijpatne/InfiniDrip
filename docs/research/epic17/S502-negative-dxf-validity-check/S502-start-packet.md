# EPIC-17 / G04 V03 — Slice 502 malformed-DXF control validity check

## Verified start

Started `2026-10-08 15:06:03 UTC` from clean S501
`5e75eb9428356532b85e71f41b07c03c6484e96f` on `codex/epic-17-g04`;
refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
ancestor. S501 is highest; S502 is reserved. Board revision 3119 has EPIC-17
and G04-V03 In Progress, V01/V02 Done. Goal remains active; primary usage 17%,
weekly 40%.

## Scope

Review S463's exact negative-fixture generator, verifier, fixture bytes, and
S498 CLO handling to determine exactly which DXF structural rule is violated.
The mutation replaces terminal `0/EOF` with a terminal unmatched group code
`0`; prior S498 wording that said the marker was merely missing is incomplete
and will be corrected in this slice. Check authoritative Autodesk DXF/R12
documentation for the relevant group-code/value and file terminator rules.
Distinguish a standards-backed invalid-file fact from parser tolerance; avoid
assuming that an importer must reject every trailing-data condition unless the
documented profile and fixture's invalidity support that expectation.

Record whether the S498 observation is a valid negative-control failure under
the unchanged S463 rule (“reject or explicitly report one group code with no
value”). Do not modify S463 or S498 history, fixture bytes, importer, profile,
V03 gates, or acceptance thresholds; add a correction/reconciliation record.
No CLO launch is planned while the UI helper cannot target its window.

## Gates

1. Verify fixture bytes/hash, pair count, terminal lines, and exact one-line
   mutation against the valid Tee M fixture.
2. Use authoritative primary format documentation; if it does not explicitly
   settle the R12 edge case, label the remaining interpretation as unresolved.
3. Reconcile S498 wording with S463's exact criterion and recorded no-dialog
   rendered import. Preserve all other V03 holds; no broad compatibility claim.

This documentation/evidence slice needs the targeted file/standard comparison,
Control Center validation, and `git diff --check`; no full repo gate applies.

**First action:** inspect Autodesk's primary DXF structure/reference pages for
R12 group pairs and EOF, then record exact source links and limitations.
