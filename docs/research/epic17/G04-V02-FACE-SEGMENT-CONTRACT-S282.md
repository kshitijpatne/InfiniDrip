# G04 V02 source-backed face-segment contract — Slice 282

## Start and authority

- **Goal:** continue the explicitly admitted EPIC-17/G04 V01 → V02 → V03
  sequence through final evidence, safe merge and deployment verification.
- **Slice start:** 2026-09-30 03:53:37 UTC.
- **Starting Git:** clean at `a082495286808044ccadcdb3e8802b8ea96b6091`
  (`Slice 281: hold unsupported flat projections`) on
  `codex/epic-17-g04`. Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. S281 is the
  highest active/reachable slice; S282 is uniquely reserved.
- **Starting board:** canonical `ops/control-center/data/board.json`, revision
  431; the validated S282 start comment was saved at revision 432. EPIC-17 is
  In Progress; G04-V01 Done, G04-V02 In Progress, G04-V03 Backlog. S281's
  verified exit evidence remains linked to G04-V02.
- **Authority:** admitted V02 source-to-view mapping and the explicit
  maintainer response “Authorize source-backed view metadata.” This permits
  face landmarks and multiplicity only where construction evidence supports
  them. It supplies no contour, split, or instance fact for a particular role.
- **Dependencies:** S277 projection contract, S278 geometry compiler, S279
  live projection, S280 fold metadata, S281 rendered/source review, the
  current `Block.stitches`, pattern endpoint identity, and the exact recipe
  maps. Re-read this packet and `PROJECT-STATE.md` before implementation.

## Slice boundary

Audit the authored interface traversal and topology behind the remaining
face-segment blocker. Define a fail-closed metadata rule for a split that is
derived from an ordered named stitch interface and a source-shared junction,
and record which candidate components satisfy every precondition. Establish
whether segment visibility and view-instance multiplicity can both be
determined without relying on a screenshot, an unreferenced interior point,
or `Piece.onFold` alone.

This is a source/contract research boundary. It may not change `Piece`, pattern
coordinates, cut geometry, seam allowances, drafted options, or export
behavior. Any implementation belongs to a later uniquely numbered slice and
must consume only a validated contract. Unsupported roles remain held.

## Source audit questions and initial evidence

1. Does an ordered `Stitch` identify an exact transition between face-owned
   source segments, with edge reversal and a source-shared junction consistent
   with adjacent named seams?
2. Can that junction be mapped onto a receiving source edge without guessing
   an interior contour split? If not, which source landmark is absent?
3. Does the same source establish the complete contour segment and the number
   and symmetry of view instances, or only the sewn interval?
4. Do the candidate rules hold for every declared option endpoint and exact
   live draft, with visible source guidance on any failure?

Initial code evidence, verified against the live default draft and varied
measurement inputs:

- `src/drafting/skirt.ts` authors both front and back `waist` edges from the
  center-fold endpoint to the side endpoint. The named side-seam relation
  joins front/back side edges in matching order. The waistband relation
  currently lists front waist then back waist without reversing the back
  reference. Because `src/render/technical-flat-assembly.ts` consumes ordered
  edge direction, this ordering puts the first interface boundary at
  front-side/back-center instead of the shared front-side/back-side endpoint.
  `draftSkirt(STANDARD_M)` gives both waist edges `(0,0)` to `(23.5,0)`, and
  both `sideUpper` edges start at `(23.5,0)`. Reversing the back-waist
  reference begins that second interface at its authored end, which equals the
  back-side seam start. A temporary source probe at waist/ease `(70,2)`,
  `(84,10)`, and `(112,12)` confirmed the equality and current traversal
  mismatch for all three drafts; the temporary file was removed.
- Algebraically, each authored panel waist length is `(waist + ease) / 4`;
  the combined half circumference is `(waist + ease) / 2`. The waistband
  seam is a straight edge from `x=halfCirc` to `x=0`; after reversing the back
  reference, the ordered front/back interface boundary resolves exactly at
  its midpoint. The named straight `top` edge has the same span in the
  opposite direction, so the boundary has a deterministic corresponding point
  there. This is source-derived view metadata, not a drafted vertex or an
  authored notch.
