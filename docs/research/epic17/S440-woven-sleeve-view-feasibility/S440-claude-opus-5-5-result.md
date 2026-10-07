# Independent research result — Slice 440

## Outcome

**No verified view-only fix was found under the current approved constraints.** Keep the 28 Woven back faces held. This research does not authorize an acceptance exception, source-pattern change, band relocation, renderer implementation or view release.

## Independent report and its limits

The exact Claude CLI model was checked as `claude-opus-5-5`, with `xhigh` reasoning. The completed response ended with `WORK FINISHED`, wrote no files, made no commits, and returned zero web-search and web-fetch requests. It reported that the exact armhole receiver station fixes sleeve translation, the current cap-to-armhole fit fixes the remaining rigid rotation, and center-back reflection preserves the hem intersection. It therefore recommended either retaining the holds or separately authorizing a new decision that changes the current mapping or acceptance.

This is corroborating analysis, not primary evidence: the model used a stale worktree at Slice 260, did not verify that the coordinator checkout matched S439, omitted several required admission/source records, and rendered no candidate. Its reasoned options are not treated as verified implementations or source facts. No external construction reference was found or cited; the code-local question is constrained by this recipe's exact piece and output map.

## Codex source and option-matrix verification

The current source directly defines `wovenSleeve` as one uncut piece (`onFold: false`) with the ordered `capLeft`, `capRight`, `sideRight`, full `hem`, and `sideLeft` edges. The `Woven sleeve-cap ease` stitch joins both cap edges to front/yoke/back armhole interfaces; `Folded sleeve band ↔ sleeve hem` joins the complete sleeve hem to `sleeveBand.top`. There is no source sleeve-to-sleeve stitch, split hem, back crossing station, or sleeve overlap order. The active BACK_FLAT mapping places two sleeve instances mirrored across `back.centerBack`. The complete source shape's rigid transform is fixed by its cap receiver fit and endpoint anchor; rotating the complete piece breaks that cap correspondence. (Source: `src/drafting/shirt.ts`; `src/render/technical-flat-assembly.ts`; `src/render/technical-flat-projection.ts`; mapping in `src/render/technical-flat-mapping.ts`.)

S370 is an explicit maintainer-approved decision fixing complete, unscaled, mirrored band details in the side gutters. Its default boxes are x=[28.5,31.5] and [-31.5,-28.5], y=[17,54] cm; maximum band depth widens the outer x limit to 33.5 cm. S373/S437 show that a 0.60 cm gap would imply an unsupported interruption of a complete hem, so it remains rejected. S438 and S439 already reject body masking and a no-mask source-length contact candidate, respectively.

For a deliberately more permissive diagnostic than a rigid complete-piece placement, the S440 scanner rotates the connected source `sideRight` + `hem[0,.5]` chain about its exact underarm point, while keeping its two segment lengths and their included angle, the S370 details, mirror pair, body/yoke polygons and current frame. This changes the source cap-to-side tangent and is therefore **not** an admissible source-preserving piece mapping; it was tested only to see whether even that extra freedom could satisfy gross linework constraints.

The corrected scanner checks all 3,600 rotations at 0.1° increments against all 28 exact S406 options, using exact segment intervals against the same-revision SVG fill polygons (their cubic boundaries are tessellated into 24 chords). It retains four self-checks for interior crossing, clear separation, boundary-only contact and an interior endpoint. Results:

- 1,196 angles clear the current frame across every option.
- 1,864 clear the fixed band-detail boxes with 0.05 cm padding.
- 3,030 have no proper intersection between mirrored sleeve runs.
- 1,548 keep all runs outside the back/yoke fills.
- 546 pass frame + bands + mirrored-pair checks, in angle ranges 19.4°–48.4° and 296.9°–322.3°.
- **Zero** pass those checks plus back/yoke-fill avoidance; this is zero in each of the 28 options.

The initial scanner used 100 point samples per line, despite overstating its step size in its JSON description. That was corrected before using the result: the new segment/polygon interval check passed its explicit self-checks; the result remained zero feasible angles (the torso-only count changed from 1,549 to 1,548). See `scan-rigid-sleeve-orientation.mjs` and `S440-rigid-orientation-scan.json`.

No candidate survived the geometric screen, so no candidate SVG/render was generated. This is consistent with S440's render-if-feasible gate. Current actual output and its center-back crossings are already shown in the S373/S406 production renders and exact S373 trace. The external model also rendered nothing.

## Decision boundary

- **Direct source evidence:** source piece edges, hem-to-band relation, cap ease and receiver interfaces.
- **Approved view decisions:** normalized-arclength cap depiction, two reflected instances, complete hem/no gap, fixed detached S370 band details, and all-face holds until all applicable V02 checks pass.
- **Not established:** a truthful alternate orientation that keeps the complete cut-piece outline, receiver mapping, existing view frame, bands and no-crossing/readability requirements simultaneously.
- **Smallest decision needed for any different path:** explicitly authorize revisiting an identified constraint (for example the complete-piece cap transform, fixed side-gutter band placement, or source cut/topology). Each would need a new exact proposal and option-wide output evidence. Treating the center-back crossing as acceptable would explicitly revise the current no-crossing V02 gate and conflicts with the standing all-seven requirement; it is not recommended or silently applied.

No pattern-specific reference is left unchecked that could establish InfiniDrip's custom seam placement or sleeve-to-sleeve layer order. General construction guidance cannot supply those source-to-view facts. All 56 Woven and 34 Polo faces remain held; integrated status remains 56 accepted / 90 held over 73 configurations / 146 faces; V02 remains In Progress and V03 remains Backlog.
