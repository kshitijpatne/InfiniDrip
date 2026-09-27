# Slice 250 — grade-plan decision reconciliation

**Status:** Codex-reviewed implementation decisions.
**Slice:** 250, based on Slice 249 (`717af40`).
**Scope authority:** EPIC-16 admission M03/Slice 250, C03 § “Grading
contract”, and the maintainer decision on custom one-size outputs.

Claude Code completed a read-only adversarial audit of plan validation,
approval lifecycle and ambiguity risks. OpenCode completed a disjoint
read-only trace of existing recipe grade rules, POMs, and selected/whole-run
and cutting consumers. Both returned `WORK FINISHED`; Codex checked the
recommendations against the cited repository contracts and code. Their
findings do not set product scope. The M03-admitted fields resolve the
substantive ambiguities without selecting a chart or grade values.

## Decisions for implementation

- `basisKind` has two values: `population-source` or
  `user-authored-digital-rule`. The first records the named population/source
  and scope. The second records the product decision and declared digital
  range. Neither implies standards conformity or population validity.
- No prefilled XS–XL template, default base label, label, increment, range or
  omitted-field rule is offered. The plan author must resolve every relevant
  body-dimension/control and POM target for each declared size, or declare an
  explicit exception. An absent target cannot silently be treated as constant.
- The record is a separate versioned grade-plan record keyed to its custom
  style. This keeps G02 style records and SaveFile v1–v6 unchanged. Local
  storage adds a plan store. Portable full-project backup adds a new version
  only when it contains a plan; earlier package bytes and digests remain
  unchanged.
- Approval binds to the style identity, locked recipe, immutable design
  revision head, capture revision and a digest of the recipe-consumed base
  measurements, controls and semantic geometry. A base or plan edit makes the
  approval stale; a name-only style rename does not change the design head.
  A duplicate or imported copy gets a new style identity and must be reviewed
  again before approval.
- Review and approval concern the authored rule record only. Slice 250 does
  not claim the projected geometry is valid. Slice 251 validates generated
  sizes, POM targets, exceptions, cutting data and output diffs before any
  graded artifact is enabled. Until then, even an approved plan keeps all
  custom-style graded/whole-run outputs withheld.
- The plan travels in the full project backup. Existing SaveFile v1–v6 remains
  a one-size design format and does not carry the separate grade-plan record.

## Existing code facts and Slice 251 seams

`src/drafting/grading.ts` applies only a linear increment to fields present in
`GradeRule`; omitted inputs remain constant. `src/drafting/recipe.ts` exposes
seven recipe-specific grade rules, fields, options and POM lists. POM values
are measured from drafted geometry in `src/drafting/pom.ts`; they are not
direct grade inputs. S251 must therefore retain separate declared POM targets
and compare them to generated, unrounded POM measurements. It cannot infer
that a rule for a body measurement produces a desired POM change.

The existing app custom-size gate forces step zero and withholds whole-run
Check, Tech Pack, Projector, Marker and frozen output. Those custom gates remain
in place during S250. S251 owns their approved-plan integration.

## Audit risks carried forward

- Never put custom-plan dispatch on the shared legacy `gradeRun` or
  `draftAtSize` path without a custom-style gate; preserve every legacy byte
  identity.
- Include the locked recipe options and semantic edit source in the base
  digest; otherwise a stale plan could look current after the base changes.
- Keep plan-record approval distinct from per-size geometry/output readiness.
- Preserve source and approval history without carrying approval to a remapped
  style identity on project-copy import.
- S249's Woven, Skirt and Trouser mapping limitations remain residuals, not
  physically validated relationships.
