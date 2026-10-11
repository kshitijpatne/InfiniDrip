# EPIC-17 / G04 V03 — S717 real-package UI audit

## Verified start

- Start: 2026-10-11 03:33 UTC from S716 commit `8c3175fd5778c84485dadb8c838476a445ef4b9f` on `codex/epic-17-g04`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains an ancestor. S716 is the highest assigned slice; S717 is uniquely reserved.
- Canonical board revision 4195; EPIC-17 and G04-V03 remain In Progress. The two pre-existing untracked S700 diagnostic text files remain untouched.
- S716 added the UI and mock-driven result/error checks, but its packet does not show a real generated package being passed through the panel into the production auditor. S717 closes that specific evidence gap only.

## Objective

Use the real schema-v5 package writer, real returned-DXF auditor, and actual panel event flow in one focused test. Prove that an unchanged generated registered-size package produces a truthful pass summary and that a return missing its centimeter declaration produces an accessible fail-closed reason without counts. Exercise a tampered source package as a second negative case if this fits the same fixture cheaply.

## Acceptance and non-goals

- No production-code, threshold, profile, pattern, or output change; no receiver/app installation or receiver trial.
- The passing test must compare the live panel result to the report from the real auditor for the generated package.
- Negative results must show `role="alert"`, the exact auditor reason, and no partial counts.
- The success text is compared with the actual auditor report (whose mark-entity count is derived from serialized entities and may differ from the manifest's mark-record count).
- Focused test and changed-panel-code coverage remain 100% statement/branch/function/line; build and protected legacy identities are unchanged and need not be repeated because production source is untouched.
- Run `git diff --check`; update state and validated board only if this evidence closes as planned. Keep final full repository gates at the settled Epic/PR boundary.
- This confirms local UI/auditor wiring only. It cannot qualify a receiver or clear the measured CLO failures. All V03 gates remain unchanged.

## Ownership and effort

One test file only; Codex owns it. No safe independent delegation. Expected work: a bounded actual package/return fixture and durable closeout, with no CAD I/O outside the repository test process and no file upload.
