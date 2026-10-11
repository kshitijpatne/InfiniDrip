# EPIC-17 / G04 V03 — DGS native control — Slice 670 exit

## Result

S670 started at `fc21c528` on `codex/epic-17-g04`, with refreshed
`origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` still an ancestor and
board revision 3961. The installed DGS is `VID:20250610`. The control was a
native 100×100 mm square, with no product pattern or production geometry.

The first-party V2024.1 manual confirms a Piece Name field in Pattern Info and
grainline endpoint editing. The control's Piece Name was set to
`G04_CONTROL_10CM` and saved. The UI still displayed a two-way vertical
grainline at the square's cut-border endpoints; S670 did not establish that
the grainline was wholly inside the border. The observed native render is
`C:\G04-CLO-DXF-Exchange\S670-dgs-valid-control\Evidence\native-dgs-render-after-name-fix.jpg`
(SHA-256 `68067B47454CC761355D3B2958CAE12482B02E9E74080993B4517C4BF01F4BCE`).

One ASTM-mode export completed without a validator dialog at
`C:\G04-CLO-DXF-Exchange\S670-dgs-valid-control\Output\g04-valid-control.dxf`
(1,223 bytes, SHA-256
`D90E818ADE839C2B21216247535620BD4988EB71EC5AB726E61933FDEDE11AEE`).
Independent inspection of the complete ASCII file finds 10 `TEXT` entities,
all on layer `1`, and zero geometry, zero blocks, no `$ACADVER`, and no
`$INSUNITS`. The text contains vendor/style/date/author/product/version/size,
rule-table, metric and tolerance metadata only. Full raw text and counts are
in `S670-dgs-valid-control-output.json` alongside the C:-only artifact.

The no-dialog export is **not** a clean positive result: the file contains no
pattern geometry. In accordance with the precommitted stop condition, the
same file was not self-imported. DGS is retired as a V03 receiver candidate;
S670 establishes no DGS interoperability gate, no profile conformance, and no
product gate. The grainline correction was not proven. There was no second
format, setting, entity, or receiver permutation. The maintainer's `/2`
grainline convention remains approved and was not reopened.

## Gate and scope disposition

All V03 gates, all-seven-recipe / 73-option / grade requirements, the
`0.001 cm` limit, malformed-input rejection, repeatability, readable-output,
legacy-DXF and protected-byte-identity gates remain unchanged and unpassed
where the prior matrices say so. No production source, recipe, serializer,
baseline, or acceptance threshold changed. No physical-fit, factory-acceptance
or production-readiness claim is made.

## Slice verification and ledger

- Focused check: inspect the exported file's complete group-code stream;
  observed 10 `TEXT`, 0 geometric entities, 0 blocks. Hashes above identify
  the raw export and rendered source control.
- Repository checks: `npm run control-center:test` passed 42/42 and
  `git diff --check` passed. The complete output is preserved in
  `S670-focused-verification.txt`.
- Changed-production-code coverage: not applicable; no production code changed.
- Implementation: 0 min. DGS investigation/export/evidence: about 16 min from
  the recorded start. Focused repository verification and durable closeout:
  7 min. External-agent wait: 0 min. Maintainer decision time: 0 min.

## Next action

At S671, reconcile the current V03 matrix against S670 and the latest actual
CLO imports/exports and renders. DGS is no longer on the candidate list. Reuse
the existing nine-piece Polo M source-bound CLO evidence and exact five-CUT
diagnosis; choose only a source-exact change that has a distinct measurable
gate to clear. Do not re-run a settled CLO mode/encoding trial. If the existing
CLO candidate cannot meet the fixed geometry/mark/identity gates, record the
specific measured failure and the smallest technically viable route; do not
weaken acceptance. Once a representative route passes, the existing
seven-recipe, 73-option and grade matrix, negative controls, two rounds,
rendered review, full repository gate, PR, merge ancestry and required
deployment remain mandatory.
