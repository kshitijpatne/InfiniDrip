# UIQ-06 — operational controls and critical-state readability

Status: admitted by the maintainer's 2026-10-12 instruction, “proceed with
next goal,” after UIQ-05 completed through Slice 743. This admits only a
presentation-quality wave over existing local functionality. The roadmap row
is broad; each surface below has an evidence gate so existing clear or
high-risk behavior is not redesigned merely to fill scope.

## Start, authority and ownership

- Start: 2026-10-12 01:39 UTC; durable goal `docs/planning/UIQ-06-GOAL.md`.
- Start ref: clean `origin/main` `7923a7f4323d713b069817adfd7626f19c7b48f5`.
- Worktree: `C:\Users\kshit\.codex\worktrees\uiq06-controls\designApp`,
  branch `codex/uiq06-admission`. The dirty shared `F:\designApp` checkout
  and all other worktrees are preserved.
- Canonical board began at revision 4404; validated edit, status and comment
  commands advanced it to revision 4408 at admission. UIQ-GATE was Done and
  UIQ-06 entered In Progress with its dependency satisfied. PR #31 merged and
  deployed; PR #32 merged at `34a2592a` and main workflow `38203805432` passed.
  S752/S753 update the canonical board to revision 4448 while keeping UIQ-06 Done.
  No other active current-main UIQ implementation owner was found. The old EPIC-17 worktree
  is historical; EPIC-17 is closed on main. The referenced
  `docs/coordination/TEAM-CONTEXT-REGISTRY.md` is absent from current main;
  ownership was checked from Git worktrees, refs, open PRs and the canonical
  board instead.
- Highest reachable numbered commit subject at admission was Slice 743. S744
  admits/baselines the package and S745 implements the Nesting readout. S746
  is a bounded documentation durability correction: force-track the ignored
  S745 exit report at its board-recorded URI, verify the exact SHA-256, and
  test that board evidence resolves to a tracked file. This corrects an
  accidental ignore rule without rewriting history or changing production.
  Remaining boundaries after S748: S749 project/history/recovery/import/export-scope
  messages (now complete); S750 settled review/full gates and PR; S751 PR checks,
  merge, deployment,
  live verification and board/context closeout. Recheck and reserve each
  number at the boundary. A justified no-change result is recorded with
  evidence rather than replaced by speculative UI work.
- Codex owns shared integration, feature flag, scope, tests, rendered evidence,
  corrections, final diff review, PR/merge, deployment and board closeout. No
  separate code task is safe before these shared presentation contracts are
  frozen; no CLI contributor is dispatched for S744/S745.
- Goal-start usage: ordinary usage allowed; primary 13% used, weekly 26% used,
  no reset credits. At S744 admission the primary window was 15% used; before
  S745 it was 16% used. Routine
  work remains in the default low-cost model where selection is available;
  check limits at each boundary and before the settled full gates.

## Evidence-led scope

UIQ-06's board contract is: “Presentation-only measurement/history, grade
exceptions, nesting/Check, project/recovery/import/export-scope readability.”
Current code already provides measurement provenance and field history,
approved grade plans and explicit per-size not-applicable reasons, nesting
and digital-check calculations, project revisions/recovery/import/export, and
frozen-output scope. This packet does not authorize new capability or changes
to those systems.

Slice 744's fresh Chromium baseline is under
`docs/research/uiq06/evidence/`. It found a demonstrated presentation defect
in the Nesting view: required length, planned length, waste, fabric-on-hand,
fit verdict, and directional-print warning are concatenated into one 12px
text run. The verdict and directional notice run together, making the key
estimate and its caveat hard to scan. This is a worthwhile redesign candidate.
The Check view already states “Digital checks pass — physical validation
pending” and enumerates each check; do not change its verdict or appearance
unless later pressure evidence demonstrates a specific defect. The
measurement and Project Manager screens expose the expected features and
state. The measurement surface was audited and received the bounded S747
history-time display correction; project/recovery remains audit-gated for
S749. Keep those surfaces unchanged if narrow,
keyboard, long-message, conflict, recovery, and stale-state pressure checks
show no material readability failure.

