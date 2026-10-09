# EPIC-17 / G04 V03 — DXF-ASTM import-mode comparison — Slice 632 start

## Verified start and authority

- Started `2026-10-09 18:14:10 UTC` from committed S631
  `b2bb1258ed98ad23f2c7654b7a3bad0453906167` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor; working tree was clean; slice 631 was highest. Board revision
  3668 preserves V01/V02 Done and V03/EPIC-17 In Progress.
- Input is the already validated, source-unchanged S617 Polo M centimeter
  header variant. It was copied byte-for-byte into this slice's named input
  folder. Both source and copy are 24,326 bytes, SHA-256
  `71F45FDCA602BBDDB32BA53F76F0B5D9B6E92094D96557414C182C5EAF42E5F5`.
- The maintainer has confirmed in writing that the CLO trial may be used for
  InfiniDrip product-development DXF evaluation and imported/exported files
  are processed locally. No further permission or locality decision is
  needed. CLO 2026.1.310 is already running and remains open throughout G04.
- Dedicated C: paths: input
  `C:\G04-CLO-DXF-Exchange\S632-astm-import-mode-polo\Input\`; exports
  `...\Output\`; CLO screenshots/projects and analyzer reports
  `...\Evidence\`. Do not save or import an exchange file outside this named
  C: folder.

## Decision tested

S631 found specific point/line/circle mark failures in the S617 Standard-DXF
import → DXF-ASTM-labeled export. Test whether choosing CLO's documented
DXF-ASTM **import** mode for the exact same input changes the actual
source-bound mark and contour result when DXF-ASTM remains the export mode.
The single controlled variable from S617 is the import mode. This is a
practical receiver behavior test, not an assertion that CLO's menu label
identifies a normative ASTM edition or certifies conformance.

## Exact workflow and controls

1. Before changing the current CLO workspace, preserve its visible Woven
   scene by saving a separate safety copy inside this S632 C: evidence folder
   if CLO indicates unsaved changes. Never overwrite an existing project.
   Then create a clean CLO project for this test.
2. Import the hash-pinned input once as **DXF-ASTM**, centimeters, 100%, Do
   Not Rotate. Keep grain, notch, curve-point, curve-optimization,
   remove-non-grading-point and seam-allowance choices fixed to S617/S609's
   documented settings wherever exposed. Capture the exact dialog/settings,
   notices/errors, pattern count and rendered piece layout.
3. Export selected fixture patterns once as **DXF-ASTM / Graded Nest**,
   centimeters, 100%, Do Not Rotate; keep the recorded S617 export choices
   (notches, seam allowance, curve conversion/optimization and bounding box)
   fixed. Save generation 1 only in this S632 Output folder.
4. Reimport generation 1 as DXF-ASTM with the same settings, export
   generation 2 with the same export settings, and save it only in S632
   Output. Reimport generation 2 as DXF-ASTM for final rendered review and
   save the CLO project/render in S632 Evidence. Do not make any pattern,
   mark, line, or seam edits between generations.
5. Hash-pin every input/output/project/render. Compare all nine piece
   identities, all CUT and SEW contours, and each of the 38 source marks
   against generation 1 and generation 2 at the unchanged `0.001 cm` gate.
   Explicitly report missing, ambiguous, shared-outline, duplicated,
   tessellated, or semantically unlabelled mark results. Inspect rendered
   pieces and fine marks at usable zoom; a successful dialog operation or
   gross piece count alone is not acceptance.

If any CLO error, unexpected modal, target-window/screenshot mismatch, or
settings unavailable to keep the comparison controlled occurs, stop before
the next exchange action, save the concrete screen evidence to this named
folder when possible, and report the observed blocker. Do not guess enum
values, cycle settings, repair source geometry, create semantic mappings,
relax acceptance, or close any hold.

## Acceptance boundaries and verification

- The trial can clear only the exact tested behavior it proves. V03 still
  requires the admitted seven recipes/configurations, documented industrial
  profile and evidence-based rights, exact geometry, identity/revision,
  layer/mark semantics, grading/options, malformed-input rejection,
  repeated-generation behavior, readable rendered output, and independent
  receiver/profile support as applicable. Keep V02 Done, V03 and EPIC-17 In
  Progress until every admitted exit criterion is proven.
- Do not change product source, pattern or stitch graph, legacy DXF behavior,
  protected export byte identities, tolerances, or roadmap/acceptance. No
  broad UI, new recipe, physical sampling, supplier contact, launch expense,
  hosted service, physical-fit/factory-acceptance/production-readiness claim.
- Codex owns this single stateful CLO exchange; no safe disjoint contributor
  task exists. Review exact imported/exported files, hashes, analyzer outputs,
  dialogs and rendered evidence. Run focused checks for changed scripts,
  validated board replay/preflight and `npm run control-center:test` at exit.
  No product-code change is expected, so changed-production-code coverage is
  not applicable. Save the full repository gate for the settled Epic/PR.
- Preserve elapsed time separately for CLO preparation/exchange, analysis,
  focused verification/closeout, external-agent waits, and maintainer-decision
  time. A single screenshot mismatch was recovered by fresh app/window
  selection and activation. After start, one File-menu click attempt was
  interrupted by detected user input and its outcome was unknown. A fresh
  capture showed Open CAD Studio in the foreground even though the selected
  window's accessibility tree still identified CLO. No file dialog, imported
  DXF, or exported DXF was observed. Do not reuse coordinates or retry until a
  fresh capture shows the intended CLO window and its matching accessibility
  tree; otherwise leave the user's selected application untouched.

## Single next action

Use the already open, now correctly observed CLO 2026.1.310 session to run the
fixed DXF-ASTM import-mode comparison above once and capture every output in
the named S632 C: folder.
