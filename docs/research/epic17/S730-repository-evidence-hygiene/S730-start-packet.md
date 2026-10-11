# EPIC-17 / G04 — S730 repository evidence hygiene

## Verified start

- Started: 2026-10-11 10:27 UTC.
- Branch: `codex/epic-17-g04`.
- Starting commit: `0fcf2d0cbd441f6511618668596db5165c8c6319` (S729 candidate review).
- Refreshed `origin/main`: `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`; it remains an ancestor.
- Highest assigned slice: S729; reserve S730. Control Center board revision: 4273.
- EPIC-17/G04 and the goal are In Progress. S728's integrated code/output gates and S729's validated board review pass; V03 criteria remain unchanged.

## Why this slice exists

The first final-diff inventory found 10,715 paths added since `origin/main`,
including 2,856 PNGs, 2,511 SVGs, 2,880 JSON reports/fixtures, 50 logs, and
1,328 research JavaScript files under `docs/research/epic17/`. These are
historical research/render/test artifacts accumulated across prior slices;
the product does not need every generated trial output in the cloneable
application repository. Do not submit that inventory unchanged.

## Bounded cleanup

1. Copy and hash-index only generated or diagnostic artifacts that have no
   reference from the canonical board, repository text/code, the package test
   commands, or an explicit test fixture dependency. Preserve their relative
   paths on C: under the named S730 archive directory.
2. Keep every repository-referenced board evidence URI, textual evidence link,
   durable Markdown packet, production/source/test file, explicit Node test and
   its fixture, accepted DXF fixture, project context/decision record, and
   current board. No evidence the repository currently claims as directly
   linked may be silently removed.
3. Remove only after the C: copy's byte count and SHA-256 match. Record exact
   candidate and removed counts by file type, archive location, manifest hash,
   and any residual large material. Do not rewrite earlier slice commits.
4. Run the changed evidence-test consumers and the final integrated 100%
   coverage gate on the cleaned tree. Preserve the original S728 full-gate
   report and any new cleanup-gate result.
5. Rebuild only if the final integrated gate requires it, then review the
   actual post-cleanup PR diff. Push/PR/merge only when the final tree no longer
   contains unexplained output artifacts. The S729 candidate packet remains a
   pre-cleanup inventory snapshot; this S730 packet supersedes its inventory
   conclusion with the verified cleanup report.

## Fixed scope and exit

No changes to V01/V02/V03 acceptance, receiver claims, standards language,
geometry thresholds, recipe/options/grades, pattern or stitch geometry, product
source behavior, legacy DXF bytes, protected export identities, or deployment
requirements. No software installation, purchase, receiver trial, new recipe,
physical sample, supplier contact, hosted service, or UI redesign.

Exit only when the cleanup manifest is hash-verified, tests still pass, the
full integrated gate passes on the cleaned candidate, and the actual PR diff
has been reviewed for scope and residual generated files. Continue the goal
through merge, refreshed ancestry, required deployment, production E2E, and
canonical Epic/goal closeout.
