# Control Center v2 — local authoring execution packet

Status: **COMPLETE; SLICES 184–186 ACCEPTED**

Owner: **Codex**. Claude Code and OpenCode may perform bounded read-only audits
or isolated UI polish under `docs/OPENCODE-WORKFLOW.md`; Codex owns the shared
schema, mutation contract, persistence, review, gates and integration.

## Objective

Turn the repository-local delivery board into a genuinely usable local tool.
The browser and CLI may edit the same canonical `ops/control-center/data/board.json`,
but neither may write JSON directly. Both must call one validated command layer.
Every successful command validates the complete result and replaces the board
with a same-directory temporary-file rename.

This work remains inside the no-cost boundary. It adds no account,
authentication, cloud sync, remote service, notification, hosted monitor,
provider integration or personal-data path.

## Binding product decisions

- `board.json` is the sole canonical current-state file.
- Commands, not direct object/file writes, are the mutation interface. The v2
  command set is `editItem`, `updateStatus`, `addEvidence`, `addComment`, plus
  the retained evidence-fact importer routed through the same layer. Slice 211
  extends this layer with maintainer-only epic creation, ordered work-item
  linking, epic evidence, and guarded closure; see `ops/control-center/README.md`.
- The current workflow is `Backlog → Ready → In Progress → Review → Done`.
  `Blocked` can be entered from any unfinished state. `Archived` is a
  maintainer-only terminal/administrative state.
- Contributor/reviewer/maintainer roles are workflow guidance. They are not
  identity or authorization controls because the local board has no login.
- Contributors may claim ready work, submit it for review, and unblock it.
  Reviewers may complete reviewed work or return it to progress. Maintainers
  may override, reopen, archive and change workflow policy.
- Every status transition records actor, selected role, time and reason.
  Completion requires at least one linked non-incomplete evidence record.
- A board revision prevents stale browser or CLI saves from silently replacing
  newer local work. This is optimistic local concurrency, not event sourcing.
- Existing v1 status-history labels remain as historical evidence. Current
  item state uses the v2 status names; the board does not invent replacement
  dates or actors for old entries.

## Slice 184 — schema and shared command layer

Scope:

- Migrate the canonical board to schema v2 with revision and updated time.
- Add complete runtime validation matching the versioned JSON schema.
- Add pure command application for edits, transitions, comments and evidence.
- Add stale-revision detection, a short-lived cross-process lock, complete
  pre-save validation and atomic same-directory replacement.
- Route CLI mutations and the existing evidence importer through this layer.

Acceptance:

- Invalid input or result never reaches `board.json`.
- Failed rename leaves the original file byte-for-byte intact and cleans the
  temporary file.
- Concurrent/stale commands fail visibly rather than silently overwriting.
- Transition-role guidance, reasons and completion evidence are covered by
  focused deterministic tests.
- Legacy history remains readable and canonical v2 data validates.

Non-goals: no browser editing yet, no event log, no create-item workflow, no
remote service, no application drafting change.

## Slice 185 — local authoring service and usable dashboard

Scope:

- Replace the static-only launch path with a localhost-only Node service that
  serves the dashboard and exposes the shared command layer.
- Add item selection and editable detail fields, status controls, notes,
  dependencies, evidence creation/linking and transition history.
- Add search across ID/title/body text and filters for status, owner, priority
  and type.
- Show explicit clean, unsaved, saving, saved, stale and error states.
- Keep evidence navigation repository-local and path-safe.

Acceptance:

- UI saves are command requests with an expected board revision.
- A failed or stale save retains the unsaved form and gives a corrective error.
- Refresh/reload displays persisted changes from `board.json`.
- Keyboard, focus, labels, responsive layout and malformed-board behavior are
  covered by focused and live-browser evidence.

Non-goals: no remote collaboration, account, permission enforcement, item
automation, notifications or hosted deployment.

## Slice 186 — v2 exit and durable verification

Scope:

- Pressure-test command/API/UI failure paths and reload persistence.
- Verify desktop and narrow viewports against the real local service.
- Run Control Center tests plus the full application coverage, typecheck,
  production build and protected export-identity gates.
- Synchronize the board, architecture, project state, context index, decisions
  and operating instructions with verified behavior.

Acceptance:

- The complete minimum v2 scope is usable locally and durable after reload.
- All existing project gates pass with 100% coverage and unchanged protected
  export baselines.
- The exit record states the local/no-auth boundary and all deferred features.

## Deferred

- Event sourcing and a separate event store.
- Multi-user permissions, authentication, profiles and role enforcement.
- Cloud sync, remote collaboration, notifications and automation.
- Hosted monitoring or any new provider/account/cost.
- Garment, drafting, grading, nesting or export behavior changes.

## Roadmap position

- **Complete:** Control Center v2, Slices 184–186.
- **Next:** maintainer discussion, then first-load tutorial refinement.
- **Later:** garment/artwork workflow, cross-garment quality matrix, then the
  separately discussed garment queue.
