# Desktop Release — Research & Release-Architecture Packet

_Status: research/architecture only. No implementation changed in this packet.
No garment has been physically sewn and validated; nothing here claims
physical fit or production readiness._

## 0. Packet metadata (observed)

- Worktree branch (observed via `git branch --show-current`): `opencode/desktop-release-research`
- Tree state immediately before packet creation (observed via `git status --short`): clean;
  this research packet is the only untracked file after creation.
- Base history (observed via `git log --oneline -5`): Slice 104 tip `9890beb`,
  then `ae9701b`, `d391cdc` (Slice 104), `796eb18`, `0877e30` (Slices 103/102).
- Electron history (observed via `git log --oneline -3 -- electron package.json`):
  `e13e37f` Slice 47 (menu, window state, identity), `398f22f` Slice 46
  (Electron shell), `ff9ca01` Fable F1 (projector/A0 writers).
- Files inspected for this packet: `AGENTS.md`, `CONTEXT-INDEX.md`,
  `PROJECT-STATE.md`, `docs/PROJECT-DECISIONS.md`, `ARCHITECTURE.md`,
  `docs/OPENCODE-WORKFLOW.md`, `docs/planning/ROADMAP.md`,
  `docs/planning/MVP-PLAN.md`, `package.json`, `electron/main.cts`,
  `electron/preload.cts`, `electron/tsconfig.json`,
  `electron/verify-save.cjs`, `electron/verify-menu-and-window.cjs`,
  `vite.config.ts`, `index.html`, `src/ui/app.ts` (§download/menu only).
- Commands run for this packet (all read-only except writing this file):
  `git branch --show-current`, `git status --short --branch`,
  `git log --oneline -5`, `git log --oneline -3 -- electron package.json`,
  directory/glob reads of `docs/research`, `electron/**/*`,
  content grep for `electronAPI|save-file|isPackaged|offline|serviceworker`
  in `src/`. No build, test, or packaging command was run (out of scope for
  a research-only change; see §10 cheapest spike).
- `dist-electron/` and `release/` do not exist in this worktree (observed via
  `Test-Path`; both `False`). No packaged artifact was inspected because none
  exists here.

## 1. Scope and non-goals

- Scope: describe the existing Electron scaffold as observed, list what
  remains for a signed offline desktop release, and give packaging,
  update, signing, acceptance-gate, risk, and next-spike recommendations.
- Non-goals: no source, config, test, baseline, or governance change; no
  dependency added; no credentials touched; no Epic 4 work; no garment,
  fit, or production-readiness claim.

## 2. Observed facts — what is already implemented

### 2.1 Main process (`electron/main.cts`, observed)

- Opens one `BrowserWindow` pointed at the same renderer as the browser build
  (no renderer fork). Dev loads `VITE_DEV_SERVER_URL` (default
  `http://localhost:5173`); packaged loads `../dist/index.html` via `loadFile`.
- App identity: `app.setName("InfiniDrip")` before `whenReady()`; comment
  records that dev-mode `app.getName()` otherwise returns `"Electron"`.
  Window title is `"InfiniDrip"` (`index.html` `<title>`, observed).
- Native save: one `ipcMain.handle("save-file", ...)` channel — native save
  dialog with `defaultPath`, `fs.writeFile` UTF-8 text write on confirm,
  `{ saved: false }` on cancel, no write on cancel.
- Menu: `File > Export` mirrors the six renderer export kinds with the same
  labels (`SVG, DXF, PDF, Tech Pack, Projector, A0`); click sends one
  one-directional `menu:export` IPC message. `Edit` (undo/redo/cut/copy/
  paste/selectAll), `View` (reload, devtools, zoom, fullscreen), and
  `windowMenu` roles are standard roles. macOS gets an app menu with
  About/Quit, and File uses Close instead of Quit on macOS.
- Window-state persistence: synchronous read/write of
  `<userData>/window-state.json` (`{x?, y?, width, height, isMaximized}`,
  default 1400×900 non-maximized); corrupt/too-small files fall back to
  default; maximized windows save normal bounds. Written once on `close`.
