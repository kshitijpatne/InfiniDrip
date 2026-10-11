# EPIC-17 / G04 V03 — CLO current profile capability cross-check — Slice 570 exit

## Result

S570 checked the official CLO Help Center DXF Import/Export article, updated
September 28, 2026, against the installed CLO 2026.1.310 and the existing
hash-pinned V03 evidence.

The article documents these capabilities: import selection for Standard DXF,
AAMA, or ASTM; DXF-AAMA/DXF-ASTM export; one selected size group per export;
grading either included in DXF or emitted separately as a Rule File; and unit,
rotation, notch, and CUT/SEW swap controls. Starting in CLO 2026.1, it says DXF
seam allowance is converted automatically to locked Custom Seam Allowance.
These are first-party statements about CLO's menu capabilities. The article
does not name an AAMA/ASTM edition, state a layer-number mapping for CUT/SEW or
other marks, define grade-point semantics, or document an acceptance profile
against a named receiver. It does not establish the fidelity of an actual
round trip.

The article's broad compatibility statement therefore does not clear the
admitted profile gate. It confirms that a graded DXF or Rule File is an
intended CLO export mode, but the retained S559/S562/S565 evidence already
shows that a source-linked per-size DXF lacks one integrated grade relation,
and the tested native CLO grade route did not preserve the source sew paths
for larger sizes. The same evidence remains decisive; no graded exchange was
repeated.

## Fresh CLO observation

CLO remained open. The current screenshot shows the workspace and a selected
waistband on the 2D canvas, without an Export DXF dialog. The separately
captured accessibility tree reports an Export DXF child dialog, with DXF-AAMA,
Graded Nest, centimeter, 100%, and Do Not Rotate values and a focused 100%
spinner. The two observations conflict. An activation attempt returned
`user input was detected in this window; call get_window_state before
continuing`; after re-observation, no further UI input was sent. The dialog is
not separately exposed by `list_windows`. The visual screenshot and raw
accessibility JSON are stored only under
`C:\\G04-CLO-DXF-Exchange\\S570-clo-current-profile-capability-crosscheck\\Evidence`.
This is an automation-targeting issue, not a CLO-reported import/export error
or evidence of format incompatibility. No import/export file or CLO project
was changed.

Evidence hashes:

- `clo-visible-workspace-current.jpg`: SHA-256
  `213c0be8f6a436ba3e2c69797143c5dc3bcc152b2c9fd795f254276942569390`.
- `clo-accessibility-current.json`: SHA-256
  `1e4e6188f79a6a15cd54c3fcae7702f1aa1558dc5b9c82bff99f5b8609951f1d`.

## V03 gate disposition

| Gate | S570 disposition |
|---|---|
| Rights/local processing | **Settled by maintainer confirmation** for local product-development evaluation; no re-check requested. |
| Receiver/profile exact edition and semantics | **Held.** Current official article names menu modes and broad compatibility only; it supplies no edition or CUT/SEW/mark mapping. |
| Geometry and piece identity | **Held.** Existing seven-recipe evidence includes five Polo CUT contours above the unchanged 0.001 cm limit; other measured contours and identity results remain bounded to tested fixtures. |
| CUT/SEW and marks | **Held.** S539 found no stable tested CUT/SEW discriminator on layer 8; S557's 78 non-direct mark matches do not prove loss. |
| Supported options and grading | **Held.** Current help documents the capability; S559/S562/S565 show no successful source-linked, grade-bearing all-seven round trip. |
| Negative-input behavior | **Failed for tested case.** S531's malformed file was silently accepted while an inset SEW contour disappeared. |
| Representative all-seven round trip | **Incomplete/held.** Existing M/default runs are partial; no new exchange occurred. |
| UI control | **Unreliable now.** Screenshot and accessibility disagree; no operation was safe. This is not a format failure. |

No gate is newly cleared. Acceptance, profile names, thresholds, all-seven
scope, generic DXF behavior, protected export identities, and compatibility
claim boundaries are unchanged. No physical fit, factory acceptance, or
production-readiness claim is made.

## Verification, board, and timing

- Start: 2026-10-09 03:40:10 UTC, clean S569 `c6dda6fc19dbe9abca75f9d26382dd55dde38da4`; closeout: 03:41:56 UTC.
- Refreshed `origin/main` `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor.
- S570 is unique after highest prior S569. Board start/exit replay is recorded below; G04-V03 remains In Progress.
- Validated board command preflight/replay passed at revisions 3393→3395→3397. `npm run control-center:test` passed 42/42 and `git diff --check` passed after the exit replay. No production source or test changes; no full repository gate is due.
- Elapsed 03:40:10–03:41:56 UTC (1m46s): official-help cross-check ~15s; live capture and C:-only evidence save ~20s; packet/board/focused verification and integrity review ~71s; implementation 0m; external-agent waits 0m; maintainer-decision time 0m.

Official source: CLO Help Center, [2D Pattern (DXF) Import/Export](https://support.clo3d.com/hc/en-us/articles/115000493067-2D-Pattern-DXF-Import-Export), updated September 28, 2026. Relevant statements appear at lines 42–45, 55–69, and 78–89.

## Next action

Do not repeat general profile searches, known exchanges, or UI clicks against
the contradictory surface. Continue with a distinct offline V03 item that can
determine from retained source and receiver data whether a narrowly scoped,
additive profile/export design can address the measured geometry, semantics,
and grade failures without changing the legacy DXF stream or its protected
identities. Preserve every V03 gate; use CLO again only after the app surface
can be targeted and verified consistently.
