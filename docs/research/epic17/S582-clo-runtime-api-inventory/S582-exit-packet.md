# EPIC-17 / G04 V03 — CLO runtime API inventory — Slice 582 exit

## Result

S582 began 2026-10-09 05:27:44 UTC at S581 commit
`207ef4d946be09b2c26afc7d4f481376ab624eef` on `codex/epic-17-g04`.
Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained
an ancestor. The worktree was clean, board revision 3441 had G04-V02 Done and
G04-V03 In Progress, and S582 was the next unique slice.

One read-only script run in the open CLO 2026.1.310 Python Editor imported
`pattern_api` and enumerated `dir(pattern_api)`. It called no API method.
The runtime returned 217 public names with no script error. The full list,
keyword-filtered subset, source script, and screenshot are hash-recorded below
and in the named C: folder.

Exact-build presence among the candidate methods:

| API name | Present | Relevance and limit |
|---|---:|---|
| `GetPatternInformation` | Yes | First-party docs say per-pattern information as a JSON string; no schema or geometry promise. |
| `GetPatternInputInformation` | Yes | First-party docs say per-pattern input information as a JSON string; no schema or imported-geometry promise. |
| `GetPatternLineInfo` | Yes | Already queried in S580; 8/9 SEW and 0/9 CUT direct matches at 0.001 cm. |
| `GetPatternOutlinePoints` | Yes | Already queried in S578; returned an empty list for all nine patterns. |
| `GetPatternInternalShapePoints` | Yes | Docs say points are mm in a pseudo-bounding-box frame and require the internal-shape-list order. |
| `GetInnerShapeList` | **No** | The installed module does not expose the documented list/index source needed to enumerate internal-shape indexes. |
| `GetInternalShapeInformation` | **No** | S581 recorded an exact `AttributeError` on all nine patterns. |
| `GetPatternBaselinePoints` | Yes | Docs describe baseline-tool shapes, not a general source CUT contour API. |

The namespace inventory establishes names only. It does not establish that a
present method works, what undocumented fields it returns, or any CUT/SEW
meaning. The installed build's missing methods are concrete exact-build
limitations even though the public reference documents them.

## Evidence and verification

- Exact output: `C:\G04-CLO-DXF-Exchange\S582-clo-runtime-api-inventory\Evidence\pattern-api-names.json`
  — SHA-256 `786EFEE8FACF8236193CE73DA5D3CED9B79E79BD7BAD520BC1A208EF95C12EDC`.
  It contains 217 unique sorted public names, 162 matches to the explicitly
  recorded keyword filter, and `error: null`.
- Live CLO screenshot:
  `C:\G04-CLO-DXF-Exchange\S582-clo-runtime-api-inventory\Evidence\clo-s582-run.jpg`
  — SHA-256 `40336A501BBD7E261B1AE2E159FFBE884DE8B262C39915A6D670691C175C9FE5`.
  It shows CLO 2026.1.310 with the S582 inventory source open in its Python
  Editor. The API produced no `[Info]` method-call lines because this was
  namespace inspection only; the JSON is the direct run result.
- Source script:
  `C:\G04-CLO-DXF-Exchange\S582-clo-runtime-api-inventory\Scripts\inventory_pattern_api.py`
  — SHA-256 `F71D97AA11CE7C845AD9AE45D7E784A5ECC2C508B551CC8F33997C32EBBDE132`.
- First-party references:
  [CLO API List](https://developer.clo3d.com/list.html) documents
  `GetPatternInformation(index)` and `GetPatternInputInformation(index)` as
  JSON-string getters, without a schema. It documents
  `GetPatternInternalShapePoints` in millimeters in a pseudo-bounding-box
  frame, with the index ordered like `GetInnerShapeList`; it documents
  `GetPatternBaselinePoints` as baseline-tool shapes. That documentation does
  not override exact-build runtime availability or imply CUT/SEW semantics.
- Output review: JSON parses; names are sorted and unique; candidate
  presence/absence assertions match the saved list; screenshot and output
  hashes match. Board exit replay, Control Center tests, command syntax checks,
  and `git diff --check` are recorded below. This is an evidence-only slice,
  so no production-code coverage or full repository gate is due.

## Acceptance and scope

S582 clears no V03 gate. V02 remains Done; V03 remains In Progress. Preserve
the 0.001 cm geometry threshold, CLO 2026.1.310 / DXF-AAMA profile identity,
all-seven V02 scope, protected export identities, legacy DXF behavior, and
all technical round-trip requirements. No compatibility claim or acceptance
criterion changes. No geometry, project, source code, or DXF changed. CLO
remains open.

## Boundary, timings, and next action

S582 closed at 2026-10-09 05:33:10 UTC, 5m26s after start:

- Implementation/evidence and durable records: about 2m.
- Focused run, output/render review and verification: about 3m26s.
- External-agent waits: 0m; no independent task existed for one live app
  namespace inspection.
- Maintainer-decision time: 0m.

Next: reserve S583 for one read-only query of both documented, exact-build
available JSON getters, `GetPatternInformation(index)` and
`GetPatternInputInformation(index)`, over the same nine imported patterns.
Record raw and parsed JSON under the S583 C: folder. Inspect field names and
values literally; the public docs do not specify the schemas. Do not make
geometry or stage claims unless returned fields and independently verified
source/output evidence support them. This is the remaining focused metadata
probe; after it, prioritize any direct UI-visible exchange setting or
acceptance check rather than extending an API survey.

## Board and durable-state closeout

Validated command replay advances board revision 3443→3445. G04-V02 remains
Done and G04-V03 remains In Progress. Goal status remains active and aligned
to EPIC-17/G04 through safe merge. The state file and context index point to
this result and the S583 next action.
