# EPIC-17 / G04 V03 — Existing CLO output semantic audit — Slice 525 start

## Objective and limits

Perform one read-only, source-matched audit of existing generation-two CLO
DXF outputs to determine whether output blocks preserve source piece identity
and whether numeric-layer entities map uniquely to source CUT, SEW, and
internal mark categories. The saved S498 files used DXF-ASTM export; S523 used
DXF-AAMA export. Keep these empirical results separated by observed export
mode; do not combine them into a cross-profile compatibility claim. This
addresses the V03 semantics/identity gates without repeating any CLO session,
import, or export.

Use only already generated source and receiver files on C: under the named
`C:\G04-CLO-DXF-Exchange\S498-practical-retest\` and
`C:\G04-CLO-DXF-Exchange\S523-clo-remaining-recipe-roundtrip\` directories.
Write any new analysis and derived evidence only under
`C:\G04-CLO-DXF-Exchange\S525-clo-semantic-layer-audit\`. Pin source/output
hashes, classify each entity by source layer and geometric match, and report
whether each observed output layer has one unique source meaning, multiple
meanings, or no match. Preserve duplicate multiplicity; do not infer semantics
from numeric layer order or visual coincidence.

Do not operate CLO's UI, launch/reopen/close the app, alter source geometry,
DXF exporter behavior, export baselines, tolerances, or acceptance criteria.
Do not claim formal AAMA/ASTM conformance or qualification from empirical
correlation. This audit cannot resolve CLO trial-use/local-transmission rights,
Polo's already measured geometry failure, native grade relationships, the
import warning, or malformed-input acceptance. Keep each of those gates as
recorded.

## Inputs and exact comparison

- Tee, Polo, and Woven shirt: S498 generation-two outputs and source fixtures.
- Fitted, Tank, Skirt, and Trouser: S523 generation-two outputs and source
  fixtures.
- Include every closed CUT/SEW outline and each present mark entity from
  source. Match by entity kind and geometry under the unchanged `0.001 cm`
  tolerance, with cyclic/reverse vertex handling only where existing verifier
  rules allow it. For source marks, compare geometric support and multiplicity;
  do not infer semantic meaning if coincident source categories share the same
  geometry.
- Piece identity is evaluated from source piece name, receiver block/insert
  name, insert count, and whether output geometry remains separable by piece.

## Acceptance and stop rules

- Pass the empirical mapping only per observed export mode, and only if the
  source-to-output entity and piece mapping is reproducible from pinned files
  and every claimed source meaning is unique.
- Mark ambiguous, duplicated, missing, or over-tolerance mappings explicitly;
  no threshold or output identity may be relaxed to obtain a pass.
- A passing empirical map is evidence for this exact CLO build/profile/output
  set only. It does not establish industry-standard semantics, rights,
  physical fit, factory acceptance, native grading, or V03 completion.
- No CAD files are copied into the repository; only the audit program, packet,
  and board evidence are committed. No delegation is safe for this shared,
  source/output-bound audit.

## Verified start

Started `2026-10-08 19:52:36 UTC` from S524 `f5a81c272c3f589747e2374ddd39cd5eaf13703d`
on `codex/epic-17-g04`. Refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest assigned
slice is 524; S525 is unique. Board revision 3211; EPIC-17/G04-V03 In Progress,
V01/V02 Done. Primary usage 14%; ordinary work allowed. S524 confirmed that
Pixie export lacked a verifiable C:-only path; the current CLO session remains
open and will not be interacted with in this slice.

Board start evidence/comment are replayed through the validated command layer
and stored in `S525-start-board-commands.json`. The only implementation is a
read-only analysis tool; no production source changes.