- `src/drafting/waistband.ts` authors a straight strip. Its `seam` edge runs
  from the end side to the fold side; `top` runs oppositely. The `fold` edge is
  a short folded-strip end, not the garment center axis. Source traversal plus
  the exact straight-strip topology locates the split on both long edges. The
  front segment is the waistband seam interval attached to the front waist;
  the back segment is attached to the back waist and the authored short fold
  end. A later projection may reflect only a selected segment across the exact
  sewn-to front/back panel center axis. It must not reflect the whole waistband
  across its own short fold edge. Implemented output still has to demonstrate
  a coherent contour and correct treatment of the generated face boundary.
- Old `SKIRT_NOTCHES` comments/tests call front local waist `t=1`, back local
  waist `t=0`, and waistband seam `t=0.5` the same join. Exact endpoints show
  that description is false: front `t=1` and back `t=1` are side-seam
  endpoints; back `t=0` is center back. The waistband `t=0.5` is the ordered
  side-seam boundary. Do not rewrite legacy pattern-notch coordinates in this
  metadata slice; preserve export bytes and treat any notch-output correction
  as a separately evidenced G04 view-only change.
- Tee/Fitted sleeve-cap edge order can locate sewn cap intervals, but a view
  contour and supported sleeve view-instance rule must be separately
  established. Polo/Woven collar splits remain held without the construction
  reference and explicit landmarks required by S276/S281. Trouser assembly
  cycles and Woven-shirt zero-length vent edges remain separate blockers.

## Acceptance criteria

1. Trace candidate roles to exact `Block.stitches`, `EdgeRef.reversed`, edge
   endpoints, adjacent seam endpoint identity, projection role/face maps, and
   actual draft instances. Distinguish source facts, derived values and
   unresolved product/source facts.
2. The contract accepts a split only where a named ordered source relation
   assigns each adjoining segment to a specific role/face, traversal direction
   is explicit, the join resolves to an exact shared source endpoint or
   explicitly source-declared interface boundary, the target geometry provides
   an unambiguous corresponding contour, and visible edge accounting remains
   complete. A derived interior point may be introduced only by a typed
   source-interface-boundary reference that resolves the exact ordered stitch
   edge boundary against the live block and revision; it cannot be a raw `t`
   chosen from appearance. Otherwise the face remains held with actionable
   source guidance.
3. Define same-block/revision and option-topology validation, provenance for
   every split/instance, deterministic behavior under reversed traversal, and
   rejection of missing/duplicate/inconsistent mappings. Never infer
   multiplicity from `onFold`, cut quantity, stitch length or appearance alone.
4. Record whether a bounded construction-source correction is needed before
   implementation. The Skirt back-waist `EdgeRef` must traverse in reverse so
   the interface boundary agrees with both `sideUpper` endpoints. Treat this
   as an ordered sewn-interface metadata correction: no authored edge
   coordinates, piece shape, cut, seam allowance or exported pattern notch may
   change. Give its focused assembly/projection and byte-identity checks a
   separate implementation boundary.
5. No production implementation is required in this research slice. Run
   `git diff --check` and `npm run control-center:test` after linking the packet
   and evidence through the validated board. No full repository coverage run.
6. Update this packet, `PROJECT-STATE.md`, `ARCHITECTURE.md`,
   `CONTEXT-INDEX.md`, the admission decomposition and canonical board with the
   source audit result, timing categories, blockers, and one next gated action.

## Non-goals, holds and gates

- No pattern/cut-coordinate or canonical geometry change in this slice; no
  rendering acceptance or V02 closure from a source contract alone.
- No inferred view instance, whole-role sleeve/collar reflection, arbitrary
  curve split, seam-line or topstitch inference, or partial accepted face.
- No G09/D04 assembled views, G05 tech-pack content, recipe addition, physical
  sample, supplier contact, launch spending, hosted service, or production
  readiness claim. Preserve legacy DXF and protected export byte identities.
- MQF-004–007, MQF-011 and MQF-012 remain `To be reviewed` for the later
  successful V02 rendered exit; MQF-015 is assigned to V03. Respect the manual
  findings' post-G17 deferrals.
