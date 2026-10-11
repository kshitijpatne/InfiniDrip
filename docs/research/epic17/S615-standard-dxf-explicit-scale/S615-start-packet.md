# EPIC-17 / G04 V03 — Standard-DXF explicit-scale diagnostic — Slice 615 start

## Verified state and objective

- Start 2026-10-09 12:16 UTC on `codex/epic-17-g04` at S614 commit
  `8a2e43de7a65ab0b5f71a1aed5ff174ba86db5d7`. Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and is an ancestor; the worktree
  is clean. S614 is the highest assigned slice, so S615 is unique. Board
  revision 3591 records EPIC-17 and G04-V03 In Progress and G04-V02 Done.
- S614 measured the Standard-DXF path at approximately 0.1× source dimensions
  under cm/100% settings. S615 tests the narrow unit-handling hypothesis that
  the same source parsed as Standard DXF at 1000% import scale restores its
  original dimensions. It is one parameter-sensitivity trial, not a proposed
  product default or a profile qualification.

## Controlled method

Use the exact Polo M source SHA-256
`796e537ec77e86b16d6b82c3aadd4a9982933314097b707ae689936c65944fca`, the same
CLO 2026.1.310 build and Standard-DXF input selector as S614. Change only
import scale from 100% to 1000%; retain centimeters, no rotation, original
grain, notch and curve-point options, and all ASTM / Graded Nest export
settings. Import to a blank disposable CLO scene; export once; reimport the
exact emitted output; measure source/output scale and geometry at the unchanged
`0.001 cm` gate; save rendered evidence. All inputs, outputs and captures must
remain under `C:\G04-CLO-DXF-Exchange\S615-standard-dxf-explicit-scale\`.

## Acceptance, non-goals, and stop conditions

- Acceptance for this diagnostic: report actual scale ratios for the source
  front and identifiable paths, contour vertex changes, import/reimport
  notices/errors, and rendered legibility; hash-pin every artifact.
- This test may establish whether a documented scale parameter corrects this
  one fixture's unit interpretation. It cannot clear all-seven, identity,
  manufacturing-layer semantics, marks, grades/options, malformed-input,
  repeated-roundtrip, rights/profile or full V03 acceptance.
- Do not change source/cut geometry, DXF bytes, export settings, protected
  baselines or acceptance thresholds. Do not rescale the emitted file after
  export. If piece association or dimensions are ambiguous, stop and retain
  the hold. No production-code change, physical sample, supplier contact,
  factory claim or production-readiness claim.

## Verification and ownership

- Codex owns the experiment and review. This single-variable CLO interaction
  has no safe independent ownership split. No external agent is assigned.
- Keep CLO running between slices. Before a scene reset, save a recovery copy
  under the S615 C:-only folder. Run a source-bound scale/contour diagnostic,
  render and inspect output, validate durable evidence/board commands, and run
  focused Control Center checks plus `git diff --check`. No product code
  changes; changed-code coverage is not applicable. Full repository coverage
  remains for the settled integrated Epic candidate.
- Start boundary: commit and board state above. At exit, separately record
  experiment/setup, focused verification, external-agent waits and maintainer
  decision time.

## Single next action

Inspect the existing CLO session and import the hash-pinned source once as
Standard DXF at 1000% scale, changing no other variable.
