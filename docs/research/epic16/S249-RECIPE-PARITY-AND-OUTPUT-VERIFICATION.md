# Slice 249 — recipe parity and selected-size output verification

**Status:** Complete; Codex-reviewed evidence for the seven-recipe M02 parity boundary.
**Base:** Slice 248, `becb142ee0574cf6e82f351eaad449dedf479115`.
**Scope:** Woven Shirt, Skirt, Trouser, Tee, Darted Tee, Tank and Polo. This
record verifies digital equivalence for identical resolved inputs; it does not
validate a measurement method, physical fit, or factory production.

## Results

`src/ui/custom-size-materialization.test.ts` now varies every recipe's captured
fields by one declared input step where the guardrail allows, materializes a
fresh custom style, and compares it with the ordinary recipe path at step 0.
For all seven recipes the test compares:

- the complete drafted block and recipe options;
- every POM measurement before display rounding; and
- exact SVG, DXF, tiled-PDF and A0-PDF content from the selected-size writers,
  using each recipe's allowances, notches and writer flags.

This is an output comparison, not just a comparison of two labels. The ordinary
path is `recipe.draft(resolvedMeasurements, resolvedOptions)`; the custom path
is `draftAtSize(..., 0, ...)`, matching the app's selected-size step-zero
route. For Woven Shirt, the built app was also exercised in a fresh isolated
browser preview (`http://127.0.0.1:4177/`): the guided capture accepted the
24 explicitly labeled Standard M digital presets, created and saved one
custom one-size style, and rendered the POM specification in the full editor.
The visible table had one `One size` column and showed 10 recipe POM rows,
including the calculated neck-curve length. Those presets remain digital
starting values, not measurements of a wearer. The browser preview did not
claim fit.

The app integration checks additionally prove that a custom style's size
picker cannot be forced to a graded step, semantic edits evaluate only at step
0, history undo and recovery restore cannot select a hidden graded step, the
one-size POM values match the Woven Shirt draft, and whole-run Tech Pack,
Projector, Marker and freeze remain unavailable without an approved grade
plan. The grade-plan gate was inspected after saving the current style; the
forced freeze attempt produced no manifest. The recipe-independent
selected-size writer comparison covers all seven recipes.

## Implementation boundaries verified

- Custom style records and active editor state pin `exportStep` to 0. Loading,
  history restoration, selector changes, and workflow saves cannot activate a
  hidden graded step.
- Semantic-edit evaluation accepts an explicit size-step list. The custom
  editor supplies only `{ label: "One size", step: 0 }`; legacy designs retain
  each recipe's existing size list.
- The custom specification view calls the recipe's existing POM definitions
  against its ready step-zero block. Invalid or stale semantic edits show a
  paused status instead of stale values.
- Selected-size SVG, DXF, tiled PDF and A0 PDF remain on the existing writers.
  The eight protected legacy export identities remain a separate regression
  gate and their baselines were not edited.
- Whole-run files remain withheld under the maintainer's explicit decision.
  One-size POM display is a selected-size specification, not a graded spec.

## Independent source-audit notes and residuals

Claude Code and OpenCode performed separate, read-only audits for the knit
recipes and Woven Shirt/Skirt/Trouser. Codex reviewed the returned source
findings against the implementation and executable comparisons. The audits
identified existing semantic/mapping limitations that are not parity
regressions and are not expanded into S249:

- Woven Shirt does not expose a direct shoulder-width, bicep, or armhole-depth
  POM; its sleeve-length input is referenced from the cap base while its POM
  reports a solved cap-height contribution. The neck input and the pattern
  neck-curve POM are intentionally distinct.
- Skirt's style metadata allows a 95–120 cm length range, while the current
  capture and editor guardrail end at 100 cm. The route preserves the value
  and surfaces its existing upper-bound limitation; it does not clamp it.
  Skirt hip depth has no POM row.
- Trouser thigh/knee POM naming and scale remain subject to the previously
  recorded D-02 mapping review; the sloped inseam POM is approximate relative
  to the input target (D-09). S249 asserts route parity without relabeling
  these values as body measures or validated finished girths.
- Shared schema-padding measurements are not recipe inputs. A field not
  consumed by a recipe is not inferred, copied from another style, or treated
  as an observed wearer value.

These residual mapping questions remain in their assigned downstream review
gates. No physical-fit statement follows from the step-zero comparisons.

## Verification record

The focused checks run during implementation were:

```text
npx tsc --noEmit
npx vitest run src/ui/view.test.ts src/ui/project-records.test.ts src/ui/project-workflow.test.ts src/edit/semantic-edit.test.ts -t 'customOneSizeSpecMarkup|keeps custom one-size style schema|creates and reloads one custom|replays a rigid translation|one-size' --maxWorkers=1 --minWorkers=1 --testTimeout=60000
npx vitest run src/ui/custom-size-materialization.test.ts -t 'matches the ordinary step-zero block' --maxWorkers=1 --minWorkers=1 --testTimeout=60000
npx vitest run src/ui/app.test.ts -t 'turns a ready guided capture|evaluates custom one-size semantic edits only at step zero' --maxWorkers=1 --minWorkers=1 --testTimeout=60000
npm run build
npm run electron:build-main
npm run control-center:test
npm run coverage -- --maxWorkers=2 --minWorkers=1 --testTimeout=60000
git diff --check
```

The first focused group passed 5 tests, the all-recipe output comparison passed
1 test, and the initial app-flow checks passed. The added recovery/undo
assertions passed in the focused app test. The final full run passed all 128
test files and 1,922 tests with 100% statement, branch, function and line
coverage. The protected export identity suite passed all 9 checks. The
Control Center suite passed 33/33; TypeScript and strict Electron builds
passed; and the production build completed with its existing large-chunk
advisory. `git diff --check` passed. The browser observation above used the
production build and a new, isolated localhost port; the user's existing
`4173` tab was left untouched. This evidence does not establish physical fit,
fit qualification, or factory approval.