- Lifecycle: `window-all-closed` quits except on macOS (`darwin`); `activate`
  recreates the window. `backgroundColor: "#0A1422"` matches the renderer to
  avoid a white flash.
- Explicitly deferred in code comments: code signing and auto-update
  (citing `MVP-PLAN.md` §1.4/Month 1; update wiring against no release feed
  called out as unverifiable and therefore not shipped).

### 2.2 Preload bridge (`electron/preload.cts`, observed)

- Minimal `contextBridge` surface: `electronAPI.saveFile(filename, content)`
  and `electronAPI.onExportRequested(callback)`. `contextIsolation: true`,
  `nodeIntegration: false` in the window's `webPreferences`.
- No filesystem, dialog, or Node globals leak to the renderer beyond those
  two functions (observed: the whole file is 19 lines).

### 2.3 Renderer integration (`src/ui/app.ts`, observed §§877–968)

- `download()` routes through `window.electronAPI.saveFile` when present,
  else falls back to the pre-existing Blob-download path. All six export
  buttons (SVG, DXF, tiled PDF, tech pack, projector, A0) share this path.
- Menu exports click the real matching button
  (`svg→export-svg`, `dxf→export-dxf`, `pdf→export-pdf`,
  `techpack→export-techpack`, `projector→export-projector`, `a0→export-a0`),
  so menu and button are one code path by construction (comment states this;
  `verify-menu-and-window.cjs` exercises it for SVG only — see §2.5).
- Journey/export truth: `completeExport()` (journey `done` + celebration)
  runs only after `saveFile` confirms `{ saved: true }`; cancel/failure
  leaves export incomplete with actionable status copy. Per `ARCHITECTURE.md`
  BF-P1-04, input/recipe/option/material/fit-target/size/nesting changes
  invalidate prior output.

### 2.4 Build/packaging config (`package.json`, `electron/tsconfig.json`, `vite.config.ts`, observed)

- `main: dist-electron/main.cjs`; Electron sources are `.cts` compiled to
  CommonJS so `"type": "module"` does not affect them.
- Scripts: `electron:build-main` (`tsc -p electron/tsconfig.json`),
  `electron:dev`, `electron:pack` (`build` + `build-main` + `electron-builder`),
  `electron:verify` / `electron:verify-packaged`,
  `electron:verify-menu` / `electron:verify-menu-packaged`.
- Dependencies (observed versions are ranges): `electron ^44.1.0`,
  `electron-builder ^26.15.3`, `playwright ^1.62.1` (dev, used by both
  verify scripts), `vite ^5.4.11`, `vitest ^2.1.8`.
- `electron-builder` config: `appId com.infinidrip.app`, `productName
  InfiniDrip`, `files: dist/**/* + dist-electron/**/*`, output `release/`;
  **all three OS targets are bare `dir`** — `mac: { target: dir, identity:
  null }`, `win: { target: dir }`, `linux: { target: dir }`. No installer
  targets (no NSIS, no DMG/pkg, no AppImage/deb/rpm), no signing identity,
  no notarization, no publish/update configuration, no `electron-updater`
  dependency.
- `vite.config.ts` sets `base: "./"` with a comment explaining packaged
  `file://` loading; strictly safer for web hosting too (observed).
- `electron/tsconfig.json`: `ES2022`/`CommonJS`, `strict`,
  `noUnusedLocals/Parameters`, outDir `../dist-electron`, `types: [node]`.

### 2.5 Verification scripts (observed, not executed)

- `electron/verify-save.cjs`: launches real Electron via Playwright, stubs
  only `dialog.showSaveDialog`, uses a fresh temp profile per run, skips the
  welcome tour, clicks `#export-svg`, asserts a file lands on disk containing
  `<svg`. Dev and `--packaged` (Linux `release/linux-unpacked`) modes.
