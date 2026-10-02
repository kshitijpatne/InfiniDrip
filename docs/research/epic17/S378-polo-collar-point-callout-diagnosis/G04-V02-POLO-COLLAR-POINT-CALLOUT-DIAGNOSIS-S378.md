# G04 V02 — Polo collar-point callout collision diagnosis — Slice 378

## Start boundary

- Started 2026-10-02 20:13:43 UTC from clean S377 commit `0df6dfd667ffa242aabde3af29eafb8686230236` on `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. Highest assigned slice is 377; reserve unique slice 378. Canonical board starts at revision 1891; G04-V02 and EPIC-17 remain In Progress. All 34 Polo faces remain held; integrated tally is 56 accepted / 90 held across 73 configurations / 146 faces.
- The goal is `active` and still needed through G04 completion and safe merge. Its initial “Begin by admitting” phrase is stale, but the record cannot be edited or resumed with the available goal controls; keep it unchanged and active.
- Primary usage at start is 33% used; ordinary work is allowed. Weekly usage is 83% informational.
- S377 identified two exact base-render failures, `polo-standFrontRise-max` and `polo-collarPointExtension-min`, both caused by the unrelated `Collar point extension` callout with `TEXT_COLLISION`. The source POM defines its measurement on `upperCollar.frontTip` and anchors at that edge's endpoint. This diagnostic will inspect only this blocker and any candidate derived from its exact source mapping.
- No safe delegated ownership: source-edge mapping, same-revision measurement, option-dependent candidate placement, collision screening and rendered evidence are coupled. Codex retains the slice.

## Scope and acceptance

Diagnose the current Polo `Collar point extension` front callout collision in the two exact failing S377 configurations. Trace its source edge, endpoint anchor, emitted mapped geometry, neighboring source features, option values and label/leader search behavior. Confirm what is directly encoded and what is a view-layout choice. Preserve the source POM text, value, tolerance, measurement, source edge, target, revision, cut geometry, stitches, all other callouts, the 0.25 cm gate and every face hold.

- Recreate both exact failing configurations from current recipe source and document the exact `upperCollar.frontTip` source-to-view identity and same-revision point.
- Inspect source-centered overlays and actual whole/detail rendered output. Trace neighboring pieces, edges, labels, leaders, intersections and clearances.
- Test only bounded, explicit layout variants that preserve the complete unchanged text and exact source anchor/target; label any placement convention as a diagnostic proposal. Record candidate space and limits; do not imply an unbounded nonexistence proof.
- If any candidate appears viable, verify it across all 17 supported Polo option rows, including exact text/value/tolerance, geometry clearance, other-label interactions, rendered readability and fail-closed behavior. If no candidate passes, preserve the specific failure and keep output held.
- Produce machine-readable per-configuration evidence plus actual rendered whole/detail views. Inspect output manually and report collisions, crossings, clipping and unreadable output.

## Non-goals and gates

No production renderer, mapping, POM, source geometry, stitch graph, export baseline, gate, board acceptance, face hold or V02/V03 status changes. No new garment, broad UI redesign, physical sampling, supplier contact or production claim. The diagnostic may omit colorway fill only if disclosed; omission cannot establish colorway readability.

Focused gate: reproducible source/options assertions, all candidate rows if any, Chromium errors, manual output review, validated board exit, `npm run control-center:test`, `git diff --check`, board status/evidence consistency. No production code changes are planned; full repository coverage/build/export/output gates remain for the settled Epic/PR candidate unless scope changes.

## Exit record

The reproducible all-option comparison is `collar-point-callout-study.ts`; its JSON matrix, summary, and rendered SVG/PNG evidence are in this folder.

### Source facts and proposed view mapping

- **Directly encoded in recipe source:** Polo's `Collar point extension` is `edgeEnd(upperCollar.frontTip).x - edgeStart(upperCollar.frontTip).x`; its POM anchor is `edgeEnd(upperCollar.frontTip)`, with anchor role `upperCollar` and edge ID `frontTip`. The tolerance is ±0.2 cm. The POM value is 1.5 cm in default, 0.5 cm at the option minimum, and 3.0 cm at the maximum. This measurement is a horizontal source-edge delta; code does not describe any additional physical notch or construction landmark.
- **Directly encoded in the view mapping/compiler:** on `FRONT_FLAT`, the exact anchor transforms with the same revision's `upperCollar` role placement and resolves to `flat:polo:FRONT_FLAT:component:upperCollar:outline`; its exact source entity is `pattern:polo:role:upperCollar:edge:frontTip`. All 17 rows confirm that identity and the transformed point. The assembled `upperCollar` has one source POM marker in this proposal; source cut geometry, reflected outline, and stitches are unchanged.
- **Diagnostic design proposal:** replace only this POM's text/leader with a 0.22 cm radius `C` circle centered exactly on `frontTip:end`; put the complete unchanged text in a one-row `C` schedule below the existing view frame. Draw the marker above the existing geometry/callout layers so it remains visible. Do not add a leader. Preserve every other POM callout. The proposal moves its words into the schedule while keeping the geometry target explicit through its key. It adds no physical landmark claim.
- **Practical effect:** this exact layout clears the `Collar point extension` base-render collision in the two failing option rows, giving an emitted output for those rows. It leaves other crowded callouts and their crossings in place. It does not make the Polo front readable overall or pass V02; the 0.68 cm sleeve-cap residual also remains above the fixed 0.25 cm threshold. This is not approved production behavior.

### Option matrix and rendered findings

- The exact 17 S331-supported Polo option rows were redrafted at `STANDARD_M`, each with `live-draft:polo:S378:<caseId>`. Every C row uses the same source POM ID, exact frontTip target and same-revision anchor. Full source label/value/tolerance strings are unchanged.
- The original measured renderer fails exactly two rows with `TEXT_COLLISION` on `flat:polo:FRONT_FLAT:callout:collar-point-extension`: `polo-standFrontRise-max` (standFrontRise 2 cm, extension 1.5 cm) and `polo-collarPointExtension-min` (extension 0.5 cm). The original C text callout is present in all 17 base views; only those two receive the renderer failure.
- Replacing C with a source-centered marker plus the keyed schedule renders 17/17 diagnostic outputs; the two original failures become renderable. There are zero keyed render issues and zero browser errors. The complete source values and ±0.2 cm tolerance remain in C's row. Colorway fill is omitted.
- Manually reviewed whole default, `standFrontRise` maximum and collar-point-extension minimum; their detailed geometry/marker crops and schedule close-ups; and the default detail. The marker is at the encoded upper-collar endpoint and stays bound to its revision and target. The schedule row is legible in close-up and inside the expanded bottom frame. Existing collar/placket text, joins and crossing leaders remain visibly crowded. This is a localized callout feasibility result, not proof the whole drawing is readable.
- No source change or acceptance change follows. All 34 Polo face holds remain, the integrated tally remains 56 accepted / 90 held across 73 configurations / 146 faces, and V02/V03 status is unchanged. S373's separate Woven sleeve-overlap decision remains pending.

### Verification and remaining work

- `collar-point-callout-matrix.json` records all option values, same-revision output IDs, exact source ID/edge/target, anchor coordinates, unchanged label text, original render errors, keyed render outcomes and schedule metrics. `search-summary.json` records 17/17 diagnostic renders, exactly two original failures, zero keyed failures, zero browser errors, no colorway fill and no production changes.
- Whole/detail/schedule evidence uses actual SVG/PNG output. Selected manually inspected files include `rendered/polo-default-collar-point-whole.png`, `rendered/polo-default-collar-point-detail.png`, `rendered/polo-default-collar-point-schedule.png`, and the matching whole/detail/schedule triplets for `polo-standFrontRise-max` and `polo-collarPointExtension-min`.
- No production code or tests, pattern geometry, stitch graph, POM source, export baseline, acceptance, or hold changed. The full integrated repository gates remain required on the settled Epic/PR candidate.
- **Next decision:** approve the diagnostic C-marker/full-text schedule as a production view convention across all 17 Polo options, or keep C's existing source callout and preserve the two fail-closed rows. Approval would fix only this one annotation and would not clear other Polo overlaps, its residual gate, or any face hold. If approved, implement in a separate slice with all applicable options/colorway/render checks; otherwise continue with the failure and holds recorded.

### Exit verification, board, and timing

- Validated board start commands advanced 1891→1894; the exit command layer added packet, matrix and representative rendered outputs to both G04-V02 and EPIC-17 and recorded the explicit retained-holds conclusion through revision 1910. Both cards remain In Progress; V01 remains Done and V03 Backlog.
- `npm run control-center:test` passes 42/42. `git diff --check` passes. The board evidence references resolve and the JSON matrix, summary, and start/exit command arrays parse. No production files changed, so no changed-production coverage/build/export check applies at this slice boundary.
- S378 elapsed about 8m28s: source/diagnostic script work 3m, focused 17-option render verification 2m, manual rendered review 2m, durable packet/context/state/board closeout 1m28s, external-agent waits 0m, maintainer-decision time 0m.
- Preserve all-seven V02, V02-before-V03, legacy DXF and protected export identities. The C keyed layout is only a diagnostic proposal pending explicit design approval; it does not clear other blockers or any face.
