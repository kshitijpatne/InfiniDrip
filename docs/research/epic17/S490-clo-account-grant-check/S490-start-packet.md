# EPIC-17 / G04 V03 — CLO account grant check — Slice 490 start

## Verified start

- Start: `2026-10-08 09:10:34 UTC`, from clean S489 `1db8db3` on
  `codex/epic-17-g04`.
- Refreshed `origin/main` is `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0`, an
  ancestor. Highest assigned slice is S489; reserve S490.
- Canonical board revision is `3047`; EPIC-17/G04-V03 are In Progress,
  G04-V01/V02 Done. Goal is active and still matches the admitted objective.
- Public CLO terms in S487 do not identify this account's grant. S489's
  source review found no alternative no-cost local receiver. Windows app
  inventory found CLO installed but not running, with no windows.

## Bounded question

Can CLO's already-installed, already-signed-in trial UI display an account or
license grant that affirmatively covers local product-development CAD
evaluation for G04, including the intended local exchange test? This slice
only reads visible product/version/license/trial information. Do not infer
rights from “trial,” elapsed days, available buttons, or feature availability.

## Scope and hard stops

- Launch only the existing CLO installation at its returned app identity.
- Read the displayed version, license/trial class, account-specific grant or
  scope text if shown, and whether the screen cites an applicable agreement.
- Do not click acceptance, login, payment, contact, cloud, or upload actions.
  If new terms, authentication, a privacy prompt, or a permission prompt
  blocks access, stop and close only if safely possible; do not accept it.
- Do not open/create/save a garment project, pattern, fixture, or DXF; do not
  import/export, change settings, or create an account. Save no screenshots or
  files. Browser pages and tabs stay open and untouched.
- If the UI does not provide an affirmative account-specific grant for the
  intended use, Gate 0 remains held. Do not run exchange fixtures. Close CLO
  after this bounded check because it is not needed for other work.
- Preserve all V03 rights/local/exact-profile/round-trip/grading/
  negative-input gates, legacy DXF behavior, protected export identities, and
  the no-physical/factory/production-claim boundary.

## Delegation and exit

No safe independent delegation: this is a private, account-specific local UI
inspection; no account surface or access context is shared with another
agent. Codex owns the read-only check and integration.

Record exactly what the screen shows or fails to show and the close result in
this slice's exit packet and board. Use validated board commands, run focused
Control Center tests, script syntax checks if added, and `git diff --check`.
No production code change means no changed-code coverage or rendered pattern
review; full gates remain for the integrated Epic/PR candidate. Record
implementation, inspection, verification, agent wait, maintainer decision,
and durable-record time separately.
