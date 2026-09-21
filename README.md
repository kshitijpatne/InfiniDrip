# InfiniDrip

A lightweight, local **2D sewing-pattern designer**. Type body measurements and
it drafts a correct t-shirt pattern, draws it on a technical "blueprint" canvas,
catches mistakes as you edit, grades it across a size run, estimates fabric usage,
checks it's ready to cut, exports true-scale cutting files, and lets you
freeform-edit a piece — all running in the browser with no heavy 3D engine.

Built from scratch in TypeScript, in small tested slices. It's honest about its
boundaries: a schematic drafting tool, not a drape simulator or production CAD.

## What it does

- **Measurement-driven drafting** — body numbers in, a real t-shirt block out
  (front, back, sleeve), with the sleeve cap auto-fitted to the armhole so it
  actually sews together.
- **A second, fitted garment** — a bust-darted fitted block runs through the very
  same engine, grader, checker, nesting, editor, and export; darts can be pivoted
  onto another seam and trued. Adding a same-family garment is adding a recipe, not
  touching engine code.
- **Live canvas** — the flat pattern pieces redraw instantly as you change any
  measurement, on a centimetre grid with fold lines and grainlines.
- **2D body view** — see every measurement drawn on an upper-body figure; hover a
  measurement and both its dimension line and the outline edges it controls light
  up, so you can see what each number shapes.
- **Guidance** — plain-English checks catch problems a beginner would miss ("sleeve
  cap is too long for this armhole", "armhole too shallow") and now also flag
  measurements that are implausible or out of proportion, even when the pattern
  still sews together — warnings only, never silent auto-corrections.
- **Target-fit styles** — declare the fit you want and see the exact cm change on
  every axis to reach it.
- **Grading** — re-draft the block across a whole size run, shown as tree-ring
  nested outlines, with an auto-measured spec (POM) sheet with per-row tolerances.
- **Tech pack** — a three-page PDF: a flat sketch with callout leaders, the graded
  POM table, and editable BOM / construction stubs.
- **Fabric estimate** — a width-aware nesting layout that reports fabric length and
  utilization on your chosen bolt width, for a single garment or the whole size run
  nested as one marker.
- **Production-readiness check** — one plain-English pass/fail verdict that the
  pattern is sewable (matched seams, cap ease, square hem, notches/grain, sane grade).
- **Freeform edit** — drag a piece's points and curve handles to reshape it by hand
  (a manual override; Reset re-drafts from your measurements).
- **Export** — true-scale SVG and DXF cutting files at any graded size, plus a tiled
  print-at-home PDF.
- **Save / load** — your measurements and fabric persist locally.

## Run it

```bash
npm install      # one time
npm run dev      # open the local URL it prints
npm run coverage # run the test suite with a coverage report
```

Requires Node.js. No other setup.

## How it's built

Everything runs off a single `measurements` object; each layer is a pure function
of those numbers, so the whole picture rebuilds from scratch on any change. A clean
engine / recipe split keeps everything garment-specific in a declarative
`GarmentRecipe`, so the engine never names a t-shirt. The test suite holds 100%
coverage, enforced by the build.

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for a plain-language tour of the
layers.

## Tech

TypeScript · SVG · Vite · Vitest

## Status

In active development through numbered slices. Seven recipes ship through the
shared component grammar: Tee, Darted tee, Tank, Polo, Woven shirt, Skirt and
Trouser. The app includes measurement-driven drafting, front/back/side schematic
views, actionable guidance, target-fit styles, grading and POM/spec output,
deterministic nesting, surface artwork placement, production checks, versioned
save/load, and true-scale SVG, DXF, tiled PDF, A0, projector and tech-pack output.
Epic 6 surface design and Epics 9-10 release/adversarial hardening are complete.
Epic 7 nesting intelligence is the active isolated implementation lane. The Epic
11 Polo V2 research and execution packet is complete, but its geometry work waits
for Epic 7 to be reviewed and merged. No garment has completed physical
cut/sew/fit validation; digital checks are not a physical-fit claim.
