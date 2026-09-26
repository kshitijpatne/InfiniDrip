# EPIC-15/G02 — F01 project and style workflow (Slice 233)

**Result:** implemented and verified; F01 remains In Progress until Slice 234's portable package and the F01 exit review.

## Scope delivered

The browser and Electron application now open the local project repository before mounting the design workspace. First-run startup creates one local project and an initial style. When a legacy SaveFile or recovery record is present and no project exists, the existing strict migration path converts it before the UI mounts and leaves the source localStorage strings intact. If storage cannot be opened or migration fails, the app displays a retryable startup error and does not mount editable controls over replacement defaults.

The **Project & styles** panel is a user-controlled local workflow. It supports:

- Create a blank style using the current garment's default recipe preset.
- Duplicate the current valid design into a separately named style.
- Rename the active user style without changing its recipe preset.
- Switch between available styles, reload the current project, archive a non-active style, and restore an archived style.
- See action progress and conflict/storage errors; while an operation is running, the editor is made inert so another style action cannot overlap it.

The app's existing Save and Load controls now use the active project's style record. Successful Save atomically updates the style and clears that style's recovery record, then writes a compatibility SaveFile to the legacy key. If only that legacy projection fails, the canonical project save remains successful and the UI says the older single-style copy is unavailable. Load applies the active saved design and clears its recovery through the same revision-checked repository workflow.

## Record and migration behavior

Style record schema v2 adds `archivedAt`. IndexedDB database schema v2 upgrades schema-v1 style rows inside the versionchange transaction. The cursor accepts only the exact v1 field set and schema marker, then adds `archivedAt: null`; an unexpected row aborts the database upgrade rather than being guessed at or partially repaired. Existing project, style, active-selection, migration-marker, and legacy SaveFile IDs retain their meaning.

Recovery remains keyed by stable style ID and retains raw measurement, option, nesting, artwork-reference, workspace, and unfinished value state. Save and clear use project-revision compare-and-swap. Concurrent stale tabs receive an explicit conflict instead of overwriting another tab's recovery or active project. The app ignores a delayed recovery completion/error once the user has switched to a different style, so an old callback cannot overwrite the new style's status.

The UI keeps user style identity, recipe identity, and recipe preset identity separate. Archived styles remain in the project record and can be restored. Project/style metadata and garment data remain local; artwork bytes continue to live in their existing browser/Electron asset stores. Portable project export/import, including artwork byte packaging and atomic clean-profile restore, remains Slice 234.

## Verification evidence

The repository-wide `npm run coverage` gate passed **1,615 tests** with **100% statements, branches, functions, and lines**. This includes eight unchanged legacy export identity checks. `npm run build` passed, and `npm run control-center:test` passed 33/33.

`npm run electron:verify-project-workflow` passed against actual rendered application pages in both a persistent headless Chromium profile (HeadlessChrome 151.0.7922.34) and Electron 44.1.0 / Chromium 152.0.7977.65. Each runtime used a disposable profile and proved this sequence: edit a measurement and persist style recovery; create a second style; restart the runtime; retain both styles and the active selection; return to the original style and recover the unfinished value; explicitly save it; restart again; retain the selected style and saved 104 cm chest value in both IndexedDB and the rendered input; and confirm that the obsolete recovery was removed. The app-file path change and legacy migration durability remain covered by Slice 232's separate Electron/web proof.

The project-app tests also cover migration-time recovery prompt behavior, save/load/duplicate/archive/restore UI integration, invalid duplicate rejection, save and recovery failure messaging, legacy compatibility-projection failure, and delayed errors arriving after a style switch. Project-manager tests cover accessible status messaging for recovery present/absent, unavailable names, and both stale and current operation states.

## Boundaries and remaining F01 gates

This slice does not export or import a portable package. It does not make browser storage permanent or prove behavior after quota exhaustion, browser eviction, abrupt power loss, or arbitrary cross-browser profile migration. Those failure and package cases remain in Slice 234. The workflow does not validate physical garment fit, edit pattern geometry, add source provenance, or make a production-readiness claim. It adds no recipe, user-facing AI designer, hosted service, supplier contact, purchase, or physical sample.

F01 stays In Progress. Slice 234 must still verify a versioned backup that carries referenced artwork bytes, IDs, attribution, and hashes; validate the entire package before an atomic import; and reject malformed, colliding, missing-asset, canceled, interrupted, and quota-failed imports without partial writes. F02 remains queued until F01 exits.
