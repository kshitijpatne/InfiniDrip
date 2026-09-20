# EPIC 9 — Desktop Release Readiness

Status: **IMPLEMENTED — Codex-owned; final overall EPIC 9–10 gate remains open**

## Baseline and objective

The execution baseline is the verified Slice 130 commit `241732e` on
`origin/main`. The earlier Slice 129 commit is `bc7ae73`; it is historical
context, not a reset target. This epic covers the bounded release-readiness
work that can be proven on the current host and in the existing Electron
scaffold. It does not turn the project into a signed or generally released
desktop product.

The objective is to make the packaged application launch, save, export, and
recover predictably under the failure modes a maintainer can reproduce, then
leave a reviewable evidence trail for the supported host/package target.

Codex owns architecture, production changes, verification harnesses, evidence,
documentation, review, merge, and the only push to `origin/main`. No
contributor edits the Codex checkout while this epic is active.

## In scope

- Offline launch of a packaged, unpacked Electron build with no network
  dependency for the initial window or its core UI.
- Native-save behavior, including successful save, user cancellation, invalid
  or unwritable paths, permission failures where the host permits simulation,
  and the guarantee that cancellation/failure does not create a misleading
  partial success state.
- Packaged smoke verification: process startup, renderer startup, expected
  application identity, clean console/error capture, core controls, and clean
  close.
- Menu and window lifecycle: app-ready/open, close, relaunch, activate, window
  state persistence/recovery, stale or malformed local state, and recovery
  after a renderer/process failure that can be reproduced locally.
- All six existing export paths: SVG, DXF, tiled PDF, Tech Pack, Projector,
  and A0. Each path must be exercised from its supported UI/API route and its
  output must be parsed or otherwise checked for the expected file structure.
- Button-versus-menu parity for every export action exposed by both surfaces.
  If the current menu does not expose all six actions, the bounded release
  implementation must add the missing routes or record a concrete,
  evidence-backed product decision before merge; no export path may disappear
  silently.
- Fresh-profile behavior, including first launch with no local state and
  recovery from stale, malformed, or version-incompatible local state.
- Reproducible package evidence where the current host and `electron-builder`
  support it: package inventory, launch result, output integrity, and
  SHA-256 manifests. Any packager nondeterminism is recorded rather than
  described as reproducibility.

## Explicit non-goals

- No signing credentials, certificate procurement, notarization, or claim of a
  signed release.
- No updater feed, update service, auto-update protocol, or invented release
  channel.
- No installer/distribution contract beyond the host-supported unpacked
  `electron-builder --dir` artifact.
- No unverified macOS or Linux behavior claims from a Windows-only run, and no
  cross-OS guarantee without matching evidence.
- No physical garment-fit or production-readiness claim.
- No geometry rewrite, export-baseline movement, unrelated UI redesign, or
  broad Electron migration.

## Dependencies and ownership boundaries

- Required baseline: Slice 130’s passing typecheck, production build, parsed
  outputs, 100% coverage, and eight legacy export hashes remain unchanged.
- Required context: `electron/main.cts`, `electron/preload.cts`, the existing
  Electron verification scripts, `DESKTOP-RELEASE-RESEARCH.md`, and the
  current export/persistence contracts.
- EPIC 7 is an independent OpenCode Nesting Intelligence implementation. Its
  slices may not edit this epic’s Electron, package, or release boundary.
- EPIC 10 is test/developer-only and starts after EPIC 9’s package/lockfile
  changes are integrated. This ordering prevents package-manifest collisions.
- Codex is the only owner of production source, Electron behavior, shared
  contracts, package scripts, durable docs, integration, merge, and push.

## Slice plan

### Slice 135 — Verification contract and current-host package harness

Owner: Codex. Model assignment: Luna-max for inspection and repetitive
harness work; Sol-high only for a short design decision if an ambiguous
failure requires it. Terra, Astra, and Sol-max are out of scope.

Define stable, non-networked verification entry points and artifact locations.
Make the packager target explicit, use fresh temporary profiles, capture
stdout/stderr and browser-console failures, and make cleanup safe. Preserve
the existing focused verification scripts while extending them rather than
replacing their coverage.

Acceptance: a clean checkout can build the main process, create the supported
unpacked package, run the smoke harness, and report actionable failure output;
the harness does not depend on an internet connection or a developer’s
profile. No generated package or user evidence is staged accidentally.

### Slice 136 — Offline, fresh-profile, and stale-state behavior

Owner: Codex; Luna-max routine implementation and triage.

Verify packaged launch with network access unavailable, first-run defaults,
malformed/old local state, invalid persisted surface state, and recovery after
relaunch. Any invalid state must be truthful and actionable; the application
must not silently turn invalid input into a different valid design.

Acceptance: the packaged app reaches a usable first window offline, stale or
invalid state is rejected/recovered with observable guidance, and a relaunch
does not inherit a corrupt window or renderer state. Evidence includes fresh
profile paths, captured logs, and the resulting UI/output state.

### Slice 137 — Native save and six-export parity

Owner: Codex; Luna-max for harness expansion and test triage, Sol-high only for
a short contract decision.

Exercise native save success, dialog cancellation, invalid paths, permission
or write failures, and cleanup of partial artifacts. Exercise all six export
paths through their button/API route and their menu route where exposed; add
bounded menu wiring when needed. Compare the resulting parsed outputs and
error behavior rather than merely checking that a click returned.

Acceptance: cancellation is a no-op from the user’s point of view, failures
are actionable and do not report success, all six paths create structurally
valid outputs, and button/menu routes are equivalent for the same project
state. The eight legacy hashes remain byte-identical.