## Bounded presentation contract

- S745 may restructure only the existing Nesting estimate presentation into
  labelled, independently scannable values and a distinct estimate/verdict/
  direction-notice hierarchy. It may reuse only values already computed by
  `nestIntelReadout`; it must not recalculate or reinterpret length, waste,
  utilization, scope, fabric fit, buffer, or nap.
- Keep all existing controls and IDs, focus behavior, buffer/on-hand
  validation, single-size/graded-marker scope, and direction setting. Empty,
  invalid, unavailable, short, fit, non-finite and unavailable-waste states
  must remain explicit and must never be silently clamped or turned into a
  positive verdict. Distinguish an estimate from physical fabric validation.
- S747 audits measurement value source/history and capture messages. Only
  presentation/copy/spacing changes may be admitted if rendered evidence shows
  an actual ambiguity; preserve raw input, source/confidence, correction,
  history persistence, and measurement math.
- S748 audits grade-plan exception entry and Check/output rows. Any change is
  presentation-only and must preserve the authored exception reason, exact
  POM values, stale-plan and readiness gates, and every export rule. No
  grading math or approval semantics.
- S749 started 2026-10-12 02:33:42 UTC at board revision 4421 after commit
  `24c6bcb2` and a fresh fetch confirmed `origin/main` remains an ancestor.
  S749 audits project switching, unsaved/stale/conflict states, recovery,
  revision history, package import/export, and frozen-output scope. Any change
  is presentation-only; preserve explicit confirmations, cancellation,
  atomicity, privacy/local-only behavior, object identities, and outputs. Do
  not add database/cloud/login, history data, automation, or new operations.
- Embedded flag: `uiq_operational_clarity`, public preview audience,
  default-on only when this wave is release-ready, local test override,
  expiry 2027-01-12, removal at UIQ-06 cleanup no later than expiry. OFF,
  unknown, or stale must reproduce the exact current UI and behavior. It is
  not remotely switchable; production rollback requires a reviewed code
  default and deployment.

## Non-goals and protected surfaces

No measurement, garment, grade, POM, fabric, marker, waste, fit, validity,
readiness, nesting, persistence, recovery, project, import/export, or artifact
logic changes. No new workflow step or feature, no newly claimed fit or
physical-fabric accuracy, no cloud/account/database/provider, no network
request, no dependency/lockfile/release-workflow change, no global redesign,
and no export-baseline change. Preserve all existing behavior, accessibility,
untrusted-text escaping, local data, shared app shell, and every UIQ outside
UIQ-06. Do not touch project files from the old shared checkout or any active
non-UIQ worktree.

## Files and verification gates

Possible, exact changes are limited to the existing feature-flag catalog and
tests; the existing Nesting/readout view and tests; and, only when an audit
proves a needed targeted change, the corresponding measurement-capture,
grade-plan, Project Manager component and tests. `src/ui/app.ts` and its tests
may wire the flag/fallback only. `src/ui/studio.css`, view styles and browser
evidence may change only for scoped presentation. Update the Control Center
board regression test, this packet/goal/replay, `CONTEXT-INDEX.md`,
`PROJECT-STATE.md`, `ARCHITECTURE.md`, and `UI-ENHANCEMENT-SEQUENCE.md` where
they describe the admitted work. The canonical board is mutated only through
the validated Control Center command layer.

Acceptance:

1. Every one of the four roadmap surface groups has a recorded keep/change
   decision and evidence; no surface is silently skipped or redesigned without
   a demonstrated benefit.
2. `uiq_operational_clarity` metadata/default/override/stale/unknown and exact
   off-path behavior are tested. All dynamic strings are safely escaped.
3. The Nesting states listed above are asserted against the unchanged
   estimator; per-size and graded-marker output values match the existing
   calculations. Check remains truthful about digital-only validation.
4. Every changed production line reaches 100% statement, branch, function and
   line coverage; one settled PR-candidate run achieves the same global 100%
   bar. Focused tests, typecheck/build, Control Center/web/readiness checks,
   protected export-byte-identity tests, and packaged Electron verification
   pass. No baseline moves.
