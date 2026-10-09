# EPIC-17 / G04 V03 — Official read-only boundary API screen — Slice 579 exit

## Finding

The current official CLO API list documents a **different** plausible route:
`pattern_api.GetPatternLineInfo(patternIndex)`. It returns JSON with status, pattern index/name, line count, bounding box, and an ordered list of the pattern's outline lines. Each line includes line index, length in millimeters, orientation/location, start/end/mid coordinates, and normalized midpoint. The documented line index matches `GetLineLength`/`DeleteLine` ordering. This is more useful for the S574 imported project than S578's empty point arrays and is a concrete next read-only runtime test.

The docs do not say that `GetPatternLineInfo` returns curve control points or classifies line roles as CUT versus SEW. It may nevertheless expose straight boundary segments and their endpoints/lengths, enough to test whether the imported outer-cut contours survived. Do not assume it resolves curved-edge geometry or the complete CAD interchange criteria until measured against the hash-pinned source.

Other screened methods do not displace this test:

- `GetPatternInternalShapePoints(patternIndex, internalShapeIndex)` returns ordered points for an internal line/shape, but uses a mesh-centroid-derived pseudo-bounding-box frame that may differ by several millimeters from the visual top-left. It does not document CUT/SEW identity and would need a separately verified transform/shape enumeration before source comparison.
- `GetSeamlinePairGroupListInPattern` returns group indices only; `GetAllStitchProperty` returns stitch-property JSON. Their documented summaries do not promise the per-edge coordinates needed for the current geometric comparison.
- `ExportPatternJSON(path)` is a writer, not a getter; the API list calls it generic pattern-information export. CLO's changelog mentions boundary/seam line IDs and seam-pair relationships in that JSON but does not document a complete contour payload in the API signature. Do not substitute it for verified boundary geometry without a targeted schema review.

## Evidence and limits

All claims come from current first-party CLO Developer documentation reviewed 2026-10-09:

- [CLO API List — `GetPatternLineInfo`](https://developer.clo3d.com/list.html), definition at lines 11458–11483.
- [CLO API List — `GetPatternInternalShapePoints` and `GetPatternOutlinePoints`](https://developer.clo3d.com/list.html), definitions at lines 11795–11822 and 12011–12027.
- [CLO API List — seam group and stitch getters / `ExportPatternJSON`](https://developer.clo3d.com/list.html), definitions at lines 10589–10700 and 10774–10785.
- [CLO Changelog](https://developer.clo3d.com/changelog.html), `ExportPatternJSON` history notes boundary/seam-line identifiers and seam-pair relationships.

Official source proves documented return shapes only; it does not prove API availability or useful output in CLO 2026.1.310. S578 established that the count/name/outline methods run in .310, but the outline points were empty for all nine visible patterns. No app or project action occurred during S579.

## Disposition and next slice

S579 passes its documentation screen: there is a distinct documented read-only outline-line query that merits one exact-build runtime test. Next S580 should call only `GetPatternLineInfo(index)` for the nine existing S574 patterns, save its returned JSON under the named C: slice folder, compare pattern identity, line counts/bounds/endpoints/lengths to the hash-pinned source CUT contours where coordinate frames permit, and inspect actual rendered state only as needed. It must not call `DeleteLine` or any setter, save the CLO project, export another DXF, infer CUT/SEW role from line name, or claim import-stage attribution unless the actual comparison supports it. Preserve the 0.001 cm threshold and every V02/V03 gate.

No acceptance criterion passed or changed in S579. V02 remains Done and V03 In Progress on the board; legacy DXF, protected output identities, all-seven V02 scope, and all claim boundaries stay unchanged. CLO remains open.

## Verification and timing

- S579 started 2026-10-09 05:02:39 UTC from clean S578 commit `05d05a8f`; refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor; highest assigned slice was 578.
- Start board replay: 3429→3431; exit replay: 3431→3433. EPIC-17/G04-V03 stayed In Progress; G04-V02 stayed Done.
- `npm run control-center:test` passed 42/42; start/exit preflights and CLI replay guards passed at 3429→3431→3433; `git diff --check` passed.
- No production source/tests changed; no full repository gate due. No safe delegation; external-agent waits 0m; maintainer-decision time 0m.
- Total elapsed time: approximately 1m26s (05:02:39–05:04:05 UTC); official API source screen ~55s; verification and durable closeout ~31s.
