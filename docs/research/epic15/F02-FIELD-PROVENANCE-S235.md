# EPIC-15/G02 — F02 field provenance and value history (Slice 235)

**Status:** Slice 235 implemented and verified; F02 remains In Progress until
Slice 236's dependency and invalidation matrix is accepted.

## Outcome

Every editable measurement and garment option in the seven current recipes has
a stable recipe-scoped field definition. The definitions distinguish body
measurements, finished-garment targets, pattern parameters, and style controls;
they state units, reference frame, meaning, the known capture boundary, and
whether the numeric limits come only from the existing UI guardrail. Recipe
options receive stable IDs from their recipe and option key. Automated coverage
checks that each recipe input is mapped once and that no current measurement or
option is silently omitted.

This slice stayed in the Codex integration lane. No safe external coding packet
had disjoint ownership: the field vocabulary, database migration, append-only
repository writes, recovery ordering, package compatibility, and editor
callbacks share one persistence contract and several of the same modules.

Initial field history records why a value entered the project: a built-in
first-run starting value is `PRESET`; a copied value is `INHERITED`; values from
legacy SaveFiles, existing local styles, and package version 1 are `UNRESOLVED`.
These records do not invent a body-measurement capture date. Confidence is
`NOT_ASSESSED` unless a later, evidence-backed workflow establishes otherwise.
The existing vocabulary also reserves explicit supplier, sample, calculation,
image-observation, and conflict states; this slice does not claim those sources
are currently connected to live supplier, sample, or image evidence.

When a user edits a field, the app preserves the exact input string and the
parsed numeric value separately, records whether the current raw value passes
the existing input guardrail, and appends an immutable observation. Invalid or
incomplete values remain visible and are not silently clamped. The history
dialog shows the semantic definition, source wording, raw and canonical values,
evidence status, validation state, and the distinction between edit time and a
body-capture time that the app does not know. Its wording explicitly says that
the record does not establish fit or production validity.

Field history is stored per style in IndexedDB schema version 4 and is carried
through recovery, project/style changes, duplicate/copy workflows, and package
version 2. A version-1 package imports with explicitly unresolved provenance.
Existing project/style records upgraded from earlier database versions receive
unresolved observations without rewriting their design values. The append-only
repository check rejects history replacement or truncation. Package and record
parsers reject mismatched field definitions, units, invalid source states,
noncanonical timestamps, out-of-range revision sequences, and a canonical
number that disagrees with its raw string.

The editor debounces typing, commits on change/focus loss, and flushes pending
history before save/load, recipe switching, and project/style or package
operations. If history persistence fails, the exact input stays visible and the
transition is blocked. The independent recovery write may already have saved
the raw draft; if that write also fails, the app says the latest unsaved edits
may be lost. Existing first-run state may already contain legacy values; the
implementation reports them as unresolved rather than presenting them as
measurements.

## Verification evidence

| Check | Result |
| --- | --- |
| TypeScript | `npx tsc --noEmit` passed. |
| Focused F02 and persistence suite | 10 files, 448 tests passed: field definitions/history, repository, packages and failure cases, workflow, app, project manager, artwork compatibility, and rendered-view markup. All seven changed production modules measured 100% statements, branches, functions, and lines. The project-wide canonical coverage/export gate remains scheduled for G02 final review. |
| Package stress | `project-package.test.ts` passed all 26 cases. Under the coverage-safe fixture profile, the reported 4 MiB archive round trip completed in 883 ms with about 435 MB peak RSS. Larger archive ceilings remain covered by the separately accepted F01 package evidence. |
| Slow-test investigation | One earlier coverage attempt hit the existing 5-second timeout on an unrelated artwork-import test under host load; the same test passed alone in 1.34 seconds and in the final focused run. The successful focused invocation allowed up to 15 seconds per test without changing repository test configuration, assertions, or coverage thresholds. |
| Browser and Electron UI/persistence | `npm run electron:verify-project-workflow` passed in clean disposable profiles. Chromium 151 and Electron 44.1.0 / Chromium 152 each showed chest `104`, user-captured provenance marked `UNCONFIRMED` with no assessed confidence or fit claim, and the matching history record after project/style creation and restart. Recovery remained with its original style; explicit Save committed the value and cleared stale recovery. |
| History-open race | The runtime replay exposed that a click could render the previous history snapshot while a field write was still finishing. The dialog now flushes pending field writes before rendering and remains closed on a failed write. A later successful history write also cannot overwrite a recovery failure status. Dedicated success, failure, and non-Error rejection cases pass. |
| Diff hygiene | `npx tsc --noEmit` and `git diff --check` passed after the final code changes. |

The repository-wide coverage/build/export identity gate is still required at the
G02 final exit and will be rerun after the ordered implementation slices. This
slice does not claim F02 completion, cross-tab merge of edits, measurement
accuracy, fit validation, supplier/sample provenance, factory readiness, or
physical evidence. Slice 236 owns the declarative dependency graph and the
precise stale/current reporting for pattern, POM/spec, grade, nesting, views,
and exports.
