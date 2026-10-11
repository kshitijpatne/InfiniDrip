# EPIC-17 / G04 V03 — internal-line grading selection research — Slice 604 start

## Verified start

- Started 2026-10-09 10:20 UTC from S603 commit
  `b711f3c29dbba0700504f37bda956d13310bb57b` on `codex/epic-17-g04`.
  Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S603 is the highest assigned slice; S604 is unique. Board start
  revision is 3546; EPIC-17/G04-V03 are In Progress and G04-V02 is Done.
- S603 preserved CLO 2026.1.310 in the existing session and found no trustworthy
  UI cue distinguishing the apparent sewn path point from a CUT grading point.
  Its fail-closed packet and actual capture are recorded at S603.
- Product-development evaluation and local-only exchange handling are
  confirmed. S604 performs no CLO file operation or UI input. All prior C-drive
  exchange artifacts and all acceptance gates remain unchanged.

## Objective

Research only whether CLO has a primary, version-relevant instruction or
interface indicator that reliably identifies and selects internal-line
segment points for Edit Grading, distinguishable from CUT outline points.
Reconcile the instructions with S567's existing CLO staff guidance and S603's
observed property values. Record what the source proves, what it does not
prove, and whether it provides a safe, falsifiable next action.

## Scope and stop rules

- Check only the specific potentially relevant CLO documentation and official
  help sources for internal-line selection/grading and any related object or
  selection identity indicator.
- Do not repeat a UI trial, enter grading values, save a project, or import or
  export DXF during S604. Do not search unrelated construction topics.
- Do not substitute another Claude model if the specifically requested Opus
  5.5 CLI target is unavailable. Codex may still independently verify public
  primary documentation and record the model availability limitation.
- Keep S567's source coordinates, the 0.001 cm gate, V02-before-V03 order,
  all-seven-recipe scope, legacy DXF behavior, protected export byte
  identities, and every V03 gate unchanged.

## Acceptance and closeout

- Cite each checked primary source with title, URL, date/version when visible,
  exact relevant instruction, and its limits.
- Classify each conclusion as directly documented, observed in S603, or
  unresolved inference. A general instruction to click a point does not prove
  that CLO selected a sewn-line point in this project.
- Decide whether a trustworthy selection cue was found. If not, retain the
  grading hold and make the next V03 action an independent, evidence-capable
  gate; do not repeat S603's interaction.
- Link an exit packet through the validated board command layer, update
  `PROJECT-STATE.md`, run focused Control Center tests and `git diff --check`.
  No production source code is in scope; the full repository gate remains for
  the settled integrated Epic candidate.

## Delegation and timing

- A bounded read-only official-source check is independent from CLO UI state.
  The requested Claude Opus 5.5 CLI target must be verified before use; do not
  silently select a substitute. Codex owns primary-source validation and the
  final packet. No UI/app task is delegated.
- Record documentation review, any external-agent time, verification/closeout,
  and maintainer-decision time separately at exit.
