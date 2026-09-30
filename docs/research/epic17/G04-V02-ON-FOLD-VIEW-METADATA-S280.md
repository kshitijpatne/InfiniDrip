# G04 V02 source-backed view metadata — Slice 280

## Authority and admission

- **Authority:** explicit maintainer decision on 2026-09-30, recorded in
  `docs/PROJECT-DECISIONS.md`: G04 may add view-only fold-axis reflection for
  source-declared `onFold` roles when the axis is explicit in construction
  evidence, and face-specific landmarks/multiplicity rules where that evidence
  supports them. No canonical pattern/cut geometry may change.
- **Start:** 2026-09-30 02:17:36 UTC. Clean parent is S279 commit
  `85195cd4d6c89d9abeb9c3be26087ab687d77180` on
  `codex/epic-17-g04`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S279 was the
  highest reachable/active slice; S280 is reserved. Board revision 425 at
  start; its validated start comment is recorded at revision 426. EPIC-17 is
  In Progress, V01 Done, V02 In Progress, V03 Backlog.
- **Dependencies:** admitted V01 construction/source-to-view contract;
  S276–279 projection decisions and renderer; especially
  `G04-V01-SOURCE-INVENTORY.md`, `G04-V02-FACE-PROJECTION-S276.md`,
  `G04-V02-PROJECTION-MAPPING-S277.md`,
  `G04-V02-PROJECTION-GEOMETRY-S278.md`, and
  `G04-V02-LIVE-PROJECTION-S279.md`.

## Scope

Audit the repository's construction records and actual drafted source objects
for explicit fold axes, face-specific split landmarks, and role-instance or
multiplicity evidence. Add only metadata that directly points to those facts
and changes view projection only; preserve authored source geometry and all
cut/export behavior. Keep a source-to-view evidence table with exact role,
recipe, source field/reference, transform or partition rule, and verification
result. If source facts do not establish an axis or face rule, retain the hold
and name the missing fact.

Polo/Woven-shirt exterior collar splits remain held until a specific
construction reference supplies front/back landmarks. Do not substitute an
appearance-based guess, whole-role mirror, stitch endpoint, or general
`onFold` inference. This slice does not promise a V02 exit; S281 remains the
integrated rendered review boundary.

## Source audit findings — implementation basis

| Source fact | Evidence | Permitted use | Still unsupported |
|---|---|---|---|
| `Piece.onFold` marks a half-piece whose left edge lies on the fabric fold. | `src/drafting/piece.ts` documents the field; `src/edit/semantic-edit.ts` requires one named center edge, straight on local `x=0`, and rejects a piece crossing to the other side. Existing semantic-edit behavior is unchanged. | In an exact live draft, bind reflection only to a named garment center boundary on `x=0` when every line/cubic control point is on `x>=0`. The map stores its edge ID, `LOCAL_Y` axis and `Piece.onFold` provenance; stale or malformed metadata is rejected. | `onFold` does not establish role membership in a face, seam visibility, or front/back splits. It does not authorize inferred counts or repeated physical instances. |
| The source defines half-panels in Tee, Fitted, Tank, Polo and Skirt; Woven shirt defines folded back/yoke and collar components; Trouser declares no folded roles. | `bodice.ts`, `fitted.ts`, `shirt.ts`, `polo.ts`, `skirt.ts`, `waistband.ts`; exact runtime role audit across all seven `GARMENTS` drafts. Tee: front/back; Fitted: front/back; Tank: front/back; Polo: front/back plus collar pieces; Woven shirt: back/yoke plus collar pieces; Skirt: front/back/waistband; Trouser: none. | Reflection metadata is dynamic from each exact `Piece` and appears only for a visible mapped role with a valid center axis. Existing cut roles, quantities and the source `Block` remain untouched. | `WOVEN_SHIRT_PHYSICAL_ROLES.quantity` is preserved as a cut plan; it is not converted into view instances. No multiplicity rule is added in this slice. |
| Skirt waistband's `onFold` edge is a folded strip edge, not a garment centerline. | `src/drafting/waistband.ts` describes a `halfCirc` strip whose `fold` edge is at local `x=0`, while its `seam` spans front and back waist edges. The initial S280 browser screenshot showed reflecting this edge doubled the front band. | Explicit G04 exception: show the authored joined segment once; do not mirror this role. Preserve its existing exact view geometry. | Do not infer a full-circumference instance or reflect a folded construction edge merely because `onFold` is true. |
| Polo/Woven collar base and fold landmarks do not locate the front/back split on the exterior contour. | `docs/research/epic17/G04-V02-FACE-PROJECTION-S276.md` §source finding; maintained as `G04_UNRESOLVED_PROJECTION_ROLES`. | Keep the whole affected visible role held; no reflection is emitted for that held contour. | The specific construction reference and authored front/back collar landmarks remain absent. |

The S280 source audit's live draft assertions cover defaults and every declared
numeric option endpoint. Pattern coordinates are inspected as evidence only;
no drafting helper or `Piece` data is altered.

## Acceptance criteria

1. The source audit distinguishes authored construction facts from estimates
   and records exact references for every enabled view rule. `onFold` alone
   never supplies an inferred axis.
2. Any implementation is isolated to G04 view metadata/projection. Source
   `Block`/`Piece`/edge coordinates, drafting, seam allowances, DXF behavior,
   and protected export identities remain unchanged.
3. Reflection uses a documented, explicit source axis and preserves dimensions
   and exact source IDs. Face-specific runs/instances resolve to actual edges
   and landmarks in the same drafted block and revision; unsupported options
   or stale maps fail closed with actionable guidance.
