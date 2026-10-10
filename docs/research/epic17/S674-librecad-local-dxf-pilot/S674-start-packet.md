# EPIC-17 / G04 V03 — LibreCAD local DXF pilot — Slice 674

## Verified start

- Start: 2026-10-10 11:36:37 UTC, branch `codex/epic-17-g04`, from S673
  commit `3412c1574561744dbfed8e5a43f8bbe6fe172367`.
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an
  ancestor. S673 is the highest slice; 674 is unique. Worktree was clean;
  canonical board revision 3996; G04-V03 remains In Progress.
- Goal remains active with the full Epic-through-merge objective. `/2`
  grainline and all other maintainer decisions are settled.

## Candidate and rights

LibreCAD 2.2.1.5 is a new, narrowly screened candidate, not a selected or
qualified apparel profile. Its first-party project describes it as free,
open-source 2D CAD for Windows under GPLv2 and publishes the Windows installer
from the official GitHub release. This is a generic technical CAD receiver;
no apparel-specific support or standards conformance is inferred. It has no
paid license, account, or hosted-file route in this test. Sources:
`https://librecad.org/`, `https://github.com/LibreCAD/LibreCAD/releases/tag/v2.2.1.5`.

## Supplemental check: registered GetonAgain GMS

On 2026-10-10, the manually registered GetonAgain GMS V2024.1 opened to its
main `Ready` workspace. Its File → Open picker is `Marker File (*.mkr)`. The
separate Pattern File picker exposes only `*.DGS;*.FGS;*.PTN;*.PDS;*.PDF;*.PTN`;
it does not expose DXF input. No DXF fixture was opened or exchanged. GMS is
therefore not an eligible V03 DXF receiver, despite successful registration.
This is a direct UI observation, not a general product capability claim.

The LibreCAD installer download was verified against the official WinGet
manifest hash, but installation did not complete: Windows displayed an
elevation request, and no LibreCAD process, install entry, or application
files were present afterward. No DXF exchange attempt has run yet. All V03
gates and acceptance remain unchanged. Continue with the already selected
LibreCAD 2.2.1.5 pilot only after the Windows elevation prompt is approved;
then run the exact single Open → Save As DXF → clean re-open sequence below.
The official WinGet manifest has no applicable user-scope installer, so a
per-user WinGet route is not available for this pinned build. No alternate
installer or profile was tried.

The first-party GitHub release asset list has a Windows `win64-msvc.exe`
installer but no Windows portable archive. The other packaged assets target
Linux or macOS. Source: the v2.2.1.5 release page and its official release
assets API (`https://github.com/LibreCAD/LibreCAD/releases/tag/v2.2.1.5`,
`https://api.github.com/repos/LibreCAD/LibreCAD/releases/tags/v2.2.1.5`).
There is no verified no-elevation distribution for this candidate.

## Single representative scope

