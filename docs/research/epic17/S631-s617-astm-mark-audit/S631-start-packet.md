# EPIC-17 / G04 V03 — Existing ASTM-labeled output mark audit — Slice 631 start

## Verified start and authority

- Started `2026-10-09 17:59:27 UTC` from clean S630 commit
  `4b5be3619c3b3398197a03044b6feefa464e962e` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor; S630 was highest, so reserve unique S631. Canonical board revision
  3664 keeps G04-V02 Done and G04-V03/EPIC-17 In Progress.
- S630's specific next action is to inspect the already-existing S617
  CLO 2026.1.310 DXF-ASTM-labeled export and saved reimport render offline.
  S617's source, derivative, exported output, rendered scene and previous
  comparison hashes are recorded in
  `docs/research/epic17/S617-standard-dxf-units-header/` and its C:-only
  exchange folder. No exchange needs to be repeated for this slice.
- The maintainer has confirmed in writing that CLO's free trial may be used
  for InfiniDrip product-development evaluation and that DXF files are
  processed locally. This slice makes no CLO UI call; keep the existing app
  open for future admitted work. New derived exchange evidence, if any, must
  stay under `C:\G04-CLO-DXF-Exchange\S631-s617-astm-mark-audit\`.

## Bounded objective

Determine what the completed S617 ASTM-labeled export contains for the exact
source's `MARK_*` LINE/CIRCLE/POINT entities and whether the saved reimport
render provides usable detail evidence. Bind piece identity through the
existing hash-pinned source/output and same-piece CUT/SEW correspondence;
inventory exact output entity type, layer, piece block and transformed
geometry; compute point/curve residuals at the unchanged `0.001 cm` V03 gate;
separate true one-to-one preservation from shared-path or boundary
coincidence. Review the saved CLO render at overview and detail scale. This is
an offline audit of a completed Standard-DXF import → DXF-ASTM export →
Standard-DXF reimport; do not describe it as an ASTM import or a D6673
conformance test.

## Acceptance, non-goals and holds

- Recheck SHA-256 for the source variant, ASTM-labeled output, prior fine
  CUT/SEW report, CLO saved render and native reimport scene against S617's
  pinned values before relying on them.
- Emit a deterministic machine report for every source mark: source piece,
  layer/role and primitive, coordinates/curve definition, corresponding
  output block/layer/entity candidate, transformed geometry, residual and
  evidence disposition. List unmatched, tessellated, shared-path and
  ambiguous candidates separately; a coincident outline or missing
  source-layer label cannot count as semantic preservation.
- Inspect the existing S617 reimport render at its available resolution.
  Produce detail crops only from that saved render and only inside the named
  S631 C: evidence folder. If it does not show readable marker detail, say so;
  do not relaunch CLO to obtain another screenshot in this slice.
- No source/pattern/stitch change, DXF rewrite, CLO operation, new conversion,
  purchase, external contact, rights reinterpretation, gate/tolerance/status
  change or assertion of profile compatibility/conformance.
- S617 is one Polo size-M fixture. It cannot clear all-seven coverage,
  supported options/grades, identity/revision, industrial-profile rights or
  version, invalid-input, repeatability, or full rendered-output gates. Keep
  all existing V03 holds and V02-before-V03 dependency unchanged.
- Do not touch legacy DXF behavior or protected export byte identities. No
  physical-fit, factory-acceptance or production-readiness claim.

## Verification, delegation and next gate

- Codex owns the parser/matcher, hashes, output overlays/crops, conclusions,
  durable records and board. The analysis is coupled to the exact old fixture
  and comparison method, so no safe disjoint agent task is manufactured.
- Verify hashes before parsing; assert inventory counts and no NaN/Infinity;
  run `node --check`, the deterministic audit twice and compare report hashes,
  inspect generated report and output crops, run S631 preflight/replay/verify,
  `npm run control-center:test`, and `git diff --check`. No product code
  changes are expected, so changed-production-code coverage is not applicable.
  The full suite/global 100% coverage and integrated rendering gate remain
  reserved for the settled Epic/PR candidate.
- After a passing source audit, choose the next V03 operation only from a
  concrete measured gap and prior-slice ledger; do not repeat the S617
  scale/export sequence or interpret the ASTM menu label as a normative
  edition. If no S617 output mark can be tied uniquely to a source mark, retain
  the V03 mark/profile holds.

## Verified board-start evidence

The validated start replay should attach this packet and one bounded scope
comment to G04-V03, incrementing board revision 3664 to 3666 without changing
work-item status.
