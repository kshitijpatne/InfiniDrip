# EPIC-15/G02 — Field-to-output dependency and invalidation (Slice 236)

**Status:** Slice 236 implemented and verified. F02 is complete; F03 is the
next dependency-ready packet.
**Scope:** The seven current recipes, their measurement and option inputs, and
the outputs currently produced by InfiniDrip. This is a digital dependency
record, not evidence of fit, sewing success, or factory readiness.

## Result and operating semantics

The editor now enumerates a dependency row for every one of the **85** current
recipe inputs and shows the user which outputs depend on an edited field. The
matrix distinguishes inputs that drive pattern geometry, options that change
marks without changing cut geometry, and two inputs that the current draft
engine does not consume. Surface-art sheet SVG is independent of every garment
measurement and construction option.

There is no saved derived-artifact cache. Editing a valid measurement or option
redraws the open view synchronously from current inputs. Other views are
computed when opened; exports are generated from current inputs when requested.
The impact message is therefore a dependency/recomputation map, not a claim
that an old persisted file is sitting stale. The app's existing `outputRevision`
tracks unsaved design changes globally; it is not a per-artifact revision or a
persisted stale-status ledger.

The six output groups are: drafted pattern pieces; POM/spec values; graded size
measurements and pattern pieces; single-size/graded nesting; interactive
pattern/body/assembled/nesting/spec/check/edit views; and SVG, DXF, tiled PDF,
tech-pack PDF, projector SVG and A0 PDF exports. “Recompute” means that the
derived function must read the current source again; an individual numeric
POM may legitimately remain equal after recomputation.

## Complete seven-recipe input matrix

The profile assigned to a listed recipe input applies to every input in its
measurement and option lists, except the explicitly listed overrides below.

| Recipe | Measurement inputs | Construction/style options | Default dependency profile |
| --- | --- | --- | --- |
| Tee | `chest`, `shoulderWidth`, `bicep`, `length`, `armholeDepth`, `sleeveLength`, `ease` | None | P0 |
| Darted tee | `chest`, `shoulderWidth`, `bicep`, `length`, `armholeDepth`, `sleeveLength`, `ease` | None | P0 |
| Tank | `chest`, `shoulderWidth`, `length`, `armholeDepth`, `strapWidth`, `neckDrop`, `neckWidthEase`, `ease` | None | P0, except `shoulderWidth` = P4 |
| Polo | `chest`, `shoulderWidth`, `bicep`, `length`, `armholeDepth`, `sleeveLength`, `ease` | `placketLength`, `placketWidth`, `standHeight`, `collarLeafDepth`, `standFrontRise`, `collarPointExtension`, `sideVentDepth`, `backHemDrop` | P0 |
| Woven shirt | `neck`, `chest`, `shoulderWidth`, `bicep`, `length`, `armholeDepth`, `sleeveLength`, `waist`, `hip`, `hipDepth`, `ease` | `neckEase`, `buttonCount`, `buttonSpacing`, `frontOverlap`, `placketWidth`, `standHeight`, `collarLeafDepth`, `yokeDepth`, `pocketWidth`, `pocketHeight`, `sleeveBandDepth`, `sideVentDepth`, `hemTurn` | P0, except `buttonCount` = P1, `buttonSpacing` = P2, `hemTurn` = P3 |
| Skirt | `waist`, `hip`, `hipDepth`, `length`, `ease` | None | P0 |
| Trouser | `waist`, `hip`, `hipDepth`, `crotchDepth`, `thigh`, `knee`, `inseam`, `ease` | `frontRiseEase`, `backRiseEase`, `waistbandDepth`, `thighEase`, `kneeEase`, `legOpening`, `flyLength`, `pocketOpening`, `pocketAngle`, `pocketBagDepth`, `pocketDrop` | P0 |

| Profile | Outputs requiring recomputation | Outputs that remain independent | Verified behavior / limit |
| --- | --- | --- | --- |
| P0 — drafted input | Pattern, POM/spec, graded measurements and pieces, nesting, views, garment exports | Surface-art sheet SVG | Each input has one stable definition and one matrix row. Mutating each input by one permitted step changes the real recipe draft or one of its attached marks. The downstream functions consume the resulting block/measurement bundle. |
| P1 — woven `buttonCount` | Pattern marks, graded marks, pattern/assembled views, tech-pack and cutting exports | POM/spec values, nesting, surface-art sheet SVG | Button count changes marks and the tech-pack BOM/instructions but not cut/sew contours, button-spacing POM values, or the mark-blind nesting layout. |
| P2 — woven `buttonSpacing` | Pattern marks, front-button-spacing POM/spec, graded marks, views, garment exports | Nesting, surface-art sheet SVG | Adjacent button marks and the reported spacing change. Cut contours and nesting do not. Other POM values are still read from current inputs when the spec is rebuilt. |
| P3 — woven `hemTurn` | Assembled illustration and hem-turn guidance/check view | Pattern, POM/spec, graded outputs, nesting, garment exports, surface-art sheet SVG | The recipe draft and generated export bundle are byte/value identical when only this option changes. Its preview control is not wired to a production pattern or export, so those outputs visibly report that the value is missing. |
| P4 — tank `shoulderWidth` | Per-size graded measurement records; body/assembled illustration and shoulder-width guidance/check view | Drafted tank geometry, POM/spec, graded pattern-piece geometry, nesting, garment exports, surface-art sheet SVG | `TSHIRT_GRADE` carries the changed breadth in each size's measurement record, but `draftTank` does not use it. Thus graded measurements change while the drafted tank pieces and every current pattern export remain unchanged. This is explicitly disclosed as a propagation gap. |

