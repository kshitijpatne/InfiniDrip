# EPIC-17 / G04 V03 — S712 fail-closed audit contract

## Verified start

- Start: 2026-10-11 02:49 UTC from committed S711 `6b3020a56b0ce9e1cfb1b0dd4c17f15b814144c3`, branch `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S711 is the highest assigned landed slice; reserve S712 once.
- Canonical board revision 4175: EPIC-17 and G04-V03 In Progress; G04-V01/V02 Done. Goal remains active. Primary-window usage permits work.
- Two S700 coverage diagnostics are pre-existing untracked repository artifacts; leave them untouched and list them for final cleanup review.
- V03 plan/matrix: `docs/research/epic17/S709-v03-reconcile-and-stop-churn/`; returned-file audit introduced in S710. No receiver is eligible; no more app runs are planned.

## Objective and boundaries

Verify the existing public `auditDxfInterchangeRoundTrip` fail-closed contract against its existing malformed, unsupported, missing-identity, altered-mark/layer, geometry, and duplicate-instance fixtures. For each rejected return, confirm the result is explicitly failed, gives a nonempty actionable reason, and exposes no partial piece/outline/mark counts. Keep the unchanged source-package hash check, `0.001 cm` limit, all-seven/options/grades scope, legacy writer and protected byte identities unchanged. Make the smallest production change only if current behavior fails this contract; otherwise add only the missing focused assertions.

This is a source-side verifier contract check from S709's ranked plan. It cannot clear the independent C04 receiver-UI requirement because InfiniDrip currently has no DXF-return import screen, and it cannot qualify a receiver/profile or make CLO pass. Do not present an audit API message as proof of a receiving application's visible rejection.

## Required gates

- Reuse `src/export/dxf-interchange-roundtrip.test.ts` fixtures and the current package/round-trip functions; no CAD application or new file variation.
- Focused test(s) cover malformed return, missing units/identity/outline, changed layer/mark, non-finite/invalid closure, extra entity, duplicate INSERT and source package tampering. Failure reports contain `passed:false`, a reason, and zero counts; a valid S710 source-bound return remains independently covered by its existing test/evidence.
- If production changes, obtain 100% changed-code statement/branch/function/line coverage and preserve the exact legacy DXF and protected export-byte identity tests.
- Run focused interchange and regression checks, TypeScript check, and `git diff --check`; do not run the global gate before the settled Epic/PR candidate.
- Update packet, PROJECT-STATE, CONTEXT-INDEX, admission, and the canonical board through the command layer. Close S712 with separate timing for implementation, focused verification, agent waits, and maintainer decisions.

## Non-goals

No new UI/importer, receiver/app, standards/compatibility claim, acceptance relaxation, threshold/fixture change, profile qualification, broad redesign, garment geometry change, cleanup before the final candidate, or unrelated refactor. No safe independent ownership exists for this shared audit contract; Codex retains it.

## Exit criteria and next action

Close only after the existing negative fixture set proves explicit failure with no partial counts and all applicable focused gates pass. If this source audit passes, preserve the separate receiver-visible malformed-input gate as unproven. Next work remains limited to source fixes directly supported by measured evidence; no new receiver trial or broad matrix until an eligible profile passes a current-source pilot. Final full coverage/build/browser/Electron/output review, necessary-file cleanup, safe PR merge, refreshed ancestry, required deployment and production end-to-end verification remain explicit.
