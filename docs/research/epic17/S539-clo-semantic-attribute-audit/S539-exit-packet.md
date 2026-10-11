# EPIC-17 / G04 V03 — CLO semantic attribute audit — Slice 539 exit

## Result

S539 rechecked the seven existing, hash-pinned generation-two CLO outputs;
it did not open CLO or read/write any DXF fixture. The output cohort is three
observed DXF-ASTM files (Tee, Polo, Woven) from S498 and four observed
DXF-AAMA files (Fitted, Tank, Trouser, Skirt) from S523. Those labels identify
the observed CLO menu selection only; this does not qualify either as an
industrial standard edition or conformance claim.

All 14 source/receiver inputs matched their S525/fixture-manifest SHA-256
values. Source CUT/SEW contours were mapped to the same S525 receiver blocks,
then geometry-matched again within `0.001 cm`, allowing cyclic/reversed vertex
order. Among contours present on receiver layer `8`, the observable
non-layer property signatures did not distinguish CUT from SEW in either
profile cohort:

- Every matched polyline has closed flag `70=1` for both roles.
- No line type (`6`), ACI/true color (`62`/`420`), lineweight (`370`),
  visibility (`60`), thickness (`39`), linetype scale (`48`), paper-space or
  layout value (`67`/`410`), extrusion vector (`210`/`220`/`230`),
  material/plot-style handle (`347`/`390`), per-vertex layer override, or
  XDATA application name was present as a distinguishing property.
- No stable CUT/SEW discriminator was found across the observed AAMA or ASTM
  cohorts. This is an empirical finding about these exact saved files and the
  inspected fields, not a general statement about all DXF implementations.

The audit maps 41/41 source SEW contours to layer 8. It maps 36/41 CUT
contours to layer 8; the five absent direct matches are Polo back, outer
collar stand, inner collar stand, upper pointed collar, and under pointed
collar. These are the same known Polo CUT geometry failures, not new losses.
The report preserves every per-piece signature, source hash, receiver hash,
and cohort in `C:\\G04-CLO-DXF-Exchange\\S539-clo-semantic-attribute-audit\\Evidence\\shared-layer-properties.json`
(SHA-256 `f55276078387d65ee96bec8e40e0a2d44b4ba3b1d2be26a5fff961776d102488`).
Two complete runs produced this same report hash.

## Diagnostic correction

The first script run stopped at `polo/back/CUT` because its initial assertion
incorrectly required a layer-8 match for every source CUT contour. S525 already
records this geometry as missing. The script was corrected to represent zero
matches as evidence rather than as an audit failure. The rerun then completed
all seven recipes and preserved all five Polo misses. No input, threshold,
fixture, or acceptance criterion was changed.

## Gate disposition

- **Newly established:** among the observed matched layer-8 entities, the
  examined common DXF attributes provide no CUT/SEW role discriminator.
- **Still open:** semantic acceptance and authoritative profile mapping;
  five Polo CUT contours remain outside the strict `0.001 cm` gate; 78 source
  marks remain without direct geometry match per S525 (this alone does not
  prove loss); malformed-input behavior, grading, import warning, exact
  profile/version, and independent receiver acceptance remain open.
- **Unchanged:** G04 acceptance, statuses, thresholds, legacy DXF behavior,
  protected export identities, and claim boundaries. EPIC-17 and V03 remain
  In Progress; V01/V02 remain Done. No physical fit, factory acceptance, or
  production-readiness claim is made.

## Verification and closeout

- `node --check docs/research/epic17/S539-clo-semantic-attribute-audit/audit-shared-layer.mjs` passed.
- The audit verifies 14 input hashes, parses all seven recipes, and ran twice
  to identical output SHA-256 above. Output remains in the named C: folder.
- Start board revision was 3267; validated start/exit replay is recorded in
  S539 board command files. Final board keeps EPIC-17/G04-V03 In Progress.
- `npm run control-center:test`: 42/42 passed; `git diff --check` passed.
  No production code changed, so changed-code coverage and the full repository
  gate are not due.
- Started 21:44:50 UTC from S538 `c2905f36a564c2004d8def74eed3d75e9ab9d9e9`;
  refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained
  an ancestor. Elapsed `21:44:50–21:46:58 UTC` (about 2m08s): input/code
  inspection and audit `1m10s`; focused deterministic run and result review
  `0m30s`; durable packet/board and focused suite `0m28s`; external-agent
  waits `0m`; maintainer-decision time `0m`.

**Next action:** continue V03 with an evidence-backed path that can establish
the required apparel profile and semantic contract. Do not infer CUT/SEW from
these shared layers or rerun the same files in CLO. Keep every V03 gate closed
until an exact permitted profile and representative round-trip pass.
