# Slice 778 exit — T05 immutable local-share freeze

**Status:** Complete at the S778 boundary; G05-T05 remains In Progress.
**Branch/worktree:** `codex/epic-18-g05` at
`C:/Users/kshit/.codex/worktrees/epic-18-g05/designApp`.
**Starting checkpoint:** clean S777 commit
`4178b4fcde0836451ddf8693427749d7ce0c4360`; refreshed
`origin/main=e9221ea5033ccfdd91bf1ebb353926f189477d75` remains an ancestor.
**Board:** S778 start replay advanced revision 4645→4648; exit replay is
recorded in `post-replay-verification.md`.

## Result

S778 implements explicit local approval and freezing for an exact saved Tech
Pack revision. A reviewer selects a non-empty field scope and performs the
review, approval, and freeze actions. The approval binds to the saved revision
ID and content digest. The schema-v3 frozen manifest binds the approved scope,
approval reference, selected sections, and exact ZIP/PDF artifacts using the
C04 digest meanings. The original binary ZIP and PDF bytes are retained,
integrity-checked on read, and exposed as local downloads. Revision-head,
content-digest, and asynchronous preparation races fail closed. Local actor
labels and timestamps are explicitly self-attested and do not prove identity
or authority.

The changes cover `src/ui/tech-pack-sharing.ts`, the revision manifest and
project workflow, manager controls and app integration, and schema-v3 package
binary limits. Existing schema-v1/v2 behavior and the legacy export paths stay
separate. No network, authentication, supplier handoff, garment recipe, or
physical/production claim was added.

## Acceptance and verification

| Gate | Result |
| --- | --- |
| Focused behavior | Pass: six focused suites, 183/183 tests; the two changed app-integration cases also pass 2/2. |
| Changed production modules | Pass: five modules report 100% statement, branch, function, and line coverage across 160/160 focused tests. |
| Changed app range | Pass: lines 5763–5818 have 56/56 statements, 19/19 branch outcomes, 1/1 function, and 56/56 lines. A broad whole-`app.test.ts` coverage attempt was stopped after about eight minutes at roughly 2.6 GB with no report; the exact changed range is the recorded app gate. The settled global gate remains S780. |
| TypeScript and build | Pass: `npx tsc --noEmit`; `npm run build` (`tsc && vite build`, 181 modules). Vite reported its existing large-chunk advisory. |
| Protected legacy exports | Pass: regression and export-identity suites, 17/17; no baseline moved. |
| Synthetic artifact proof | Pass: Tee and Woven Shirt manifests, ZIPs, and PDFs are retained under `evidence/synthetic/`; stored files read back byte-for-byte, repeat generation matches, canonical packet digests match, and PDF pages were rendered and visually checked. Synthetic values are QA fixtures, not garment measurements. Exact hashes and revision bindings are in the per-style reports. |
| Browser and real downloads | Pass: Chromium 151 at 390×844 and 1280×800; keyboard-operated review/approval/freeze, exact revision/scope/artifact visibility, actionable stale guidance, and zero horizontal overflow. Browser messages are empty. The actual local ZIP is 3,744 bytes, SHA-256 `1552ab46c68801f66005f3962baa9a6c6649591f02208affecf4986cc973acb2`; the PDF is 12,092 bytes, SHA-256 `88dc0303c58c9f051c329c355fc50b6e4f81131eeaa8fea2cdc4d6e5e76d8b21`. Screenshots, measurements and download report are in `evidence/`. |
| Control Center and diff hygiene | Validated exit replay and post-replay read-back are recorded in `post-replay-verification.md`; Control Center suite and final `git diff --check` are required there. |
| S780 integrated gate | Not due at S778; global coverage and settled integrated review remain S780. |

The retained browser output is one local synthetic project, titled “Untitled
tee”. Tee and Woven Shirt examples in `evidence/synthetic/` are separately
identified synthetic QA records. Neither is physical fit or supplier,
factory, or production acceptance evidence. Poppler reports missing Symbol
and Arial Unicode display fonts but rendered the retained A4 pages legibly;
the pages were visually inspected.

## Boundary status, risks, and holds

S778 satisfies freeze creation and deterministic manifest/digest acceptance.
It does not close G05-T05: edit-driven invalidation, visible stale/current
state, preservation of prior frozen bytes through edits, historical import
compatibility, and all eight protected legacy identities remain for S779.
G05-T05 and EPIC-18 remain In Progress; G05-EXIT remains Backlog. S780 retains
the settled global/integrated gate; S781 retains merge, main CI/deployment,
board, and Epic closeout. No export baseline moved. No physical sewing, fit,
supplier acceptance, factory acceptance, or production readiness is claimed.

No safe disjoint external contribution existed for this coupled approval,
revision-guard, artifact, persistence, and UI path. External-agent wait and
maintainer-decision wait were both zero.

## Time accounting

Started 2026-10-13 16:27:34 UTC. Evidence review completed at approximately
18:06 UTC, about 1h39m elapsed. Approximate active time: implementation 30m;
focused tests, coverage, typecheck, build and export regression 35m; actual
artifact/render/browser review 24m; checkpoint documentation and replay 10m.
These are rounded estimates; external-agent wait and maintainer-decision wait
were zero. Final board replay and post-replay verification timing is recorded
separately in `post-replay-verification.md`.

## Next action

S779 is the single next admitted action under
`docs/planning/EPIC-18-S765-RESEQUENCING.md`: implement edit-driven dependency
invalidation and visible stale/current status while preserving prior frozen
bytes; prove historical import compatibility and all eight protected export
identities; then close G05-T05 only after its full acceptance packet passes.
The S780 settled integrated gate and S781 merge/deploy/Epic closeout remain
later boundaries.
