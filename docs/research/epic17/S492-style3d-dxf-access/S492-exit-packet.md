# EPIC-17 / G04 V03 — Style3D Studio access and DXF screen — Slice 492 exit

## Result

Style3D Studio has genuine apparel-pattern DXF capability in some product
configurations. Its help shows a Windows desktop workflow to import a pattern
DXF and export revised paper patterns, and release notes mention Gerber and
Lectra DXF exchange. Those generic technical facts do not qualify the free
plan or establish a G04 profile/round trip.

The current plan matrix labels the Free plan non-commercial. Its listed
external integrations include DXF import but list BOM/PLT/ABC, OBJ, GLB and
FBX for export, not DXF. The published Terms of Service §6.1 limits the Free
Version to personal learning/use, prohibits commercial or other profit use,
and says it is not to be provided to enterprises or organizations. Therefore
the free plan is not an evidence-backed receiver for G04 product-development
exchange testing. No account-specific exception was established.

The desktop workflow requires account login and provides file-menu import and
export operations. Public sources do not establish that DXF contents remain
local-only. Exact AAMA/ASTM profile/version, pattern-piece/grade semantics,
and actual same-receiver round-trip were not tested. The exact claim boundary
and URLs are in `S492-source-matrix.md`.

No account, sign-in, terms acceptance, trial, contact, download, installation,
pattern, upload, or fixture was used. CLO was already closed and remained
closed.

## Gate and status

- Style3D Free is **not selected**: the listed no-cost export permissions do
  not include DXF, and the free-use license excludes organizational/commercial
  product development.
- The paid/other tiers are not evaluated for purchase or use. No format
  compatibility claim is made.
- Gate 0 and all local file handling, exact-profile import/export,
  same-receiver round-trip, grading, and malformed-input evidence remain
  required. EPIC-17/G04-V03 remain In Progress; V01/V02 remain Done.
- Preserve all-seven V02 acceptance, generic legacy DXF behavior, protected
  export byte identities, and the no-physical/factory/production-readiness
  boundary.

## Verification and next action

Validated board commands link the source matrix and exit to G04-V03 and link
the exit to EPIC-17 without changing status. `npm run control-center:test`
passes `42/42`; S492 scripts pass `node --check`; `git diff --check` passes.
No production code or garment rendering changed; changed-code coverage and
rendered output are not applicable. Reserve the full repository gate for the
settled integrated Epic/PR candidate.

Next: continue only with a candidate whose exact no-cost or otherwise
authorized tier affirmatively grants local product-development use, local
file handling, and the required pattern-profile import and export. If the
maintainer keeps the no-paid constraint and no such grant appears, V03 is
blocked on external access/authorization; do not weaken the acceptance gates.

## Timing

Elapsed `2m20s` (`09:22:45–09:25:05 UTC`; estimates): official-source review
`1m00s`; implementation `0m`; focused verification `0m13s`; durable
packet/board work `1m07s`; external-agent wait `0m`; maintainer-decision time
`0m`.
