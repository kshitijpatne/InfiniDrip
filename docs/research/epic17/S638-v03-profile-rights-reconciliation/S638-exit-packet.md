# EPIC-17 / G04 V03 — Profile, rights, and gate reconciliation — Slice 638 exit

## Outcome

S638 consolidated the V03 gates through S637 and verified the current official
source status for the two legacy apparel DXF standards named in the CLO
receiver menus. The empirical gates remain **open**; no accepted V03 gate is
cleared and no status or hold changes.

The ANSI Standards Action for 2002-11-22 both lists ANSI/(AAMA) 292-1993 for
withdrawal and records administrative withdrawal of ANSI/AAMA 292-1993 and
its TR292 implementation guideline effective 2002-11-13. ASTM's current
Sewn Product Automation catalog lists ASTM D6673-10 as withdrawn in 2019. The
official CLO help page was updated 2026-09-28 and still documents import and
export selections for DXF-AAMA, DXF-ASTM and Standard DXF, including one-size-
group-per-file export and graded information in the DXF or a separate Rule
File. CLO's published user guide does not identify a normative edition or
claim conformance to ANSI/AAMA 292 or any ASTM D6673 edition.

These findings distinguish a currently offered CLO *vendor feature* from an
active standard and a tested receiver capability. They do not give a legal
conclusion about using a format label, and they do not create a right to
reproduce paid standard text. The user's written approval already authorizes
CLO product-development use and local files; S638 did not purchase or copy a
standard.

The recommended candidate for maintainer confirmation is a version-pinned,
vendor-specific `CLO 2026.1.310 DXF-AAMA` empirical target, with **no** claim
of ANSI/AAMA or ASTM conformance. This preserves the existing all-seven and
other V03 gates. It is not qualified: S636's Polo pre-export CUT test and
S637's Woven pre-export button-mark test both failed, and no DXF was exported
in either trial. If the maintainer requires an active normative standard,
current public evidence does not identify a ready zero-cost standard profile
for the authorized CLO trial. This is a bounded research result, not proof
that no other profile exists.

## External research and independent review

- Claude Code CLI 2.1.283 was invoked as `claude-opus-5-5` in a separate
  read-only worktree at S637. It returned the exact `WORK FINISHED` signal.
  Its review corroborated the ASTM catalog status and current CLO menu/export
  descriptions; it also cautioned that menu labels are not standards
  conformance and that availability does not grant reproduction rights.
- Claude's network path reported HTTP 403 for the ANSI PDF and consequently
  treated the 2002 withdrawal date as unverified. Codex's web retrieval opened
  that official primary PDF and verified both the notice and effective date
  directly. The matrix cites that primary source and does not rely on the
  researcher's search snippet.
- The ASTM current catalog, not the historical D6673-04 product page, is used
  for the status of D6673-10. The -04 page is cited only for its explicitly
  historical/public scope summary. S638 did not infer the exact -10 clauses,
  a successor's nonexistence, or any legal rights from these pages.
- The external worktree and branch were clean and removed after the finished
  signal; its plan-mode scratch note was outside the repository and was left
  untouched.

## Current evidence

The gate-by-gate record is
`V03-CURRENT-GATE-MATRIX-S638.md`. It updates S634 with S635–S637 and official
profile evidence. The principal measured current blocker is the S637 rendered
button-mark failure; the five Polo CUT omissions and every other V03
acceptance gate remain open. No export/round-trip result exists for S637.

## Verification and slice boundary

- Start: `2026-10-09 20:56:30 UTC`, after S637 commit
  `f4097e2a5bdedf6df1d7589dff83e753097b4a1f`; refreshed
  `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an
  ancestor. S637 was the highest assigned slice; S638 was unique.
- Board start/exit replay: `3692→3694→3696`; add-evidence and add-comment
  only. G04-V01/V02 remain Done; G04-V03/EPIC-17 remain In Progress.
- Direct primary-source review verified the official ANSI notice, current
  ASTM textile catalog, current CLO DXF import/export help, and CLO format
  list. The independent model report was checked against those same sources,
  including correction of its ANSI access limitation.
- Focused checks: current gate-matrix consistency against S634–S637 packets;
  official-source link/status review; validated Control Center tests (42/42);
  validated board replay and exit preflight; `git diff --check`. No production
  code changed; changed-code coverage does not apply. Full repository tests
  and 100% coverage, build/browser/output gate remain for the settled Epic/PR.
- Time through closeout: approximately 8m (`20:56–21:04 UTC`): official
  research and matrix synthesis 3m; independent agent wait/review 1m; focused
  verification 2m; durable record/board closeout 2m; maintainer-decision time
  0m.

## Next action and decision boundary

Ask the maintainer to confirm whether the next experiment may use the named
vendor-specific `CLO 2026.1.310 DXF-AAMA` path as a *candidate profile only*,
with no ANSI/AAMA or ASTM conformance claim. Recommendation: approve that
narrow candidate label so source-bound empirical debugging can continue under
the unchanged all-seven V03 gates. This does not approve any release claim,
clear either measured failure, buy standards, or relax acceptance. If the
maintainer requires an active normative profile instead, retain all holds and
select a separately rights-reviewed current receiver/profile before another
exchange trial. CLO stays open in its existing session.
