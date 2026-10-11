# EPIC-17 / G04 V03 — Exact-path CLO CUT density control — Slice 671 start

## Verified boundary

- Start: 2026-10-10 10:40:05 UTC, after S670 commit `43008d3d` on
  `codex/epic-17-g04`. Worktree clean. Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor of HEAD. The highest
  slice is 670; 671 is unique. Canonical board starts at revision 3970.
- V01/V02 remain Done. V03 and EPIC-17 remain In Progress; no gate or hold is
  passed by S670. DGS is retired by measured no-geometry output. CLO 2026.1.310
  rights/local processing are already confirmed; no manual decision remains.
- The user-approved `idr-pattern-exchange/2` grainline convention, collar,
  sleeve, marker, placket, overlap and Trouser decisions are settled. No new
  decision is requested in this slice.

## One source-bounded hypothesis

S634/S643/S640 identify five CUT contour failures on the hash-pinned Polo M
revision: body back neckline P13 and outer/inner collar-stand plus upper/under
collar-base P14. CLO's point-removal result is 0.012741–0.013974 cm, over the
fixed 0.001 cm gate. The five exact vertices cannot be deleted. Prior testing
already covers POLYLINE/LWPOLYLINE, Standard/DXF-ASTM, connected LINE, SPLINE,
block wrapper, metadata and repeated ASTM output; none cleared those contours.

Test one different, geometrically exact representation hypothesis only: in a
C:-only derivative of the same hash-pinned S617 source, retain every original
vertex, coordinate, piece/block/role identity, units, layers, SEW, marks,
grainline, profile metadata and order; subdivide only the straight source edge
immediately adjacent to each of the five short problematic segments using
collinear points, with maximum subsegment length 0.05 cm. The added points lie
on the exact source segment, so preflight must prove a bidirectional path
residual of 0.000 cm and all original source records/vertices remain. This
specifically tests whether the importer's local point simplification depends
on a long neighboring chord, while keeping the represented CUT path exactly
unchanged. It is an empirical source-to-view test, not an assumption about
CLO internals.

Use the existing CLO 2026.1.310 session and the already-tried Standard DXF
settings on the derivative once. Bind all nine pieces by their proven exact
identities and unchanged SEW paths; compare all nine CUT and SEW contours
against the original generating source at `0.001 cm`, with no alignment or
relaxation. Inspect a whole-layout and detailed crops from the actual native
receiver view. Do not export unless every representative contour passes.

**Decisive result:** all nine source CUT and SEW paths meet `0.001 cm`, all
original marks/layers/identities remain measurable, no warning indicates loss,
and actual overview/detail renders are readable. Only then may a separately
reserved next slice perform one export/clean-project reimport on this same
profile candidate. **Stop:** if the five contours still fail, any exact path
changes beyond `0.001 cm`, any original identity/mark/layer is missing, or the
view is unreadable, retire this precise densification hypothesis; no export,
second density, alternate mode, or acceptance relaxation. The failed result
does not by itself qualify or disqualify CLO globally.

## Requirements preserved

V03 stays unchanged: rights-reviewed documented candidate profile, all seven
recipes, all 73 supported options and required grade cases, exact units and
`0.001 cm` geometry, CUT/SEW and mark/grainline semantics, piece/revision/
inter-piece relations, malformed rejection, repeatability, rendered
readability, legacy DXF behavior, and protected export byte identities. The
`DXF-AAMA`/`DXF-ASTM`/`Standard` menu names are not normative conformance
claims. DGS remains retired. No physical sampling, fit, factory acceptance,
supplier contact, spending or production-readiness claim.

## Delegation and verification

The one live CLO import and source-bound analysis are stateful and coupled;
no disjoint low-risk implementation is safe to delegate. Codex retains the
entire operation. No OpenCode invocation is required. Files go only under
`C:\G04-CLO-DXF-Exchange\S671-polo-cut-source-path-density\`.

Focused gates: hash-bound source/derivative preflight; coordinate-exact
collinear subdivision assertions; actual receiver input query; independent
source-bound contour/mark/layer comparison; saved and visually inspected CLO
overview/detail output; `npm run control-center:test`; `git diff --check`.
No production code is authorized in S671. Full repository 100% coverage,
build/browser and integrated output replay remain for the settled candidate.
At exit record implementation, focused verification, external waits and
maintainer-decision time separately. No elapsed estimate beyond the observed
route is promised; prior slice-count estimates are stale.

## Preflight checkpoint

The C:-only derivative is prepared and independently checked. It retains all
2,724 original DXF group/value pairs in order, all 56 entity records and nine
CUT contours; it adds only 776 collinear VERTEX records to the five named CUT
segments. Maximum numerical collinearity error is below `6e-13 cm`; the
mathematical path residual is 0.000 cm. Source, derivative, report and
source-only annotated render hashes are in `S671-preflight-checkpoint.json`.

The actual receiver import is not yet executed. Windows currently reports the
existing CLO process (PID 62304), but the computer-use surface attached to this
task returns no native applications and exposes browser controls only, with
no desktop window binding. This is recorded as a tool-access fact, not a CAD
result. No V03 gate passes from the fixture preparation or its source-only
render. The single next action remains the exact S671 import in the existing
CLO session when native window control is available; do not regenerate the
fixture or repeat DGS.

The refreshed V03 gate matrix and shortest completion route are in
`V03-GATE-RECONCILIATION-S671.md` and `V03-COMPLETION-PLAN-S671.md`.
