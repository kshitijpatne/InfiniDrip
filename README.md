# Patternworks

A lightweight, local **2D sewing-pattern designer**. Type body measurements and
it drafts a correct t-shirt pattern, draws it on a technical "blueprint" canvas,
catches mistakes as you edit, and suggests nearby garment styles — all running in
the browser with no heavy 3D engine.

Built from scratch in TypeScript, in small tested slices.

## What it does

- **Measurement-driven drafting** — body numbers in, a real t-shirt block out
  (front, back, sleeve), with the sleeve cap auto-fitted to the armhole so it
  actually sews together.
- **Live canvas** — the flat pattern pieces redraw instantly as you change any
  measurement, on a centimetre grid with fold lines and grainlines.
- **Guidance** — plain-English checks catch problems a beginner would miss
  ("sleeve cap is too long for this armhole", "armhole too shallow").
- **Style suggester** — names the style you're making and shows the exact change
  to reach nearby ones ("Longline tee — Length +8 cm").

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
drafting, live render, guidance, and style suggestions for a t-shirt. Planned:
assembled garment preview, printable/DXF export, and freeform editing.
EOF