5. Production-built browser review compares before/after at 1280/640/320 CSS
   px, keyboard/focus, zoom, forced colors, reduced motion, long and hostile
   text, all estimate boundary states, no page errors and zero off-origin
   requests. The old UI is verified with flag off/unknown/stale. Actual output,
   not tests alone, decides acceptance.
6. Codex reviews the actual full diff and evidence before merge. S750 owns the
   settled local gate and PR. S751 required main ancestry, automatic deployment,
   stable URL health, live rendered smoke, validated board closure and durable
   context; product acceptance is complete. PR #32 and its full main workflow
   are complete; S752/S753 add the verified post-merge deployment records.

## S744–S745 results and current correction

Slice 744 admitted UIQ-06 and its exact evidence-gated contract. Canonical
board revision 4408 records UIQ-06 In Progress and links the admission, goal,
and baseline records. Fresh 1280px Chromium screenshots are captured under
`docs/research/uiq06/evidence/`; their SHA-256 manifest is in
`docs/research/uiq06/S744-ADMISSION-BASELINE.md`. Focused baseline view tests
passed 92/92. Slice 745 added the embedded clarity flag and structured
Nesting presentation; focused tests and rendered states are in
`docs/release/UIQ-06-S745-EXIT.md` and
`docs/research/uiq06/evidence/S745-rendered-pressure.json`. The report was
initially omitted from commit `b948c942` because `.gitignore` excludes
`docs/release/`; S746 force-tracked the exact report and the board regression
suite confirms its recorded SHA-256 without rewriting history. S747 audited
measurement provenance/history and corrected only the visible history-time
separator/label; evidence is in
`docs/research/uiq06/S747-MEASUREMENT-HISTORY-EXIT.md`. S748 audited the
grade-plan exception matrix and Check POM output: narrow tables now disclose
horizontal scroll and support keyboard scrolling, reasons are labeled per
size, and numeric POM columns remain legible beside long exceptions. All grade
values, reasons, approval/readiness gates and exports are unchanged; evidence
is in `docs/research/uiq06/S748-GRADE-EXCEPTION-READABILITY-EXIT.md`. S749
clarified local storage and explicit recovery/save messaging without changing
persistence or file behavior; evidence is in
`docs/research/uiq06/S749-PROJECT-RECOVERY-READABILITY-EXIT.md` and its
machine pressure report. Canonical board revision 4434 retains the parent
In Progress and links `E-UIQ06-S749-FINAL-COVERAGE` as the digest-bound final
report. S750 local settled gates and Codex diff review passed from commit
`493c02a7`; exact evidence is in
`docs/research/uiq06/S750-SETTLED-RELEASE-EXIT.md`. The packaged Windows
verification used the installed Electron 44.1.0 distribution after the
default archive extraction rename hit a host-specific `EPERM`; the packaged
verifier itself passed. Canonical board revision 4436 remains In Progress.
S750 opened Codex-owned PR #31, which was mergeable and had no configured PR
checks; the local gates are recorded in its evidence. S751 merged it to main at
`caa1c751`, verified successful Pages deployment run `38201698605`, and passed
stable/immutable live browser acceptance. The report is digest-bound as
`E-UIQ06-S751-LIVE-EXIT`; board revision 4439 records Done and revision 4440
contains the final closeout comment. PR #32 merged at `34a2592a`; main run
`38203805432` passed tests/build/artifact/deployment and post-deploy stable and
immutable checks. S752's report and evidence are
`docs/research/uiq06/S752-FINAL-DEPLOYMENT-EXIT.md` and
`docs/research/uiq06/evidence/S752-postdeploy/`. Its 320px check registered
BUG-UI-048 as an unrelated Backlog issue (7.65625px mobile view-control
overlap); no fix is admitted by this packet. The canonical board is revision
4448 and the focused Control Center suite passed 42/42 with S752 and S753 digest
checks. PR #33 main run `38205969649` passed full gates and stable/new immutable
URLs returned HTTP 200; see `docs/research/uiq06/S753-FINAL-CLOSEOUT.md`.
UIQ-07 remains Backlog and unadmitted; no later work is admitted.
