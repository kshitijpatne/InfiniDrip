# EPIC-17 / G04 V03 — Open-source CAD format screen — Slice 512 exit

## Result

Seamly2D is not a viable independent G04 receiver. Its current project has an
active, GPLv3+ Windows release, but its own community forum confirms that the
application does not open DXF files; it exports DXF from a pattern drafted in
Seamly2D. This rules it out for the required import/export round trip without
installing it or creating an exchange fixture.

A recent open project issue separately reports that SVG/DXF export merges
vertices and edges into one continuous path, losing boundary metadata needed
for downstream seam topology. That is a reported limitation, not a complete
specification of every current DXF export mode. It reinforces the decision not
to treat Seamly output as evidence of preserved construction/topology.

## Evidence and labels

- **Direct project documentation:** The Seamly2D repository identifies the
  application as GPLv3+, and its release page lists current Windows builds;
  the latest visible release is `2026.10.5.154`.
- **Project-forum confirmation:** In its `Import files` support topic, a
  participant asks whether DXF can be opened and a project community
  respondent confirms Seamly2D does not open DXF, only generates it from its
  own pattern drafting workflow. A separate 2025 support topic repeats the
  same answer. This establishes the product limitation reported by the
  project community, not a CAD conformance claim.
- **Open project issue:** Issue #1567, opened May 2026 and still open when
  checked, reports that SVG/DXF export currently merges vertices and edges
  into a single continuous path, making seam-edge topology harder to recover.
  It does not establish that every geometric contour is wrong.
- **Not established:** any independent import support, exact AAMA/ASTM
  edition/conformance, numeric layer semantics, piece/grading preservation,
  or a generation-two round trip. The old CLI man page's export-format list
  is historical and is not used as proof of current profile conformance.

## CLO status and decision

The user reports CLO is running. The latest supported desktop interaction
attempt is S510: the Import action was rejected as outside the target window,
and the single fresh-window activation failed with `no monitor found for
window`. No fixture was opened. This is a desktop-control failure, not a CLO
format result. S512 did not make another UI attempt, switch automation
backends, or touch the app.

Do not select Seamly2D as receiver or install it for G04. Continue only with an
exact receiver/build that can import the pinned source fixture, export it in a
documented profile, and reimport that generation with measured results. The
authorized CLO trial remains a candidate for practical testing, but the
previous helper failure left its AAMA path untested. User authorization does
not by itself establish vendor rights, exact profile conformance, or a passing
round trip.

## Gate disposition

V03 and EPIC-17 remain In Progress; V01/V02 remain Done. All V03 gates remain
unchanged: rights/local handling; exact industrial profile; source-scale
geometry, units, pieces/layers/marks; grading; negative-control behavior;
profile-specific generation-two round trip; and representative fixtures for
all seven recipes. Preserve the `0.001 cm` geometry gate, all-seven criterion,
legacy DXF behavior, protected export byte identities, and physical/factory
claim limits. No CAD fixture, install, project, production code, test, or
baseline was changed.

## Verification and timing

- Start board replay: `3159→3161`; exit replay: `3161→3163`.
- Exit preflight passed at revision 3163; validated command-layer replay
  advanced the canonical board to 3163. `npm run control-center:test` passed
  42/42; `git diff --check` passed. Documentation-only work; changed-code
  coverage and the full repository gate are not due.
- Approximate elapsed slice time from `2026-10-08 17:47:40 UTC` to closeout:
  source review 2m; synthesis and durable records/board 2m; focused
  verification 1m; external-agent waits 0m; maintainer-decision time 0m.

## Sources reviewed

1. Seamly2D project [repository and license](https://github.com/FashionFreedom/Seamly2D).
2. Seamly2D [official release page](https://github.com/FashionFreedom/Seamly2D/releases),
   including release `2026.10.5.154`.
3. Seamly Patterns community forum, [Import files](https://forum.seamly.io/t/import-files/8595),
   topic started January 2024.
4. Seamly Patterns community forum, [Importing dxf file error occurred parsing element](https://forum.seamly.io/t/importing-dxf-file-error-occurred-parsing-element/11965),
   topic started February 2025.
5. FashionFreedom/Seamly2D, open project issue
   [#1567: SVG/DXF export should preserve vertices/edges metadata](https://github.com/fashionfreedom/seamly2d/issues/1567),
   opened May 12, 2026.
