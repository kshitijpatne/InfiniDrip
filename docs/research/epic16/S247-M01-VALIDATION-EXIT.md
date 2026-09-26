# Slice 247 — M01 validation and rendered QA exit

**Status:** Complete
**Date:** 2026-09-26
**Scope:** EPIC-16 / G03 M01, Slice 247 only

## Result

Guided capture now resumes per active project style and recipe from the
existing local project workflow. A strict additive IndexedDB v7 store keeps
capture sessions separate from saved design revisions, edit history, and
recovery data. Capture writes use their own compare-and-swap revision; stale
cross-tab writes fail visibly. Style switches and route advances flush pending
capture drafts. A settled save failure remains visible and blocks changing the
garment until the user can retry, so a debounce failure cannot silently lose
the only copy of an unfinished entry.

Portable packages containing captures use format v4 and strictly validate
session ownership, field definitions, and draft fields. Copy imports remap
project, style, and capture-session IDs while preserving the source values.
Packages without captures retain the v3 manifest shape, key order, and digest
input. Existing SaveFile versions and protected exports were not changed.

The seven-recipe route and its C03 field matrix remain source-aware. Unsupported
body-measure procedures are withheld; invalid, blank, ambiguous, conflicting,
and out-of-guardrail values remain inspectable and block dependent continuation
with an action. Raw draft text remains distinct from a recorded reading. Woven
shirt continuation checks its selected length, armhole depth, and hip depth;
when the derived hip station falls below the hem, the guide reports the exact
station and leaves recorded values unchanged.

## Verification

- `npm run coverage -- --maxWorkers=1 --minWorkers=1 --testTimeout=15000` —
  127 files, 1,898 tests, 100% statements, branches, functions, and lines.
- `npm run build` — passed.
- `npm run electron:build-main` — passed.
- `npm run control-center:test` — 33/33 passed.
- `git diff --check` — passed before this report was added; rerun at slice exit.
- Production Chromium verification is recorded in
  [`evidence/S247-guided-measurements-verification.json`](evidence/S247-guided-measurements-verification.json).
  A fresh local profile recorded an explicitly added invalid reading and a
  separate raw draft, reloaded the app, and recovered both without converting
  the draft into a reading. Keyboard activation and the browser accessibility
  tree expose the capture route and its field labels, status, source limits,
  and correction. Axe reported zero WCAG 2.1 A/AA violations at 320, 390, and
  1440 CSS pixels; the document had no horizontal overflow and the browser
  emitted no warnings, errors, or failed requests. Screenshots and SHA-256
  digests are included in that report.
- Protected export-identity tests passed in the full suite. All eight approved
  baseline digests are unchanged.

The browser proof is an automated Chromium and axe review. It does not claim a
manual assistive-technology evaluation, a usability study, physical fit, or
sewn-garment validation.

## Scoped manual-quality findings

- **MQF-001:** reviewed at M01. A generated starter style does not mark Measure
  complete on first run. Selecting Garment and explicitly opening Guide my
  measurements makes Measure current; successful advancement marks it complete.
  Fresh-start and reload behavior pass integration and browser checks.
- **MQF-013:** reviewed for the G03 route only. Field type/reference frame,
  current draft use, source limits, values, readings, and next correction are
  shown together in the measurement workflow. This does not redesign the
  global Material/Stretch controls.
- **MQF-014:** reviewed for M01 measurement guidance. Recipe-specific help and
  correction paths are visible beside the fields they explain. The broader
  location of the app-wide Guidance & material advice section remains a
  post-G17 discussion item.

No manual finding was added to the implementation roadmap or Control Center.
The other findings retain their existing owners and deferred review points.

## M01 exit and next boundary

All M01 recipe, source, provenance, invalid/conflict, resume, first-run,
narrow-layout, keyboard, and screen-reader-facing semantics gates are
implemented and verified. M01 can move through Control Center review to Done.
M02 remains unstarted until the next numbered slice. Slice 248 owns the
deterministic one-size creation contract and value mapping for the existing
project/style and drafting pipeline. This exit does not inherit legacy grade
tables, change output baselines, add a garment, or make a physical-fit claim.