Install the official Windows build if needed, using a named S674 application
folder under `C:\G04-LibreCAD-Exchange\S674-librecad-r12-profile\`. Keep all
DXF imports/exports, captures, parses and rendered evidence inside that same
C:-only folder. Use exactly the hash-pinned S671 Polo M derivative
`C:\G04-CLO-DXF-Exchange\S671-polo-cut-source-path-density\Input\polo-standard-m-cm-units-header-exact-path-density.dxf`
(SHA-256 `487FAD7533BDA83306D3F4FA2DFEF523E469E62F3D808EFF0A9C98A7E38B77F8`).
Do one native Open, Save As DXF, then one clean-project re-open of that saved
DXF. Freeze and record all visible unit/export options; never scale or repair.

## Source-based pre-install screen (2026-10-10)

Before considering installation, the exact hash-pinned fixture was inventoried
read-only. It is AC1015 (`$ACADVER=AC1015`) with `$INSUNITS=5`; its entity
inventory is 18 `POLYLINE` headers / 1,386 `VERTEX` records, 14 `LINE`, 21
`POINT`, and 3 `CIRCLE`, on `CUT`, `SEW`, `MARK_BUTTON`, `MARK_BUTTONHOLE`,
`MARK_CUTLINE`, `MARK_FOLDLINE`, `MARK_PLACEMENTLINE`, and
`MARK_PLACEMENTPOINT`. It contains zero `INSERT` and zero APPID/XDATA (group
1001) records, so this fixture itself cannot demonstrate piece identity; the
separate C04 identity binding remains unproven and cannot substitute for the
visible marks or geometry.

LibreCAD's first-party project README describes it as a generic 2D CAD app,
documents DXF read/write, and lists point, line, circle, ellipse, parabola,
hyperbola, and spline primitives. Its official wiki/manual also documents
polyline entities and layer management. Its official FAQ lists R12, R14,
2000, 2004, and 2007 DXF and warns that not all DXF features are supported.
Since AC1015 is AutoCAD 2000 and this exact fixture uses those documented 2D
primitives/layers, the existing one-round-trip pilot is a relevant, bounded
test rather than an arbitrary candidate trial. These sources do not prove
preservation, garment-CAD semantics, or industrial conformance. Rights and
locality are supported by its first-party GPLv2/free local-app materials; no
cloud service or account is part of the scoped test. No installer was run,
no DXF exchange occurred, and no gate passed. The exact pilot still requires
Windows elevation; no other candidate or variation is planned.

Primary sources: [LibreCAD project README](https://github.com/LibreCAD/LibreCAD),
[official LibreCAD FAQ](https://dokuwiki.librecad.org/doku.php/usage%3Afaq),
[2.2.1.5 release](https://github.com/LibreCAD/LibreCAD/releases/tag/v2.2.1.5).

## Preflight checkpoint

The source-based pre-install screen is recorded at Control Center board
revision 4003. `npm run control-center:test` passes 42/42; `git diff --check`
passes with only the existing LF-to-CRLF working-copy warnings. No production
code changed. S674 remains In Progress; no receiver gate passes at this
checkpoint. Its next action remains the exact one-time native pilot after the
required Windows elevation UI is available. No alternate candidate or
acceptance change is introduced. The goal record was rechecked at this safe
boundary: status is Active, and its objective still matches the admitted
EPIC-17-through-merge work.

At 2026-10-10 16:11 UTC, the hash-verified installer was invoked once after
this preflight and Windows `consent` PID 130656 appeared. On 2026-10-10
16:48 UTC, read-only checks found that PID and all installer/elevation windows
were gone; no LibreCAD process, install directory, or uninstall entry exists.
The install did not complete, but the prompt's disappearance reason is
unknown. No DXF pilot began. Do not relaunch the installer without fresh
action-time confirmation or attempt to bypass Windows consent. If authorized,
resume only the same one-time pilot and its recorded stop/go gates.
The prompt-state correction is recorded at board revision 4005;
`npm run control-center:test` passes 42/42 and `git diff --check` passes.

Compare input, saved output and re-imported output without alignment: every
CUT/SEW path and typed mark/location/layer must remain at `0.001 cm`; verify
units, origin, orientation, separate piece selectability, no import warnings,
repeatable output, and actual whole/detail rendered output. Run the exact
S672-style source parser/comparator adapted only to observed DXF version and
supported entity syntax. Record the real receiver/version and every message.

## Stop/go

**Go** only if the full representative sequence passes every applicable
criterion without a generic “DXF opened” substitution. This qualifies at most
an empirical `LibreCAD 2.2.1.5` DXF profile; make no ANSI/AAMA/ASTM or apparel-
CAD/factory claim. Only a representative pass authorizes a later, separately
numbered gate for C04 sidecar binding, negative-input behavior, two frozen
round trips, the seven-recipe/73-option matrix and grades.

**Stop** this candidate on any geometry/unit/mark/identity/readability miss,
silent repair, warning, or unusable local workflow. Do not vary format, units,
or settings to chase a pass. No V03 acceptance, all-seven coverage, legacy
DXF, protected byte identity or final merge/deployment gate changes.

## Ownership and verification

CAD interaction and source comparison are coupled; no safe disjoint
delegation. Codex owns the pilot and integrated review. Focused checks include
exact source/output hashes, independent entity inventory, all CUT/SEW numeric
comparisons at `0.001 cm`, typed mark comparison, warning/state capture,
rendered whole/detail inspection, and board focused tests at close. No
production changes means changed-code coverage does not apply. Full repository
100% coverage and integrated builds/render/legacy checks remain at the settled
Epic/PR boundary. No physical fit, factory acceptance, or readiness claim.

## Time ledger

- Receiver/install and analysis: record separately at exit.
- Focused verification: record separately at exit.
- External-agent waits: 0 minutes; no safe independent work.
- Maintainer-decision time: 0 minutes; no decision pending.
- Usage at start: 3% primary / 16% weekly. No new paid service or account.
