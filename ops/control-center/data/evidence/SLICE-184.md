# Slice 184 — Control Center v2 schema and command-layer evidence

Date: 2026-09-22

## Accepted scope

- `board.json` remains the sole canonical current-state file and is migrated to
  schema v2 with revision and update time.
- One pure command layer owns item edits, status transitions, comments,
  evidence linking/creation, and the retained evidence-fact import.
- CLI persistence validates the complete input and result, detects stale
  revisions, obtains a short-lived local lock, flushes a same-directory
  temporary file, and atomically replaces the board.
- The v2 workflow is `Backlog → Ready → In Progress → Review → Done`, with
  `Blocked`, maintainer override/reopen/archive, reasons, and completion
  evidence. Roles are workflow guidance, not authentication.
- Legacy v1 status-history labels remain preserved as historical evidence.

## Verification

- `npm run control-center:test`: 16/16 passed. Coverage includes canonical
  validation, role transitions, edits, comments, evidence, reasons,
  evidence-required completion, stale revisions, active locks, invalid saves,
  failed rename cleanup, and preservation of the original board.
- `npm test`: 105/105 files and 1,421/1,421 tests passed.
- `npm run coverage`: 100% statements, branches, functions, and lines.
- `npm run build`: strict TypeScript and Vite production build passed; 105
  modules transformed.
- Protected export-identity tests: 9/9 passed without baseline changes.
- OpenCode returned `WORK FINISHED` from Muse Spark 1.3 xhigh with fast mode
  off. Its accessibility, responsive-layout, literal-search, XSS/path-safety,
  and deterministic browser assertions are retained for Slice 185. Its stale
  v1 transition assumptions were not accepted.
- The Claude read-only audit reached its turn limit without `WORK FINISHED`;
  none of its output was used.

## Boundaries

Slice 184 adds no browser write endpoint, account, authentication, cloud sync,
event store, provider, notification, hosted monitoring, personal-data path,
garment behavior, drafting change, export change, or physical-fit claim.
Browser authoring remains Slice 185.
