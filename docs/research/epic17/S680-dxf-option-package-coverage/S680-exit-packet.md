# S680 exit — complete option-bound DXF packages

## Result

The candidate package boundary now resolves every recipe option from an
explicit value or the recipe default, rejects unknown/malformed/non-finite,
out-of-range and off-step values, and drafts and hashes the same resolved
values recorded in the manifest. Omitted defaults and explicit defaults
produce the same revision.

The exact 73-row canonical S330 matrix exposed a second source defect: the
valid Woven zero-vent pattern block has optional object fields set to
`undefined`. The canonical comparison now follows JSON object behavior and
omits those fields. It no longer rejects this supported configuration.

All 73 canonical source configurations generated verified DXF/manifest pairs
with diagnostic SVG/PNG renders. The evidence records per-file hashes, option
counts, drawing and revision hashes, entity/layer counts, piece/stitch counts,
and verifier results. A 73-case contact sheet and representative high-detail
renders were visually reviewed. These are renders of emitted DXF entities,
not receiver output; fine-print receiver readability is not claimed. Raw output
is confined to `C:\G04-CAD-Interchange\S680-option-packages` and is not added to
Git.

## Verification

- Focused suite: **44/44 passed** across seven test files.
- Changed production module: **100% statement, branch, function and line
  coverage**.
- `npm run build`: passed; existing large-chunk advisory only.
- `npm run control-center:test`: **42/42 passed**.
- All 73 package entries are verified, explicitly record `cm` and DXF unit
  code `5`, and correspond to the pinned S330 matrix. The distribution is 1
  Tee, 1 Fitted, 1 Tank, 17 Polo, 28 Woven, 1 Skirt and 24 Trouser.
- Contact sheet and representative Tee, Polo, Woven zero-vent and Trouser
  renders inspected; no blank or broken output observed. This does not release
  construction/readability holds or claim receiver rendering.
- Existing default drawing bytes, legacy behavior, protected identities and
  export baselines were preserved. No external CAD software was launched.
- `git diff --check` passed; source package unit/header agreement remains
  verified by the unchanged package verifier.

## V03 disposition and next action

S680 closes source-side complete-option and Woven zero-vent serialization
defects only. It does not pass a receiver gate. Existing evidence still records
concrete failures for the previously tried routes: CLO geometry/mark and
malformed-input failures, DGS import/export loss, LibreCAD R12 removal of the
unit note, and generic OpenCAD fail-open malformed input plus lack of an
industrial apparel profile. Do not spend another slice repeating those same
candidate permutations. Reconcile each unchanged V03 criterion against the
actual existing source and receiver evidence, name any remaining product-code
defect supported by that evidence, and stop a candidate that already fails its
acceptance gate. V03 remains In Progress and its acceptance, all-seven scope,
grade/options, protected identities, output readability and rights/profile
requirements are unchanged.

## Slice ledger

- Started 2026-10-10 18:03:37 UTC from clean S679 `dff78e78`; origin/main
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor; board 4033.
- Closed 2026-10-10 18:11:00 UTC; board exit replay is 4035→4037 after the
  start evidence/comment revisions 4033→4035.
- Elapsed about 7m23s: implementation and source review ~3m30s; focused tests,
  coverage and build ~45s measured; 73-package render/review ~1m20s; docs and
  board closeout ~1m; external-agent waits 0; maintainer-decision time 0.
- Full repository coverage/build/output gate remains reserved for the settled
  integrated Epic/PR candidate. No physical-fit, factory-acceptance,
  standards-conformance or production-readiness claim.
