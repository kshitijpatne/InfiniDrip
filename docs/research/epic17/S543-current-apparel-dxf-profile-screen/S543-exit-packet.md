# EPIC-17 / G04 V03 — current apparel interchange profile screen — Slice 543 exit

## Result

Primary-source screening did not identify a current, publicly documented
successor profile that clears the V03 gates:

- **ASTM D6673-04** is an official historical listing whose public scope
  describes 2D sewn pattern pieces and grade-rule-table exchange. It explicitly
  requires AutoCAD Version 13 DXF for pattern data and a separate formatted
  ASCII grade-rule file. It is not intended to represent relationships among
  pattern pieces or 2D/3D sewn geometry. The page is marked historical and last
  updated in 2010; it references ANSI/AAMA-292A, but that reference does not
  establish current status for AAMA-292A.
- **ASTM D6673-10** appears in ASTM's current Textile Standards list as
  withdrawn in 2019. That current list does not name a replacement. This is
  not evidence that no other private or national profile exists.
- **ANSI/AAMA-292A** is explicitly referenced by ASTM D6673-04. Searches of
  official ANSI/AAMA/AAFA catalog surfaces did not locate its own current
  listing, successor, or accessible full normative text. Status and edition
  remain unresolved; do not declare it withdrawn or active from this search.
- The examined current ISO STEP application modules are too generic to serve
  as an apparel pattern interchange profile: ISO/TS 10303-1404 covers a 2D/3D
  geometric-model relationship, and ISO/TS 10303-1735 covers predefined 2D
  datum symbols. Neither official scope identifies apparel pattern pieces,
  grading, or garment construction semantics.

**Strategic next test:** the plausible documented legacy route is the
DXF-AAMA mode (historically associated with AAMA-292/AAMA-292A, and already
tested on Fitted, Tank, Skirt, and Trouser in S523). S544 should export and
re-import the remaining Tee, Polo, and Woven fixtures in the same DXF-AAMA
mode. This is a profile-specific, all-seven-completion trial, not a claim that
the mode conforms to the unresolved AAMA edition. It can quickly reveal
whether the current concrete geometry/semantic failures are specific to the
ASTM-labeled path. Preserve every existing numeric, semantic, grading,
negative-input, and render gate; do not report V03 passing unless both the
profile identity and all-seven evidence qualify.

## Primary-source findings

- ASTM D6673-04 official record:
  https://store.astm.org/d6673-04.html
  Its public scope establishes two-dimensional sewn pattern-piece and grade
  rule table exchange, the AutoCAD Version 13 DXF requirement, and stated
  limitations. Page status is historical, last updated December 31, 2010.
- ASTM official Textile Standards list:
  https://store.astm.org/products-services/standards-and-publications/standards/textile-standards.html
  Lists D6673-10 as withdrawn in 2019. The list does not identify a successor.
- ISO/TS 10303-1404:2018 official record:
  https://www.iso.org/standard/76193.html
  Current as confirmed in 2026; its scope is a 2D/3D geometric-model
  relationship module, not an apparel-pattern interchange profile.
- ISO/TS 10303-1735:2018 official record:
  https://www.iso.org/standard/76278.html
  Current as confirmed in 2026; its scope is predefined 2D datum symbols,
  not apparel-pattern or grading exchange.
- Search limitation: no authoritative AAMA/ANSI/AAFA catalog record for
  ANSI/AAMA-292A was found in this bounded search. ASTM's reference to it
  establishes the name and relationship only; the status and full normative
  clauses remain unknown.

## Gate disposition

- **Newly established:** D6673-04 is relevant to 2D pieces and grades but is
  historical and requires R13 DXF; D6673-10 is withdrawn. No primary-source
  current replacement was found in this check. AAMA-292A remains a plausible
  legacy profile with unresolved current status and normative detail.
- **Still held:** exact profile identity/edition; receiver and product-use
  profile rights; CUT/SEW/mark semantics; five known Polo CUT contour misses;
  all-seven same-profile round-trip; grade/options; malformed-input handling;
  independent rendered receiver acceptance.
- **Unchanged:** G04 acceptance, all-seven recipe requirement, V02 Done, V03
  In Progress, all thresholds, legacy DXF behavior, and protected export
  byte identities. No spend, vendor contact, app operation, or data exchange.

## Verification and closeout

- All citations point to standards-owner primary records; search gaps are
  explicitly bounded and not treated as proof of absence.
- Start board replay: `3283→3285`; validated exit replay: `3285→3287`;
  `npm run control-center:test` passed 42/42 after replay. No code changed; changed-code
  coverage and the global full gate are not due.
- Started `2026-10-08 22:06:46 UTC` and reached verified closeout at
  `2026-10-08 22:08:47 UTC` (about 2m01s): primary-source search and profile
  comparison `1m17s`; focused verification, board and durable closeout `0m44s`;
  external-agent waits `0m`; maintainer-decision time `0m`. Start state was
  clean S542 commit
  `78c4718d657de3ae20a7e1fd17006cd4eae1b62f`; refreshed `origin/main`
  `a5af5e13c2e967946b3f6035fcea66ff03a5e0e0` remained an ancestor. Highest
  slice was 542; S543 is unique. Capture final elapsed time split among source
  review, focused verification/closeout, external-agent waits, and maintainer
  decisions before commit.

**Next:** S544's bounded, same-profile DXF-AAMA import/export for Tee, Polo,
and Woven, with outputs only under `C:\\G04-CLO-DXF-Exchange`. First inspect
the current CLO state, then save/render/parse the files. Do not change the
acceptance or claim profile conformance from a menu label.
