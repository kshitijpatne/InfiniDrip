# EPIC-17 / G04 V03 — CLO 2026.1.310 read-only outline API smoke — Slice 578 exit

## Result

The already-running CLO window reports version **2026.1.310**. Its Python Script File command opened the script in the CLO Python Editor; the official editor's Run control was then used once. The run completed without an exception and wrote its JSON output locally.

The three documented getters were callable in this build:

- `pattern_api.GetPatternCount()` returned **9**.
- `GetPatternPieceName(0..8)` returned names `0` through `8`, consistent with the nine imported DXF blocks recorded for S574's Polo fixture.
- `GetPatternOutlinePoints(0..8)` returned an empty list for **all nine** pieces. The visible 2D window still displayed the nine pattern shapes. CLO's debug console showed calls to the named getters, while the script captured no Python exception.

The official API list says the outline method returns ordered boundary segment endpoints and returns an empty list when a pattern is not found. Here valid indices and names coexist with empty geometry, so the API's runtime response does not expose usable boundaries for this imported project. There are no points to compare to source CUT/SEW paths, and therefore no 0.001 cm geometric comparison is possible. This does **not** isolate whether a missing CUT path was dropped at import or export, and it does not prove a broad CLO/API defect. It is a concrete limitation of this tested project/build/query route.

The first `File > Import > Python Script File` action opened the Python Editor but did not execute the script; the official documented Run control executed it. This was a UI workflow discovery, not an API or interchange failure. The later single run produced the recorded output.

## Scope and evidence

The script uses only `GetPatternCount`, `GetPatternPieceName`, and `GetPatternOutlinePoints`, plus local JSON writing. It calls no setter, importer, exporter, simulation, save, or project-control API. No CLO project was saved or modified. All generated/imported test files remain under the named `C:\G04-CLO-DXF-Exchange\S578-clo-outline-api-smoke` folder.

- Script: `C:\G04-CLO-DXF-Exchange\S578-clo-outline-api-smoke\Scripts\read_only_pattern_outline_smoke.py`; SHA-256 `271712AE4C718375EA637083B080F661BDFE8E4AF702DCE941ADB054BE43B0BD`.
- API output: `C:\G04-CLO-DXF-Exchange\S578-clo-outline-api-smoke\Evidence\outline-api-result.json`; SHA-256 `F460ABCECA8EAC4084E40BD52BD120309F0A2DA6F0AAB2AC8BD065E8D0307242`.
- CLO post-run screenshot: `C:\G04-CLO-DXF-Exchange\S578-clo-outline-api-smoke\Evidence\clo-api-run.jpg`.
- CLO build/version is visible in the screenshot. The JSON lists nine pattern names and nine empty outline arrays, with `error: null`.

## Acceptance and remaining gates

S578 establishes exact-build runtime availability of the three getters but **fails** the useful-geometry subgate: zero of nine pieces returned boundary points. No V03 criterion passes from this result. V03 remains In Progress pending a qualified receiver/profile and documented representative fixture round trips with geometry, semantics, marks, options/grades, malformed-input behavior, and truthful compatibility evidence. V02 is Done per the refreshed canonical board and S459 evidence. Preserve V02-before-V03, 0.001 cm comparison threshold, all-seven V02, protected export identities, legacy DXF behavior and all recorded evidence. Do not claim physical fit, factory acceptance, or production readiness.

## Verification and durable state

- S578 board start replay: revision 3425→3427. Exit commands: 3427→3429. EPIC-17 and G04-V03 remain In Progress; G04-V02 remains Done.
- Static script review found only the three allowed `pattern_api` symbols; Python exception is null; JSON shape and nine rows were inspected. The first import action only loaded the editor; the single Run action generated the output.
- `npm run control-center:test` passed 42/42; start/exit preflights and CLI replay guards passed at 3425→3427→3429; `git diff --check` passed.
- No production source or tests changed. No full repository gate is due for this focused research/tooling-only slice.
- No safe delegated ownership existed; external-agent waits 0 minutes. Maintainer-decision time 0 minutes.

## Timing and next action

- Started 2026-10-09 04:56:39 UTC from clean S577 commit `0826323eae2f360af393e66ae8d9e07a35e1ffaa`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
- Slice 578 is unique; highest assigned at start was 577.
- Elapsed time: 5m03s (04:56:39–05:01:42 UTC): start/context/board verification ~1m; script preparation and safety review ~1m; CLO window/API execution ~1m30s; result review, focused Control Center verification and durable closeout ~1m33s. External-agent waits 0m; maintainer-decision time 0m.
- **Next:** inspect the official API list only for another documented, read-only query that exposes imported boundary geometry or separately identifies CUT/SEW paths, then decide whether that evidence route is actually testable in the installed build. Do not repeat the same empty-outline call, modify project geometry, change the tolerance, or assert stage attribution.
