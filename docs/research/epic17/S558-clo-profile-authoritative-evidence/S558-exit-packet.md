# EPIC-17 / G04 V03 — CLO profile authoritative evidence — Slice 558 exit

## Finding

The current CLO Help Center article “2D Pattern (DXF) Import/Export,”
updated September 28, 2026, documents three export formats: DXF-AAMA,
DXF-ASTM, and Standard DXF. It explicitly says current DXF-AAMA produces the
same output as the older “Gerber (DXF-AAMA)” option; its general exchange
description calls these industrial CAD pattern formats and names common
apparel CAD systems. CLO's separate current compatible-format table also
lists DXF-AAMA and DXF-ASTM as import/export formats. The user's installed
receiver is CLO 2026.1.310, and prior captured trials used its DXF-AAMA mode.

This is sufficient to identify a **documented named exchange profile** for
bounded claims: `CLO 2026.1.310 / DXF-AAMA`, with the tested units, scale,
rotation, and export settings stated per fixture. The V03 profile-identity
documentation subgate is now supported. Do not call the output generically
“AAMA-compliant” or imply exact normative-edition conformance: CLO's public
article does not specify an AAMA edition, full entity/layer semantics, or a
formal conformance claim. The retained files' `$ACADVER=AC1009` is only their
DXF database-version header.

The current article also documents a `Size format` option that includes grade
information in the DXF or emits it separately as a Rule File, while the
“Export without Grading” option exports only the current size. The seven
retained product fixtures still contain M/default only, and this repository's
current DXF exporter receives the pieces for one selected size. The option
description therefore identifies a practical future grade test but does not
create a genuine graded fixture or pass grading acceptance. A fixture must
carry real source-backed sizes/rules before the CLO trial is run.

The user has reported written confirmation covering product-development trial
use and local DXF processing. No further permission/locality question remains.
The admission does not require a second application: a same-app round trip is
admissible evidence if profile identity, the documented rights basis, and all
technical criteria pass.

## Technical disposition

This source evidence closes only the named-profile documentation subgate. It
does not change these retained results: five Polo contours fail the 0.001 cm
gate; tested files mix CUT/SEW semantics on layer 8; 78 of 100 source marks
lack a direct geometry match (not proof of loss); all seven fixtures are
M/default and lack grade data; and the tested malformed input was silently
accepted. CLO's saved gross renders show large-piece presence but do not
validate small marks. These known failures prevent V03 acceptance; no known
scenario was repeated in S558.

## Whitespace cleanup and verification

S557's staged whitespace check identified two extra blank lines at EOF in its
audit script. S558 removes only those trailing blank lines. `node --check`
passes; the retained-file audit ran twice after the cleanup and produced the
same C:-only JSON SHA-256:
`F5A0EB518E24EA5F061AB5F7C39CEFF4B68D701BD81B9A27A6E204A0D5203584`.
`git diff --check` passes. No audit behavior or generated report changed. No
CLO UI action or import/export was needed for this publisher-source question;
CLO remains open.

## Sources

- CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export), updated 2026-09-28. Its export table describes format choices, grade-information/Rule File output, single size-group selection, and “Export without Grading.”
- CLO Help Center, [Compatible File Format](https://support.clo3d.com/hc/en-us/articles/115002000227-Compatible-File-Format), updated 2026-09-23. Its table lists DXF-AAMA and DXF-ASTM as both import and export formats for industry CAD patterns.
- G04 admission and exact scope: `docs/planning/EPIC-17-ADMISSION.md`, V03 boundary and acceptance at lines 963 and 980.
- Retained S557 output/hash and source-grade-path evidence: `docs/research/epic17/S557-mark-and-grade-evidence-audit/S557-exit-packet.md`; generated files remain C:-only.

## Exit state and next action

All seven-recipe, geometry, semantic, mark, grading, malformed-input,
round-trip, rendered-output, and protected-export criteria stay unchanged.
G04-V03 remains In Progress. V01/V02 remain Done. No physical-fit,
factory-acceptance, or production-readiness claim is made. No production code
or tests changed; a full repository coverage gate is not due.

Next useful test: create or identify a real source-backed multi-size/grade
fixture, then run the one documented CLO grade-inclusion/round-trip path and
compare each size/rule against source truth. In parallel, profile identity is
now documented; next work should tackle the measured contour/semantic
failures only through a newly evidence-backed mechanism, not another repeat of
known CLO settings.

Started 2026-10-09 00:02:19 UTC from S557 `3fb4e6e`, with origin/main ancestor
and board revision 3345. Slice 558 is uniquely assigned. Board start/exit
replay: 3345→3347→3349; G04-V03 remains In Progress. Elapsed 2m44s
(00:02:19–00:05:03 UTC): official-source review ~1m20s; S557 whitespace fix
and deterministic recheck ~25s; durable matrix/state/board updates and
verification ~59s; implementation 0m; external-agent waits 0m;
maintainer-decision time 0m. `npm run control-center:test` passed 42/42;
all S558 helper scripts and the retained S557 audit script pass `node --check`;
board validation and `git diff --check` pass. No full repository gate is due.
