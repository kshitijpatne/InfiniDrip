# Patternworks

A lightweight, local **2D sewing-pattern designer**. Type body measurements and
it drafts a correct t-shirt pattern, draws it on a technical "blueprint" canvas,
catches mistakes as you edit, grades it across a size run, estimates fabric usage,
checks it's ready to cut, and lets you freeform-edit a piece — all running in the
browser with no heavy 3D engine.

Built from scratch in TypeScript, in small tested slices.

## What it does

- **Measurement-driven drafting** — body numbers in, a real t-shirt block out
  (front, back, sleeve), with the sleeve cap auto-fitted to the armhole so it
  actually sews together.
- **Live canvas** — the flat pattern pieces redraw instantly as you change any
  measurement, on a centimetre grid with fold lines and grainlines.
- **Guidance** — plain-English checks catch problems a beginner would miss
  ("sleeve cap is too long for this armhole", "armhole too shallow").
- **Target-fit styles** — declare the fit you want and see the exact cm change on
  every axis to reach it.
- **Grading** — re-draft the block across a whole size run, shown as tree-ring
  nested outlines, with an auto-measured spec (POM) sheet.
- **Fabric estimate** — a width-aware nesting layout that reports fabric length and
  utilization on your chosen bolt width.
- **Production-readiness check** — one plain-English pass/fail verdict that the
  pattern is sewable (matched seams, cap ease, square hem, notches/grain, sane grade).
- **Freeform edit** — drag a piece's points and curve handles to reshape it by hand
  (a manual override; Reset re-drafts from your measurements).
- **Export** — true-scale SVG and DXF cutting files, plus a tiled print-at-home PDF.
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
of those numbers, so the whole picture rebuilds from scratch on any change. The
test suite holds 100% coverage, enforced by the build.

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for a plain-language tour of the
layers.

## Tech

TypeScript · SVG · Vite · Vitest

## Status

In active development, built feature by feature. Current: measurement-driven
drafting, live render, guidance, target-fit styles, assembled garment view, seam
allowances, notches + grainlines, save/load, parametric grading + spec sheet,
true-scale SVG/DXF/PDF export, a fabric-nesting estimator, a production-readiness
checker, and freeform piece editing. Planned: a fitted/darted garment and dart
manipulation.
