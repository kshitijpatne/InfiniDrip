# EPIC-17 / G04 V03 — CLO in-app API exchange path — Slice 513 exit

## Finding

CLO documents a viable way to make local DXF exchange less dependent on
repeated menu dialogs: its Python API has `ImportDXF(path, ImportDxfOption)`
and `ExportDXF(path, ExportDxfOption)` calls. The export overload taking an
explicit path and options is documented to export without the options dialog.
CLO's Help Center says scripts run in its in-app Edit → Python Script editor.
This is an in-app scripting route, not a headless/command-line route, and it
does not itself prove a DXF import or round trip passes.

## What the official API establishes

- `ImportDXF` takes a file path and import-options object, returning success as
  a boolean. The documented import fields include append, scale/autoscale,
  rotation, annotations, cut/sew swap, notches, curve optimization and
  seam-allowance behavior.
- `ExportDXF(path, ExportDxfOption)` takes an explicit output path and skips
  the export options dialog. Export fields include an integer format selector,
  scale, rotation, metric flag, grading, baseline and notch settings.
- CLO documents opening the Python Script editor from the Windows application
  and running/saving a script there.

## What remains unresolved

- Public option documentation names the export format selector only as an
  integer; it does not map values to AAMA, ASTM or Standard DXF. The import
  options object likewise exposes no documented profile-format selector. The
  UI's format choices therefore cannot safely be translated into guessed API
  constants.
- CLO's SDK download page lists SDK `11.0.0` for CLO `2026.1.224`, while the
  tested installed build reported by the maintainer is `2026.1.310`. The public
  source reviewed does not establish exact SDK/API pairing or method support
  for `.310`.
- The in-app editor still requires a safely targetable CLO window to load/run
  the script. S510's Import action was rejected as outside the target window;
  activation failed with `no monitor found for window`. No script was run.
- Exact receiver rights/use scope, format edition/conformance, numeric layer
  semantics, all-seven recipe coverage, source-scale geometry, grading,
  negative-input behavior, and generation-two results remain unproven.

## Recommended next practical step

When supported desktop control can operate CLO, use its in-app Python Script
editor for a narrowly instrumented API smoke test with the already pinned
Polo M input under `C:\\G04-CLO-DXF-Exchange\\S514-clo-api-smoke\\`. First
verify the installed build exposes `ImportDXF`; do not guess the integer DXF
profile selector. If the API cannot select a documented profile without
unverified enum values, use the UI for that choice and use explicit-path API
calls only where their settings are confirmed. Then inspect generated files,
hashes, rendered reimport and measured geometry. Do not extend the test to all
recipes or claim V03 acceptance until profile choice, permissions, and all
gates are supported by evidence.

This recommendation does not relax acceptance, certify CLO as industrially
compatible, or authorize sending any file to CLO-SET/CONNECT/cloud services.
All future exchange artifacts stay on C: in the purpose-named G04 folder.

## Gate disposition and verification

V03/EPIC-17 remain In Progress; V01/V02 remain Done. Every V03 gate, all-seven
criterion, `0.001 cm` geometry threshold, legacy DXF behavior, protected
export identities, and physical/factory claim limits remain unchanged. No
script, install, CAD file, or fixture was created or opened.

- Board start replay: `3163→3165`; exit replay: `3165→3167`.
- Exit preflight passed at revision 3167; validated command-layer replay
  advanced the canonical board to 3167. `npm run control-center:test` passed
  42/42; `git diff --check` passed. Documentation-only; no changed production
  code coverage or full repository gate is due.
- Approximate elapsed from `2026-10-08 17:51:56 UTC` to closeout: official
  source review 3m; synthesis and durable records/board 2m; focused
  verification 1m; external-agent waits 0m; maintainer-decision time 0m.

## Sources

1. CLO, [API List](https://developer.clo3d.com/list.html), `ImportDXF` and
   `ExportDXF` signatures and behavior.
2. CLO, [API Option & Type](https://developer.clo3d.com/optiontype.html),
   documented `ImportDxfOption` and `ExportDxfOption` fields.
3. CLO Help Center, [How to use Python Script in CLO?](https://support.clo3d.com/hc/en-us/articles/115014409267-How-to-use-Python-Script-in-CLO),
   updated May 28, 2026.
4. CLO, [API/SDK Download](https://developer.clo3d.com/download.html), latest
   listed SDK version mapping.
5. CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export),
   updated September 28, 2026.
