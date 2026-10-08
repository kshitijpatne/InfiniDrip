# EPIC-17 / G04 V03 — Richpeace rights and local-handling recheck — Slice 506 exit

## Decision result

**No candidate passes the V03 pre-fixture rights/local-handling gate on the
reviewed evidence.** Richpeace V8 Free English and V10 Demo Free remain
unselected. V03 stays In Progress with all acceptance criteria unchanged.

For both builds, current official Richpeace sources do not establish permission
for InfiniDrip's noncommercial product-development DXF evaluation or whether
ordinary CAD-file operations remain on-device. The V8 term “full function
evaluation copy ... welcomed to try on” is unscoped marketing text and is not a
use grant. The V10 demo page does not state evaluation terms. Absence of a
published restriction is not affirmative permission. No applicable publisher
license/evaluation agreement or desktop CAD data-handling statement was found
in the bounded official-source audit; this does not prove that no such document
exists.

V8 remains the stronger documentary import/export lead only because its
product entry links the V8 manual previously reviewed in S468, which describes
AAMA/ASTM import and ASTM export workflows. The S506 manual fetch exceeded the
reader's 5 MB limit, so this slice adds no manual evidence and makes no
conformance claim. The exact V8 product page lists Windows XP/7/8/10, not
Windows 11. V10 Demo Free's exact product page lists Windows XP/7/8/10 and
states import of DXF/AAMA/ASTM/AutoCAD; it does not document apparel-format
export. Its linked download portal is titled only “Richpeace Garment CAD V10.0”
and identifies an `Enterprise_V10` binary, while a separate portal item is
called “V10.0 (demo) Free”; exact binary/build identity is unresolved.

Richpeace America's privacy page governs that website and Sunstar USA Inc.; it
does not address desktop CAD file handling by Tianjin Richpeace software.
Cloud processing described for Super V8 and Cloud Super Nest belongs to those
separate products and is not attributed to V8 Free or V10 Demo. Windows 11
support is undocumented for both candidates, not proven incompatible.

## Independent review and Codex verification

The separate OpenCode contributor used
`opencode/muse-spark-1.3-contributor-free`, `xhigh`, normal mode, and returned
the required `WORK FINISHED` signal. Its only artifact was
`OPENCODE-FINDINGS.md`; the separate worktree showed only that untracked
S506 directory and no other changed file. Codex inspected the full findings,
verified the exact V10 Demo product page, V10 portal records, V8/V10 lists,
Richpeace America privacy scope, and the relevant distinction from separate
cloud products. The exact V10 Demo page states `System System：Windows
XP/7/8/10` and `Import other formats such as DXF, AAMA/ASTM/AUTOCAD`; the
exact product page does not state export. The linked V10 download portal's
title/binary differ from the demo-free product label, so no exact binary is
selected. Direct V8 product-page retrieval timed out in this check; its
listing, manual-link association, OS statement, and prior manual evidence are
retained from S468/S470/S481. The S506 V8 manual fetch itself exceeded the
5 MB reader limit.

## Gate and scope disposition

- **Rights/local handling:** not established for either candidate.
- **Host:** Windows 11 support is not documented; no compatibility workaround
  or install trial occurred.
- **Exchange:** V8's previously documented manual workflow and V10's
  product-page import wording are documentary leads only. No receiver build,
  industrial profile, export path for V10, or round trip was established.
- **Still required by V03:** rights/access, local processing, exact receiver
  build and industrial profile, representative source-to-receiver fixtures,
  geometry/marks/layers/units, size-grade semantics, negative controls,
  round-trip retention, and all-seven recipe evidence. CLO's measured S503/S505
  failures remain historical technical evidence and do not clear rights or
  select a profile.
- **Unchanged:** seven-recipe V02 acceptance, V02-before-V03 ordering,
  protected output byte identities, legacy DXF behavior, `0.001 cm` gate,
  grade and negative-control requirements, and physical/factory claim limits.
- **Operations:** no software was downloaded or installed; no account was
  created; no terms were accepted; no vendor was contacted; no fixture or
  product file was transferred or opened. User reported CLO running during this
  slice; Codex did not interact with or close it. All S506 repo evidence is
  documentation-only; no export, fixture, test, or baseline changed.

## Exact next gate

The only remaining candidate-specific practical lead is the S481 conditional
Richpeace V8 Free English Gate 0. Before beginning it, obtain explicit user
authorization for a normal official-installer attempt on the current Windows 11
host, with all downloads/install artifacts confined to a named folder on C:.
That bounded preflight would inspect the actual About/build/version, displayed
terms before acceptance, exact menus and any documented local-only behavior.
Do not accept terms or open any InfiniDrip fixture; stop on unsupported/unusual
OS prompts, unclear rights, account/license requirements, hosted processing,
or absent exchange modes. Even a successful Gate 0 would only decide whether a
rights and locality basis permits the next fixture trial; it would not pass
V03. An authorized user may instead provide written rights and local-handling
evidence for an exact receiver or supported receiver access. Do not contact the
vendor unless the maintainer explicitly revises the no-supplier-contact scope.

## Verification and slice boundary

- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remains
  an ancestor. S505 commit `54f2b15563e08d1c5df3643c8614a4f5fe2d41a5` is the
  starting commit; S506 is the next unique slice after S505.
- Start board revision `3135→3137`; the exit commands add `E-G04-S506-EXIT`
  and a G04-V03 status note without changing status or criteria. Actual
  validated replay advanced `3137→3138→3139`; V03 remains In Progress.
- OpenCode run used the exact required model/variant in normal mode and
  returned `WORK FINISHED`; Codex verified the artifact and source claims.
- After the actual board replay, `npm run control-center:test` passed 42/42.
  Exit preflight passed at revision
  3139 after correcting the helper to replay S506's start commands before its
  exit commands; its first run from committed S505 correctly exposed the
  missing setup replay (`3137` actual vs. `3135` incorrectly assumed). Syntax
  helper syntax checks and unstaged `git diff --check` passed. The separate
  contributor worktree contains only the assigned findings file.
  This documentation/research slice changes no production code; the full
  repository coverage/build/browser/output gate remains at the settled
  integrated Epic/PR candidate.
- Started `2026-10-08 16:20:32 UTC`; closed at approximately `2026-10-08
  16:32 UTC` (~12m total). Product implementation: `0m`; source research and
  Codex verification/synthesis: `~5m`; durable packet/state/admission and
  validated board closeout: `~4m`; focused Control Center/preflight/diff
  checks: `~3m`; OpenCode wall wait: `~3m` (overlapped source review); maintainer
  decision time: `0m`.

**Next action:** request the exact S481-approved Richpeace V8 Gate 0
installation authorization, without changing the V03 acceptance or reusing CLO
under unresolved rights.
