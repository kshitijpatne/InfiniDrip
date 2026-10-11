# EPIC-17 / G04 — S723 start: LibreCAD seven-recipe empirical profile

- Start: 2026-10-11 04:58:08 UTC.
- Goal: test the existing LibreCAD 2.2.1.5 / DXF 2000 route against one source-bound representative from each supported recipe, using the same measured profile rather than new software or format permutations.
- Branch: `codex/epic-17-g04`; starting HEAD `eb40e204dba555516029fe00d80515152c80a50a` (`Slice 722`).
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; ancestor of HEAD.
- Board revision 4222; EPIC-17/G04-V03 In Progress; V01/V02 Done; goal active. Highest slice 722, so S723 is unique.
- Working tree after S722: clean except the two pre-existing S700 coverage diagnostics; leave them untouched.
- Current UI evidence: exact LibreCAD window selected by its S708 returned drawing's accessibility document path, foregrounded, then visually confirmed; full nine-piece drawing and source `CUT`/`SEW`/`MARK_*` layer tree visible. Existing app session remains open.

## Scope and decisive checks

For each of Tee, Fitted, Polo, Trouser, Tank, Woven shirt and Skirt,
produce one existing registered-size source package and manifest in
`C:\G04-CAD-Interchange\S723-librecad-seven-recipe-roundtrip\`. Import each
through the exact already measured LibreCAD route, save/reopen locally, and
run the existing package-bound return audit. Compare geometry (0.001 cm),
units, names/identity, CUT/SEW layers, marks/grainlines, and visible readability.
The source pattern and legacy export remain unchanged.

Stop after the seven representative rows. Any actual failing row is retained
and diagnosed from its exact source/return; no unrelated app/setting variation
and no claims beyond the tested rows. If all seven pass, S724 reuses the
existing 73-option/grade matrix to broaden this same route and proves a
semantic repeat. Overall V03 gates and release criteria from S722 remain.

## Non-goals / verification

No new software, purchase, supplier contact, source geometry compensation,
legacy DXF change, threshold relaxation, app conformance claim, or final V03
release claim. Any production-code change requires focused coverage at 100%
statements/branches/functions/lines. Actual reopened receiver output is
required alongside machine comparison. Full global coverage/build/browser/
Electron/output review remains for the settled Epic candidate.
