# EPIC-17 / G04 V03 — GetonAgain DXF contract preflight — Slice 653 start

## Objective and bounds

Record what the official GetonAgain Garment CAD V2024.1 manual establishes
about DXF import/export before opening any pattern in the receiver. Identify
which preflight facts can only be checked in the installed application. This
is evidence-only: no app/security-UI interaction, installation, login, fixture
import/export, product code, or acceptance change.

## Starting state

- Started 2026-10-10 from clean `codex/epic-17-g04` HEAD
  `d9e79066c414d7c9a2e78b0ddc4aee5a6a31aa23` (Slice 652).
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`
  and remains an ancestor of HEAD.
- Board revision 3755; EPIC-17 In Progress, V01/V02 Done, V03 Blocked.
- Slice 652's process inspection confirmed two live Windows consent dialogs
  with the exact GetonAgain CAD title; no installation is verified. Codex
  cannot operate Windows security UI.
- User has confirmed product-development evaluation and local DXF processing
  in writing and authorized the official free setup. Manual approval of the
  visible Windows consent prompt is still pending.

## Task and acceptance

Use only the already downloaded first-party V2024.1 manual and its extracted
text/rendered pages to establish documented import/export modes, file-level
options, and grading limitations. Separate documented facts from unknown
entity/layer semantics. State the exact smallest next checks after installation
and preserve the stop-before-pattern-import rule until the installed receiver's
input contract and local direct-DXF path are verified.

Acceptance: concise source-linked findings; explicit unknowns; no claim of
ANSI/AAMA or ASTM conformance; no V03 gate marked passed; all seven recipes,
supported options/grades, geometry/mark thresholds, malformed-input,
repeatability, rendered-output, legacy-DXF, and protected-identity gates
unchanged.

## Non-goals and dependencies

- Do not manipulate the pending UAC prompt, create or use an account, or
  import pattern data.
- Do not run a format/mode/entity variation or change a fixture.
- Do not claim physical fit, factory acceptance, or production readiness.
- The next receiver operation depends on the user manually approving the
  matching Windows consent prompt and subsequent verification of the installed
  build and local input route.

## Verification and time accounting

Start time: 2026-10-10 01:08 UTC (approximate; tool clock at reservation was
01:08:32 UTC). Focused verification will be limited to source/hash/reference
checks and the validated Control Center command/test used for durable board
closeout. No production code changes, so changed-code coverage is not
applicable. One bounded independent V03-plan review is already complete in
S649; no further delegation is useful for this manual extraction.
