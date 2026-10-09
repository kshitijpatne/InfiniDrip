# EPIC-17 / G04 V03 — Open CAD R14 profile metadata pilot — Slice 646 start

## Verified start

- Started `2026-10-09 23:14:37 UTC` from clean S645 commit
  `ef28519c21314eed0280ed4e6982849284da16b6` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S645 is highest assigned; reserve S646.
- Board revision 3726 links S645 exit; V01/V02 Done and V03/Epic In Progress.
  Start replay adds evidence/comment only.
- The initial S646 packet limited this pilot to OpenCAD and excluded CLO UI.
  On 2026-10-09 the maintainer explicitly directed practical testing with
  available tools and asked to continue in CLO. That steering authorized one
  distinct CLO import of the generated metadata-bearing R14 output in the
  existing session. It did not authorize repeated producer-encoding trials,
  export after a failed pre-export gate, changing any source geometry, or
  changing V03 criteria. CLO's existing local/product-development permission
  remains documented in S625 and subsequent packets.
- Rights/locality evidence for the OpenCAD Studio 2026.40.1 portable copy was
  reviewed in S624: GPL-3.0, official asset/source, verified signature, and
  versioned local CLI path. The existing executable is already under the
  S624 C:-only evidence directory; do not download or install another copy.

## Objective

Correct S645's too-narrow statement that CLO is the only confirmed receiver:
S624 established a local, licensed-by-GPL generic R14 receiver candidate with
exact geometry/repeatability, but did not test an apparel-profile metadata
contract. Run one bounded, disposable OpenCAD R14 profile-structure pilot to
measure whether named piece blocks, explicit cm units, CUT/SEW/MARK layers,
and registered-application XDATA identity survive its import/export path.
Use one current-source Polo M fixture, which exercises the known CUT feature
and multiple marks; bind geometry independently by source IDs, not file order.
After the two-pass OpenCAD profile pilot, import its exact first R14 output
once in CLO DXF-AAMA/centimeter/100%/no rotation and query native contours.
This is a receiver test of a different, metadata-bearing producer output; it
does not repeat an entity-encoding or CLO setting permutation.

All new input, output, reports, and rendered evidence must remain under
`C:\G04-CLO-DXF-Exchange\S646-open-cad-profile-metadata-pilot\`. Reuse the
existing official portable binary and the already-running CLO session. No
software download/install, account, vendor contact, cloud upload, paid use,
pattern source change, legacy writer change, or protected export update.

## Acceptance boundaries

This is a one-recipe candidate pilot, not V03 completion. Keep the industrial
profile, all-seven recipe/options/grades, exact CUT/SEW and mark semantics,
identity, malformed-input, repeated-generation, readability, and
`0.001 cm` gates unchanged. Name the receiver/profile only at the narrow
measured scope; do not claim AAMA/ASTM or factory acceptance. A passing
metadata pilot could enable an all-seven profile cohort; a failure closes
this specific identity carrier, not all R14 possibilities.

## Verification and closeout

Preflight the source and wrapper; measure first- and second-generation R14
outputs and compare exact geometry, layer names, block identities, XDATA
payloads, and mark multiplicities. Produce/importer-generated rendered
evidence and inspect it visually. Run focused analyser assertions, script
syntax, Control Center tests, validated board replay, and `git diff --check`.
No production-code change; no global coverage/build gate applies to this
disposable evidence pilot. Record analysis/operation, focused verification,
external-agent waits and maintainer-decision time separately at exit.
