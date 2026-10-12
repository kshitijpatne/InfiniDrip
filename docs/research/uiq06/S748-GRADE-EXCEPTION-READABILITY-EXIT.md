# Slice 748 — grade exception readability exit

## Decision and findings

The grade-plan editor and Check output already preserve exception reasons and
approval/readiness gates, but the size matrix had no visible indication that
more size columns continued horizontally. Its overflow container also could not
be reached by keyboard. In Check output, a long exception reason could expand
the final table column and split “Generated” and “Difference” mid-word even at
desktop width. Repeated exception textareas also all had the same “Reason”
label.

Slice 748 makes only presentation/accessibility changes to the existing tables:

- Adds a brief sideways-scroll hint where it is needed.
- Makes the three grade-plan/graded-output overflow regions named, focusable
  regions with visible keyboard focus. Arrow-key browser replay reached the
  hidden size/result columns.
- Adds the size to the exception input label (“Reason for L”).
- Gives the Check POM reconciliation a stable column layout so numeric
  comparison headings remain readable and a long exception stays in its own
  result column.

No grade calculations, base/size values, exception reasons, POMs, status
transitions, approval semantics, readiness gates or export rules changed.

## State and viewport pressure

- Grade-plan panel was rendered with synthetic, in-memory-only data at
  1280×900 and 320×900. The 320px document remains 320px wide. The table's
  248px viewport exposes its 560px full width via an explicit hint and keyboard
  scrolling; 32 ArrowRight presses moved 81px. The L exception reason remained
  intact and its accessible input label was “Reason for L”. At desktop the
  fixed-width inspector still requires horizontal scrolling (304/560px), so
  the hint is correctly present there too.
- Check/graded-size output rendered a numeric POM mismatch and a long
  not-applicable reason. At 320px its table scrolls within the 280px viewport
  (560px table); the document itself does not overflow (320/320px), the
  narrow-screen hint is visible, and keyboard navigation reached the far
  columns (278px). At 1280px the output table fits (1060/1060px); the numeric
  headings remain single-line and the exception text wraps in its result cell.
- Draft, reviewed, approved, stale and unavailable grade-plan states were
  pressure-rendered. Draft keeps Review enabled only for a complete draft;
  Reviewed enables Approve; Approved has no approval action; Stale disables
  Review/Approve and enables Refresh; unavailable storage is clearly reported
  and does not invent a plan. Existing tests preserve the same gates.
- Browser runs had no runtime errors or off-origin requests. All content was
  synthetic; no personal or persistent project data was used.

## Verification

- `grade-plan-panel.test.ts`: 6/6; `grade-plan-run-panel.test.ts`: 7/7.
- Four filtered app grade-plan lifecycle tests passed (creation/prerequisite,
  forced review, stale load, and source verification); unrelated app tests were
  skipped by name filter.
- V8 coverage was 100% statement/branch/function/line for
  `grade-plan-panel.ts` and separately 100% for `grade-plan-run-panel.ts`.
- `npm run build` passed; Vite retains the existing advisory for bundles over
  500 kB.
- `git diff --check` passed. No export baseline or behavior changed.
- Responsive rendered screenshots and machine measurements with SHA-256 are
  in `docs/research/uiq06/evidence/S748-grade-exception-pressure.json`.

## Boundary

Slice 748 is accepted as a targeted readability/accessibility enhancement.
Canonical UIQ-06 remains In Progress. S749 is the sole next action: audit
local project/recovery/import/export messages and frozen-output scope at
saved/unsaved/stale/conflict/recovery/import-failure states. Preserve storage,
identity, privacy, file formats, confirmations, cancellation and byte-identity
baselines. S750 and S751 remain the settled release gate and post-merge
deployment/closeout; no UIQ-07 or other Epic is admitted.
