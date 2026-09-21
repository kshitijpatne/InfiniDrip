# InfiniDrip agent guidance

Before inspecting or changing implementation code, read `CONTEXT-INDEX.md` and
the documents it marks as required. `PROJECT-STATE.md` is authoritative for the
current repository status and immediate next work; `docs/PROJECT-DECISIONS.md`
is authoritative for maintainer decisions that are not derivable from code.

## Current direction

- Epic 7 Nesting Intelligence is complete, Codex-reviewed and pushed to
  `origin/main` at `db14b63`. Re-check that ref before starting dependent work.
- Slices 149–154 completed the documentation-only garment-expansion research
  wave. Read `docs/planning/GARMENT-EXPANSION-SYNTHESIS.md` plus the relevant
  garment record before scoping any implementation. The wave itself authorizes
  no garment code.
- Epic 11 Polo V2 research and execution scoping is complete in Slice 148.
  Its Epic 7 gate is satisfied; implementation Slices 155–161 are the next
  packet-ready geometry work if scheduled and remain Codex-owned because they
  change garment geometry and shared outputs.
- No InfiniDrip garment has been physically sewn and validated yet. Do not claim
  physical fit until evidence is recorded.
- Every garment aspect should be adjustable where meaningful. Guidance must
  detect invalid combinations and provide actionable corrections; do not hide
  invalid combinations by silently clamping inputs.
- Code signing has not started.

## Durable workflow rules

- Work in numbered slices and keep scope, acceptance criteria, and non-goals
  explicit.
- Preserve 100% test coverage and the export byte-identity regression gate.
- Do not move an export baseline without an explicit, documented reason and
  maintainer approval.
- Verify behavior against actual rendered/drafted output, not tests alone.
- For every new garment, create and maintain an equivalent of
  `docs/research/garments/TANK-RESEARCH.md` before implementation. Distinguish
  sourced construction rules from estimates and product decisions.
- Update `PROJECT-STATE.md`, `ARCHITECTURE.md`, and any affected durable context
  in the same change as the behavior they describe.
- Treat `docs/archive/` as historical evidence, not current instructions.

## External coding-agent delegation

- Claude Code CLI and OpenCode CLI may be used as lower-intensity individual
  contributors only under `docs/OPENCODE-WORKFLOW.md`.
- Codex is the sole project control point: it manages delegation, produces the
  handoff packet, reviews every result, fixes or redirects errors, and decides
  what reaches `main`.
- No MCP wrapper or API-key integration is required for this workflow. Agents
  are invoked as headless CLIs from Codex-controlled terminal sessions.
- Codex must classify the work, preserve the full verification gate, inspect the
  actual diff and rendered/output evidence, and report progress and decisions
  to the product owner.
