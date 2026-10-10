# EPIC-17 / G04 V03 — DGS Design-mode source-matched check — Slice 667 exit

## Result and disposition

Started 2026-10-10 09:37:05 UTC from clean S666 commit `f70d19921580eecd7d65e12f72ad067fdd7302c8`; refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. S667 is uniquely numbered. The pinned Polo M candidate was 155,176 bytes, SHA-256 `DFC15003F11AFEC33C4AADB3286D3354A808D834DCD1979B7CB2EE0BC94F07F2`.

In DGS V2024.1 / VID:20250610, one AutoCAD Design import changed only Pattern→Design. The nine outlines rendered without a warning dialog, but DGS showed 0/0 registered patterns. One observed-default Auto CAD export was therefore used diagnostically to resolve whether the Design canvas retained exchangeable identities and units. The output was 66,266 bytes, SHA-256 `56ECB99470306A606E4D7E886D5082869682A8D247F0EF28CD71EDC216BFA233`.

Independent parse proves this exact candidate **fails**. Input: `$INSUNITS=5` (cm), nine named INSERT pieces, 11 blocks, 65 block-owned entities, 18 CUT/SEW polylines; its XDATA says `idr-pattern-exchange/1`, despite the approved grainline additions (the file is not a valid v2 fixture). Output: `$INSUNITS=4` (mm), 46 top-level entities, zero INSERTs/blocks, every entity on layer `0`, no profile metadata. Closed polyline paths append a duplicate terminal vertex. Raw numeric values resemble the source, but physical scaling is wrong by 10×: front CUT 28.5×73.274 cm is declared as 28.5×73.274 mm; maximum physical deviation is 191.201177 cm versus the fixed 0.001 cm gate. Piece identity, semantic layers, profile and units all fail. No reimport was warranted. Retire this DGS AutoCAD Design/export candidate; this result does not establish a DGS-wide limitation or standards conformance.

## Evidence and gates

Actual settings, receiver render, export dialog and parse are in `C:\G04-CLO-DXF-Exchange\S667-dgs-design-mode-source-matched\`. The reproducible comparison is `inspect-dgs-design-export.mjs`; run it with Node to rewrite the C:-only JSON comparison. `node --check` passes. Recheck its hashes and the C:-only manifest when resuming.

- Design-mode import warning dialog: absent; full-size render shows nine outlines, but is not measurable pattern-object evidence.
- Identity/piece relation, profile metadata, units, layers/marks, and physical geometry: failed by actual parsed output.
- Grades, malformed-input rejection, repeated round trip, all-seven/options, rights/profile qualification and readable round-trip output: unproven.
- Legacy DXF writer, protected identities, acceptance thresholds and V02 status: unchanged.

No standards, physical-fit, factory-acceptance or production-readiness claim. CLO and DGS remain open. This was one serial GUI experiment; no disjoint safe coding/review task existed. Focused preflight, parser syntax, `git diff --check` and Control Center 42/42 are required at exit. Implementation time: ~0m (diagnostic only); GUI/evidence work: record from session log as 11m25s; external-agent waits and maintainer decisions: 0m.

## Next: S668 bounded decisive receiver route

Create a fresh source-derived fixture that changes only profile XDATA `/1`→`/2` on the approved grainline candidate; prove its nine source piece identities, all grainline lines, CUT containment, unit `$INSUNITS=5`, unchanged non-grainline entities and source geometry before use. Then perform one import through DGS's actual ASTM/AAMA apparel decoder, not AutoCAD Design. Record the observed import controls and warnings, independently compare all visible/registered pattern geometry and semantics at 0.001 cm, and stop immediately on a concrete miss. Only if that passes, one AAMA export/parse/reimport can test those distinct gates. The menu label alone is not an ASTM/AAMA conformance claim. No more AutoCAD mode or encoding permutations. This route tests a distinct decoder/profile candidate; it is not a standards assertion.

If the apparel decoder fails, retire DGS rather than testing its alternate modes. Evaluate the already authorized CLO AAMA path only against its actual source/receiver evidence and fixable shared causes; retain every failing hold. No candidate can be accepted by a plausible menu label. Re-estimate after S668 from measured gates; older 9–14 and 8–13 estimates are stale. Preserve all seven recipes, supported options and grades, 0.001 cm geometry, unit/identity/relations/marks, malformed-input rejection, repeatability, rendered output, rights/local handling, protected exports and final full gate, PR, safe merge, ancestry and deployment checks.

## Durable closeout at 2026-10-10 09:54:19 UTC

Validated Control Center replay advanced revision 3916→3922; the required legacy summary clauses were restored in validated edit commands 3922→3924. 
pm run control-center:test: 42/42 pass. git diff --check: pass. 
ode --check inspect-dgs-design-export.mjs: pass. The independent comparison was rerun and hashes refreshed; final C:-only manifest is C:\G04-CLO-DXF-Exchange\S667-dgs-design-mode-source-matched\Evidence\S667-final-manifest.json. Admission, state and context index now record S667 closed and the single S668 route. No production code changed, so changed-code coverage is not applicable. Implementation: 0m; focused verification/closeout: approximately 5m; external-agent waits: 0m; maintainer decision time: 0m. S667 board start/exit: 3911→3916→3924. S668 is the next unique slice.
