# G04 Woven blocker decision proposals — Slice 451

## Start boundary

- Started 2026-10-08 00:17:15 UTC from clean S450 commit `700fd68dabe328cf04788ed7b7448b909a4afd6a` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an ancestor. Highest assigned slice is 450; S451 is unique.
- Canonical board revision is 2713. EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog; 56 accepted / 90 held over 73 configurations / 146 faces. Goal record is active and still matches the admitted objective.
- No safe independent delegation: the two Woven blockers are coupled to the shared projection/layer renderer and exact 28-option output; Codex retains source/render integration.

## Scope

Reconcile the S450 technical-drawing search with the exact source and existing all-option rendered evidence. Produce concrete next design-trial proposals only where source topology does not determine a view semantic. No production implementation, source geometry change, stitch change, mapping change, acceptance change, or face release is authorized by this slice. Reuse S417/S441/S443/S447 evidence; do not repeat the resolved search or candidate scans.

## Current exact blockers and evidence classes

### Woven FRONT_FLAT — 28 faces

- **Directly encoded:** `src/drafting/shirt.ts` stitches `outerStand.neckline` to the front and yoke necklines; `underCollar.stand` to `outerStand.collar`; `upperCollar.stand` to `innerStand.collar`; and upper/under collar outer edges together. It does not stitch collar exterior to the body neckline.
- **Approved view convention:** the S359 normalized-arclength/signed-normal projection transfers the collar layers from the source base seam to the body neckline. With supported `collarLeafDepth - standHeight >= 0.5 cm`, the projected exterior passes across the zero-offset body seam. S417 traces two visible contacts per option, one each side, for all 28 exact options at `live-draft:woven-shirt:14:14`.
- **Controlling product decision:** S425 requires one continuous visible body-neckline seam and retains all 28 front holds; its prior clip candidate removes `0.8426–0.8433 cm` of visible seam per side and was rejected. S450's peer-reviewed pattern-piece figure and the inspected collar drafts do not establish this custom block's seam occlusion order.
- **Consequence:** no external evidence found in S449/S450 settles a mapping that preserves the continuous visible seam and removes the two contacts. Keep all 28 fronts held under the current decision.

### Woven BACK_FLAT — 28 faces

- **Directly encoded:** `wovenSleeve()` defines one complete non-on-fold sleeve with `capLeft`, `capRight`, side edges and one full hem; both caps join the body/yoke armhole; the full hem joins `sleeveBand.top`. There is no sleeve-to-sleeve stitch, hem split or over/under order.
- **Existing actual-render evidence:** S373 traces one complete-hem crossing in all 28 standard backs. S441's 28-option local-Y reflection trial removes sleeve-pair/body-outline crossings and fill penetration, but intersects the fixed S370 band-detail boxes in every option. Its successful screenshots relocate each band detail outward by `20.5737–22.4315 cm` and widen the viewBox by `41.1474–44.863 cm`. S440's 3,600-angle screen found no orientation passing its fixed-footprint constraints; S447's 13 authored-taper values also found no viable candidate.
- **Controlling product decision:** S442 explicitly preserves the S370 side-gutter positions and all 28 back holds. S450's pattern-piece, collar and sleeve drawings add no pattern-specific paired-sleeve placement evidence.
- **Consequence:** no evidenced candidate clears the crossings while keeping the approved footprint. Keep all 28 backs held under the current decision.

## Concrete candidate decisions if the maintainer chooses to reopen prior view choices

These are exact **trial** requests, not validated fixes, and would accept no face:

1. **Front visible-seam occlusion trial:** supersede S425 only for the Woven front collar intersection. Preserve the complete source seam, cut geometry, stitch graph and source POM data, but render the collar exterior/opaque collar area above the body neckline so the body-seam stroke is visually covered only over the measured overlap intervals (about `0.8426–0.8433 cm` per side in the existing trace). This tests an explicit “seam continues beneath foreground collar” convention. Tradeoff: users no longer see the continuous seam stroke through the overlap, contradicting S425's current display decision. Re-run the exact 28 options with colorways, boundary closure, no unrelated line concealment and readable output; keep all 28 fronts held unless every applicable check passes. S417's clipped preview is the nearest existing render evidence; it is not this proposed foreground-layer implementation and was previously rejected.
2. **Back sleeve/band layout trial:** supersede S442's fixed-position decision for the back flat only. Use the exact S441 local-Y reflection and relocate only the two S370 detached, explicitly “detail only—not at assembly location” band instances by the already measured per-option `20.5737–22.4315 cm` outward. Tradeoff: materially wider back layout (viewBox grows `41.1474–44.863 cm`) while preserving all source piece geometry, joins and stitch graph. Re-run all 28 options for source identity, exact cap/hem joins, crossings, band/frame spacing, callout/colorway readability and rendered output; keep all 28 backs held unless every gate passes. S441's actual browser output proves geometric viability only with this changed approved footprint; it does not establish source-backed construction semantics.

There is no qualified external drawing that makes either trial a factual construction rule. These remain deliberate view-design decisions. Under the current approved choices, there is no implementation to make without contradicting maintainer decisions; retaining holds is the correct fail-closed state. Both trials would be needed before G04 can meet all-seven V02 acceptance, and neither would start V03 before all V02 gates pass.

## Required gates and non-goals retained

- Preserve all-seven V02 acceptance and V02-before-V03; all 56 Woven and 34 Polo faces stay held until their applicable checks and the integrated gate pass.
- Preserve legacy DXF behavior and all protected export byte identities.
- Keep G09/D04 side/oblique/inside assembled views and G05 production tech-pack content out of scope.
- No new recipe, broad UI redesign, physical sample, supplier contact, launch spending, hosted service, physical-fit/factory-acceptance/production-readiness claim.
- V03 after V02 still requires rights review for a selected receiver/profile and representative observed import/round-trip fixtures. S421 did not qualify a receiver.

## Exit evidence

- This packet reuses, cross-checks and links S417 front-contact tracing, S440 orientation scan, S441 rendered local-Y candidate, S442's fixed-band decision, S443 exact-source findings, S447 taper scan and S450 drawing qualification.
- S450's reference search yields no new source-specific semantic evidence. S417/S441 provide exact measurable candidate impacts, but the candidates contradict current decisions. No code or test changed and no view passed or was released.
- Board start replay advanced 2713→2715; validated exit replay advanced 2715→2719 and attached S451 exit evidence to G04-V02 and EPIC-17. EPIC-17/G04-V02 remain In Progress, V03 Backlog; integrated tally remains 56 accepted / 90 held.
- Focused verification: board preflight/replay, board status/evidence checks, S451 JavaScript syntax and command JSON parsing, `npm run control-center:test` (42/42), and `git diff --check` pass. No production/global coverage/build/export/browser gate was due because no implementation/test changed.
- `get_goal` at this normal boundary confirms status **active**, and the objective exactly matches the current EPIC-17/G04 admitted objective through safe merge.
- Elapsed 00:17:15–00:18:44 UTC (1m29s): source/evidence reconciliation ~32s; packet/state/board updates ~42s; focused verification ~15s; production implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

**Next action:** ask whether to supersede either prior Woven view choice for a narrowly bounded trial, or preserve both decisions and holds. Trial approval would accept no face and would still require full option-wide rendered gates.
