# EPIC-17 / G04 V03 — CLO XDATA retention pilot — Slice 588 start

## Verified start

- Started 2026-10-09 06:28:10 UTC from S587 commit
  `712c482956df608941f789b7ff958dbf39f8e041` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  and remains an ancestor. The worktree was clean before S588 files.
- S587 is the highest assigned slice; S588 is unique. Canonical board
  revision 3465 keeps EPIC-17/G04-V03 In Progress and G04-V01/V02 Done.
- The goal remains active. Product-development use and local processing are
  documented. CLO 2026.1.310 is already running and must remain open; the
  current window is the old S584 read-only Python Editor over a rendered
  garment. Do not restart CLO or save over its current project.
- Ordinary usage was 19% primary / 71% weekly at the preceding boundary.

## Objective

Run one controlled, local CLO DXF-AAMA round trip to learn whether registered-
application XDATA entity identifiers survive import/export. Use the
geometry-identical S536 R2000/LWPOLYLINE Polo M fixture as the baseline; add
only a registered APPID table and custom `INFINIDRIP_G04` XDATA records. Keep
all pattern geometry, CUT/SEW layers, mark geometry, coordinate sequence, and
the previously tested header/unit settings unchanged. Measure XDATA retention
and separately record the already known geometry failure.

## Scope and boundaries

- Copy the hash-pinned source fixture from
  `C:\G04-CLO-DXF-Exchange\S536-polo-aama-vertex-preservation\Input\polo-standard-m-lwpolyline-r2000.dxf`
  to the S588 `Input` directory; add deterministic IDs derived from recipe,
  size, piece role, entity role, source revision, and per-piece mark kind/order.
- Add one registered APPID and XDATA strings only. The IDs are
  InfiniDrip-specific metadata, not AAMA/ASTM semantics. Preserve source
  coordinates, entity order, layer names and geometry exactly; verify this
  before any UI import.
- Import once using the documented CLO DXF-AAMA settings from S536, inspect
  the rendered pattern, export once in DXF-AAMA with the same scale/settings,
  and analyze the saved file. Do not re-import a second generation or repeat
  the trial if it has already answered whether IDs survive.
- Put every input, derivative, export, report, and rendered capture in
  `C:\G04-CLO-DXF-Exchange\S588-xdata-retention-pilot`. No DXF exchange file
  may be saved elsewhere on the device.
- No product/test source changes, source-pattern changes, geometry/stitch
  graph changes, baseline changes, new receiver, settings matrix, V03/V02
  acceptance adjustment, or claim change. Preserve the 0.001 cm geometry
  gate and legacy export byte identities.
- CLO must stay open; do not restart or close it. If the app asks to save its
  current project or presents an unexpected modal, stop and report the exact
  prompt instead of risking the existing work.

## Exit gates

Pass this pilot only if the source/variant geometry is exactly identical,
every expected entity ID is unique in the variant, the one CLO operation
completes without an error, output IDs are parsed and classified as
preserved/missing/duplicated/reassigned, and the rendered capture is inspected.
No XDATA retention or loss may be inferred from UI acceptance alone. The five
known Polo CUT failures remain separately measured and held; this pilot cannot
pass V03.

## Verification, delegation, and timing

- Verify the source hash, output hashes, ID count, ID set and uniqueness,
  geometry equality before/after adding metadata, and compare output geometry
  against S536's known baseline.
- Run `node --check` for S588 scripts, focused fixture/output checks,
  Control Center tests, validated board preflight/replay, and `git diff
  --check`. No production change means no changed-code/full-repository gate
  is due.
- This stateful single-app test has no safe independent ownership. Codex owns
  the UI, output, analysis, and review; no external-agent wait is planned.
- Start time: 2026-10-09 06:28:10 UTC. At exit, record fixture creation,
  CLO interaction/render review, focused checks, durable records/board,
  implementation, external waits, and maintainer-decision time separately.