- V03 receiver/version/profile rights are a separate gate and remain
  unresolved. No receiver or exact CAD compatibility claim is selected here.

## Blockers, risk and delegation

- **Blocking technical fact:** a source-ordered stitch boundary is useful only
  if it agrees with the adjacent side-seam identity and establishes the actual
  face-visible contour. Conflicting order or missing instance/contour evidence
  must remain visible and held.
- **Risk:** the current assembly solver treats interface direction as
  meaningful even though length-only stitch checks do not. A traversal repair
  can change rendered placement and notch semantics while preserving every
  drafted coordinate; it needs explicit source tests and full browser review.
- **Delegation:** no safe disjoint low-risk task was identified. This audit
  crosses ordered-stitch semantics, projection contract, assembly and rendered
  evidence. Codex owns it; external-agent waits are expected to be zero. No
  OpenCode substitution is planned.
- **Effort/date:** this is one bounded source/contract boundary within the
  current 27–31-slice provisional Epic estimate. Re-estimate if the source audit
  requires another correction or a distinct rendered follow-up. Calendar dates
  remain conditional on evidence and gates.

## Exit evidence (complete after audit)

- **Source facts / disposition:** the current Skirt ordered waistband
  interface disagrees with its named side-seam endpoint. Both panel waist
  edges run center-to-side, while the band seam runs end-to-fold. Reversing the
  back reference makes the exact junction front-side = back-side and maps it
  to the straight strip midpoint; the parallel top edge has an exact
  corresponding midpoint. `Piece.onFold` on each skirt panel supports
  reflecting only the segment attached to that face. `waistband.fold` remains
  excluded as a garment axis. Tee/Fitted sleeve contours/instances,
  Polo/Woven collar landmarks, and Trouser cycles/vent edges remain held.
- **Contract decision:** a future source-interface-boundary landmark is
  permitted only when an ordered named stitch identifies it, traversal and
  adjacent seam endpoints agree exactly, receiver topology determines the
  corresponding boundary without an arbitrary parameter, and the view
  instance is tied to the exact sewn-to center-fold panel. The Skirt waistband
  candidate qualifies after the separately numbered reverse-traversal
  correction; no output has yet been accepted. The implementation boundary is
  S283; S284 owns the integrated rendered review.
- **Verification:** temporary source probes passed three parameter cases
  (waist/ease 70/2, 84/10 and 112/12), each checking eight source-point and
  length conditions; both temporary test files were removed. Existing
  `src/drafting/stitch.test.ts` and
  `src/render/technical-flat-assembly.test.ts` passed 44/44. Final
  `npm run control-center:test` passed 33/33 after updating the board-state
  fixture; `git diff --check` passed. The first
  `npm run control-center:test` correctly failed because the current-board
  regression expected the latest G04 note still to be S281; the test now
  retains an explicit S281-history check and asserts S282 plus its exit
  evidence as current state. No production code, pattern data or export
  behavior changed; no new rendered output is claimed for this research slice.
- **Git/board:** starting HEAD is
  `a082495286808044ccadcdb3e8802b8ea96b6091`; `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Board starts at
  revision 431; the validated start comment is at revision 432. Exit evidence
  `E-G04-S282-EXIT` is verified and linked to G04-V02 at revision 433 through
  the validated command layer. Landing subject is reserved as one
  `Slice 282: define source-backed face-segment contract` commit.
  Landing subject must be exactly one `Slice 282: ...` commit.
- **Acceptance:** passed for the source/contract boundary. V02 output criteria
  remain pending; unsupported components stay held, and Skirt mapping
  acceptance awaits rendered review.
- **Blockers / next action:** S283 implements the source-backed Skirt boundary
  while preserving cut coordinates, legacy DXF and protected byte identities.
  S284 must render/review the integrated 73-configuration/146-face matrix and
  keep unsupported roles held.
- **Elapsed-time breakdown:** source audit/contract research 8m; focused source
  probe and adjacent tests 3m; Control Center regression correction/final run
  and board/whitespace review 2m; agent waits 0m; maintainer-decision time 0m;
  start 2026-09-30 03:53:37 UTC; end 04:06:26 UTC; total 12m49s (workstreams
  overlap).
