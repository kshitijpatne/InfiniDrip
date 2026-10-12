# Slice 747 — measurement provenance/history readability exit

## Decision

Keep the guided measurement-capture content and measurement summary unchanged.
The history dialog did have one concrete readability defect: its canonical ISO
timestamp ran directly after the validation label, and the `T` separator plus
millisecond suffix made the time hard to scan at 320px. Slice 747 changes only
that display to an explicit `Recorded (UTC): YYYY-MM-DD HH:mm:ss UTC` line and
labels the source detail. The `<time datetime>` attribute retains the original
canonical timestamp exactly. No measurement or provenance behavior changes.

## Scope and pressure cases

- Actual fresh-app guided measurement and built-in chest history rendered at
  1280×900 and 320×900 CSS px. The adjacent page section remains readable and
  the modal scroll behavior is intact.
- Synthetic, in-memory-only history pressure at 320×900: one valid
  user-entered value with long source detail and one invalid unresolved value
  with no capture timestamp. The dialog remains within the viewport and has no
  horizontal overflow (284px client/scroll width); content fits the available
  vertical dialog region and scrolls normally.
- Existing component tests cover absent history, invalid/missing definitions,
  multiple paginated records, raw and canonical values, null/unavailable
  canonical values, missing and present timestamps, invalid validation state,
  long/hostile imported source text and escaping.
- The separate guided capture screen was inspected at 1280 and 320. It clearly
  labels body inputs, missing status, meaning, use, source/limits and range;
  no targeted presentation change is warranted. Its long content continues in
  the page's normal scroll flow.
- Browser runs had no page errors or off-origin requests; no personal or
  persisted user data was used for synthetic pressure.

## Verification

- Focused history flow: 5 tests passed across `view.test.ts`, `app.test.ts` and
  `project-app.test.ts`; 392 unrelated tests were skipped by the name filter.
- Full `src/ui/view.test.ts`: 93/93 passed.
- V8 coverage: every changed executable production statement/line in
  `src/ui/view.ts` lines 206–209 was hit. Both timestamp-presence branches were
  exercised twice. The focused report's module-wide 100% threshold is not met
  because `view.ts` has unrelated pre-existing uncovered code; settled global
  coverage remains required at S750.
- `npm run build` passed (with the existing Vite >500 kB chunk advisory).
- `git diff --check` passed.
- Rendered screenshots and machine details with SHA-256 values are in
  `docs/research/uiq06/evidence/S747-measurement-history-pressure.json`.

## Acceptance and protected behavior

The material scanability ambiguity is removed without altering the timestamp
data. The UTC conversion is display-only; time-zone meaning stays explicit.
Raw input, canonical value, source identity, confidence, evidence/validation
status, correction semantics, history persistence, measurement math,
navigation, fit claims, exports and byte-identity baselines are unchanged.
Untrusted strings continue to be escaped. No new dependency or network
behavior was introduced.

## Boundary

Slice 747 is accepted as a small presentation enhancement. The exact landed
commit is available in Git history and is recorded at the next validated
slice-start boundary. UIQ-06 remains In Progress; the sole next action is Slice
748: audit grade-plan exception states at rendered draft/review/approved/stale/
unavailable boundaries, with no grade logic changes. No other Epic is admitted.
