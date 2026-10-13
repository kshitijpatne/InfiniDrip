# Slice 779 exit — T05 change control and compatibility

**Status:** Complete; G05-T05 closes on this boundary. EPIC-18 remains In
Progress for the S780 integrated gate.
**Branch/worktree:** `codex/epic-18-g05` at
`C:/Users/kshit/.codex/worktrees/epic-18-g05/designApp`.
**Starting checkpoint:** landed S778 commit
`e5c62ada9cec87b9e5daafff093824e91bd9ace0`; refreshed
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
**Board:** S779 start replay links its packet to G05-T05 and EPIC-18 at
revision 4662. Final status, evidence links, replay verification and board
revision are recorded in `post-replay-verification.md`.

## Result

The second and final T05 boundary is complete. The local Tech Pack manager now
compares frozen schema-v3 shares with the active saved revision. It marks
noncurrent captures as historical/stale, keeps their verified download
controls, and provides the next review/approval/freeze action for the current
draft. Current captures are labeled for the saved revision. The existing
immutable workflow already creates a new revision and resets its Tech Pack
approval to DRAFT; additive manifest storage preserves prior ZIP/PDF bytes.

The broader design journey also invalidates Style and digital-check review on
a design input edit. A mounted-app regression proves that Export readiness is
available after the normal review path, then returns to Check and becomes
unavailable after an edit. The manager render test applies the same stale-share
guidance to all seven registered recipe IDs using synthetic records. No recipe
fact, production input, supplier state or physical claim changed.

## Acceptance and verification

| Gate | Result |
| --- | --- |
| Review, approval and output invalidation | Pass: saved-design workflow creates a new immutable revision and resets approval/scope to DRAFT; the app regression proves a design edit invalidates the reviewed Check/Export readiness. |
| Historical frozen files | Pass: workflow test verifies the old manifest remains present and reads back byte-identical ZIP/PDF content before and after an edit; manager controls keep those files downloadable and label them historical/stale. |
| Seven recipe IDs | Pass: synthetic manager-render coverage exercises stale-share guidance for every registered recipe. |
| Legacy import/package compatibility | Pass: existing project-package 58/58, project-workflow 58/58, style-revisions 12/12, and Tech Pack sharing 4/4 suites. Historical schema-v1/v2 records remain on their existing parse/round-trip paths. |
| Protected legacy exports | Pass: `src/export/regression.test.ts` and `src/quality/export-identity.test.ts`, 17/17 combined; all eight established hashes remain unchanged. |
| Changed production-code coverage | Pass: `src/ui/project-manager.ts` reaches 100% statements, branches, functions and lines in the strict full manager suite (30/30). No other production module changed in S779. |
| Additional focused verification | Pass: targeted app journey regression 1/1 and all listed compatibility/export suites; 180 focused tests across the enumerated suites. `npx tsc --noEmit` passes. |
| Actual browser behavior | Pass on the final source in Chromium: local scoped review → approval → freeze → ZIP/PDF downloads → valid T01 edit/save → stale/history guidance → byte-identical historical downloads; Enter activates the PDF download. No page errors. |
| Responsive output | Pass at 1280×800 and 390×844; document/body widths match each viewport, historical ZIP/PDF controls remain readable and operable. Screenshots and the current Playwright report are in `evidence/`. |
| Generated files | Pass: the ZIP contains its manifest, full Tech Pack record and production PDF; the embedded PDF equals the standalone PDF byte-for-byte. The retained unencrypted seven-page A4 PDF was text-extracted and visually inspected. |
| Control Center and hygiene | Validated status/evidence replay and final read-back are recorded in `post-replay-verification.md`; Control Center 42/42 and final `git diff --check` are recorded there. |
| S780 gate | Not run here. The settled global coverage, integrated review, production build, browser/Electron and output replay remain assigned to S780. |

### Protected legacy export hashes

