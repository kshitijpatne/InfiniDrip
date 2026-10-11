# EPIC-17 / G04 V03 — S706 current package LibreCAD R2000 pilot

## Verified start

- Start time: 2026-10-11 00:48 UTC.
- Branch: `codex/epic-17-g04`; starting commit `d0dfa6da306766d05bce6333c8d1fb5f7602d742` (S705).
- Refreshed `origin/main=a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` is an ancestor.
- Highest assigned slice is S705; reserve S706 only.
- Canonical board revision: 4151. EPIC-17 In Progress; G04-V03 Blocked; G04-V01/V02 Done. Goal remains active.
- Known untracked cleanup inventory remains the two S700 coverage diagnostics; do not remove them during this slice.
- Exact input is `C:\G04-CAD-Interchange\S705-candidate-buttonhole-cross\polo-m-buttonhole-cross.dxf`, SHA-256 `28D28E48BFF0C2B1638684D93C7BA58754AF202EF7494495F3A99C813AE1DD6C`.

## Scope and reason for this one pilot

Run the current S705 candidate exactly once through the already installed LibreCAD 2.2.1.5 DXF 2000/R2000 save route, then reopen that saved output in the same application. S674 tested R12 and found that route removes the centimeter unit declaration. R2000 is the already-existing measured route that preserves the unit declaration on the prior fixture; this pilot checks the changed S705 point-mark encoding (two source-centered buttonhole strokes) in the current candidate. This is a single already-authorized check, not an app search or a broad setting sweep.

Save the output and evidence only under `C:\G04-CAD-Interchange\S706-librecad-r2000-current-package\`. Keep LibreCAD running for the current work session. No source geometry or acceptance changes are in scope.

## Fixed pass/stop criteria

- Compare all input/output CUT and SEW contours symmetrically against the existing `0.001 cm` threshold; preserve closure, bulges, and piece relationships.
- Verify `$INSUNITS=5`, expected layers/identities, all typed marks including each buttonhole cross and its source anchor, and correct size/coordinates.
- Reopen the saved output and inspect actual rendered whole and mark-detail views for missing, crossing, overlapped, or unreadable geometry/marks. Preserve captures in the C: folder.
- Stop this route on the first measured fixed-gate failure; do not switch software, format, or profile in S706. Do not promote any gate from source-only evidence.
- Even a passing single Polo M does not establish rights-cleared industrial apparel-profile qualification, repeatability, malformed-input rejection, all-seven recipes, 73 options/grades, or the full V03 claim. All remain pending until their own decisive evidence exists.

## Non-goals and protected behavior

No additional application install or candidate search; no GMS/DGS retry; no second format/profile permutation; no acceptance or threshold changes; no legacy DXF/default writer or protected export identity changes; no physical-fit, factory-acceptance, conformance, or production-readiness claim; no cleanup deletion. Final repository cleanup remains at the PR candidate boundary.

## Verification and timing ledger

- Production-code changes: none planned; focused code tests/coverage are not applicable unless a concrete source defect is demonstrated and separately scoped.
- Required slice closeout: actual receiver and independently parsed output evidence, `npm run control-center:test`, `git diff --check`, validated board update, `PROJECT-STATE.md` and packet update, unique commit `Slice 706: ...`.
- Implementation/receiver interaction: pending. Focused verification/analysis: pending. External-agent waits: 0m. Maintainer-decision time: 0m.