- `electron/verify-menu-and-window.cjs`: asserts `app.getName() ===
  "InfiniDrip"` and window title `=== "InfiniDrip"`; clicks the real
  `File > Export > SVG` menu item via Electron's Menu API and asserts the
  save round-trip; resizes/moves, closes (real sync save), relaunches on the
  **same** profile, and asserts exact restored bounds.
- Coverage gap (observed): menu-export verification covers SVG only; DXF,
  PDF, tech-pack, projector, and A0 menu paths rely on the shared click-the-
  button wiring, not on per-kind menu tests. Renderer-side bridge behavior
  is unit-tested with a mocked bridge (`src/ui/app.test.ts`, observed via
  grep); the scripts are the unmocked half.

## 3. Sourced facts (from repo documents, not re-verified externally)

- `docs/PROJECT-DECISIONS.md`: code-signing procurement and implementation
  have not started. `AGENTS.md` repeats: code signing has not started.
- `docs/planning/ROADMAP.md` §1.4: Electron is the recommended desktop path
  for this codebase (solo TypeScript, no Rust exposure; bundle size is not
  the bottleneck); code signing is non-negotiable (macOS Gatekeeper and
  Windows Defender warnings destroy trust); Apple Developer account ~$99/yr
  plus a Windows certificate; issuance takes days-to-weeks, so start early
  because it blocks distribution, not development.
- `docs/planning/MVP-PLAN.md` §3.4: MVP platform scope is signed installers
  for Windows + macOS, offline-capable, native file save, auto-update
  scaffold. Month 1 exit: a physically sewn tee that fits plus a signed
  installer a stranger can download and run. Linux is not in the MVP
  platform scope (config nonetheless defines a Linux `dir` target).
- `docs/planning/MVP-PLAN.md` §1: code-signing issuance (days to weeks) and
  physical sewing turnaround are calendar risks tracked separately from
  slice velocity; start procurement in week 1.

## 4. Estimates (general platform knowledge, not verified in this repo)

- Windows signing in 2026 normally means an OV or EV code-signing
  certificate from a CA complying with current key-storage rules (commonly
  hardware token or HSM-backed), plus building SmartScreen reputation over
  time; expected procurement cost is on the order of hundreds of USD/year
  and issuance typically days to a few weeks. **Estimate — confirm with a
  current CA price/lead-time check before budgeting.**
- macOS distribution outside the Mac App Store normally needs an Apple
  Developer Program membership, Developer ID certificate, Hardened Runtime
  with entitlements, `notarytool` notarization, and stapling; first-time
  setup commonly takes days including account verification. **Estimate —
  confirm against current Apple documentation at implementation time.**
- `dir`-only targets produce an unpacked folder, not an installer; adding
  NSIS (Windows), DMG/pkg (macOS), and AppImage/deb (Linux) targets is
  small config work, but each needs a real OS (or CI runner) to verify —
  cross-building installers from one OS is unreliable. **Estimate based on
  electron-builder conventions, not tested here.**
- Auto-update via `electron-updater` needs a hosted release feed (e.g.
  GitHub Releases) plus signing on the relevant platforms; unsigned
  auto-update is not trustworthy to ship. **Estimate.**
- Bundle size for an Electron app of this shape is plausibly in the
  ROADMAP-quoted ~120–200 MB range once packaged with Chromium + Node.
  **Estimate — measure from the §10 spike, do not quote.**

## 5. What remains for a signed offline desktop release

1. **Procurement (admin, parallel, blocks distribution):** Apple Developer
   membership + Windows code-signing certificate. Not started per §3.
2. **Installer targets:** replace/augment `dir` with per-OS installers —
   Windows NSIS (+ signing config), macOS DMG or pkg (+ `hardenedRuntime`,
   entitlements, `notarize`), Linux installer format decision (out of MVP
   scope; `dir` may suffice for internal testing).
3. **Signing + notarization wiring:** `win.certificateFile/password`
   (or Azure Trusted Signing / token workflow), `mac.identity`,
   `afterSign` notarization hook, staple step; secret storage decision
   (see §8). `mac.identity: null` must be removed deliberately.