| Export | SHA-256 |
| --- | --- |
| tee.svg | `3fbf2e3215af5bdfc66398b9b16714e8ee8139f5edc10dab527bc4c8378f2b9d` |
| tee.dxf | `0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9` |
| tee.pdf | `1256ccf60abedeed40b01915ea9a2df4d063b224d01a39dfbf8730136a128523` |
| tee.techpack | `6691a28a6cae0baccfe271887c6d4d00a968867fe0628a8e1eacd2b8b047d1` |
| fitted.svg | `cd16df87d100a40866e20738f858d3f11fdc3238ba0db88d99ca3a46f981a09c` |
| fitted.dxf | `e2dd0a36ea6d834a0aec470918f4ba2b823136c13998966a8f04ddeda085a8a6` |
| fitted.pdf | `184dcd975bb8067b452370c78748045384bb18fa8f89f7ca1d4a583b9d0190ff` |
| fitted.techpack | `8e89320bfa235c44ebb481b01012a43c7c1614ce27608ccbb49df31369bca8d2` |

The final local browser capture froze manifest
`f0f7d708-09cc-4b88-8a5e-96237411f744` for revision
`fc755cbb-4850-44c3-9981-cc26e26a2646`; the saved edit created revision
`2e5c32d7-64f0-4ff9-b266-3c92c8b07bca`. ZIP bytes remained 3,739 with SHA-256
`9a1274bcf9a581ef0e63e69d1416f16a0ded4372cde535783f5eac7db46a9072` and PDF
bytes remained 12,082 with SHA-256
`ae0dd34ca90436700327369653e927e64f298dde821383487e97a0acbd9e430a`. The
same values are recorded by the browser report and
`evidence/output-inspection.md`.

## Diagnosed verification attempts

- The first strict coverage attempt found 99.91% branch coverage because of
  one unreachable missing-source-revision fallback. The unsupported branch was
  removed; the final 30-test strict manager run passes all four 100% metrics.
  The first report and diagnosis are retained in
  `evidence/coverage-first-attempt.txt`.
- The first browser attempt toggled an already-open `<details>` closed because
  the script treated an empty `open` attribute as false. The script now tests
  for attribute absence; the final-source Chromium sequence passes. The first
  attempt is recorded in `evidence/browser-first-attempt.txt`.
- The first final Control Center run passed 41/42 at board revision 4671. The
  UIQ-10 summary reconciliation had dropped the required explicit
  `UIQ-10-ADMISSION.md` path. Its failing output is retained in
  `evidence/control-center-first-attempt.txt`; a validated board edit restores
  the path, and the final 42/42 run passes. Both status and evidence hash
  read-back are in `post-replay-verification.md`.

## Boundary status, limitations and holds

Both admitted T05 boundaries now pass: S778 freeze creation and S779 change
control/compatibility. G05-T05 is Done with verified S778 and S779 exit
evidence. EPIC-18 remains In Progress; G05-EXIT remains Backlog. S780 is the
single next admitted boundary for the settled integrated/global gate, followed
by S781 for merge, main CI/deployment and Epic closeout. No export baseline
moved. Browser data and sample values are synthetic/local; they do not
establish physical sewing or fit, supplier or factory acceptance, or production
readiness. Launch, provider-backed, identity, supplier, paid-service and
production-release holds remain unchanged.

No safe disjoint coding contribution existed because edit invalidation,
revision approval, historical bytes and compatibility share the same workflow
and UI boundaries. External-agent wait and maintainer-decision wait were zero.

## Time accounting

Started 2026-10-13 18:18 UTC. The final validated replay completed at about
19:18 UTC, approximately 60 minutes elapsed. Rounded active-time estimates:
implementation 12 minutes; focused tests, coverage and TypeScript 20 minutes;
actual output/render/browser review 10 minutes; checkpoint documentation and
board replay 18 minutes. External-agent wait and maintainer-decision wait were
both zero. The replay report records the final board verification and elapsed
stopping point.

## Next action

After this exit report is hash-verified and G05-T05 is closed through the
validated board command layer, begin admitted S780 from the landed S779
checkpoint. Run its settled full repository coverage/build and integrated
browser/Electron/output gates once on the completed candidate; preserve any
failure output and diagnose before the final gate. S781 remains the later
merge/deployment/closeout boundary.
