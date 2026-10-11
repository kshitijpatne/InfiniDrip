# EPIC-17 / G04 V03 — Remaining-recipe CLO round trips — Slice 523 exit

## Result

S523 completed one continuous local CLO 2026.1.310 (r58944) session for the
four base-M recipes not covered by the earlier CLO receiver trials: Fitted,
Tank, Skirt, and Trouser. Each source fixture went through two separate
DXF-AAMA import → selected-pattern export → re-import → selected-pattern
export generations. CLO remained open. No CLO-SET/CONNECT upload, cloud
operation, account change, install, purchase, source pattern edit, or
production-code change occurred. All DXFs, CLO screenshots, manifests, and
machine-readable output evidence remain under
`C:\G04-CLO-DXF-Exchange\S523-clo-remaining-recipe-roundtrip\`.

The same pinned current-source M fixtures and the unchanged `0.001 cm`
geometry gate were used for both generations. In generation two, all 34/34
source CUT/SEW outline polylines matched a corresponding output block contour
under cyclic/reverse vertex matching. Piece insert counts stayed exact and
there were zero over-gate contours, missing contours, or ambiguous matches.
The maximum coordinate delta was `0.000051 cm` (Trouser), still well inside
the gate. This is a measured pass for these four base-M fixture exchanges in
this CLO build/profile; it is not a general compatibility or industrial
profile claim.

| Recipe | Pieces / output inserts | Outlines per generation | Gen 1 max delta | Gen 2 max delta | Gen 2 bytes | Gen 2 SHA-256 |
|---|---:|---:|---:|---:|---:|---|
| Fitted | 3 / 3 | 6 | 0.000017 cm | 0.000025 cm | 46,358 | `10dad81e5a1fd9f021616d03588dc22d12a5f4e354ec9d78f64d044e45dbd74b` |
| Tank | 2 / 2 | 4 | 0.000018 cm | 0.000024 cm | 30,639 | `cafaa75e579aa3bb39eb1a384a441d47f7f254b9da8d201c6afd921db21fbf85` |
| Skirt | 3 / 3 | 6 | 0.000015 cm | 0.000023 cm | 9,737 | `741bcbad2ec198e893d74f94f445835b58ee34bba18e44dbc400fec5e30693fa` |
| Trouser | 9 / 9 | 18 | 0.000025 cm | 0.000051 cm | 57,892 | `f421a6a2977bb053989ccb7c5255d4c7023f198b677180bc69fbd4b462ea1aee` |

The raw CLO screenshots show the imported and re-imported patterns and the
actual selected-pattern AAMA export settings. The rendered screens were
reviewed for expected piece presence and gross outline damage; the parser
provides the numeric contour comparison. The standard CLO informational
notice appeared on import: seam allowances were imported in Custom mode to
preserve their shape. It was informational, not a format error, and was
dismissed without changing its “don't show again” preference. No concrete CLO
error occurred.

## Fixed profile and method

- Import: DXF-AAMA; centimeters; 100%; Do Not Rotate; Add; maintain original
  grain; import notch to both; import curve points on; curve optimization off;
  remove non-grading points off.
- Export: DXF-AAMA; Graded Nest; centimeters; 100%; Do Not Rotate; duplicate
  notch on seam allowance on; curve conversion and optimization off; bounding
  box off; Export Selected Patterns on. This prevented pre-existing workspace
  pieces from entering the measured export.
- The original source DXFs are byte/hash checked before analysis. The parser
  compares each source closed cut/sew outline against CLO's output block
  polylines, allowing cyclic start-point changes and reversed winding while
  requiring identical vertex counts and a maximum per-coordinate deviation
  at or below `0.001 cm`.
- Per-generation byte counts, SHA-256, section/version/unit data, inserts,
  blocks, entity counts, candidate matches, and per-outline deltas are in the
  C:-only `Evidence/remaining-recipes-roundtrip-analysis.json`.

## Acceptance and limits

- **Passed:** the bounded generation-one and generation-two contour and piece
  count checks for Fitted, Tank, Skirt, and Trouser at base M/default options;
  both generations rendered without a CLO format error; output screenshots
  are retained.
- **Not established:** an industrial apparel CAD exchange profile, license
  rights for the intended product use, local-only vendor data handling, all
  seven recipes, all options/grades, full mark/layer semantics, malformed
  input rejection, and end-to-end behavior in an independently qualified
  receiver. Earlier measured Polo point loss remains. No claim of factory
  acceptance, physical fit, or general CLO interoperability follows.
- V03 and EPIC-17 remain In Progress; V01/V02 remain Done. No acceptance
  criterion, `0.001 cm` threshold, pattern geometry, legacy DXF behavior,
  protected export byte identity, or claim limit changed.
- No safe disjoint external-agent task existed for this single stateful CAD
  session and shared measurement; Codex retained control. Agent waits: 0.

## Verification and closeout

Started `2026-10-08 19:10:56 UTC` from S522 `079ca9f`; refreshed
`origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
Highest prior slice was 522; S523 is unique. Board start revisions were
`3203→3205`; exit evidence and comment were then added through the validated
command layer at `3205→3207`.

- Measured focused geometry analysis: 8 recipe/generation cases, 68/68
  outline-generation matches within `0.001 cm`, 0 failures, max delta
  `0.000051 cm`; all 8 output insert counts match source piece counts.
- Generation-two rendered evidence visually checked for each recipe; no
  missing piece or gross contour damage was observed.
- `node --check` passes for the analyzer; deterministic focused analysis
  rerun again produced the same 8 case results. `npm run control-center:test`
  passes 42/42. Start+exit board command preflight passes at revision 3207;
  the validated CLI applied exit evidence and comment at revisions 3206 and
  3207. `git diff --check` passes. No production code changed;
  changed-production-code coverage and a full repository gate do not apply to
  this evidence-only slice.
- At the safe slice boundary, `get_goal` reports the goal **active**. Its
  objective still matches the admitted EPIC-17 scope and remains needed; this
  slice does not justify changing goal status or wording.
- Elapsed time: 20m04s (`19:10:56–19:31:00 UTC`): fixture/analyzer setup and
  source inspection ~6m; two CLO generations and screenshot capture ~8m;
  numeric analysis and rendered review ~2m; durable packet/state/board and
  focused verification ~4m; product implementation 0m; external-agent waits
  0m; maintainer-decision time 0m.

**Next:** refresh branch/history/board and reserve S524. Continue V03 by
resolving the rights/local-handling basis and qualifying an industrial apparel
exchange profile before claiming the profile gate. Preserve the Polo measured
failure and all semantic, grade, negative-input, option, and full round-trip
gates; do not repeat these same four fixtures unless a materially different
receiver/profile or source-backed mechanism is introduced. Keep CLO open
because G04 still needs it.

## Evidence locations

- Fixture generator and exact source contract:
  `docs/research/epic17/S523-clo-remaining-recipes-roundtrip/generate-fixtures.ts`.
- Replayable analysis program:
  `docs/research/epic17/S523-clo-remaining-recipes-roundtrip/analyze-fixtures.mjs`.
- CLO-only raw fixture/input/output/screenshots/manifest/analysis:
  `C:\G04-CLO-DXF-Exchange\S523-clo-remaining-recipe-roundtrip\`.
