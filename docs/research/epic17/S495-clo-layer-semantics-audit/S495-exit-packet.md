# EPIC-17 / G04 V03 existing CLO layer semantics audit — Slice 495 exit

## Result

S495 rechecked the hash-pinned Tee M, Polo M, and Woven M source/output DXFs
with the existing S475, S476, S477, and S478 parsers and contour comparators.
The C: evidence still matches the recorded inputs and outputs; no exchange file
was replaced or modified by the analysis. The observed output layer names are
numeric (`1`, `2`, `3`, `7`, `8`, `14`, `15`, `84`, `85`, `87`) rather than
source-semantic labels. Several source contours are represented by multiple
coincident output polylines on those numeric layers. Geometry establishes
correlation and multiplicity, but does not identify a unique layer contract:

- In Tee M, each of the six source CUT outlines has coincident output copies
  on layers `1`, `84`, `14`, `87`, `8`, and `85`; each source SEW outline has
  copies on `8` and `85`. Thus layers `8` and `85` contain both CUT-correlated
  and SEW-correlated geometry. No layer can be labeled CUT or SEW solely from
  its numeric ID.
- In Woven M, all 24 source CUT/SEW contours still have output matches within
  0.001 cm. Most CUT contours have six coincident layer copies; the SEW
  contours have two, and some four-vertex CUT contours also have two. Layers
  `8` and `85` again occur for both source CUT and SEW matches. The first and
  second CLO exports remain 114/114 same-block/same-layer matches within the
  same threshold (maximum `0.000031 cm`), which proves repeatability of the
  representation, not its semantic interpretation.
- In Polo M, 13/18 source contours remain within 0.001 cm. The five source CUT
  failures documented in S477 remain real: the back delta is about `2 cm`,
  two stand deltas are about `2 cm`, and two pointed-collar deltas are about
  `9.3 cm` (the exact lower-bound diagnoses remain in S477). Their source SEW
  contours still match. This is a measured acceptance failure, not an app
  crash.

The app was also opened once at the user's request for a fresh practical
check. CLO 2026.1.310 displayed its startup graphics notice, then remained on
“Creating Scene and Library” for about two minutes. The accessible status did
not advance, and Windows reported the process as `Responding: False`. The
desktop input bridge also rejected the returned window as unusable when
dismissing a dialog. No pattern/project was opened and no import or export was
attempted in this session. The exact idle process was closed after that
concrete startup failure. This observation establishes that this launch could
not reach a usable workspace; it does not invalidate the earlier completed
S475–S478 file operations or establish that CLO's DXF format is incompatible.

## V03 status and acceptance

No V03 criterion, threshold, receiver/profile selection, or compatibility
claim changes. CLO remains an unselected, unqualified candidate. Prior
completed runs show successful Tee and Woven M contour subsets, a successful
Woven second generation, and a Polo geometry failure. Separately, S493's
rights/local-handling, import-warning, semantic/layer, grade, malformed-input,
and independent-receiver gates remain unresolved. The current startup failure
means no additional practical scenarios could be run in this session. Do not
claim V03 complete, industrial compatibility, ASTM conformance, factory
acceptance, physical fit, or production readiness.

## Verification

- `node docs/research/epic17/S475-clo-tee-roundtrip/inspect-dxf.mjs` passed;
  it revalidated the exact Tee input/output hashes and measured all six CUT and
  six SEW contours against the output polylines.
- `node docs/research/epic17/S476-clo-representative-roundtrips/analyze-roundtrips.mjs`
  passed its fixture hashes/structure assertions and preserved Polo 13/18 and
  Woven 24/24 at the unchanged 0.001 cm threshold.
- `node docs/research/epic17/S477-polo-roundtrip-contour-diagnosis/diagnose-polo.mjs`
  passed hash and association checks, retaining the five identified Polo CUT
  failures and its annotated geometry overlay in the C: evidence folder.
- `node docs/research/epic17/S478-woven-generation-two-reimport/analyze-woven-roundtrip.mjs`
  passed exact hashes, with Woven 24/24 source-to-output and 114/114
  first-to-second-generation contours within 0.001 cm.
- No repository production code, tests, source patterns, export baselines, or
  C: exchange files were changed. The four existing analyzers wrote their
  existing evidence JSON/overlay paths only beneath
  `C:\G04-CLO-DXF-Exchange\Evidence`.
- CLO process PID 1248 was observed `Responding: False` and closed after the
  stalled startup. It was not running at closeout.

## Slice boundary and next action

Started `2026-10-08 13:54:13 UTC` from clean S494 `19272cafa73722124c5ee523f41b7663d80ad1e4`
on `codex/epic-17-g04`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S494 was the
highest assigned slice; S495 is unique. Start board replay advanced revision
`3077→3079`. The validated exit replay records S495 while retaining EPIC-17
and G04-V03 In Progress and V01/V02 Done.

Approximate elapsed-time accounting through the closeout: product
implementation `0m`; focused DXF verification `2m`; CLO practical launch/status
check and close `3m`; external-agent wait `0m`; maintainer-decision time `0m`;
durable records and board closeout `2m`.

**Next action:** resume V03 only through a rights-cleared exact receiver/build
and its documented local-handling conditions. Once available, rerun the
bounded practical exchange matrix and keep the Polo acceptance failure visible
until it passes the existing threshold. Preserve every gate and keep the Epic
In Progress.
