# G04 V02 — Woven topology and view-boundary audit — Slice 437

## Start boundary and authority

- Started 2026-10-07 19:58:26 UTC from clean S436 `22f077e9b6195e7e57c63bf0b21f4f8fa4a8ded9` on `codex/epic-17-g04`. Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice is 436; S437 is reserved. Canonical board begins at revision 2604; EPIC-17/G04-V02 In Progress, V01 Done, V03 Backlog. Current tally is 56 accepted / 90 held across 73 configurations / 146 faces. The EPIC-17 goal is active and still matches completion through safe merge.
- Latest usage snapshot: primary 17%, weekly 17%; ordinary work remains allowed.

## Scope and decision boundary

Conduct a read-only, source-bound audit of the two remaining Woven V02 blocker classes: (1) the symmetric front body-neckline/collar contour contact and (2) the mirrored back sleeve hem-run crossing. Reconcile exact current Woven source/options, approved mapping and exact emitted path identities with retained intersection traces and rendered crops. Determine whether source topology supports any truthful view-only layer/order that preserves the approved uninterrupted neckline and continuous physical sleeve hems.

This audit authorizes no semantic mapping change, source/cut geometry or stitch change, stroke gap, clipping, acceptance change, or face release. If source/output inspection leaves an actual design decision, document its exact proposed geometry, effect and held faces; do not implement it without approval. Do not reopen approved Woven collar-over-plackets, collar exterior arclength, single base-neckline stroke, or other resolved conventions.

## Required evidence and gates

- Bind the analysis to exact source revision, supported option configuration identities, projection metadata and emitted SVG entities. Preserve same-revision distinctions.
- Trace edge/stitch connectivity, instance transform, visible layer, painter order, intersection station, and existing clips separately for front and back. Reuse S381/S373/S406/S417/S428 evidence where the source and production output remain identical; regenerate only if current source/output differs.
- Compare candidate view treatment only when the evidence supports its physical meaning. The S373 0.60 cm gap remains prohibited absent evidence that hems physically separate; preserve both complete hem runs into source-stitched sleeve bands. Do not interrupt the approved continuous Woven base seam merely to hide the collar contact.
- Keep all 56 Woven and all 34 Polo faces held; all-seven V02 and V02-before-V03 acceptance unchanged; retain Polo's explicit S351 exception and the 0.25 cm general gate, protected export identities/legacy DXF, and V03 rights/profile/import-round-trip gates.
- If a new source-specific construction reference is genuinely unchecked and can establish the exact display fact, record its relevance and limits; do not repeat general construction searches already exhausted.
- Focused audit assertions, actual rendered output inspection as needed, Control Center tests for board changes, validated command replay, and `git diff --check`. No global test/build/coverage gate in this read-only diagnostic slice. No physical fit, factory acceptance, or production-readiness claim.

## Non-goals and ownership

No new construction choice, view mapping, clipping/order, geometry/stitch/POM/schedule, threshold/acceptance or hold change; no G05/G09, UI redesign, supplier contact, physical sampling, launch spending, hosted service, or production claim. No safe disjoint delegation exists because exact source topology, renderer output and prior option-wide traces are coupled; Codex owns the audit and review.

## Start-board evidence

`S437-start-board-commands.json` was isolated-preflighted against revision 2604 and replayed through `executeBoardCommand` to revision 2607. Epic/item statuses and the 56 accepted / 90 held tally were preserved.

## Findings — current exact Woven output

### Binding, source facts, and output review

