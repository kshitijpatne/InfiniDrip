# S486 — Codex review of independent OpenCode scan

## Handoff and completion

- OpenCode ran in a separate managed worktree at
  `C:\Users\kshit\.codex\worktrees\s486-opencode-candidate-research\designApp`,
  detached at S485 `f3813a3`; the main worktree was not shared for its edits.
- Runtime was OpenCode 1.18.30 with the required
  `opencode/muse-spark-1.3-contributor-free`, `--variant xhigh`, normal mode
  (no fast flag). CLI accepted the model/variant and started the scan.
- The contributor reported exactly one authorized file and sent the explicit
  `WORK FINISHED` signal. The actual agent-worktree status contained only the
  new `opencode-findings.md`; it made no commit or other edit.
- Codex read the whole report and independently opened the cited publisher or
  project sources. The report is copied to
  `S486-opencode-findings.md`; the formal receiver comparison remains bounded
  to the three actual apparel-CAD receiver candidates in
  `S486-codex-candidate-matrix.md`.

## Claim review

- **Cameo v8:** The publisher page identifies an apparel pattern system,
  prices Pattern Design and Grading at US$950 each, and lists standard
  AutoCAD DXF output. Its import/export page says patterns, graded nests, and
  markers import/export in standard AutoCAD DXF and explicitly says that
  compatibility with other publishers must be checked with those
  manufacturers. No AAMA/ASTM profile or Windows 11/local-only processing
  statement was found on those pages. This independently supports the matrix's
  rejection; it does not qualify Cameo.
- **FreeSewing:** Its own editor documentation says it is an online pattern
  drafting environment that exports PDF or SVG. The account-pattern page
  clarifies that FreeSewing stores settings and measurements, not the pattern
  itself; it regenerates the pattern and recommends downloading a PDF/SVG
  copy. The copied report was corrected to reflect that distinction. It is
  not a DXF receiver candidate.
- **GarmentCode:** Its project identifies itself as a parametric sewing
  pattern programming framework; the installation document describes Python
  package/local setup, and the reviewed primary project materials document no
  apparel-DXF receiver/profile. Its MIT project license is not a commercial
  receiver-rights grant. Treat it as an upstream research/generation
  reference, not a candidate CAD receiver.
- **Unverified search-index `openclo` result:** The report correctly excludes
  it. The cited repository path was unavailable, so its compatibility claim
  remains unverified and is not used.

The OpenCode report provides a useful independent screen, not observed
software behavior. No program was downloaded, installed, or run; no fixture,
account, or hosted CAD service was used. All G04 acceptance gates remain
unchanged.
