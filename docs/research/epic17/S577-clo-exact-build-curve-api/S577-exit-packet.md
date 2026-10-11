# EPIC-17 / G04 V03 — CLO exact-build 2D curve API check — Slice 577 exit

## Finding

The current official CLO SDK download page still lists SDK 11.0.0 for CLO
2026.1.224; it does not list a 2026.1.310 build. The installed product is
2026.1.310. This means the public docs do **not** establish exact-build support
for the installed app.

The current official API List documents read-only `GetPatternCount()`,
`GetPatternPieceName(index)`, and `GetPatternOutlinePoints(index)`. The outline
getter returns ordered boundary segment endpoints in millimeters from the
pattern bounding-box top-left, with Y increasing down. Its documentation
explicitly excludes curve control points. Thus the API describes a potentially
useful read-only query, but does not prove it exists in .310 or return every
possible curve primitive/control point needed for exact contour reconstruction.
The docs also do not promise separate cut/sew path identity or layer semantics
through this query.

S577 ran no script, touched no CLO project, and cleared no V03 gate. The API
method is not dismissed as unusable; its behavior in the installed version is
simply unverified. The next bounded step is an in-app **read-only smoke query**
against the existing open Polo project, using only documented getters. Do not
call setters or exporters. If the getter is absent or its points do not support
0.001 cm source comparison, retain the exact uncertainty and move to another
evidence-backed route without reverse engineering project files.

All V03 acceptance, profile/rights evidence, all-seven V02 scope, 0.001 cm
threshold, holds, protected export identities, and legacy DXF behavior remain
unchanged. Product-development use and local-only file processing are already
confirmed by the maintainer. CLO remains open.

## Evidence and sources

- First-party source note saved under C:
  `C:\G04-CLO-DXF-Exchange\S577-clo-exact-build-curve-api\Evidence\official-clo-api-review.md`;
  SHA-256 `A85DD91717F4BBD3B33F862813556FBCF58967160E77778446400BE338EC83B7`.
- Official [CLO API/SDK downloads](https://developer.clo3d.com/download.html):
  latest mapping shown as SDK 11.0.0 / CLO 2026.1.224.
- Official [CLO API List](https://developer.clo3d.com/list.html): documented
  pattern count/name/outline methods and the outline coordinate frame/control
  point limitation. No exact .310 build claim was found.
- S513, S515, and S569 research packets were read and used to avoid repeating
  general API, import/export, and grading research.

## Verification and durable state

- Start board commands were validated and applied through the Control Center
  CLI at 3421→3423; exit commands advance 3423→3425 and preserve G04-V03 In
  Progress.
- Current source pages, versions, method signatures, coordinate frame, and
  curve-control limitation are recorded above and in the C:-only source note.
  Preflights and replay guards passed; `npm run control-center:test` passed
  42/42; `git diff --check` passed.
- No delegation was safe for this exact-build fact screen; external-agent waits
  0 minutes. Maintainer-decision time 0 minutes.

## Timing and next gate

- Started 2026-10-09 04:52:07 UTC from S576 commit `afea6505`; refreshed
  `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
- Unique slice 577; highest assigned at start was 576.
- Elapsed time: 2026-10-09 04:52:07–04:55:00 UTC (2m53s); official-source
  review approximately 1m30s; verification and durable records approximately
  1m23s; external waits 0m; maintainer-decision time 0m.
- **Next:** perform the documented, read-only API smoke query in the already
  running CLO 2026.1.310 session, capture only returned pattern names/count and
  boundary points, and compare against the hash-pinned source only if output
  preserves enough geometry. Keep all current gates and claims fail-closed.
