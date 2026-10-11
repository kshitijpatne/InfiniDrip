# V03 shortest evidence-led continuation after S696

Older slice estimates are stale. S696 completed its one planned CLO Standard setting check: six of nine CUT contours still fail `0.001 cm`; all nine SEW contours pass; the same three buttonhole marks are misplaced. Exact source regeneration matches the submitted bytes. Full fixed-gate status is in `S696-v03-gate-matrix.md`.

## Stop unnecessary receiver trials

Do **not** run the proposed current-source LibreCAD pilot. The bounded Sol review caught that this test cannot clear the actual root gate: S690 and C04 already establish that LibreCAD 2.2.1.5 / DXF 2000 is generic CAD, not an apparel-industrial receiver/profile. A current-source geometry pass would still leave that admission gate unmet. No more CLO setting/encoding tests are planned either; prior S632/S635 and S696 results already cover those mechanisms, and CLO fails measured geometry/mark checks.

The existing route inventory is conclusive enough to stop speculative trials:

| Existing route | Relevant evidence | Why it cannot presently qualify G04 V03 |
|---|---|---|
| CLO 2026.1.310 | S696 exact current candidate; six CUT failures, three misplaced marks; earlier CLO AAMA malformed-input miss | Apparel CAD capability exists, but measured route fails fixed gates. Retired. |
| GetonAgain GMS V2024.1 | S674/S655: authenticated; source docs and visible importer identify accepted pattern suffixes as DGS/FGS/PTN/PDS/PDF, not DXF; observed GMS route is marker-file-only | It does not provide the required source DXF import/export route. |
| DGS | S661 exact import produced grainline warnings; S668–S670 apparel import/output checks yielded 0/0 pattern geometry or metadata-only output | Tested routes fail before a valid CAD round trip. |
| LibreCAD 2.2.1.5 / DXF 2000 | S690 one older Polo M fixture passes units, 18 contours and 38 marks; C04/S691 explicitly classify it as generic CAD | Useful DXF diagnostic, but cannot satisfy industrial/apparel receiver eligibility. No rerun. |
| OpenCAD Studio | S627 generic DXF evidence | Generic receiver; malformed inputs are accepted and required apparel semantics are unproven. |
| Free/open-source alternatives already researched | S611/S613: Seamly2D lacks a documented DXF apparel-receiver route; OpenPatterns failed the block-table/no-writer check; Richpeace Super V8 lacks documented DXF export for this device; garment.dev is invite-based/hosted and outside the admitted local-only scope | No already researched free/local replacement satisfies the required receive-and-return workflow. Do not install or upload files to these routes. |

## Only defensible re-entry

A V03 receiver pilot may be scheduled only when an **already available and rights-cleared local apparel/industrial CAD profile** has a documented DXF input and return workflow. This is a precise entry condition, not a request for generic construction research or more software guesses. No source-side candidate can itself prove that an external receiver imported, returned, and retained the required geometry/semantics.

On that entry condition, perform one exact current-candidate pilot with no format/setting sweep. It must establish the fixed `0.001 cm` CUT/SEW gate; all marks and meanings; true units/scale; separate piece selectability; piece/revision/grade/seam association with C04-permitted sidecar mismatch rejection; and readable overview/detail output. Stop the route on the first failed fixed gate. Only a fully passing representative pilot permits the existing all-seven/73-option/grade matrix, malformed-input fixtures, repeat round trip, and full readability gate through the same profile. Do not infer ANSI/AAMA/ASTM conformance from a file/menu label.

The maintainer has instructed that goal status stay active until implementation, cleanup, merge and production verification are complete. Accordingly, the goal stays active; V03 remains unaccepted/Blocked on the canonical board. This slice does not weaken acceptance or close the Epic. The exact policy question, if no qualifying route can be made available, is whether to authorize a no-go/scope revision or provide access to a qualifying local receiver; neither decision is assumed here.

## Settled completion gates

After all admitted V03 criteria pass: one integrated full repository 100% coverage/build/browser/output gate; unchanged protected-export identities and legacy behavior; final rendered-output and repository cleanup review; reviewed PR; safe merge; refreshed `origin/main` ancestry; and any required automatic deployment plus production end-to-end check. No physical-fit or factory-acceptance claim.
\n