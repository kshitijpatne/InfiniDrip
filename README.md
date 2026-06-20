# Patternworks

A lightweight, local 2D sewing-pattern designer. Generates correct garment
patterns from body measurements, lets you edit them, guides you when something
is off, and exports patterns you can print and sew.

Built in tested vertical slices. Current slice: **geometry core**.

## Run it
```bash
npm install      # one time
npm run dev      # open the local URL — proves the geometry core loads
npm test         # run the test suite
npm run coverage # tests + a coverage report (threshold: 95%)
```

## Layout
```
src/
  geometry/   pure math: points, distances, curves, edge lengths
    point.ts  point, distance, lerp
    curve.ts  cubic Bézier: point-on-curve, curve length
  main.ts     browser smoke test
```
The geometry layer has no UI and no dependencies, so every function is tested
directly. Later layers (drafting, guidance, style, render, export) build on it.