4. Focused tests cover supported and unsupported rules, exact geometry
   preservation, options/revisions and face visibility; every changed
   production module meets 100% statement, branch, function and line coverage.
5. Render production Chromium output for affected cases and manually inspect
   before/after geometry, layers, overlays and POM anchors. A green unit suite
   alone is not visual acceptance. Preserve the S279 rejected outputs.
6. Run focused tests, build, Control Center regression tests if fixtures/state
   change, and protected export identity tests. Do not run the full repository
   coverage gate before the settled integrated Epic/PR candidate unless this
   slice becomes independently mergeable.
7. Update `PROJECT-STATE.md`, `ARCHITECTURE.md`, context, this packet and
   validated board with pass/fail status, evidence, timing breakdown, blockers
   and the next single gated action.

## Non-goals and holds

- No canonical pattern or cut-coordinate changes, new recipe, general
  reflection heuristic, or unreferenced component multiplicity.
- No Polo/Woven collar split without a specific source-backed construction
  reference and explicit front/back landmarks; those faces remain held.
- No V02 completion claim until all required output is coherent and readable.
- No broad UI redesign, G09/D04 assembled side/oblique/inside views, G05
  production tech-pack content, physical sampling, supplier contact, launch
  spending, hosted service, physical-fit, factory-acceptance, or production
  readiness claim.
- Preserve legacy DXF behavior and every protected export byte identity.

## Execution and exit evidence

No safe disjoint low-risk ownership is identified: projection metadata,
geometry generation and visual acceptance share the same behavior boundary.
Codex owns integration; external-agent waits expected 0m. Record implementation,
focused verification, rendered/output review, board/docs closeout, agent waits,
and maintainer-decision time separately. Recheck usage before expensive gates.

## Exit evidence — metadata passed; V02 visual acceptance remains open

- **Source audit:** `Piece.onFold` is documented in `src/drafting/piece.ts` as
  half-piece fold semantics; `src/edit/semantic-edit.ts` validates one named
  center edge on local x=0 and rejects geometry crossing the axis. Runtime
  drafts at defaults and every declared numeric endpoint confirm center edges
  for Tee/Fitted/Tank/Polo body panels, Woven back/yoke and Skirt front/back.
  Trouser has no on-fold roles. Polo/Woven collar roles remain withheld because
  the external contour split landmarks are absent.
- **Implemented:** G04 projection metadata stores exact `Piece.onFold` source,
  center-edge ID and local-y view axis only when every drafted point/control
  point remains on x>=0. The validator rechecks the exact block/revision and
  fails closed for absent, off-axis or malformed source axes. The live flat
  reflects silhouette, darts and off-axis construction marks; it omits the
  duplicated axis edge and keeps on-axis marks, artwork and POM callouts
  single. Reflection uses a derived view primitive identity and leaves source
  coordinates/IDs, draft options, cuts and physical quantities unchanged.
- **Source exception discovered by rendered review:** `Skirt.waistband.onFold`
  describes a folded strip edge rather than a garment centerline. The initial
  full-matrix output was visually rejected when it doubled that band. The
  corrected source mapping explicitly does not mirror this role and preserves
  its authored half-circumference segment. The initial diagnostic matrix and
  screenshots are retained in `docs/research/epic17/S280-reflection-pre-correction/`.
- **Verification:** changed projection/live modules passed 21/21 focused tests
  with 100% statements, branches, functions and lines. Adjacent assembly,
  geometry, options and POM suites passed 31/31. Build passed with the existing
  Vite chunk-size advisory. Protected export/DXF identity suites passed 17/17;
  legacy DXF and all byte baselines are unchanged. `git diff --check` passed.
- **Browser evidence:** before the Skirt exception, the full production
  Chromium matrix covered 146 faces/73 configurations, with 8 emitted and 138
  withheld, and no console/page/request errors. After the exception, a
  production Chromium run re-rendered Skirt front/back: 2/2 SVGs parsed, POM
  checks passed, and no browser errors. Corrected eight-default screenshots and
  SVGs are in `docs/research/epic17/S280-browser/`; the full pre-correction
  matrix is not represented as corrected final evidence.
- **Manual output review:** Tee/Fitted still show sleeve outlines crossing the
  body; the corrected Skirt front waistband remains offset from the front
  panel, although its back band is no longer doubled; Polo/Woven and Trouser
  remain visibly withheld. Tank front/back are symmetric after fold reflection,
  but the required seven-recipe V02 exit is not met. No V02 acceptance claim or
  mapped MQF closure is made. MQF-004–007, MQF-011 and MQF-012 remain `To be
  reviewed` at their relevant successful output exit; MQF-015 remains assigned
  to V03; post-G17 deferrals are unchanged.
- **Board:** S280 start comment is at revision 426. Verified diagnostic exit
  evidence `E-G04-S280-EXIT` was linked at revision 427 through the validated
  command layer; G04-V02 remains In Progress.
- **Elapsed time:** 42m15s from 02:17:36 through board revision 427 at
  02:59:51 UTC (implementation 15m; focused verification, build,
  adjacent/protected tests 8m; full browser run, exception correction and
  targeted rendered review 12m; source/docs/board closeout 7m; agent waits 0m;
  maintainer-decision time 0m).
- **Next action:** Slice 281 reviews exact sew-interface support for remaining
  crossed Tee/Fitted sleeves and offset Skirt front waistband, and records
  source-based fixes or precise holds. Do not close V02 while any required
  face is misleading or withheld.
