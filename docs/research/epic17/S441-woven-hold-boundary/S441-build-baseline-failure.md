# S441 diagnostic build failure baseline

`npm run build` failed in the isolated candidate worktree with TypeScript errors. The diagnostic production source was then restored to the exact S440 source and the same command reproduced the same diagnostics, so the failure predates the S441 view-only trial.

Observed diagnostics:

- `src/render/technical-flat-live.test.ts:200`: inferred type is missing `sourceEdgeIds`.
- `src/render/technical-flat-live.test.ts:567`: `callout.presentation` may be undefined.
- `src/render/technical-flat-svg.test.ts:171`: optional `presentation.kind` type mismatch.
- `src/render/technical-flat-svg.ts:552–566`: `TechnicalFlatPrimitive` is not narrowed before accessing `markKind`, `at`, `center`, and `radius`.

No source change was made in the primary worktree. Preserve these diagnostics for integrated build triage; do not classify them as caused by the candidate. A successful final `npm run build` is still required at the integrated Epic/PR boundary.
