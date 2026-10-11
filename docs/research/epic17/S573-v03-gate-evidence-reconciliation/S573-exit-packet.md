# EPIC-17 / G04 V03 — Gate evidence reconciliation — Slice 573 exit

## Result

S573 reconciled the admitted V03 acceptance with the current roadmap note
(S558), the original S557 correction, and later practical/CLO evidence. The
documented profile-identity subgate is supported: the current CLO Help Center
documents DXF-AAMA import/export and equates the current option with the older
Gerber DXF-AAMA option; the evaluated receiver is CLO 2026.1.310 with the
recorded settings. The maintainer's written confirmation settles product-
development evaluation and local file handling. A second receiver is
optional, and a normative edition is not a separate admitted prerequisite.

This does **not** establish exact AAMA-edition conformance or compatibility.
The compatibility claim remains held until the admitted technical
round-trip criteria pass. S571 and S572 summaries that label the profile
identity itself “unproven” are too broad; this packet corrects the current
summary while retaining every technical hold and the all-seven V02 gate.

## V03 evidence matrix

| Criterion / claim | Status | Authoritative evidence and remaining work |
|---|---|---|
| Documented receiver/profile identity | **Supported, narrow** | S558's official CLO Help Center evidence names `CLO 2026.1.310 / DXF-AAMA`, current import/export modes, and legacy Gerber DXF-AAMA equivalence. Record settings per fixture. This does not prove formal edition conformance. |
| Rights and local processing | **Settled** | Maintainer's written confirmation, recorded in S557/S558 and project decisions, covers this product-development evaluation and local processing. No further permission question. |
| Exact format compatibility/conformance claim | **Held** | No normative AAMA edition/full conformance map is established. Do not label outputs generically AAMA-compliant. A narrower compatibility claim also requires actual import/round-trip evidence to pass all applicable criteria. |
| Geometry fidelity | **Fail, known fixture** | S545/S552/S536 and later reconciliation find five Polo CUT corners over the unchanged 0.001 cm gate (0.01274–0.01399 cm). S503/S519/S522/S536/S549 already tested relevant point-retention, encoding, and unit variants without clearing them. S572's aggregate-only native property view cannot isolate import versus export. |
| Piece/revision/size identity | **Partial / fail, tested case** | S557 reports 41/41 uniquely associated sew-based blocks across seven M/default outputs. S559's one-size XS CLO path exported M identities. S564's multi-size group labels were present but four non-base sizes failed geometry; S562 provides source-side point correspondence only. |
| CUT/SEW semantics | **Fail, tested cohort** | S557's corrected audit finds nine mixed CUT/SEW assignments on layer 8 across the seven outputs. Numeric layers alone do not identify manufacturing meaning. Requires a source/profile mapping and round-trip proof. |
| Marks and notches | **Unproven** | Of 100 source marks, 22 have direct same-kind/geometry matches and 78 do not. That absence does not prove loss; transformations/splitting and fine rendered detail remain to be resolved. |
| Grades and supported options | **Fail / incomplete** | S559 generated source-backed per-size patterns; S562 maps source sewn vertices across all seven recipes and five sizes. The current generic DXF exports one selected size without grade relations. S564's graded CLO exports failed non-base geometry; S565 corrected only waistband CUT, while SEW and multi-size re-import still failed. No all-seven supported-option grade exchange passes. |
| Malformed input | **Fail, tested control** | S531's tested malformed DXF was silently accepted while an inset SEW contour disappeared. This is scoped to that control, not every malformed file. |
| Round-trip coverage | **Partial, insufficient for acceptance** | Seven M/default generation-two files and major-piece render evidence exist (S557). Tee and Woven measured subsets pass; Polo has the five known contour failures. The cohort does not clear mixed semantics, marks, grades/options, malformed input, or fine-detail review. No extra receiver is required. |
| Rendered/output evidence | **Partial** | Existing screenshots establish gross piece presence/layout; they are too coarse to validate small marks or exact contour tolerances. S572 adds a live successful import/render but its exposed 0.1 mm aggregate lengths cannot verify a 0.01 mm gate. |
| Legacy DXF and protected byte identities | **Preserved to date** | No production source, legacy writer, or baseline changed in S573. Existing regression evidence remains the authority; rerun the complete protected-output gate on the settled implementation candidate. |

The V02 all-seven front/back acceptance remains Done on the canonical board;
this slice does not alter that status. No physical-fit, factory-acceptance, or
production-readiness claim follows.

## Corrected next action

Do not repeat the second-receiver search, normative-edition search as a
standalone gate, S572 point inspection, or previously tested CLO settings.
Profile identity and rights are already documented. The remaining work is to
resolve the measured geometry/semantic/mark failures and produce a valid
source-backed grade/option exchange under the named profile. Prior tests
exhausted current point-optimizer, entity-encoding, and unit variations, so no
verified Polo geometry fix is presently evidenced. The next coding/research
slice must propose one new, technically justified representation or inspect
the source-to-profile mapping for a concrete omitted meaning before any new
CLO export; it must keep the legacy writer and 0.001 cm gate intact.

## Verification and time

- Re-read admitted scope, roadmap S558 gate picture, and S557–S572 linked
  packets. Source status is classified in the matrix above; no new CLO trial,
  broad source search, product edit, or output was performed.
- Board start revision 3405 advanced to 3407; exit evidence/comment are
  preflighted and replayed through the validated command layer. G04-V03 stays
  In Progress; exit replay is 3407→3409 and `E-G04-S573-EXIT` is linked.
  Profile identity correction releases no technical hold.
- `npm run control-center:test` passes 42/42; `git diff --check` passes.
  Documentation/board only; no changed-code coverage or full repository gate
  is due.
- Started 2026-10-09 04:05:40 UTC from S572 `1c22caf`; refreshed
  `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor.
  S573 is unique.
- Elapsed 4m53s (04:05:40–04:10:33 UTC): production implementation 0m;
  focused source/evidence reconciliation 1m50s; external-agent waits 0m;
  maintainer-decision time 0m; durable matrix/context/admission/board updates
  and focused verification 3m03s.
