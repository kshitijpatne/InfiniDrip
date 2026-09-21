# EPIC 11 — Polo V2 Fidelity Refinement Exit Report

Date: 2026-09-21
Owner: Codex
Reviewed contributor: Claude Code CLI, headless Opus 5, bounded read-only
Slice 160 audit in an isolated worktree
Epic 7 prerequisite: reviewed integration `db14b63`
Epic 11 implementation commits: `b47177a`, `2f22d6a`, `c8914fb`, `db89666`,
`180ef54`, `f9c2ae8`

Status: complete. Codex reviewed the complete implementation, repaired the
independent exit-audit findings, ran the full digital gate, and recorded the
durable handoff below. This report does not claim physical fit or production
readiness.

## Implemented boundary

Epic 11 upgrades the existing `polo` recipe in place. The final implementation
contains:

- neckline-derived shaped outer/inner stands and upper/under collars with
  measured CB, shoulder and CF landmarks;
- live placket-base clip and reinforcement marks;
- adjustable side vents and a dropped back hem with aligned topology,
  measurements, POMs and actionable incompatibility guidance;
- shared front/back Body and assembled schematic facts;
- eight option owners with units, grouping, recovery compatibility and
  undo/redo coverage;
- option-aware tech-pack construction text and downstream parsed output
  coverage across SVG, DXF, tiled PDF, A0, projector and tech pack;
- cross-size, boundary, crossed-risk, surface-placement and deterministic
  narrow/wide marker pressure coverage.

The nine physical Polo roles, existing save version, Epic 7 nesting semantics,
non-Polo output bytes and protected export hashes remain unchanged. Polo's A0
recipe opts into the existing whole-piece overflow mode because true-scale
default pieces can exceed one portrait A0 sheet; the output is checked
page-locally rather than silently shrunk.

## Codex exit-audit repairs

The isolated Opus 5 audit identified three real Slice 160 gaps. Codex reviewed
the actual code and fixed them in the integrated checkout:

1. Polo A0 export now opts into the existing overflow route, and parsed tests
   assert one bounded true-scale page per piece rather than accepting
   off-sheet coordinates on a nominal one-page output.
2. Tech-pack construction steps now follow the live vent and back-drop values,
   including explicit unresolved text for finite invalid combinations.
3. Side-seam mismatch guidance targets `option-backHemDrop` when a positive
   back drop is the active cause with vents disabled; otherwise it targets the
   vent option.

The contributor made no production or tracked changes. Its report was treated
as a finding source, not as acceptance evidence.

## Verification gate

| Command | Result |
|---|---|
| `npm test -- --reporter=dot` | 103 files / 1,412 tests passed |
| `npm run coverage -- --reporter=dot` | 103 files / 1,412 tests; 100% statements, branches, functions and lines |
| `npx tsc --noEmit` | passed |
| `npm run build` | passed; 105 modules transformed |
| `git diff --check` | passed |
| focused Polo drafting/export/pressure run | 13 files / 208 tests passed |
| focused Polo recovery/undo/redo UI run | passed |

The permanent export identity gate remains green. No baseline was moved.

## Drafted, rendered and parsed evidence

The pressure matrix covers XS, M and XL redrafts; all declared option
endpoints; crossed-risk values; shortest-body maximum placket and vent values;
finite edges and marks; independent flattened-loop simplicity; report and
stitch checks; incomplete recovery; undo/redo; deterministic 55 cm and 150 cm
graded markers; and populated `front` plus `upperCollar` surface placements.

Live mounted-app review on a fresh local origin confirmed:

- Pattern labels for `VENT TOP`, placket-base clips/reinforcement, the four
  collar/stand roles and front/back pieces;
- Body front/back and assembled views using finite shared collar/stand facts,
  with vent/drop cues emitted as actual SVG paths;
- Size run labels for XS, S, M, L and XL across all nine Polo roles;
- Spec rows for distinct front/back body lengths and back hem drop;
- Nesting's deterministic 150 cm marker, requiring 98.3 cm and fitting;
- Check's nine-piece and collar-interface validations;
- Edit's normal inspection route and Style's four option groups;
- a live `sideVentDepth=0` case that showed a warning tied to
  `option-backHemDrop`, then restoration to the default vent value.

Parsed output evidence proves 18 SVG polygons, 18 DXF cut polylines, tiled PDF
content, nine bounded A0 pages, five projector layers, four-page default tech
packs, and five-page populated-surface tech packs. The output suite checks
calibration, marks, labels, finite coordinates and no `NaN`/`Infinity` tokens.

## Protected legacy hashes

The eight protected Tee/Darted-tee hashes remain byte-identical:

| Output | SHA-256 |
|---|---|
| `tee.svg` | `3fbf2e3215af5bdfc66398b9b16714e8ee8139f5edc10dab527bc4c8378f2b9d` |
| `tee.dxf` | `0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9` |
| `tee.pdf` | `1256ccf60abedeed40b01915ea9a2df4d063b224d01a39dfbf8730136a128523` |
| `tee.techpack` | `6691a28a6cae0baccfe271887c6d4d00a968867fe0628a8e1d1eacd2b8b047d1` |
| `fitted.svg` | `cd16df87d100a40866e20738f858d3f11fdc3238ba0db88d99ca3a46f981a09c` |
| `fitted.dxf` | `e2dd0a36ea6d834a0aec470918f4ba2b823136c13998966a8f04ddeda085a8a6` |
| `fitted.pdf` | `184dcd975bb8067b452370c78748045384bb18fa8f89f7ca1d4a583b9d0190ff` |
| `fitted.techpack` | `8e89320bfa235c44ebb481b01012a43c7c1614ce27608ccbb49df31369bca8d2` |

## Limitations and handoff

- No garment has been physically sewn or fit-validated. This evidence does not
  establish fit, drape, collar roll, recovery, wash behavior, sewability,
  manufacturing quality or production readiness.
- Sleeve rib/band negative ease and upper-collar turn-of-cloth remain deferred
  because the current draft graph has no material stretch/recovery contract or
  physical evidence for a universal value.
- Polo grading remains measurement-driven re-drafting; no isolated manual CAD
  grade offsets were added.
- Browser evidence is local mounted-app evidence and does not imply a
  cross-browser, cross-OS or physical guarantee.
- The existing untracked `coverage-p1.log`, `p1-focused.log` and `tmp/`
  artifacts were intentionally left untouched and are not part of the Epic
  commit.

The next safe lane is maintainer review of this report and the reviewed Epic 11
commit range. Future Epic 8 work remains separately scoped and must not be
treated as part of this garment exit.
