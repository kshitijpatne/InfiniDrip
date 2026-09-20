# EPIC 9 — Desktop Release Readiness Exit Report

Date: 2026-09-20
Owner: Codex
Baseline: Slice 130 `241732e` (Slice 129 `bc7ae73` is historical)
Host evidence: Windows x64, Node `v24.15.0`, Electron `44.1.0`,
electron-builder `26.15.3`

Status: **EPIC 9 implementation complete on the supported host; the overall
EPIC 9–10 goal remains open until EPIC 10 is integrated and the final gate is
reviewed, merged, and pushed by Codex.**

## Implemented boundary

The Electron shell and developer verification now cover offline packaged
launch, fresh profiles, stale/invalid local state, native save success and
failure, all six export paths, button/menu parity, activation, close/relaunch,
malformed window-state recovery, and current-host unpacked-package integrity.
The package command is explicitly `electron-builder --dir --publish never`.

The changes do not add signing credentials, a signed-release claim, an updater
feed, installer support, or a cross-OS guarantee. `Get-AuthenticodeSignature`
reported `NotSigned` for the Windows executable, so signing procurement remains
a separate maintainer decision.

## Verification gate

| Command | Result |
|---|---|
| `npm test -- --maxWorkers=1 --minWorkers=1` | 94 files / 1,255 tests passed |
| `npm run coverage -- --maxWorkers=1 --minWorkers=1` | 100% statements, branches, functions, and lines |
| `npx tsc --noEmit` | passed |
| `npm run build` | passed; 103 modules transformed |
| `npm run electron:build-main` | passed |
| `npm run electron:verify` | passed; self-contained dev preview/native-save bridge |
| `npm run electron:verify-packaged` | passed; Windows unpacked artifact/native-save bridge |
| `npm run electron:verify-menu` | passed; identity/title/menu/window lifecycle |
| `npm run electron:verify-menu-packaged` | passed; packaged identity/menu/window lifecycle |
| `npm run electron:verify-release` | passed; complete EPIC 9 failure matrix |
| `git diff --check` | passed |

The full suite includes the parsed SVG, DXF, tiled-PDF, A0, projector, and
tech-pack consumers plus `src/export/regression.test.ts`; all eight legacy
hashes remained byte-identical. No baseline was moved.

## Packaged artifact evidence

Two consecutive `npm run electron:pack` runs with the same lockfile and host
produced the same manifest:

- artifact: `release/win-unpacked/InfiniDrip.exe`;
- package inventory: 72 files;
- `resources/app.asar` SHA-256:
  `28f80700393b41763b7f3f065e448ffea4a825eea97020dbcaa1191551fe9de4`;
- executable size: 245,289,984 bytes;
- no absolute `F:\designApp` path found in `app.asar`;
- packaged launch and renderer/title identity passed;
- raw inventory: `tmp/epic9-release/package-manifest.json`.

The packager's current-host output is an unpacked `win32/x64` artifact only.
macOS/Linux packaging, installers, signing, notarization, and distribution
feeds remain unverified and outside this epic.

## Pressure-test evidence

- Offline: packaged launch used `--host-rules=MAP * ~NOTFOUND`; a reload also
  denied HTTP(S) routes and reached the renderer successfully.
- Fresh profile: the welcome state rendered on first launch; a screenshot was
  captured and visually inspected at
  `tmp/epic9-release/outputs/packaged-fresh-profile.png`.
- Stale/invalid local state: malformed save and recovery JSON remained raw in
  storage while the packaged shell and canvas recovered without a renderer
  error.
- Six exports: SVG, DXF, PDF, Tech Pack, Projector, and A0 each produced a
  structurally checked output from the button route and the File > Export menu
  route. Each pair was byte-identical. The paired hashes were:

  - SVG: `3fbf2e3215af5bdfc66398b9b16714e8ee8139f5edc10dab527bc4c8378f2b9d`;
  - DXF: `0b6cba95c9afd4cc6f17a2171f67303e0891babb94828816c149767935165fc9`;
  - tiled PDF: `1256ccf60abedeed40b01915ea9a2df4d063b224d01a39dfbf8730136a128523`;
  - Tech Pack: `6691a28a6cae0baccfe271887c6d4d00a968867fe0628a8e1d1eacd2b8b047d1`;
  - Projector: `6e74f535d8fe7c011cc33a4949040cba1bd3e0e4c9bf84f46c0b5538448b3d83`;
  - A0: `2b4561a1de275ccaf3d07f900aba827880a33ae5ec7cece3f678c1a2e1e05177`.

- Save cancellation: no output was created and the renderer reported
  `Export canceled`.
- Path/write failures: a missing-parent path and an existing-directory target
  both produced `Export failed` without a false success state. ACL mutation was
  not used on Windows; the host-safe directory target exercises the same real
  main-process write failure path.
- Window lifecycle: malformed bounds/types recovered to usable numeric bounds;
  a same-profile close/relaunch restored position exactly and stayed within
  the observed 8 px per-axis Windows DPI drift tolerance. The activation check
  preserved one existing window.
- Output-stage screenshot: captured and visually inspected at
  `tmp/epic9-release/outputs/packaged-output-stage.png`; the UI labels all six
  paths and retains the explicit digital-only fit disclaimer.

The complete machine-readable record is
`tmp/epic9-release/verification.json`. These raw files are developer evidence,
not release binaries to commit.

## Review boundary

Codex inspected the complete Electron/package/script diff and the rendered and
output evidence. EPIC 10 starts from this integrated result in a separate
Claude worktree; no contributor may edit or push the Codex checkout.
