# UIQ-07 integration — Slice 755 exit

Status: pre-merge acceptance passed; PR/review and deployment are pending.

## Scope delivered

The accepted static native welcome visual now wraps only the existing first-run
tutorial Welcome. The existing Start/Skip controls, tutorial copy, local
progress, replay, `uiq_foundation` behavior, and digital-only fit/production
caveat remain authoritative. The shell keeps one page-level H1; the visual
wordmark is an H2. The embedded `uiq_welcome` flag defaults on for this
accepted release, has an explicit local test override, and preserves the exact
previous tutorial markup when disabled. It is not a remote kill switch.

No login, profile, account, hosted service, route, new CTA, persistence,
dependency, geometry, export, baseline, UIQ-08+, or BUG-UI-048 work was added.
The independently active EPIC-17 worktree was not edited. The accepted UIQ-07
candidate source, preview, proof, screenshots, and focused-coverage identity
all match `docs/research/uiq07/CANDIDATE-EXIT.json` after canonical-LF hashing.

## Verification

- `npm run coverage -- --maxWorkers=1 --minWorkers=1 --reporter=dot`: passed;
  164 test files, 2,669 tests, 100% statements (33,114/33,114), branches
  (17,300/17,300), functions (1,898/1,898), and lines (33,114/33,114).
  Final settled run took 1,392.94 seconds. All `src/ui/app.ts` counters and
  the accepted welcome component are 100% covered. One earlier settled attempt
  exposed three uncovered pre-existing app lifecycle guards at 99.98% branch
  coverage; three meaningful stale-mount/resize tests were added, passed
  focused verification, and the complete rerun passed at 100%.
- `npm run build`: passed; TypeScript and Vite production build transformed
  163 modules. The existing large-chunk advisory remains; no dependency or
  export baseline changed.
- `npm run control-center:test`: 42/42 passed. `npm run web:release:test`:
  10/10 passed. `npm run readiness:drill:test`: 5/5 passed.
- `npm run electron:pack` and `npm run electron:verify-release`: passed. The
  packaged Windows app inventory contains 72 files, has no absolute dev path,
  and has no verification errors. The initial verifier correctly requested a
  package; the package was built locally with publishing disabled.
- Production-built browser pressure evidence is in
  `docs/research/uiq07-integration/evidence/browser-pressure-report.json`:
  13 checks passed at 1280/640/390/320 px, 0 axe WCAG 2.1 AA violations, visible
  keyboard focus, forced-colors and reduced-motion behavior, working Start,
  Skip and replay, safe fail-closed behavior with unavailable local storage,
  no document overflow, no off-origin requests, and no page/console errors.
  The decorative ring has a larger scroll box but is clipped inside the panel;
  welcome copy remains within panel bounds. Screenshots are adjacent.
- Protected export byte identities passed in the complete test suite. No
  export baseline files were changed. Candidate proof and source hashes match.
- `git diff --check` passes. The canonical board was revision 4455 at the
  acceptance boundary; validated follow-up commands link this exit evidence and
  review note while keeping UIQ-07 In Progress and its candidate child Done.

## Review and stopping boundary

The full actual diff has been inspected against the admitted file boundary.
Candidate bytes are unchanged. The integration retains the current local-first
behavior and exact flag-off presentation; the welcome visual exits on Start or
Skip and reappears through the existing tutorial replay. No external coding
agent work was needed because shared app/flag/host integration is coupled.

Slice 755 is accepted for PR review only. UIQ-07 remains In Progress and
unshipped. The next action is a fresh `origin/main`/slice-history check followed
by one Slice 755 commit and Codex-owned PR review. Slice 756 may start only after
merge; it owns deployment/live verification, validated board closure, and
durable context reconciliation.
