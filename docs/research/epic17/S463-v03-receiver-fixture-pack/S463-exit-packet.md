# EPIC-17 / G04 V03 receiver-independent fixture pack — Slice 463 exit

## Result

S463 prepares a local, source-reproducible set of generic DXF inputs for the
rights-reviewed receiver test that V03 still requires. It does not select a
receiver/profile or establish any apparel-CAD compatibility.

The package has six structurally valid positive inputs: standard-M Tee, Polo,
and Woven shirt, plus Tee XS/M/XL separately redrafted through the current
Tee grade rule. It also has one malformed negative control made by removing a
DXF group value from a copy of the Tee file. Every fixture has byte length,
SHA-256, source inputs, piece names/counts, entity/layer counts and—where
applicable—size/step in `fixture-manifest.json`. `generate-fixtures.ts`
reproduces the files from the source commit in that manifest;
`verify-fixtures.mjs` independently checks hashes, DXF pair structure,
envelope, layer/entity inventories, closed contour counts, and the three
size/grade-step identities. Re-generation produced the same hashes and the
independent checks passed.

The three Tee size files are **separate generic files**, not a native graded
pattern or a multi-size DXF. Their sidecar expected values do not add metadata
to the file. They can test scale and geometry for three re-drafted inputs,
but size identity, grade rules, correspondence, and preservation remain
unproven until the chosen receiver/profile demonstrates them. The malformed
negative control tests explicit rejection/reporting of an unmatched DXF
group code; it is not a garment pattern. The generic writer still does not
declare units or serialize stable piece/size IDs, grade rules, or paired-seam
relationships.

## Verification

- Start: board revision 2831; validated start replay 2831→2835; EPIC-17 and
  G04-V03 remained In Progress, V01/V02 Done.
- First verifier attempt counted the standalone Tee M control in the grade
  series; corrected its file selection. No fixture bytes were changed by this
  diagnostic. Corrected independent audit: 6 positive + 1 negative; XS/-2,
  M/0, XL/+2; hashes and structure PASS.
- `vite-node generate-fixtures.ts` succeeds; second generation is identical.
- Focused `npx vitest run src/export/export.test.ts src/export/regression.test.ts`:
  2 files / 22 tests pass, including protected export byte identities.
- `npm run control-center:test`: 42/42 pass after the S463 start replay.
- Current unstaged `git diff --check` passes; the complete staged candidate is
  checked again before commit.
- One initial CLI invocation passed the command array to the single-command
  interface and returned “command must be an object”; it did not mutate the
  board. The same validated commands were then replayed with the recorded
  `replay-start.mjs` helper and preflight, producing revision 2835.
- No production source, DXF writer behavior, baseline, V02 acceptance, or
  receiver/profile choice changed. No build/global coverage/Electron gate is
  due for this evidence-only slice.

## Remaining blocker and next action

V03 still needs the product owner to provide lawful access to an already
licensed local apparel-CAD receiver and exact installed version/build. Once
available, freeze its settings and run the positive/negative fixtures through
actual import and re-export; compare geometry against the manifest and inspect
receiver-native output. If no such access is available, preserve the admitted
V03 acceptance gate and hold completion; do not initiate a trial/payment or
contact a vendor. S464's next action is to use the exact provided receiver for
a rights-qualified profile/fixture proof, with the actual interface and
fixture support checked first.

## Time and ownership

Start 2026-10-08 04:19:48 UTC; exit 04:24:34 UTC (~4m46s). Timing:
fixture tooling/data 1m50s; focused verification and durable/board closeout
2m56s; external-agent wait 0m; maintainer-decision time 0m. Production
implementation 0m.
This shared drafting/export boundary did not have safe disjoint ownership for
delegation; Codex retained generation and review. OpenCode's required Muse
Spark 1.3 xhigh normal configuration was not substituted or weakened.
