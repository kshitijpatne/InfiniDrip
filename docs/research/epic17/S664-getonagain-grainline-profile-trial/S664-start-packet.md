# EPIC-17 / G04 V03 — approved grainline profile trial — Slice 664 start

## Start state

- Started 2026-10-10 08:18 UTC from committed S663 `360f73f0d141bfa2013447618bf55f8a8af4f67b` on `codex/epic-17-g04`.
- `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor; S663 is highest landed slice; S664 is unique. Canonical board revision 3874; EPIC-17 and G04-V03 remain In Progress, V01/V02 Done.
- Maintainer approval for the source-derived `idr-pattern-exchange/2` grainline mapping is recorded in `docs/PROJECT-DECISIONS.md` at the S663 boundary. No further approval is needed for this bounded pilot.
- DGS `VID:20250610` is already open with S661's failed hash-pinned Polo M fixture. GMS is also open. Do not close/reopen either CAD session.

## Objective and scope

Create a distinct, C:-only trial copy of the hash-pinned S648 Polo M R14 fixture with exactly one source-resolved `LINE` on `GRAINLINE` inserted into each of the nine existing same-identity piece blocks. Preserve the input file byte-for-byte and preserve every original DXF code/value pair in the candidate. Independently parse and compare the candidate to the original before importing it once through DGS `VID:20250610`, AutoCAD mode, and the exact S661 settings.

The empirical pilot passes only if all nine S661 native grainline warnings disappear, DGS renders all nine pieces readably, and source comparison shows unchanged CUT, SEW, marks, piece identity and centimeter units, with CUT and SEW geometry unchanged within 0.001 cm. Capture the actual warning/result state and output evidence only under `C:\G04-CLO-DXF-Exchange\S664-getonagain-grainline-profile-trial\`.

## Non-goals and gates preserved

- No source pattern or stitch graph edits; no production DXF writer changes in this pilot; no legacy DXF or protected export baseline changes.
- No ASTM/AAMA or other standards conformance claim. This is one empirical, vendor-specific candidate trial.
- No export unless import passes and the receiver output itself is usable. This slice's accepted scope is the single predeclared import test; do not explore modes/settings/encodings or silently proceed to a different test.
- A pass answers only whether the source-derived grainline encoding clears these nine import warnings in this receiver/configuration. It does not pass seven-recipe, 35-grade, mark/layer/identity/sidecar, malformed-input, repeatability, readable-output for the full matrix, export, round-trip, rights qualification or final profile gates.
- Preserve all V03 acceptance, 0.001 cm threshold, all-seven/options/grades, negative-input and repeatability gates, source export behavior and protected byte identities. No physical fit, factory acceptance or production-readiness claim.

## Implementation / verification plan

1. Derive the exact nine DXF endpoint pairs from the S662 source report and confirm block-local coordinate semantics against the parsed S648 blocks and INSERT transforms before emitting anything.
2. Build a deterministic lossless candidate under the named C: directory. Add only the new layer definition (if absent) and nine LINE entities in their identity blocks. Hash-pair the source/candidate and assert all pre-existing code/value pairs and entity payloads remain identical; assert every added line is in its corresponding CUT boundary and units/identity remain unchanged.
3. Re-open the existing DGS document with the candidate through the same import route and settings once. Capture its result. Inspect rendering and native warnings; do not export if any warning or unreadable/lost geometry appears.
4. Compare imported/output geometry and marks to the input with the existing parser/render harness; record precise pass/fail. If the receiver rejects this convention, stop this candidate and update the prioritized V03 matrix; do not try variants without a distinct named gate.

## Delegation

No independent delegation is safe for this slice: candidate generation, byte-level diff, and the single already-open DGS import form one coupled experiment, and any parallel UI/import would invalidate same-session evidence. Codex owns the entire trial and review.

## Acceptance and closeout

Focused builder/verifier checks, candidate and screenshot SHA-256, exact input hash, native DGS result, rendered review, `npm run control-center:test`, `git diff --check`, board start/exit evidence and updated state/admission/context. No production-code change is intended, so changed-code coverage does not apply. Full repository tests/global 100% coverage remain on the settled integrated Epic/PR candidate.