P0 is the default for the recipe/input combinations in the preceding table.
The map is generated from the C03 field definitions and recipe metadata, with
specific output profiles for P1–P4. Coverage asserts that adding a recipe input
without a recognized definition cannot silently leave the seven-recipe matrix
incomplete.

## Source and behavior checks

- `src/ui/artifact-dependencies.ts` declares the output families, field
  profiles, per-recipe enumeration, coverage assertion and accessible impact
  wording. `src/ui/app.ts` invokes it for changed measurements and options;
  `src/ui/view.ts` provides the polite live-status region.
- `recipe.ts` and each recipe draft establish input-to-block relationships.
  `grading.ts`, `pom.ts`, `nesting.ts` and the exporters establish how blocks
  feed size records, POMs, layout, views and files. Woven button marks are
  consumed by cutting renderers but not `flattenPiece`/`nestPieces`; the button
  count separately feeds the woven tech-pack BOM.
- `shirt.ts` reads `hemTurn` in the illustration/guidance path, but not in the
  draft or export paths. `draftTank` does not use `shoulderWidth`; the tank's
  guidance and body illustration do, and the shared upper-body grade rule
  preserves shoulder breadth in per-size measurement records.
- The exported file bundle tests compare SVG, DXF, tiled PDF, tech-pack PDF,
  projector SVG, and A0 PDF from actual recipe output. For the two inputs with
  no drafted representation, those artifacts remain equal to baseline. Mark
  edits change their relevant rendered exports while nesting remains equal.

## Verification

| Gate | Result |
| --- | --- |
| Seven-recipe coverage | All 85 measurement/option inputs appear exactly once. Mutating each by a valid adjacent step exercises the real recipe draft; mark-only and non-consumed exceptions have dedicated assertions. |
| Artifact behavior | The tests compare current blocks, all graded measurements/blocks, POMs, flattened/nested shapes, and six actual garment export paths. They verify exact unchanged and changed outputs for P1–P4. |
| UI tests | The complete `app.test.ts` plus dependency suite passed 227/227. A separate name-filtered verification passed all 9 focused matrix/UI cases. |
| Coverage | `artifact-dependencies.ts`: 100% statements, branches, functions and lines. Every new `app.ts` input-handler statement and the new `view.ts` status markup were hit in the full app test file. A source-limited V8 run over only `app.ts`, `view.ts`, and the graph reported 94.62% statements, 96.78% branches, 94.83% functions and 94.62% lines, so the repository's 100% threshold correctly failed for that incomplete test selection. No new integration line was uncovered; the complete repository coverage gate remains scheduled for Slice 240. |
| TypeScript | `npx tsc --noEmit` passed. |
| Isolated rendered browser | Chromium 151.0.7922.34 on disposable contexts showed the chest-change status and a changed live pattern SVG. After saving chest `101`, reloading, and changing it to `102`, the field-to-output message appeared again and the pattern SVG changed. A separate tank body-view replay showed the shoulder-width illustration changed while the status disclosed the unchanged pattern/export paths. No browser console or page errors were recorded. The rendered chest state is retained at `docs/research/epic15/evidence/S236-field-impact-browser.png`. |
| Repository gates | Full project coverage/build/protected export identity remain scheduled for Slice 240. Slice 236 made no export baseline changes. |

## Follow-up required in F03/Slice 238

Two currently exposed inputs have no propagation into the garment's drafted
pattern: woven-shirt `hemTurn` and tank `shoulderWidth`. Slice 238 must either
connect each input through the recipe-owned geometry, relevant POM/spec, grade,
nest, views and export paths, or block/disable the unsupported value with a
specific correction. Do not silently preserve an attractive illustration
while exporting a pattern that omits the field. The accepted product direction
keeps these choices user-editable; the UI must continue to state the limit
until the propagation work is proved.

No new recipe, user-facing AI designer, supplier contact, physical sample,
paid/hosted service, or fit/production-readiness claim was added.
