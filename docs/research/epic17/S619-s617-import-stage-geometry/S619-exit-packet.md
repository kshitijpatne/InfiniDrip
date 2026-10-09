# EPIC-17 / G04 V03 — S617 import-stage geometry — Slice 619 exit

## Verified result

- S619 began 2026-10-09 13:06:49 UTC from S618 commit `afd6e3e6931091d55012da035bc816a03d0940e0` on `codex/epic-17-g04`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest prior assigned slice was 618. Board start replay was 3610→3612; exit replay is 3612→3614. G04-V02 remains Done and G04-V03/EPIC-17 remain In Progress.
- Read-only comparison of the hash-pinned S617 pre-export CLO project’s nine in-app `GetPatternInputInformation` point lists against the exact S617 exported ASTM DXF CUT contours finds an exact point-for-point contour match for all five affected pieces. The output and native-list maxima are 0.000023 cm or less, against the diagnostic comparison tolerance 0.001 cm. Their reduced point counts already occur in the pre-export representation:

  | Piece | Source CUT points | Pre-export matching list | Exported CUT points | max delta |
  |---|---:|---:|---:|---:|
  | back | 33 | 32 | 32 | 0.0000066 cm |
  | outer collar stand | 54 | 53 | 53 | 0.0000166 cm |
  | inner collar stand | 54 | 53 | 53 | 0.0000190 cm |
  | upper pointed collar | 44 | 43 | 43 | 0.0000228 cm |
  | under pointed collar | 44 | 43 | 43 | 0.0000152 cm |

- This localizes the five missing CUT vertices to before or at CLO’s imported/native pattern representation for this one S617 fixture; the ASTM export carried forward those reduced contours. It does **not** establish CLO’s internal import algorithm, API stage contract, or CUT-layer semantics: the API labels the returned shapes only “Base Line,” and documents neither their original DXF layer nor processing stage. Source CUT-to-native comparisons are retained as diagnostics, not interpreted as layer identity. The existing 0.001 cm failure threshold and all V03 acceptance criteria remain unchanged.
- Evidence is reproducible from the S617 source DXF and project/output, pinned by hashes in the report; new extraction and comparison output are under `C:\G04-CLO-DXF-Exchange\S619-s617-import-stage-geometry\Evidence\`. Comparison report SHA-256: `4291c68fb274388850f378d1ac691d95689cf89e6f01117757ebb86a5dfe6475`. Pre-export project SHA-256: `e98096ac1ac6afabd08dda6e05c8dbc6320013c194c89f2ce90f35cafcadca48`. S617 exported DXF SHA-256: `42db6b2c7974637047bdcb39763a5e677d10b6d4a2696ce13ed837581be46525`.

## Verification and time accounting

- `node --check` and the hash-pinned analyzer passed. The exit preflight validates the five piece/count/delta results and C:-only evidence hashes. Focused Control Center tests: 42/42 pass; `git diff --check` passes. The changed analyzer and preflight are research-only scripts, so production changed-code coverage is not applicable. No full repository gate was run; retain it for the settled integrated Epic/PR candidate.
- Elapsed 17m03s (13:06:49–13:23:52 UTC): analysis implementation and evidence interpretation about 7m; focused verification and durable packet/state/board closeout about 10m03s; external-agent waits 0; maintainer-decision time 0.

## Scope and next step

No exchange was repeated. No source pattern, product code, DXF writer, export baseline, layer semantics, geometry, threshold, recipe coverage, V02/V03 status, receiver/profile claim, or acceptance rule changed. Legacy DXF behavior and protected export byte identities remain untouched; CLO remains open while G04 is active. This single Polo M result blocks the claimed CLO ASTM route for this contour-preservation gate unless a distinct receiver/profile or CLO-supported import workflow can retain these points. It does not rule out other receivers or formats.

Next, use this stage-localized failure to choose a non-redundant, evidence-based V03 candidate or receiver/workflow; do not repeat unit or scale variations on the same fixture. Preserve all seven-recipe, rights/profile, semantics, grades/options, marks, negative-input, repeated-round-trip, rendered-detail, geometry-threshold, legacy behavior, and protected-identity gates. No physical-fit, factory-acceptance, or production-readiness claim is supported.
