# EPIC-17 / G04 V03 — Existing CLO output semantic audit — Slice 525 exit

## Result

S525 completed a source-hash-pinned, read-only analysis of the seven existing
CLO generation-two outputs. Tee, Polo, and Woven shirt are observed
`DXF-ASTM` outputs from S498; Fitted, Tank, Skirt, and Trouser are observed
`DXF-AAMA` outputs from S523. The analysis keeps these cohorts separate and
does not label either as an industry-conforming profile.

All 41 source pattern pieces have exactly one matching receiver block by their
SEW-outline geometry; each output also has the expected block and insert count.
This establishes empirical piece separation and identity for these saved CLO
files. It does not establish selection behavior in an independent receiver or
native size-grade relationships.

The numeric layer mapping is not semantically unique. Every recipe's output
layer `8` contains both source CUT and SEW geometry. The three ASTM outputs
also place both meanings on layer `85`; Polo additionally has CUT and SEW on
layers `1`, `14`, `84`, and `87` in the matched subset. CUT geometry is
duplicated across numeric layers. Numeric identifiers therefore cannot be
used as a unique CUT/SEW semantic contract for these observed exports.

The direct geometric matcher finds all 41 source SEW outlines and 36 of 41
CUT outlines. The five direct CUT misses are Polo's already documented five
contour failures. Of 100 source internal mark entities, 22 have an exact same-
kind, same-geometry match in a receiver block or non-INSERT modelspace; 78 do
not. These are reported as **without direct geometry match**, not as proof of
loss: this audit does not interpret transformed, split, or receiver-generated
mark geometry. The Polo and Woven missing-mark counts and Trouser mark counts
remain explicit below and continue to hold semantic acceptance.

Thousands of receiver entities do not directly match the source, largely
POINT entities and other drafting/grading content. This is not classified as
data loss or a defect. The audit only establishes that the source matcher
cannot assign them a source meaning. A source-hash-pinned, repeatable numeric
layer map is therefore **not qualified**.

## Per-recipe direct-match findings

| Recipe | Observed export | Unique piece blocks | Source entities without direct geometry match |
|---|---|---:|---|
| Tee | DXF-ASTM | 3/3 | none |
| Fitted | DXF-AAMA | 3/3 | none |
| Polo | DXF-ASTM | 9/9 | 5 CUT; 3 button; 3 buttonhole; 3 cutline; 4 foldline; 7 placementline |
| Woven shirt | DXF-ASTM | 12/12 | 8 button; 8 buttonhole; 4 foldline; 9 placementline |
| Tank | DXF-AAMA | 2/2 | none |
| Trouser | DXF-AAMA | 9/9 | 1 button; 1 buttonhole; 1 foldline; 10 placementline; 16 placementpoint |
| Skirt | DXF-AAMA | 3/3 | none |

The direct matcher also finds 18 of Polo's 18 placement points, both Woven
placement points, and 2 of Trouser's 18 placement points. All findings use the
unchanged `0.001 cm` tolerance. See the complete per-layer, per-piece,
per-entity results and pinned file hashes in
`C:\G04-CLO-DXF-Exchange\S525-clo-semantic-layer-audit\Evidence\semantic-layer-audit.json`.

## Method and limits

The analyzer checks every source entity against receiver block entities and
non-INSERT modelspace entities by entity type and geometric fields at
`0.001 cm`; closed polyline comparison allows cyclic vertex start and reversed
winding. It records source and receiver hashes, block/insert counts, source
layer fan-out, output numeric-layer meanings, unmatched entity types, and
location. Two runs produced the same summary and all seven pinned receiver
hashes remained unchanged.

The geometry correlation is empirical evidence for these files and the
recorded CLO build, not AAMA/ASTM conformance. No CLO window was opened,
reopened, closed, or operated during S525. No CAD file was copied into the
repository; all DXF inputs, outputs, and generated JSON remain under the
named C: audit folders.

## Gate disposition

- **Empirical identity:** passes for 41 pieces in these seven CLO outputs.
- **Unique semantic layers and all required marks:** not passed; output layer
  `8` mixes CUT and SEW in all seven recipes, additional ASTM layers mix them,
  and 78 source marks have no exact direct-geometry match.
- **Polo geometry:** remains failed for five CUT contours at the unchanged
  `0.001 cm` threshold.
- **Rights/profile, local handling, clean-import warning, native grade,
  malformed-input rejection, and independent receiver acceptance:** unchanged
  from S493; this static audit cannot clear them.
- **V03 / EPIC-17:** remain In Progress. No criterion, acceptance threshold,
  export byte identity, or claim boundary changes. No fit, factory, or
  production-readiness claim is made.

## Verification and closeout

Started `2026-10-08 19:52:36 UTC` from S524 `f5a81c272c3f589747e2374ddd39cd5eaf13703d`
on `codex/epic-17-g04`; refreshed `origin/main`
`a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S525 is unique
after S524. Validated board start advanced `3211→3213`; the exit replay is
recorded below.

Focused verification: analyzer syntax passed; source-manifest and output file
hash checks passed; two runs produced byte-identical audit JSON
(`A6AEFA5E4DF4A7A2236792DCAC05BE6E4702430A509B3A414497F8E385DFA3DF`);
piece identity mapped 41/41. Exit preflight confirms all seven current
receiver hashes and replays start+exit board commands to revision 3215; the
canonical board validates at 3215. `npm run control-center:test` passes 42/42,
and `git diff --check` passes (Git printed only its configured LF/CRLF notices
for Markdown/JSON). The exit board comment corrects the start comment's
mistaken shorthand that called all seven outputs AAMA; the exact ASTM/AAMA
split is stated above. This is an evidence/tooling slice with no
production-code change, so changed-production-code coverage and the full
repository gate do not apply. CLO remained running and untouched.

Elapsed time: `19:52:36–20:03:35 UTC` (10m59s) — analyzer correction and
source/output analysis 6m; focused deterministic replay 2m; durable packet,
state, board, and verification closeout 2m59s; external-agent waits 0m;
maintainer-decision time 0m.

**Next action:** continue G04 V03 from the precise remaining gates in the
S493 matrix. Do not repeat the same CLO import/export trial. Obtain permitted
use/local-handling evidence and an independently qualified receiver/profile
path before attempting another decision-bearing exchange test; preserve the
Polo and semantic findings until actual evidence clears them.
