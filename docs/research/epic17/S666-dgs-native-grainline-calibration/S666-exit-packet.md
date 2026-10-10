# EPIC-17 / G04 V03 — DGS native grainline calibration — Slice 666 exit

## Result

The synthetic source fixture passed independent inspection: one named INSERT
references one closed 20 × 30 cm CUT polyline with four vertices, centimeter
units, and zero explicit LINE/GRAINLINE entities. The C:-only input is 1,005
bytes, SHA-256
`BCBBD549AAFA2213BB714246825B5BF9D18C410F4326909B8EFB51319B331D80`.
Reproducible inspection is `inspect-control-fixture.mjs`; its JSON output is
under the C:-only evidence folder.

In a fresh DGS window, one import used the observed `AUTOCAD` / `Pattern` /
`Unit of file` route, `Import text` checked, and `Grainline: 2 Way`. DGS
reported one exact Error Box row: `Pattern name1,Size:M,grainline is outside
the border, please check again.` The canvas showed a centered two-way marker
although the source has no explicit grainline entity. The selected pattern was
selected, then `Ctrl+R` → `Re-create grainline` → `By direction in config` /
`Only select pattern` was executed once. The marker remained and the exact
warning remained. This does not establish whether the displayed marker is an
import-created native object or prove its emitted semantics.

The warning panel obscures some of the receiver render, which also contains
unexpected large internal strokes absent from the source's sole CUT outline.
This is an actual rendered mismatch requiring investigation, not evidence of
valid geometry. No DXF export, parse of receiver output, or reimport was
attempted because the import still had an unresolved loss warning. The exact
DGS AutoCAD/Pattern calibration **failed** the warning-free input gate. The
broader DGS family and the cause of the warning remain unproven. V03 remains
unqualified; no V03 technical gate passes from S666.

## Gate disposition

- **Passed narrowly:** the frozen synthetic DXF itself is structurally valid;
  its source outline, units, origin and absence of explicit grainline entities
  are independently recorded.
- **Failed:** the exact DGS `AUTOCAD` / `Pattern` / `Unit of file` input
  candidate has an unresolved outside-border warning and a receiver render
  with unexpected internal strokes. Native grainline recreation did not clear
  the warning.
- **Unproven:** whether the two-way display marker is represented in a saved
  native pattern; receiver geometry/units/precision; emitted entity, layer and
  ownership; sew/mark semantics; export/reimport; grades; malformed-input
  handling; repeatability; seven-recipe/73-option coverage; and readable
  receiver output. No ANSI/AAMA or ASTM conformance claim is made.
- **Unchanged:** S640's CLO route remains failed on five CUT comparisons at
  `0.001 cm`; V02 remains Done for all seven recipes/73 configurations/146
  faces. V03 acceptance, C04 sidecar constraints, legacy DXF behavior,
  protected export byte identities, and final full gate/PR/merge/deployment
  remain intact.

Rendered screenshots are kept only under
`C:\G04-CLO-DXF-Exchange\S666-dgs-native-grainline-calibration\Evidence\`:

- `S666-DGS-AutoCAD-import-warning.jpg`, SHA-256
  `33D6DFCEB23E93B86F8A50A69B8EDE1982197B51EB4A131EBEE9A38A9C42706A`.
- `S666-DGS-after-native-recreate-warning.jpg`, SHA-256
  `5EC08E4D79EDB4AEDFAC655D7C90A982C096926293CAB2637FC15E4427F77A35`.
- The source inspection report has SHA-256
  `9756AB9867F0093A9E15ABA0AF9741A09897A8B715C35E19DACAA9D65A036697`; the
  final input manifest has SHA-256
  `2283677A090FEA0C3DFB0F4DC57D6AD8CEED55EA92FE45EFFEACDE1C155C850D`.

## Next route, not an acceptance change

S667 is one bounded diagnostic of the other first-party documented DGS choice:
`AUTOCAD` / `Design`, applied once to the exact S664 source-matched Polo M
candidate and frozen unit/text/grainline settings, changing only
`Pattern` → `Design`. S661 and S664 both used Pattern and failed 9/9 with the
same warning; S666 proves the warning can also appear on a source with no
grainline entity. The documentation explicitly distinguishes opening a
pattern from opening a design line. This one-variable check determines whether
that documented import mode avoids the Pattern-only interpretation problem
and can retain the full source drawing. This is a new candidate-specific gate,
not a relaxation or a standards claim.

Require zero unresolved loss, all nine CUT/SEW/mark/source entities and
identity recoverable from the rendered/imported data, and geometry within
`0.001 cm` before considering one AutoCAD/No RUL export/parse/reimport. Stop
this Design candidate on the first specific loss, geometry miss, warning,
unreadable render, or inability to measure. Do not change the source, file
encoding, unit setting, or any other import/export option. If it fails, retire
this DGS AutoCAD family and select a materially distinct receiver only where
rights and local handling are already evidenced; do not spin another DGS
permutation. If it passes, continue the existing negatives, frozen repeat,
sidecar/mismatch, breadth/grades and rendered-output gates using the same
candidate.

## Verification and closeout

- Started `2026-10-10 09:07:06 UTC` from S665 commit
  `253d3b9fdde6f5b42edd08abd8fa0e936a85dad0`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S665 was the
  highest assigned slice; S666 is unique.
- Input inspection (`node inspect-control-fixture.mjs`) passed and confirmed
  the input hash/geometry described above. C:-only DGS settings, warning text,
  screenshots and outcome are recorded in `S666-input-manifest.json` and
  `S666-source-inspection.json`.
- One actual DGS import and one native selected-pattern grainline-recreation
  operation were observed; no output export or reimport occurred after the
  declared warning stop.
- Start/board evidence was validated from revisions `3897→3901`; S666 exit
  evidence, status descriptions and comment were replayed through the
  validated command layer from `3901→3907`; protected-summary repairs and a
  concise wording correction completed `3907→3911`. The first Control Center run failed 41/42
  because its established assertion requires the exact wording `V01 and V02
  are Done`; the regression and repair are recorded in
  `S666-control-center-failure.md`. The affected `board.test.mjs` then passed
  18/18; after wording correction, final `npm run control-center:test` passed
  42/42; `git diff --check`,
  `node --check` on the inspection/preflight scripts, and fixture inspection
  passed.
- No production source/tests/export baselines/protected identities changed.
  Changed-production-code coverage is not applicable. Focused Control Center
  tests and validated exit replay are recorded below in the exit evidence.
- Total elapsed `28m29s` (09:07:06–09:35:35 UTC): fixture/packet work 5m;
  DGS UI operations and rendered review 16m; focused verification/diagnosis
  4m; durable closeout/board replay 3m; external-agent waits 0m;
  maintainer-decision time 0m.
- DGS/GMS remain open for the next evidence-led route. No physical-fit,
  factory-acceptance or production-readiness claim.

## Next action

Close Slice 666 with this exact-candidate failure and start S667's one-variable
AutoCAD/Design mode diagnostic. Keep G04-V03 and EPIC-17 In Progress.