- **Revision binding:** the S406 production replay contains the current Woven revision `live-draft:woven-shirt:14:14`, 28 configurations and 56 emitted faces with zero compile, renderer, or browser issues. Git path history confirms the later changes in this renderer are Polo-only (S425, S433, S434); S428 verifies the S406 Woven output remains current. The independent S417 and S373 traces each bind all 28 corresponding options to that same Woven revision. Reproducible assertions are in `audit-current-woven-holds.mjs`; its full option results are in `S437-woven-current-hold-trace.json`.
- **Front — directly encoded:** `WOVEN_SHIRT_COLLAR_STITCHES` joins `outerStand.neckline` to `front.neckline` and the back/yoke neckline. Upper/under collar stand and outer edges have their own source joins. There is no direct front-body-to-collar exterior stitch. The body neckline is one continuous edge.
- **Front — approved display convention:** the view projection retains the complete source `front.neckline` as the single visible base-seam stroke and suppresses only the duplicate `outerStand.neckline` stroke; S406 already paints the full body seam after the collar contours. The S417 exact SVG trace finds two mirrored contact stations per option between that path and both upper/under collar contours. Across options, `|x|` ranges 0.50330–1.28181 cm and `y` 7.97190–8.57385 cm. Both default and `neckEase-max` Chromium crops show the contact.
- **Front — decision already settled:** S410 tested the only different order that keeps the full seam: it is current output and leaves the same contacts. The reviewed alternative that removes them clips 0.8426–0.8433 cm per side from the visible base seam. The maintainer chose to keep the complete seam and preserve the 28 front holds. Current topology gives no additional contour station or source layer order that changes this. No unreviewed S437 clip/order trial is warranted; do not reopen or alter the approved continuous-seam choice.
- **Back — directly encoded:** `wovenSleeve()` emits one uncut sleeve with a complete straight `hem` from `rightHem` to `leftHem`; `WOVEN_SHIRT_SLEEVE_STITCHES` joins the whole hem to `sleeveBand.top`. The two BACK_FLAT paths share the source sleeve identity and layer, with the second instance mirrored across the approved `back.centerBack` pair. No stitch connects the two reflected sleeves and source defines no crossing station, notch, or over/under relation.
- **Back — approved display convention:** the current paired mapping includes the corresponding half of each source hem. The S373 trace matches both exact S406 output path strings in every option and finds one hem-to-hem crossing in each of 28 backs. Crossing height varies by option between 22.23183, 23.66513, and 24.09501 cm. The actual default Chromium close-up shows both strokes continuing through the crossing.
- **Back — no truthful source-backed separation:** no specific checked pattern reference establishes a gap or over/under relation at this station. The former 0.60 cm interruption is centered on a computed crossing, not an authored feature, and could depict a broken hem despite the full source stitch into the band. S373's approved choice is to preserve both complete hems and keep the 28 affected backs held. No other source-grounded layer/order can resolve the two projected runs without asserting an unencoded physical relation.
- **Rendered output inspected:** reviewed the actual default S417 front crop and S373 back crossing close-up. The first shows two symmetric body-seam/collar contacts with already approved closure/shoulder conventions intact; the second shows the reflected hems crossing with no interruption. These images are retained in S417 and S373; no production output was regenerated or modified.

### Slice exit

- The audit reproduces 28/28 exact front contact rows and 28/28 exact back crossing rows on revision `14:14`. Both hold classes remain unresolved by source topology. The previous product decisions already direct the truthful fail-closed outcome: complete body base seam + held fronts; complete paired sleeve hems + held backs. The all-seven V02 criterion remains unmet until a further source-backed resolution or a new explicit scope/design decision; V03 cannot start before V02 exits.
- No production behavior, pattern or cut geometry, source stitch graph, output, face status, acceptance rule, CAD gate, protected export identity, or claim changed. All 56 Woven and 34 Polo faces remain held; tally remains 56 accepted / 90 held across 73 configurations / 146 faces.
- One first invocation of the new audit harness exposed two harness-only mistakes (an unquoted hyphenated JSON key, then a selector using `data-feature=outline` where the production SVG labels the source sleeve as `silhouette`). Both were corrected in the audit harness; final `node --check` and the 28-option assertion pass. No product code changed.
- **Exit verification:** the validated exit command set was actually applied to the canonical board using `executeBoardCommand`, revision 2607→2613. The first post-replay assertion looked for Epic evidence on the summary-card work item; inspection showed `addEpicEvidence` correctly records it on `board.epics`. The clone preflight was corrected to apply S437 start+exit from committed S436 board revision 2604 and passes at 2613; the canonical-state verifier confirms the same evidence links, comments, statuses and tally. This was a verifier-only correction; no duplicate board commands or status changes were applied.
- `npm run control-center:test` passes 42/42. `node --check` passes for all S437 `.mjs` files; the exact 28-option source/output audit passes; `git diff --check` passes (PowerShell/Git reports only its existing LF→CRLF working-copy advisory for board JSON). No production file changed; changed-production coverage/build/export and the integrated full gate are not due for this diagnostic.
- **Exit board:** 2604→2607 start→2613 exit. EPIC-17 and G04-V02 stay In Progress, G04-V01 Done, G04-V03 Backlog; all current statuses and 56 accepted / 90 held summary preserved. No face accepted.

## Next action

Preserve the reviewed holds. Continue only with a concrete, non-gap view-mapping candidate for the back sleeve pair if one can be derived from the approved armhole joins and retained sleeve geometry; render the exact all-option candidate before asking for a new design decision. Do not implement it or release views without approval and option-wide checks. Do not revisit the neckline clip decision. V03 remains strictly gated behind all-seven V02.

## Elapsed time

2026-10-07 19:58:26–20:05:49 UTC (~7m23s): production implementation 0m; source/output trace and reconciliation ~2m; focused audit harness and diagnosis ~1m30s; retained Chromium review ~1m; durable packet/board/state closeout and focused regression ~2m53s; external-agent waits 0m; maintainer-decision time 0m.
