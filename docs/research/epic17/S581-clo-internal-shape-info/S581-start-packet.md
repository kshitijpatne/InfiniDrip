# EPIC-17 / G04 V03 — CLO internal-shape information runtime check — Slice 581 start

## Verified start

- Started 2026-10-09 05:22:32 UTC from S580 commit
  `ad7c28672dc6549b8edf40b9900761a1f7e587d1` on
  `codex/epic-17-g04`; worktree was clean.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  and remains an ancestor of the work branch.
- Canonical board revision 3437: G04-V02 Done, G04-V03 In Progress.
- Highest assigned slice is 580; reserve unique S581.
- Goal record is active and its objective remains EPIC-17/G04 through safe
  merge. Ordinary usage is available (primary 8%, weekly 69%).

## Objective and source review

Run one exact-build, read-only `pattern_api.GetInternalShapeInformation(index)`
query for each of the nine currently indexed CLO patterns. Save raw and
normalized returns only under
`C:\G04-CLO-DXF-Exchange\S581-clo-internal-shape-info`. Inspect connected
shape names, line endpoints/indices and intersections. Compare the returned
paths with the hash-pinned S574 source CUT geometry only if the output and
documented coordinate mapping justify a strict 0.001 cm comparison.

The current first-party CLO API list describes
`GetInternalShapeInformation(patternIndex)` as grouping internal lines into
disjoint connected shapes and returning `CloApiInternalShape` entries named
`InternalShape_0`, etc., ordered by their smallest contained line number. The
type reference gives each entry `name`, `lines`, and `intersections`; each
line carries `lineNumber`, `start`, and `end` points. The list says endpoints
are in pattern-local 2D coordinates but does not specify units or CUT/SEW
semantics. The point getter `GetPatternInternalShapePoints` has a distinct
documented millimeter pseudo-bounding-box frame and an internal-shape index
order; S581 will not substitute that undocumented frame or infer identities.
The current SDK documentation may not match installed .310, so this is a
runtime test, not established app capability.

Sources checked 2026-10-09:

- CLO API List — `GetInternalShapeInformation`:
  https://developer.clo3d.com/list.html (definition at lines 19779–19796).
- CLO API Option & Type — `CloApiInternalShape` and `CloApiLine`:
  https://developer.clo3d.com/optiontype.html (fields at lines 379–401).
- Prior exact-frame caution and non-goals:
  `docs/research/epic17/S579-readonly-boundary-api-screen/S579-exit-packet.md`.
- Prior exact-build boundary probe and geometry mapping:
  `docs/research/epic17/S580-clo-line-info-runtime/S580-exit-packet.md`.

## Limits and acceptance

- The only application queries permitted in this slice are
  `GetPatternCount`, `GetPatternPieceName(index)`, and
  `GetInternalShapeInformation(index)`. No setters, pattern/cut/stitch
  changes, import/export, project save, simulation, cloud transfer, or
  proprietary project decoding.
- Before running, inspect the S581 script and verify it writes only inside
  the named C: folder. Capture one live CLO screenshot after the single run.
- Do not infer piece identity from an index/name alone or assign CLO paths to
  source CUT/SEW roles. Do not fit transforms to claim the 0.001 cm gate.
  Preserve the threshold, every V02/V03 gate, all-seven scope, legacy DXF,
  protected export identities, and all claim boundaries.
- Pass only the narrow API-return subgate if all nine results parse with
  identities and schema-valid shape/line data. A source geometry match is a
  separate result and requires supported units/frame plus <=0.001 cm.
  Incomplete frame/scale evidence leaves that geometry subgate held.
- No acceptance criterion or compatibility claim changes in S581. CLO stays
  open.

## Verification and exit plan

Preflight/replay the validated board start commands at 3437→3439 and the exit
commands at the next two revisions; keep V02 Done and V03 In Progress. Record
the raw response hash, screenshot hash, comparisons/limitations, focused
checks, elapsed execution/review/wait/decision time, and next action in an
exit packet. Run `npm run control-center:test`, syntax/schema checks, and
`git diff --check`; no full repository gate for this evidence-only slice.
No safe independent delegation exists for one live-app query. Continue from
the result without repeating the same CLO action.
