# EPIC-17 / G04 V03 — S690 LibreCAD DXF 2000 unit check

## Verified start

- Start: 2026-10-10 20:54 UTC on `codex/epic-17-g04` at clean S689 commit
  `82d920a507680d669d7332d616c2307f3f6da6fc`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an
  ancestor. Highest assigned slice is 689; S690 is unique. Canonical board
  revision 4078 has EPIC-17 In Progress, G04-V03 Blocked, and V01/V02 Done.
- The prior LibreCAD 2.2.1.5 R12 exact-fixture pilot preserved all 18 CUT/SEW
  contours, all 38 typed marks, and all eight layer names, but R12 output
  omitted the source centimeter declaration. CLO Standard is retired after
  repeated CUT/mark losses. This is one narrowly targeted check of whether the
  same existing LibreCAD route's DXF 2000 save can preserve the unit field.

## Scope and exact test

Use the S671 hash-pinned Polo M centimeter DXF, unchanged, copied into
`C:\G04-LibreCAD-Exchange\S690-librecad-r2000-unit-check\Input\`.
Import it once in the already installed LibreCAD 2.2.1.5 build and save once
to `C:\G04-LibreCAD-Exchange\S690-librecad-r2000-unit-check\Output\` using
the DXF 2000 / AC1015 file version if the UI exposes it. Do not alter drawing
units, scale, entity encoding, pattern geometry, marks, layers, or fixture.
Keep screenshots and comparison reports only under the named S690 C: folder.

The distinct gate is returned unit declaration: S674's R12 file passed direct
geometry/mark checks but failed because it had no unit header. DXF 2000 supports
the unit header field that R12 lacks. This checks whether the same LibreCAD
receiver can clear that specific miss while retaining its already measured
geometry/mark behavior. It does not, by itself, prove a complete V03 profile.

## Decisive verification and stop conditions

1. Verify the copied fixture hash equals S674's source hash and confirm source
   `$ACADVER=AC1015`, `$INSUNITS=5` (centimeters).
2. In one native LibreCAD session, import the copy and save one DXF 2000 file.
   Stop immediately on any warning, missing pattern piece, unavailable DXF 2000
   option, or ambiguous save result. Do not try another version or setting.
3. Independently inspect the saved file's actual `$ACADVER` and `$INSUNITS`;
   compare every CUT/SEW path, vertex, closure, bulge, typed mark, and named
   layer against the pinned source at the existing `0.001 cm` limit. Re-open
   that exact saved file once and visually inspect overall and fine-detail
   readability. Stop at the first miss.
4. If units and direct geometry/marks pass, record only those measured results.
   LibreCAD is a generic 2D CAD application; make no apparel-specific or
   ANSI/AAMA/ASTM claim. Remaining same-route proof (identity/sidecar, grades,
   malformed input, repeatability, all-seven/options, and industrial profile
   qualification) remains required before any V03 pass.

No production code, pattern geometry, legacy DXF behavior, export baseline,
protected byte identity, threshold, or acceptance criterion changes in S690.
No physical-fit, factory-acceptance, or production-readiness claim. GUI import,
export, and rendered evidence stay under the named C: folder. CAD UI and
comparison are coupled; no safe disjoint delegation exists. Full repository
coverage/build remains reserved for a settled integrated candidate.

## Exit accounting

Implementation/UI time, focused comparison and output review, external-agent
wait, and maintainer-decision time will be recorded separately at closeout.
