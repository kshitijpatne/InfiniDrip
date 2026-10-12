# UIQ-06 Slice 745 — Nesting readout clarity

Status: complete on the isolated `codex/uiq06-admission` branch; not yet
merged or deployed. Base is `origin/main` `7923a7f4323d713b069817adfd7626f19c7b48f5`.

## Scope and result

Introduced the embedded `uiq_operational_clarity` flag and a structured
presentation for the already-computed Nesting readout. Scope, required length,
planned length, waste and on-hand values now scan independently; the fit
estimate and directional-print caveat have separate visual hierarchy. Existing
readout IDs and input/error controls remain stable. Only rendering strips the
old trailing middle-dot separator when the flag is enabled. The flag-off path
renders the previous markup and wording. No calculations, validation rules,
drafting, persistence, exports or baseline files changed.

## Acceptance evidence

- `src/platform/feature-flags.test.ts`: 11 passed, including default-on,
  local off, unknown and stale flag states.
- `src/ui/view.test.ts`: 93 passed, including exact legacy markup equality
  when the flag is disabled and enabled structure/IDs.
- `src/ui/app.test.ts -t "nesting intelligence"`: 15 passed, 271 unrelated
  tests skipped. Default worker setting: 32.46 seconds; single worker: 30.25
  seconds. All seven garment estimates, single/graded scope, fit, short,
  unknown, invalid buffer/on-hand, recovery and flag-off fallback passed.
- Fresh Chromium renders at 1280, 640 and 320 CSS px show no readout
  horizontal overflow. Explicit fit, short, unknown, zero on-hand and invalid
  buffer states remain truthful; page errors and off-origin requests: zero.
  Screenshots and state machine data are in
  `docs/research/uiq06/evidence/S745-rendered-pressure.json`.
- `npm run control-center:test`: 42/42 passed at the S744 boundary. Re-run
  after adding S745 board evidence before commit.
- An initial combined three-file focused run did not finish within about five
  minutes; one worker reached about 3.0 GB working set and the run was
  interrupted. Re-running the representative nesting app subset under default
  and one-worker settings passed at similar times; no test-worker defaults were
  changed. Record this diagnostic for the settled full gate.
- Export byte-identity baselines were not changed.

## Review and next action

The before/after images were visually inspected at 1280 and 320px; the facts,
verdict, and caveat are distinct and readable. A separate existing journey-rail
overflow at 320px is visible outside the nesting readout and remains out of
scope. The change is presentation-only and safe to proceed into S746 review.

Next: S746 audits the existing measurement provenance/history and capture
messages across representative rendered edge states. Make a presentation
change only if the evidence identifies a material user-facing ambiguity;
otherwise record a verified no-change decision. UIQ-07 remains unadmitted.
