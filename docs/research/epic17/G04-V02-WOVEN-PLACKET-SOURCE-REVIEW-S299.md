# G04 V02 Woven placket source review — Slice 299

## Start and verified boundary

- **Start:** 2026-09-30 11:55:28 UTC.
- **Goal:** determine whether the existing Woven shirt construction record and its linked standard-placket reference, considered with the now-authorized source-backed front-pair metadata, uniquely establish which physical front instance receives each placket and which finished placket overlaps the other in the technical front view. Activate view metadata only if the specific authored source relations and layer order are explicit. Otherwise record the exact missing source fact and retain the complete Woven face holds. Change no pattern or cut geometry.
- **Git:** clean at S298 `da4c4d5c6163e2c9eebd85858a8096576f7e61e2`, branch `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 298; 299 is uniquely reserved.
- **Board:** canonical revision 540; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. S298 exit is linked.
- **Authority:** maintainer-authorized source-backed view metadata permits only construction-supported transforms, landmarks and multiplicity. It does not support inferring instance assignment or overlap order from appearance. Admission scope remains V01 → V02 → V03; V03 cannot begin until V02 passes.
- **Relevant records:** `docs/research/garments/WOVEN-SHIRT-RESEARCH.md`, `docs/research/epic17/G04-V02-WOVEN-BODY-VIEW-METADATA-S293.md`, `docs/research/epic17/G04-V02-WOVEN-FRONT-PAIR-METADATA-S297.md`, `src/drafting/shirt.ts`, `src/drafting/shirt-contract.ts`, and the linked W5 Closet Core Kalle standard-button-placket sew-along.

## Scope and acceptance

1. Trace the current Woven physical front quantity, named front/placket interfaces, source edge geometry, role IDs, and any source-authored left/right instance bindings and construction order.
2. Compare those facts with the admitted Woven construction research and the exact claims made by the linked W5 sewing source. Distinguish a general construction example from a pattern-specific instruction.
3. Add front-instance or layer-order metadata only if the sources uniquely bind both plackets to the current authored physical instances and specify their finished overlap order. Any production change must be view-only, revision/topology validated and preserve source IDs.
4. If either mapping remains ambiguous, make no production change, retain all 56 Woven option/face requests held, and record the precise missing source artifact or rule.
5. No cut geometry, canonical pattern coordinates, generic DXF behavior, protected export bytes, partial front output, or other recipe changes.
6. For a research-only exit, run the focused Control Center suite after the validated board update and `git diff --check`. If production changes, also require 100% changed-module coverage, focused flat tests, build, protected identities, all 28 Woven configurations/56 faces in production Chromium, retained and manually reviewed output, and Control Center tests. The integrated global coverage gate remains for the settled Epic/PR candidate.
7. Preserve MQF-004–007/011/012 as applicable output review checks, MQF-015 as a V03 gate, and all post-G17 deferrals.

## Non-goals, dependencies and ownership

- No sleeve-cap split, collar landmark, generic sewing convention adoption, new garment recipe, side/oblique/inside assembled view, tech-pack content, physical sampling, supplier contact, launch spending, hosted service, or CAD receiver/profile.
- Woven V02 remains dependent on complete sleeve, collar, closure and readable-output mappings. This slice cannot release a partial view or declare V02 accepted.
- No safe independent low-risk delegation exists: source interpretation and any metadata decision share the same fail-closed assembly boundary. Codex retains source/diff/output review. External waits: 0m; OpenCode is not invoked.
- Effort and dates remain conditional; one bounded source-backed map-or-hold slice.

## Start status

The exact authored record describes two fronts, one button placket and one buttonhole placket, and separate sewing interfaces to right/left center-front boundaries. S293 records that current typed interfaces still target one `front.centerFront` role edge and do not name physical front instances or an overlap layer. S297 adds validated source-declared quantity-two physical-pair reflection. The W5 reference needs a precise claim comparison against the current two-separate-placket construction before any order is encoded.

## Exit record

- **Source findings:** the Woven construction record inventories two physical fronts and two separate folded plackets. `WOVEN_SHIRT_PLACKET_STITCHES` labels the button placket to the right front center-front and the buttonhole placket to the left front center-front, but each typed stitch still targets the same `front.centerFront` role edge. `WOVEN_SHIRT_PHYSICAL_ROLES` declares front quantity two; no placket role carries a typed front-instance or layer-order field. The two drafted plackets are made from the same `frontLength` and option values; their authored differences are button versus buttonhole marks. Neither has a source mark that identifies top/bottom order or a distinct front-side instance.
- **Construction source review:** the linked Closet Core W5 Kalle sewalong (retrieved 2026-09-30, https://blog.closetcorepatterns.com/sewing-standard-button-placket-kalle-sewalong/) describes its standard option as a trimmed right front with one attached placket and a folded left center-front; its sewn result places the twice-topstitched side over the once-topstitched folded side. The same page presents two attached plackets as an alternative, with a contrasting-fabric underside on the bottom placket, but does not assign that position to button versus buttonhole, or bind those pieces to the current Woven pattern's right/left source roles. Its own text notes side reversal between men's and women's shirt convention. This pattern-specific rule cannot be safely transferred to the authored Woven two-piece closure.
- **Disposition:** do not activate front-instance binding or layer-order metadata from the available sources. Keep all 28 Woven configurations / 56 front/back faces held and emit no partial front view. No source pattern, cut geometry, construction source, generic DXF path, or protected export identity changed. V02 remains In Progress and V03 remains Backlog.
- **Verification:** research-only boundary. No production tests/build/coverage/rendering gate applies because no production code changed. `npm run control-center:test` passes 33/33 after updating the latest-board regression; `git diff --check` passes.
- **Manual findings:** MQF-004–007/011/012 stay mapped review checks with their existing `To be reviewed` status; MQF-015 remains gated for V03. No finding expands scope; post-G17 deferrals remain intact.
- **Remaining fact:** a Woven-specific marked assembly reference or explicit maintainer construction decision must bind each separate placket to a specific physical front instance and identify which finished closure layer lies over the other. Until then, preserve the hold. Same-model collar/sleeve evidence remains independently unresolved.
- **Elapsed time:** start 11:55:28 UTC; exit time to record at commit. Source/code trace and source comparison approximately 5m; web reference review approximately 2m; implementation 0m; focused verification/board closeout time to record after gates; external-agent waits 0m; maintainer-decision time 0m.
- **Next action:** continue with the next bounded source-backed V02 blocker while preserving all current holds; do not start V03.

- **Board exit:** validated command-layer mutations linked `E-G04-S299-EXIT` to G04-V02 at revision 544, to the EPIC-17 summary card at revision 545, and to the Epic record at revision 546. The exit comment is revision 547. Final board revision 547; G04-V02 remains In Progress and V03 remains Backlog.
- **Landed commit:** the unique S299 subject is `Slice 299: document Woven placket source hold`; the commit ID will be recorded at the next verified slice boundary.
- **Elapsed time:** 2026-09-30 11:55:28–12:04:35 UTC (9m07s). Approximate categories: source/code trace 4m; primary-reference review 2m; durable packet/docs/board closeout 2m; focused Control Center tests and diff check 1m; implementation 0m; external-agent waits 0m; maintainer-decision time 0m.
