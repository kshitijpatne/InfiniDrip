# EPIC-17 / G04 V03 — DXF header/profile audit — Slice 541 exit

## Result

S541 parsed the raw header of the seven already hash-pinned, second-generation
recipe exports from S498 and S523. Every byte count and SHA-256 matched its
prior fixture evidence. All seven declare `$ACADVER=AC1009`, which Autodesk
maps to AutoCAD R11/R12; none declares `$INSUNITS`. This holds for both
observed UI cohorts: S498's Tee, Polo, and Woven exports were made with CLO's
DXF-ASTM menu option, while S523's Fitted, Tank, Skirt, and Trouser exports
used DXF-AAMA.

The official ASTM D6673-04 listing explicitly says to use the AutoCAD Version
13 DXF specification. Autodesk maps R13 to `AC1012`. Therefore, **if CLO's
DXF-ASTM option is intended to implement D6673-04, these three saved files'
`AC1009` version headers do not meet that version requirement**. This is a
conditional file-version mismatch, not a claim of whole-standard
nonconformance: the CLO menu label does not identify a normative edition or
promise D6673-04, and ASTM lists D6673-10 as withdrawn in 2019. The header
alone cannot settle which CLO-specific dialect was intended or whether another
profile applies.

The four DXF-AAMA files are also `AC1009`, consistent with the historical
AutoCAD R11/R12 AAMA lineage described in S533, but this does not prove
conformance to a current AAMA edition. Missing `$INSUNITS` means units are not
declared in these DXF headers; prior exchange settings and coordinate checks
are separate evidence and do not change that file-level fact.

**Strategic effect:** S541 narrows the route. The seven passing geometry
round-trips cannot establish an industrial CAD profile. Do not advertise
ASTM D6673-04 compatibility from the current DXF-ASTM-labeled cohort. A V03
profile can pass only when its exact edition and file-version requirement are
documented and the receiver emits/accepts that version plus required garment
semantics in the all-seven round trip. No threshold, acceptance criterion,
V02 result, legacy DXF behavior, protected export identity, or claim limit
changed.

## Exact saved-file results

The complete rows, pinned hashes, header values, and source links are in
`C:\\G04-CLO-DXF-Exchange\\S541-dxf-header-profile-audit\\Evidence\\dxf-header-audit.json`
(SHA-256 `e88d31688eb1d8933aaf76521f314cc0517919dbd1d3711a325ff5647456f551`).
All seven have `AC1009`, `$INSUNITS` absent, and their recorded byte counts and
hashes match the prior evidence:

| Recipe | Observed export menu (prior slice) | Header version | Units header |
|---|---|---|---|
| Tee | DXF-ASTM (S498) | `AC1009` / R11-R12 | absent |
| Polo | DXF-ASTM (S498) | `AC1009` / R11-R12 | absent |
| Woven | DXF-ASTM (S498) | `AC1009` / R11-R12 | absent |
| Fitted | DXF-AAMA (S523) | `AC1009` / R11-R12 | absent |
| Tank | DXF-AAMA (S523) | `AC1009` / R11-R12 | absent |
| Skirt | DXF-AAMA (S523) | `AC1009` / R11-R12 | absent |
| Trouser | DXF-AAMA (S523) | `AC1009` / R11-R12 | absent |

## Source interpretation and boundaries

- Autodesk's primary DXF HEADER documentation maps `$ACADVER` `AC1009` to
  R11/R12 and `AC1012` to R13:
  https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm
- ASTM's primary D6673-04 record says the standard specifies DXF for pattern
  exchange and says AutoCAD Version 13 DXF is to be used:
  https://store.astm.org/d6673-04.html
- ASTM's textile standards list identifies D6673-10 as withdrawn in 2019:
  https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html
- S533's NIST historical source describes ANSI/AAMA-292 as based on AutoCAD
  Release 11 DXF. That is historical context, not proof of a current profile or
  conformance to ANSI/AAMA-292A.
- CLO's help documents menu labels and settings but does not state a precise
  normative edition or a conformance mapping; S498/S523 screens and DXF bytes
  remain observations of the tested build and settings.

No source establishes that all DXF-ASTM implementations must be D6673-04, or
that AC1009 alone invalidates every possible apparel-DXF dialect. No exact
current, rights-cleared industrial receiver/profile or all-seven semantic
round-trip is established. Polo's five CUT losses, mixed layer semantics,
marks, grades, and malformed-input acceptance remain separate gates.

## Gate disposition

- **New evidence:** all seven hash-pinned exports use the R11/R12 DXF header;
  no file declares `$INSUNITS`. The three ASTM-menu exports conditionally
  conflict with D6673-04's explicit R13 requirement.
- **Still held:** exact current apparel profile/edition and receiver rights;
  normative semantic mapping; Polo contour and mark coverage; graded and
  option-wide round trip; malformed-input behavior; receiver-independent
  rendered acceptance.
- **Unchanged:** all G04 acceptance criteria, thresholds, V02 status, export
  identities, and V03 In Progress status. No new CLO operation, source-pattern
  edit, or product code change.

## Verification and closeout

- `node --check` and two runs of
  `audit-dxf-headers.mjs` passed; both report SHA-256 values are identical.
- The audit checked seven pinned byte counts/hashes before parsing, requires
  valid group-code pairs and a HEADER `$ACADVER`, and reports the absent
  `$INSUNITS` explicitly. New analysis output is C:-only.
- Start board replay: `3275→3277`; validated exit replay: `3277→3279`.
  `npm run control-center:test` passed 42/42 after replay.
  Validated exit replay, board schema, and `git diff --check` are recorded
  after closeout. No production code/tests changed,
  so changed-code coverage and the full repository gate are not due.
- Started `2026-10-08 22:01:10 UTC` and reached verified closeout at
  `2026-10-08 22:04:09 UTC` (about 2m59s): source/manifest inspection and
  deterministic header audit `1m05s`; focused verification, board and durable
  closeout `1m54s`; external-agent waits `0m`; maintainer-decision time `0m`.
  Start state was S540
  `e8c93d754bdca770d76162cb06bf8aca074fc343`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. S541 is
  unique; start board revision was 3275.

**Next action:** verify from CLO's saved export-profile evidence and official
CLO documentation whether a selectable DXF version or explicit ASTM edition
exists. If none is evidenced, stop presenting the ASTM menu mode as a
qualified candidate and evaluate only a receiver/profile with a published,
rights-cleared version and semantic contract. Keep existing gates closed.
