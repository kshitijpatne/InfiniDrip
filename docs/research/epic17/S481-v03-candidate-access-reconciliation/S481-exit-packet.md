# EPIC-17 / G04 V03 — Receiver candidate and access reconciliation — Slice 481 exit

## Finding

S481 reconciled the existing S465–S480 candidate work with the current C04
CAD acceptance boundary. None of the reviewed candidates presently satisfies
the exact receiver/version, rights, local-processing, apparel import/export,
representative round-trip, size/grade, and malformed-input gates. Details and
evidence classes are in `S481-candidate-matrix.md`.

The strongest remaining documented lead is Richpeace Garment CAD V8.0 Free
Version-English. The vendor describes it as a full-function evaluation copy;
the V8 manual linked from that product entry documents apparel AAMA/ASTM import
and ASTM export. The official page lists Windows XP/7/8/10, while this host is
Windows 11 25H2; evaluation terms, local-only handling, exact-build menus, and
actual fixture behavior remain unproven. No installer was run. The other
principal options remain disqualified or incomplete: CLO by S479's rights
hold; Pixie Space by its under-construction state, absent license evidence,
retired D-6959 menu label and missing grading; GetonAgain by free-build rights,
cloud/local uncertainty and profile parity; Seamly2D for lacking import;
OpenMarker for lacking export and production readiness; garment.dev for hosted
patterns; Open Patterns for its S480 parse failure and absence of a writer.

**Next action:** proceed only after explicit approval for a normal Richpeace V8
Free English installation attempt on this Windows 11 host, or access is
provided to an already installed rights-cleared industrial receiver on a
supported OS. Inspect displayed terms, local handling and exact modes before
opening any fixture. Stop on any mismatch; do not use compatibility workarounds
or a hosted service. The S463 separate-size files do not prove native grading.

If no receiver/access is approved and available, V03 remains blocked on that
external receiver-rights/access dependency. It cannot be cleared by internal
DXF testing alone. This is not a proposal to weaken the V03 acceptance.

## Scope and status

- V01 and all-seven V02 remain accepted as recorded at S459; V03 remains In
  Progress. Receiver/profile/round-trip, all-seven recipe criterion, legacy
  DXF behavior, protected byte identities, negative handling and grade
  evidence are unchanged.
- No app was installed, no account or license was accepted, no fixture was
  opened or uploaded, no supplier was contacted, and no product code/output
  changed. CLO remains closed. All files used for receiver exchange stay in
  `C:\G04-CLO-DXF-Exchange`.
- Refreshed official OpenMarker README still marks the app not production-ready
  and export as planned. The exact official Richpeace V8 page continues to
  label the build an evaluation copy and list only Windows XP/7/8/10. These
  publisher statements do not by themselves settle rights or host behavior.

## Verification and boundary

- Candidate/status matrix checked against S465–S480 source packets, S469's
  controlled trial runbook, and C04's exact CAD profile/round-trip acceptance
  section. Windows app inventory shows CLO closed and no other named apparel
  receiver running/available.
- Board start replay `2975→2979`; validated exit replay `2979→2983`. EPIC-17
  and G04-V03 remain In Progress; V01/V02 remain Done.
- `npm run control-center:test`: 42/42 passed at start and exit;
  `git diff --check` passes. Documentation/evidence only; full repository
  coverage/build/render/output gate remains for the settled integrated
  Epic/PR candidate.
- Goal record inspected at prior safe boundary: status `active` and objective
  exactly matches the current admitted objective. It is not stale; no manual
  resume or goal edit is needed.

## Sources

- Richpeace, [V8.0 Free Version-English product page](https://www.richpeace.com/garment_cad-show-443.html), checked 2026-10-08: full-function evaluation copy; Windows XP/7/8/10.
- Richpeace, [V8 user manual](https://www.richpeace.com/uploadfile/202210/5085cf1486261f.pdf), linked from the free V8 entry; import AAMA/ASTM and export ASTM instructions, not proof of use rights or observed behavior.
- OpenMarker, [official repository and current README](https://github.com/Weilei424/openmarker), checked 2026-10-08: local/offline project; import implemented, app not production-ready, export planned.
- Remaining candidate claims and sources are retained in S465–S471; CLO rights in S479; Open Patterns runtime in S480. No general sources were repeated.

Started `2026-10-08 07:56:44 UTC` from S480 commit `6dc1cab`; refreshed
`origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
S480 was highest; S481 is unique.

Elapsed accounting (approximate, total 5m20s): product implementation 0m;
focused candidate/source/access review 3m; durable record, board and focused
verification 2m20s; external-agent waits 0m; maintainer-decision time 0m. No
production test or full gate is due.