4. **Update strategy decision + scaffold:** `electron-updater` dependency,
   publish provider (e.g. GitHub Releases), feed URL, staged-rollout and
   rollback policy, unsigned-install behavior. Currently absent by design.
5. **Offline-asset audit:** confirm zero runtime network dependencies —
   no CDN fonts/scripts, no telemetry, no remote config; `loadFile` +
   `base: "./"` already avoids the known failure mode. No service worker
   exists or is needed for `file://`; do not add one speculatively.
6. **Native-save hardening:** large/binary-safe review of the save path
   (current channel passes UTF-8 strings; all six writers emit strings
   today, but any future binary writer must revisit this), overwrite/
   error UX, long-path and permission-failure handling, save of all six
   kinds through the menu (extend §2.5 coverage to all kinds).
7. **Desktop hardening basics:** single-instance lock, deep-link/file-open
   handling (currently files are only written, never opened), crash
   reporting decision, Content-Security-Policy for the renderer, `sandbox`
   review for the `BrowserWindow` (currently relies on
   contextIsolation/nodeIntegration only — observed).
8. **Release pipeline:** versioned builds, changelog, artifact checksums,
   per-OS smoke matrix (install → launch offline → export all six →
   relaunch window-state), quarantine/Gatekeeper/Defender acceptance per
   OS, and the export byte-identity gate run against packaged output.
9. **Docs:** user install/uninstall instructions per OS, offline-capability
   statement, Gatekeeper/Defender first-run notes for unsigned test builds.

## 6. Windows / macOS / Linux packaging implications

| Concern | Windows | macOS | Linux |
|---|---|---|---|
| Current config | `dir` only | `dir` + `identity: null` | `dir`, `executableName InfiniDrip` |
| Needed for release | NSIS installer + Authenticode signing | DMG/pkg + Developer ID + notarize/staple | Format decision (AppImage/deb/rpm); MVP-external |
| Trust UX if unsigned | SmartScreen warning; reputation builds over time | Gatekeeper blocks/quarantines; right-click open or bypass | No central gate; distro-dependent |
| Verification host | Real Windows (or CI runner) | Real Mac incl. Apple-silicon shape (or CI) | CI Linux runner suffices for internal use |
| Menu/lifecycle notes | Standard quit path | App-menu About/Quit, Close-vs-Quit, `activate` relaunch — already handled in `main.cts` | Same as Windows path |

## 7. Native save and offline asset behavior (observed)

- Save is main-process-owned: dialog + write live outside the renderer;
  the renderer never touches the filesystem (preload exposes two functions).
- Persistence besides exports: design workspace in `localStorage`
  (Electron persists it per profile — the verify scripts explicitly use
  fresh vs. reused profiles to control this), journey progress versioned
  JSON, window bounds in `userData/window-state.json` (sync write on close
  to avoid quit-race loss).
- Offline posture: the app is a local-first pure-function engine with an
  SVG UI; packaged loading is `file://` with relative asset paths. No
  network calls were found in the Electron files or the inspected renderer
  save path. A full offline audit (grep for `http`, `fetch`, font/CDN
  imports across `src/`) is still open and belongs to the release gate,
  not to this packet.
- Failure semantics today: cancel → `{ saved: false }`, no write, honest
  status; write throw → failure flash, no journey completion; browser
  fallback → Blob download with "verify before marking complete" copy.

## 8. Update strategy, signing lead-time, and secret handling

- Update strategy (recommendation): adopt `electron-updater` with a
  provider-backed feed (GitHub Releases is the cheapest credible host),
  ship the updater disabled-or-absent until signing + feed exist, define
  channel policy (stable only for MVP), and document rollback (previous
  installer + version-pinned feed). Do not wire an updater against a
  nonexistent feed — `main.cts` already states this principle.
- Signing lead-time (sourced + estimated): start procurement immediately
  and in parallel with engineering; ROADMAP says days-to-weeks issuance.
  No code work depends on the certificates arriving, but no public release
  is credible without them.
