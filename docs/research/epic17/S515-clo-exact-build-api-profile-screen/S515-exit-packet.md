# EPIC-17 / G04 V03 — CLO exact-build API/profile source screen — Slice 515 exit

## Current official-source findings

The official CLO API pages were opened again on 2026-10-08. They do not
resolve the installed build's profile mapping:

- CLO's current SDK download page lists SDK 11.0.0 for CLO 2026.1.224 as its
  latest package. The exact installed build is 2026.1.310. No matching .310
  SDK appears on the published list.
- `ImportDxfOption` documents scale, angle, annotation, seam-allowance,
  notches, curve and distribution options, but no import-format/profile field.
- `ExportDxfOption` documents `m_ExportDXFFormatType:int` and other export
  settings, but the public type page gives no numeric mapping for AAMA, ASTM or
  Standard.
- The API list documents `ImportDXF(path, options)` and an
  `ExportDXF(path, options)` form without the options dialog. It also documents
  a path-only `ExportDXF(path)` form that displays the export options dialog.
  That gives a non-guessed way to choose a UI-exposed export profile if the API
  can be invoked in-app, but does not identify import profile selection or
  attest to round-trip behavior.

These official pages are direct documentation evidence; they do not establish
whether undocumented fields or methods exist in the installed binary. S514's
binary symbols remain implementation-presence evidence only. This source
refresh found no reason to download the mismatched .224 SDK or install any
software.

## Practical test route, without repeating prior trials

The unresolved CLO case remains one UI-selected AAMA export followed by AAMA
reimport and a second-generation export/reimport, using the existing
hash-pinned Polo M fixture and evidence under
`C:\G04-CLO-DXF-Exchange\S515-clo-aama-export-reimport\` (use a fresh unique
named child folder if that already exists). Record the exact mode and each
setting from the visible CLO dialogs. This avoids guessing the API integer and
does not repeat S503's AAMA-import/ASTM-export test, S503/S505/S507/S508's
Standard cases, or their scale variants. Compare identities, source-scale CUT
geometry at the unchanged `0.001 cm` tolerance, marks/layers, grades if
present, warnings, negative-input behavior and actual rendered second-generation
output. Do not fan out to seven fixtures unless the controlled pilot clears
its criteria. This test is already authorized within S503's local-only trial
bounds; it does not alone clear the separate V03 receiver-rights/profile
selection gate.

S514's concrete helper capture mismatch remains the only present blocker to
performing the operation safely: metadata/accessibility selected CLO but both
screenshots displayed Codex. Keep the existing CLO process open; do not
relaunch it or repeat failed capture attempts. Resume UI operations only when
the supported tool provides a screenshot that visibly corresponds to the
selected CLO window. If it does not, record that access failure and continue
independent V03 work without claiming an exchange result.

## Gate disposition and verification

No receiver/profile selection or acceptance gate changed. V01/V02 remain Done;
V03/EPIC-17 remain In Progress. Preserve all seven-recipe coverage, rights,
profile, exact geometry/marks/layers, grading, malformed-input, two-generation
round-trip, protected export identities, and claim limits. No CLO window, file,
fixture or SDK was operated, created, downloaded or installed in S515.

- Board start/exit: `3171→3173→3175`.
- `npm run control-center:test`: 42/42 passed; `git diff --check` passed.
- Documentation/evidence only; no full repository gate is due.
- Elapsed `2026-10-08 18:01:24–18:04:20 UTC` (2m56s): implementation 0m;
  official source refresh 1m; synthesis/plan 1m; focused verification and
  records/board 56s; external-agent waits 0m; maintainer-decision time 0m.

## Sources

- CLO, [API/SDK Download](https://developer.clo3d.com/download.html): latest
  listed SDK/build mapping.
- CLO, [API Option & Type](https://developer.clo3d.com/optiontype.html):
  documented DXF import/export option fields.
- CLO, [API List](https://developer.clo3d.com/list.html): DXF import/export
  method signatures and the path-only export-dialog behavior.
