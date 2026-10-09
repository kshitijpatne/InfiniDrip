# EPIC-17 / G04 V03 — CLO native button DXF probe — Slice 639 start

## Verified start boundary

- Started `2026-10-09 21:06 UTC` on branch `codex/epic-17-g04` at
  `5ce4942845899d8d8dac23c36925fb6bfda3fd14` (`Slice 638: reconcile V03
  profile rights evidence`). Worktree was clean; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
- S638 is the highest landed slice and S639 is reserved exactly once.
- Canonical board revision 3696: G04-V01/V02 Done, G04-V03 and EPIC-17 In
  Progress. The start replay adds only verified evidence and a note; it must
  preserve all statuses, V03 acceptance, thresholds and holds.
- Goal record inspected at the S638 boundary: active and matches the admitted
  EPIC-17 objective. Keep it active through V03, full gates, safe merge,
  `origin/main` ancestry and any required deployment check.
- CLO 2026.1.310 (r58944) is already open on the S637-imported Woven fixture.
  No prior project has been changed in this slice. All receiver files for this
  trial are restricted to
  `C:\G04-CLO-DXF-Exchange\S639-clo-native-button-dxf-probe\`.

## Evidence-led hypothesis and objective

S637 found that a source-exact circle and a four-quarter-ARC encoding both
failed to render as visible Woven button marks after CLO DXF-AAMA import. Do
not try another hand-authored circle/curve/entity variant. CLO's current help
documents native Button and Buttonhole creation directly on a 2D pattern.
This slice asks a different, falsifiable question: **what DXF entities and
layer/data semantics does this exact CLO build emit for its own native button
and buttonhole objects, and does one clean CLO reimport render them as
readable objects?** This is a vendor-output probe only. Native trim objects
may not be equivalent to technical pattern marks.

Official starting reference: CLO Help Center, `[Tool] Create Buttonhole`,
https://support.clo3d.com/hc/en-us/articles/115000837467--Tool-Create-Buttonhole,
and `Create Buttons along Pattern Outline`,
https://support.clo3d.com/hc/en-us/articles/360025286854-Create-Buttons-along-Pattern-Outline.
They describe creating objects in a 2D pattern and configuring quantity or
position. These documents do not establish DXF export semantics or industrial
standard conformance. The live 2026.1.310 UI and actual local export are the
subject of the experiment.

### Exact source target for the probe

The source mark inventory was extracted from the existing S629 analyzer report
of the exact S637 source copy. That report pins its source to the S628 Woven
fixture SHA-256
`DFF3C0A680976D620510AAF502FA109021BD7B7DAE9B6F0EAAB1A794D20CDFB6`; the S637
source copy has the same hash and byte count. The intended one-to-one target is
the highest button/buttonhole pair in the pattern source, which avoids guessing
or using a generic construction convention:

| Source piece | Source mark entity | Exact location (cm) | Trial object |
| --- | --- | --- | --- |
| `IDR_WOVEN_WOVEN_BUTTON_PLACKET` | entity 5, `MARK_BUTTON` CIRCLE | center `(227.476, 67.877)`, radius `0.15` | One native CLO button at the circle center |
| `IDR_WOVEN_WOVEN_BUTTONHOLE_PLACKET` | entity 5, `MARK_BUTTONHOLE` POINT | `(236.476, 67.877)` | One native CLO buttonhole at the point |

These are direct source-report coordinates. They establish target identities
and points, not the native CLO object's size, type semantics, or 2D screen
mapping. During the trial, use CLO's own precise placement input if available;
otherwise record the placement uncertainty and do not call the output an exact
source-mark match. No source DXF edit is authorized.

## Procedure and acceptance for this slice

1. Preserve the already imported S637 project to a new, clearly named project
   inside the S639 C: folder before changing the UI document. Never overwrite
   the S637 project or source DXF.
2. On that disposable copy, add one CLO-native button and one CLO-native
   buttonhole at the exact source targets in the table above. Keep all original
   pattern outlines, source marks, geometry and settings fixed. Record exact
   screen operation, target piece identities, UI positions, layer-count/style
   properties and any limitation on placement accuracy.
3. Export once through CLO's documented DXF-AAMA menu to the S639 C: folder.
   Parse and hash the file; compare against the pinned source to identify all
   button-related entity, layer and metadata changes. Do not alter units,
   import settings, source marks, or unrelated geometry.
4. If the result is a valid, finite DXF and CLO offers a clean reimport without
   modifying the saved test project, import it once into a fresh CLO document
   and save an actual detailed 1:1 render. Compare button and buttonhole
   visibility separately. Stop if this pre-export/reimport render fails or
   cannot be isolated; do not cycle settings or entity encodings.
5. Record whether the emitted native objects map to source `MARK_BUTTON` /
   `MARK_BUTTONHOLE` evidence or instead represent physical CLO trims with
   different semantics. Do not conflate those categories.

Success for S639 means only a reproducible, hash-pinned observation of the
native CLO output and reimport behavior. It does not clear any V03 gate by
itself. A useful output encoding may justify a separately bounded source-format
trial only if it has a precise source-preserving mapping and the next trial is
non-duplicative. A failure closes only this hypothesis.

## Acceptance, holds and non-goals

- Keep V03 profile/rights/conformance, units, exact CUT/SEW geometry,
  all-seven recipes/options/grades, identity/relationships, marks/layers,
  malformed input, repeated exchange, and detailed readability gates as
  recorded in S638. Keep the `0.001 cm` geometry limit and every hold.
- Treat `CLO 2026.1.310 DXF-AAMA` solely as the current vendor-mode test path;
  make no ANSI/AAMA or ASTM conformance claim and reproduce no paid standard.
- No production source or stitch-graph changes, geometry or marker-source
  changes, acceptance/status changes, DXF writer changes, legacy behavior
  changes, protected output identity changes, purchases, supplier contact,
  release claims, physical fit or factory-acceptance claims.
- No export of the original S637 source without the appropriate pre-export
  geometry gate. No new export fixture in any location outside the named C:
  folder.
- No OpenCode/Claude delegation: this is one live application trial requiring
  direct observation, and there is no disjoint low-risk repository work that
  would shorten the critical path. Codex owns capture, analysis, and review.

## Required verification and exit evidence

- Preserve SHA-256/size for source DXF, copied CLO project before and after
  native additions, exported DXF, parsed entity report, reimport project, and
  rendered output. Keep all raw files under the named C: folder.
- Review actual rendered 1:1 output; a successful API call alone does not pass
  the visual check. Compare pattern outlines and unrelated entities against
  the source; no baseline or accepted tolerance may move.
- Run targeted offline parser/hash assertions, applicable focused Control
  Center tests, start/exit validated board replays and `git diff --check`.
  No production-code change is planned; if there is one, add focused tests and
  demonstrate 100% changed-code statement/branch/function/line coverage.
  Defer full repository coverage/build/browser gates until the settled Epic/PR
  candidate.
- Close with exact observation, passed/failed/pending gates, current holds,
  board revision, commit, and separately timed implementation/UI work,
  focused verification, external-agent waits, and maintainer decisions.

## Single next action

Protect the current imported project under the named S639 C: folder, then run
one CLO-native Button/Buttonhole DXF output and reimport probe. If the native
objects cannot be placed or safely exported on the disposable copy, preserve
the exact concrete UI obstacle and stop this hypothesis without touching the
loaded S637 source project.

## Initial UI interruption (superseded; 2026-10-09)

Computer Use confirmed the existing CLO 2026.1.310 process and Woven workspace.
The attempt to open the File menu failed before the click was dispatched because
the window handle was no longer usable. During the prescribed one-time handle
recovery, Computer Use reported that the physical Escape key had stopped the
session. UI automation was stopped immediately. No File-menu action, Save As,
project edit, import, export, or close occurred. The named S639 C: folder was
created but remains empty. At `2026-10-09 21:09:58 UTC`, a read-only OS process
check still found `CLO_Standalone_OnlineAuth_x64` responding. This is process
evidence only; the UI window was not re-observed after the helper stopped.
Resume this same S639 from a fresh Computer Use observation after the task
regains authorized UI control; protect the source project first, and do not
relaunch or close CLO.

**Superseding execution record:** the same S639 later resumed in the existing
CLO session. It protected the source project, created and edited a disposable
copy, completed one DXF-AAMA export and one clean reimport, and re-observed the
imported project in the current window. The earlier “folder is empty” and “no
UI action occurred” statements describe only this initial interruption and
are not the final S639 outcome. See `S639-exit-packet.md` for measurements,
hashes, limitations and disposition.
