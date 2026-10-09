# EPIC-17 / G04 V03 — Current gate reconciliation — Slice 589 exit

## Result

S589 reconciles S573's corrected admission matrix with the practical and file
evidence through S588. The row-by-row current ledger is
`V03-CURRENT-GATE-MATRIX-S589.md`; the updated roadmap summary now reflects
the current technical holds rather than the obsolete assumption that CLO
access/rights were still missing.

**Permission is settled. Profile identity is documented. Compatibility is not
proved.** CLO 2026.1.310 / DXF-AAMA is the narrow tested profile identity and
the maintainer's written local/product-development authorization remains
settled. The tested routes nevertheless fail technical checks: five Polo CUT
contours exceed the fixed 0.001 cm threshold; CUT/SEW output semantics mix;
grading/options and complete mark mapping are incomplete; one malformed input
was silently accepted with an inset SEW contour missing. Render evidence
proves gross presence, not fine detail. All-seven two-generation M/default
fixtures exist (41 pieces), but they do not pass all V03 gates.

S588 separately shows that its tested CLO DXF-AAMA operation retained 0/56
custom registered-app XDATA IDs. The one rendered snapshot shows nine pieces,
but the export geometry is not attributable: `Draw Curve Points` differed
from the pinned setup and the live scene contained two pre-existing inserts.
Therefore the prior controlled geometry findings remain authoritative.
The XDATA mechanism is closed for this tested path; no universal CLO/DXF
claim follows.

## Prioritized continuation

1. S590 should inspect the exact five failing Polo CUT source paths and
   hash-pinned outputs for one distinct, falsifiable representation change.
   Account for vertex order, precision, duplicates/near-duplicates,
   curve/bulge representation, and the localized missing vertex; compare with
   the already tested R2000/LWPOLYLINE and connected-LINE alternatives.
2. Do not touch the 0.001 cm threshold or legacy writer. Do not run CLO until
   the candidate is materially different for a source-supported reason. If a
   credible candidate emerges, run one clean-scene, pinned-setting exchange in
   its own C:-only slice folder and inspect exact coordinates and rendered
   output.
3. After geometry passes, separately prove piece/revision/size identity,
   CUT/SEW layers, marks/labels/notches/allowances, size grades/options,
   malformed-input reporting, fine rendered detail and representative
   all-seven repeated round trips. Keep G04 open until all gates pass.
4. Run final full repository 100% coverage/build and protected export identity
   gates on the settled Epic/PR candidate, then final output review, PR, safe
   merge, ancestry and any required deployment checks.

No maintainer decision is needed at this boundary. The user-confirmed
authorization remains recorded and will not be asked again. No acceptance
criterion, tolerance, source geometry, code, legacy behavior, baseline, or
compatibility claim changed. G04-V02 remains Done; G04-V03 and EPIC-17 remain
In Progress. No physical-fit, factory-acceptance, or production-readiness
claim is made.

## Verification, board and time

- Reconciled S573's gate rows against S547, S559, S562, S564–S565, S573,
  S585–S588 and the canonical board. The matrix names each bounded result and
  next required proof. No DXF was regenerated; no CLO UI action occurred.
- S589 start board replay: 3469→3471. Validated exit evidence/comment replay
  advances 3471→3473; V02 Done and V03/EPIC-17 In Progress remain unchanged.
- `npm run control-center:test`: 42/42 passed. S589 start/exit scripts pass
  `node --check`; exit preflight/replay and `git diff --check` pass. This is
  documentation/board work only, so no source coverage or full repository gate
  is due.
- Started 2026-10-09 06:47:34 UTC from S588 `a02cee4a98a948bb831933f0630bd5b0e31ba81f`.
  Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. S589 is unique.
- Exit: 2026-10-09 06:50:36 UTC (3m02s elapsed). Time ledger: implementation
  0m; focused evidence reconciliation and matrix 2m; board/state/roadmap
  closeout and focused verification 1m02s; external-agent waits 0m;
  maintainer-decision time 0m. Goal remains active and aligned with EPIC-17.

## Next action

S590: source/output geometry diagnosis for the five failing Polo CUT contours,
producing a proposed changed representation and evidence before any CLO
operation. Preserve all gates and keep CLO open.