### Slice 138 — Menu and window lifecycle recovery

Owner: Codex; Luna-max for implementation and repeatable lifecycle scripts.

Verify menu registration and invocation, close/quit behavior, activate and
reopen behavior, persisted bounds/state, malformed state recovery, and a
relaunch after a clean close. Record the host/DPI assumptions and distinguish
observed behavior from unsupported platform claims.

Acceptance: menu actions target the same export contract as buttons, windows
close without orphaned processes in the harness, valid state is recovered,
invalid state is ignored or repaired safely, and a second launch reaches the
same usable application state.

### Slice 139 — Artifact integrity and exit evidence

Owner: Codex; Luna-max for documentation and deterministic evidence
collection; Sol-high only for final risk adjudication.

Run the complete release-readiness gate, produce an inventory and SHA-256
manifest for the supported unpacked package and representative outputs, and
write the durable exit report. Repeat packaging when practical using the same
lockfile and host. If hashes differ because of known packager metadata, list
the exact differences and classify the result as bounded reproducibility,
not full reproducibility.

Acceptance: all in-scope scenarios have pass/fail evidence, all failures are
either fixed or explicitly outside the supported host boundary, no signing or
updater claim is present, and the final report points to commands, artifacts,
logs, and parsed output evidence.

## Realistic failure matrix

The release gate must deliberately exercise these cases, not just the happy
path:

1. Launch the packaged app with network access unavailable; confirm core UI
   readiness and no network-required startup error.
2. Cancel the native save dialog; confirm no file, stale success message, or
   mutated project state is reported.
3. Select a missing, invalid, or unwritable path; confirm an actionable error
   and no misleading output artifact.
4. Relaunch after a normal close and after malformed/partial window-state
   data; confirm safe default bounds and a usable window.
5. Invoke every shared export action from button and menu routes; compare
   parsed output and error semantics.
6. Start with empty, stale, malformed, and version-incompatible local state;
   confirm truthful recovery guidance.
7. Inspect packaged output inventory, executable presence, renderer assets,
   no unexpected absolute development paths, and output-file integrity.

## Verification commands and evidence

All commands are run serially unless a script explicitly creates an isolated
temporary profile. The expected gate is:

```text
npm test
npm run coverage
npx tsc --noEmit
npm run build
npm run electron:build-main
npm run electron:pack
npm run electron:verify
npm run electron:verify-packaged
npm run electron:verify-menu
npm run electron:verify-menu-packaged
npm run electron:verify-release
git diff --check
```

The implementation may add narrowly named verification commands, but it must
not remove or weaken the existing commands. Where a command is unavailable on
the host, the report records the exact command, the host limitation, and the
replacement evidence instead of claiming a pass.

Rendered/output evidence is mandatory: a packaged launch log, fresh-profile
and stale-state logs, native-save cancellation/failure logs, lifecycle logs,
parsed output summaries for all six export paths, button/menu parity results,
package inventory and hashes, and the unchanged eight legacy hashes. Raw
temporary evidence may remain under `tmp/epic9/`; durable conclusions and
artifact-manifest hashes belong in `docs/release/EPIC-9-EXIT-REPORT.md`.

## Safe parallel boundaries

- EPIC 7 may work in its own OpenCode worktree, but only on its explicitly
  scoped nesting-intelligence slices. It must not edit this checkout, Electron
  source, package files, baselines, or current-state docs.
- EPIC 10 waits until this epic’s package scripts and lockfile are integrated.
  Its Claude worktree may add test-only dependencies and tests after that
  point, but it must not edit Electron files or release behavior.
- No two agents share a checkout or edit the same package manifest, lockfile,
  export contract, or durable state file concurrently.

## Implementation checkpoint — 2026-09-20

Slices 135–139 are implemented on the Slice 130 descendant. The bounded
developer harness now resolves the current host's unpacked artifact instead of
assuming Linux, starts its own local preview for the dev-shell check, isolates
profiles, captures rendered screenshots, and records parsed output/package
hashes. The Electron shell now rejects malformed finite/window-state fields
instead of spreading stale types into `BrowserWindow`, and a profile write
failure cannot turn a normal close into an application crash. Packaging is
explicitly `electron-builder --dir --publish never`; no signing or updater
behavior was added.

The durable evidence report is
`docs/release/EPIC-9-EXIT-REPORT.md`. Raw output and rendered evidence from the
current Windows host are under `tmp/epic9-release/` and are intentionally not
part of the product package. The report records the exact supported artifact,
commands, output hashes, failure injections, window-state tolerance, and the
unsupported-platform boundary.

The implementation gate passed serially: 94 files / 1,255 tests, 100%
statements/branches/functions/lines, typecheck, production build, Electron
main build, dev and packaged save checks, dev and packaged menu/window checks,
the complete packaged release harness, and two consecutive package builds with
the same 72-file package manifest SHA-256. The Windows Authenticode check was
`NotSigned`; this is recorded as an expected release boundary, never as a
signed-release claim. The eight legacy hashes and parsed-output gate remain
unchanged.

## Final exit criteria

EPIC 9 is complete only when the six export paths, offline packaged launch,
native save, fresh/stale profiles, menu/window lifecycle, cancellation and
failure behavior, and current-host package integrity each have passing or
explicitly bounded evidence; the full repository gate still passes; the
durable docs are updated; Codex has inspected the complete diff and evidence;
and the integrated commit is ready for the sole push to `origin/main`.