- Secret handling (recommendation): certificates/keys and notarization
  credentials must never enter the repo, worktrees, logs, or verify
  scripts. Use CI secret storage (or a local keychain/token at release
  time), reference by environment variable in `electron-builder` config,
  and rotate/revoke on any exposure. This packet adds no secrets and
  changes no config toward hardcoding any.

## 9. Release acceptance gates (recommended)

1. `npm test` green, `npm run coverage` 100% on all four metrics,
   `npx tsc --noEmit` clean, `npm run build` clean (existing project gates,
   unchanged).
2. `npm run electron:build-main` clean; `electron:pack` succeeds per OS.
3. `electron:verify-save` (dev + packaged) PASS; `electron:verify-menu-
   and-window` (dev + packaged) PASS; menu coverage extended to all six
   export kinds before calling the desktop path fully verified.
4. Export byte-identity regression gate passes on packaged-renderer output
   (all eight legacy hashes unchanged unless a documented, approved move).
5. Per-OS smoke: fresh install → offline launch (network disabled) → all
   six exports → relaunch preserves window state → uninstall clean.
6. Signed-artifact checks: valid signature on Windows/macOS, notarization
   ticket stapled on macOS, no Gatekeeper/Defender hard block on a
   first-run machine.
7. No physical-fit or production-readiness language in release notes or
   in-app copy; digital-only honesty gates intact.

## 10. Risk order and cheapest next spike

Risk order (highest first):

1. **Signing procurement delay** — blocks distribution, not development;
   calendar risk, start now.
2. **Unsigned-trust UX** — Gatekeeper/SmartScreen warnings on first public
   contact; mitigated only by real signing + reputation.
3. **No installer targets** — current `dir` output is not shippable to
   strangers; small fix, needs per-OS verification.
4. **No update feed** — first release without updates is acceptable; every
   release after the first without one is support debt.
5. **Unverified packaged parity** — `dist-electron/` and `release/` do not
   exist here; packaged behavior is proven only by scripts last run at
   Slice 47 time, not re-run in this packet.
6. **Menu coverage gap** — five of six menu export kinds rely on shared
   wiring without a per-kind scripted check.
7. **Save-path edge cases** — overwrite, permissions, long paths, future
   binary writers; untested failure UX on real user machines.

Cheapest next spike (no source change; measured in minutes plus one
packaging run on the current OS):

```powershell
npm run build
npm run electron:build-main
npx electron-builder --<win|mac|linux> --dir
node electron/verify-save.cjs --packaged
node electron/verify-menu-and-window.cjs --packaged
```

Record: packaged sizes, launch success, both scripts' PASS output, and any
per-OS deviation. That single spike retires risk 5 and sizes risk 3, and
it is the prerequisite for every installer/signing step above. The
administrative parallel is: open Apple Developer enrollment and request a
Windows certificate quote this week.

## 11. Unknowns and blockers

- Whether the Slice 47 verify scripts still pass on current Electron
  `^44.1.0` / Playwright `^1.62.1` — not re-run here (research-only scope).
- Actual packaged size, launch time, and per-OS smoke results — unknown
  until the §10 spike runs; no numbers are asserted in this packet.
- Certificate vendor, cost, key-storage mechanism, and issuance timeline —
  undecided; maintainer/admin decision required.
- Update host, channel policy, and Linux installer-format decision —
  undecided; maintainer decision required.
- Full offline audit (network-reference grep across `src/`) — not
  performed; open verification item, not a claim of zero network use.
- No physical garment validation exists anywhere in the project; desktop
  release work must not imply otherwise.

## 12. Evidence log

- Read-only inspection commands and their observed outputs are recorded in
  §0. After writing this file, `git diff --check` was run for whitespace
  hygiene (result recorded by the contributor's return packet).
- No tests, builds, or Electron launches were run for this packet; the
  return packet reports that honestly rather than borrowing Slice 47/104
  results as current evidence.
