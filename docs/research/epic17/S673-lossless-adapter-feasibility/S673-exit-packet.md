# EPIC-17 / G04 V03 — Slice 673 exit

## Result

S673 reviewed the current source exporter, S672 source/output mapping,
accepted C04 exchange contract, and primary documentation for a free local
garment-manufacturing candidate. It found no safe repair adapter for CLO's
lossy Standard-DXF route and made no production-code change.

The S672 fixture maps nine unique, unchanged SEW outlines to nine distinct CLO
blocks (`front`→`0_M` through `under pointed collar`→`8_M`) when the exact
source fixture is already known. This mapping is not emitted as stable source
piece identity. More critically, five CUT outlines exceed `0.001 cm`, units
are mislabeled, and typed mark semantics are missing. CLO's output gives no
provenance to distinguish its own simplification from user edits. Replacing
the receiver output with original source geometry could silently erase those
edits. The accepted C04 sidecar may carry piece/revision identity, grades and
seam relations; it may not substitute for changed/missing CUT/SEW or visible
mark entities. Therefore the tested CLO route cannot be made compliant by a
sidecar-only recovery, and no production adapter is justified.

`src/export/dxf.ts` is a write-only minimal R12 writer that flattens/layouts
paths and emits no header, explicit units, or durable piece/revision identity.
`src/export/pattern-mark.ts` emits typed `LINE`, `CIRCLE`, `POINT` on
`MARK_*` layers but no mark IDs/labels. The writer and protected byte baselines
remain unchanged; there is no product DXF importer in the current source tree.

OpenMarker's first-party repository says it is offline/local and Apache-2.0,
but also says it is not production-ready, imports DXF, and still lists saved
layout export as planned. It is not an eligible round-trip candidate and was
not installed or given project files. Hosted editors remain outside scope.
No alternative receiver qualifies from current evidence.

## Gate disposition

- **Passed:** bounded local evaluation rights for CLO/GetonAgain; source
  fixture hash and exact source-path preflight; unique nine-piece correlation
  for this pinned CLO fixture; V02 seven-recipe/73-option/146-face prerequisite;
  legacy writer and protected identities unchanged.
- **Failed:** tested CLO geometry, units, semantic layer/mark identity and
  readable snapshot; tested DGS routes; tested malformed input in CLO/OpenCAD.
- **Unproven:** any complete industrial apparel CAD profile; source identity
  outside one pinned fixture; C04 sidecar integrity/mismatch behavior on an
  eligible route; exact two-way round-trip/repeatability; seven recipes/73 CAD
  option rows and grades; candidate-level readable output.
- **No-go:** CLO loss-recovery adapter. No V03 acceptance or thresholds were
  relaxed. All approvals—including `/2` grainline—remain settled.

## Verification and ledger

- Analysis/review: 11 minutes (start 11:24:57 UTC; closeout 11:36 UTC).
- Focused verification: inspected `src/export/dxf.ts`, marks writer and C04;
  reran the hash-pinned S672 geometry and entity analyzers; 9 distinct block
  mappings recorded; no production changes, so changed-code coverage does not
  apply. Control Center focused suite recorded at start/boundary as needed.
- External-agent waits: 0 minutes. No safe independent ownership.
- Maintainer-decision time: 0 minutes; no pending decision.
- Goal check at previous safe boundary: status **active**; objective matches
  admitted EPIC-17 completion through safe merge; the UI “stalled” label is
  stale and manual resume is not needed.

## Next action

S674 performs one bounded, first-party capability screen of free, offline
pattern CAD candidates with explicit local DXF import and export. Do not
download/install or send fixtures to any candidate unless it passes that
entry screen. If none qualifies, report the concrete receiver requirement;
do not re-run a retired route or weaken any V03 gate. V03 remains In Progress.
Full 100% coverage, final output review, PR, safe merge, ancestry and any
required deployment remain completion gates. No fit/factory claim.
