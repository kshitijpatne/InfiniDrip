# EPIC-17 / G04 V03 free receiver alternatives — Slice 471 exit

## Disposition

The targeted candidate review found no free Windows 11 local or online option
that is both an apparel-CAD round-trip receiver and within the admitted scope.
Seamly2D supports Windows 11 and is GPLv3+, but the project confirms it cannot
import DXF. OpenMarker is local/free and can import certain DXFs, but its own
README says it is not production-ready and export is still planned. Garment.dev
claims AAMA/ASTM import/export but is browser-based, invite-only and stores
patterns in an account-backed hosted library, outside G04 scope. The exact
Richpeace V8 free edition remains the strongest documented exchange lead, but
does not list Windows 11 and has no proven behavior on this host.

No pattern or synthetic fixture was uploaded; no application was installed,
profile chosen, or compatibility claim made. V03 remains In Progress. The S469
checklist and S470 OS caveat remain current.

## Verification

- Start: 2026-10-08 04:58:01 UTC from clean S470 `1f931720fc0b1076306c8017d322db57405d8d4d` on
  `codex/epic-17-g04`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor. Highest slice
  470; S471 unique. Board revision 2899; V01/V02 Done; V03 In Progress.
- Validated start and exit replays advance board revision
  2899→2903→2907; EPIC-17/V03 remain In Progress.
- `npm run control-center:test`: 42/42 pass. `git diff --check` passes.
- Documentation/research only; no changed production code, exporter, fixture,
  rendered output, protected identity, or global gate.

## Next action and timing

The owner may attempt the normal Richpeace V8 Free English installer if willing
to test on an OS the vendor does not list. If installed and stable, confirm
exact About/build, usage rights, local processing and exchange menus before
opening S463 fixtures. Otherwise the goal needs a different owner-accessible,
rights-reviewed receiver; do not use hosted service, a DXF-only viewer, or an
import-only application to claim V03.

Elapsed approximately 1m05s (04:58:01–04:59:06 UTC): targeted source review
~36s; durable records/board replay ~25s; focused tests/diff ~4s; implementation
0m; external-agent waits 0m; maintainer-decision time 0m.
