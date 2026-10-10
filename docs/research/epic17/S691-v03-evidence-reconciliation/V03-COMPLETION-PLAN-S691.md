# G04 V03 shortest evidence-led completion path — S691

Older 3–6, 5–10 and 9–14 slice estimates assumed an eligible passing receiver;
they are stale after the measured CLO/DGS/OpenCAD failures and partial S690
LibreCAD result. No finite remaining estimate is supportable until the
receiver-eligibility gate is satisfied.

## Route decision

**Stop receiver experiments for now.** The only current positive receiver
result is LibreCAD 2.2.1.5 DXF 2000 on one simple Polo M fixture. S674 records
LibreCAD as generic 2D CAD; it is not an apparel/industrial receiver under
C04's accepted target boundary. Testing its identity sidecar would add generic
exchange evidence without clearing that required profile gate. Do not run the
draft S681 identity-rich LibreCAD pilot.

The source package profiles are also different: S681 emits schema
`infinidrip.g04.dxf-package/2` labeled
`generic-dxf-centimeters-with-recipe-marks`; the separate `idr-pattern-exchange/2`
grainline/XDATA candidate was tested through DGS and failed in S668. Neither is
a receiver qualification. S681 manifests bind the exact drawing hash and
entity positions. A future candidate must specify, before import, how a
version-matched sidecar is verifiably associated with the receiver's rewritten
output and rejects mismatches; it must never use the sidecar to reconstruct
lost receiver geometry or marks.

## Ranked work, gates, and stops

### 0. Receiver eligibility — prerequisite to every further fixture

Require an exact app/vendor, version, local workflow, permitted-use basis, and
documented profile/input contract that meets the admitted apparel/industrial
CAD exchange requirement. Existing candidate evidence is complete enough to
exclude the tested paths: CLO and DGS are apparel-capable but the tested
profiles fail measured fixed gates; LibreCAD and OpenCAD provide generic-CAD
evidence and are not eligible under C04.

**Decisive verification:** first-party documentation and rights evidence for
one named, available, local apparel/industrial receiver; its documented input
and sidecar contract matches the current package, or defines a source-exact
additive profile without changing legacy bytes.

**Stop:** if no such candidate is available, run no more app/format/encoding
tests. Record the evidence-based no-go permitted by the roadmap. The smallest
re-entry dependency is access/evidence for that exact receiver/profile. The
other possible path is an explicit maintainer change to admit generic CAD, but
that is a scope change and is not made here; all current approvals to preserve
V03 acceptance remain in force.

### 1. One representative import, only after Gate 0 passes

Use a current hash-pinned S681 Polo M package with its manifest/sidecar under
the named C: folder. Before opening it, define the entity-to-piece and
version-matched returned-artifact association. Record exact app/version/mode,
unit interpretation, all messages, and whether each piece remains separately
selectable. Compare units, scale, orientation, each CUT/SEW contour and
closure, visible typed marks/layers, piece/revision/grade identity, seam
relations, and rendered whole/detail output. Preserve the source fixture and
original sidecar unchanged.

**Decisive verification:** one clean receiver import has no lost-feature or
validity warning, every expected piece is independently selectable, all
measurable entities pass `0.001 cm`, the returned artifact is correctly bound
to its sidecar, and actual output is readable. Informational notices may pass
only when precisely documented and shown not to affect an acceptance gate.

**Stop:** any mismatch, partial import, ambiguous sidecar binding, loss warning,
or unreadable result retires the exact route; do not retry alternate settings
or encodings.

### 2. Export, reopen, malformed-input, and repeatability gates

Only after the same eligible receiver passes the representative import, export
once, parse, and reimport that exact output. Then apply the existing malformed
and unsupported fixtures and two frozen-revision generations through that
same version/profile. Compare output semantics to the original package and
between generations. No evidence may be borrowed from a different app.

**Decisive verification:** exact same-route export/reopen retains geometry,
identity, marks, units and sidecar association; every negative fixture fails
closed with no partial drawing or silent repair/clamping; two generations
remain semantically equivalent.

**Stop:** any lost geometry/semantics, accepted malformed input, broken sidecar
binding, or repeat mismatch retires that route.

### 3. Seven recipes, 73 supported options and grades

Only after groups 0–2 pass, replay the existing S330/S680/S681 fixtures once
through the exact same profile. Verify piece/entity counts, bounds, units,
orientation, marks, identity, grades and relations for all supported rows.
Review actual receiver whole/detail outputs for readability. Source-only
renders and other apps' matrices do not substitute.

**Decisive verification:** every supported recipe/option/grade row meets all
fixed criteria in one receiver profile and every required output is readable.

**Stop:** one failing row keeps V03 held; do not narrow the matrix or fix
receiver output from source.

### 4. Final integrated candidate and merge

After no product changes remain, run the single full repository 100% coverage,
build, browser/Electron and integrated output gate; recheck all protected export
identities; inspect final outputs and MQF-004–007, MQF-011, MQF-012 and MQF-015
at applicable exits. At the PR boundary, curate repository changes to
necessary project files and keep raw CAD, captures, machine reports, disposable
helpers, and board-command inputs outside Git. Do not broadly clean or rewrite
history during V03 work.

**Decisive verification:** the integrated gates pass, Codex reviews the exact
PR diff/evidence, merge succeeds, refreshed `origin/main` contains the merge,
and any required GitHub Actions deployment succeeds with the configured site
responding successfully.

**Stop:** any failed criterion, protected identity change, unneeded generated
artifact in the PR, missing ancestry, or failed required deployment blocks
closure.

### PR hygiene inventory to refresh at the boundary (no cleanup now)

The last known separate `F:\designApp` workspace is branch
`codex/uiq-parallel-candidates`, not the active EPIC-17 worktree. Its last
inventory showed tracked dirty changes and about 2,708 untracked files / 216 MB,
including `tmp` (676 files), coverage outputs, research/ops/src paths and a
nested worktree. Do not touch or push it; refresh its state only when preparing
the final PR.

The active EPIC-17 branch has hundreds of slice commits and tracked research /
render evidence; the last known inventory was about 10,398 files under
`docs/research/epic17` and roughly 581 MB in the worktree, including raw render
artifacts. At the final PR boundary, inventory the actual diff, keep files
needed to run the product and the minimum canonical project/evidence records,
and move disposable/raw CAD outputs, captures, machine reports, and temporary
command inputs out of the repo without rewriting historical commits. Preserve
the board's usable evidence links; resolve any link before excluding a linked
document. This is a recorded future task only, not an instruction to clean
either workspace during S691.

## Current stopping point

S691 resolves the current question: there is no already-tested, eligible
apparel/industrial receiver profile in the available local set. No source
serialization defect is supported by the evidence, so there is no product-code
fix to implement that would clear this route prerequisite. Keep G04-V03 and
EPIC-17 open, acceptance unchanged, and do not run another generic CAD identity
trial. Re-enter receiver work only when the exact eligible profile evidence is
available; then begin at Gate 0 and run one source-matched import before any
export or matrix work.
