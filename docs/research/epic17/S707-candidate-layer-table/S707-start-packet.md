# EPIC-17 / G04 V03 — S707 candidate layer declarations

## Verified starting boundary

- Start: 2026-10-11 01:00 UTC.
- Branch `codex/epic-17-g04`; starting commit S706
  `a5b196e3c7b8a2f293...` (full hash to be recorded at closeout).
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor; S706 is the highest assigned slice and S707 is reserved once.
- Canonical board revision 4154; EPIC-17 In Progress, G04-V03 Blocked,
  G04-V01/V02 Done. Goal remains active.
- The two S700 coverage-diagnostic files remain the only known pre-existing
  untracked files; leave them untouched for the final cleanup inventory.
- S706's exact source and LibreCAD return show the source `CUT` entities
  inside named blocks become layer `0` on save; S690's non-block R2000 source
  retained `CUT`. S706 records exact hashes and measurements. Both S690 and
  S706 inputs omit a TABLES section; S690's saved file contains a LAYER table,
  while S706's saved file omits `CUT` from its layer table. This is a
  source-format hypothesis to test, not a proven cause.

## Bounded objective

Audit the candidate wrapper's DXF structure, then make one candidate-only
source change: declare every used layer in an explicit R2000 LAYER table
before the BLOCKS section. Preserve all entity bytes/coordinates, layer names,
block identity, transforms, marks, geometry, legacy writers, and protected
export identities. This addresses the concrete structural difference between
the earlier non-block route that preserved `CUT` and the named-block route
that did not retain `CUT`; whether explicit definitions correct that behavior
is unproven until the one exact output check. Autodesk's DXF reference places
LAYER definitions in TABLES and specifies symbol-table and LAYER-record group
codes: https://help.autodesk.com/cloudhelp/2018/ENU/AutoCAD-DXF/files/GUID-D94802B0-8BE8-4AC9-8054-17197688AFDB.htm and
https://help.autodesk.com/cloudhelp/2018/ENU/AutoCAD-DXF/files/GUID-5AB9300F-F0AC-4ADE-89EA-A9D1D152D8B8.htm.
This is a narrowly justified candidate-format improvement, not a claim that
it will qualify LibreCAD as industrial apparel CAD.

If source inspection disproves that the candidate lacks explicit layer-table
records, stop implementation and record the evidence. If it confirms the
omission, implement and verify explicit layer records in the opt-in package
only, exercise all existing recipe/grade/73-option cases, require 100%
changed-production-code statement/branch/function/line coverage, and preserve
the legacy DXF hash suite. Then run the corrected candidate once through the
same LibreCAD 2.2.1.5 DXF 2000 route to check whether `CUT` survives. That
single recheck is permitted only because source bytes change to correct the
measured structure; do not change application, format, settings, geometry, or
threshold, and stop after this result.

## Acceptance and limits

- The layer table must be complete, deterministic, unique-handle, parseable,
  and exactly match all entity layer names including `0`, `CUT`, `SEW`, and
  each used `MARK_*` layer.
- The manifest/verifier must still bind drawing hash, piece/revision,
  transforms, and source mark anchors.
- Returned geometry and all typed marks must remain within `0.001 cm`, units
  must remain centimeters, all nine piece identities must match, and the saved
  drawing must reopen/render without warning. This one Polo M result does not
  clear breadth, grades, malformed-input, repeatability, full-readability, or
  receiver qualification.
- Never call LibreCAD an industrial apparel profile. Do not make
  ANSI/AAMA/ASTM claims. No acceptance, status, or threshold changes.
- No app install/search, CLO retry, geometry edit, UI redesign, cleanup
  deletion, or physical/factory/production-readiness claim.
- Files exchanged, analyzed, or rendered remain only under a named
  `C:\G04-CAD-Interchange\S707-candidate-layer-table\` folder.

## Verification and closeout

- Focused candidate-package tests and changed-code coverage at 100% for all
  four metrics; legacy/protected export tests; typecheck; Control Center 42/42;
  `git diff --check`; output DXF parser and C:-only rendered receiver evidence.
- Full repository suite/coverage remains for the settled integrated Epic/PR
  candidate.
- No delegation is safe: the source wrapper, validation contract, and exact
  receiver test are coupled.
- Start board revision 4154; validated start evidence/comment replay follows.
- Record implementation, focused verification, external-agent wait, and
  maintainer decision time separately. One unique closeout subject:
  `Slice 707: declare layers in candidate DXF blocks`.

## Slice exit

The opt-in package now emits an R2000 layer table. Input generation, source
hash and table parsing are recorded in
`C:\G04-CAD-Interchange\S707-candidate-layer-table\S707-r2000-analysis.json`.
The single planned native LibreCAD save/reopen was completed after the initial
browser-only UI check failed to expose native windows; the actual native app
surface was then used, and no alternate export or app was used. The exact
return is re-opened and visibly captured. It retains the table but still puts
all nine CUT outlines on layer `0`, so the hypothesis fails. The complete
measured result and exact file hashes are in `S707-exit-packet.md` and the
C:-only analysis/render files it references.

Focused package/centimeter/export/protected checks passed 39/39; changed
production code coverage is 100% for statement/branch/function/line, and
`npx tsc --noEmit` passed. The layer change does not clear V03. G04 acceptance,
thresholds, profile qualification, all-seven/options/grades and protected
export identities are unchanged. The two pre-existing S700 coverage
diagnostics remain untouched for final cleanup accounting.

### Same-app command-line fallback check (2026-10-11)

The official LibreCAD console-tool guide documents DXF-to-PDF conversion, and
the project README documents DXF-to-PDF/PNG/SVG rendering; neither documents
DXF-to-DXF round-trip. This was not used as a substitute for native Save As.
References: https://raw.githubusercontent.com/LibreCAD/docs/main/guides/console-tool.rst and
https://github.com/LibreCAD/LibreCAD#dxf-converter.
