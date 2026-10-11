# EPIC-17 / G04 V03 — S708 exit: named-block ownership preserves CUT

## Result

The source-to-return audit found that S707's candidate already carried the
`CUT` group-8 value on each cut-outline entity and vertex; LibreCAD changed the
saved CUT entities to layer `0` even though the LAYER table retained `CUT`.
The candidate writer omitted R2000 block records/owners, default model and
paper spaces, a referenced `CONTINUOUS` linetype table entry, and a matching
HANDSEED. S708 adds these records and deterministic handles/owner links to the
opt-in named-piece package, without changing coordinates, entity layer values,
piece names, manifest identity, or legacy output.

One same-route LibreCAD 2.2.1.5 `Drawing Exchange DXF 2000` save/reopen on the
same Polo M fixture preserved all nine CUT entities on `CUT`. This before/
after result supports the combined source-structure correction on this
fixture; it does not isolate which individual record caused the difference,
prove formal DXF conformance, or qualify an industrial apparel profile.

## Exact fixture and observations

- Candidate: `C:\G04-CAD-Interchange\S708-cut-layer-source-audit\polo-m-buttonhole-cross.dxf`, 285,209 bytes, SHA-256 `734E8902D798D0D6FD4F911AF0902FF4C8EE1503B45BE3AABB6F649438FAE1DF`.
- LibreCAD return: `C:\G04-CAD-Interchange\S708-cut-layer-source-audit\polo-m-librecad-roundtrip.dxf`, 212,101 bytes, SHA-256 `1D453AF0B8B26415BDBAC756432BB6ABCE42E97260382988DB3052B0F9BA3B8E`.
- The saved return was closed and reopened in LibreCAD; the nine-piece drawing and semantic layer tree were visibly reviewed without a warning. The returned DXF and machine reports are the retained C:-only artifacts; no screenshot is cited.
- Machine comparison reports: `S708-entity-layer-comparison.json`, `S708-roundtrip-geometry-report.json`, and `S708-mark-identity-report.json` in the same C: folder. The comparison scripts also remain C:-only.
- Source/return: 9 named piece blocks and 9 INSERTs each; the ordered block names are identical. Every returned outline is an `LWPOLYLINE` in its source layer. The 9 CUT and 9 SEW paths have the same ordered vertices exactly after removing redundant consecutive/closing duplicate points; maximum coordinate delta is 0 cm.
- Every one of the 111 typed marks retains its type, layer, and compared coordinate/radius values exactly. Counts: 18 placement points, 45 grainlines, 25 notches, 7 placement lines, 4 foldlines, 3 cutlines, 3 buttons, and 6 buttonhole strokes.
- `$INSUNITS=5` (centimeters) is retained in both files. LibreCAD reopened and visibly rendered the complete nine-piece drawing without a warning.
- The exact same-fixture S707 return had 0/9 CUT entities on `CUT` and 9/9 on `0`; it otherwise retained the same 9 piece identities, geometry, marks, and units. S708's combined object-structure correction changes that observed layer result to 9/9 on `CUT`.

## Gate matrix after S708

| V03 gate | Status | Strongest evidence / remaining proof |
|---|---|---|
| Rights and local handling | Passed for this bounded local LibreCAD evaluation by recorded maintainer authorization | No broader product, receiver, or distribution rights claim follows. |
| Piece/revision identity | Passed for Polo M fixture | Exact 9 block names and 9 INSERT references; all seven recipes, supported options and grades remain untested. |
| CUT/SEW geometry | Passed for Polo M fixture | 18 paths, exact same ordered nonredundant XY vertices (0 cm max delta); breadth remains. |
| Units | Passed for Polo M fixture | `$INSUNITS=5` retained; breadth remains. |
| Typed construction marks and semantic layers | Passed for Polo M fixture | 111/111 typed marks/layers/compared coordinates exact; 9/9 CUT entities now remain on `CUT`, 9/9 SEW on `SEW`; breadth remains. |
| Malformed-input rejection | Unproven for the receiver route | Verify the existing negative fixture and verifier behavior against the chosen exchange route. |
| Repeatability | Unproven | No second generation/round-trip comparison was run in S708. |
| Readable rendered output | Passed only for the reopened Polo M fixture | Complete option/recipe/grade readable-output review remains. |
| Documented industrial-apparel receiver/profile | Unproven; LibreCAD remains generic CAD | The LibreCAD menu's DXF 2000 label is not an industrial apparel profile. No ANSI/AAMA or ASTM conformance claim. This remains a distinct required gate. |
| Protected legacy export byte identities | Passed by focused regression tests at this slice | Reconfirm on the settled integrated full gate. |

## Verification and boundaries

- Focused coverage gate: `named-dxf-blocks.test.ts`,
  `dxf-interchange-package.test.ts`, `dxf-centimeters.test.ts`, and
  `regression.test.ts` passed 29/29. The changed writer has 100% statement,
  branch, function and line coverage. Protected legacy DXF identity tests are
  included in `regression.test.ts`.
- Under coverage instrumentation, the exhaustive all-recipe/all-grade case
  took 32.573 seconds. Its old 30-second test-only timer expired just before
  completion on the first run; the exact rerun completed with a 60-second
  test-specific timeout. Assertions, scope, acceptance limits and coverage
  thresholds are unchanged.
- The validated Control Center suite passes 42/42. Its first run found eight
  stale hard-coded `Blocked` expectations after the canonical board recorded
  active G04-V03 work as `In Progress`; those current-state assertions were
  updated, then the same suite passed 42/42.
- `npx tsc --noEmit` passed after all source/test edits; `git diff --check`
  passed.
- The complete repository suite/global coverage, integrated build/browser and
  final output review remain for the settled Epic/PR candidate.
- All CAD files, comparison reports, screenshots, and one-off scripts stay in
  the designated C: folder. No CAD binary, receiver output, or diagnostic text
  is committed.
- Acceptance, thresholds, all-seven/options/grades, protected identities,
  V03 rights/profile/round-trip gates and cleanup/merge/deployment gates are
  unchanged. No physical fit, factory acceptance, conformance, or
  production-readiness claim is made.

## Slice ledger

- Start: 2026-10-11 01:26 UTC from S707 `913a2b718c218e541a657c9ac4d684f30e88db05`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. Slice 708 was unique.
- Implementation/source audit and UI save/reopen: 25 minutes, 17 seconds.
- Focused verification and board closeout: 5 minutes, 0 seconds.
- External-agent waits: 0 minutes. Maintainer-decision time: 0 minutes.
- Board revisions 4158→4160 at start and 4160→4163 at exit, using preflighted
  `addEvidence`, `addComment`, and `updateStatus` commands. G04-V03 is In
  Progress to reflect active work; V03 acceptance remains unpassed.
- Exit: 2026-10-11 01:56 UTC. Total slice time: 30 minutes. External waits:
  0 minutes. Maintainer-decision time: 0 minutes.
- Landed commit subject: `Slice 708: preserve named-block cut layers in R2000`.

## Next action

Reconcile the current fixed V03 matrix against this result. The same LibreCAD
profile can now support a bounded multi-configuration check for geometry,
units, marks, layers, identities and rendered output, but it cannot by itself
pass the industrial-apparel profile gate. Do not call G04 V03 or EPIC-17 done
until every admitted gate has evidence and the final cleanup, full gates, PR,
safe merge, refreshed `origin/main` ancestry, and required production
end-to-end verification are complete.
