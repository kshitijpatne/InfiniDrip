# Slice 185 — Control Center v2 local-authoring evidence

Date: 2026-09-22

## Accepted scope

- A dependency-free Node service binds only to `127.0.0.1` and exposes the
  validated canonical board, shared command executor, allowlisted dashboard
  assets, and path-safe referenced evidence.
- The local browser edits item details, applies role-guided transitions, adds
  notes, creates or links evidence, and shows dependencies, evidence, and
  transition history.
- Literal search and status, owner, priority, and type filters can be combined.
  Clean, unsaved, saving, saved, stale, and error states are explicit.
- `board.json` remains the sole canonical state. Browser and CLI mutations use
  the same revision-checked, schema-validated, atomic command path.

## Verification

- `npm run control-center:test`: 21/21 passed, including real temporary-board
  API persistence, stale conflict, malformed command, allowlisted static files,
  referenced evidence, literal search/filter, escaping, lock, and atomic-save
  failure coverage.
- Live in-app browser verification loaded the real localhost service without
  console warnings/errors, narrowed `SLICE-184` search to one card, exposed
  editable details and evidence creation, showed unsaved-change state, and had
  no horizontal overflow at a 375 px content viewport.
- `npm test`: 105/105 files and 1,421/1,421 tests passed.
- `npm run coverage`: 100% statements, branches, functions, and lines.
- `npm run build`: strict TypeScript and Vite production build passed; 105
  modules transformed.
- Protected export gates: 8/8 legacy regression and 9/9 empty-placement
  identity tests passed without baseline changes.

## Boundaries

No account, authentication, profile, cloud sync, remote service, event store,
notification, hosted monitor, personal-data path, provider account, paid
service, garment behavior, drafting behavior, export behavior, or physical-fit
claim was added. Slice 186 owns the final v2 pressure/reload exit.
