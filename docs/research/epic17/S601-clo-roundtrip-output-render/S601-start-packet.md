# EPIC-17 / G04 V03 — inspect the actual S595 exported DXF after reimport — Slice 601 start

## Verified start

- Started `2026-10-09 09:31:01 UTC`, branch `codex/epic-17-g04`, at S600
  `d2d9001cf8a60c830c135c2f248112d288abc269`. Refreshed `origin/main` is
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` and remains an ancestor. The
  worktree was clean before S601 files. Board revision is 3534; EPIC-17 and
  G04-V03 remain In Progress; V01/V02 remain Done. S601 is the next unique
  slice after the verified `Slice 600` commit.
- CLO 2026.1.310 is the already-running session. Keep it open. Product-use
  authorization and local-only processing are settled; use only the named
  `C:\G04-CLO-DXF-Exchange\S601-clo-roundtrip-output-render\` folder for
  S601 files and captures.
- Hash-pinned input: S595 periodic Polo M DXF,
  `C:\G04-CLO-DXF-Exchange\S595-polo-periodic-spline-roundtrip\Input\polo-m-periodic-degree1-spline.dxf`,
  29,412 bytes, SHA-256
  `E050B9DD3E49677494878BE9460E0E740BEBE3CE1F97A731A328786E706CAEBC`.
- Hash-pinned receiver output: S595's CLO-emitted DXF-AAMA,
  `C:\G04-CLO-DXF-Exchange\S595-polo-periodic-spline-roundtrip\Output\polo-m-periodic-degree1-spline-clo-aama.dxf`,
  219,416 bytes, SHA-256
  `E31F45437ECADB4ED40E7B2BFB99468509CEEBF17027C87F4E9F8150906C22F2`.
  S595's saved project is the input-side imported scene; it is not a reimport
  of this output. S600's snapshot likewise documents only that input-side
  scene. The saved S595 output has already been numerically checked, with 5/9
  CUT failures and 9/9 SEW passes at 0.001 cm; this slice does not repeat its
  export or its numeric test.

## Objective

Load the exact, pinned S595 receiver DXF into a clean new scene in the existing
CLO process and capture how that actual exported file reimports and renders.
Compare visible piece count, annotation/mark presence, and label/line
readability with S600's input-side view and the existing S595 source/output
analysis. This directly fills S600's documented output-side render gap.

## Scope and gates

- Confirm the current app is the existing CLO session. Preserve its current
  scene/project and do not close/relaunch CLO.
- Start a clean project or clean import context within the same session, then
  import only the hash-pinned S595 emitted DXF-AAMA with CLO's documented AAMA
  import mode, centimeter, 100%, no rotation. Do not edit the DXF, project
  geometry, or import options to force an appearance.
- Capture an unambiguous whole-scene view and a useful crop/snapshot of any
  readable marks or the known crowded collar group. Store project/render files
  only under the named S601 C: folder. Compare only visible features. Do not
  infer that marks are lost, preserved, or manufacturing-equivalent without a
  source-identity match.
- Do not export again, alter source/output, vary DXF format/options, adjust the
  0.001 cm gate, accept CLO as the industrial profile, or close any V03 hold.
  Preserve all seven recipes, all five S595 Polo CUT failures, legacy DXF
  behavior, protected export byte identities, and all existing V03 gates.
- CLO's official help documents AAMA as an import choice and lists the export
  profile choices; that documents the operator mode only, not conformance:
  https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export

## Exit criteria

Record whether the pinned output imports without an application error, the
visible piece/line/mark/readability findings, artifact paths and SHA-256, and
any discrepancy versus S600's input-side snapshot. If import or capture fails,
preserve the exact visible error and stop this operation without another
profile variation. No result from this view can clear the geometric,
semantic, identity, rights/profile, grading, negative-input, all-seven, or
repeated-round-trip gates.

## Delegation and time

The operation depends on one live stateful CLO session, so it has no safe
disjoint delegation; Codex retains it. Record UI actions, output review,
focused verification, board closeout, external-agent waits, and maintainer
decision time separately at exit. No physical-fit, factory-acceptance, or
production-readiness claim is in scope.
