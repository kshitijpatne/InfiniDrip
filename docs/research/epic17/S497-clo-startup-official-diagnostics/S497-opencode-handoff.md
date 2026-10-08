# S497 OpenCode handoff — official CLO startup guidance

## Slice and objective

S497 / EPIC-17 G04 V03. Independently cross-check whether official CLO support
documentation provides a verified, applicable fix for the reproduced CLO
2026.1.310 startup stall recorded in
`docs/research/epic17/S495-clo-layer-semantics-audit/S495-exit-packet.md` and
`docs/research/epic17/S496-clo-startup-diagnostics/S496-exit-packet.md`.

## Why delegation is safe

This is a read-only official-source research task. It has no app, account,
permission, product, fixture, or acceptance side effect. Its output is
independent of Codex's local Windows ACL inspection and can be reviewed against
primary sources.

## Chosen contributor and model

OpenCode, because its exact configured `opencode/muse-spark-1.3-contributor-free`
model is available and approved by `docs/OPENCODE-WORKFLOW.md`. Use `xhigh` in
normal mode only. Do not use fast mode or substitute another provider/model.

## Repository state and required reading

Base commit: `6914335d17046d15caef968e2cf7189be90192ac` (S496, G04 branch).
Read `AGENTS.md`, `CONTEXT-INDEX.md`, `PROJECT-STATE.md`,
`docs/PROJECT-DECISIONS.md`, `docs/OPENCODE-WORKFLOW.md`, this S497 start
packet, S495 exit, S496 exit, and S493 V03 matrix.

## File ownership

May create exactly one uncommitted file in the contributor worktree:
`docs/research/epic17/S497-clo-startup-official-diagnostics/S497-opencode-findings.md`.

Must not modify any other file, run or control CLO, inspect private machine
files, change settings, contact CLO, create an account, upload/download user
data, test an installer, edit CAD fixtures, alter V03 gates, or change
`PROJECT-STATE.md`, `CONTEXT-INDEX.md`, or board data.

## Existing observed facts

- CLO version: `2026.1.310`.
- S495: startup stayed at “Creating Scene and Library”; Windows reported its
  process not responding.
- S496: second authenticated launch advanced to “Loading CLO”, then Windows
  reported PID 64976 `Responding: False`; no matching Application error/crash
  event, crash dump, or explicit vendor error message was found.
- Local auth logs reported `LOGIN_SUCCESS`; the startup asset cache wrote 66
  files. The app displayed an integrated Intel graphics/DX11 performance
  warning. App was closed; no pattern workspace or fresh exchange was reached.
- Official sources to inspect (and cite directly):
  1. https://support.clo3d.com/hc/en-us/articles/17074279996697-Disk-access-rights-required-when-CLO-is-running
  2. https://support.clo3d.com/hc/en-us/articles/360001315067-I-m-using-Intel-HD-Graphic-530-or-630-and-CLO-crashes-immediately-upon-launching
  3. https://support.clo3d.com/hc/en-us/articles/23390057463577-How-to-Speed-Up-CLO
  You may follow official internal links only when necessary and remain on
  CLO's official support domain.

## Acceptance criteria

For each source, record the article title, update date, exact relevant guidance,
and whether it actually matches this machine's observed symptom. Distinguish
confirmed fact, plausible hypothesis, and unknown. State whether any documented
recovery is safe and non-invasive or requires an owner-authorized setting or
permission change. Do not overgeneralize Intel HD 530/630 instructions to an
unspecified Intel GPU. Do not recommend uninstalling antivirus/firewall,
changing network controls, changing filesystem ACLs, reinstalling, or elevating
privileges as if already approved. No fix may be called verified without a
practical successful relaunch.

## Non-goals and verification

No CAD, format, pattern, product, rights, or legal opinion. Do not repeat generic
DXF research or claim that the app is unsuitable/incompatible. No tests,
coverage, build, or rendered output applies; list them as not run. Cite exact
official URLs and leave uncertainty explicit. Codex will inspect the file and
verify every citation/claim before integration.

## Exact task prompt

Read the required repository context and S495/S496/S493 evidence listed above.
Using only the listed official CLO support sources and necessary official CLO
support cross-links, independently answer: Does any documented fix actually
match the recorded startup state (authentication succeeds, initialization
hangs at scene/library/loading before the workspace, process becomes
nonresponsive, Intel graphics/DX11 notice, no event-log error)? What does each
source establish, and what does it not establish? Identify the minimum
additional machine/app evidence needed before any recommended setting/ACL
change. Do not touch the app, settings, user files, or project files. Write
only `S497-opencode-findings.md` in this worktree. Return an explicit `WORK
FINISHED` signal only when done and include the required JSON summary.

## Required JSON return format

```json
{
  "status": "complete|blocked|needs_follow_up",
  "summary": "...",
  "branch": "...",
  "changed_files": [],
  "tests_run": [],
  "coverage": "not applicable",
  "build_and_typecheck": "not applicable",
  "rendered_or_export_evidence": [],
  "known_limitations": [],
  "follow_up_needed": []
}
```
